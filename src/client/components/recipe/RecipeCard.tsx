import React from 'react';
import './RecipeCard.css';

export interface RecipeCardProps {
    id: string | number;
    title: string;
    description: string;
    category?: string;
    imageUrl?: string;
    cookingTime?: string;
    onClick?: (id: string | number) => void;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop';

export const RecipeCard: React.FC<RecipeCardProps> = ({
                                                          id,
                                                          title,
                                                          description,
                                                          category,
                                                          imageUrl = DEFAULT_IMAGE,
                                                          cookingTime,
                                                          onClick,
                                                      }) => {
    const handleClick = () => {
        if (onClick) onClick(id);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    };

    return (
        <article
            className="recipe-card"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Voir la recette : ${title}`}
        >
            <div className="recipe-card-media">
                <img
                    src={imageUrl}
                    alt=""
                    className="recipe-card-image"
                    loading="lazy"
                />
                {category && <span className="recipe-card-badge">{category}</span>}
            </div>

            <div className="recipe-card-content">
                <h3 className="recipe-card-title">{title}</h3>
                <p className="recipe-card-description">{description}</p>

                {/* Pied de carte calé au fond avec margin-top: auto */}
                {cookingTime && (
                    <footer className="recipe-card-footer">
                        <span className="recipe-card-meta">{cookingTime}</span>
                    </footer>
                )}
            </div>
        </article>
    );
};