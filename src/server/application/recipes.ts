import type { RecipeRepository } from '../domain/recipe-repository.js'
import { parseRecipeInput } from './recipe-input.js'

export function createRecipes(repository: RecipeRepository) {
  return {
    findAll: () => repository.findAll(),
    findById: (id: number) => repository.findById(id),
    create: (body: unknown) => repository.create(parseRecipeInput(body)),
    update: (id: number, body: unknown) =>
      repository.update(id, parseRecipeInput(body)),
    deleteById: (id: number) => repository.deleteById(id),
  }
}
