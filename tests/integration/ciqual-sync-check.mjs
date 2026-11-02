import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import {
  applyFull,
  definitions,
  validateFull,
} from '../../scripts/ciqual-full.mjs'
import { syncCiqual, selectRelease } from '../../scripts/ciqual-sync.mjs'
const require = createRequire(import.meta.url)
const food = (code, name = `Aliment ${code}`) => ({
  code,
  name,
  values: Object.fromEntries(definitions.map((d) => [d.key, '0'])),
})
const meta = {
  source: 'https://doi.org/10.57745/RDMHWY',
  version: 'fixture-V1',
  downloadedAt: '2026-11-02',
  sourceSha256: 'a'.repeat(64),
  format: 'ciqual-full-xlsx-v1',
  attribution: 'Synthetic isolated fixture',
  license: 'Etalab-2.0',
}
const bytes = Buffer.from('mock workbook')
const publication = (
  major = 1,
  checksum = createHash('md5').update(bytes).digest('hex'),
) => ({
  status: 'OK',
  data: {
    latestVersion: {
      versionState: 'RELEASED',
      versionNumber: major,
      versionMinorNumber: 0,
      license: { name: 'etalab 2.0' },
      files: [
        {
          dataFile: {
            id: 666260,
            filename: 'Table Ciqual 2025_FR_2025_11_03.xlsx',
            checksum: { type: 'MD5', value: checksum },
          },
        },
      ],
    },
  },
})

test('all 74 definitions and value rules are enforced', () => {
  assert.equal(validateFull([food('1')])[0].nutrients.length, 74)
  assert.throws(() => validateFull([food('1'), food('1')]))
  const bad = food('2')
  bad.values['328'] = 'invalid'
  assert.throws(() => validateFull([bad]))
  const badLicense = publication()
  badLicense.data.latestVersion.license.name = 'unknown'
  assert.throws(() => selectRelease(badLicense))
})

test('full updates, immutable snapshots, retirement, rollback, scheduling and offline service', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'ciqual-sync-'))
  const file = join(temp, 'db.sqlite')
  writeFileSync(file, '')
  const url = `file:${file.replaceAll('\\', '/')}`
  const db = new PrismaClient({ datasources: { db: { url } } })
  try {
    const migration = spawnSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'migrate',
        'deploy',
        '--schema',
        'src/server/prisma/schema.prisma',
      ],
      { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' },
    )
    assert.equal(migration.status, 0, migration.stdout + migration.stderr)
    const initial = [food('1'), food('2'), food('3')]
    const first = await applyFull(db, initial, meta, '1.0:1:aaa')
    assert.equal(first.created, 3)
    await db.ingredient.create({
      data: { canonicalName: 'Mon ingrédient', ciqualCode: '3' },
    })
    const changed = [food('1', 'Renommé'), food('2')]
    changed[0].values['328'] = '100'
    const second = await applyFull(
      db,
      changed,
      { ...meta, version: 'fixture-V2' },
      '2.0:2:bbb',
    )
    assert.equal(second.updated, 1)
    assert.equal(second.retired, 1)
    assert.equal(
      (await db.ciqualFood.findUnique({ where: { code: '3' } })).active,
      false,
    )
    assert.equal(
      (await db.ingredient.findFirst()).canonicalName,
      'Mon ingrédient',
    )
    const audit = await db.ciqualImport.findUnique({
      where: { id: first.importId },
    })
    assert.equal(JSON.parse(audit.payload).foods[0].name, 'Aliment 1')
    assert.equal(
      (
        await applyFull(
          db,
          changed,
          { ...meta, version: 'fixture-V2' },
          '2.0:2:bbb',
        )
      ).created,
      0,
    )
    const count = await db.ciqualImport.count()
    await db.$executeRawUnsafe(
      "CREATE TRIGGER fail_update BEFORE INSERT ON CiqualFood WHEN NEW.code = '5' BEGIN SELECT RAISE(ABORT, 'failure'); END",
    )
    await assert.rejects(
      applyFull(
        db,
        [food('4'), food('5')],
        { ...meta, version: 'fixture-V3' },
        '3.0:3:ccc',
      ),
    )
    assert.equal(await db.ciqualImport.count(), count)
    assert.equal(await db.ciqualFood.findUnique({ where: { code: '4' } }), null)
    assert.equal(
      (await db.ciqualSyncState.findUnique({ where: { id: 1 } })).releaseKey,
      '2.0:2:bbb',
    )
    await db.$executeRawUnsafe('DROP TRIGGER fail_update')
    const noNetwork = async () => {
      throw new Error('network forbidden')
    }
    assert.equal(
      (await syncCiqual(db, { fetcher: noNetwork })).status,
      'not_due',
    )
    await assert.rejects(
      syncCiqual(db, { force: true, fetcher: noNetwork }),
      /network forbidden/,
    )
    assert.equal(
      (await db.ciqualFood.findUnique({ where: { code: '1' } })).name,
      'Renommé',
    )
    assert.match(
      (await db.ciqualSyncState.findUnique({ where: { id: 1 } })).lastError,
      /network forbidden/,
    )
    const fetcher = async (target) => {
      if (target.includes('/datasets/'))
        return new Response(JSON.stringify(publication(3)))
      if (target.includes('/api/access/'))
        return new Response('', {
          status: 303,
          headers: {
            location:
              'https://prod-espace-generique.opens3r-tls.stockage.inrae.fr/fixture.xlsx',
          },
        })
      return new Response(bytes)
    }
    const thousand = Array.from({ length: 1000 }, (_, i) => food(String(i + 1)))
    assert.equal(
      (
        await syncCiqual(db, {
          force: true,
          fetcher,
          parse: async () => thousand,
        })
      ).created,
      997,
    )
    let calls = 0
    assert.equal(
      (
        await syncCiqual(db, {
          force: true,
          fetcher: async () => {
            calls++
            return new Response(JSON.stringify(publication(3)))
          },
        })
      ).status,
      'up_to_date',
    )
    assert.equal(calls, 1)
    await assert.rejects(
      syncCiqual(db, {
        force: true,
        fetcher: async () => new Response(JSON.stringify(publication(1))),
      }),
      /downgrade/,
    )
    await assert.rejects(
      syncCiqual(db, {
        force: true,
        fetcher: async (target) =>
          new Response(
            target.includes('/datasets/')
              ? JSON.stringify(publication(4, '0'.repeat(32)))
              : bytes,
          ),
      }),
      /checksum mismatch/,
    )
    const before = await db.ciqualImport.count()
    await assert.rejects(
      applyFull(db, [food('1')], { ...meta, version: 'shrink' }, '9.0:1:xxx'),
      /shrinkage/,
    )
    assert.equal(await db.ciqualImport.count(), before)
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
