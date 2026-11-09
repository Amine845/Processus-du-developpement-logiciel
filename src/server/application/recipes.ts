import type { RecipeRepository } from '../domain/recipe-repository.js'
import type { PhotoStorage } from '../domain/photo-storage.js'
import { parseRecipeInput } from './recipe-input.js'

export function createRecipes(
  repository: RecipeRepository,
  photos?: PhotoStorage,
) {
  return {
    findAll: () => repository.findAll(),
    findById: (id: number) => repository.findById(id),
    create: (body: unknown) => repository.create(parseRecipeInput(body)),
    update: (id: number, body: unknown) =>
      repository.update(id, parseRecipeInput(body)),

    async deleteById(id: number) {
      const photoId = photos ? await repository.getPhotoId(id) : null
      const deleted = await repository.deleteById(id)
      if (deleted) await photos?.remove(photoId) // cascade SQL pour la ligne, ici pour le fichier
      return deleted
    },

    /** undefined = recette absente. Lève InvalidImageError si l'image est illisible. */
    async setPhoto(id: number, raw: Buffer): Promise<string | undefined> {
      if (!photos) throw new Error('Photo storage not configured')
      const photoId = await photos.save(raw)
      try {
        const previous = await repository.setPhoto(id, photoId)
        if (previous === undefined) {
          await photos.remove(photoId)
          return undefined
        }
        await photos.remove(previous)
        return photoId
      } catch (error) {
        await photos.remove(photoId) // pas de fichier orphelin
        throw error
      }
    },
  }
}
