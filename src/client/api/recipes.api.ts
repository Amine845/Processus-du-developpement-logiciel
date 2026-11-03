import type {
  RecipeDTO,
  RecipeInputDTO,
  RecipeSummaryDTO,
} from '../../shared/types/recipe.types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/recipes'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly issues: string[]

  constructor(status: number, code: string, issues: string[] = []) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.issues = issues
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, init)
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? 'UNKNOWN', body.issues)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (method: string, body: RecipeInputDTO): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const recipesApi = {
  getAll: () => request<RecipeSummaryDTO[]>(''),
  getById: (id: number) => request<RecipeDTO>(`/${id}`),
  create: (input: RecipeInputDTO) =>
    request<RecipeDTO>('', json('POST', input)),
  update: (id: number, input: RecipeInputDTO) =>
    request<RecipeDTO>(`/${id}`, json('PUT', input)),
  delete: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
}
