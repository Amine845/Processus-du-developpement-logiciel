import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { recipesApi } from '../api/recipes.api'
import type { RecipeDTO } from '../../shared/types/recipe.types'
import CiqualNutrientPreview from '../features/ingredients/CiqualNutrientPreview'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<{
    id?: string
    recipe?: RecipeDTO
    failed?: boolean
  }>({})
  useEffect(() => {
    let cancelled = false
    recipesApi.getById(Number(id)).then(
      (recipe) => {
        if (!cancelled) setState({ id, recipe })
      },
      () => {
        if (!cancelled) setState({ id, failed: true })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id])
  if (state.id !== id) return <p role="status">Chargement…</p>
  if (state.failed || !state.recipe)
    return (
      <p role="alert">
        Impossible de charger la recette.{' '}
        <Link to="/recipes">Retour aux recettes</Link>
      </p>
    )
  const recipe = state.recipe
  return (
    <article className="recipe-editor">
      <h2>{recipe.title}</h2>
      {recipe.description && <p>{recipe.description}</p>}
      <p>{recipe.servings} portion(s)</p>
      <h3>Ingrédients</h3>
      <ul>
        {recipe.ingredients.map((line) => (
          <li key={line.position}>
            {line.canonicalName} : {line.quantity} {line.unit}
            {line.ciqualCode ? (
              <>
                <p>CIQUAL — code {line.ciqualCode}</p>
                <CiqualNutrientPreview code={line.ciqualCode} />
              </>
            ) : (
              <p>Ingrédient manuel — aucune donnée nutritionnelle associée.</p>
            )}
          </li>
        ))}
      </ul>
      <h3>Préparation</h3>
      <ol>
        {recipe.steps.map((step) => (
          <li key={step.position}>{step.instruction}</li>
        ))}
      </ol>
      <p>
        Les valeurs de référence CIQUAL ne sont pas un total nutritionnel de la
        recette.
      </p>
      <Link to="/recipes">Retour aux recettes</Link>
    </article>
  )
}
