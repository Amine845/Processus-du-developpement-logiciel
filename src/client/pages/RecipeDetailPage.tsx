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

  if (loadedId !== id)
    return (
      <p role="status" style={{ padding: '20px' }}>
        Chargement…
      </p>
    )
  if (loadFailed)
    return (
      <p role="alert" style={{ padding: '20px', color: 'red' }}>
        Impossible de charger la recette.{' '}
        <Link to="/recipes" style={{ textDecoration: 'underline' }}>
          Retour aux recettes
        </Link>
      </p>
    )
  if (!recipe)
    return (
      <p role="status" style={{ padding: '20px' }}>
        Chargement…
      </p>
    )

  // Extraction défensive des tags et équipements (gère tous les schémas Prisma)
  const rawTags =
    (recipe as any).recipeTags ||
    (recipe as any).tags ||
    (recipe as any).recipeTagLinks ||
    []
  const tagsList: string[] = rawTags
    .map((t: any) =>
      typeof t === 'string'
        ? t
        : t.label || t.tag?.label || t.name || t.key || '',
    )
    .filter(Boolean)

  const rawEquipment =
    (recipe as any).equipment || (recipe as any).recipeEquipments || []
  const equipmentList: string[] = rawEquipment
    .map((e: any) =>
      typeof e === 'string'
        ? e
        : e.label || e.equipment?.label || e.name || e.key || '',
    )
    .filter(Boolean)

  return (
    <article style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            color: 'var(--color-text-muted)',
          }}
        >
          ← Retour
        </button>
        <button
          onClick={openConfirm}
          style={{
            color: '#b91c1c',
            border: '1px solid #b91c1c',
            background: 'transparent',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
          }}
        >
          Supprimer la recette
        </button>
      </div>

      {recipe.photoId && (
        <img
          src={photoUrl(recipe.photoId)}
          alt={`Photo de ${recipe.title}`}
          style={{
            width: '100%',
            maxHeight: 320,
            objectFit: 'cover',
            borderRadius: 12,
            marginBottom: 20,
          }}
        />
      )}

      <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '8px' }}>
        {recipe.title}
      </h2>

      {/* AFFICHAGE DES TAGS DE LA BDD */}
      {tagsList.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {tagsList.map((tagLabel, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {tagLabel}
            </span>
          ))}
        </div>
      )}

      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-base)',
          marginBottom: '16px',
        }}
      >
        {recipe.description}
      </p>

      <p style={{ fontWeight: 600, marginBottom: '24px' }}>
        🍽️ {recipe.servings} portion(s)
      </p>

      {/* AFFICHAGE DES ÉQUIPEMENTS DE LA BDD */}
      {equipmentList.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>
            Matériel requis
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {equipmentList.map((eqLabel, idx) => (
              <span
                key={idx}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                }}
              >
                {eqLabel}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* INGRÉDIENTS */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Ingrédients
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.position}
              style={{
                background: 'var(--color-surface)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--text-base)',
                  marginBottom: '8px',
                }}
              >
                {ing.quantity} {ing.unit} de {ing.canonicalName}
              </div>

              {ing.ciqualCode ? (
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <p style={{ marginBottom: '8px' }}>
                    CIQUAL — code {ing.ciqualCode}
                  </p>
                  <CiqualNutrientPreview code={ing.ciqualCode} />
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Ingrédient manuel — aucune donnée nutritionnelle associée.
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* PRÉPARATION */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Préparation
        </h3>
        <ol
          style={{
            paddingLeft: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {recipe.steps.map((step) => (
            <li key={step.position} style={{ lineHeight: '1.6' }}>
              {step.instruction}
            </li>
          ))}
        </ol>
      </div>

      <p
        style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginTop: '40px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
        }}
      >
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
