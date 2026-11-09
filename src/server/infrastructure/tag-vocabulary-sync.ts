import type { PrismaClient } from '@prisma/client'
import {
  DEMO_INGREDIENT_TAGS,
  TAG_VOCABULARY,
  TagValidationError,
  parseTagLabel,
} from '../application/ingredient-tags.js'

type Db = Pick<PrismaClient, 'tag' | 'ingredient' | 'ingredientTag'>

export interface TagSyncReport {
  created: number
  reactivated: number
  /** Tags retirés du vocabulaire : désactivés, jamais supprimés. */
  deactivated: number
  associationsAdded: number
  /** Associations à un tag désactivé : conservées mais invisibles ; à retirer via l'API si besoin. */
  obsoleteAssociations: number
  /** Ingrédients de démonstration absents de la base : ignorés, jamais créés ici. */
  skippedIngredients: string[]
}

/**
 * Aligne les tags sur le vocabulaire documenté. Relançable à volonté :
 * - crée les tags manquants et réactive ceux qui reviennent au vocabulaire ;
 * - désactive les tags qui n'en font plus partie ;
 * - ajoute les associations de démonstration sans jamais en retirer.
 * Aucun ingrédient, recette ni association utilisateur n'est supprimé ou modifié.
 * À appeler dans une transaction pour que l'ensemble soit atomique.
 */
export async function syncTagVocabulary(
  db: Db,
  vocabulary: readonly string[] = TAG_VOCABULARY,
  assignments: Readonly<
    Record<string, readonly string[]>
  > = DEMO_INGREDIENT_TAGS,
): Promise<TagSyncReport> {
  const wanted = new Map<string, string>()
  for (const raw of vocabulary) {
    const { key, label } = parseTagLabel(raw)
    if (wanted.has(key)) {
      throw new TagValidationError([`vocabulary: duplicate tag key "${key}"`])
    }
    wanted.set(key, label)
  }

  const report: TagSyncReport = {
    created: 0,
    reactivated: 0,
    deactivated: 0,
    associationsAdded: 0,
    obsoleteAssociations: 0,
    skippedIngredients: [],
  }

  const existing = new Map(
    (await db.tag.findMany()).map((tag) => [tag.key, tag]),
  )
  const idByKey = new Map<string, number>()

  for (const [key, label] of wanted) {
    const current = existing.get(key)
    if (!current) {
      const created = await db.tag.create({ data: { key, label } })
      idByKey.set(key, created.id)
      report.created++
    } else {
      if (!current.active) report.reactivated++
      if (!current.active || current.label !== label) {
        await db.tag.update({
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
      await db.tag.update({ where: { id: tag.id }, data: { active: false } })
      report.deactivated++
    }
  }
  report.obsoleteAssociations = await db.ingredientTag.count({
    where: { tag: { active: false } },
  })
  // Compté après les désactivations ci-dessus, donc à jour pour cette exécution.

  for (const [name, labels] of Object.entries(assignments)) {
    const ingredients = await db.ingredient.findMany({
      where: { canonicalName: name },
      select: { id: true },
      orderBy: { id: 'asc' },
    })
    if (ingredients.length === 0) {
      report.skippedIngredients.push(name)
      continue
    }
    // Le nom n’est plus unique : conserver toutes les lignes de même nom exact.
    for (const ingredient of ingredients) {
      for (const rawLabel of labels) {
        const tagId = idByKey.get(parseTagLabel(rawLabel).key)
        if (tagId === undefined) {
          throw new TagValidationError([
            `assignments: "${rawLabel}" is not in the vocabulary`,
          ])
        }
        const where = {
          ingredientId_tagId: { ingredientId: ingredient.id, tagId },
        }
        if (!(await db.ingredientTag.findUnique({ where }))) {
          await db.ingredientTag.create({
            data: { ingredientId: ingredient.id, tagId },
          })
          report.associationsAdded++
        }
      }
    }
  }
  return report
}
