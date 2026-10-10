import type { RecipeDTO } from '../../shared/types/recipe.types'

const BASE_URL = 'http://localhost:3001/api/recipes'

export const recipesApi = {
  async getAll(): Promise<RecipeDTO[]> {
    const res = await fetch(BASE_URL)
    if (!res.ok) {
      throw new Error('Impossible de charger les recettes')
    }
    return res.json()
  },

  async getById(id: number): Promise<RecipeDTO> {
    const res = await fetch(`${BASE_URL}/${id}`)
    if (!res.ok) {
      throw new Error(`Recette #${id} introuvable`)
    }
    return res.json()
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      throw new Error(`Échec de la suppression de la recette #${id}`)
    }
  },
}
