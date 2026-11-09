import React, { useState, useEffect } from 'react'
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

import { recipesApi, ApiError } from '../api/recipes.api.ts'
import type { RecipeSummaryDTO } from '../../shared/types/recipe.types'

const AVAILABLE_TAGS = ['Gourmand', 'Rapide', 'Healthy', 'Pas cher']
const AVAILABLE_EQUIPMENT = ['Four', 'Plaques', 'Air Fryer', 'Mixer', 'Micro-ondes']

const RecipesPage = () => {
  const navigate = useNavigate()

  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- ÉTATS DES FILTRES ---
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // États pour le tiroir (drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [allergens, setAllergens] = useState({ veg: false, sansGluten: false })
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])

  // --- ÉTATS SUPPRESSION ---
  const [pendingDelete, setPendingDelete] = useState<RecipeSummaryDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadRecipes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await recipesApi.getAll()

      // INJECTION HYBRIDE : Utilise les vraies données si le back-end les renvoie,
      // sinon injecte des données de test (mocks) pour voir l'UI
      const mockedData = data.map((recipe: any, index: number) => ({
        ...recipe,
        tags: recipe.tags && recipe.tags.length > 0 ? recipe.tags : (index % 2 === 0 ? ['Rapide', 'Pas cher'] : ['Gourmand']),
        equipment: recipe.equipment && recipe.equipment.length > 0 ? recipe.equipment : (index === 0 ? ['Four'] : []),
        isVeg: recipe.isVegetarian !== undefined ? recipe.isVegetarian : (index % 3 === 0)
      }))

      // Ordre déterministe : du plus récent au plus ancien
      const sortedData = mockedData.sort((a: any, b: any) => b.id - a.id)
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

  // --- FILTRAGE DYNAMIQUE CROISÉ ---
  const filteredRecipes = recipes.filter((recipe: any) => {
    const term = searchQuery.toLowerCase().trim()

    // 1. Recherche Texte (Titre + Ingrédients)
    let textMatch = true;
    if (term) {
      const matchTitle = recipe.title.toLowerCase().includes(term)
      const matchIngredients = recipe.ingredients?.some((ing: any) => {
        const ingName = ing.canonicalName || (ing.ingredient && ing.ingredient.canonicalName) || ''
        return ingName.toLowerCase().includes(term)
      })
      textMatch = matchTitle || !!matchIngredients;
    }

    // 2. Filtre Tags (Puces)
    const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => recipe.tags?.includes(tag))

    // 3. Filtre Tiroir (Équipement & Allergènes)
    const eqMatch = selectedEquipment.length === 0 || selectedEquipment.every(eq => recipe.equipment?.includes(eq))
    const vegMatch = !allergens.veg || recipe.isVeg

    return textMatch && tagMatch && eqMatch && vegMatch
  })

  // --- GESTIONNAIRES ---
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq])
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSelectedEquipment([])
    setAllergens({ veg: false, sansGluten: false })
  }

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
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Mes recettes</h2>
        </div>

        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: '20px' }}>
          Recherchez et filtrez vos recettes enregistrées.
        </p>

        {/* BARRE DE RECHERCHE & BOUTON TIROIR */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <Search size={20} color="var(--color-text-muted)" />
            <input
                type="text"
                placeholder="Rechercher une recette ou ingrédient..."
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

          <button
              onClick={() => setIsDrawerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
          >
            <SlidersHorizontal size={20} />
            <span style={{ display: 'none' }} className="mobile-hidden">Filtres</span>
          </button>
        </div>

        {/* PUCES DE TAGS RAPIDES */}
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

        {/* ÉTATS VIDES & GRILLE DES RÉSULTATS */}
        {recipes.length === 0 ? (
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
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '8px' }}>
              <p style={{ marginBottom: '16px' }}>Aucune recette ne correspond à ces critères.</p>
              <button
                  onClick={resetFilters}
                  style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--color-text-muted)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Réinitialiser les filtres
              </button>
            </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
              {filteredRecipes.map((recipe) => (
                  <RecipeCard
                      key={recipe.id}
                      id={recipe.id}
                      title={recipe.title}
                      description={recipe.description || ''}
                      // Affiche dynamiquement le premier tag de la recette (réel ou mocké)
                      category={recipe.tags?.[0] || 'Recette'}
                      onClick={handleSelectRecipe}
                      onDelete={() => askDelete(recipe)}
                  />
              ))}
            </div>
        )}

        {/* TIROIR MOBILE (Filtres avancés) */}
        {isDrawerOpen && (
            <>
              <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-background)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '24px', zIndex: 50, boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Filtres avancés</h3>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><X size={24} /></button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: '12px' }}>Régime alimentaire</h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={allergens.veg} onChange={e => setAllergens(prev => ({ ...prev, veg: e.target.checked }))} />
                    Végétarien
                  </label>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: '12px' }}>Équipement requis</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {AVAILABLE_EQUIPMENT.map(eq => (
                        <label key={eq} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedEquipment.includes(eq)} onChange={() => toggleEquipment(eq)} />
                          <span style={{ fontSize: 'var(--text-sm)' }}>{eq}</span>
                        </label>
                    ))}
                  </div>
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