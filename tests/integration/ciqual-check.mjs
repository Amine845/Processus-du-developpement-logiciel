import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import {
  importCiqual,
  parseValue,
  CiqualImportError,
} from '../../scripts/ciqual.mjs'
import {
  searchCiqual,
  linkCiqual,
  estimateCiqual,
} from '../../scripts/ciqual-reference.mjs'
const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))
const sample = JSON.parse(
  readFileSync(
    new URL('../../data/ciqual/subset-2025.json', import.meta.url),
    'utf8',
  ),
)
const encode = (x) => Buffer.from(JSON.stringify(x))

test('raw zero, missing, trace and exclusive threshold remain distinct', () => {
  assert.deepEqual(parseValue('0'), { raw: '0', status: 'exact', value: 0 })
  for (const raw of ['', '-']) assert.equal(parseValue(raw).status, 'missing')
  assert.deepEqual(parseValue('traces'), {
    raw: 'traces',
    status: 'trace',
    value: null,
  })
  assert.deepEqual(parseValue('< 0,2'), {
    raw: '< 0,2',
    status: 'less_than',
    value: 0.2,
  })
  for (const raw of ['NaN', '-3', '1e309', '2 mg', '0foo', null, 0])
    assert.throws(() => parseValue(raw))
})

test('isolated migration, imports, rejection, rollback and conservation', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'ciqual-'))
  const url = `file:${join(temp, 'test.db').replaceAll('\\', '/')}`
  writeFileSync(join(temp, 'test.db'), '')
  const db = new PrismaClient({ datasources: { db: { url } } })
  try {
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
    // Apply pre-CIQUAL migrations first, insert old-format rows, then deploy additive migration.
    const addition = join(
      temp,
      'prisma/migrations/20261102090000_ciqual_subset',
    )
    rmSync(addition, { recursive: true })
    const updateMigration = join(
      temp,
      'prisma/migrations/20261102140000_ciqual_sync',
    )
    rmSync(updateMigration, { recursive: true })
    // Les migrations postérieures (tags) sont réintroduites en dernier, dans l'ordre chronologique.
    const tagsMigration = join(
      temp,
      'prisma/migrations/20261108090000_ingredient_tags',
    )
    rmSync(tagsMigration, { recursive: true })
    const classificationMigration = join(
      temp,
      'prisma/migrations/20261105120000_ciqual_categories',
    )
    rmSync(classificationMigration, { recursive: true })
    const identityMigration = join(
      temp,
      'prisma/migrations/20261105140000_ingredient_identity',
    )
    rmSync(identityMigration, { recursive: true })
    const deploy = () => {
      const r = spawnSync(
        process.execPath,
        [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
        {
          cwd: temp,
          env: { ...process.env, DATABASE_URL: url },
          encoding: 'utf8',
        },
      )
      assert.equal(r.status, 0, r.error?.message ?? r.stdout + r.stderr)
    }
    deploy()
    await db.$executeRawUnsafe(
      `INSERT INTO Ingredient (id, canonicalName) VALUES (51, 'Manuel')`,
    )
    await db.$executeRawUnsafe(
      `INSERT INTO Recipe (id, title, servings) VALUES (51, 'Conservée', 2)`,
    )
    await db.$executeRawUnsafe(
      `INSERT INTO RecipeIngredient (recipeId, ingredientId, quantity, unit, position) VALUES (51, 51, 200, 'g', 1)`,
    )
    await db.$executeRawUnsafe(
      `INSERT INTO RecipeStep (recipeId, position, instruction) VALUES (51, 1, 'Préparer')`,
    )
    cpSync(
      join(root, 'src/server/prisma/migrations/20261102090000_ciqual_subset'),
      addition,
      { recursive: true },
    )
    cpSync(
      join(root, 'src/server/prisma/migrations/20261102140000_ciqual_sync'),
      updateMigration,
      { recursive: true },
    )
    cpSync(
      join(root, 'src/server/prisma/migrations/20261108090000_ingredient_tags'),
      tagsMigration,
      { recursive: true },
    )
    cpSync(
      join(
        root,
        'src/server/prisma/migrations/20261105120000_ciqual_categories',
      ),
      classificationMigration,
      { recursive: true },
    )
    cpSync(
      join(
        root,
        'src/server/prisma/migrations/20261105140000_ingredient_identity',
      ),
      identityMigration,
      { recursive: true },
    )
    deploy()
    const before = await db.recipe.findMany({
      include: { ingredients: true, steps: true },
    })
    const fixture = structuredClone(sample)
    fixture.foods = fixture.foods.slice(0, 2)
    fixture.foods[0].values = {
      328: '0',
      25003: '-',
      31000: 'traces',
      40000: '< 0,2',
    }
    const bytes = encode(fixture)
    const result = await importCiqual(db, bytes)
    assert.equal(result.rowsAccepted, 2)
    assert.equal(result.created, 2)
    assert.equal(result.rowsRead, result.rowsAccepted + result.rowsRejected)
    const audit = await db.ciqualImport.findFirst()
    assert.match(audit.sourceSha256, /^[a-f0-9]{64}$/)
    assert.ok(audit.importedAt instanceof Date)
    assert.equal((await importCiqual(db, bytes)).replay, true)
    assert.equal(await db.ciqualImport.count(), 1)
    const whitespaceReplay = await importCiqual(
      db,
      Buffer.from(JSON.stringify(fixture, null, 2)),
    )
    assert.equal(whitespaceReplay.created, 0)
    assert.equal(whitespaceReplay.unchanged, 2)
    assert.equal(await db.ciqualFood.count(), 2)
    const rejected = async (input) => {
      const counts = [
        await db.ciqualFood.count(),
        await db.ciqualImport.count(),
        await db.ciqualNutrient.count(),
      ]
      await assert.rejects(importCiqual(db, encode(input)), (e) => {
        assert.ok(e instanceof CiqualImportError)
        assert.equal(e.report.rowsAccepted, 0)
        assert.equal(e.report.rowsRead, e.report.rowsRejected)
        return true
      })
      assert.deepEqual(
        [
          await db.ciqualFood.count(),
          await db.ciqualImport.count(),
          await db.ciqualNutrient.count(),
        ],
        counts,
      )
    }
    await rejected({ ...fixture, foods: [fixture.foods[0], fixture.foods[0]] })
    const bad = structuredClone(fixture)
    bad.foods[1].values['328'] = 'invalid'
    await rejected(bad)
    await rejected({
      ...fixture,
      metadata: { ...fixture.metadata, baseUnit: 'ml' },
    })
    await rejected({
      ...fixture,
      foods: [{ ...fixture.foods[0], name: 'Conflicting rename' }],
    })
    await assert.rejects(importCiqual(db, Buffer.from('{')), CiqualImportError)
    // Real database error on second insert: first food AND audit must roll back.
    const rollback = structuredClone(sample)
    rollback.foods = rollback.foods.slice(2, 4)
    await db.$executeRawUnsafe(
      `CREATE TRIGGER fail_ciqual BEFORE INSERT ON CiqualFood WHEN NEW.code = '${rollback.foods[1].code}' BEGIN SELECT RAISE(ABORT, 'fixture failure'); END`,
    )
    await rejected(rollback)
    await db.$executeRawUnsafe('DROP TRIGGER fail_ciqual')
    assert.equal((await importCiqual(db, encode(rollback))).created, 2)
    assert.deepEqual(
      await db.recipe.findMany({ include: { ingredients: true, steps: true } }),
      before,
    )
    assert.equal(
      (await db.ingredient.findUnique({ where: { id: 51 } })).ciqualCode,
      null,
    )
    await linkCiqual(db, 51, fixture.foods[0].code)
    await assert.rejects(linkCiqual(db, 51, '999999999'))
    assert.equal((await searchCiqual(db, fixture.foods[0].name)).length, 1)
    const estimate = await estimateCiqual(db, fixture.foods[0].code, 50)
    assert.equal(estimate.nutrients.find((n) => n.key === '328').value, 0)
    assert.equal(estimate.nutrients.find((n) => n.key === '25003').value, null)
    assert.equal(
      estimate.nutrients.find((n) => n.key === '40000').upperBoundExclusive,
      0.1,
    )
    await linkCiqual(db, 51, null)
    // Actual provided demo sample too, on the same isolated DB after fixture rollback.
    // The deliberately altered synthetic fixture conflicts, so use a second empty isolated DB below.
    writeFileSync(join(temp, 'demo.db'), '')
    const demo = new PrismaClient({
      datasources: {
        db: { url: `file:${join(temp, 'demo.db').replaceAll('\\', '/')}` },
      },
    })
    try {
      const r = spawnSync(
        process.execPath,
        [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
        {
          cwd: temp,
          env: {
            ...process.env,
            DATABASE_URL: `file:${join(temp, 'demo.db').replaceAll('\\', '/')}`,
          },
          encoding: 'utf8',
        },
      )
      assert.equal(r.status, 0, r.stdout + r.stderr)
      assert.equal((await importCiqual(demo, encode(sample))).created, 30)
      assert.equal((await importCiqual(demo, encode(sample))).replay, true)
      const cli = spawnSync(
        process.execPath,
        ['scripts/ciqual.mjs', 'data/ciqual/subset-2025.json'],
        {
          cwd: root,
          env: {
            ...process.env,
            DATABASE_URL: `file:${join(temp, 'demo.db').replaceAll('\\', '/')}`,
          },
          encoding: 'utf8',
        },
      )
      assert.equal(cli.status, 0, cli.stdout + cli.stderr)
      assert.equal(JSON.parse(cli.stdout).replay, false) // Different JSON bytes than encode(sample).
      assert.equal(JSON.parse(cli.stdout).created, 0)
      const invalidFile = join(temp, 'invalid.json')
      writeFileSync(invalidFile, '{')
      const invalidCli = spawnSync(
        process.execPath,
        ['scripts/ciqual.mjs', invalidFile],
        {
          cwd: root,
          env: {
            ...process.env,
            DATABASE_URL: `file:${join(temp, 'demo.db').replaceAll('\\', '/')}`,
          },
          encoding: 'utf8',
        },
      )
      assert.equal(invalidCli.status, 1)
      assert.equal(JSON.parse(invalidCli.stderr).rowsAccepted, 0)
      const carotte = await estimateCiqual(demo, '20009', 200)
      assert.equal(
        carotte.nutrients.find((n) => n.key === '328').value,
        Number(
          sample.foods
            .find((f) => f.code === '20009')
            .values['328'].replace(',', '.'),
        ) * 2,
      )
    } finally {
      await demo.$disconnect()
    }
  } finally {
    await db.$disconnect()
    rmSync(temp, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
  }
})
