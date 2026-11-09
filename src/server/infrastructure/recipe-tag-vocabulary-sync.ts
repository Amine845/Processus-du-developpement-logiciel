import type { PrismaClient } from '@prisma/client'
import {
  DEMO_RECIPE_TAGS,
  RECIPE_TAG_VOCABULARY,
  TagValidationError,
  parseTagLabel,
} from '../application/recipe-tags.js'

type Db = Pick<PrismaClient, 'recipeTag' | 'recipe' | 'recipeTagLink'>

export interface RecipeTagSyncReport {
  created: number
  reactivated: number
  /** Tags retirés du vocabulaire : désactivés, jamais supprimés. */
  deactivated: number
  associationsAdded: number
  /** Associations à un tag désactivé : conservées mais invisibles ; à retirer via l'API si besoin. */
  obsoleteAssociations: number
  /** Recettes de démonstration absentes de la base : ignorées, jamais créées ici. */
  skippedRecipes: string[]
}

/**
 * Aligne les tags sur le vocabulaire documenté. Relançable à volonté :
 * - crée les tags manquants et réactive ceux qui reviennent au vocabulaire ;
 * - désactive les tags qui n'en font plus partie ;
 * - ajoute les associations de démonstration sans jamais en retirer.
 * Aucun ingrédient, recette ni association utilisateur n'est supprimé ou modifié.
 * À appeler dans une transaction pour que l'ensemble soit atomique.
 */
export async function syncRecipeTagVocabulary(
  db: Db,
  vocabulary: readonly string[] = RECIPE_TAG_VOCABULARY,
  assignments: Readonly<Record<string, readonly string[]>> = DEMO_RECIPE_TAGS,
): Promise<RecipeTagSyncReport> {
  const wanted = new Map<string, string>()
  for (const raw of vocabulary) {
    const { key, label } = parseTagLabel(raw)
    if (wanted.has(key)) {
      throw new TagValidationError([`vocabulary: duplicate tag key "${key}"`])
    }
    wanted.set(key, label)
  }

  const report: RecipeTagSyncReport = {
    created: 0,
    reactivated: 0,
    deactivated: 0,
    associationsAdded: 0,
    obsoleteAssociations: 0,
    skippedRecipes: [],
  }

  const existing = new Map(
    (await db.recipeTag.findMany()).map((tag) => [tag.key, tag]),
  )
  const idByKey = new Map<string, number>()

  for (const [key, label] of wanted) {
    const current = existing.get(key)
    if (!current) {
      const created = await db.recipeTag.create({ data: { key, label } })
      idByKey.set(key, created.id)
      report.created++
    } else {
      if (!current.active) report.reactivated++
      if (!current.active || current.label !== label) {
        await db.recipeTag.update({
          where: { id: current.id },
          data: { active: true, label },
        })
      }
      idByKey.set(key, current.id)
    }
  }

  for (const [key, tag] of existing) {
    if (wanted.has(key)) continue
    if (tag.active) {
      await db.recipeTag.update({
        where: { id: tag.id },
        data: { active: false },
      })
      report.deactivated++
    }
  }
  report.obsoleteAssociations = await db.recipeTagLink.count({
    where: { tag: { active: false } },
  })
  // Compté après les désactivations ci-dessus, donc à jour pour cette exécution.

  for (const [name, labels] of Object.entries(assignments)) {
    const recipe = await db.recipe.findUnique({
      where: { title: name },
      select: { id: true },
    })
    if (!recipe) {
      report.skippedRecipes.push(name)
      continue
    }
    for (const rawLabel of labels) {
      const tagId = idByKey.get(parseTagLabel(rawLabel).key)
      if (tagId === undefined) {
        throw new TagValidationError([
          `assignments: "${rawLabel}" is not in the vocabulary`,
        ])
      }
      const where = {
        recipeId_tagId: { recipeId: recipe.id, tagId },
      }
      if (!(await db.recipeTagLink.findUnique({ where }))) {
        await db.recipeTagLink.create({
          data: { recipeId: recipe.id, tagId },
        })
        report.associationsAdded++
      }
    }
  }
  return report
}
