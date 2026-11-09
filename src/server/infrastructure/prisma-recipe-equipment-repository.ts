import type { PrismaClient } from '@prisma/client'
import {
  RecipeEquipmentReadError,
  RecipeEquipmentWriteError,
  type RecipeEquipmentRepository,
} from '../domain/recipe-equipment-repository.js'
type Db = Pick<PrismaClient, 'equipment' | 'recipeEquipment' | 'recipe'>
export function createPrismaRecipeEquipmentRepository(
  client: Db,
): RecipeEquipmentRepository {
  return {
    async listEquipment() {
      try {
        const equipment = await client.equipment.findMany({
          where: { active: true },
          orderBy: { key: 'asc' },
          select: {
            id: true,
            key: true,
            label: true,
            _count: { select: { recipes: true } },
          },
        })
        return equipment.map(({ _count, ...item }) => ({
          ...item,
          recipeCount: _count.recipes,
        }))
      } catch {
        throw new RecipeEquipmentReadError()
      }
    },

    async assign(recipeId, equipmentId) {
      try {
        const [recipe, item] = await Promise.all([
          client.recipe.findUnique({
            where: { id: recipeId },
            select: { id: true },
          }),
          client.equipment.findUnique({
            where: { id: equipmentId },
            select: { active: true },
          }),
        ])
        if (!recipe) return { kind: 'recipe_not_found' }
        if (!item) return { kind: 'equipment_not_found' }
        if (!item.active) return { kind: 'equipment_inactive' }
        const where = { recipeId_equipmentId: { recipeId, equipmentId } }
        const existing = await client.recipeEquipment.findUnique({
          where,
          select: { equipmentId: true },
        })
        if (existing) return { kind: 'exists' }
        try {
          await client.recipeEquipment.create({
            data: { recipeId, equipmentId },
          })
        } catch (error) {
          // Deux requêtes simultanées : la clé primaire a tranché, le résultat est le même.
          const stillMissing = !(await client.recipeEquipment.findUnique({
            where,
            select: { equipmentId: true },
          }))
          if (stillMissing) throw error
          return { kind: 'exists' }
        }
        return { kind: 'created' }
      } catch {
        throw new RecipeEquipmentWriteError()
      }
    },

    async remove(recipeId, equipmentId) {
      try {
        const { count } = await client.recipeEquipment.deleteMany({
          where: { recipeId, equipmentId },
        })
        if (count > 0) return { kind: 'removed' }
        const recipe = await client.recipe.findUnique({
          where: { id: recipeId },
          select: { id: true },
        })
        return { kind: recipe ? 'absent' : 'recipe_not_found' }
      } catch {
        throw new RecipeEquipmentWriteError()
      }
    },
  }
}
