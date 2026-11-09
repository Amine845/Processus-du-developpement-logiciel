import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createPersistence } from '../../dist-server/server/infrastructure/prisma.js'
import { createPrismaRecipeRepository } from '../../dist-server/server/infrastructure/prisma-recipe-repository.js'
import {
  RecipeReadError,
  RecipeConflictError,
} from '../../dist-server/server/domain/recipe-repository.js'
import {
  createRecipeServer,
  startServer,
} from '../../dist-server/server/server.js'

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
  writeFileSync(join(temp, 'recipes.db'), '', { flag: 'wx' })
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
    {
      id: 10,
      title: 'Z soupe',
      servings: 3,
      description: 'Description',
      photoId: null,
      equipment: [],
      recipeTags: [],
      ingredientTags: [],
    },
    {
      id: 20,
      title: 'A soupe',
      servings: 2,
      description: null,
      photoId: null,
      equipment: [],
      recipeTags: [],
      ingredientTags: [],
    },
  ]
  assert.deepEqual(await repository.findAll(), summaries)
  assert.deepEqual(await repository.findAll(), summaries)
  assert.deepEqual(await repository.findById(10), {
    ...summaries[0],
    ingredients: [
      {
        ciqualCode: null,
        ingredientId: 9,
        canonicalName: 'Carotte',
        position: 1,
        quantity: 200,
        unit: 'g',
        tags: [],
      },
      {
        ciqualCode: null,
        ingredientId: 8,
        canonicalName: 'Eau',
        position: 3,
        quantity: 0.5,
        unit: 'l',
        tags: [],
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

test('create, update and delete through HTTP', async () => {
  const server = createRecipeServer(repository)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const call = (method, path, body, type = 'application/json') =>
    fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': type },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const payload = {
    title: 'Gratin',
    description: null,
    servings: 4,
    ingredients: [
      { canonicalName: 'Carotte', quantity: 300, unit: 'g' }, // existing (id 9)
      { canonicalName: 'Pomme de terre', quantity: 1, unit: 'kg' }, // new
    ],
    steps: [{ instruction: 'Couper.' }, { instruction: 'Cuire.' }],
  }
  try {
    // create
    const created = await call('POST', '/api/recipes', payload)
    assert.equal(created.status, 201)
    const recipe = await created.json()
    assert.equal(created.headers.get('location'), `/api/recipes/${recipe.id}`)
    assert.deepEqual(
      recipe.ingredients.map((l) => [l.canonicalName, l.position]),
      [
        ['Carotte', 1],
        ['Pomme de terre', 2],
      ],
    )
    assert.equal(recipe.ingredients[0].ingredientId, 9)
    assert.deepEqual(
      recipe.steps.map((s) => s.position),
      [1, 2],
    )

    // conflict, validation, media type, size
    assert.equal((await call('POST', '/api/recipes', payload)).status, 409)
    const invalid = await call('POST', '/api/recipes', {
      ...payload,
      servings: 0,
    })
    assert.equal(invalid.status, 400)
    assert.equal((await invalid.json()).error, 'INVALID_RECIPE')
    assert.equal(
      (await call('POST', '/api/recipes', payload, 'text/plain')).status,
      415,
    )
    const huge = await call('POST', '/api/recipes', {
      ...payload,
      description: 'x'.repeat(200 * 1024),
    })
    assert.equal(huge.status, 413)

    // update replaces the lists
    const updated = await call('PUT', `/api/recipes/${recipe.id}`, {
      ...payload,
      title: 'Gratin dauphinois',
      steps: [{ instruction: 'Enfourner.' }],
    })
    assert.equal(updated.status, 200)
    const after = await updated.json()
    assert.equal(after.title, 'Gratin dauphinois')
    assert.deepEqual(after.steps, [{ position: 1, instruction: 'Enfourner.' }])
    assert.deepEqual(await repository.findById(recipe.id), after)
    assert.equal(
      (await call('PUT', '/api/recipes/999999', payload)).status,
      404,
    )

    // delete cascades
    assert.equal(
      (await call('DELETE', `/api/recipes/${recipe.id}`)).status,
      204,
    )
    assert.equal((await fetch(`${base}/api/recipes/${recipe.id}`)).status, 404)
    assert.equal(
      (await call('DELETE', `/api/recipes/${recipe.id}`)).status,
      404,
    )
    const db = persistence.client
    assert.equal(
      await db.recipeStep.count({ where: { recipeId: recipe.id } }),
      0,
    )
    assert.equal(
      await db.recipeIngredient.count({ where: { recipeId: recipe.id } }),
      0,
    )
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})

test('injected write failures return sanitized HTTP responses', async () => {
  const fail = async () => {
    throw new Error('private connection secret')
  }
  const server = createRecipeServer({
    findAll: fail,
    findById: fail,
    create: fail,
    update: fail,
    deleteById: fail,
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const body = JSON.stringify({
    title: 'T',
    servings: 1,
    ingredients: [{ canonicalName: 'Manuel', quantity: 1, unit: 'g' }],
    steps: [{ instruction: 'Servir' }],
  })
  try {
    for (const [method, path] of [
      ['POST', '/api/recipes'],
      ['PUT', '/api/recipes/1'],
      ['DELETE', '/api/recipes/1'],
    ]) {
      const result = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'DELETE' ? undefined : body,
      })
      assert.equal(result.status, 503)
      assert.deepEqual(await result.json(), { error: 'RECIPE_WRITE_FAILED' })
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})

test('merged photo API preserves tags, equipment and recipe metadata; deletion cleans files', async () => {
  const { default: sharp } = await import('sharp')
  const { createPhotoStorage } =
    await import('../../dist-server/server/infrastructure/photo-storage.js')
  const { createPrismaRecipeTagRepository } =
    await import('../../dist-server/server/infrastructure/prisma-recipe-tag-repository.js')
  const { createPrismaRecipeEquipmentRepository } =
    await import('../../dist-server/server/infrastructure/prisma-recipe-equipment-repository.js')
  const db = persistence.client
  const photos = createPhotoStorage(join(temp, 'photos'))
  const server = createRecipeServer(
    repository,
    undefined,
    photos,
    undefined,
    createPrismaRecipeTagRepository(db),
    createPrismaRecipeEquipmentRepository(db),
  )
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const recipe = await repository.create({
    title: 'Photo merge integration',
    description: 'Test',
    servings: 2,
    ingredients: [{ canonicalName: 'Carotte', quantity: 100, unit: 'g' }],
    steps: [{ instruction: 'Cuire.' }],
  })
  const tag = await db.recipeTag.create({
    data: { key: 'merge-photo', label: 'Merge photo' },
  })
  const equipment = await db.equipment.create({
    data: { key: 'merge-four', label: 'Merge four' },
  })
  const assign = (path, body) =>
    fetch(`${base}/api/recipes/${recipe.id}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  try {
    assert.equal((await assign('tags', { tagId: tag.id })).status, 201)
    assert.equal(
      (await assign('equipment', { equipmentId: equipment.id })).status,
      201,
    )
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#ff8800' },
    })
      .png()
      .toBuffer()
    const upload = await fetch(`${base}/api/recipes/${recipe.id}/photo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: png,
    })
    assert.equal(upload.status, 200)
    const { photoId } = await upload.json()
    assert.match(photoId, /^[a-f0-9]{32}$/)
    const detail = await (
      await fetch(`${base}/api/recipes/${recipe.id}`)
    ).json()
    assert.equal(detail.photoId, photoId)
    assert.equal(detail.recipeTags[0].id, tag.id)
    assert.equal(detail.equipment[0].id, equipment.id)
    assert.equal(detail.ingredients[0].canonicalName, 'Carotte')
    assert.deepEqual(detail.steps, [{ position: 1, instruction: 'Cuire.' }])
    const image = await fetch(`${base}/api/photos/${photoId}.webp`)
    assert.equal(image.status, 200)
    assert.equal(image.headers.get('content-type'), 'image/webp')
    assert.equal(
      (await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format,
      'webp',
    )
    assert.equal(
      (await fetch(`${base}/api/recipes/${recipe.id}`, { method: 'DELETE' }))
        .status,
      204,
    )
    assert.equal(await photos.read(photoId), null)
    assert.equal(
      await db.recipeTagLink.count({ where: { recipeId: recipe.id } }),
      0,
    )
    assert.equal(
      await db.recipeEquipment.count({ where: { recipeId: recipe.id } }),
      0,
    )
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await repository.deleteById(recipe.id)
    await db.recipeTag.delete({ where: { id: tag.id } })
    await db.equipment.delete({ where: { id: equipment.id } })
  }
})

test('POST saves recipe tags and equipment atomically; PUT replaces, preserves omissions and rolls back invalid IDs', async () => {
  const db = persistence.client
  const tag = await db.recipeTag.create({
    data: { key: 'atomic-gourmand', label: 'Atomic gourmand' },
  })
  const inactive = await db.recipeTag.create({
    data: { key: 'atomic-inactive', label: 'Atomic inactive', active: false },
  })
  const equipment = await db.equipment.create({
    data: { key: 'atomic-four', label: 'Atomic four' },
  })
  const inactiveEquipment = await db.equipment.create({
    data: { key: 'atomic-inactive', label: 'Atomic inactive', active: false },
  })
  const server = createRecipeServer(repository)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/recipes`
  const payload = {
    title: 'Atomic catalog creation',
    description: null,
    servings: 2,
    tagIds: [tag.id, tag.id],
    equipmentIds: [equipment.id, equipment.id],
    ingredients: [
      { canonicalName: 'Atomic new ingredient', quantity: 1, unit: 'g' },
    ],
    steps: [{ instruction: 'Cuire.' }],
  }
  const call = (method, path, body) =>
    fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  let recipeId
  try {
    // Invalid references reject the entire recipe, including newly resolved ingredients.
    for (const [field, ids, status] of [
      ['equipmentIds', [2147483647], 400],
      ['tagIds', [2147483647], 400],
      ['tagIds', [inactive.id], 409],
      ['equipmentIds', [inactiveEquipment.id], 409],
      ['tagIds', ['1'], 400],
      ['equipmentIds', null, 400],
      ['tagIds', [0], 400],
      ['equipmentIds', Array(101).fill(equipment.id), 400],
    ]) {
      const response = await call('POST', '', { ...payload, [field]: ids })
      assert.equal(response.status, status, await response.text())
      assert.equal(
        await db.recipe.count({ where: { title: payload.title } }),
        0,
      )
      assert.equal(
        await db.ingredient.count({
          where: { canonicalName: 'Atomic new ingredient' },
        }),
        0,
      )
    }
    const created = await call('POST', '', payload)
    assert.equal(created.status, 201)
    const recipe = await created.json()
    recipeId = recipe.id
    assert.equal(recipe.recipeTags.length, 1)
    assert.equal(recipe.recipeTags[0].id, tag.id)
    assert.equal(recipe.equipment.length, 1)
    assert.equal(recipe.equipment[0].id, equipment.id)
    assert.deepEqual(await repository.findById(recipe.id), recipe)
    assert.equal(
      (await repository.findAll()).find((row) => row.id === recipe.id)
        .equipment[0].id,
      equipment.id,
    )
    const {
      tagIds: ignoredTags,
      equipmentIds: ignoredEquipment,
      ...withoutCatalogs
    } = payload
    void ignoredTags
    void ignoredEquipment
    const kept = await call('PUT', `/${recipe.id}`, withoutCatalogs)
    assert.equal(kept.status, 200)
    assert.equal((await kept.json()).recipeTags[0].id, tag.id)
    const invalid = await call('PUT', `/${recipe.id}`, {
      ...payload,
      title: 'Should roll back',
      equipmentIds: [2147483647],
    })
    assert.equal(invalid.status, 400)
    assert.deepEqual(await repository.findById(recipe.id), recipe)
    // Existing inactive associations can be retained, but new inactive ones are refused.
    await db.recipeTag.update({
      where: { id: tag.id },
      data: { active: false },
    })
    await db.equipment.update({
      where: { id: equipment.id },
      data: { active: false },
    })
    assert.equal((await call('PUT', `/${recipe.id}`, payload)).status, 200)
    assert.equal(await db.recipeTagLink.count({ where: { recipeId } }), 1)
    assert.equal(await db.recipeEquipment.count({ where: { recipeId } }), 1)
    const cleared = await call('PUT', `/${recipe.id}`, {
      ...payload,
      tagIds: [],
      equipmentIds: [],
    })
    assert.equal(cleared.status, 200)
    assert.deepEqual((await cleared.json()).recipeTags, [])
    assert.equal(await db.recipeTagLink.count({ where: { recipeId } }), 0)
    assert.equal(await db.recipeEquipment.count({ where: { recipeId } }), 0)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    if (recipeId) await repository.deleteById(recipeId)
    await db.recipeTag.deleteMany({
      where: { id: { in: [tag.id, inactive.id] } },
    })
    await db.equipment.deleteMany({
      where: { id: { in: [equipment.id, inactiveEquipment.id] } },
    })
  }
})
