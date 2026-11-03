import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createCiqual,
  normalizeText,
  rankFoods,
  CiqualQueryError,
} from '../../src/server/application/ciqual.js'
import {
  CiqualReadError,
  type CiqualFoodDetail,
  type CiqualFoodSummary,
  type CiqualRepository,
} from '../../src/server/domain/ciqual-repository.js'
import { createRecipeServer } from '../../src/server/server.js'
import type { RecipeRepository } from '../../src/server/domain/recipe-repository.js'

const FOODS = [
  { code: '20009', name: 'Carotte, crue' },
  { code: '20010', name: 'Carotte, râpée, assaisonnée' },
  { code: '9100', name: 'Riz blanc, cru' },
  { code: '4008', name: 'Pomme de terre, sans peau, crue' },
  { code: '13039', name: 'Pomme, chair et peau, crue' },
  { code: '19041', name: 'Lait demi-écrémé, UHT' },
  { code: '1', name: 'Gâteau à la crème' },
  { code: '2', name: 'Crème fraîche' },
]

const summary = (code: string, name: string): CiqualFoodSummary => ({
  code,
  name,
  source: 'https://doi.org/10.57745/RDMHWY',
  version: '2025-V1.0-2025-11-03',
  baseQuantity: 100,
  baseUnit: 'g',
})

function fakeCiqual(overrides: Partial<CiqualRepository> = {}) {
  const detail: CiqualFoodDetail = {
    ...summary('20009', 'Carotte, crue'),
    active: true,
    attribution: 'Anses. 2025.',
    nutrients: [
      // Volontairement désordonnés : l'API ne doit rien inventer ni convertir.
      {
        key: '40000',
        unit: 'g',
        status: 'less_than',
        raw: '< 0,5',
        value: 0.5,
      },
      { key: '328', unit: 'kcal', status: 'exact', raw: '30,2', value: 30.2 },
      { key: '31000', unit: 'g', status: 'exact', raw: '0', value: 0 },
      { key: '25003', unit: 'g', status: 'trace', raw: 'traces', value: null },
      { key: '10110', unit: 'mg', status: 'missing', raw: '-', value: null },
      { key: '99999', unit: 'g', status: 'exact', raw: '1', value: 1 },
    ],
  }
  const repository: CiqualRepository = {
    listSearchableFoods: async () => FOODS,
    findSummaries: async (codes) =>
      FOODS.filter((f) => codes.includes(f.code)).map((f) =>
        summary(f.code, f.name),
      ),
    findByCode: async (code) => (code === '20009' ? detail : null),
    ...overrides,
  }
  return repository
}

describe('normalizeText', () => {
  it('ignore casse, accents, ligatures et ponctuation', () => {
    expect(normalizeText('Crème, ŒUF  (cru)')).toBe('creme oeuf cru')
  })
})

describe('rankFoods', () => {
  it('classe début de libellé, puis début de mot, puis inclusion', () => {
    const names = rankFoods(FOODS, 'creme').map((f) => f.name)
    // Rang 0 : commence par la requête ; rang 1 : début de mot ; rang 2 : simple inclusion (« écrémé »).
    expect(names).toEqual([
      'Crème fraîche',
      'Gâteau à la crème',
      'Lait demi-écrémé, UHT',
    ])
  })

  it('trouve sans accent, quelle que soit la casse', () => {
    expect(rankFoods(FOODS, 'ECREME').map((f) => f.code)).toEqual(['19041'])
  })

  it('exige tous les mots, dans n’importe quel ordre', () => {
    expect(rankFoods(FOODS, 'terre pomme').map((f) => f.code)).toEqual(['4008'])
  })

  it('départage par libellé le plus court puis alphabétique puis code', () => {
    expect(rankFoods(FOODS, 'carotte').map((f) => f.code)).toEqual([
      '20009',
      '20010',
    ])
    const ties = [
      { code: '10', name: 'Sel' },
      { code: '9', name: 'Sel' },
    ]
    expect(rankFoods(ties, 'sel').map((f) => f.code)).toEqual(['9', '10'])
  })
})

describe('createCiqual.search', () => {
  it('refuse une requête trop courte, vide ou trop longue', async () => {
    const ciqual = createCiqual(fakeCiqual())
    for (const q of [null, undefined, '', ' ', 'a', ' a ', 42]) {
      await expect(ciqual.search(q)).rejects.toMatchObject({
        code: 'QUERY_TOO_SHORT',
      })
    }
    await expect(ciqual.search('x'.repeat(101))).rejects.toMatchObject({
      code: 'QUERY_TOO_LONG',
    })
  })

  it('compte les caractères, pas les unités UTF-16', async () => {
    const ciqual = createCiqual(fakeCiqual())
    await expect(ciqual.search('🥕')).rejects.toBeInstanceOf(CiqualQueryError)
    await expect(ciqual.search('🥕🥕')).resolves.toMatchObject({ results: [] })
  })

  it('renvoie un résultat identifié (code, libellé, source, version)', async () => {
    const response = await createCiqual(fakeCiqual()).search('riz')
    expect(response).toEqual({
      query: 'riz',
      minLength: 2,
      limit: 10,
      truncated: false,
      results: [summary('9100', 'Riz blanc, cru')],
    })
  })

  it('renvoie une liste vide sans erreur quand rien ne correspond', async () => {
    const response = await createCiqual(fakeCiqual()).search('zzzz')
    expect(response.results).toEqual([])
    expect(response.truncated).toBe(false)
  })

  it('applique la limite et signale la troncature', async () => {
    const ciqual = createCiqual(fakeCiqual())
    const response = await ciqual.search('cru', '2')
    expect(response.limit).toBe(2)
    expect(response.results).toHaveLength(2)
    expect(response.truncated).toBe(true)
    expect((await ciqual.search('cru', '50')).truncated).toBe(false)
  })

  it('refuse une limite invalide', async () => {
    const ciqual = createCiqual(fakeCiqual())
    for (const limit of ['0', '51', '-1', '1.5', 'abc', '', '1e1']) {
      await expect(ciqual.search('riz', limit)).rejects.toMatchObject({
        code: 'INVALID_LIMIT',
      })
    }
  })
})

describe('createCiqual.findByCode', () => {
  it('ne transforme jamais une absence en zéro', async () => {
    const detail = await createCiqual(fakeCiqual()).findByCode('20009')
    const by = Object.fromEntries(detail!.nutrients.map((n) => [n.key, n]))
    expect(by['328']).toMatchObject({
      status: 'exact',
      value: 30.2,
      label: expect.any(String),
    })
    expect(by['31000']).toMatchObject({ status: 'exact', value: 0 }) // vrai zéro explicite
    expect(by['40000']).toMatchObject({
      status: 'less_than',
      value: null,
      upperBoundExclusive: 0.5,
    })
    expect(by['25003']).toMatchObject({
      status: 'trace',
      value: null,
      upperBoundExclusive: null,
    })
    expect(by['10110']).toMatchObject({
      status: 'missing',
      value: null,
      upperBoundExclusive: null,
    })
    expect(by['99999'].label).toBeNull()
  })

  it('renvoie null pour un code inconnu et refuse un code invalide', async () => {
    const ciqual = createCiqual(fakeCiqual())
    await expect(ciqual.findByCode('999')).resolves.toBeNull()
    for (const code of ['abc', '', '12 3', '1'.repeat(13), '../x', 5]) {
      await expect(ciqual.findByCode(code)).rejects.toMatchObject({
        code: 'INVALID_CODE',
      })
    }
  })
})

describe('HTTP /api/ciqual', () => {
  const recipes = {} as RecipeRepository
  let base = ''
  let failing = false
  const server = createRecipeServer(
    recipes,
    fakeCiqual({
      listSearchableFoods: async () => {
        if (failing) throw new CiqualReadError()
        return FOODS
      },
    }),
  )
  const bare = createRecipeServer(recipes)

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    bare.close()
  })

  const get = (path: string) => fetch(`${base}${path}`)

  it('400 pour une requête courte, avec les bornes du contrat', async () => {
    for (const path of ['/api/ciqual/foods', '/api/ciqual/foods?q=a']) {
      const response = await get(path)
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        error: 'QUERY_TOO_SHORT',
        minLength: 2,
        defaultLimit: 10,
        maxLimit: 50,
      })
    }
  })

  it('200 avec résultats identifiés, accents et espaces encodés', async () => {
    const response = await get('/api/ciqual/foods?q=%20cr%C3%A8me%20')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.query).toBe('crème')
    expect(body.results.map((r: { code: string }) => r.code)).toEqual([
      '2',
      '1',
      '19041',
    ])
    expect(body.results[0]).toEqual(summary('2', 'Crème fraîche'))
  })

  it('200 avec liste vide, 400 pour limite invalide', async () => {
    const empty = await get('/api/ciqual/foods?q=zzzz')
    expect(empty.status).toBe(200)
    expect((await empty.json()).results).toEqual([])
    const bad = await get('/api/ciqual/foods?q=riz&limit=999')
    expect(bad.status).toBe(400)
    expect((await bad.json()).error).toBe('INVALID_LIMIT')
  })

  it('détail : 200, 404 et 400', async () => {
    expect((await get('/api/ciqual/foods/20009')).status).toBe(200)
    const missing = await get('/api/ciqual/foods/777')
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ error: 'CIQUAL_FOOD_NOT_FOUND' })
    expect((await get('/api/ciqual/foods/abc')).status).toBe(400)
  })

  it('405 hors GET, 503 sans fuite de détails, 404 si non configuré', async () => {
    const post = await fetch(`${base}/api/ciqual/foods?q=riz`, {
      method: 'POST',
    })
    expect(post.status).toBe(405)
    expect(post.headers.get('allow')).toBe('GET')

    failing = true
    const down = await get('/api/ciqual/foods?q=riz')
    failing = false
    expect(down.status).toBe(503)
    expect(await down.json()).toEqual({ error: 'CIQUAL_READ_FAILED' })

    await new Promise<void>((resolve) => bare.listen(0, '127.0.0.1', resolve))
    const port = (bare.address() as AddressInfo).port
    const none = await fetch(`http://127.0.0.1:${port}/api/ciqual/foods?q=riz`)
    expect(none.status).toBe(404)
  })
})
