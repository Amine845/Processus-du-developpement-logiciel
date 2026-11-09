import type { RecipeDTO, RecipeInputDTO } from '../../shared/types/recipe.types'
const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/recipes`

async function request<T>(
  path: string,
  method = 'GET',
  body?: RecipeInputDTO,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(
      'Serveur inaccessible. Votre saisie est conservée ; réessayez.',
    )
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    const messages: Record<string, string> = {
      INVALID_CIQUAL_CODE:
        'Un code CIQUAL est inconnu. Sélectionnez à nouveau cet aliment.',
      INACTIVE_CIQUAL_CODE:
        'Un aliment CIQUAL a été retiré. Sélectionnez un autre aliment.',
      RECIPE_TITLE_CONFLICT: 'Ce titre est déjà utilisé.',
      INVALID_RECIPE:
        'La recette contient une valeur invalide. Vérifiez les ingrédients et les étapes.',
    }
    throw new Error(
      messages[detail?.error] ?? 'Impossible de traiter la recette. Réessayez.',
    )
  }
  return res.status === 204 ? (undefined as T) : res.json()
}
export const recipesApi = {
  getAll: () => request<RecipeDTO[]>(''),
  getById: (id: number) => request<RecipeDTO>(`/${id}`),
  create: (body: RecipeInputDTO) => request<RecipeDTO>('', 'POST', body),
  update: (id: number, body: RecipeInputDTO) =>
    request<RecipeDTO>(`/${id}`, 'PUT', body),
  delete: (id: number) => request<void>(`/${id}`, 'DELETE'),
}
