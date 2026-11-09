export interface RecipeSummary {
  id: number
  title: string
  description: string | null
  servings: number
  photoId: string | null
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
  findById(id: number): Promise<RecipeDetail | null>
  create(input: RecipeInput): Promise<RecipeDetail>
  update(id: number, input: RecipeInput): Promise<RecipeDetail | null>
  deleteById(id: number): Promise<boolean>

  /** null = recette absente ou sans photo. */
  getPhotoId(id: number): Promise<string | null>
  /** Remplace la photo. Retourne l'ancien photoId (ou null), undefined si la recette n'existe pas. */
  setPhoto(id: number, photoId: string): Promise<string | null | undefined>
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

export interface RecipeSummary {
  id: number
  title: string
  description: string | null
  servings: number
  photoId: string | null
}
