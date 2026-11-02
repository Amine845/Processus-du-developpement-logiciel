import { Prisma } from '@prisma/client'
import { recipeRepository } from '../infrastructure/recipe.repository'
import type { RecipeDTO } from '../../shared/types/recipe.types'

type RecipeWithRelations = Prisma.RecipeGetPayload<{
  include: {
    steps: true
    ingredients: {
      include: {
        ingredient: true
      }
    }
  }
}>

function toRecipeDTO(recipe: RecipeWithRelations): RecipeDTO {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    steps: recipe.steps.map((step) => ({
      id: step.id,
      instruction: step.instruction,
      position: step.position,
    })),
    ingredients: recipe.ingredients.map((ri) => ({
      id: ri.id,
      canonicalName: ri.ingredient.canonicalName,
      quantity: ri.quantity,
      unit: ri.unit,
      position: ri.position,
    })),
  }
}

export const recipeService = {
  async getAllRecipes(): Promise<RecipeDTO[]> {
    const recipes = (await recipeRepository.findAll()) as RecipeWithRelations[]
    return recipes.map(toRecipeDTO)
  },

  async getRecipeById(id: number): Promise<RecipeDTO | null> {
    const recipe = (await recipeRepository.findById(
      id,
    )) as RecipeWithRelations | null
    if (!recipe) return null

    return toRecipeDTO(recipe)
  },

  async deleteRecipe(id: number): Promise<void> {
    await recipeRepository.delete(id)
  },
}
