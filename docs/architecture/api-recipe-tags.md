# Tags propres aux recettes

Le fonctionnement reprend celui des tags d'ingrédients : vocabulaire contrôlé,
plusieurs tags par recette, attribution idempotente, retrait d'une association,
désactivation sans perte des associations et tri par clé normalisée.

Les tags éditoriaux (`Gourmand`, `Rapide`, `Facile`, `Économique`, `Festif`)
sont stockés dans `RecipeTag`, avec leurs associations dans `RecipeTagLink`.
Ils sont indépendants de `Tag` et `IngredientTag` : synchroniser les tags
d'ingrédients ne peut pas désactiver les tags de recettes et réciproquement.
La validation réutilise `parseTagLabel` et ses contraintes (40 caractères maximum).

## Installation

```bash
npm run db:migrate
npm run db:generate
npm run recipe-tags:sync
```

`db:seed` initialise également ce vocabulaire. Aucune association de recette n'est
créée automatiquement. La migration est additive et conserve les données existantes.
Ce patch s'applique directement à la branche `tag_system`, sans le précédent patch
`recipe-tag.patch` (qui ajoutait une simple colonne texte).

## API

| Méthode | Route                          | Résultat                                                                      |
| ------- | ------------------------------ | ----------------------------------------------------------------------------- |
| GET     | `/api/recipe-tags`             | Tags actifs, triés par clé, avec `recipeCount`                                |
| POST    | `/api/recipes/:id/tags`        | Corps `{ "tagId": 1 }`, recette avec ses tags ; 201 créée, 200 déjà attribuée |
| DELETE  | `/api/recipes/:id/tags/:tagId` | 204 retirée, 404 absente                                                      |

Les routes de lecture de recettes renvoient `recipeTags: [{ id, key, label }]`,
un tableau vide si aucun tag actif n'est attribué. `ingredientTags` reste l'union
des tags des ingrédients : ces deux champs ne sont pas fusionnés. Les compteurs
`recipeCount` de `/api/recipe-tags` comptent les associations directes ; ceux de
`/api/tags` gardent leur sens initial (recettes contenant des ingrédients tagués).

POST/PUT de recette acceptent `tagIds?: number[]` pour enregistrer les associations
dans la même transaction que la recette. Les objets de lecture `recipeTags` ne
remplacent pas ces identifiants. Un PUT sans `tagIds` conserve les associations ;
un tableau vide les efface, un tableau fourni les remplace. Supprimer une recette
supprime ses associations par cascade, sans supprimer les tags ni les ingrédients.
Un tag associé ne peut pas être supprimé (RESTRICT).

Erreurs : 400 `INVALID_TAG` ou `INVALID_RECIPE_ID`, 404 `RECIPE_NOT_FOUND`,
`TAG_NOT_FOUND`, `TAG_NOT_ASSIGNED`, 409 `TAG_INACTIVE`, 405 avec `Allow`,
503 `TAG_READ_FAILED` / `TAG_WRITE_FAILED` sans détails de connexion.
Sans repository de tags de recettes injecté, les nouvelles routes répondent 404.

Un tag désactivé est invisible en lecture et ne peut plus être attribué ;
son association reste retirable. Réintroduire son libellé dans le vocabulaire
le réactive. La synchronisation est atomique et relançable.

Le formulaire de création propose les tags actifs du catalogue.

## Vérification

```bash
npm run test:recipe-tags
npm run test:tags
npm run test:repository
```

Le test dédié couvre la migration sur une base existante, la séparation des
vocabulaires, l'attribution multiple et idempotente, les compteurs, les lectures,
la conservation lors d'un PUT, le retrait, la désactivation/réactivation,
la persistance après redémarrage et la cascade de suppression.

Validation : compilation client/serveur, lint, 51 tests unitaires, tests du repository,
test dédié aux tags de recettes et vérification de la base réussis. Le test
« mise à jour CIQUAL : tags, associations et liaison conservés » échoue également
sur la branche fournie avant ce patch (`CIQUAL import rejected`).
