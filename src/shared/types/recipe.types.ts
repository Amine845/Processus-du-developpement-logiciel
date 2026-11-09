import type { EquipmentDTO } from './equipment.types'
import type { TagDTO } from './tag.types'

export type RecipeUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece'

export interface IngredientDTO {
  ingredientId: number
  ciqualCode: string | null
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

export interface RecipeSummaryDTO {
  id: number
  title: string
  description: string | null
  servings: number
  photoId: string | null
  equipment?: EquipmentDTO[]
  recipeTags?: TagDTO[]
  ingredientTags?: TagDTO[]
}

export interface RecipeDTO extends RecipeSummaryDTO {
  ingredients: IngredientDTO[]
  steps: StepDTO[]
}

export type CreateRecipeDTO = Omit<
  RecipeDTO,
  | 'id'
  | 'photoId'
  | 'equipment'
  | 'recipeTags'
  | 'ingredientTags'
  | 'ingredients'
> & { ingredients: Omit<IngredientDTO, 'tags'>[] }
export type UpdateRecipeDTO = Partial<CreateRecipeDTO>

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
