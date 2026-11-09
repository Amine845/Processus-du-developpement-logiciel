import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'
import { createPrismaRecipeRepository } from '../../dist-server/server/infrastructure/prisma-recipe-repository.js'
import { createPrismaTagRepository } from '../../dist-server/server/infrastructure/prisma-tag-repository.js'
import { createPrismaRecipeTagRepository } from '../../dist-server/server/infrastructure/prisma-recipe-tag-repository.js'
import { syncRecipeTagVocabulary } from '../../dist-server/server/infrastructure/recipe-tag-vocabulary-sync.js'
import { syncTagVocabulary } from '../../dist-server/server/infrastructure/tag-vocabulary-sync.js'
import { createRecipeServer } from '../../dist-server/server/server.js'
const require = createRequire(import.meta.url)

test('recipe tags: additive migration, independent vocabularies, HTTP lifecycle and persistence', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'recipe-tags-'))
  const url = `file:${join(temp, 'test.db')}`
  const db = new PrismaClient({ datasources: { db: { url } } })
  let server
  const migration = '20261109150000_recipe_tags'
  const deploy = () => {
    const result = spawnSync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      {
        cwd: temp,
        env: { ...process.env, DATABASE_URL: url },
        encoding: 'utf8',
      },
    )
    assert.equal(result.status, 0, result.stdout + result.stderr)
  }
  const recipes = createPrismaRecipeRepository(db)
  const tags = createPrismaRecipeTagRepository(db)
  const start = async () => {
    server = createRecipeServer(
      recipes,
      undefined,
      undefined,
      createPrismaTagRepository(db),
      tags,
    )
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    return `http://127.0.0.1:${server.address().port}`
  }
  const close = async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
  try {
    writeFileSync(join(temp, 'test.db'), '')
    mkdirSync(join(temp, 'prisma'))
    cpSync(
      'src/server/prisma/schema.prisma',
      join(temp, 'prisma/schema.prisma'),
    )
    cpSync('src/server/prisma/migrations', join(temp, 'prisma/migrations'), {
      recursive: true,
    })
    rmSync(join(temp, 'prisma/migrations', migration), { recursive: true })
    deploy()
    const recipe = await db.recipe.create({
      data: { title: 'Avant migration', servings: 2 },
    })
    const ingredient = await db.ingredient.create({
      data: { canonicalName: 'Carotte' },
    })
    await db.$transaction((tx) =>
      syncTagVocabulary(tx, ['Légume'], { Carotte: ['Légume'] }),
    )
    const before = await db.ingredientTag.findMany()
    cpSync(
      `src/server/prisma/migrations/${migration}`,
      join(temp, 'prisma/migrations', migration),
      { recursive: true },
    )
    deploy()
    assert.equal(
      (await db.recipe.findUnique({ where: { id: recipe.id } })).title,
      recipe.title,
    )
    assert.deepEqual(await db.ingredientTag.findMany(), before)
    const report = await db.$transaction((tx) => syncRecipeTagVocabulary(tx))
    assert.equal(report.created, 5)
    assert.equal(
      (await db.$transaction((tx) => syncRecipeTagVocabulary(tx))).created,
      0,
    )
    const gourmand = await db.recipeTag.findUniqueOrThrow({
      where: { key: 'gourmand' },
    })
    const rapide = await db.recipeTag.findUniqueOrThrow({
      where: { key: 'rapide' },
    })
    let base = await start()
    const api = (method, path, body) =>
      fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    const path = `/api/recipes/${recipe.id}/tags`
    assert.equal((await api('POST', path, { tagId: gourmand.id })).status, 201)
    assert.equal((await api('POST', path, { tagId: gourmand.id })).status, 200)
    assert.equal((await api('POST', path, { tagId: rapide.id })).status, 201)
    assert.equal(await db.recipeTagLink.count(), 2)
    const detail = await (await api('GET', `/api/recipes/${recipe.id}`)).json()
    assert.deepEqual(
      detail.recipeTags.map((t) => t.key),
      ['gourmand', 'rapide'],
    )
    assert.deepEqual(detail.ingredientTags, [])
    assert.deepEqual(
      (await (await api('GET', '/api/recipes')).json())[0].recipeTags,
      detail.recipeTags,
    )
    assert.equal(
      (await (await api('GET', '/api/recipe-tags')).json()).find(
        (t) => t.id === gourmand.id,
      ).recipeCount,
      1,
    )
    assert.equal((await api('POST', path, { tagId: '1' })).status, 400)
    assert.equal((await api('POST', path, { tagId: 999999 })).status, 404)
    assert.equal(
      (await api('POST', '/api/recipes/999999/tags', { tagId: gourmand.id }))
        .status,
      404,
    )
    assert.equal(
      (
        await api('POST', '/api/recipes/2147483648/tags', {
          tagId: gourmand.id,
        })
      ).status,
      400,
    )
    assert.equal((await api('GET', path)).status, 405)
    assert.equal((await api('POST', '/api/recipe-tags', {})).status, 405)
    // Updating recipe content preserves direct associations.
    const updated = await api('PUT', `/api/recipes/${recipe.id}`, {
      title: recipe.title,
      servings: 3,
      ingredients: [{ canonicalName: 'Carotte', quantity: 1, unit: 'g' }],
      steps: [{ instruction: 'Servir' }],
    })
    assert.equal(updated.status, 200)
    assert.equal((await updated.json()).recipeTags.length, 2)
    await db.$transaction((tx) => syncTagVocabulary(tx))
    assert.equal((await recipes.findById(recipe.id)).recipeTags.length, 2)
    // Deactivation hides the tag, refuses assignment and still allows removal.
    await db.$transaction((tx) => syncRecipeTagVocabulary(tx, ['Rapide']))
    assert.deepEqual(
      (await recipes.findById(recipe.id)).recipeTags.map((t) => t.key),
      ['rapide'],
    )
    assert.equal((await api('POST', path, { tagId: gourmand.id })).status, 409)
    assert.equal((await api('DELETE', `${path}/${gourmand.id}`)).status, 204)
    assert.equal((await api('DELETE', `${path}/${gourmand.id}`)).status, 404)
    await db.$transaction((tx) => syncRecipeTagVocabulary(tx))
    assert.equal((await api('POST', path, { tagId: gourmand.id })).status, 201)
    await assert.rejects(db.recipeTag.delete({ where: { id: gourmand.id } }))
    await close()
    await db.$disconnect()
    base = await start()
    assert.equal(
      (await (await api('GET', `/api/recipes/${recipe.id}`)).json()).recipeTags
        .length,
      2,
    )
    assert.equal((await api('DELETE', `/api/recipes/${recipe.id}`)).status, 204)
    assert.equal(await db.recipeTagLink.count(), 0)
    assert.equal(await db.recipeTag.count(), 5)
    assert.ok(await db.ingredient.findUnique({ where: { id: ingredient.id } }))
  } finally {
    if (server?.listening) await close()
    await db.$disconnect()
    rmSync(temp, { recursive: true, force: true })
  }
})
