import { Layout } from '../components/layout/layout';
import { RecipeCard } from '../components/recipe/RecipeCard';

function App() {
    const handleSelectRecipe = (id: string | number) => {
        console.log(`Recette sélectionnée : #${id}`);
    };

    return (
        <Layout>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--spacing-xs)' }}>
                        Recettes du moment
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        Sélection de saison cuisinée à partir d'ingrédients bruts.
                        <br/>
                        <br/>
                        Exemple de recipe card pour le stockage des recettes utilisateur:
                    </p>
                </div>

                {/* Disposition temporaire en colonne mobile / grille desktop */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <RecipeCard
                        id="1"
                        title="Velouté de potimarron aux châtaignes grillées"
                        description="Une soupe réconfortante légèrement épicée avec de l'huile de noisette et des éclats de châtaigne."
                        category="Entrée"
                        cookingTime="25 min"
                        onClick={handleSelectRecipe}
                    />

                    <RecipeCard
                        id="2"
                        title="Risotto au parmesan et champignons sauvages"
                        description="Riz arborio mijoté doucement au bouillon de légumes maison, poêlée de girolles et persil plat."
                        category="Plat"
                        cookingTime="40 min"
                        imageUrl="https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop"
                        onClick={handleSelectRecipe}
                    />
                </div>
            </section>
        </Layout>
    );
}

export default App;