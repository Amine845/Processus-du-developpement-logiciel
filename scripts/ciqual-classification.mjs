import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const bytes = readFileSync(
  new URL('../data/ciqual/classification-v1.json', import.meta.url),
)
export const mapping = JSON.parse(bytes)
// Content hash also catches an accidentally unchanged human version.
export const classificationVersion = `${mapping.version}:${createHash('sha256').update(bytes).digest('hex')}`
export const groupFields = {
  alim_grp_code: 'groupCode',
  alim_grp_nom_fr: 'groupName',
  alim_ssgrp_code: 'subgroupCode',
  alim_ssgrp_nom_fr: 'subgroupName',
  alim_ssssgrp_code: 'detailGroupCode',
  alim_ssssgrp_nom_fr: 'detailGroupName',
}
export function classify(food) {
  const groups = food.groups ?? {}
  const fields = Object.fromEntries(
    Object.entries(groupFields).map(([key, field]) => {
      const value = groups[key]
      if (value !== undefined && typeof value !== 'string')
        throw new Error(`Invalid official group ${key}`)
      return [field, value ?? null]
    }),
  )
  const key = [
    fields.groupCode,
    fields.subgroupCode,
    fields.detailGroupCode,
  ].join('/')
  const rule = mapping.rules[key]
  const exception = mapping.exceptions[food.code]
  // A moved code or changed official labels needs review, even if its code is known.
  const compatible =
    rule && Object.keys(rule.labels).every((k) => rule.labels[k] === groups[k])
  const selected =
    compatible && exception && exception.expectedGroup === key
      ? exception
      : compatible && !exception
        ? rule
        : null
  return {
    ...fields,
    category: selected?.category ?? 'unclassified',
    classificationVersion,
    classificationRule:
      selected === exception
        ? `code:${food.code}`
        : selected
          ? `group:${key}`
          : 'review:unknown-or-changed-group',
  }
}
export function classificationReport(foods) {
  const counts = { food: 0, prepared_dish: 0, unclassified: 0 }
  const unclassified = []
  for (const food of foods) {
    const result = classify(food)
    counts[result.category]++
    if (result.category === 'unclassified')
      unclassified.push({ code: food.code, name: food.name, ...result })
  }
  return { classificationVersion, counts, unclassified }
}
