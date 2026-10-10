import { Router } from 'express'
import { recipeService } from '../application/recipe.service'

export const recipeRouter = Router()

recipeRouter.get('/', async (_req, res) => {
  try {
    const recipes = await recipeService.getAllRecipes()
    res.json(recipes)
  } catch {
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des recettes' })
  }
})

recipeRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  try {
    const recipe = await recipeService.getRecipeById(id)
    if (!recipe) {
      return res.status(404).json({ error: 'Recette non trouvée' })
    }
    res.json(recipe)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

recipeRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Identifiant invalide' })
  }

  try {
    await recipeService.deleteRecipe(id)
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Erreur lors de la suppression' })
  }
})
