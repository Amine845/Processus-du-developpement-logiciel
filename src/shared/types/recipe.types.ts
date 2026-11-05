export type RecipeUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece'

export interface IngredientDTO {
  ingredientId: number
  ciqualCode: string | null
  canonicalName: string
  quantity: number
  unit: RecipeUnit | string
  position: number
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
}

export type CreateRecipeDTO = RecipeInputDTO
/** PUT replaces the complete recipe. */
export type UpdateRecipeDTO = RecipeInputDTO

/** Write contract: array order determines persisted positions; IDs are never CIQUAL codes. */
export interface RecipeInputDTO {
  title: string
  description?: string | null
  servings: number
  ingredients: {
    canonicalName: string
    ciqualCode?: string | null
    quantity: number
    unit: RecipeUnit
  }[]
  steps: { instruction: string }[]
}
export const RECIPE_UNITS: readonly RecipeUnit[] = [
  'g',
  'kg',
  'ml',
  'l',
  'piece',
]
