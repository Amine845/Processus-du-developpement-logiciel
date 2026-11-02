// Read helpers for the next nutrition/search issue; no automatic name-based links.
export function searchCiqual(db, query, limit = 20) {
  if (
    typeof query !== 'string' ||
    !query.trim() ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  )
    throw new RangeError('Invalid search')
  return db.ciqualFood.findMany({
    where: { name: { contains: query.trim() } },
    orderBy: { code: 'asc' },
    take: limit,
  })
}
export function linkCiqual(db, ingredientId, code) {
  if (
    !Number.isInteger(ingredientId) ||
    ingredientId < 1 ||
    (code !== null && !/^\d+$/.test(code))
  )
    throw new RangeError('Invalid reference')
  return db.ingredient.update({
    where: { id: ingredientId },
    data: { ciqualCode: code },
  })
}
export async function estimateCiqual(db, code, grams) {
  if (!Number.isFinite(grams) || grams < 0)
    throw new RangeError('Mass in grams required')
  const food = await db.ciqualFood.findUnique({
    where: { code },
    include: { nutrients: true, import: true },
  })
  if (!food) return null
  return {
    code,
    grams,
    attribution: food.import.attribution,
    version: food.version,
    nutrients: food.nutrients.map((n) => ({
      key: n.key,
      unit: n.unit,
      status: n.status,
      raw: n.raw,
      value: n.status === 'exact' ? (n.value * grams) / 100 : null,
      upperBoundExclusive:
        n.status === 'less_than' ? (n.value * grams) / 100 : null,
    })),
  }
}
