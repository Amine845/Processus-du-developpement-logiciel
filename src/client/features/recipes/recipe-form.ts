import type { IngredientSelection } from '../../../shared/types/ciqual.types'
import {
  RECIPE_UNITS,
  type RecipeInputDTO,
  type RecipeUnit,
} from '../../../shared/types/recipe.types'

export interface IngredientDraft {
  id: number
  selection: IngredientSelection | null
  quantity: string
  unit: RecipeUnit
}
export interface RecipeDraft {
  title: string
  description: string
  servings: string
  ingredients: IngredientDraft[]
  steps: { id: number; instruction: string }[]
}
export function recipePayload(draft: RecipeDraft): RecipeInputDTO {
  const title = draft.title.trim()
  const servings = Number(draft.servings)
  if (!title || title.length > 200)
    throw new Error('Indiquez un titre de 1 à 200 caractères.')
  if (!Number.isInteger(servings) || servings < 1 || servings > 1000)
    throw new Error('Indiquez un nombre de portions entier entre 1 et 1000.')
  if (!draft.ingredients.length || draft.ingredients.length > 100)
    throw new Error('Ajoutez entre 1 et 100 ingrédients.')
  const ingredients = draft.ingredients.map((line, i) => {
    if (!line.selection)
      throw new Error(
        `Ingrédient ${i + 1} : sélectionnez un aliment CIQUAL ou confirmez le mode manuel.`,
      )
    const quantity = Number(line.quantity)
    if (!line.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0)
      throw new Error(
        `Ingrédient ${i + 1} : indiquez une quantité supérieure à zéro.`,
      )
    if (!RECIPE_UNITS.includes(line.unit))
      throw new Error(`Ingrédient ${i + 1} : unité invalide.`)
    return {
      canonicalName: line.selection.name,
      ciqualCode: line.selection.mode === 'ciqual' ? line.selection.code : null,
      quantity,
      unit: line.unit,
    }
  })
  if (
    !draft.steps.length ||
    draft.steps.length > 200 ||
    draft.steps.some((s) => !s.instruction.trim())
  )
    throw new Error(
      'Ajoutez au moins une étape et renseignez chaque instruction.',
    )
  return {
    title,
    description: draft.description.trim() || null,
    servings,
    ingredients,
    steps: draft.steps.map((s) => ({ instruction: s.instruction.trim() })),
  }
}
