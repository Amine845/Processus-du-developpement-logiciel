# Tags d'ingrédients : modèle et API (issue #71)

## 1. Objectif et périmètre

Associer des tags **contrôlés** aux ingrédients (céréale, légume...) pour que leur
catégorisation soit persistante et utilisable par le filtre des recettes (#27).

Ces tags sont **descriptifs**. Ils ne sont pas :

- la classification aliments/plats du référentiel CIQUAL, sans lien avec ces tables ;
- des allergènes ni des régimes : aucun tag « sans allergène » n'est déduit des nutriments ;
- des tags de recette (« Gourmand », « Rapide ») : leur modèle distinct est décrit dans [api-recipe-tags.md](api-recipe-tags.md).

Hors périmètre (suivi dans #73) : taxonomie exhaustive, administration avancée, tags
culinaires exhaustifs, certification des allergènes et régimes.

## 2. Modèle

| Table           | Rôle                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| `Tag`           | `id` stable, `key` normalisée unique, `label` unique, `active`                   |
| `IngredientTag` | Association `(ingredientId, tagId)`, clé primaire composite : doublon impossible |

- **Migration additive** (`20261108090000_ingredient_tags`) : deux tables créées, aucune table
  existante modifiée. Recettes, ingrédients et liaisons CIQUAL (`Ingredient.ciqualCode`)
  sont intacts ; un test l'applique après des données existantes et compare l'état avant/après.
- **Suppression** : supprimer un ingrédient retire ses associations (`CASCADE`). Un tag encore
  associé ne peut pas être supprimé (`RESTRICT`). Retirer une association ne supprime ni
  l'ingrédient ni les recettes.
- **Mise à jour CIQUAL** : les tags et leurs associations vivent dans des tables distinctes ;
  un import ou une synchronisation CIQUAL ne les touche pas (couvert par un test).

## 3. Politique de normalisation

Appliquée côté serveur (`parseTagLabel`) et doublée par des `CHECK` SQL.

| Élément | Règle                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------- |
| Libellé | Espaces de bord retirés, espaces internes réduits ; casse et accents conservés pour l'affichage                  |
| Limites | 1 à 40 caractères ; lettres, chiffres, espace, apostrophe et tiret ; commence par une lettre ou un chiffre       |
| Clé     | Libellé sans accents ni ligatures, en minuscules, mots reliés par `-` (« Œuf » donne `oeuf`) ; 40 caractères max |
| Unicité | Deux libellés de même clé désignent le même tag : « Légume », « LEGUME » et « légume » sont refusés ensemble     |

Une valeur invalide est rejetée avec `INVALID_TAG` et la liste des problèmes (`issues`).

## 4. Vocabulaire initial

`Céréale`, `Légume`, `Fruit`, `Légumineuse`, `Viande`, `Poisson et fruit de mer`,
`Produit laitier`, `Œuf`, `Matière grasse`, `Produit sucré`, `Épice et aromate`.

Défini dans `src/server/application/ingredient-tags.ts`. Il est synchronisé :

- par `npm run db:seed` / `db:init` (avec 7 associations de démonstration) ;
- ou seul, sur n'importe quelle base migrée, par `npm run tags:sync`.

La synchronisation est **relançable** et atomique :

- crée les tags manquants et réactive ceux qui reviennent au vocabulaire ;
- **désactive** (`active = false`) ceux qui n'en font plus partie, sans jamais les supprimer ;
- ajoute les associations de démonstration sans jamais en retirer une créée par l'utilisateur ;
- n'agit sur aucun ingrédient ni aucune recette. Les ingrédients de démonstration absents sont
  ignorés (jamais créés par la synchronisation seule).

Politique du seed : une association de démonstration retirée est restaurée à la relance,
comme les recettes de démonstration.

## 5. Associations obsolètes

Un tag désactivé reste en base avec ses associations, mais :

- il n'apparaît plus dans `GET /api/tags`, ni dans les tags des ingrédients et des recettes ;
- il ne peut plus être attribué (`409 TAG_INACTIVE`) ;
- son association se retire quand même avec `DELETE /api/ingredients/:id/tags/:tagId` ;
- le rapport de synchronisation indique `obsoleteAssociations` ;
- le réactiver (retour au vocabulaire) rend les associations visibles à nouveau.

## 6. API (contrat avec #27)

Types partagés : `src/shared/types/tag.types.ts` et `recipe.types.ts`. Base : `http://localhost:3001`.

### `GET /api/tags`

Tags **actifs**, par clé croissante, avec compteurs issus des associations réelles. Le filtre
affiche ce que renvoie cette route : il n'existe pas de liste front indépendante.

```json
[
  {
    "id": 2,
    "key": "legume",
    "label": "Légume",
    "ingredientCount": 3,
    "recipeCount": 2
  }
]
```

`recipeCount` est le nombre de recettes distinctes dont au moins un ingrédient porte le tag.

### `GET /api/ingredients` et `GET /api/ingredients/:id`

```json
{
  "id": 52,
  "canonicalName": "Carotte",
  "ciqualCode": "20009",
  "tags": [{ "id": 2, "key": "legume", "label": "Légume" }]
}
```

`ciqualCode` vaut `null` pour un ingrédient manuel. Liste par id croissant ; `404 INGREDIENT_NOT_FOUND`.

### Recettes (`GET /api/recipes`, `GET /api/recipes/:id`)

Ajouts en **lecture seule**, compatibles avec les clients existants :

- `ingredientTags` (liste et détail) : union dédupliquée des tags des ingrédients, triée par clé ;
- `ingredients[].tags` (détail) : tags de chaque ligne.

Pour ce sprint, les tags de recherche d'une recette sont l'union des tags de ses ingrédients ;
l'interface doit le dire (« tags des ingrédients »). Les écritures de recette (`POST`, `PUT`)
ignorent ces champs.

### `POST /api/ingredients/:id/tags`

Corps `{ "tagId": 2 }` (entier positif). Réponses : `201` ingrédient mis à jour (association
créée), `200` identique (déjà présente, idempotent, aucun doublon), `400 INVALID_TAG`,
`415`, `404 INGREDIENT_NOT_FOUND`, `404 TAG_NOT_FOUND`, `409 TAG_INACTIVE`.

### `DELETE /api/ingredients/:id/tags/:tagId`

`204` si l'association est retirée ; `404 TAG_NOT_ASSIGNED` si elle n'existait pas ;
`404 INGREDIENT_NOT_FOUND` ; `400` pour un identifiant invalide. Aucun ingrédient ni recette n'est supprimé.

### Erreurs communes

`503 TAG_READ_FAILED` ou `TAG_WRITE_FAILED` sans détail technique ; `405` avec `Allow` pour une
méthode non prévue ; `404 NOT_FOUND` si le serveur démarre sans dépôt de tags.

## 7. Vérifier la persistance

```bash
npm run db:init                       # migrations, démo et tags
npm run start:server
curl http://localhost:3001/api/tags
curl -X POST http://localhost:3001/api/ingredients/1/tags \
  -H 'Content-Type: application/json' -d '{"tagId": 1}'
# redémarrer le serveur, puis :
curl http://localhost:3001/api/ingredients/1
```

Aucun écran d'administration n'est fourni : l'attribution passe par cette API ou par la synchronisation.

## 8. Tests

- `tests/unit/ingredient-tags.test.ts` : normalisation, vocabulaire, logique de synchronisation
  (création, relance, désactivation, réactivation, ajout seul), routes HTTP avec dépôt simulé.
- `npm run test:tags` (base SQLite temporaire) : migration additive après données existantes,
  vocabulaire relançable, contraintes d'unicité, association multiple, lectures (tags, ingrédients,
  recettes), attribution et retrait, tag utilisé non supprimable, tag désactivé, import CIQUAL,
  seed relancé avec préservation des recettes et des tags utilisateur.
- `tests/integration/database-check.mjs` et `recipe-repository-check.mjs` adaptés aux nouvelles
  tables et à la nouvelle forme des lectures.
