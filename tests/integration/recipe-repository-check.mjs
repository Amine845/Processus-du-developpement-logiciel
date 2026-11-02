import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createPersistence } from '../../dist-server/infrastructure/prisma.js'
import { createPrismaRecipeRepository } from '../../dist-server/infrastructure/prisma-recipe-repository.js'
import { RecipeReadError } from '../../dist-server/domain/recipe-repository.js'
import { createRecipeServer, startServer } from '../../dist-server/server.js'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))
const temp = mkdtempSync(join(tmpdir(), 'recipe-repository-'))
const url = `file:${join(temp, 'recipes.db').replaceAll('\\', '/')}`
const persistence = createPersistence(url)
const repository = createPrismaRecipeRepository(persistence.client)
let runtime

after(async () => {
  try {
    await runtime?.close()
  } finally {
    try {
      await persistence.close()
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }
})

before(async () => {
  // Copy only the schema/migrations. Never load any developer .env.
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
    {
      cwd: temp,
      env: { ...process.env, DATABASE_URL: url },
      encoding: 'utf8',
    },
  )
  assert.equal(
    migration.status,
    0,
    migration.error?.message ?? migration.stdout + migration.stderr,
  )
  await persistence.connect()
})

test('empty list, deterministic list, exact detail, ordered steps and absent id', async () => {
  assert.deepEqual(await repository.findAll(), [])
  assert.equal(await repository.findById(999999), null)
  const db = persistence.client
  // Explicit ids and reverse insertion defeat reliance on insertion/title order.
  await db.recipe.create({ data: { id: 20, title: 'A soupe', servings: 2 } })
  await db.recipe.create({
    data: {
      id: 10,
      title: 'Z soupe',
      servings: 3,
      description: 'Description',
      ingredients: {
        create: [
          {
            position: 3,
            quantity: 0.5,
            unit: 'l',
            ingredient: { create: { id: 8, canonicalName: 'Eau' } },
          },
          {
            position: 1,
            quantity: 200,
            unit: 'g',
            ingredient: { create: { id: 9, canonicalName: 'Carotte' } },
          },
        ],
      },
      steps: {
        create: [
          { position: 3, instruction: 'Servir.' },
          { position: 1, instruction: 'Couper.' },
          { position: 2, instruction: 'Cuire.' },
        ],
      },
    },
  })
  const summaries = [
    { id: 10, title: 'Z soupe', servings: 3, description: 'Description' },
    { id: 20, title: 'A soupe', servings: 2, description: null },
  ]
  assert.deepEqual(await repository.findAll(), summaries)
  assert.deepEqual(await repository.findAll(), summaries)
  assert.deepEqual(await repository.findById(10), {
    ...summaries[0],
    ingredients: [
      {
        ingredientId: 9,
        canonicalName: 'Carotte',
        position: 1,
        quantity: 200,
        unit: 'g',
      },
      {
        ingredientId: 8,
        canonicalName: 'Eau',
        position: 3,
        quantity: 0.5,
        unit: 'l',
      },
    ],
    steps: [
      { position: 1, instruction: 'Couper.' },
      { position: 2, instruction: 'Cuire.' },
      { position: 3, instruction: 'Servir.' },
    ],
  })
  assert.deepEqual(await repository.findById(20), {
    ...summaries[1],
    ingredients: [],
    steps: [],
  })
  assert.equal(await repository.findById(999999), null)
  for (const id of [0, -1, 1.5, NaN, 2147483648]) {
    await assert.rejects(repository.findById(id), RangeError)
  }
})

test('connection failure is distinct from absence and contains no Prisma details', async () => {
  const broken = createPersistence(
    `file:${join(temp, 'missing', 'private.db').replaceAll('\\', '/')}`,
  )
  try {
    const repo = createPrismaRecipeRepository(broken.client)
    for (const read of [() => repo.findAll(), () => repo.findById(1)]) {
      await assert.rejects(read, (error) => {
        assert.ok(error instanceof RecipeReadError)
        assert.equal(error.message, 'Unable to read recipes')
        assert.equal(error.cause, undefined)
        assert.ok(!JSON.stringify(error).includes(temp))
        return true
      })
    }
  } finally {
    await broken.close()
  }
})

test('HTTP reads use the repository; close is idempotent and stops listening', async () => {
  runtime = await startServer(url, 0)
  const base = `http://127.0.0.1:${runtime.server.address().port}`
  const list = await fetch(`${base}/api/recipes`)
  assert.equal(list.status, 200)
  assert.deepEqual(await list.json(), await repository.findAll())
  const detail = await fetch(`${base}/api/recipes/10`)
  assert.equal(detail.status, 200)
  assert.deepEqual(await detail.json(), await repository.findById(10))
  const missing = await fetch(`${base}/api/recipes/999999`)
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'RECIPE_NOT_FOUND' })
  assert.equal((await fetch(`${base}/api/recipes/2147483648`)).status, 400)
  await Promise.all([runtime.close(), runtime.close()])
  assert.equal(runtime.server.listening, false)
})

test('injected repository failures return a sanitized HTTP response', async () => {
  const server = createRecipeServer({
    findAll: async () => {
      throw new Error('private connection secret')
    },
    findById: async () => {
      throw new Error('private connection secret')
    },
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    for (const path of ['/api/recipes', '/api/recipes/1']) {
      const result = await fetch(
        `http://127.0.0.1:${server.address().port}${path}`,
      )
      assert.equal(result.status, 503)
      assert.deepEqual(await result.json(), { error: 'RECIPE_READ_FAILED' })
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
