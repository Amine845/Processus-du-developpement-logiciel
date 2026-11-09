import type { TagDTO } from './tag.types'

export type RecipeUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece'

export interface IngredientDTO {
  id?: number
  canonicalName: string
  quantity: number
  unit: RecipeUnit | string
  position: number
  /** Lecture seule : ignoré à l'écriture (les tags s'attribuent via /api/ingredients). */
  tags?: TagDTO[]
}

export interface StepDTO {
  id?: number
  instruction: string
  position: number
}

export interface RecipeDTO {
  id: number
  title: string
  description: string | null
  servings: number
  ingredients: IngredientDTO[]
  steps: StepDTO[]
  /**
   * Lecture seule : union des tags des ingrédients de la recette, triée par clé.
   * Ce ne sont pas des tags de recette (« Gourmand », « Rapide »).
   */
  ingredientTags?: TagDTO[]
}

export type CreateRecipeDTO = Omit<
  RecipeDTO,
  'id' | 'ingredientTags' | 'ingredients'
> & { ingredients: Omit<IngredientDTO, 'tags'>[] }
export type UpdateRecipeDTO = Partial<CreateRecipeDTO>
