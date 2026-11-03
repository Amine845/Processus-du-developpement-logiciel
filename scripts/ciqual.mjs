import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const manifest = JSON.parse(
  readFileSync(
    new URL('../data/ciqual/source-manifest.json', import.meta.url),
    'utf8',
  ),
)
export const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex')
const keys = Object.keys(manifest.constituents)
export function parseValue(raw) {
  if (typeof raw !== 'string')
    throw new Error('Value must preserve source text')
  const text = raw.trim()
  if (text === '' || text === '-')
    return { raw, status: 'missing', value: null }
  if (text.toLowerCase() === 'traces')
    return { raw, status: 'trace', value: null }
  const match = /^(<\s*)?(\d+(?:[.,]\d+)?)$/.exec(text)
  if (!match) throw new Error('Unsupported value')
  const value = Number(match[2].replace(',', '.'))
  if (!Number.isFinite(value)) throw new Error('Non finite value')
  return { raw, status: match[1] ? 'less_than' : 'exact', value }
}
export class CiqualImportError extends Error {
  constructor(report) {
    super('CIQUAL import rejected')
    this.report = report
  }
}
export async function importCiqual(db, bytes) {
  const report = {
    rowsRead: 0,
    rowsValidated: 0,
    rowsAccepted: 0,
    rowsRejected: 0,
    created: 0,
    unchanged: 0,
    replay: false,
    errors: [],
  }
  const fail = (line, reason) => report.errors.push({ line, reason })
  let input
  try {
    input = JSON.parse(bytes.toString('utf8'))
  } catch {
    fail(0, 'Invalid JSON')
  }
  const foods = Array.isArray(input?.foods) ? input.foods : []
  report.rowsRead = foods.length
  // Exact metadata: do not let an arbitrary file claim an unreviewed release/license/unit.
  if (JSON.stringify(input?.metadata) !== JSON.stringify(manifest))
    fail(0, 'Unreviewed metadata, format or source')
  if (!foods.length || foods.length > 50) fail(0, 'Expected 1 to 50 foods')
  const seen = new Set()
  const parsed = []
  for (const [i, food] of foods.entries()) {
    try {
      if (
        !food ||
        typeof food.code !== 'string' ||
        !/^\d+$/.test(food.code) ||
        seen.has(food.code)
      )
        throw new Error('Invalid or duplicate code')
      seen.add(food.code)
      if (typeof food.name !== 'string' || !food.name.trim())
        throw new Error('Missing food name')
      if (
        !food.values ||
        Object.keys(food.values).sort().join() !== [...keys].sort().join()
      )
        throw new Error('Expected four reviewed constituents')
      const nutrients = keys.map((key) => {
        const parsedValue = parseValue(food.values[key])
        if (
          parsedValue.value !== null &&
          parsedValue.value > (key === '328' ? 1000 : 100)
        )
          throw new Error('Out of range per 100 g')
        return { key, unit: manifest.constituents[key].unit, ...parsedValue }
      })
      parsed.push({
        code: food.code,
        name: food.name,
        version: manifest.version,
        nutrients,
      })
      report.rowsValidated++
    } catch (error) {
      fail(i + 1, error.message)
    }
  }
  const reject = () => {
    report.rowsRejected = report.rowsRead
    throw new CiqualImportError(report)
  }
  if (report.errors.length) reject()
  const fileSha256 = sha256(bytes)
  try {
    const result = await db.$transaction(async (tx) => {
      const previous = await tx.ciqualImport.findUnique({
        where: { fileSha256 },
      })
      if (previous) return { created: 0, unchanged: foods.length, replay: true }
      const audit = await tx.ciqualImport.create({
        data: {
          source: manifest.source,
          version: manifest.version,
          downloadedAt: manifest.downloadedAt,
          sourceSha256: manifest.sourceSha256,
          fileSha256,
          format: manifest.format,
          attribution: manifest.attribution,
          license: manifest.license,
          rowsRead: foods.length,
          rowsAccepted: foods.length,
          rowsRejected: 0,
        },
      })
      let created = 0
      for (const { nutrients, ...food } of parsed) {
        const existing = await tx.ciqualFood.findUnique({
          where: { code: food.code },
          include: { nutrients: true },
        })
        if (existing) {
          const equal =
            existing.name === food.name &&
            existing.version === food.version &&
            nutrients.every((n) => {
              const old = existing.nutrients.find((x) => x.key === n.key)
              return (
                old &&
                ['raw', 'unit', 'status', 'value'].every((k) => old[k] === n[k])
              )
            }) &&
            existing.nutrients.length === nutrients.length
          if (!equal)
            throw new Error(
              'Conflicting existing food; release changes require review',
            )
        } else {
          await tx.ciqualFood.create({
            data: {
              ...food,
              importId: audit.id,
              nutrients: { create: nutrients },
            },
          })
          created++
        }
      }
      return { created, unchanged: foods.length - created, replay: false }
    })
    return { ...report, ...result, rowsAccepted: foods.length }
  } catch {
    fail(
      0,
      'Transaction rolled back (database failure or conflicting existing food)',
    )
    reject()
  }
}

// CLI never starts with the server. Explicit file and explicit DATABASE_URL required.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let db
  try {
    if (
      process.argv.length !== 3 ||
      !process.env.DATABASE_URL?.startsWith('file:')
    )
      throw new Error(
        'Usage: set DATABASE_URL then npm run ciqual:import -- data/ciqual/subset-2025.json',
      )
    const { PrismaClient } = await import('@prisma/client')
    db = new PrismaClient()
    console.log(
      JSON.stringify(
        await importCiqual(db, readFileSync(process.argv[2])),
        null,
        2,
      ),
    )
  } catch (error) {
    console.error(
      JSON.stringify(error.report ?? { error: error.message }, null, 2),
    )
    process.exitCode = 1
  } finally {
    await db?.$disconnect()
  }
}
