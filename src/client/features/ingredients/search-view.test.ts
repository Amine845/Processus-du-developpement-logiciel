import { describe, expect, it } from 'vitest'
import type { CiqualSearchResponseDTO } from '../../../shared/types/ciqual.types'
import { cleanQuery, deriveSearchView } from './search-view'

const response = (n: number): CiqualSearchResponseDTO => ({
  query: 'riz',
  minLength: 2,
  limit: 10,
  truncated: false,
  results: Array.from({ length: n }, (_, i) => ({
    category: 'unclassified' as const,
    groupCode: null,
    groupName: null,
    subgroupCode: null,
    subgroupName: null,
    detailGroupCode: null,
    detailGroupName: null,
    code: String(i + 1),
    name: `Riz ${i}`,
    source: 'src',
    version: 'v1',
    baseQuantity: 100,
    baseUnit: 'g',
  })),
})

describe('deriveSearchView', () => {
  it('vide, trop court, puis chargement tant qu’aucun résultat ne correspond', () => {
    expect(deriveSearchView('  ', null, 2)).toEqual({ kind: 'idle' })
    expect(deriveSearchView(' r ', null, 2)).toEqual({
      kind: 'short',
      minLength: 2,
    })
    expect(deriveSearchView('riz', null, 2)).toEqual({ kind: 'loading' })
  })

  it('montre résultats, vide ou erreur seulement pour la requête courante', () => {
    const ok = { query: 'riz', response: response(2) }
    expect(deriveSearchView('riz', ok, 2).kind).toBe('results')
    expect(deriveSearchView(' riz ', ok, 2).kind).toBe('results')
    expect(
      deriveSearchView('riz', { query: 'riz', response: response(0) }, 2),
    ).toEqual({ kind: 'empty' })
    expect(deriveSearchView('riz', { query: 'riz', failed: true }, 2)).toEqual({
      kind: 'error',
    })
  })

  it('une ancienne réponse ne remplace pas une recherche plus récente', () => {
    const old = { query: 'ri', response: response(3) }
    expect(deriveSearchView('riz', old, 2)).toEqual({ kind: 'loading' })
    expect(deriveSearchView('r', old, 2).kind).toBe('short')
  })
})

describe('cleanQuery', () => {
  it('réduit les espaces', () => {
    expect(cleanQuery('  pomme   de\tterre ')).toBe('pomme de terre')
  })
})

describe('category changes', () => {
  it('hides results from another category for the same query', () => {
    const old = {
      query: 'riz',
      category: 'food' as const,
      response: response(1),
    }
    expect(deriveSearchView('riz', old, 2, 'prepared_dish')).toEqual({
      kind: 'loading',
    })
    expect(deriveSearchView('riz', old, 2, 'all')).toEqual({ kind: 'loading' })
    expect(deriveSearchView('riz', old, 2, 'food').kind).toBe('results')
  })
})
