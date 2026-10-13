import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du peuplement de la base de données (Seed)...');

  // 1. Ingrédients partagés
  const oeufs = await prisma.ingredient.upsert({
    where: { canonicalName: 'Œufs' },
    update: {},
    create: { canonicalName: 'Œufs' },
  });

  const farine = await prisma.ingredient.upsert({
    where: { canonicalName: 'Farine de blé' },
    update: {},
    create: { canonicalName: 'Farine de blé' },
  });

  const chocolat = await prisma.ingredient.upsert({
    where: { canonicalName: 'Chocolat noir' },
    update: {},
    create: { canonicalName: 'Chocolat noir' },
  });

  const lait = await prisma.ingredient.upsert({
    where: { canonicalName: 'Lait demi-écrémé' },
    update: {},
    create: { canonicalName: 'Lait demi-écrémé' },
  });

  // 2. Recette 1 : Gâteau au chocolat
  const gateau = await prisma.recipe.upsert({
    where: { title: 'Gâteau au chocolat fondant' },
    update: { servings: 6, description: 'Un classique indémodable.' },
    create: {
      title: 'Gâteau au chocolat fondant',
      description: 'Un classique indémodable.',
      servings: 6,
    },
  });

  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: gateau.id, position: 1 } },
    update: { quantity: 200, unit: 'g', ingredientId: chocolat.id },
    create: { recipeId: gateau.id, position: 1, quantity: 200, unit: 'g', ingredientId: chocolat.id },
  });
  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: gateau.id, position: 2 } },
    update: { quantity: 3, unit: 'piece', ingredientId: oeufs.id }, // Corrigé ici
    create: { recipeId: gateau.id, position: 2, quantity: 3, unit: 'piece', ingredientId: oeufs.id }, // Corrigé ici
  });
  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: gateau.id, position: 3 } },
    update: { quantity: 100, unit: 'g', ingredientId: farine.id },
    create: { recipeId: gateau.id, position: 3, quantity: 100, unit: 'g', ingredientId: farine.id },
  });

  await prisma.recipeStep.upsert({
    where: { recipeId_position: { recipeId: gateau.id, position: 1 } },
    update: { instruction: 'Préchauffer le four à 180°C.' },
    create: { recipeId: gateau.id, position: 1, instruction: 'Préchauffer le four à 180°C.' },
  });
  await prisma.recipeStep.upsert({
    where: { recipeId_position: { recipeId: gateau.id, position: 2 } },
    update: { instruction: 'Faire fondre le chocolat noir.' },
    create: { recipeId: gateau.id, position: 2, instruction: 'Faire fondre le chocolat noir.' },
  });

  // 3. Recette 2 : Pâte à crêpes
  const crepes = await prisma.recipe.upsert({
    where: { title: 'Pâte à crêpes traditionnelle' },
    update: { servings: 4, description: 'Idéal pour le goûter.' },
    create: {
      title: 'Pâte à crêpes traditionnelle',
      description: 'Idéal pour le goûter.',
      servings: 4,
    },
  });

  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: crepes.id, position: 1 } },
    update: { quantity: 250, unit: 'g', ingredientId: farine.id },
    create: { recipeId: crepes.id, position: 1, quantity: 250, unit: 'g', ingredientId: farine.id },
  });
  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: crepes.id, position: 2 } },
    update: { quantity: 2, unit: 'piece', ingredientId: oeufs.id }, // Corrigé ici
    create: { recipeId: crepes.id, position: 2, quantity: 2, unit: 'piece', ingredientId: oeufs.id }, // Corrigé ici
  });
  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: crepes.id, position: 3 } },
    update: { quantity: 500, unit: 'ml', ingredientId: lait.id },
    create: { recipeId: crepes.id, position: 3, quantity: 500, unit: 'ml', ingredientId: lait.id },
  });

  await prisma.recipeStep.upsert({
    where: { recipeId_position: { recipeId: crepes.id, position: 1 } },
    update: { instruction: 'Verser la farine dans un saladier.' },
    create: { recipeId: crepes.id, position: 1, instruction: 'Verser la farine dans un saladier.' },
  });

  // 4. Recette 3 : Omelette simple
  const omelette = await prisma.recipe.upsert({
    where: { title: 'Omelette nature rapide' },
    update: { servings: 1, description: 'Rapide et efficace.' },
    create: {
      title: 'Omelette nature rapide',
      description: 'Rapide et efficace.',
      servings: 1,
    },
  });

  await prisma.recipeIngredient.upsert({
    where: { recipeId_position: { recipeId: omelette.id, position: 1 } },
    update: { quantity: 2, unit: 'piece', ingredientId: oeufs.id }, // Corrigé ici
    create: { recipeId: omelette.id, position: 1, quantity: 2, unit: 'piece', ingredientId: oeufs.id }, // Corrigé ici
  });

  await prisma.recipeStep.upsert({
    where: { recipeId_position: { recipeId: omelette.id, position: 1 } },
    update: { instruction: 'Battre les œufs dans un bol.' },
    create: { recipeId: omelette.id, position: 1, instruction: 'Battre les œufs dans un bol.' },
  });

  console.log('Seed exécuté avec succès !');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });