import type { EquipmentDTO } from '../../shared/types/equipment.types.js'
import { resolveIngredient } from './ingredient-identity.js'
import { Prisma, type PrismaClient } from '@prisma/client'
import {
  RecipeCatalogError,
  RecipeConflictError,
  RecipeAssociationError,
  RecipeReadError,
  RecipeWriteError,
  type RecipeDetail,
  type RecipeInput,
  type RecipeRepository,
} from '../domain/recipe-repository.js'
import type { TagRef } from '../domain/tag-repository.js'
import { activeTagsSelect, sortTags } from './prisma-tag-repository.js'

const activeEquipmentSelect = {
  where: { equipment: { active: true } },
  select: { equipment: { select: { id: true, key: true, label: true } } },
} as const
function sortEquipment(items: EquipmentDTO[]): EquipmentDTO[] {
  return [...items].sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : a.id - b.id,
  )
}
const summary = {
  id: true,
  title: true,
  description: true,
  servings: true,
  photoId: true,
  tags: activeTagsSelect,
  equipment: activeEquipmentSelect,
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
      ingredient: {
        select: {
          canonicalName: true,
          tags: activeTagsSelect,
          ciqualCode: true,
          ciqualFood: { select: { name: true } },
        },
      },
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
    canonicalName: ingredient.ciqualFood?.name ?? ingredient.canonicalName,
    ciqualCode: ingredient.ciqualCode,
    tags: sortTags(ingredient.tags.map(({ tag }) => tag)),
  }))
  const { tags, equipment, ...fields } = recipe
  return {
    ...fields,
    equipment: sortEquipment(equipment.map((link) => link.equipment)),
    recipeTags: sortTags(tags.map(({ tag }) => tag)),
    ingredients,
    ingredientTags: unionTags(ingredients),
  }
}

async function children(
  tx: Prisma.TransactionClient,
  input: RecipeInput,
  retained = new Set<string>(),
) {
  // Validate every new link in the same transaction as the recipe write.
  const validated = []
  for (const line of input.ingredients) {
    const code = line.ciqualCode ?? null
    let name = line.canonicalName
    if (code !== null) {
      const food = await tx.ciqualFood.findUnique({ where: { code } })
      if (!food) throw new RecipeAssociationError('INVALID_CIQUAL_CODE', code)
      if (!food.active && !retained.has(code))
        throw new RecipeAssociationError('INACTIVE_CIQUAL_CODE', code)
      name = food.name // The client cannot forge the official label.
    }
    validated.push({ ...line, canonicalName: name, ciqualCode: code })
  }
  const lines = []
  for (const [index, line] of validated.entries()) {
    const ingredientId = await resolveIngredient(
      tx,
      line.canonicalName,
      line.ciqualCode,
    )
    lines.push({
      position: index + 1,
      quantity: line.quantity,
      unit: line.unit,
      ingredientId,
    })
  }
  return {
    ingredients: { create: lines },
    steps: {
      create: input.steps.map((step, index) => ({
        position: index + 1,
        instruction: step.instruction,
      })),
    },
  }
}

/** Validate and write associations inside the recipe transaction. */
async function catalogLinks(
  tx: Prisma.TransactionClient,
  input: RecipeInput,
  recipeId?: number,
) {
  const tagIds =
    input.tagIds === undefined ? undefined : [...new Set(input.tagIds)]
  const equipmentIds =
    input.equipmentIds === undefined
      ? undefined
      : [...new Set(input.equipmentIds)]
  if (tagIds !== undefined) {
    const rows = await tx.recipeTag.findMany({ where: { id: { in: tagIds } } })
    const retained = new Set(
      recipeId === undefined
        ? []
        : (await tx.recipeTagLink.findMany({ where: { recipeId } })).map(
            (link) => link.tagId,
          ),
    )
    for (const id of tagIds) {
      const row = rows.find((item) => item.id === id)
      if (!row) throw new RecipeCatalogError('INVALID_RECIPE_TAG', id)
      if (!row.active && !retained.has(id))
        throw new RecipeCatalogError('INACTIVE_RECIPE_TAG', id)
    }
  }
  if (equipmentIds !== undefined) {
    const rows = await tx.equipment.findMany({
      where: { id: { in: equipmentIds } },
    })
    const retained = new Set(
      recipeId === undefined
        ? []
        : (await tx.recipeEquipment.findMany({ where: { recipeId } })).map(
            (link) => link.equipmentId,
          ),
    )
    for (const id of equipmentIds) {
      const row = rows.find((item) => item.id === id)
      if (!row) throw new RecipeCatalogError('INVALID_EQUIPMENT', id)
      if (!row.active && !retained.has(id))
        throw new RecipeCatalogError('INACTIVE_EQUIPMENT', id)
    }
  }
  if (recipeId !== undefined) {
    if (tagIds !== undefined)
      await tx.recipeTagLink.deleteMany({ where: { recipeId } })
    if (equipmentIds !== undefined)
      await tx.recipeEquipment.deleteMany({ where: { recipeId } })
  }
  return {
    ...(tagIds === undefined
      ? {}
      : { tags: { create: tagIds.map((tagId) => ({ tagId })) } }),
    ...(equipmentIds === undefined
      ? {}
      : {
          equipment: {
            create: equipmentIds.map((equipmentId) => ({ equipmentId })),
          },
        }),
  }
}

/** Never let Prisma details escape; only a title clash is a known outcome. */
function toWriteError(error: unknown): Error {
  if (
    error instanceof RecipeAssociationError ||
    error instanceof RecipeCatalogError
  )
    return error
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes('title')
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
        return recipes.map(({ ingredients, tags, equipment, ...recipe }) => ({
          equipment: sortEquipment(equipment.map((link) => link.equipment)),
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
        return await client.$transaction(async (tx) => {
          const nested = await children(tx, input)
          const catalogs = await catalogLinks(tx, input)
          const { id } = await tx.recipe.create({
            data: {
              title: input.title,
              description: input.description,
              servings: input.servings,
              ...nested,
              ...catalogs,
            },
            select: { id: true },
          })
          const created = await readDetail(tx, id)
          if (!created) throw new RecipeWriteError()
          return created
        })
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
            select: {
              id: true,
              ingredients: {
                select: { ingredient: { select: { ciqualCode: true } } },
              },
            },
          })
          if (!exists) return null
          const retained = new Set(
            exists.ingredients.flatMap((l) =>
              l.ingredient.ciqualCode ? [l.ingredient.ciqualCode] : [],
            ),
          )
          const nested = await children(tx, input, retained)
          const catalogs = await catalogLinks(tx, input, id)
          await tx.recipeIngredient.deleteMany({ where: { recipeId: id } })
          await tx.recipeStep.deleteMany({ where: { recipeId: id } })
          await tx.recipe.update({
            where: { id },
            data: {
              title: input.title,
              description: input.description,
              servings: input.servings,
              ...nested,
              ...catalogs,
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
    async getPhotoId(id) {
      assertId(id)
      try {
        const row = await client.recipe.findUnique({
          where: { id },
          select: { photoId: true },
        })
        return row?.photoId ?? null
      } catch {
        throw new RecipeReadError()
      }
    },

    async setPhoto(id, photoId) {
      assertId(id)
      try {
        return await client.$transaction(async (tx) => {
          const current = await tx.recipe.findUnique({
            where: { id },
            select: { photoId: true },
          })
          if (!current) return undefined
          await tx.recipe.update({ where: { id }, data: { photoId } })
          return current.photoId
        })
      } catch {
        throw new RecipeWriteError()
      }
    },
  }
}
