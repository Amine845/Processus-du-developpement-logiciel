import React, { useState, useEffect } from 'react';
// 1. Ajout de useNavigate dans les imports de react-router-dom
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/layout';

import { RecipeCreatePage } from '../pages/RecipeCreatePage';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { RecipeDetailPage } from '../pages/RecipeDetailPage.tsx';

import { recipesApi } from '../api/recipes.api.ts';
import type { RecipeDTO } from '../../shared/types/recipe.types';

const RecipesPage = () => {
    // 2. Initialisation du hook de navigation
    const navigate = useNavigate();

    const [recipes, setRecipes] = useState<RecipeDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRecipes = async () => {
            try {
                const data = await recipesApi.getAll();
                setRecipes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadRecipes();
    }, []);

    const handleSelectRecipe = (id: string | number) => {
        console.log(`Redirection vers la recette : #${id}`);
        // 3. Déclenchement de la redirection vers la page de détail
        navigate(`/recipes/${id}`);
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
                {recipes.map((recipe) => (
                    <RecipeCard
                        key={recipe.id}
                        id={recipe.id}
                        title={recipe.title}
                        description={recipe.description || ""}
                        category="Recette"
                        onClick={handleSelectRecipe}
                    />
                ))}
            </div>
        </div>
    );
};

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
    );
}

export default App;