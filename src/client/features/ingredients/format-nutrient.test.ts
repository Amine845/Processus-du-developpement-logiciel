import { describe, expect, it } from 'vitest'
import type { CiqualNutrientDTO } from '../../../shared/types/ciqual.types'
import { formatNutrient } from './format-nutrient'

const base: CiqualNutrientDTO = {
  key: '1',
  label: null,
  unit: 'g',
  status: 'exact',
  raw: '',
  value: null,
  upperBoundExclusive: null,
}
const text = (n: Partial<CiqualNutrientDTO>) =>
  formatNutrient({ ...base, ...n }).replace(/\u202f|\u00a0/g, ' ')

describe('formatNutrient', () => {
  it('affiche valeurs exactes (zéro explicite compris) et seuils', () => {
    expect(text({ value: 30.2, unit: 'kcal' })).toBe('30,2 kcal')
    expect(text({ value: 0 })).toBe('0 g')
    expect(text({ status: 'less_than', upperBoundExclusive: 0.5 })).toBe(
      '< 0,5 g',
    )
  })

  it('n’affiche jamais zéro pour traces ou absence', () => {
    expect(text({ status: 'trace' })).toBe('Traces (non quantifié)')
    expect(text({ status: 'missing' })).toBe('Non renseigné')
    expect(text({ status: 'exact', value: null })).toBe('Non renseigné')
  })
})
