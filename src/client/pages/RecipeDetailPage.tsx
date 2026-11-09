import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

  useEffect(() => {
    if (id) {
      recipesApi
        .getById(Number(id))
        .then((data) => setRecipe(data))
        .catch((err) => console.error('Erreur de chargement', err))
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

  if (!recipe) return <div>Chargement...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
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

      <h3>Ingrédients</h3>
      <ul>
        {recipe.ingredients.map((ing) => (
          <li key={ing.position}>
            {ing.quantity} {ing.unit} de {ing.canonicalName}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer cette recette ?"
        message={`« ${recipe.title} » sera supprimée définitivement, avec ses ingrédients et ses étapes.`}
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
