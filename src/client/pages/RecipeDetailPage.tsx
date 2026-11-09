import CiqualNutrientPreview from '../features/ingredients/CiqualNutrientPreview'
import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { recipesApi, ApiError, photoUrl } from '../api/recipes.api'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { RecipeDTO } from '../../shared/types/recipe.types'

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<RecipeDTO | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [loadFailed, setLoadFailed] = useState(false)
  const [loadedId, setLoadedId] = useState<string | undefined>()
  useEffect(() => {
    let active = true
    recipesApi.getById(Number(id)).then(
      (data) => {
        if (active) {
          setRecipe(data)
          setLoadFailed(false)
          setLoadedId(id)
        }
      },
      () => {
        if (active) {
          setLoadFailed(true)
          setLoadedId(id)
        }
      },
    )
    return () => {
      active = false
    }
  }, [id])

  const openConfirm = () => {
    setDeleteError(null)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!recipe) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await recipesApi.delete(recipe.id)
      navigate('/recipes', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RECIPE_NOT_FOUND') {
        // Déjà supprimée ailleurs : l'état voulu est atteint.
        navigate('/recipes', { replace: true })
        return
      }
      setDeleteError(
        err instanceof ApiError && err.code === 'NETWORK_ERROR'
          ? 'Serveur injoignable. Réessaie dans un instant.'
          : 'La suppression a échoué. Réessaie.',
      )
      setDeleting(false)
    }
  }

  if (loadedId !== id) return <p role="status">Chargement…</p>
  if (loadFailed)
    return (
      <p role="alert">
        Impossible de charger la recette.{' '}
        <Link to="/recipes">Retour aux recettes</Link>
      </p>
    )
  if (!recipe) return <p role="status">Chargement…</p>

  return (
    <article style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)}>← Retour</button>
        <button
          onClick={openConfirm}
          style={{
            color: '#b91c1c',
            border: '1px solid #b91c1c',
            background: 'transparent',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Supprimer la recette
        </button>
      </div>
      {recipe.photoId && (
        <img
          src={photoUrl(recipe.photoId)}
          alt=""
          style={{
            width: '100%',
            maxHeight: 320,
            objectFit: 'cover',
            borderRadius: 12,
            marginBottom: 16,
          }}
        />
      )}
      <h2>{recipe.title}</h2>
      <p>{recipe.description}</p>

      <p>{recipe.servings} portion(s)</p>
      <h3>Ingrédients</h3>
      <ul>
        {recipe.ingredients.map((ing) => (
          <li key={ing.position}>
            {ing.quantity} {ing.unit} de {ing.canonicalName}
            {ing.ciqualCode ? (
              <>
                <p>CIQUAL — code {ing.ciqualCode}</p>
                <CiqualNutrientPreview code={ing.ciqualCode} />
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
      {(recipe.equipment?.length ?? 0) > 0 && (
        <>
          <h3>Matériel requis</h3>
          <ul>
            {recipe.equipment!.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </>
      )}
      {(recipe.recipeTags?.length ?? 0) > 0 && (
        <p>
          Tags de la recette :{' '}
          {recipe.recipeTags!.map((tag) => tag.label).join(', ')}
        </p>
      )}
      <p>
        Les valeurs de référence CIQUAL ne sont pas un total nutritionnel de la
        recette.
      </p>
      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer cette recette ?"
        message={`« ${recipe.title} » sera supprimée définitivement, avec ses ingrédients et ses étapes.`}
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  )
}

export default RecipeDetailPage
