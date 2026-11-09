import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  DEMO_INGREDIENT_TAGS,
  TAG_VOCABULARY,
  TagValidationError,
  parseAssignBody,
  parseTagId,
  parseTagLabel,
} from '../../src/server/application/ingredient-tags.js'
import type { RecipeRepository } from '../../src/server/domain/recipe-repository.js'
import {
  TagReadError,
  TagWriteError,
  type IngredientSummary,
  type IngredientTagRepository,
} from '../../src/server/domain/tag-repository.js'
import { sortTags } from '../../src/server/infrastructure/prisma-tag-repository.js'
import { syncTagVocabulary } from '../../src/server/infrastructure/tag-vocabulary-sync.js'
import { createRecipeServer } from '../../src/server/server.js'

describe('parseTagLabel : politique de normalisation', () => {
  it('retire les espaces, garde casse et accents du libellé, normalise la clé', () => {
    expect(parseTagLabel('  Produit   sucré ')).toEqual({
      key: 'produit-sucre',
      label: 'Produit sucré',
    })
    expect(parseTagLabel('Œuf')).toEqual({ key: 'oeuf', label: 'Œuf' })
    expect(parseTagLabel("Fruit à coque d'été")).toEqual({
      key: 'fruit-a-coque-d-ete',
      label: "Fruit à coque d'été",
    })
  })

  it('donne la même clé pour casse, accents et espaces différents', () => {
    const keys = ['Légume', 'LEGUME', ' légume ', 'Legume'].map(
      (label) => parseTagLabel(label).key,
    )
    expect(new Set(keys)).toEqual(new Set(['legume']))
  })

  it('refuse les valeurs invalides avec des messages précis', () => {
    const invalid: unknown[] = [
      undefined,
      null,
      42,
      '',
      '   ',
      'x'.repeat(41),
      '-tiret',
      "'apostrophe",
      'a_b',
      'a/b',
      'emoji 🥕',
      'ελληνικά',
      'œ'.repeat(25), // 25 caractères mais clé de 50 : au-delà de la limite de clé
    ]
    for (const value of invalid) {
      expect(() => parseTagLabel(value), String(value)).toThrow(
        TagValidationError,
      )
    }
  })

  it('accepte la longueur maximale exacte', () => {
    expect(() => parseTagLabel('x'.repeat(40))).not.toThrow()
  })
})

describe('vocabulaire initial', () => {
  it('est petit, sans doublon et valide', () => {
    expect(TAG_VOCABULARY.length).toBeGreaterThan(0)
    expect(TAG_VOCABULARY.length).toBeLessThanOrEqual(20)
    const parsed = TAG_VOCABULARY.map((label) => parseTagLabel(label))
    expect(new Set(parsed.map((tag) => tag.key)).size).toBe(parsed.length)
    for (const tag of parsed) expect(tag.label).toBeTruthy()
  })

  it('ne contient ni allergène, ni régime, ni tag de recette', () => {
    const keys = TAG_VOCABULARY.map((label) => parseTagLabel(label).key)
    for (const key of keys) {
      expect(key).not.toMatch(
        /allerg|sans|gluten|lactose|vegan|vegetarien|halal|gourmand|rapide/,
      )
    }
  })

  it('les associations de démonstration n’utilisent que des tags du vocabulaire', () => {
    const keys = new Set(
      TAG_VOCABULARY.map((label) => parseTagLabel(label).key),
    )
    for (const labels of Object.values(DEMO_INGREDIENT_TAGS)) {
      for (const label of labels) {
        expect(keys.has(parseTagLabel(label).key), label).toBe(true)
      }
    }
  })
})

describe('parseTagId / parseAssignBody', () => {
  it('accepte un entier positif sur 32 bits seulement', () => {
    expect(parseTagId(1)).toBe(1)
    expect(parseTagId(2147483647)).toBe(2147483647)
    for (const bad of [0, -1, 1.5, NaN, Infinity, 2147483648, '1', null]) {
      expect(() => parseTagId(bad), String(bad)).toThrow(TagValidationError)
    }
  })

  it('exige un objet JSON avec tagId', () => {
    expect(parseAssignBody({ tagId: 3, extra: 'ignoré' })).toBe(3)
    for (const bad of [null, [], 'x', 1, {}, { tagId: '3' }]) {
      expect(() => parseAssignBody(bad)).toThrow(TagValidationError)
    }
  })
})

describe('sortTags', () => {
  it('trie par clé puis par id, sans modifier l’entrée', () => {
    const input = [
      { id: 3, key: 'legume', label: 'Légume' },
      { id: 1, key: 'cereale', label: 'Céréale' },
      { id: 2, key: 'cereale', label: 'Céréale bis' },
    ]
    const copy = structuredClone(input)
    expect(sortTags(input).map((t) => t.id)).toEqual([1, 2, 3])
    expect(input).toEqual(copy)
  })
})

/** Base minimale en mémoire : uniquement les appels que syncTagVocabulary utilise. */
function fakeDb() {
  type Tag = { id: number; key: string; label: string; active: boolean }
  const tags: Tag[] = []
  const links = new Set<string>()
  const ingredients = new Map<string, number>()
  let nextId = 1
  const db = {
    tag: {
      findMany: async () => tags.map((t) => ({ ...t })),
      create: async ({ data }: { data: { key: string; label: string } }) => {
        const tag = { id: nextId++, active: true, ...data }
        tags.push(tag)
        return { ...tag }
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number }
        data: Partial<Tag>
      }) => {
        Object.assign(
          tags.find((t) => t.id === where.id)!,
          data,
        )
      },
    },
    ingredient: {
      findUnique: async ({ where }: { where: { canonicalName: string } }) => {
        const id = ingredients.get(where.canonicalName)
        return id === undefined ? null : { id }
      },
    },
    ingredientTag: {
      count: async () =>
        [...links].filter((link) => {
          const tagId = Number(link.split(':')[1])
          return !tags.find((t) => t.id === tagId)!.active
        }).length,
      findUnique: async ({
        where,
      }: {
        where: { ingredientId_tagId: { ingredientId: number; tagId: number } }
      }) => {
        const { ingredientId, tagId } = where.ingredientId_tagId
        return links.has(`${ingredientId}:${tagId}`)
          ? { ingredientId, tagId }
          : null
      },
      create: async ({
        data,
      }: {
        data: { ingredientId: number; tagId: number }
      }) => {
        links.add(`${data.ingredientId}:${data.tagId}`)
      },
    },
  }
  return { db: db as never, tags, links, ingredients }
}

describe('syncTagVocabulary', () => {
  it('crée le vocabulaire puis ne change plus rien à la relance', async () => {
    const { db, tags } = fakeDb()
    const first = await syncTagVocabulary(db, ['Légume', 'Œuf'], {})
    expect(first).toMatchObject({ created: 2, reactivated: 0, deactivated: 0 })
    const again = await syncTagVocabulary(db, ['Légume', 'Œuf'], {})
    expect(again).toMatchObject({ created: 0, reactivated: 0, deactivated: 0 })
    expect(tags.map((t) => t.key)).toEqual(['legume', 'oeuf'])
  })

  it('désactive sans supprimer, signale les associations obsolètes, puis réactive', async () => {
    const { db, tags, links, ingredients } = fakeDb()
    ingredients.set('Carotte', 7)
    await syncTagVocabulary(db, ['Légume', 'Fruit'], { Carotte: ['Légume'] })
    expect(links.size).toBe(1)

    const reduced = await syncTagVocabulary(db, ['Fruit'], {})
    expect(reduced).toMatchObject({ deactivated: 1, obsoleteAssociations: 1 })
    expect(tags.find((t) => t.key === 'legume')?.active).toBe(false)
    expect(links.size).toBe(1) // association conservée

    const back = await syncTagVocabulary(db, ['Légume', 'Fruit'], {})
    expect(back).toMatchObject({ reactivated: 1, deactivated: 0 })
    expect(tags.every((t) => t.active)).toBe(true)
  })

  it('ajoute les associations sans jamais en retirer, ignore les ingrédients absents', async () => {
    const { db, links, ingredients } = fakeDb()
    ingredients.set('Beurre', 1)
    ingredients.set('Sucre', 2)
    const assignments = {
      Beurre: ['Produit laitier', 'Matière grasse'],
      Sucre: ['Produit sucré'],
      Fantôme: ['Fruit'],
    }
    const vocabulary = [
      'Produit laitier',
      'Matière grasse',
      'Produit sucré',
      'Fruit',
    ]
    const first = await syncTagVocabulary(db, vocabulary, assignments)
    expect(first.associationsAdded).toBe(3)
    expect(first.skippedIngredients).toEqual(['Fantôme'])
    links.add('2:4') // association ajoutée par un utilisateur
    const second = await syncTagVocabulary(db, vocabulary, assignments)
    expect(second.associationsAdded).toBe(0)
    expect(links.has('2:4')).toBe(true)
    expect(links.size).toBe(4)
  })

  it('rejette un vocabulaire invalide ou ambigu avant toute écriture', async () => {
    const { db, tags } = fakeDb()
    await expect(
      syncTagVocabulary(db, ['Légume', 'LEGUME'], {}),
    ).rejects.toThrow(TagValidationError)
    await expect(syncTagVocabulary(db, ['Valide', ''], {})).rejects.toThrow(
      TagValidationError,
    )
    expect(tags).toEqual([])
  })

  it('rejette une association vers un tag hors vocabulaire', async () => {
    const { db, ingredients } = fakeDb()
    ingredients.set('Beurre', 1)
    await expect(
      syncTagVocabulary(db, ['Fruit'], { Beurre: ['Inconnu'] }),
    ).rejects.toThrow(TagValidationError)
  })
})

describe('HTTP /api/tags et /api/ingredients', () => {
  const LEGUME = { id: 1, key: 'legume', label: 'Légume' }
  const ingredients: IngredientSummary[] = [
    { id: 5, canonicalName: 'Carotte', ciqualCode: '20009', tags: [] },
  ]
  let failure: 'read' | 'write' | null = null
  const repository: IngredientTagRepository = {
    listTags: async () => {
      if (failure === 'read') throw new TagReadError()
      return [{ ...LEGUME, ingredientCount: 1, recipeCount: 1 }]
    },
    listIngredients: async () => ingredients,
    findIngredient: async (id) => ingredients.find((i) => i.id === id) ?? null,
    assign: async (ingredientId, tagId) => {
      if (failure === 'write') throw new TagWriteError()
      const ingredient = ingredients.find((i) => i.id === ingredientId)
      if (!ingredient) return { kind: 'ingredient_not_found' }
      if (tagId === 2) return { kind: 'tag_inactive' }
      if (tagId !== 1) return { kind: 'tag_not_found' }
      if (ingredient.tags.length > 0) return { kind: 'exists' }
      ingredient.tags = [LEGUME]
      return { kind: 'created' }
    },
    remove: async (ingredientId, tagId) => {
      const ingredient = ingredients.find((i) => i.id === ingredientId)
      if (!ingredient) return { kind: 'ingredient_not_found' }
      if (tagId !== 1 || ingredient.tags.length === 0) return { kind: 'absent' }
      ingredient.tags = []
      return { kind: 'removed' }
    },
  }
  const server = createRecipeServer(
    {} as RecipeRepository,
    undefined,
    repository,
  )
  const bare = createRecipeServer({} as RecipeRepository)
  let base = ''

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    bare.close()
  })

  const call = async (
    method: string,
    path: string,
    body?: unknown,
    contentType = 'application/json',
  ) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': contentType },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    return {
      status: response.status,
      allow: response.headers.get('allow'),
      body: text ? JSON.parse(text) : undefined,
    }
  }

  it('lit les tags avec compteurs et les ingrédients avec leurs tags', async () => {
    const tags = await call('GET', '/api/tags')
    expect(tags.status).toBe(200)
    expect(tags.body).toEqual([
      { ...LEGUME, ingredientCount: 1, recipeCount: 1 },
    ])
    const list = await call('GET', '/api/ingredients')
    expect(list.body).toEqual(ingredients)
    expect((await call('GET', '/api/ingredients/5')).body.ciqualCode).toBe(
      '20009',
    )
    expect((await call('GET', '/api/ingredients/99')).status).toBe(404)
    expect((await call('GET', '/api/ingredients/0')).status).toBe(400)
  })

  it('attribue (201), répète (200), retire (204) puis signale l’absence (404)', async () => {
    const created = await call('POST', '/api/ingredients/5/tags', { tagId: 1 })
    expect(created.status).toBe(201)
    expect(created.body.tags).toEqual([LEGUME])
    expect(
      (await call('POST', '/api/ingredients/5/tags', { tagId: 1 })).status,
    ).toBe(200)
    expect((await call('DELETE', '/api/ingredients/5/tags/1')).status).toBe(204)
    const absent = await call('DELETE', '/api/ingredients/5/tags/1')
    expect([absent.status, absent.body.error]).toEqual([
      404,
      'TAG_NOT_ASSIGNED',
    ])
  })

  it('valide corps, identifiants et média', async () => {
    for (const body of [{}, { tagId: '1' }, { tagId: 0 }, [], null]) {
      const response = await call('POST', '/api/ingredients/5/tags', body)
      expect(response.status, JSON.stringify(body)).toBe(400)
      expect(response.body.error).toBe('INVALID_TAG')
      expect(Array.isArray(response.body.issues)).toBe(true)
    }
    expect(
      (await call('POST', '/api/ingredients/5/tags', {}, 'text/plain')).status,
    ).toBe(415)
    expect(
      (await call('POST', '/api/ingredients/0/tags', { tagId: 1 })).status,
    ).toBe(400)
    expect((await call('DELETE', '/api/ingredients/5/tags/0')).status).toBe(400)
  })

  it('distingue tag inconnu, tag désactivé et ingrédient inconnu', async () => {
    const unknownTag = await call('POST', '/api/ingredients/5/tags', {
      tagId: 9,
    })
    expect([unknownTag.status, unknownTag.body.error]).toEqual([
      404,
      'TAG_NOT_FOUND',
    ])
    const inactive = await call('POST', '/api/ingredients/5/tags', { tagId: 2 })
    expect([inactive.status, inactive.body.error]).toEqual([
      409,
      'TAG_INACTIVE',
    ])
    const noIngredient = await call('POST', '/api/ingredients/99/tags', {
      tagId: 1,
    })
    expect([noIngredient.status, noIngredient.body.error]).toEqual([
      404,
      'INGREDIENT_NOT_FOUND',
    ])
    const noIngredientDelete = await call(
      'DELETE',
      '/api/ingredients/99/tags/1',
    )
    expect(noIngredientDelete.body.error).toBe('INGREDIENT_NOT_FOUND')
  })

  it('refuse les méthodes non prévues avec l’en-tête Allow', async () => {
    expect((await call('POST', '/api/tags')).allow).toBe('GET')
    expect((await call('PUT', '/api/ingredients')).allow).toBe('GET')
    expect((await call('PUT', '/api/ingredients/5')).allow).toBe('GET')
    expect((await call('GET', '/api/ingredients/5/tags')).allow).toBe('POST')
    expect((await call('GET', '/api/ingredients/5/tags/1')).allow).toBe(
      'DELETE',
    )
  })

  it('503 sans détail technique en cas d’échec de lecture ou d’écriture', async () => {
    failure = 'read'
    const read = await call('GET', '/api/tags')
    failure = 'write'
    const write = await call('POST', '/api/ingredients/5/tags', { tagId: 1 })
    failure = null
    expect(read).toMatchObject({
      status: 503,
      body: { error: 'TAG_READ_FAILED' },
    })
    expect(write).toMatchObject({
      status: 503,
      body: { error: 'TAG_WRITE_FAILED' },
    })
  })

  it('répond 404 si le référentiel de tags n’est pas configuré', async () => {
    await new Promise<void>((resolve) => bare.listen(0, '127.0.0.1', resolve))
    const port = (bare.address() as AddressInfo).port
    for (const path of [
      '/api/tags',
      '/api/ingredients',
      '/api/ingredients/5',
    ]) {
      expect((await fetch(`http://127.0.0.1:${port}${path}`)).status).toBe(404)
    }
  })
})
