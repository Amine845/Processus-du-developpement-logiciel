import type { PrismaClient } from '@prisma/client'
import {
  TagReadError,
  TagWriteError,
  type IngredientSummary,
  type IngredientTagRepository,
  type TagRef,
} from '../domain/tag-repository.js'

type Db = Pick<PrismaClient, 'tag' | 'ingredient' | 'ingredientTag' | 'recipe'>

/** Seuls les tags actifs sont exposés ; une association à un tag désactivé reste en base mais invisible. */
export const activeTagsSelect = {
  where: { tag: { active: true } },
  select: { tag: { select: { id: true, key: true, label: true } } },
} as const

const ingredientSelect = {
  id: true,
  canonicalName: true,
  ciqualCode: true,
  tags: activeTagsSelect,
} as const

/** Tri par clé (ASCII normalisée) : ordre stable, indépendant de la locale du système. */
export function sortTags(tags: TagRef[]): TagRef[] {
  return [...tags].sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : a.id - b.id,
  )
}

function toIngredient(row: {
  id: number
  canonicalName: string
  ciqualCode: string | null
  tags: { tag: TagRef }[]
}): IngredientSummary {
  return {
    id: row.id,
    canonicalName: row.canonicalName,
    ciqualCode: row.ciqualCode,
    tags: sortTags(row.tags.map(({ tag }) => tag)),
  }
}

export function createPrismaTagRepository(client: Db): IngredientTagRepository {
  return {
    async listTags() {
      try {
        const tags = await client.tag.findMany({
          where: { active: true },
          orderBy: { key: 'asc' },
          select: {
            id: true,
            key: true,
            label: true,
            _count: { select: { ingredients: true } },
          },
        })
        return await Promise.all(
          tags.map(async ({ _count, ...tag }) => ({
            ...tag,
            ingredientCount: _count.ingredients,
            recipeCount: await client.recipe.count({
              where: {
                ingredients: {
                  some: {
                    ingredient: { tags: { some: { tagId: tag.id } } },
                  },
                },
              },
            }),
          })),
        )
      } catch {
        throw new TagReadError()
      }
    },

    async listIngredients() {
      try {
        const rows = await client.ingredient.findMany({
          orderBy: { id: 'asc' },
          select: ingredientSelect,
        })
        return rows.map(toIngredient)
      } catch {
        throw new TagReadError()
      }
    },

    async findIngredient(id) {
      try {
        const row = await client.ingredient.findUnique({
          where: { id },
          select: ingredientSelect,
        })
        return row ? toIngredient(row) : null
      } catch {
        throw new TagReadError()
      }
    },

    async assign(ingredientId, tagId) {
      try {
        const [ingredient, tag] = await Promise.all([
          client.ingredient.findUnique({
            where: { id: ingredientId },
            select: { id: true },
          }),
          client.tag.findUnique({
            where: { id: tagId },
            select: { active: true },
          }),
        ])
        if (!ingredient) return { kind: 'ingredient_not_found' }
        if (!tag) return { kind: 'tag_not_found' }
        if (!tag.active) return { kind: 'tag_inactive' }
        const where = { ingredientId_tagId: { ingredientId, tagId } }
        const existing = await client.ingredientTag.findUnique({
          where,
          select: { tagId: true },
        })
        if (existing) return { kind: 'exists' }
        try {
          await client.ingredientTag.create({ data: { ingredientId, tagId } })
        } catch (error) {
          // Deux requêtes simultanées : la clé primaire a tranché, le résultat est le même.
          const stillMissing = !(await client.ingredientTag.findUnique({
            where,
            select: { tagId: true },
          }))
          if (stillMissing) throw error
          return { kind: 'exists' }
        }
        return { kind: 'created' }
      } catch {
        throw new TagWriteError()
      }
    },

    async remove(ingredientId, tagId) {
      try {
        const { count } = await client.ingredientTag.deleteMany({
          where: { ingredientId, tagId },
        })
        if (count > 0) return { kind: 'removed' }
        const ingredient = await client.ingredient.findUnique({
          where: { id: ingredientId },
          select: { id: true },
        })
        return { kind: ingredient ? 'absent' : 'ingredient_not_found' }
      } catch {
        throw new TagWriteError()
      }
    },
  }
}
