import type { RecipeRepository } from '../domain/recipe-repository.js'

export function createRecipes(repository: RecipeRepository) {
  return {
    findAll: () => repository.findAll(),
    findById: (id: number) => repository.findById(id),
  }
}
