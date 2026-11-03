import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipesApi } from '../../client/api/recipes.api';

export const RecipeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<any>(null);

    useEffect(() => {
        if (id) {
            // Utilise la fonction getById de ton API
            recipesApi.getById(Number(id))
                .then(data => setRecipe(data))
                .catch(err => console.error("Erreur de chargement", err));
        }
    }, [id]);

    if (!recipe) return <div>Chargement...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <button onClick={() => navigate(-1)}>← Retour</button>

            <h2>{recipe.title}</h2>
            <p>{recipe.description}</p>

            <h3>Ingrédients</h3>
            <ul>
                {recipe.ingredients?.map((ing: any, index: number) => (
                    <li key={index}>
                        {ing.quantity} {ing.unit} de {ing.canonicalName}
                    </li>
                ))}
            </ul>
        </div>
    );
};