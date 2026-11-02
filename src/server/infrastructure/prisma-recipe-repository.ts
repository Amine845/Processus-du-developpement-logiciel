import type { PrismaClient } from '@prisma/client'
import {
  RecipeReadError,
  type RecipeRepository,
} from '../domain/recipe-repository.js'

const summary = {
  id: true,
  title: true,
  description: true,
  servings: true,
} as const

export function createPrismaRecipeRepository(
  client: PrismaClient,
): RecipeRepository {
  return {
    async findAll() {
      try {
        return await client.recipe.findMany({
          select: summary,
          orderBy: { id: 'asc' },
        })
      } catch {
        // Do not let Prisma errors (query, path, connection details) escape.
        throw new RecipeReadError()
      }
    },
    async findById(id) {
      if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        throw new RangeError('Recipe id must be a positive 32-bit integer')
      }
      try {
        const recipe = await client.recipe.findUnique({
          where: { id },
          select: {
            ...summary,
            ingredients: {
              orderBy: { position: 'asc' },
              select: {
                ingredientId: true,
                quantity: true,
                unit: true,
                position: true,
                ingredient: { select: { canonicalName: true } },
              },
            },
            steps: {
              orderBy: { position: 'asc' },
              select: { position: true, instruction: true },
            },
          },
        })
        if (!recipe) return null
        return {
          ...recipe,
          ingredients: recipe.ingredients.map(({ ingredient, ...line }) => ({
            ...line,
            canonicalName: ingredient.canonicalName,
          })),
        }
      } catch {
        throw new RecipeReadError()
      }
    },
  }
}
