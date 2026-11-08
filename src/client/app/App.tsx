import React, { useState, useEffect } from 'react'
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { Search } from 'lucide-react'
import { Layout } from '../components/layout/layout'

import { RecipeCreatePage } from '../pages/RecipeCreatePage'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { RecipeDetailPage } from '../pages/RecipeDetailPage.tsx'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

import { recipesApi, ApiError } from '../api/recipes.api.ts'
import type { RecipeSummaryDTO } from '../../shared/types/recipe.types'

const RecipesPage = () => {
  const navigate = useNavigate()

  const [recipes, setRecipes] = useState<RecipeSummaryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Nouvel état pour la barre de recherche
  const [searchQuery, setSearchQuery] = useState('')

  const [pendingDelete, setPendingDelete] = useState<RecipeSummaryDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Extraction de la fonction de chargement pour pouvoir la rappeler via le bouton "Réessayer"
  const loadRecipes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await recipesApi.getAll()
      // Ordre déterministe : du plus récent au plus ancien
      const sortedData = data.sort((a, b) => b.id - a.id)
      setRecipes(sortedData)
    } catch (err) {
      setError(
          err instanceof ApiError && err.code === 'NETWORK_ERROR'
              ? 'Serveur injoignable. Vérifie qu’il est lancé.'
              : 'Impossible de charger les recettes.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  // --- FILTRAGE DYNAMIQUE ---
  const filteredRecipes = recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const handleSelectRecipe = (id: string | number) => {
    navigate(`/recipes/${id}`)
  }

  // --- LOGIQUE DE SUPPRESSION ---
  const askDelete = (recipe: RecipeSummaryDTO) => {
    setDeleteError(null)
    setPendingDelete(recipe)
  }

  const cancelDelete = () => {
    if (!deleting) setPendingDelete(null)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setDeleting(true)
    setDeleteError(null)
    try {
      await recipesApi.delete(id)
    } catch (err) {
      if (!(err instanceof ApiError && err.code === 'RECIPE_NOT_FOUND')) {
        setDeleteError(
            err instanceof ApiError && err.code === 'NETWORK_ERROR'
                ? 'Serveur injoignable. Réessaie dans un instant.'
                : 'La suppression a échoué. Réessaie.',
        )
        setDeleting(false)
        return
      }
    }
    setRecipes((current) => current.filter((r) => r.id !== id))
    setPendingDelete(null)
    setDeleting(false)
  }

  // --- RENDUS DES ÉTATS (Chargement & Erreur) ---
  if (loading) {
    return <p style={{ padding: 'var(--spacing-md)' }}>Chargement des recettes...</p>
  }

  if (error) {
    return (
        <div style={{ padding: 'var(--spacing-md)', color: 'red' }}>
          <p>Erreur : {error}</p>
          <button
              onClick={loadRecipes}
              style={{ marginTop: '12px', padding: '8px 16px', cursor: 'pointer', borderRadius: '6px' }}
          >
            Réessayer
          </button>
        </div>
    )
  }

  return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Mes recettes</h2>
        </div>

        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: '20px' }}>
          Recherchez vos recettes enregistrées par titre.
        </p>

        {/* BARRE DE RECHERCHE */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <Search size={20} color="var(--color-text-muted)" />
          <input
              type="text"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--text-base)' }}
          />
          {searchQuery && (
              <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Effacer
              </button>
          )}
        </div>

        {/* ÉTATS VIDES & GRILLE DES RÉSULTATS */}
        {recipes.length === 0 ? (
            // Cas 1 : La BDD est totalement vide
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '8px' }}>
              <p style={{ marginBottom: '16px' }}>Votre bibliothèque est totalement vide.</p>
              <button
                  onClick={() => navigate('/recipes/new')}
                  style={{ padding: '10px 20px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Créer ma première recette
              </button>
            </div>
        ) : filteredRecipes.length === 0 ? (
            // Cas 2 : La recherche ne donne rien
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '8px' }}>
              <p style={{ marginBottom: '16px' }}>Aucune recette ne correspond à "{searchQuery}".</p>
              <button
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--color-text-muted)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Réinitialiser la recherche
              </button>
            </div>
        ) : (
            // Cas 3 : Affichage nominal de la grille
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
              {filteredRecipes.map((recipe) => (
                  <RecipeCard
                      key={recipe.id}
                      id={recipe.id}
                      title={recipe.title}
                      description={recipe.description || ''}
                      category="Recette"
                      onClick={handleSelectRecipe}
                      onDelete={() => askDelete(recipe)}
                  />
              ))}
            </div>
        )}

        <ConfirmDialog
            open={pendingDelete !== null}
            title="Supprimer cette recette ?"
            message={`« ${pendingDelete?.title ?? ''} » sera supprimée définitivement, avec ses ingrédients et ses étapes.`}
            busy={deleting}
            error={deleteError}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
        />
      </div>
  )
}

const PlannerPage = () => (
    <div>
      <h2 style={{ fontSize: 'var(--text-xl)' }}>Planificateur & courses</h2>
    </div>
)

const ProfilePage = () => (
    <div>
      <h2 style={{ fontSize: 'var(--text-xl)' }}>Profil & préférences</h2>
    </div>
)

function App() {
  return (
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/recipes/new" element={<RecipeCreatePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </HashRouter>
  )
}

export default App