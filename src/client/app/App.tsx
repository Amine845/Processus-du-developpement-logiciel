import { useState, useEffect } from 'react'
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Layout } from '../components/layout/layout'

import { RecipeCreatePage } from '../pages/RecipeCreatePage'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { RecipeDetailPage } from '../pages/RecipeDetailPage.tsx'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

import { recipesApi, ApiError, photoUrl } from '../api/recipes.api.ts'
import type { RecipeSummaryDTO } from '../../shared/types/recipe.types'

const AVAILABLE_TAGS = ['Gourmand', 'Rapide', 'Healthy', 'Pas cher', 'Végétarien']
const AVAILABLE_EQUIPMENT = ['Four', 'Plaques', 'Air Fryer', 'Mixer', 'Micro-ondes']

const RecipesPage = () => {
  const navigate = useNavigate()

  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- ÉTATS DES FILTRES ---
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<RecipeSummaryDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await recipesApi.getAll()
        setRecipes(data)
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
    loadRecipes()
  }, [])

// --- FILTRAGE DYNAMIQUE CROISÉ ---
  const filteredRecipes = recipes.filter((recipe: any) => {
    const term = searchQuery.toLowerCase().trim()

    // 1. Recherche Texte (Titre + Ingrédients)
    let textMatch = true
    if (term) {
      const matchTitle = recipe.title?.toLowerCase().includes(term)
      const matchIngredients = recipe.ingredients?.some((ing: any) => {
        // Gère la NOUVELLE structure du DTO (CIQUAL ou Ingrédient Manuel)
        const name =
            ing.name ||
            ing.customName ||
            ing.ciqualFood?.name ||
            ing.food?.name ||
            ing.ingredient?.name ||
            ing.ingredient?.canonicalName ||
            ing.canonicalName ||
            '';

        // SÉCURITÉ ABSOLUE : Si la structure est complexe, on fouille dans l'objet entier converti en texte
        const rawString = JSON.stringify(ing).toLowerCase();

        return name.toLowerCase().includes(term) || rawString.includes(term);
      })
      textMatch = matchTitle || matchIngredients
    }

    // Extraction sécurisée des tags et équipements
    const recipeTags = recipe.tags?.map((t: any) => typeof t === 'string' ? t : t.tag?.label || t.label || t.name) || []
    const recipeEq = recipe.equipment?.map((e: any) => typeof e === 'string' ? e : e.equipment?.name || e.name) || []

    // 2. Filtres (doit inclure TOUS les tags sélectionnés et TOUS les équipements sélectionnés)
    const tagMatch = selectedTags.length === 0 || selectedTags.every(tag => recipeTags.includes(tag))
    const eqMatch = selectedEquipment.length === 0 || selectedEquipment.every(eq => recipeEq.includes(eq))

    return textMatch && tagMatch && eqMatch
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq])
  }

  const handleSelectRecipe = (id: string | number) => {
    navigate(`/recipes/${id}`)
  }

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

  if (loading) return <p style={{ padding: 'var(--spacing-md)' }}>Chargement des recettes...</p>
  if (error) return <p style={{ padding: 'var(--spacing-md)', color: 'red' }}>Erreur : {error}</p>

  return (
      <div style={{ position: 'relative' }}>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Mes recettes</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: '4px 0 20px 0' }}>
          Bibliothèque, recherche par nom, ingrédients, tags et équipement.
        </p>

        {/* BARRE DE RECHERCHE & BOUTON TIROIR */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <Search size={20} color="var(--color-text-muted)" />
            <input
                type="text"
                placeholder="Rechercher une recette ou un ingrédient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--text-base)' }}
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  Effacer
                </button>
            )}
          </div>
          <button
              onClick={() => setIsDrawerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
          >
            <SlidersHorizontal size={20} />
            <span style={{ display: 'none' }} className="mobile-hidden">Filtres</span>
          </button>
        </div>

        {/* PUCES DE TAGS */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px', scrollbarWidth: 'none' }}>
          {AVAILABLE_TAGS.map(tag => (
              <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: selectedTags.includes(tag) ? 'var(--color-accent)' : 'var(--color-border)',
                    background: selectedTags.includes(tag) ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: selectedTags.includes(tag) ? 'white' : 'inherit',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
              >
                {tag}
              </button>
          ))}
        </div>

        {/* RÉSULTATS */}
        {recipes.length === 0 ? (
            <p style={{ padding: 'var(--spacing-md)' }}>Aucune recette trouvée.</p>
        ) : filteredRecipes.length === 0 ? (
            <p style={{ padding: 'var(--spacing-md)' }}>Aucune recette ne correspond à ces critères.</p>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
              {filteredRecipes.map((recipe) => (
                  <RecipeCard
                      key={recipe.id}
                      id={recipe.id}
                      title={recipe.title}
                      description={recipe.description || ''}
                      category={recipe.tags?.[0]?.label || recipe.tags?.[0] || "Recette"}
                      imageUrl={photoUrl(recipe.photoId)}
                      onClick={handleSelectRecipe}
                      onDelete={() => askDelete(recipe)}
                  />
              ))}
            </div>
        )}

        {/* TIROIR MOBILE */}
        {isDrawerOpen && (
            <>
              <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-background)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '24px', zIndex: 50, boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Équipement requis</h3>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><X size={24} /></button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {AVAILABLE_EQUIPMENT.map(eq => (
                      <label key={eq} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedEquipment.includes(eq)} onChange={() => toggleEquipment(eq)} />
                        <span style={{ fontSize: 'var(--text-sm)' }}>{eq}</span>
                      </label>
                  ))}
                </div>
                <button
                    onClick={() => setIsDrawerOpen(false)}
                    style={{ width: '100%', padding: '14px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '8px', marginTop: '32px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Voir les résultats ({filteredRecipes.length})
                </button>
              </div>
            </>
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