import { useNavigate } from 'react-router-dom';

export const RecipeListPage: React.FC = () => {
    const navigate = useNavigate();

    // ... ton code existant (récupération des recettes, etc.) ...

    return (
        <div>
            {/* ... ton en-tête ... */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {recipes.map((recipe) => (
                    <div
                        key={recipe.id}
                        // 1. Ajoute l'événement onClick avec l'ID de la recette
                        onClick={() => navigate(`/recipes/${recipe.id}`)}
                        // 2. Ajoute cursor: 'pointer' pour que la souris devienne une "main" au survol
                        style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}
                    >
                        {/* Le contenu actuel de ta carte (image, titre, etc.) */}
                        <img src="..." alt="recette" />
                        <h3>{recipe.title}</h3>
                        <p>{recipe.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};