import {
  CIQUAL_CATEGORIES,
  type CiqualCategoryFilter,
  CIQUAL_SEARCH_DEFAULT_LIMIT,
  CIQUAL_SEARCH_MAX_LENGTH,
  CIQUAL_SEARCH_MAX_LIMIT,
  CIQUAL_SEARCH_MIN_LENGTH,
  type CiqualFoodDetailDTO,
  type CiqualSearchResponseDTO,
} from '../../shared/types/ciqual.types.js'
import type {
  CiqualFoodRef,
  CiqualRepository,
} from '../domain/ciqual-repository.js'
import { CIQUAL_NUTRIENT_LABELS } from './ciqual-nutrient-labels.js'

export type CiqualQueryErrorCode =
  | 'QUERY_TOO_SHORT'
  | 'QUERY_TOO_LONG'
  | 'INVALID_LIMIT'
  | 'INVALID_CODE'
  | 'INVALID_CATEGORY'

export class CiqualQueryError extends Error {
  constructor(readonly code: CiqualQueryErrorCode) {
    super(code)
    this.name = 'CiqualQueryError'
  }
}

/**
 * Minuscules, sans accents ni ligatures, ponctuation remplacée par des espaces.
 * « Crème, Œuf » et « creme oeuf » deviennent identiques.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Espaces de bord retirés, espaces internes réduits ; l'accent est conservé. */
export function cleanQuery(raw: string): string {
  return raw.replace(/\s+/gu, ' ').trim()
}

/** 0 = le libellé commence par la requête ; 1 = chaque mot de la requête commence un mot du libellé ; 2 = simple inclusion ; null = pas de correspondance. */
function rankOf(name: string, query: string, tokens: string[]): number | null {
  if (!tokens.every((token) => name.includes(token))) return null
  if (name.startsWith(query)) return 0
  const words = name.split(' ')
  const everyTokenStartsAWord = tokens.every((token) =>
    words.some((word) => word.startsWith(token)),
  )
  return everyTokenStartsAWord ? 1 : 2
}

/**
 * Filtre et classe des aliments. Ordre documenté :
 * rang (0, 1, 2), puis libellé le plus court, puis ordre alphabétique,
 * puis code numérique croissant. Résultat entièrement déterministe.
 */
export function rankFoods(foods: CiqualFoodRef[], rawQuery: string) {
  const query = normalizeText(rawQuery)
  const tokens = query.split(' ').filter(Boolean)
  if (tokens.length === 0) return []
  const ranked: {
    food: CiqualFoodRef
    rank: number
    normalized: string
  }[] = []
  for (const food of foods) {
    const normalized = normalizeText(food.name)
    const rank = rankOf(normalized, query, tokens)
    if (rank !== null) ranked.push({ food, rank, normalized })
  }
  ranked.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.normalized.length - b.normalized.length ||
      (a.normalized < b.normalized
        ? -1
        : a.normalized > b.normalized
          ? 1
          : 0) ||
      a.food.code.localeCompare(b.food.code, 'en', { numeric: true }),
  )
  return ranked.map((entry) => entry.food)
}

function parseLimit(raw: unknown): number {
  if (raw === undefined || raw === null) return CIQUAL_SEARCH_DEFAULT_LIMIT
  if (typeof raw !== 'string' || !/^\d{1,3}$/.test(raw)) {
    throw new CiqualQueryError('INVALID_LIMIT')
  }
  const limit = Number(raw)
  if (limit < 1 || limit > CIQUAL_SEARCH_MAX_LIMIT) {
    throw new CiqualQueryError('INVALID_LIMIT')
  }
  return limit
}

export function createCiqual(repository: CiqualRepository) {
  return {
    async search(
      rawQuery: unknown,
      rawLimit?: unknown,
      rawCategory?: unknown,
    ): Promise<CiqualSearchResponseDTO> {
      const query = typeof rawQuery === 'string' ? cleanQuery(rawQuery) : ''
      if ([...query].length < CIQUAL_SEARCH_MIN_LENGTH) {
        throw new CiqualQueryError('QUERY_TOO_SHORT')
      }
      if ([...query].length > CIQUAL_SEARCH_MAX_LENGTH) {
        throw new CiqualQueryError('QUERY_TOO_LONG')
      }
      const category =
        rawCategory === undefined || rawCategory === null ? 'all' : rawCategory
      if (
        typeof category !== 'string' ||
        ![...CIQUAL_CATEGORIES, 'all'].includes(category)
      ) {
        throw new CiqualQueryError('INVALID_CATEGORY')
      }
      const limit = parseLimit(rawLimit)

      const matches = rankFoods(
        await repository.listSearchableFoods(category as CiqualCategoryFilter),
        query,
      )
      const page = matches.slice(0, limit)
      const details = new Map(
        (
          await repository.findSummaries(
            page.map((food) => food.code),
            category as CiqualCategoryFilter,
          )
        ).map((summary) => [summary.code, summary]),
      )
      return {
        query,
        minLength: CIQUAL_SEARCH_MIN_LENGTH,
        limit,
        truncated: matches.length > limit,
        // Un aliment retiré entre les deux lectures est simplement omis.
        results: page.flatMap((food) => {
          const summary = details.get(food.code)
          return summary ? [summary] : []
        }),
      }
    },

    async findByCode(rawCode: unknown): Promise<CiqualFoodDetailDTO | null> {
      if (typeof rawCode !== 'string' || !/^\d{1,12}$/.test(rawCode)) {
        throw new CiqualQueryError('INVALID_CODE')
      }
      const food = await repository.findByCode(rawCode)
      if (!food) return null
      return {
        category: food.category,
        groupCode: food.groupCode,
        groupName: food.groupName,
        subgroupCode: food.subgroupCode,
        subgroupName: food.subgroupName,
        detailGroupCode: food.detailGroupCode,
        detailGroupName: food.detailGroupName,
        code: food.code,
        name: food.name,
        source: food.source,
        version: food.version,
        baseQuantity: food.baseQuantity,
        baseUnit: food.baseUnit,
        active: food.active,
        attribution: food.attribution,
        nutrients: food.nutrients.map((nutrient) => ({
          key: nutrient.key,
          label: CIQUAL_NUTRIENT_LABELS[nutrient.key] ?? null,
          unit: nutrient.unit,
          status: nutrient.status,
          raw: nutrient.raw,
          // Seul un « exact » donne une valeur ; une absence n'est jamais 0.
          value: nutrient.status === 'exact' ? nutrient.value : null,
          upperBoundExclusive:
            nutrient.status === 'less_than' ? nutrient.value : null,
        })),
      }
    },
  }
}
