import type { EquipmentSummaryDTO } from '../../shared/types/equipment.types.js'
export type AssignResult =
  | { kind: 'created' }
  | { kind: 'exists' }
  | { kind: 'recipe_not_found' }
  | { kind: 'equipment_not_found' }
  | { kind: 'equipment_inactive' }

export type RemoveResult =
  { kind: 'removed' } | { kind: 'absent' } | { kind: 'recipe_not_found' }

/**
 * Les lectures n'exposent que les équipements actifs, triés par clé croissante.
 * Aucune opération ne supprime un ingrédient ou une recette.
 */
export interface RecipeEquipmentRepository {
  /** Équipements actifs avec leurs compteurs de recettes, par clé croissante. */
  listEquipment(): Promise<EquipmentSummaryDTO[]>
  /** Idempotent : une association existante n'est ni dupliquée ni modifiée. */
  assign(recipeId: number, equipmentId: number): Promise<AssignResult>
  /** Retire uniquement l'association ; autorisé même pour un équipement désactivé. */
  remove(recipeId: number, equipmentId: number): Promise<RemoveResult>
}

export class RecipeEquipmentReadError extends Error {
  constructor() {
    super('Unable to read recipe equipment')
    this.name = 'RecipeEquipmentReadError'
  }
}

export class RecipeEquipmentWriteError extends Error {
  constructor() {
    super('Unable to write recipe equipment')
    this.name = 'RecipeEquipmentWriteError'
  }
}
