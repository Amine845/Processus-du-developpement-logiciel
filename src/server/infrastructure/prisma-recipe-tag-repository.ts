import type { PrismaClient } from '@prisma/client'
import {
  RecipeTagReadError,
  RecipeTagWriteError,
  type RecipeTagRepository,
} from '../domain/recipe-tag-repository.js'
type Db = Pick<PrismaClient, 'recipeTag' | 'recipeTagLink' | 'recipe'>
export function createPrismaRecipeTagRepository(
  client: Db,
): RecipeTagRepository {
  return {
    async listTags() {
      try {
        const tags = await client.recipeTag.findMany({
          where: { active: true },
          orderBy: { key: 'asc' },
          select: {
            id: true,
            key: true,
            label: true,
            _count: { select: { recipes: true } },
          },
        })
        return tags.map(({ _count, ...tag }) => ({
          ...tag,
          recipeCount: _count.recipes,
        }))
      } catch {
        throw new RecipeTagReadError()
      }
    },

    async assign(recipeId, tagId) {
      try {
        const [recipe, tag] = await Promise.all([
          client.recipe.findUnique({
            where: { id: recipeId },
            select: { id: true },
          }),
          client.recipeTag.findUnique({
            where: { id: tagId },
            select: { active: true },
          }),
        ])
        if (!recipe) return { kind: 'recipe_not_found' }
        if (!tag) return { kind: 'tag_not_found' }
        if (!tag.active) return { kind: 'tag_inactive' }
        const where = { recipeId_tagId: { recipeId, tagId } }
        const existing = await client.recipeTagLink.findUnique({
          where,
          select: { tagId: true },
        })
        if (existing) return { kind: 'exists' }
        try {
          await client.recipeTagLink.create({ data: { recipeId, tagId } })
        } catch (error) {
          // Deux requêtes simultanées : la clé primaire a tranché, le résultat est le même.
          const stillMissing = !(await client.recipeTagLink.findUnique({
            where,
            select: { tagId: true },
          }))
          if (stillMissing) throw error
          return { kind: 'exists' }
        }
        return { kind: 'created' }
      } catch {
        throw new RecipeTagWriteError()
      }
    },

    async remove(recipeId, tagId) {
      try {
        const { count } = await client.recipeTagLink.deleteMany({
          where: { recipeId, tagId },
        })
        if (count > 0) return { kind: 'removed' }
        const recipe = await client.recipe.findUnique({
          where: { id: recipeId },
          select: { id: true },
        })
        return { kind: recipe ? 'absent' : 'recipe_not_found' }
      } catch {
        throw new RecipeTagWriteError()
      }
    },
  }
}
