import { describe, expect, it } from 'vitest'
import {
  EquipmentValidationError,
  EQUIPMENT_VOCABULARY,
  parseEquipmentLabel,
  parseAssignEquipmentBody,
  parseEquipmentId,
} from '../../src/server/application/recipe-equipment.js'
describe('equipment validation', () => {
  it('normalizes labels and keeps a unique valid vocabulary', () => {
    expect(parseEquipmentLabel('  Poêle  ')).toEqual({
      key: 'poele',
      label: 'Poêle',
    })
    const keys = EQUIPMENT_VOCABULARY.map(
      (label) => parseEquipmentLabel(label).key,
    )
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('rejects malformed labels, bodies and IDs with equipment errors', () => {
    for (const label of ['', null, 4, 'x'.repeat(41), 'a/b'])
      expect(() => parseEquipmentLabel(label)).toThrow(EquipmentValidationError)
    for (const body of [
      null,
      [],
      {},
      { equipmentId: '1' },
      { equipmentId: 0 },
      { equipmentId: 2147483648 },
    ])
      expect(() => parseAssignEquipmentBody(body)).toThrow(
        EquipmentValidationError,
      )
    expect(parseAssignEquipmentBody({ equipmentId: 1 })).toBe(1)
    expect(parseEquipmentId(2147483647)).toBe(2147483647)
  })
})
