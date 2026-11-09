import { Prisma, type PrismaClient } from '@prisma/client'
import {
  RecipeConflictError,
  RecipeReadError,
  RecipeWriteError,
  type RecipeDetail,
  type RecipeInput,
  type RecipeRepository,
} from '../domain/recipe-repository.js'
import type { TagRef } from '../domain/tag-repository.js'
import { activeTagsSelect, sortTags } from './prisma-tag-repository.js'

const summary = {
  id: true,
  title: true,
  description: true,
  servings: true,
  tags: activeTagsSelect,
} as const

const listSelect = {
  ...summary,
  ingredients: {
    select: { ingredient: { select: { tags: activeTagsSelect } } },
  },
} as const

const detailSelect = {
  ...summary,
  ingredients: {
    orderBy: { position: 'asc' },
    select: {
      ingredientId: true,
      quantity: true,
      unit: true,
      position: true,
      ingredient: { select: { canonicalName: true, tags: activeTagsSelect } },
    },
  },
  steps: {
    orderBy: { position: 'asc' },
    select: { position: true, instruction: true },
  },
} as const

type Db = Pick<PrismaClient, 'recipe'>

function assertId(id: number) {
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new RangeError('Recipe id must be a positive 32-bit integer')
  }
}

/** Union dédupliquée des tags des lignes, triée par clé. */
function unionTags(lines: { tags: TagRef[] }[]): TagRef[] {
  const byId = new Map<number, TagRef>()
  for (const line of lines) for (const tag of line.tags) byId.set(tag.id, tag)
  return sortTags([...byId.values()])
}

async function readDetail(db: Db, id: number): Promise<RecipeDetail | null> {
  const recipe = await db.recipe.findUnique({
    where: { id },
    select: detailSelect,
  })
  if (!recipe) return null
  const ingredients = recipe.ingredients.map(({ ingredient, ...line }) => ({
    ...line,
    canonicalName: ingredient.canonicalName,
    tags: sortTags(ingredient.tags.map(({ tag }) => tag)),
  }))
  const { tags, ...fields } = recipe
  return {
    ...fields,
    recipeTags: sortTags(tags.map(({ tag }) => tag)),
    ingredients,
    ingredientTags: unionTags(ingredients),
  }
}

function children(input: RecipeInput) {
  return {
    ingredients: {
      create: input.ingredients.map((line, index) => ({
        position: index + 1,
        quantity: line.quantity,
        unit: line.unit,
        ingredient: {
          connectOrCreate: {
            where: { canonicalName: line.canonicalName },
            create: { canonicalName: line.canonicalName },
          },
        },
      })),
    },
    steps: {
      create: input.steps.map((step, index) => ({
        position: index + 1,
        instruction: step.instruction,
      })),
    },
  }
}

/** Never let Prisma details escape; only a title clash is a known outcome. */
function toWriteError(error: unknown): Error {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return new RecipeConflictError()
  }
  return new RecipeWriteError()
}

export function createPrismaRecipeRepository(
  client: PrismaClient,
): RecipeRepository {
  return {
    async findAll() {
      try {
        const recipes = await client.recipe.findMany({
          select: listSelect,
          orderBy: { id: 'asc' },
        })
        return recipes.map(({ ingredients, tags, ...recipe }) => ({
          recipeTags: sortTags(tags.map(({ tag }) => tag)),
          ...recipe,
          ingredientTags: unionTags(
            ingredients.map(({ ingredient }) => ({
              tags: ingredient.tags.map(({ tag }) => tag),
            })),
          ),
        }))
      } catch {
        throw new RecipeReadError()
      }
    },

    async findById(id) {
      assertId(id)
      try {
        return await readDetail(client, id)
      } catch {
        throw new RecipeReadError()
      }
    },

    async create(input) {
      try {
        // A nested write is atomic: recipe, lines and steps all exist or none do.
        const { id } = await client.recipe.create({
          data: {
            title: input.title,
            description: input.description,
            servings: input.servings,
            ...children(input),
          },
          select: { id: true },
        })
        const created = await readDetail(client, id)
        if (!created) throw new RecipeWriteError()
        return created
      } catch (error) {
        throw toWriteError(error)
      }
    },

    async update(id, input) {
      assertId(id)
      try {
        return await client.$transaction(async (tx) => {
          const exists = await tx.recipe.findUnique({
            where: { id },
            select: { id: true },
          })
          if (!exists) return null
          await tx.recipeIngredient.deleteMany({ where: { recipeId: id } })
          await tx.recipeStep.deleteMany({ where: { recipeId: id } })
          await tx.recipe.update({
            where: { id },
            data: {
              title: input.title,
              description: input.description,
              servings: input.servings,
              ...children(input),
            },
          })
          return readDetail(tx, id)
        })
      } catch (error) {
        throw toWriteError(error)
      }
    },

    async deleteById(id) {
      assertId(id)
      try {
        const { count } = await client.recipe.deleteMany({ where: { id } })
        return count > 0
      } catch {
        throw new RecipeWriteError()
      }
    },
  }
}
