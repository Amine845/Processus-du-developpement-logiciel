import { TAG_LABEL_MAX_LENGTH } from '../../shared/types/tag.types.js'
import type {
  IngredientSummary,
  IngredientTagRepository,
} from '../domain/tag-repository.js'
import { normalizeText } from './ciqual.js'

export class TagValidationError extends Error {
  constructor(readonly issues: string[]) {
    super('Invalid tag')
    this.name = 'TagValidationError'
  }
}

const LABEL_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '’-]*$/u
const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Politique de normalisation d'un tag :
 * - libellé : espaces de bord retirés, espaces internes réduits, casse et accents conservés,
 *   1 à 40 caractères, lettres, chiffres, espace, apostrophe et tiret seulement ;
 * - clé : le libellé sans accents ni ligatures, en minuscules, mots reliés par « - »
 *   (« Œuf » donne « oeuf », « Fruit à coque » donne « fruit-a-coque ») ;
 * - deux libellés de même clé désignent le même tag.
 * Le schéma SQL applique les mêmes bornes (CHECK) en seconde défense.
 */
export function parseTagLabel(raw: unknown): { key: string; label: string } {
  const issues: string[] = []
  const label = typeof raw === 'string' ? raw.replace(/\s+/gu, ' ').trim() : ''
  if (label.length < 1 || [...label].length > TAG_LABEL_MAX_LENGTH) {
    issues.push(`label: 1 to ${TAG_LABEL_MAX_LENGTH} characters required`)
  } else if (!LABEL_PATTERN.test(label)) {
    issues.push(
      'label: letters, digits, spaces, hyphens and apostrophes only, starting with a letter or digit',
    )
  }
  const key = normalizeText(label).replace(/ /g, '-')
  if (issues.length === 0) {
    if (!KEY_PATTERN.test(key)) {
      issues.push('label: must only use Latin letters and digits')
    } else if (key.length > TAG_LABEL_MAX_LENGTH) {
      issues.push(
        `label: normalized key exceeds ${TAG_LABEL_MAX_LENGTH} characters`,
      )
    }
  }
  if (issues.length > 0) throw new TagValidationError(issues)
  return { key, label }
}

/**
 * Vocabulaire initial : descriptif et volontairement petit.
 * Ce ne sont ni des allergènes, ni des régimes (« sans gluten », « végétarien »),
 * ni des tags de recette (« Gourmand », « Rapide »), ni la classification CIQUAL.
 */
export const TAG_VOCABULARY: readonly string[] = [
  'Céréale',
  'Légume',
  'Fruit',
  'Légumineuse',
  'Viande',
  'Poisson et fruit de mer',
  'Produit laitier',
  'Œuf',
  'Matière grasse',
  'Produit sucré',
  'Épice et aromate',
]

/** Associations de démonstration, appliquées seulement aux ingrédients déjà présents. */
export const DEMO_INGREDIENT_TAGS: Readonly<Record<string, readonly string[]>> =
  {
    'Chocolat noir': ['Produit sucré'],
    Œufs: ['Œuf'],
    'Farine de blé': ['Céréale'],
    Beurre: ['Produit laitier', 'Matière grasse'],
    Sucre: ['Produit sucré'],
    'Lait demi-écrémé': ['Produit laitier'],
  }

const MAX_ID = 2147483647
const isId = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= MAX_ID

export function parseTagId(value: unknown): number {
  if (!isId(value)) {
    throw new TagValidationError(['tagId: positive integer required'])
  }
  return value
}

export function parseAssignBody(body: unknown): number {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new TagValidationError(['body must be a JSON object'])
  }
  return parseTagId((body as Record<string, unknown>).tagId)
}

export type AssignOutcome =
  | { kind: 'created' | 'exists'; ingredient: IngredientSummary }
  | { kind: 'ingredient_not_found' | 'tag_not_found' | 'tag_inactive' }

export function createIngredientTags(repository: IngredientTagRepository) {
  return {
    listTags: () => repository.listTags(),
    listIngredients: () => repository.listIngredients(),
    findIngredient: (id: number) => repository.findIngredient(id),

    async assign(ingredientId: number, body: unknown): Promise<AssignOutcome> {
      const tagId = parseAssignBody(body)
      const result = await repository.assign(ingredientId, tagId)
      if (result.kind !== 'created' && result.kind !== 'exists') return result
      const ingredient = await repository.findIngredient(ingredientId)
      // L'ingrédient a pu disparaître entre l'écriture et la relecture.
      return ingredient
        ? { kind: result.kind, ingredient }
        : { kind: 'ingredient_not_found' }
    },

    remove: (ingredientId: number, tagId: number) =>
      repository.remove(ingredientId, tagId),
  }
}
