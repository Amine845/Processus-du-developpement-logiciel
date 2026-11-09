import { parseTagLabel, TagValidationError } from './ingredient-tags.js'
export class EquipmentValidationError extends Error {
  constructor(readonly issues: string[]) {
    super('Invalid equipment')
    this.name = 'EquipmentValidationError'
  }
}
/** Même politique de libellé/clé que les catalogues de tags (40 caractères). */
export function parseEquipmentLabel(raw: unknown): {
  key: string
  label: string
} {
  try {
    return parseTagLabel(raw)
  } catch (error) {
    if (error instanceof TagValidationError)
      throw new EquipmentValidationError(error.issues)
    throw error
  }
}
export function parseEquipmentId(raw: unknown): number {
  if (
    typeof raw !== 'number' ||
    !Number.isInteger(raw) ||
    raw < 1 ||
    raw > 2147483647
  )
    throw new EquipmentValidationError([
      'equipmentId: positive integer required',
    ])
  return raw
}
export function parseAssignEquipmentBody(body: unknown): number {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    throw new EquipmentValidationError(['body must be a JSON object'])
  return parseEquipmentId((body as Record<string, unknown>).equipmentId)
}
export const EQUIPMENT_VOCABULARY: readonly string[] = [
  'Four',
  'Plaque de cuisson',
  'Micro-ondes',
  'Air Fryer',
  'Casserole',
  'Poêle',
  'Mixeur',
  'Fouet',
  'Saladier',
  'Balance de cuisine',
  'Couteau',
  'Planche à découper',
]
export const DEMO_RECIPE_EQUIPMENT: Readonly<
  Record<string, readonly string[]>
> = {}
