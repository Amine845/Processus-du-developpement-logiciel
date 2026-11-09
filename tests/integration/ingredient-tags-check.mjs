import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { importCiqual } from '../../scripts/ciqual.mjs'
import { linkCiqual } from '../../scripts/ciqual-reference.mjs'
import { TAG_VOCABULARY } from '../../dist-server/server/application/ingredient-tags.js'
import { createPrismaCiqualRepository } from '../../dist-server/server/infrastructure/prisma-ciqual-repository.js'
import { createPrismaRecipeRepository } from '../../dist-server/server/infrastructure/prisma-recipe-repository.js'
import { createPrismaTagRepository } from '../../dist-server/server/infrastructure/prisma-tag-repository.js'
import { syncTagVocabulary } from '../../dist-server/server/infrastructure/tag-vocabulary-sync.js'
import { seedDatabase } from '../../dist-server/server/prisma/seed.js'
import { createRecipeServer } from '../../dist-server/server/server.js'

// Les tests partagent une base temporaire et s'exécutent dans l'ordre du fichier :
// chacun part de l'état laissé par le précédent (documenté en tête de chaque test).
const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))
const NEW_MIGRATION = '20261108090000_ingredient_tags'
const sample = JSON.parse(
  readFileSync(join(root, 'data/ciqual/subset-2025.json'), 'utf8'),
)
const encode = (value) => Buffer.from(JSON.stringify(value))

const temp = mkdtempSync(join(tmpdir(), 'ingredient-tags-'))
const url = `file:${join(temp, 'test.db').replaceAll('\\', '/')}`
let db
let server
let base

const deploy = () => {
  const result = spawnSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    { cwd: temp, env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' },
  )
  assert.equal(
    result.status,
    0,
    result.error?.message ?? result.stdout + result.stderr,
  )
}

async function api(method, path, body, contentType = 'application/json') {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body:
      body === undefined
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  })
  const text = await response.text()
  return {
    status: response.status,
    body: text ? JSON.parse(text) : undefined,
  }
}

const sync = (vocabulary = TAG_VOCABULARY, assignments = {}) =>
  db.$transaction((tx) => syncTagVocabulary(tx, vocabulary, assignments))
const tagId = async (key) =>
  (await db.tag.findUniqueOrThrow({ where: { key } })).id
const ingredientId = async (name) =>
  (await db.ingredient.findUniqueOrThrow({ where: { canonicalName: name } })).id
const counts = async () => ({
  recipes: await db.recipe.count(),
  ingredients: await db.ingredient.count(),
  lines: await db.recipeIngredient.count(),
})

before(async () => {
  writeFileSync(join(temp, 'test.db'), '')
  db = new PrismaClient({ datasources: { db: { url } } })
  mkdirSync(join(temp, 'prisma'))
  cpSync(
    join(root, 'src/server/prisma/schema.prisma'),
    join(temp, 'prisma/schema.prisma'),
  )
  cpSync(
    join(root, 'src/server/prisma/migrations'),
    join(temp, 'prisma/migrations'),
    { recursive: true },
  )
  server = createRecipeServer(
    createPrismaRecipeRepository(db),
    createPrismaCiqualRepository(db),
    createPrismaTagRepository(db),
  )
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  try {
    server?.closeAllConnections()
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()))
  } finally {
    try {
      await db?.$disconnect()
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }
})

test('migration additive : recettes, ingrédients et liaison CIQUAL intacts', async () => {
  // Toutes les migrations sauf la nouvelle, puis des données « existantes ».
  rmSync(join(temp, 'prisma/migrations', NEW_MIGRATION), { recursive: true })
  deploy()
  await db.$executeRawUnsafe(
    `INSERT INTO Ingredient (id, canonicalName) VALUES (51, 'Manuel'), (52, 'Carotte')`,
  )
  await db.$executeRawUnsafe(
    `INSERT INTO Recipe (id, title, servings) VALUES (51, 'Conservée', 2)`,
  )
  await db.$executeRawUnsafe(
    `INSERT INTO RecipeIngredient (recipeId, ingredientId, quantity, unit, position) VALUES (51, 52, 200, 'g', 1)`,
  )
  await db.$executeRawUnsafe(
    `INSERT INTO RecipeStep (recipeId, position, instruction) VALUES (51, 1, 'Couper')`,
  )
  await importCiqual(db, encode(sample))
  await linkCiqual(db, 52, '20009')
  const snapshot = () =>
    Promise.all([
      db.recipe.findMany({
        orderBy: { id: 'asc' },
        include: { ingredients: true, steps: true },
      }),
      db.ingredient.findMany({ orderBy: { id: 'asc' } }),
    ])
  const before = await snapshot()

  cpSync(
    join(root, 'src/server/prisma/migrations', NEW_MIGRATION),
    join(temp, 'prisma/migrations', NEW_MIGRATION),
    { recursive: true },
  )
  deploy()

  assert.deepEqual(await snapshot(), before)
  assert.equal(
    (await db.ingredient.findUniqueOrThrow({ where: { id: 52 } })).ciqualCode,
    '20009',
  )
  assert.equal(await db.tag.count(), 0)
  assert.equal(await db.ingredientTag.count(), 0)
})

test('vocabulaire initial : documenté, relançable, sans doublon', async () => {
  const first = await sync()
  assert.equal(first.created, TAG_VOCABULARY.length)
  assert.equal(first.deactivated, 0)
  const second = await sync()
  assert.equal(second.created, 0)
  assert.equal(second.reactivated, 0)
  assert.equal(second.associationsAdded, 0)

  const tags = await db.tag.findMany()
  assert.equal(tags.length, TAG_VOCABULARY.length)
  assert.equal(new Set(tags.map((t) => t.key)).size, tags.length)
  assert.equal(new Set(tags.map((t) => t.label)).size, tags.length)
  for (const tag of tags) {
    assert.match(tag.key, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.equal(tag.active, true)
    // Pas d'allergène, de régime ni de tag de recette déduit.
    assert.doesNotMatch(tag.key, /allerg|sans|vegetarien|vegan|gourmand|rapide/)
  }
  assert.equal(
    (await db.tag.findUniqueOrThrow({ where: { key: 'oeuf' } })).label,
    'Œuf',
  )
})

test('contraintes : doublons et valeurs invalides refusés par la base', async () => {
  const carotte = await ingredientId('Carotte')
  const legume = await tagId('legume')
  await db.ingredientTag.create({
    data: { ingredientId: carotte, tagId: legume },
  })
  await assert.rejects(
    db.ingredientTag.create({ data: { ingredientId: carotte, tagId: legume } }),
  )
  // Même clé normalisée : refusée, quelle que soit la casse du libellé.
  await assert.rejects(
    db.tag.create({ data: { key: 'legume', label: 'LEGUME' } }),
  )
  // Clé non normalisée, libellé vide ou trop long : refusés par les CHECK.
  await assert.rejects(
    db.tag.create({ data: { key: 'Légume2', label: 'Autre' } }),
  )
  await assert.rejects(db.tag.create({ data: { key: 'vide', label: '   ' } }))
  await assert.rejects(
    db.tag.create({ data: { key: 'long', label: 'x'.repeat(41) } }),
  )
  // Retour à l'état attendu pour la suite : Carotte n'a pas encore de tag « API ».
  await db.ingredientTag.deleteMany({})
})

test('API : attribuer un tag, idempotence, erreurs validées', async () => {
  const recipe = await api('POST', '/api/recipes', {
    title: 'Soupe de légumes',
    description: null,
    servings: 4,
    ingredients: [
      { canonicalName: 'Carotte', quantity: 200, unit: 'g' },
      { canonicalName: 'Pomme de terre', quantity: 300, unit: 'g' },
      { canonicalName: 'Oignon', quantity: 1, unit: 'piece' },
    ],
    steps: [{ instruction: 'Cuire.' }],
  })
  assert.equal(recipe.status, 201)
  const pain = await api('POST', '/api/recipes', {
    title: 'Pain',
    description: null,
    servings: 2,
    ingredients: [{ canonicalName: 'Farine de blé', quantity: 500, unit: 'g' }],
    steps: [{ instruction: 'Pétrir.' }],
  })
  assert.equal(pain.status, 201)

  const [carotte, pdt, oignon] = await Promise.all(
    ['Carotte', 'Pomme de terre', 'Oignon'].map(ingredientId),
  )
  const legume = await tagId('legume')
  const aromate = await tagId('epice-et-aromate')

  const created = await api('POST', `/api/ingredients/${carotte}/tags`, {
    tagId: legume,
  })
  assert.equal(created.status, 201)
  assert.deepEqual(created.body.tags, [
    { id: legume, key: 'legume', label: 'Légume' },
  ])
  // Idempotent : 200, aucune association en double.
  const again = await api('POST', `/api/ingredients/${carotte}/tags`, {
    tagId: legume,
  })
  assert.equal(again.status, 200)
  assert.deepEqual(again.body, created.body)
  assert.equal(
    await db.ingredientTag.count({ where: { ingredientId: carotte } }),
    1,
  )

  assert.equal(
    (await api('POST', `/api/ingredients/${pdt}/tags`, { tagId: legume }))
      .status,
    201,
  )
  // Association multiple : un ingrédient, deux tags.
  assert.equal(
    (await api('POST', `/api/ingredients/${oignon}/tags`, { tagId: legume }))
      .status,
    201,
  )
  const multi = await api('POST', `/api/ingredients/${oignon}/tags`, {
    tagId: aromate,
  })
  assert.equal(multi.status, 201)
  assert.deepEqual(
    multi.body.tags.map((t) => t.key),
    ['epice-et-aromate', 'legume'],
  )

  for (const body of [
    {},
    { tagId: '1' },
    { tagId: 0 },
    { tagId: 1.5 },
    [],
    null,
  ]) {
    const invalid = await api('POST', `/api/ingredients/${carotte}/tags`, body)
    assert.equal(invalid.status, 400, JSON.stringify(body))
    assert.equal(invalid.body.error, 'INVALID_TAG')
  }
  assert.equal(
    (await api('POST', `/api/ingredients/${carotte}/tags`, '{}', 'text/plain'))
      .status,
    415,
  )
  const noTag = await api('POST', `/api/ingredients/${carotte}/tags`, {
    tagId: 99999,
  })
  assert.deepEqual([noTag.status, noTag.body.error], [404, 'TAG_NOT_FOUND'])
  const noIngredient = await api('POST', '/api/ingredients/99999/tags', {
    tagId: legume,
  })
  assert.deepEqual(
    [noIngredient.status, noIngredient.body.error],
    [404, 'INGREDIENT_NOT_FOUND'],
  )
  assert.equal(
    (await api('GET', `/api/ingredients/${carotte}/tags`)).status,
    405,
  )
})

test('lectures : ids, clés et libellés pour le filtre (#27), tags des ingrédients', async () => {
  const legume = await tagId('legume')
  const aromate = await tagId('epice-et-aromate')
  const L = { id: legume, key: 'legume', label: 'Légume' }
  const A = { id: aromate, key: 'epice-et-aromate', label: 'Épice et aromate' }

  const tags = await api('GET', '/api/tags')
  assert.equal(tags.status, 200)
  assert.equal(tags.body.length, TAG_VOCABULARY.length)
  const byKey = Object.fromEntries(tags.body.map((t) => [t.key, t]))
  // Compteurs issus des associations réelles ; une recette n'est comptée qu'une fois
  // (« Soupe de légumes » et « Conservée », qui contient la Carotte).
  assert.deepEqual(byKey.legume, { ...L, ingredientCount: 3, recipeCount: 2 })
  assert.deepEqual(byKey['epice-et-aromate'], {
    ...A,
    ingredientCount: 1,
    recipeCount: 1,
  })
  assert.deepEqual(byKey.cereale.ingredientCount, 0)
  assert.deepEqual(
    tags.body.map((t) => t.key),
    [...tags.body.map((t) => t.key)].sort(),
  )

  const ingredients = await api('GET', '/api/ingredients')
  assert.equal(ingredients.status, 200)
  const manuel = ingredients.body.find((i) => i.canonicalName === 'Manuel')
  assert.deepEqual(manuel, {
    id: 51,
    canonicalName: 'Manuel',
    ciqualCode: null,
    tags: [],
  })
  const carotte = ingredients.body.find((i) => i.canonicalName === 'Carotte')
  assert.equal(carotte.ciqualCode, '20009')
  assert.deepEqual(carotte.tags, [L])
  assert.equal((await api('GET', `/api/ingredients/${carotte.id}`)).status, 200)
  assert.equal((await api('GET', '/api/ingredients/99999')).status, 404)

  const recipes = await api('GET', '/api/recipes')
  const soupe = recipes.body.find((r) => r.title === 'Soupe de légumes')
  assert.deepEqual(soupe.ingredientTags, [A, L])
  assert.deepEqual(
    recipes.body.find((r) => r.title === 'Pain').ingredientTags,
    [],
  )
  assert.deepEqual(
    recipes.body.find((r) => r.title === 'Conservée').ingredientTags,
    [L],
  )

  const detail = await api('GET', `/api/recipes/${soupe.id}`)
  assert.deepEqual(detail.body.ingredientTags, [A, L])
  assert.deepEqual(
    detail.body.ingredients.map((l) => l.tags),
    [[L], [L], [A, L]],
  )
})

test('retrait : seul le lien disparaît, ingrédients et recettes conservés', async () => {
  const before = await counts()
  const oignon = await ingredientId('Oignon')
  const aromate = await tagId('epice-et-aromate')

  const removed = await api(
    'DELETE',
    `/api/ingredients/${oignon}/tags/${aromate}`,
  )
  assert.equal(removed.status, 204)
  const again = await api(
    'DELETE',
    `/api/ingredients/${oignon}/tags/${aromate}`,
  )
  assert.deepEqual([again.status, again.body.error], [404, 'TAG_NOT_ASSIGNED'])
  const unknown = await api('DELETE', `/api/ingredients/99999/tags/${aromate}`)
  assert.deepEqual(
    [unknown.status, unknown.body.error],
    [404, 'INGREDIENT_NOT_FOUND'],
  )
  assert.equal(
    (await api('DELETE', `/api/ingredients/${oignon}/tags/0`)).status,
    400,
  )
  assert.equal(
    (await api('GET', `/api/ingredients/${oignon}/tags/${aromate}`)).status,
    405,
  )

  assert.deepEqual(await counts(), before)
  const ingredient = await api('GET', `/api/ingredients/${oignon}`)
  assert.deepEqual(
    ingredient.body.tags.map((t) => t.key),
    ['legume'],
  )
})

test('un tag encore associé ne peut pas être supprimé', async () => {
  const before = await counts()
  const temporary = await db.tag.create({
    data: { key: 'temporaire', label: 'Temporaire' },
  })
  const carotte = await ingredientId('Carotte')
  assert.equal(
    (
      await api('POST', `/api/ingredients/${carotte}/tags`, {
        tagId: temporary.id,
      })
    ).status,
    201,
  )
  await assert.rejects(db.tag.delete({ where: { id: temporary.id } }))
  assert.equal(
    (await api('DELETE', `/api/ingredients/${carotte}/tags/${temporary.id}`))
      .status,
    204,
  )
  await db.tag.delete({ where: { id: temporary.id } })
  assert.deepEqual(await counts(), before)
})

test('association obsolète : tag désactivé masqué, conservé, retirable, réactivable', async () => {
  const legume = await tagId('legume')
  const carotte = await ingredientId('Carotte')
  const oignon = await ingredientId('Oignon')
  assert.equal(await db.ingredientTag.count({ where: { tagId: legume } }), 3)

  const reduced = await sync(
    TAG_VOCABULARY.filter((label) => label !== 'Légume'),
  )
  assert.equal(reduced.deactivated, 1)
  assert.equal(reduced.obsoleteAssociations, 3)
  // Désactivé : jamais supprimé, associations conservées mais invisibles.
  assert.equal(await db.ingredientTag.count({ where: { tagId: legume } }), 3)
  const tags = await api('GET', '/api/tags')
  assert.ok(!tags.body.some((t) => t.key === 'legume'))
  assert.deepEqual(
    (await api('GET', `/api/ingredients/${carotte}`)).body.tags,
    [],
  )
  const recipes = await api('GET', '/api/recipes')
  assert.deepEqual(
    recipes.body.find((r) => r.title === 'Soupe de légumes').ingredientTags,
    [],
  )
  // On ne peut plus attribuer un tag désactivé, mais on peut retirer l'association.
  const blocked = await api('POST', `/api/ingredients/${carotte}/tags`, {
    tagId: legume,
  })
  assert.deepEqual([blocked.status, blocked.body.error], [409, 'TAG_INACTIVE'])
  assert.equal(
    (await api('DELETE', `/api/ingredients/${oignon}/tags/${legume}`)).status,
    204,
  )
  assert.equal(await db.ingredientTag.count({ where: { tagId: legume } }), 2)

  const restored = await sync()
  assert.equal(restored.reactivated, 1)
  const after = await api('GET', '/api/tags')
  assert.equal(after.body.find((t) => t.key === 'legume').ingredientCount, 2)
})

test('mise à jour CIQUAL : tags, associations et liaison conservés', async () => {
  const carotte = await ingredientId('Carotte')
  const before = await db.ingredientTag.findMany({
    orderBy: [{ ingredientId: 'asc' }, { tagId: 'asc' }],
  })
  assert.ok(before.length > 0)
  const tagsBefore = await db.tag.findMany({ orderBy: { id: 'asc' } })

  const next = structuredClone(sample)
  next.foods[0].values = { ...next.foods[0].values, 328: '31,5' }
  await importCiqual(db, encode(next))

  assert.deepEqual(
    await db.ingredientTag.findMany({
      orderBy: [{ ingredientId: 'asc' }, { tagId: 'asc' }],
    }),
    before,
  )
  assert.deepEqual(
    await db.tag.findMany({ orderBy: { id: 'asc' } }),
    tagsBefore,
  )
  assert.equal(
    (await db.ingredient.findUniqueOrThrow({ where: { id: carotte } }))
      .ciqualCode,
    '20009',
  )
})

test('seed relancé : recettes et tags utilisateur préservés, démo restaurée', async () => {
  const first = await seedDatabase(db)
  assert.equal(first.created, 0)
  assert.equal(first.associationsAdded, 7)
  assert.deepEqual(first.skippedIngredients, [])

  const beurre = await ingredientId('Beurre')
  const viande = await tagId('viande')
  assert.equal(
    (await api('POST', `/api/ingredients/${beurre}/tags`, { tagId: viande }))
      .status,
    201,
  )
  const snapshot = () =>
    Promise.all([
      db.recipe.findMany({
        orderBy: { id: 'asc' },
        include: { ingredients: true, steps: true },
      }),
      db.ingredientTag.findMany({
        orderBy: [{ ingredientId: 'asc' }, { tagId: 'asc' }],
      }),
    ])
  const before = await snapshot()

  const second = await seedDatabase(db)
  assert.equal(second.associationsAdded, 0)
  assert.deepEqual(await snapshot(), before)
  assert.ok(
    await db.ingredientTag.findUnique({
      where: { ingredientId_tagId: { ingredientId: beurre, tagId: viande } },
    }),
  )

  // Politique documentée : une association de démonstration retirée est restaurée.
  const sucre = await ingredientId('Sucre')
  const sucreTag = await tagId('produit-sucre')
  assert.equal(
    (await api('DELETE', `/api/ingredients/${sucre}/tags/${sucreTag}`)).status,
    204,
  )
  assert.equal((await seedDatabase(db)).associationsAdded, 1)
  assert.deepEqual(await snapshot(), before)
  assert.deepEqual(await db.$queryRawUnsafe('PRAGMA foreign_key_check'), [])
})
