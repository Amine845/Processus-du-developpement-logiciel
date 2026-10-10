import { recipeRepository } from '../infrastructure/recipe.repository'
import type { RecipeDTO } from '../../shared/types/recipe.types'

export const recipeService = {
    async getAllRecipes(): Promise<RecipeDTO[]> {
        const recipes = await recipeRepository.findAll()

        return recipes.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            servings: r.servings,
            steps: r.steps.map((s) => ({
                id: s.id,
                instruction: s.instruction,
                position: s.position,
            })),
            ingredients: r.ingredients.map((ri) => ({
                id: ri.id,
                canonicalName: ri.ingredient.canonicalName,
                quantity: ri.quantity,
                unit: ri.unit,
                position: ri.position,
            })),
        }))
    },

    async getRecipeById(id: number): Promise<RecipeDTO | null> {
        const r = await recipeRepository.findById(id)
        if (!r) return null

        return {
            id: r.id,
            title: r.title,
            description: r.description,
            servings: r.servings,
            steps: r.steps.map((s) => ({
                id: s.id,
                instruction: s.instruction,
                position: s.position,
            })),
            ingredients: r.ingredients.map((ri) => ({
                id: ri.id,
                canonicalName: ri.ingredient.canonicalName,
                quantity: ri.quantity,
                unit: ri.unit,
                position: ri.position,
            })),
        }
    },

    async deleteRecipe(id: number): Promise<void> {
        await recipeRepository.delete(id)
    },
}