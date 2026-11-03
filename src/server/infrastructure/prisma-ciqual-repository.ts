import type { PrismaClient } from '@prisma/client'
import {
  CiqualReadError,
  type CiqualFoodDetail,
  type CiqualFoodSummary,
  type CiqualRepository,
} from '../domain/ciqual-repository.js'
import type { CiqualNutrientStatus } from '../../shared/types/ciqual.types.js'

type Db = Pick<PrismaClient, 'ciqualFood'>

const STATUSES: readonly string[] = ['exact', 'less_than', 'trace', 'missing']

const summarySelect = {
  code: true,
  name: true,
  version: true,
  baseQuantity: true,
  baseUnit: true,
  import: { select: { source: true } },
} as const

export function createPrismaCiqualRepository(client: Db): CiqualRepository {
  return {
    async listSearchableFoods() {
      try {
        return await client.ciqualFood.findMany({
          where: { active: true },
          select: { code: true, name: true },
        })
      } catch {
        throw new CiqualReadError()
      }
    },

    async findSummaries(codes) {
      if (codes.length === 0) return []
      try {
        const rows = await client.ciqualFood.findMany({
          where: { code: { in: codes } },
          select: summarySelect,
        })
        return rows.map(({ import: origin, ...food }): CiqualFoodSummary => ({
          ...food,
          source: origin.source,
        }))
      } catch {
        throw new CiqualReadError()
      }
    },

    async findByCode(code) {
      try {
        const row = await client.ciqualFood.findUnique({
          where: { code },
          select: {
            ...summarySelect,
            active: true,
            import: { select: { source: true, attribution: true } },
            nutrients: {
              select: {
                key: true,
                unit: true,
                status: true,
                raw: true,
                value: true,
              },
            },
          },
        })
        if (!row) return null
        const { import: origin, nutrients, ...food } = row
        const detail: CiqualFoodDetail = {
          ...food,
          source: origin.source,
          attribution: origin.attribution,
          nutrients: nutrients
            .map((n) => {
              // Un statut inattendu serait une corruption : ne rien présenter comme valeur.
              if (!STATUSES.includes(n.status)) throw new CiqualReadError()
              return { ...n, status: n.status as CiqualNutrientStatus }
            })
            // Clés textuelles : tri numérique stable (328 avant 10000).
            .sort((a, b) => Number(a.key) - Number(b.key)),
        }
        return detail
      } catch {
        throw new CiqualReadError()
      }
    },
  }
}
