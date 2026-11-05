import type { PrismaClient } from '@prisma/client'
import {
  CiqualReadError,
  type CiqualFoodDetail,
  type CiqualFoodSummary,
  type CiqualRepository,
} from '../domain/ciqual-repository.js'
import {
  CIQUAL_CATEGORIES,
  type CiqualCategory,
  type CiqualNutrientStatus,
} from '../../shared/types/ciqual.types.js'

type Db = Pick<PrismaClient, 'ciqualFood'>

const STATUSES: readonly string[] = ['exact', 'less_than', 'trace', 'missing']

const classificationSelect = {
  category: true,
  groupCode: true,
  groupName: true,
  subgroupCode: true,
  subgroupName: true,
  detailGroupCode: true,
  detailGroupName: true,
} as const
function categoryOf(value: string): CiqualCategory {
  if (!CIQUAL_CATEGORIES.includes(value as CiqualCategory))
    throw new CiqualReadError()
  return value as CiqualCategory
}
const summarySelect = {
  ...classificationSelect,
  code: true,
  name: true,
  version: true,
  baseQuantity: true,
  baseUnit: true,
  import: { select: { source: true } },
} as const

export function createPrismaCiqualRepository(client: Db): CiqualRepository {
  return {
    async listSearchableFoods(category = 'all') {
      try {
        return await client.ciqualFood.findMany({
          where: { active: true, ...(category === 'all' ? {} : { category }) },
          select: { code: true, name: true },
        })
      } catch {
        throw new CiqualReadError()
      }
    },

    async findSummaries(codes, category) {
      if (codes.length === 0) return []
      try {
        const rows = await client.ciqualFood.findMany({
          where: {
            code: { in: codes },
            ...(category === undefined
              ? {}
              : { active: true, ...(category === 'all' ? {} : { category }) }),
          },
          select: summarySelect,
        })
        return rows.map(({ import: origin, ...food }): CiqualFoodSummary => ({
          ...food,
          category: categoryOf(food.category),
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
          category: categoryOf(food.category),
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
