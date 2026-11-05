import { describe, it, expect } from 'vitest'
import { recipePayload, type RecipeDraft } from './recipe-form'
const draft = (): RecipeDraft => ({
  title: 'Test',
  description: '',
  servings: '1',
  ingredients: [
    {
      id: 1,
      selection: { mode: 'manual', name: 'Oeuf cru' },
      quantity: '2',
      unit: 'g',
    },
  ],
  steps: [{ id: 1, instruction: 'Cuire' }],
})
describe('recipe form contract', () => {
  it('does not invent quantities for empty, zero, negative or non-finite values', () => {
    for (const quantity of ['', ' ', '0', '-1', 'Infinity', 'NaN']) {
      const d = draft()
      d.ingredients[0].quantity = quantity
      expect(() => recipePayload(d)).toThrow()
    }
  })
  it('keeps manual names unlinked and description optional', () => {
    const result = recipePayload(draft())
    expect(result.ingredients[0].ciqualCode).toBeNull()
    expect(result.description).toBeNull()
    expect(result.steps).toEqual([{ instruction: 'Cuire' }])
  })
  it('requires explicit selection, ingredients and preparation', () => {
    const d = draft()
    d.ingredients[0].selection = null
    expect(() => recipePayload(d)).toThrow()
    expect(() => recipePayload({ ...draft(), ingredients: [] })).toThrow()
    expect(() => recipePayload({ ...draft(), steps: [] })).toThrow()
  })
})
