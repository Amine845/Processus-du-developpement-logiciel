export type RecipeUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece'

export interface RecipeSummaryDTO {
  id: number
  title: string
  description: string | null
  servings: number
}

export interface RecipeDTO extends RecipeSummaryDTO {
  ingredients: {
    ingredientId: number
    canonicalName: string
    quantity: number
    unit: string
    position: number
  }[]
  steps: { position: number; instruction: string }[]
}

/** Corps de POST et PUT. Les positions sont déduites de l'ordre des tableaux. */
export interface RecipeInputDTO {
  title: string
  description: string | null
  servings: number
  ingredients: { canonicalName: string; quantity: number; unit: string }[]
  steps: { instruction: string }[]
}
