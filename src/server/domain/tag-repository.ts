import type {
  IngredientSummaryDTO,
  TagDTO,
  TagSummaryDTO,
} from '../../shared/types/tag.types.js'

export type TagRef = TagDTO
export type TagSummary = TagSummaryDTO
export type IngredientSummary = IngredientSummaryDTO

export type AssignResult =
  | { kind: 'created' }
  | { kind: 'exists' }
  | { kind: 'ingredient_not_found' }
  | { kind: 'tag_not_found' }
  | { kind: 'tag_inactive' }

export type RemoveResult =
  { kind: 'removed' } | { kind: 'absent' } | { kind: 'ingredient_not_found' }

/**
 * Les lectures n'exposent que les tags actifs, triés par clé croissante.
 * Aucune opération ne supprime un ingrédient ou une recette.
 */
export interface IngredientTagRepository {
  /** Tags actifs avec leurs compteurs d'ingrédients et de recettes, par clé croissante. */
  listTags(): Promise<TagSummary[]>
  /** Ingrédients par id croissant. */
  listIngredients(): Promise<IngredientSummary[]>
  /** null : ingrédient absent. */
  findIngredient(id: number): Promise<IngredientSummary | null>
  /** Idempotent : une association existante n'est ni dupliquée ni modifiée. */
  assign(ingredientId: number, tagId: number): Promise<AssignResult>
  /** Retire uniquement l'association ; autorisé même pour un tag désactivé. */
  remove(ingredientId: number, tagId: number): Promise<RemoveResult>
}

export class TagReadError extends Error {
  constructor() {
    super('Unable to read ingredient tags')
    this.name = 'TagReadError'
  }
}

export class TagWriteError extends Error {
  constructor() {
    super('Unable to write ingredient tags')
    this.name = 'TagWriteError'
  }
}
