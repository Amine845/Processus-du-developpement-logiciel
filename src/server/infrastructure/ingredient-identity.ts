import type { Prisma } from '@prisma/client'

/** Shared with future manual ingredient creation (#74). Exact names, no fuzzy links. */
export const ingredientIdentity = (name: string, code: string | null) =>
  code === null ? `manual:${name}` : `ciqual:${code}`

export async function resolveIngredient(
  tx: Prisma.TransactionClient,
  canonicalName: string,
  ciqualCode: string | null,
) {
  const identityKey = ingredientIdentity(canonicalName, ciqualCode)
  const existing = await tx.ingredient.findUnique({ where: { identityKey } })
  if (existing) {
    if (existing.ciqualCode !== ciqualCode)
      throw new Error('Inconsistent ingredient identity')
    return existing.id
  }
  // Legacy integrations may still create a manual row without identityKey.
  // Adopt only an exact, unlinked manual row; never alter its CIQUAL relation.
  if (ciqualCode === null) {
    const legacy = await tx.ingredient.findFirst({
      where: { canonicalName, ciqualCode: null, identityKey: null },
      orderBy: { id: 'asc' },
    })
    if (legacy) {
      await tx.ingredient.update({
        where: { id: legacy.id },
        data: { identityKey },
      })
      return legacy.id
    }
  }
  const created = await tx.ingredient.create({
    data: { identityKey, canonicalName, ciqualCode },
  })
  return created.id
}
