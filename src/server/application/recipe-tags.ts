// Validation commune, vocabulaires et associations indépendants.
export { TagValidationError, parseTagLabel } from './ingredient-tags.js'
export const RECIPE_TAG_VOCABULARY: readonly string[] = [
  'Gourmand',
  'Rapide',
  'Facile',
  'Économique',
  'Festif',
]
export const DEMO_RECIPE_TAGS: Readonly<Record<string, readonly string[]>> = {}
