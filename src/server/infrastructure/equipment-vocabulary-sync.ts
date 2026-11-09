import type { PrismaClient } from '@prisma/client'
import {
  DEMO_RECIPE_EQUIPMENT,
  EQUIPMENT_VOCABULARY,
  EquipmentValidationError,
  parseEquipmentLabel,
} from '../application/recipe-equipment.js'

type Db = Pick<PrismaClient, 'equipment' | 'recipe' | 'recipeEquipment'>

export interface EquipmentSyncReport {
  created: number
  reactivated: number
  /** Équipements retirés du vocabulaire : désactivés, jamais supprimés. */
  deactivated: number
  associationsAdded: number
  /** Associations à un équipement désactivé : conservées mais invisibles ; à retirer via l'API si besoin. */
  obsoleteAssociations: number
  /** Recettes de démonstration absentes de la base : ignorées, jamais créées ici. */
  skippedRecipes: string[]
}

/**
 * Aligne les équipements sur le vocabulaire documenté. Relançable à volonté :
 * - crée les équipements manquants et réactive ceux qui reviennent au vocabulaire ;
 * - désactive les tags qui n'en font plus partie ;
 * - ajoute les associations de démonstration sans jamais en retirer.
 * Aucun ingrédient, recette ni association utilisateur n'est supprimé ou modifié.
 * À appeler dans une transaction pour que l'ensemble soit atomique.
 */
export async function syncEquipmentVocabulary(
  db: Db,
  vocabulary: readonly string[] = EQUIPMENT_VOCABULARY,
  assignments: Readonly<
    Record<string, readonly string[]>
  > = DEMO_RECIPE_EQUIPMENT,
): Promise<EquipmentSyncReport> {
  const wanted = new Map<string, string>()
  for (const raw of vocabulary) {
    const { key, label } = parseEquipmentLabel(raw)
    if (wanted.has(key)) {
      throw new EquipmentValidationError([
        `vocabulary: duplicate tag key "${key}"`,
      ])
    }
    wanted.set(key, label)
  }

  const report: EquipmentSyncReport = {
    created: 0,
    reactivated: 0,
    deactivated: 0,
    associationsAdded: 0,
    obsoleteAssociations: 0,
    skippedRecipes: [],
  }

  const existing = new Map(
    (await db.equipment.findMany()).map((tag) => [tag.key, tag]),
  )
  const idByKey = new Map<string, number>()

  for (const [key, label] of wanted) {
    const current = existing.get(key)
    if (!current) {
      const created = await db.equipment.create({ data: { key, label } })
      idByKey.set(key, created.id)
      report.created++
    } else {
      if (!current.active) report.reactivated++
      if (!current.active || current.label !== label) {
        await db.equipment.update({
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
      await db.equipment.update({
        where: { id: tag.id },
        data: { active: false },
      })
      report.deactivated++
    }
  }
  report.obsoleteAssociations = await db.recipeEquipment.count({
    where: { equipment: { active: false } },
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
      const equipmentId = idByKey.get(parseEquipmentLabel(rawLabel).key)
      if (equipmentId === undefined) {
        throw new EquipmentValidationError([
          `assignments: "${rawLabel}" is not in the vocabulary`,
        ])
      }
      const where = {
        recipeId_equipmentId: { recipeId: recipe.id, equipmentId },
      }
      if (!(await db.recipeEquipment.findUnique({ where }))) {
        await db.recipeEquipment.create({
          data: { recipeId: recipe.id, equipmentId },
        })
        report.associationsAdded++
      }
    }
  }
  return report
}
