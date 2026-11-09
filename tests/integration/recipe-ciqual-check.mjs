import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  readdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'
import { importCiqual } from '../../scripts/ciqual.mjs'
import { createRecipeServer } from '../../dist-server/server/server.js'
import { createPrismaRecipeRepository } from '../../dist-server/server/infrastructure/prisma-recipe-repository.js'
import { createPrismaCiqualRepository } from '../../dist-server/server/infrastructure/prisma-ciqual-repository.js'
const require = createRequire(import.meta.url)

test('legacy collision migration, POST/GET/PUT/reload, exact identities, inactive retention, validation and rollback', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'recipe-ciqual-'))
  const url = `file:${join(temp, 'test.db').replaceAll('\\', '/')}`
  const schema = join(temp, 'prisma')
  writeFileSync(join(temp, 'test.db'), '')
  mkdirSync(join(schema, 'migrations'), { recursive: true })
  cpSync('src/server/prisma/schema.prisma', join(schema, 'schema.prisma'))
  const migrations = 'src/server/prisma/migrations'
  const addition = '20261105140000_ingredient_identity'
  for (const name of readdirSync(migrations))
    if (name !== addition)
      cpSync(join(migrations, name), join(schema, 'migrations', name), {
        recursive: true,
      })
  const deploy = () => {
    const r = spawnSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'migrate',
        'deploy',
        '--schema',
        join(schema, 'schema.prisma'),
      ],
      { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' },
    )
    assert.equal(r.status, 0, r.stdout + r.stderr)
  }
  let db = new PrismaClient({ datasources: { db: { url } } })
  let server
  let base
  const start = async () => {
    server = createRecipeServer(
      createPrismaRecipeRepository(db),
      createPrismaCiqualRepository(db),
    )
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${server.address().port}`
  }
  const stop = async () => {
    server?.closeAllConnections()
    if (server) await new Promise((resolve) => server.close(resolve))
    server = undefined
  }
  const call = (method, path, body) =>
    fetch(`${base}/api/recipes${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const input = (
    title,
    ingredients = [
      {
        canonicalName: 'Forged label',
        ciqualCode: '20009',
        quantity: 200,
        unit: 'g',
      },
    ],
  ) => ({
    title,
    description: '',
    servings: 2,
    ingredients,
    steps: [{ instruction: 'Couper' }, { instruction: 'Cuire' }],
  })
  const snapshot = async () => ({
    recipes: await db.recipe.findMany({
      include: { ingredients: true, steps: true },
      orderBy: { id: 'asc' },
    }),
    ingredients: await db.ingredient.findMany({ orderBy: { id: 'asc' } }),
  })
  try {
    deploy()
    await importCiqual(db, readFileSync('data/ciqual/subset-2025.json'))
    await db.$executeRawUnsafe(
      'INSERT INTO Ingredient (id,canonicalName,ciqualCode) VALUES (10,?,?),(11,?,?),(12,?,NULL)',
      'Legacy A',
      '20009',
      'Legacy B',
      '20009',
      'Carotte, crue',
    )
    const old = await db.recipe.create({
      data: {
        title: 'Historique',
        servings: 1,
        ingredients: {
          create: [
            { ingredientId: 11, quantity: 5, unit: 'g', position: 1 },
            { ingredientId: 12, quantity: 2, unit: 'g', position: 2 },
          ],
        },
        steps: { create: { position: 1, instruction: 'Servir' } },
      },
    })
    cpSync(join(migrations, addition), join(schema, 'migrations', addition), {
      recursive: true,
    })
    deploy()
    assert.equal(
      (await db.ingredient.findUnique({ where: { id: 10 } })).identityKey,
      'ciqual:20009',
    )
    assert.equal(
      (await db.ingredient.findUnique({ where: { id: 11 } })).identityKey,
      'legacy:11',
    )
    assert.equal(
      (await db.ingredient.findUnique({ where: { id: 12 } })).ciqualCode,
      null,
    )
    const origin = await db.ciqualFood.findUnique({ where: { code: '20009' } })
    await db.ciqualFood.create({
      data: {
        code: '20010',
        name: origin.name,
        version: origin.version,
        importId: origin.importId,
        category: 'food',
      },
    })
    await db.ciqualFood.update({
      where: { code: '20009' },
      data: { category: 'food' },
    })
    const historical = await db.recipe.findUnique({
      where: { id: old.id },
      include: { ingredients: true },
    })
    await start()
    const selected = await (
      await fetch(`${base}/api/ciqual/foods?q=carotte&category=food`)
    ).json()
    assert.ok(selected.results.some((f) => f.code === '20009'))
    const createdResponse = await call('POST', '', input('CIQUAL'))
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    assert.equal(created.description, null)
    assert.equal(created.ingredients[0].ciqualCode, '20009')
    assert.equal(created.ingredients[0].canonicalName, origin.name)
    assert.equal(created.ingredients[0].ingredientId, 10)
    assert.notEqual(
      created.ingredients[0].ingredientId,
      Number(created.ingredients[0].ciqualCode),
    )
    assert.deepEqual(
      created.steps.map((s) => s.instruction),
      ['Couper', 'Cuire'],
    )
    const variant = await (
      await call(
        'POST',
        '',
        input('Variante', [
          {
            canonicalName: origin.name,
            ciqualCode: '20010',
            quantity: 1,
            unit: 'kg',
          },
        ]),
      )
    ).json()
    const manual = await (
      await call(
        'POST',
        '',
        input('Manuel', [
          {
            canonicalName: origin.name,
            ciqualCode: null,
            quantity: 1,
            unit: 'piece',
          },
        ]),
      )
    ).json()
    assert.notEqual(
      variant.ingredients[0].ingredientId,
      created.ingredients[0].ingredientId,
    )
    assert.equal(manual.ingredients[0].ingredientId, 12)
    assert.equal(manual.ingredients[0].ciqualCode, null)
    const omitted = await (
      await call(
        'POST',
        '',
        input('Manuel ancien contrat', [
          { canonicalName: origin.name, quantity: 1, unit: 'ml' },
        ]),
      )
    ).json()
    assert.equal(omitted.ingredients[0].ciqualCode, null)
    const updated = await call(
      'PUT',
      `/${created.id}`,
      input('CIQUAL', [
        {
          canonicalName: origin.name,
          ciqualCode: '20010',
          quantity: 20,
          unit: 'g',
        },
      ]),
    )
    assert.equal(updated.status, 200)
    assert.equal((await updated.json()).ingredients[0].ciqualCode, '20010')
    assert.equal(
      (await db.ingredient.findUnique({ where: { id: 10 } })).ciqualCode,
      '20009',
    )
    assert.deepEqual(
      await db.recipe.findUnique({
        where: { id: old.id },
        include: { ingredients: true },
      }),
      historical,
    )
    await db.ciqualFood.update({
      where: { code: '20010' },
      data: { active: false },
    })
    assert.equal(
      (
        await call(
          'PUT',
          `/${created.id}`,
          input('CIQUAL', [
            {
              canonicalName: origin.name,
              ciqualCode: '20010',
              quantity: 21,
              unit: 'g',
            },
          ]),
        )
      ).status,
      200,
    )
    const before = await snapshot()
    for (const [code, expected] of [
      ['999999999', 'INVALID_CIQUAL_CODE'],
      ['20010', 'INACTIVE_CIQUAL_CODE'],
    ]) {
      const response = await call(
        'POST',
        '',
        input(`Bad ${code}`, [
          { canonicalName: 'New orphan', quantity: 1, unit: 'g' },
          {
            canonicalName: origin.name,
            ciqualCode: code,
            quantity: 1,
            unit: 'g',
          },
        ]),
      )
      assert.equal(response.status, 400)
      assert.equal((await response.json()).error, expected)
      assert.deepEqual(await snapshot(), before)
    }
    for (const patch of [
      { ingredients: [] },
      { steps: [] },
      { steps: [{ instruction: ' ' }] },
      { ingredients: [{ canonicalName: 'X', quantity: 0, unit: 'g' }] },
      { ingredients: [{ canonicalName: 'X', quantity: '', unit: 'g' }] },
      { ingredients: [{ canonicalName: 'X', quantity: 1, unit: 'cup' }] },
      {
        ingredients: [
          { canonicalName: 'X', quantity: 1, unit: 'g', ciqualCode: 20009 },
        ],
      },
    ]) {
      assert.equal(
        (await call('POST', '', { ...input('Invalid'), ...patch })).status,
        400,
      )
      assert.deepEqual(await snapshot(), before)
    }
    // Late SQL failure occurs after ingredient creation; the transaction rolls everything back.
    await db.$executeRawUnsafe(
      "CREATE TRIGGER fail_recipe_step BEFORE INSERT ON RecipeStep WHEN NEW.instruction = 'FAIL' BEGIN SELECT RAISE(ABORT, 'private sql error'); END",
    )
    const failed = await call('POST', '', {
      ...input('Failure', [
        { canonicalName: 'Must roll back', quantity: 1, unit: 'g' },
      ]),
      steps: [{ instruction: 'FAIL' }],
    })
    assert.equal(failed.status, 503)
    assert.deepEqual(await failed.json(), { error: 'RECIPE_WRITE_FAILED' })
    assert.deepEqual(await snapshot(), before)
    const failedPut = await call('PUT', `/${created.id}`, {
      ...input('Failure', [
        { canonicalName: 'Must roll back', quantity: 1, unit: 'g' },
      ]),
      steps: [{ instruction: 'FAIL' }],
    })
    assert.equal(failedPut.status, 503)
    assert.deepEqual(await snapshot(), before)
    await stop()
    await db.$disconnect()
    db = new PrismaClient({ datasources: { db: { url } } })
    await start()
    const reloaded = await (await call('GET', `/${created.id}`)).json()
    assert.equal(reloaded.ingredients[0].ciqualCode, '20010')
    assert.equal(reloaded.ingredients[0].quantity, 21)
    assert.equal(
      (await (await call('GET', `/${manual.id}`)).json()).ingredients[0]
        .ciqualCode,
      null,
    )
    const preflight = await fetch(`${base}/api/recipes`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    })
    assert.equal(preflight.status, 204)
    assert.equal(
      preflight.headers.get('access-control-allow-origin'),
      'http://localhost:5173',
    )
  } finally {
    await stop()
    await db.$disconnect()
    rmSync(temp, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
  }
})
