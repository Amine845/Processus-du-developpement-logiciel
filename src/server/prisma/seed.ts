import { resolveIngredient } from '../infrastructure/ingredient-identity.js'
import type { PrismaClient } from '@prisma/client'

// Les titres et noms canoniques servent de clés naturelles pour la démonstration.
// Ces recettes sont réservées au seed : une relance restaure leurs valeurs.
export const demoRecipes = [
  {
    title: 'Gâteau au chocolat fondant',
    description: 'Un gâteau au chocolat simple à partager.',
    servings: 6,
    ingredients: [
      { canonicalName: 'Chocolat noir', quantity: 200, unit: 'g' },
      { canonicalName: 'Œufs', quantity: 3, unit: 'piece' },
      { canonicalName: 'Farine de blé', quantity: 100, unit: 'g' },
      { canonicalName: 'Beurre', quantity: 100, unit: 'g' },
      { canonicalName: 'Sucre', quantity: 100, unit: 'g' },
    ],
    steps: [
      'Préchauffer le four à 180 °C.',
      'Faire fondre le chocolat avec le beurre.',
      'Battre les œufs avec le sucre, puis incorporer la farine et le chocolat fondu.',
      'Verser dans un moule et cuire environ 20 minutes. Laisser tiédir avant de servir.',
    ],
  },
  {
    title: 'Pâte à crêpes traditionnelle',
    description: 'Une pâte à crêpes pour le goûter.',
    servings: 4,
    ingredients: [
      { canonicalName: 'Farine de blé', quantity: 250, unit: 'g' },
      { canonicalName: 'Œufs', quantity: 2, unit: 'piece' },
      { canonicalName: 'Lait demi-écrémé', quantity: 500, unit: 'ml' },
      { canonicalName: 'Beurre', quantity: 20, unit: 'g' },
    ],
    steps: [
      'Verser la farine dans un saladier et creuser un puits.',
      'Ajouter les œufs, puis incorporer progressivement le lait en fouettant.',
      'Laisser reposer la pâte 30 minutes.',
      'Graisser légèrement une poêle chaude avec le beurre et cuire les crêpes des deux côtés.',
    ],
  },
  {
    title: 'Omelette nature rapide',
    description: 'Une omelette pour une personne.',
    servings: 1,
    ingredients: [
      { canonicalName: 'Œufs', quantity: 2, unit: 'piece' },
      { canonicalName: 'Beurre', quantity: 5, unit: 'g' },
    ],
    steps: [
      'Battre les œufs dans un bol.',
      'Faire fondre le beurre dans une poêle à feu moyen.',
      'Verser les œufs, cuire en ramenant les bords vers le centre, puis replier et servir.',
    ],
  },
]

/** Atomique, relançable, sans suppression globale des données utilisateur. */
export async function seedDatabase(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    for (const example of demoRecipes) {
      const { ingredients, steps, ...data } = example
      const recipe = await tx.recipe.upsert({
        where: { title: data.title },
        update: data,
        create: data,
      })
      for (const [index, item] of ingredients.entries()) {
        const ingredientId = await resolveIngredient(
          tx,
          item.canonicalName,
          null,
        )
        const line = {
          ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        }
        const position = index + 1
        await tx.recipeIngredient.upsert({
          where: { recipeId_position: { recipeId: recipe.id, position } },
          update: line,
          create: { recipeId: recipe.id, position, ...line },
        })
      }
      for (const [index, instruction] of steps.entries()) {
        const position = index + 1
        await tx.recipeStep.upsert({
          where: { recipeId_position: { recipeId: recipe.id, position } },
          update: { instruction },
          create: { recipeId: recipe.id, position, instruction },
        })
      }
      // Retirer uniquement les anciennes positions de ces recettes de démo.
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: recipe.id, position: { gt: ingredients.length } },
      })
      await tx.recipeStep.deleteMany({
        where: { recipeId: recipe.id, position: { gt: steps.length } },
      })
    }
  })
}
