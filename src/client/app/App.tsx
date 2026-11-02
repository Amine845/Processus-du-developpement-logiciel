import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/layout';

// 1. On importe tes vrais composants
import { RecipeCreatePage } from '../pages/RecipeCreatePage';
import { RecipeCard } from '../components/recipe/RecipeCard';

// Import de l'API et des types (vérifie que ces chemins correspondent bien à ton arborescence)
import { recipesApi } from '../api/recipes.api.ts';
import type { RecipeDTO } from '../../shared/types/recipe.types';

// 2. Le composant dynamique lié à la base de données
const RecipesPage = () => {
    const [recipes, setRecipes] = useState<RecipeDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRecipes = async () => {
            try {
                const data = await recipesApi.getAll();
                setRecipes(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadRecipes();
    }, []);

    const handleSelectRecipe = (id: string | number) => {
        console.log(`Recette sélectionnée : #${id}`);
    };

    if (loading) return <p style={{ padding: 'var(--spacing-md)' }}>Chargement des recettes...</p>;
    if (error) return <p style={{ padding: 'var(--spacing-md)', color: 'red' }}>Erreur : {error}</p>;
    if (recipes.length === 0) return <p style={{ padding: 'var(--spacing-md)' }}>Aucune recette trouvée.</p>;

    return (
        <div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Mes recettes</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: '4px 0 20px 0' }}>
                Bibliothèque, recherche par nom, filtres par allergènes et équipement.
            </p>

            {/* Rendu dynamique des RecipeCards depuis la DB */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
                {recipes.map((recipe) => (
                    <RecipeCard
                        key={recipe.id}
                        id={recipe.id}
                        title={recipe.title}
                        description={recipe.description || ""} // Ajout de la valeur par défaut pour éviter le null
                        category="Recette"
                        onClick={handleSelectRecipe}
                    />
                ))}
            </div>
        </div>
    );
};

/* Placeholders restants */
const PlannerPage = () => (
    <div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Planificateur & courses</h2>
    </div>
);

const ProfilePage = () => (
    <div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Profil & préférences</h2>
    </div>
);

// 3. On utilise les composants dans le routeur
function App() {
    return (
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Navigate to="/recipes" replace />} />
                    <Route path="/recipes" element={<RecipesPage />} />
                    <Route path="/planner" element={<PlannerPage />} />

                    {/* Ici, on appelle ta vraie page importée d'en haut */}
                    <Route path="/recipes/new" element={<RecipeCreatePage />} />

                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </Layout>
        </HashRouter>
    );
}

export default App;