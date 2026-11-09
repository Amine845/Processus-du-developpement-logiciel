import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'
import {
  classify,
  classificationVersion,
} from '../../scripts/ciqual-classification.mjs'
import { definitions, applyFull } from '../../scripts/ciqual-full.mjs'
import { parseWorkbook, syncCiqual } from '../../scripts/ciqual-sync.mjs'
import { createCiqual } from '../../dist-server/server/application/ciqual.js'
import { createPrismaCiqualRepository } from '../../dist-server/server/infrastructure/prisma-ciqual-repository.js'
import { createPrismaRecipeRepository } from '../../dist-server/server/infrastructure/prisma-recipe-repository.js'
import { createRecipeServer } from '../../dist-server/server/server.js'
const require = createRequire(import.meta.url)
const fixture = JSON.parse(
  readFileSync('data/ciqual/classification-fixture-2025.json', 'utf8'),
)
const foods = fixture.foods.map((f) => ({
  ...f,
  values: Object.fromEntries(definitions.map((d) => [d.key, '0'])),
}))
const metadata = {
  source: fixture.source,
  sourceSha256: fixture.sourceSha256,
  version: '2025-test',
  downloadedAt: '2026-11-05',
  format: 'ciqual-full-xlsx-v2-groups',
  attribution: 'Anses. CIQUAL 2025.',
  license: 'Etalab-2.0',
}
test('verified official codes, mixed group exceptions, unknowns and no keyword inference', () => {
  const by = Object.fromEntries(foods.map((f) => [f.code, classify(f)]))
  for (const code of ['22000', '9440', '16400', '9610', '9681', '22003'])
    assert.equal(by[code].category, 'food', code)
  for (const code of ['25029', '25608', '22506'])
    assert.equal(by[code].category, 'prepared_dish', code)
  assert.equal(by['24999'].category, 'unclassified')
  assert.equal(by['22003'].classificationRule, 'code:22003')
  assert.equal(
    classify({ code: 'new', name: 'Farine' }).category,
    'unclassified',
  )
  const f = foods.find((f) => f.code === '9681')
  assert.equal(
    classify({ ...f, name: 'Couscous cuisiné avec garniture' }).category,
    'food',
  )
  assert.equal(
    classify({ ...f, groups: { ...f.groups, alim_ssssgrp_code: '999999' } })
      .category,
    'unclassified',
  )
  assert.equal(
    classify({ ...f, groups: { ...f.groups, alim_ssgrp_nom_fr: 'changed' } })
      .category,
    'unclassified',
  )
  const mixed = foods.find((f) => f.code === '22003')
  assert.equal(classify({ ...mixed, code: '999999' }).category, 'unclassified')
})

test('populated migration, controlled backfill, category API, replay, remapping and historical recipes', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'ciqual-classification-'))
  const url = `file:${join(temp, 'recipes.db').replaceAll('\\', '/')}`
  writeFileSync(join(temp, 'recipes.db'), '')
  const schema = join(temp, 'prisma')
  mkdirSync(join(schema, 'migrations'), { recursive: true })
  cpSync('src/server/prisma/schema.prisma', join(schema, 'schema.prisma'))
  const migrations = 'src/server/prisma/migrations'
  for (const name of readdirSync(migrations))
    if (!name.includes('ciqual_categories'))
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
  const db = new PrismaClient({ datasources: { db: { url } } })
  let server
  try {
    deploy()
    const audit = await db.ciqualImport.create({
      data: {
        ...metadata,
        fileSha256: 'legacy',
        rowsRead: 1,
        rowsAccepted: 1,
        rowsRejected: 0,
      },
    })
    await db.$executeRawUnsafe(
      'INSERT INTO CiqualFood (code,name,version,importId) VALUES (?,?,?,?)',
      '25029',
      'Ancien couscous',
      'legacy',
      audit.id,
    )
    await db.$executeRawUnsafe(
      'INSERT INTO CiqualNutrient (foodCode,key,unit,raw,status,value) VALUES (?,?,?,?,?,?)',
      '25029',
      '328',
      'kcal',
      '42',
      'exact',
      42,
    )
    await db.recipe.create({
      data: {
        title: 'Historique',
        servings: 2,
        ingredients: {
          create: {
            quantity: 100,
            unit: 'g',
            position: 1,
            ingredient: {
              create: {
                canonicalName: 'Couscous historique',
                ciqualCode: '25029',
              },
            },
          },
        },
        steps: { create: { position: 1, instruction: 'Servir' } },
      },
    })
    const before = await db.recipe.findMany({
      include: { ingredients: { include: { ingredient: true } }, steps: true },
    })
    cpSync(
      join(migrations, '20261105120000_ciqual_categories'),
      join(schema, 'migrations/20261105120000_ciqual_categories'),
      { recursive: true },
    )
    deploy()
    const legacy = await db.ciqualFood.findUnique({
      where: { code: '25029' },
      include: { nutrients: true },
    })
    assert.equal(legacy.category, 'unclassified')
    assert.equal(legacy.nutrients[0].value, 42)
    assert.deepEqual(
      await db.recipe.findMany({
        include: {
          ingredients: { include: { ingredient: true } },
          steps: true,
        },
      }),
      before,
    )
    const first = await applyFull(db, foods, metadata, '1.0:666260:abc')
    assert.deepEqual(first.classification.counts, {
      food: 6,
      prepared_dish: 3,
      unclassified: 1,
    })
    assert.deepEqual(
      first.classification.unclassified.map((f) => f.code),
      ['24999'],
    )
    await db.ciqualFood.update({
      where: { code: '22003' },
      data: {
        applicationTags: '["local"]',
        category: 'unclassified',
        classificationVersion: 'old',
      },
    })
    const replay = await applyFull(db, foods, metadata, '1.0:666260:abc')
    assert.equal(replay.created, 0)
    const restored = await db.ciqualFood.findUnique({
      where: { code: '22003' },
    })
    assert.equal(restored.category, 'food')
    assert.equal(restored.applicationTags, '["local"]')
    assert.equal(restored.classificationVersion, classificationVersion)
    assert.equal(await db.ciqualFood.count(), foods.length)
    const api = createCiqual(createPrismaCiqualRepository(db))
    assert.ok(
      (await api.search('œuf', undefined, 'food')).results.some(
        (f) => f.code === '22000',
      ),
    )
    assert.ok(
      (await api.search('couscous', undefined, 'prepared_dish')).results.some(
        (f) => f.code === '25029',
      ),
    )
    const ingredients = (await api.search('couscous', undefined, 'food'))
      .results
    assert.ok(ingredients.some((f) => f.code === '9681'))
    assert.ok(!ingredients.some((f) => f.code === '25029'))
    assert.equal(
      (await api.search('dessert', undefined, 'food')).results.length,
      0,
    )
    assert.equal(
      (await api.search('dessert', undefined, 'unclassified')).results[0].code,
      '24999',
    )
    await assert.rejects(api.search('œuf', undefined, 'invalid'), {
      code: 'INVALID_CATEGORY',
    })
    server = createRecipeServer(
      createPrismaRecipeRepository(db),
      createPrismaCiqualRepository(db),
    )
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    for (const q of ['category=bad', 'category=', 'category=food&category=all'])
      assert.equal(
        (await fetch(`${base}/api/ciqual/foods?q=couscous&${q}`)).status,
        400,
      )
    const dish = await (
      await fetch(`${base}/api/ciqual/foods?q=couscous&category=prepared_dish`)
    ).json()
    assert.equal(dish.results[0].category, 'prepared_dish')
    assert.equal(dish.results[0].subgroupCode, '0103')
    await applyFull(
      db,
      foods.filter((f) => f.code !== '25029'),
      { ...metadata, version: 'next' },
      '2.0:2:def',
    )
    assert.equal((await api.findByCode('25029')).active, false)
    assert.deepEqual(
      await db.recipe.findMany({
        include: {
          ingredients: { include: { ingredient: true } },
          steps: true,
        },
      }),
      before,
    )
    // Even an unchanged upstream publication must be fetched after mapping changes.
    await db.ciqualSyncState.update({
      where: { id: 1 },
      data: { classificationVersion: 'old', checkedAt: new Date() },
    })
    let calls = 0
    const release = {
      status: 'OK',
      data: {
        latestVersion: {
          versionState: 'RELEASED',
          license: { name: 'etalab 2.0' },
          versionNumber: 2,
          versionMinorNumber: 0,
          files: [
            {
              dataFile: {
                id: 2,
                filename: 'Table Ciqual 2025_FR_test.xlsx',
                checksum: { type: 'MD5', value: 'a'.repeat(32) },
              },
            },
          ],
        },
      },
    }
    await db.ciqualSyncState.update({
      where: { id: 1 },
      data: { releaseKey: `2.0:2:${'a'.repeat(32)}` },
    })
    await assert.rejects(
      syncCiqual(db, {
        fetcher: async () => {
          calls++
          if (calls === 1) return new Response(JSON.stringify(release))
          throw new Error('download reached')
        },
      }),
      /download reached/,
    )
    assert.equal(calls, 2)
    const bytes = Buffer.from('verified by injected parser')
    const checksum = createHash('md5').update(bytes).digest('hex')
    release.data.latestVersion.files[0].dataFile.checksum.value = checksum
    await db.ciqualSyncState.update({
      where: { id: 1 },
      data: { releaseKey: `2.0:2:${checksum}` },
    })
    const futureFoods = [
      ...foods,
      ...Array.from({ length: 1000 - foods.length }, (_, i) => ({
        code: String(100000 + i),
        name: `Synthetic ${i}`,
        values: foods[0].values,
      })),
    ]
    const synced = await syncCiqual(db, {
      fetcher: async (target) =>
        new Response(
          target.includes('/datasets/') ? JSON.stringify(release) : bytes,
        ),
      parse: async () => futureFoods,
    })
    assert.equal(synced.status, 'updated')
    assert.equal(synced.classification.counts.food, 6)
    assert.equal(
      (await db.ciqualFood.findUnique({ where: { code: '22003' } }))
        .applicationTags,
      '["local"]',
    )
    assert.equal(
      (await db.ciqualFood.findUnique({ where: { code: '22003' } })).category,
      'food',
    )
    assert.equal(await db.ciqualFood.count(), 1000)
    assert.deepEqual(
      await db.recipe.findMany({
        include: {
          ingredients: { include: { ingredient: true } },
          steps: true,
        },
      }),
      before,
    )
  } finally {
    server?.closeAllConnections()
    if (server) await new Promise((resolve) => server.close(resolve))
    await db.$disconnect()
    rmSync(temp, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
  }
})

test('extractor preserves exact group headers, labels and codes from official workbook fixture', async () => {
  const rows = await parseWorkbook(
    readFileSync('tests/fixtures/ciqual-groups-2025.xlsx'),
  )
  assert.deepEqual(
    rows.map(({ code, name, groups }) => ({ code, name, groups })),
    fixture.foods,
  )
  assert.equal(Object.keys(rows[0].values).length, 74)
})
