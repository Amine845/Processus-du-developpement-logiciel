import type { RecipeTagSummaryDTO } from '../../shared/types/tag.types'
import type { EquipmentSummaryDTO } from '../../shared/types/equipment.types'
import type {
  RecipeDTO,
  RecipeInputDTO,
  RecipeSummaryDTO,
} from '../../shared/types/recipe.types'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001')
  .replace(/\/api\/recipes\/?$/, '')
  .replace(/\/$/, '')
const BASE_URL = `${API_ORIGIN}/api/recipes`
const API_ROOT = BASE_URL.replace(/\/recipes\/?$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly issues: string[]

  constructor(status: number, code: string, issues: string[] = []) {
    const messages: Record<string, string> = {
      NETWORK_ERROR:
        'Serveur inaccessible. Votre saisie est conservée ; réessayez.',
      INVALID_CIQUAL_CODE:
        'Un code CIQUAL est inconnu. Sélectionnez à nouveau cet aliment.',
      INACTIVE_CIQUAL_CODE:
        'Un aliment CIQUAL a été retiré. Sélectionnez un autre aliment.',
      RECIPE_TITLE_CONFLICT: 'Ce titre est déjà utilisé.',
      INVALID_RECIPE_TAG:
        'Un tag sélectionné est inconnu. Rechargez les choix et réessayez.',
      INACTIVE_RECIPE_TAG:
        'Un tag sélectionné a été désactivé. Rechargez les choix et réessayez.',
      INVALID_EQUIPMENT:
        'Un équipement sélectionné est inconnu. Rechargez les choix et réessayez.',
      INACTIVE_EQUIPMENT:
        'Un équipement sélectionné a été désactivé. Rechargez les choix et réessayez.',
      INVALID_RECIPE:
        'La recette contient une valeur invalide. Vérifiez les ingrédients et les étapes.',
    }
    super(messages[code] ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.issues = issues
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  base = BASE_URL,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${base}${path}`, init)
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

export const photoUrl = (photoId: string | null | undefined) =>
  photoId ? `${API_ROOT}/photos/${photoId}.webp` : undefined

export const recipesApi = {
  getTags: () =>
    request<RecipeTagSummaryDTO[]>('/recipe-tags', undefined, API_ROOT),
  getEquipment: () =>
    request<EquipmentSummaryDTO[]>('/equipment', undefined, API_ROOT),
  getAll: () => request<RecipeSummaryDTO[]>(''),
  getById: (id: number) => request<RecipeDTO>(`/${id}`),
  create: (input: RecipeInputDTO) =>
    request<RecipeDTO>('', json('POST', input)),
  update: (id: number, input: RecipeInputDTO) =>
    request<RecipeDTO>(`/${id}`, json('PUT', input)),
  delete: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
  uploadPhoto: (id: number, file: File) =>
    request<{ photoId: string }>(`/${id}/photo`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    }),
}
