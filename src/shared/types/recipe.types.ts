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
  /** Matériel requis, lecture seule ; attribution via les routes dédiées. */
  equipment?: EquipmentDTO[]
  recipeTags?: TagDTO[]
  ingredientTags?: TagDTO[]
}

export type CreateRecipeDTO = Omit<
  RecipeDTO,
  'id' | 'equipment' | 'recipeTags' | 'ingredientTags' | 'ingredients'
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
