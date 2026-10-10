export type RecipeUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece'

export interface IngredientDTO {
  id?: number
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

export type CreateRecipeDTO = Omit<RecipeDTO, 'id'>
export type UpdateRecipeDTO = Partial<CreateRecipeDTO>
