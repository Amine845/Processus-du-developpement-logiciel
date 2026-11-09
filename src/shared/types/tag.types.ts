/** Contrat des tags d'ingrédients, partagé par le serveur et le client (issues #71 et #27). */

export const TAG_LABEL_MAX_LENGTH = 40

/** Identité stable (`id`), clé normalisée unique (`key`) et libellé affichable. */
export interface TagDTO {
  id: number
  key: string
  label: string
}

/** Tag proposé à un filtre : les compteurs viennent des associations réelles. */
export interface TagSummaryDTO extends TagDTO {
  ingredientCount: number
  recipeCount: number
}

export interface IngredientSummaryDTO {
  id: number
  canonicalName: string
  /** null : ingrédient manuel, sans lien avec le référentiel CIQUAL. */
  ciqualCode: string | null
  tags: TagDTO[]
}

export interface AssignTagRequestDTO {
  tagId: number
}
