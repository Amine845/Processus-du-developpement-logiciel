/** Contrat de l'API de recherche CIQUAL, partagé par le serveur et le client. */

/** Constantes du contrat : source unique pour le serveur, le client et la doc. */
export const CIQUAL_SEARCH_MIN_LENGTH = 2
export const CIQUAL_SEARCH_MAX_LENGTH = 100
export const CIQUAL_SEARCH_DEFAULT_LIMIT = 10
export const CIQUAL_SEARCH_MAX_LIMIT = 50

/**
 * - exact      : valeur mesurée ; `value` est renseignée (0 est un vrai zéro).
 * - less_than  : « < seuil » ; seule `upperBoundExclusive` est renseignée.
 * - trace      : présent mais non quantifié ; aucune valeur.
 * - missing    : information absente ; aucune valeur (jamais 0).
 */
export type CiqualNutrientStatus = 'exact' | 'less_than' | 'trace' | 'missing'

export interface CiqualFoodSummaryDTO {
  /** Code CIQUAL officiel (texte) ; identité stable de l'aliment dans le référentiel local. */
  code: string
  /** Libellé officiel, non normalisé. */
  name: string
  source: string
  version: string
  baseQuantity: number
  baseUnit: string
}

export interface CiqualSearchResponseDTO {
  query: string
  minLength: number
  limit: number
  /** true si d'autres aliments correspondent au-delà de `limit`. */
  truncated: boolean
  results: CiqualFoodSummaryDTO[]
}

export interface CiqualNutrientDTO {
  /** Identifiant ORIGCPCD du constituant. */
  key: string
  /** Libellé officiel, null si le constituant est inconnu de l'API. */
  label: string | null
  unit: string
  status: CiqualNutrientStatus
  /** Texte source tel qu'importé (« 1,25 », « traces », « < 0,5 », « - »). */
  raw: string
  value: number | null
  upperBoundExclusive: number | null
}

export interface CiqualFoodDetailDTO extends CiqualFoodSummaryDTO {
  /** false si l'aliment n'est plus dans la publication courante. */
  active: boolean
  attribution: string
  nutrients: CiqualNutrientDTO[]
}

export interface ApiErrorDTO {
  error: string
  [detail: string]: unknown
}

/**
 * Identité d'un ingrédient choisi dans le formulaire.
 * `manual` : aucun code ni nutriment n'est associé ni inventé.
 */
export type IngredientSelection =
  | {
      mode: 'ciqual'
      code: string
      name: string
      source: string
      version: string
    }
  | { mode: 'manual'; name: string }
