import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { seedDatabase } from '../../dist-server/server/prisma/seed.js'
import { startServer } from '../../dist-server/server/server.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
function run(script, url, success = true) {
  // npm CLI via Node works on Windows too, without a shell for npm.cmd.
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, 'run', script],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: url },
      encoding: 'utf8',
    },
  )
  if (success) {
    assert.equal(
      result.status,
      0,
      result.error?.message ?? result.stdout + result.stderr,
    )
  } else {
    assert.notEqual(result.status, 0)
    assert.ok(!result.error, result.error?.message)
    assert.match(result.stdout + result.stderr, /Échec du seed/)
  }
}

test('public seed command: complete data, rerun, HTTP, preservation and rollback', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'recipe-seed-'))
  writeFileSync(join(temp, 'demo.db'), '', { flag: 'wx' })
  const url = `file:${join(temp, 'demo.db').replaceAll('\\', '/')}`
  const db = new PrismaClient({ datasources: { db: { url } } })
  let server
  try {
    run('db:init', url)
    const snapshot = () =>
      db.recipe.findMany({
        orderBy: { id: 'asc' },
        include: {
          ingredients: {
            orderBy: { position: 'asc' },
            include: { ingredient: true },
          },
          steps: { orderBy: { position: 'asc' } },
        },
      })
    const initial = await snapshot()
    assert.deepEqual(
      initial.map((r) => r.title),
      [
        'Gâteau au chocolat fondant',
        'Pâte à crêpes traditionnelle',
        'Omelette nature rapide',
      ],
    )
    assert.deepEqual(
      initial.map((r) => r.servings),
      [6, 4, 1],
    )
    assert.deepEqual(
      initial.map((r) => r.ingredients.length),
      [5, 4, 2],
    )
    assert.deepEqual(
      initial.map((r) => r.steps.length),
      [4, 4, 3],
    )
    assert.equal(await db.ingredient.count(), 6)
    for (const recipe of initial) {
      for (const rows of [recipe.ingredients, recipe.steps]) {
        assert.deepEqual(
          rows.map((r) => r.position),
          rows.map((_, i) => i + 1),
        )
      }
      assert.ok(
        recipe.ingredients.every(
          (r) => r.quantity > 0 && ['g', 'ml', 'piece'].includes(r.unit),
        ),
      )
      assert.ok(recipe.steps.every((r) => r.instruction.trim().length > 0))
    }
    assert.equal(
      initial[0].ingredients[1].ingredientId,
      initial[1].ingredients[1].ingredientId,
    )
    run('db:seed', url)
    assert.deepEqual(await snapshot(), initial)
    const custom = await db.recipe.create({
      data: {
        title: 'Ma recette personnelle',
        servings: 2,
        ingredients: {
          create: [
            {
              position: 1,
              quantity: 100,
              unit: 'g',
              ingredient: { create: { canonicalName: 'Riz personnel' } },
            },
          ],
        },
        steps: { create: [{ position: 1, instruction: 'Cuire le riz.' }] },
      },
    })
    const withCustom = await snapshot()
    await db.recipe.update({
      where: { id: initial[0].id },
      data: { servings: 99 },
    })
    await db.recipeIngredient.update({
      where: { id: initial[0].ingredients[0].id },
      data: { quantity: 1 },
    })
    await db.recipeStep.create({
      data: { recipeId: initial[0].id, position: 99, instruction: 'Obsolète.' },
    })
    await db.recipeIngredient.create({
      data: {
        recipeId: initial[0].id,
        ingredientId: initial[0].ingredients[0].ingredientId,
        position: 99,
        quantity: 1,
        unit: 'g',
      },
    })
    run('db:seed', url)
    assert.deepEqual(await snapshot(), withCustom)
    assert.ok(await db.recipe.findUnique({ where: { id: custom.id } }))
    assert.equal(await db.ingredient.count(), 7)
    assert.deepEqual(await db.$queryRawUnsafe('PRAGMA foreign_key_check'), [])

    server = await startServer(url, 0)
    const base = `http://127.0.0.1:${server.server.address().port}`
    const list = await fetch(`${base}/api/recipes`)
    assert.equal(list.status, 200)
    assert.equal((await list.json()).length, 4)
    const response = await fetch(`${base}/api/recipes/${initial[0].id}`)
    assert.equal(response.status, 200)
    const detail = await response.json()
    assert.equal(detail.ingredients[0].canonicalName, 'Chocolat noir')
    assert.equal(detail.ingredients[0].quantity, 200)
    assert.equal(detail.steps.length, 4)
    await server.close()
    server = undefined

    // Force an error late in the transaction, after earlier recipes were changed.
    await db.recipe.update({
      where: { id: initial[0].id },
      data: { servings: 99 },
    })
    const beforeFailure = await snapshot()
    await db.$executeRawUnsafe(`CREATE TRIGGER fail_demo_seed BEFORE UPDATE ON RecipeStep
      WHEN NEW.recipeId = ${initial[2].id}
      BEGIN SELECT RAISE(ABORT, 'forced seed failure'); END`)
    await assert.rejects(seedDatabase(db))
    assert.deepEqual(await snapshot(), beforeFailure)
    run('db:seed', url, false)
    assert.deepEqual(await snapshot(), beforeFailure)
    await db.$executeRawUnsafe('DROP TRIGGER fail_demo_seed')
  } finally {
    await server?.close()
    await db.$disconnect()
    rmSync(temp, { recursive: true, force: true })
  }
})
