import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { recipesApi } from '../api/recipes.api'
import type { RecipeSummaryDTO } from '../../shared/types/recipe.types'

export default function RecipeListPage() {
  const [recipes, setRecipes] = useState<RecipeSummaryDTO[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    recipesApi.getAll().then(
      (rows) => {
        if (active) setRecipes(rows)
      },
      () => {
        if (active) setFailed(true)
      },
    )
    return () => {
      active = false
    }
  }, [])
  return (
    <section>
      <h2>Mes recettes</h2>
      <Link to="/recipes/new">Créer une recette</Link>
      {failed ? (
        <p role="alert">Impossible de charger les recettes.</p>
      ) : recipes === null ? (
        <p role="status">Chargement…</p>
      ) : recipes.length === 0 ? (
        <p>Aucune recette enregistrée.</p>
      ) : (
        <ul>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
