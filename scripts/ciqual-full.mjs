import {
  classify,
  classificationReport,
  classificationVersion,
} from './ciqual-classification.mjs'
import { readFileSync } from 'node:fs'
import { parseValue, sha256 } from './ciqual.mjs'
export const definitions = JSON.parse(
  readFileSync(
    new URL('../data/ciqual/constituents-2025.json', import.meta.url),
    'utf8',
  ),
)
export function validateFull(foods) {
  if (!Array.isArray(foods) || !foods.length || foods.length > 20000)
    throw new Error('Invalid food count')
  const seen = new Set()
  const keys = definitions
    .map((d) => d.key)
    .sort()
    .join(',')
  return foods.map((f, i) => {
    if (
      !/^\d+$/.test(f.code) ||
      typeof f.code !== 'string' ||
      seen.has(f.code) ||
      typeof f.name !== 'string' ||
      !f.name.trim()
    )
      throw new Error(`Invalid food or duplicate at row ${i + 1}`)
    seen.add(f.code)
    if (
      Object.keys(f.values ?? {})
        .sort()
        .join(',') !== keys
    )
      throw new Error(`Invalid constituents at row ${i + 1}`)
    const nutrients = definitions.map((d) => {
      const n = parseValue(f.values[d.key])
      const max = { g: 100, mg: 100000, µg: 100000000, kcal: 1000, kJ: 4200 }[
        d.unit
      ]
      if (!max || (n.value !== null && n.value > max))
        throw new Error(`Invalid quantity at row ${i + 1}, ${d.key}`)
      return { key: d.key, unit: d.unit, ...n }
    })
    return {
      ...f,
      nutrients,
      classification: classify(f),
      rawData: JSON.stringify(f),
    }
  })
}
export async function applyFull(db, foods, metadata, releaseKey) {
  const parsed = validateFull(foods)
  const payload = JSON.stringify({ metadata, classificationVersion, foods })
  return db.$transaction(
    async (tx) => {
      const state = await tx.ciqualSyncState.findUnique({ where: { id: 1 } })
      if (state?.releaseKey) {
        const old = state.releaseKey.split(':')[0].split('.').map(Number)
        const next = releaseKey.split(':')[0].split('.').map(Number)
        if (next[0] < old[0] || (next[0] === old[0] && next[1] < old[1]))
          throw new Error('Concurrent version downgrade rejected')
      }
      const prior = await tx.ciqualFood.findMany({
        include: { nutrients: true },
      })
      const active = prior.filter((f) => f.active)
      if (active.length > 50 && foods.length < active.length * 0.9)
        throw new Error(
          'Unexpected shrinkage greater than 10%; manual review required',
        )
      // Backfill immutable snapshots for subset imports before changing their current rows.
      const oldAudits = await tx.ciqualImport.findMany({
        where: { payload: null },
      })
      for (const old of oldAudits) {
        await tx.ciqualImport.update({
          where: { id: old.id },
          data: {
            payload: JSON.stringify(prior.filter((f) => f.importId === old.id)),
          },
        })
      }
      const fileSha256 = sha256(Buffer.from(payload))
      let audit = await tx.ciqualImport.findUnique({ where: { fileSha256 } })
      if (!audit)
        audit = await tx.ciqualImport.create({
          data: {
            ...metadata,
            fileSha256,
            payload,
            rowsRead: foods.length,
            rowsAccepted: foods.length,
            rowsRejected: 0,
          },
        })
      const previous = new Map(prior.map((f) => [f.code, f]))
      let created = 0,
        updated = 0,
        unchanged = 0
      for (const f of parsed) {
        const old = previous.get(f.code)
        const data = {
          ...f.classification,
          name: f.name,
          version: metadata.version,
          importId: audit.id,
          rawData: f.rawData,
          active: true,
        }
        if (old?.rawData === f.rawData && old.active) {
          await tx.ciqualFood.update({
            where: { code: f.code },
            data: {
              ...f.classification,
              version: data.version,
              importId: audit.id,
            },
          })
          unchanged++
        } else {
          await tx.ciqualFood.upsert({
            where: { code: f.code },
            create: { code: f.code, ...data },
            update: data,
          })
          // Replace only this food's current constituent rows. Historical values stay in audit.payload.
          await tx.ciqualNutrient.deleteMany({ where: { foodCode: f.code } })
          await tx.ciqualNutrient.createMany({
            data: f.nutrients.map((n) => ({ foodCode: f.code, ...n })),
          })
          if (old) updated++
          else created++
        }
      }
      const present = new Set(foods.map((f) => f.code))
      const removed = active
        .filter((f) => !present.has(f.code))
        .map((f) => f.code)
      if (removed.length)
        await tx.ciqualFood.updateMany({
          where: { code: { in: removed } },
          data: { active: false },
        })
      await tx.ciqualSyncState.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          checkedAt: new Date(),
          releaseKey,
          classificationVersion,
        },
        update: {
          checkedAt: new Date(),
          releaseKey,
          classificationVersion,
          lastError: null,
        },
      })
      return {
        classification: classificationReport(foods),
        rowsRead: foods.length,
        rowsAccepted: foods.length,
        rowsRejected: 0,
        created,
        updated,
        unchanged,
        retired: removed.length,
        importId: audit.id,
      }
    },
    { timeout: 180000, maxWait: 10000 },
  )
}
