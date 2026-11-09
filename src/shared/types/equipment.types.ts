/** Catalogue contrôlé du matériel requis pour réaliser une recette. */
export interface EquipmentDTO {
  id: number
  key: string
  label: string
}
export interface EquipmentSummaryDTO extends EquipmentDTO {
  recipeCount: number
}
export interface AssignEquipmentRequestDTO {
  equipmentId: number
}
