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
import { importCiqual } from '../../scripts/ciqual.mjs'
import { createPersistence } from '../../dist-server/server/infrastructure/prisma.js'
import { createPrismaRecipeRepository } from '../../dist-server/server/infrastructure/prisma-recipe-repository.js'
import { createPrismaCiqualRepository } from '../../dist-server/server/infrastructure/prisma-ciqual-repository.js'
import { createRecipeServer } from '../../dist-server/server/server.js'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))
const temp = mkdtempSync(join(tmpdir(), 'ciqual-api-'))
const url = `file:${join(temp, 'recipes.db').replaceAll('\\', '/')}`
const persistence = createPersistence(url)
const manifest = JSON.parse(
  readFileSync(join(root, 'data/ciqual/source-manifest.json'), 'utf8'),
)
let server
let base

const get = (path) => fetch(`${base}${path}`)
const codes = (body) => body.results.map((food) => food.code)

before(async () => {
  writeFileSync(join(temp, 'recipes.db'), '', { flag: 'wx' })
  // Seuls le schéma et les migrations sont copiés : aucun .env de développeur n'est lu.
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
  const migration = spawnSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    { cwd: temp, env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' },
  )
  assert.equal(
    migration.status,
    0,
    migration.error?.message ?? migration.stdout + migration.stderr,
  )
  await persistence.connect()
  await importCiqual(
    persistence.client,
    readFileSync(join(root, 'data/ciqual/subset-2025.json')),
  )
  server = createRecipeServer(
    createPrismaRecipeRepository(persistence.client),
    createPrismaCiqualRepository(persistence.client),
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
      await persistence.close()
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }
})

test('requête courte ou absente : 400 avec les bornes du contrat', async () => {
  for (const path of [
    '/api/ciqual/foods',
    '/api/ciqual/foods?q=',
    '/api/ciqual/foods?q=c',
    '/api/ciqual/foods?q=%20c%20',
  ]) {
    const response = await get(path)
    assert.equal(response.status, 400, path)
    const body = await response.json()
    assert.equal(body.error, 'QUERY_TOO_SHORT')
    assert.equal(body.minLength, 2)
  }
})

test('aucun résultat : 200 et liste vide', async () => {
  const response = await get('/api/ciqual/foods?q=zzzz')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.results, [])
  assert.equal(body.truncated, false)
})

test('résultat identifié : code, libellé, source, version et base', async () => {
  const body = await (await get('/api/ciqual/foods?q=carotte')).json()
  assert.deepEqual(body.results, [
    {
      code: '20009',
      name: 'Carotte, crue',
      source: manifest.source,
      version: manifest.version,
      baseQuantity: 100,
      baseUnit: 'g',
    },
  ])
  assert.equal(body.limit, 10)
  assert.equal(body.minLength, 2)
})

test('recherche insensible à la casse et aux accents, ordre déterministe', async () => {
  assert.deepEqual(
    codes(await (await get('/api/ciqual/foods?q=ECREME')).json()),
    ['19041'],
  )
  // Deux libellés commençant par « pomme » : le plus court d'abord.
  assert.deepEqual(
    codes(await (await get('/api/ciqual/foods?q=Pomme')).json()),
    ['13039', '4008'],
  )
})

test('limite appliquée, troncature signalée, limite invalide refusée', async () => {
  const body = await (await get('/api/ciqual/foods?q=cru&limit=3')).json()
  assert.equal(body.results.length, 3)
  assert.equal(body.limit, 3)
  assert.equal(body.truncated, true)
  for (const limit of ['0', '51', 'abc']) {
    const response = await get(`/api/ciqual/foods?q=cru&limit=${limit}`)
    assert.equal(response.status, 400, limit)
    assert.equal((await response.json()).error, 'INVALID_LIMIT')
  }
})

test('détail : valeurs, unités et états sans conversion en zéro', async () => {
  const response = await get('/api/ciqual/foods/20009')
  assert.equal(response.status, 200)
  const food = await response.json()
  assert.equal(food.code, '20009')
  assert.equal(food.attribution, manifest.attribution)
  assert.equal(food.active, true)
  assert.deepEqual(
    food.nutrients.map((n) => n.key),
    ['328', '25003', '31000', '40000'],
  )
  const by = Object.fromEntries(food.nutrients.map((n) => [n.key, n]))
  assert.equal(by['328'].status, 'exact')
  assert.equal(by['328'].value, 30.2)
  assert.equal(by['328'].unit, 'kcal')
  assert.equal(by['40000'].status, 'less_than')
  assert.equal(by['40000'].raw, '< 0,5')
  assert.equal(by['40000'].value, null)
  assert.equal(by['40000'].upperBoundExclusive, 0.5)
  for (const nutrient of food.nutrients) assert.ok(nutrient.label)
})

test('code inconnu : 404 ; code invalide : 400 ; méthode : 405', async () => {
  const missing = await get('/api/ciqual/foods/99999999')
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'CIQUAL_FOOD_NOT_FOUND' })
  assert.equal((await get('/api/ciqual/foods/abc')).status, 400)
  const post = await fetch(`${base}/api/ciqual/foods?q=riz`, { method: 'POST' })
  assert.equal(post.status, 405)
})

test('traces et valeurs absentes restent nulles, jamais zéro', async () => {
  const db = persistence.client
  const where = (key) => ({ foodCode_key: { foodCode: '20020', key } })
  await db.ciqualNutrient.update({
    where: where('25003'),
    data: { status: 'trace', raw: 'traces', value: null },
  })
  await db.ciqualNutrient.update({
    where: where('31000'),
    data: { status: 'missing', raw: '-', value: null },
  })
  const food = await (await get('/api/ciqual/foods/20020')).json()
  const by = Object.fromEntries(food.nutrients.map((n) => [n.key, n]))
  for (const key of ['25003', '31000']) {
    assert.equal(by[key].value, null, key)
    assert.equal(by[key].upperBoundExclusive, null, key)
  }
  assert.equal(by['25003'].status, 'trace')
  assert.equal(by['31000'].status, 'missing')
})

test('un aliment inactif n’est plus suggéré mais reste consultable par code', async () => {
  const db = persistence.client
  await db.ciqualFood.update({
    where: { code: '20034' },
    data: { active: false },
  })
  assert.deepEqual(
    (await (await get('/api/ciqual/foods?q=oignon')).json()).results,
    [],
  )
  const detail = await (await get('/api/ciqual/foods/20034')).json()
  assert.equal(detail.active, false)
})

test('chercher ne crée ni ingrédient ni lien : le mode manuel reste sans code', async () => {
  const db = persistence.client
  const before = await db.ingredient.count()
  await get('/api/ciqual/foods?q=carotte')
  await get('/api/ciqual/foods/20009')
  assert.equal(await db.ingredient.count(), before)
  assert.equal(
    await db.ingredient.count({ where: { ciqualCode: { not: null } } }),
    0,
  )
})
