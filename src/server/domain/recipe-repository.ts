export interface RecipeSummary {
  id: number
  title: string
  description: string | null
  servings: number
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: {
    ingredientId: number
    canonicalName: string
    quantity: number
    unit: string
    position: number
  }[]
  steps: { position: number; instruction: string }[]
}

/** List: ascending id. Detail collections: ascending position. */
export interface RecipeRepository {
  findAll(): Promise<RecipeSummary[]>
  /** null means absent; persistence failures reject with RecipeReadError. */
  findById(id: number): Promise<RecipeDetail | null>
}

export class RecipeReadError extends Error {
  constructor() {
    super('Unable to read recipes')
    this.name = 'RecipeReadError'
  }
}
