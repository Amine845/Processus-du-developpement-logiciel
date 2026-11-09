import type { RecipeTagSummaryDTO } from '../../shared/types/tag.types.js'
export type AssignResult =
  | { kind: 'created' }
  | { kind: 'exists' }
  | { kind: 'recipe_not_found' }
  | { kind: 'tag_not_found' }
  | { kind: 'tag_inactive' }

export type RemoveResult =
  { kind: 'removed' } | { kind: 'absent' } | { kind: 'recipe_not_found' }

/**
 * Les lectures n'exposent que les tags actifs, triés par clé croissante.
 * Aucune opération ne supprime un ingrédient ou une recette.
 */
export interface RecipeTagRepository {
  /** Tags actifs avec leurs compteurs de recettes, par clé croissante. */
  listTags(): Promise<RecipeTagSummaryDTO[]>
  /** Idempotent : une association existante n'est ni dupliquée ni modifiée. */
  assign(recipeId: number, tagId: number): Promise<AssignResult>
  /** Retire uniquement l'association ; autorisé même pour un tag désactivé. */
  remove(recipeId: number, tagId: number): Promise<RemoveResult>
}

export class RecipeTagReadError extends Error {
  constructor() {
    super('Unable to read recipe tags')
    this.name = 'RecipeTagReadError'
  }
}

export class RecipeTagWriteError extends Error {
  constructor() {
    super('Unable to write recipe tags')
    this.name = 'RecipeTagWriteError'
  }
}
