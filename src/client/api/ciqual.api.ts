import type {
  CiqualCategoryFilter,
  ApiErrorDTO,
  CiqualFoodDetailDTO,
  CiqualSearchResponseDTO,
} from '../../shared/types/ciqual.types'

const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const BASE_URL = `${API_ORIGIN}/api/ciqual`

/** Erreur HTTP (status renseigné) ou réseau (status null) ; jamais de détail serveur brut. */
export class CiqualApiError extends Error {
  readonly status: number | null
  readonly code: string

  constructor(status: number | null, code: string) {
    super(code)
    this.name = 'CiqualApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  signal?: AbortSignal
}

async function getJson<T>(url: string, { signal }: RequestOptions): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    // Une annulation volontaire n'est pas une panne : on la laisse remonter telle quelle.
    if (signal?.aborted) throw error
    throw new CiqualApiError(null, 'NETWORK_ERROR')
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorDTO | null
    throw new CiqualApiError(response.status, body?.error ?? 'HTTP_ERROR')
  }
  return (await response.json()) as T
}

export const ciqualApi = {
  search(
    query: string,
    options: RequestOptions & {
      limit?: number
      category?: CiqualCategoryFilter
    } = {},
  ): Promise<CiqualSearchResponseDTO> {
    const params = new URLSearchParams({ q: query })
    if (options.category !== undefined) params.set('category', options.category)
    if (options.limit !== undefined) params.set('limit', String(options.limit))
    return getJson(`${BASE_URL}/foods?${params}`, options)
  },

  getByCode(
    code: string,
    options: RequestOptions = {},
  ): Promise<CiqualFoodDetailDTO> {
    return getJson(`${BASE_URL}/foods/${encodeURIComponent(code)}`, options)
  },
}
