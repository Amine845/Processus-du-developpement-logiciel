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
import type { TagDTO } from '../../shared/types/tag.types'
import type { EquipmentDTO } from '../../shared/types/equipment.types'

const RecipesPage = () => {
  const navigate = useNavigate()

  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- CATALOGUES DYNAMIQUES DE LA BDD ---
  const [tagsCatalog, setTagsCatalog] = useState<TagDTO[]>([])
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentDTO[]>([])

  // --- ÉTATS DES FILTRES (ON STOCKE LES IDS SÉLECTIONNÉS) ---
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<RecipeSummaryDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [recipesData, tagsData, equipmentData] = await Promise.all([
          recipesApi.getAll(),
          recipesApi.getTags(),
          recipesApi.getEquipment(),
        ])
        setRecipes(recipesData)
        setTagsCatalog(tagsData)
        setEquipmentCatalog(equipmentData)
      } catch (err) {
        setError(
            err instanceof ApiError && err.code === 'NETWORK_ERROR'
                ? 'Serveur injoignable. Vérifie qu’il est lancé.'
                : 'Impossible de charger les données.',
        )
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  // --- FILTRAGE DYNAMIQUE ROBUSTE (TITRE + INGRÉDIENTS + TEXTE GLOBAL) ---
  const filteredRecipes = recipes.filter((recipe: any) => {
    const term = searchQuery.toLowerCase().trim()

    // 1. Recherche Texte (Titre, Description, Ingrédients & Sécurité globale)
    let textMatch = true
    if (term) {
      const matchTitle = recipe.title?.toLowerCase().includes(term)
      const matchDescription = recipe.description?.toLowerCase().includes(term)

      const matchIngredients = recipe.ingredients?.some((ing: any) => {
        const name =
            ing.name ||
            ing.customName ||
            ing.canonicalName ||
            ing.ciqualFood?.name ||
            ing.food?.name ||
            ing.ingredient?.name ||
            ing.ingredient?.canonicalName ||
            ''
        return name.toLowerCase().includes(term)
      })

      const rawRecipeString = JSON.stringify(recipe).toLowerCase()

      textMatch = matchTitle || matchDescription || matchIngredients || rawRecipeString.includes(term)
    }

    // 2. Extraction sécurisée des IDs des tags et équipements de la recette
    const recipeTagIds: number[] = (recipe.recipeTags || recipe.tags || []).map((t: any) =>
        typeof t === 'number' ? t : t.tagId || t.tag?.id || t.id
    ).filter(Boolean)

    const recipeEqIds: number[] = (recipe.equipment || recipe.recipeEquipments || []).map((e: any) =>
        typeof e === 'number' ? e : e.equipmentId || e.equipment?.id || e.id
    ).filter(Boolean)

    // 3. Correspondance des filtres
    const tagMatch =
        selectedTagIds.length === 0 ||
        selectedTagIds.every((id) => recipeTagIds.includes(id))

    const eqMatch =
        selectedEquipmentIds.length === 0 ||
        selectedEquipmentIds.every((id) => recipeEqIds.includes(id))

    return textMatch && tagMatch && eqMatch
  })

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
        prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    )
  }

  const toggleEquipment = (id: number) => {
    setSelectedEquipmentIds((prev) =>
        prev.includes(id) ? prev.filter((eId) => eId !== id) : [...prev, id]
    )
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

        {/* BARRE DE RECHERCHE */}
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

        {/* BARRE DES TAGS DYNAMIQUES */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px', scrollbarWidth: 'none' }}>
          {tagsCatalog.map((tag) => {
            const active = selectedTagIds.includes(tag.id)
            return (
                <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      border: '1px solid',
                      borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                      background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: active ? 'white' : 'inherit',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                >
                  {tag.label}
                </button>
            )
          })}
        </div>

        {/* BARRE DES ÉQUIPEMENTS DYNAMIQUES (EN DESSOUS DE LA RECHERCHE / TAGS) */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', scrollbarWidth: 'none' }}>
          {equipmentCatalog.map((eq) => {
            const active = selectedEquipmentIds.includes(eq.id)
            return (
                <button
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: active ? 'var(--color-text)' : 'var(--color-border)',
                      background: active ? 'var(--color-text)' : 'var(--color-surface)',
                      color: active ? 'var(--color-surface)' : 'inherit',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: 'var(--text-sm)',
                      transition: 'all 0.2s ease',
                    }}
                >
                  🔧 {eq.label}
                </button>
            )
          })}
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
                      category={recipe.recipeTags?.[0]?.label || recipe.tags?.[0]?.label || "Recette"}
                      imageUrl={photoUrl(recipe.photoId)}
                      onClick={handleSelectRecipe}
                      onDelete={() => askDelete(recipe)}
                  />
              ))}
            </div>
        )}

        {/* TIROIR MOBILE POUR OPTIONS SUPPLÉMENTAIRES SI BESOIN */}
        {isDrawerOpen && (
            <>
              <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-background)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '24px', zIndex: 50, boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Options de filtres</h3>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><X size={24} /></button>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  Tous les tags et équipements sont directement accessibles depuis les barres de sélection principales sur l'écran d'accueil.
                </p>
                <button
                    onClick={() => setIsDrawerOpen(false)}
                    style={{ width: '100%', padding: '14px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '8px', marginTop: '32px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Fermer ({filteredRecipes.length} résultats)
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