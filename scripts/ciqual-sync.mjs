import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { applyFull } from './ciqual-full.mjs'
import { sha256 } from './ciqual.mjs'
const execute = promisify(execFile)
const base = 'https://entrepot.recherche.data.gouv.fr'
const url = `${base}/api/datasets/:persistentId/?persistentId=doi:10.57745/RDMHWY`
const week = 7 * 24 * 3600 * 1000
export function selectRelease(body) {
  const v = body?.data?.latestVersion
  if (
    body.status !== 'OK' ||
    v?.versionState !== 'RELEASED' ||
    v.license?.name !== 'etalab 2.0'
  )
    throw new Error('Unpublished release or changed license; review required')
  const matches = v.files.filter((f) =>
    /^Table Ciqual \d{4}_FR_.*\.xlsx$/.test(f.dataFile.filename),
  )
  if (matches.length !== 1) throw new Error('Ambiguous official XLSX')
  const file = matches[0].dataFile
  if (
    file.checksum?.type !== 'MD5' ||
    !/^[a-f0-9]{32}$/i.test(file.checksum.value) ||
    !Number.isSafeInteger(file.id)
  )
    throw new Error('Invalid upstream checksum or file identifier')
  if (
    ![v.versionNumber, v.versionMinorNumber].every(
      (x) => Number.isSafeInteger(x) && x >= 0,
    )
  )
    throw new Error('Invalid upstream version')
  const version = `${v.versionNumber}.${v.versionMinorNumber}`
  return { file, version, key: `${version}:${file.id}:${file.checksum.value}` }
}
async function getBytes(fetcher, target, limit) {
  let response
  for (let redirects = 0; redirects < 6; redirects++) {
    const endpoint = new URL(target)
    if (
      endpoint.protocol !== 'https:' ||
      !(
        endpoint.hostname === 'entrepot.recherche.data.gouv.fr' ||
        endpoint.hostname.endsWith('.stockage.inrae.fr')
      )
    )
      throw new Error('Unreviewed download host')
    response = await fetcher(target, {
      signal: AbortSignal.timeout(60000),
      redirect: 'manual',
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) break
    if (!response.headers.get('location'))
      throw new Error('Missing redirect location')
    target = new URL(response.headers.get('location'), target).href
    await response.body?.cancel()
    response = undefined
  }
  if (!response) throw new Error('Too many CIQUAL redirects')
  if (!response.ok) throw new Error(`CIQUAL HTTP ${response.status}`)
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      await reader.cancel()
      throw new Error('Download size limit exceeded')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}
export async function parseWorkbook(bytes) {
  const temp = mkdtempSync(join(tmpdir(), 'ciqual-download-'))
  try {
    const path = join(temp, 'source.xlsx')
    writeFileSync(path, bytes)
    const { stdout } = await execute(
      process.env.CIQUAL_PYTHON ??
        (process.platform === 'win32' ? 'python' : 'python3'),
      [fileURLToPath(new URL('./read-ciqual-xlsx.py', import.meta.url)), path],
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 60000 },
    )
    return JSON.parse(stdout)
  } finally {
    rmSync(temp, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
  }
}
export async function syncCiqual(
  db,
  {
    force = false,
    fetcher = fetch,
    parse = parseWorkbook,
    now = new Date(),
  } = {},
) {
  const state = await db.ciqualSyncState.findUnique({ where: { id: 1 } })
  if (!force && state?.checkedAt && now - state.checkedAt < week)
    return { status: 'not_due' }
  let rowsRead = 0
  try {
    const release = selectRelease(
      JSON.parse((await getBytes(fetcher, url, 5_000_000)).toString('utf8')),
    )
    if (state?.releaseKey) {
      const [major, minor] = state.releaseKey
        .split(':')[0]
        .split('.')
        .map(Number)
      const [newMajor, newMinor] = release.version.split('.').map(Number)
      if (newMajor < major || (newMajor === major && newMinor < minor))
        throw new Error('Upstream version downgrade rejected')
    }
    if (state?.releaseKey === release.key) {
      await db.ciqualSyncState.update({
        where: { id: 1 },
        data: { checkedAt: now, lastError: null },
      })
      return { status: 'up_to_date' }
    }
    const bytes = await getBytes(
      fetcher,
      `${base}/api/access/datafile/${release.file.id}`,
      30_000_000,
    )
    if (
      createHash('md5').update(bytes).digest('hex') !==
      release.file.checksum.value.toLowerCase()
    )
      throw new Error('Official checksum mismatch')
    const foods = await parse(bytes)
    rowsRead = Array.isArray(foods) ? foods.length : 0
    if (foods.length < 1000)
      throw new Error('Unexpectedly small official dataset')
    const metadata = {
      source: 'https://doi.org/10.57745/RDMHWY',
      version: `CIQUAL-${release.file.filename.match(/Ciqual (\d{4})/)[1]}-V${release.version}-${release.file.filename}`,
      downloadedAt: now.toISOString(),
      sourceSha256: sha256(bytes),
      format: 'ciqual-full-xlsx-v1',
      attribution: `Anses. Table de composition nutritionnelle des aliments Ciqual. ${release.file.filename}. https://doi.org/10.57745/RDMHWY`,
      license: 'Etalab-2.0',
    }
    return {
      status: 'updated',
      ...(await applyFull(db, foods, metadata, release.key)),
    }
  } catch (error) {
    error.report = {
      rowsRead,
      rowsAccepted: 0,
      rowsRejected: rowsRead,
      error: error.message,
    }
    await db.ciqualSyncState.upsert({
      where: { id: 1 },
      create: { id: 1, lastError: error.message },
      update: { lastError: error.message },
    })
    throw error
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { PrismaClient } = await import('@prisma/client')
  if (!process.env.DATABASE_URL?.startsWith('file:'))
    throw new Error('Export DATABASE_URL before synchronization')
  const db = new PrismaClient()
  const watch = process.argv.includes('--watch')
  const run = async () => {
    try {
      console.log(JSON.stringify(await syncCiqual(db, { force: !watch })))
    } catch (error) {
      console.error(
        JSON.stringify(
          error.report ?? { error: error.message, localDataPreserved: true },
        ),
      )
      if (!watch) process.exitCode = 1
    }
  }
  if (process.argv.includes('--status')) {
    try {
      console.log(
        JSON.stringify(
          {
            state: await db.ciqualSyncState.findUnique({ where: { id: 1 } }),
            activeFoods: await db.ciqualFood.count({ where: { active: true } }),
          },
          null,
          2,
        ),
      )
    } finally {
      await db.$disconnect()
    }
  } else if (watch) {
    let running = false
    const tick = async () => {
      if (running) return
      running = true
      try {
        await run()
      } finally {
        running = false
      }
    }
    const timer = setInterval(() => void tick(), 3600000)
    const stop = async () => {
      clearInterval(timer)
      await db.$disconnect()
      process.exit(0)
    }
    for (const signal of ['SIGINT', 'SIGTERM'])
      process.once(signal, () => void stop())
    await tick()
  } else {
    try {
      await run()
    } finally {
      await db.$disconnect()
    }
  }
}
