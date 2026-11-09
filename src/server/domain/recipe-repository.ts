import type { TagRef } from './tag-repository.js'

export interface RecipeSummary {
  id: number
  title: string
  description: string | null
  servings: number
  /** Lecture seule : union des tags actifs des ingrédients, triée par clé. */
  ingredientTags: TagRef[]
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: {
    ingredientId: number
    canonicalName: string
    quantity: number
    unit: string
    position: number
    tags: TagRef[]
  }[]
  steps: { position: number; instruction: string }[]
}

/** Validated input: positions are derived from array order by the repository. */
export interface RecipeInput {
  title: string
  description: string | null
  servings: number
  ingredients: { canonicalName: string; quantity: number; unit: string }[]
  steps: { instruction: string }[]
}

/** List: ascending id. Detail collections: ascending position. */
export interface RecipeRepository {
  findAll(): Promise<RecipeSummary[]>
  /** null means absent; persistence failures reject with RecipeReadError. */
  findById(id: number): Promise<RecipeDetail | null>
  /** Rejects with RecipeConflictError if the title is already used. */
  create(input: RecipeInput): Promise<RecipeDetail>
  /** Full replacement. null means absent. */
  update(id: number, input: RecipeInput): Promise<RecipeDetail | null>
  /** false means absent. Steps and ingredient lines are deleted by cascade. */
  deleteById(id: number): Promise<boolean>
}

export class RecipeReadError extends Error {
  constructor() {
    super('Unable to read recipes')
    this.name = 'RecipeReadError'
  }
}

export class RecipeWriteError extends Error {
  constructor() {
    super('Unable to write recipes')
    this.name = 'RecipeWriteError'
  }
}

export class RecipeConflictError extends Error {
  constructor() {
    super('A recipe with this title already exists')
    this.name = 'RecipeConflictError'
  }
}
