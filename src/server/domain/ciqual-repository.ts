import type {
  CiqualNutrientStatus,
  CiqualCategoryFilter,
  CiqualClassificationDTO,
} from '../../shared/types/ciqual.types.js'

export interface CiqualFoodRef {
  code: string
  name: string
}

export interface CiqualFoodSummary
  extends CiqualFoodRef, CiqualClassificationDTO {
  source: string
  version: string
  baseQuantity: number
  baseUnit: string
}

export interface CiqualNutrientRecord {
  key: string
  unit: string
  status: CiqualNutrientStatus
  raw: string
  /** Pour `less_than`, le seuil ; null pour trace et missing. */
  value: number | null
}

export interface CiqualFoodDetail extends CiqualFoodSummary {
  active: boolean
  attribution: string
  nutrients: CiqualNutrientRecord[]
}

/** Lecture seule du référentiel local ; aucun accès réseau. */
export interface CiqualRepository {
  /** Aliments de la publication courante (actifs) : code et libellé seulement. */
  listSearchableFoods(category?: CiqualCategoryFilter): Promise<CiqualFoodRef[]>
  /** Détails d'affichage pour des codes précis ; l'ordre n'est pas garanti. */
  findSummaries(
    codes: string[],
    category?: CiqualCategoryFilter,
  ): Promise<CiqualFoodSummary[]>
  /** null si le code est inconnu ; inclut les aliments devenus inactifs. */
  findByCode(code: string): Promise<CiqualFoodDetail | null>
}

export class CiqualReadError extends Error {
  constructor() {
    super('Unable to read the CIQUAL reference')
    this.name = 'CiqualReadError'
  }
}
