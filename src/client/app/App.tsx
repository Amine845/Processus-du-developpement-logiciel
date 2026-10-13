import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/layout';

/* Pages temporaires épurées */
const RecipesPage = () => (
    <div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Mes recettes</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Bibliothèque, recherche par nom, filtres par allergènes et équipement.
        </p>
    </div>
);

const PlannerPage = () => (
    <div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Planificateur & courses</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Menu de la semaine, suivi des macros et liste d'ingrédients interactive.
        </p>
    </div>
);

const RecipeCreatePage = () => (
    <div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Nouvelle recette</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Saisie des ingrédients, portions, matériel requis et calcul nutritionnel.
        </p>
    </div>
);

const ProfilePage = () => (
    <div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Profil & préférences</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Gestion des allergies, matériel disponible (Air Fryer, four...) et objectifs.
        </p>
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
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </Layout>
        </HashRouter>
    );
}

export default App;