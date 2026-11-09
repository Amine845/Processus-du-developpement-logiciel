# Équipements requis pour les recettes

Ce patch complète celui des tags de recettes sur la branche `tag_system`.
Appliquer `recipe-tags-tag-system.patch` avant `recipe-equipment.patch`.

Le fonctionnement suit les catalogues de tags : plusieurs équipements par recette,
clé normalisée et libellé affichable (40 caractères maximum), vocabulaire contrôlé,
association idempotente, retrait et désactivation sans perte des associations.
Les équipements sont indépendants des ingrédients et des tags éditoriaux.

## Installation

```bash
git apply recipe-equipment.patch
npm run db:migrate
npm run db:generate
npm run equipment:sync
```

`db:seed` initialise également le catalogue. La migration additive crée `Equipment`
et `RecipeEquipment` sans modifier les données existantes. Le catalogue contient
Four, Plaque de cuisson, Micro-ondes, Air Fryer, Casserole, Poêle, Mixeur, Fouet,
Saladier, Balance de cuisine, Couteau et Planche à découper. Aucune association
n'est attribuée automatiquement aux recettes existantes.

## API

| Méthode | Route                                     | Résultat                                                                        |
| ------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| GET     | `/api/equipment`                          | Catalogue actif trié par clé ; `id`, `key`, `label`, `recipeCount`              |
| POST    | `/api/recipes/:id/equipment`              | Corps `{ "equipmentId": 1 }` ; 201 attribué, 200 déjà présent, recette renvoyée |
| DELETE  | `/api/recipes/:id/equipment/:equipmentId` | 204 retiré, 404 association absente                                             |

GET liste et détail des recettes renvoient `equipment: [{ id, key, label }]`,
trié par clé, ou `[]`. Cela représente le matériel requis par la recette,
pas celui possédé par un utilisateur. Ni quantité ni matériel de remplacement
ne sont déduits. Les tags existants gardent leur fonctionnement.

POST/PUT de recette acceptent `equipmentIds?: number[]`, enregistré dans la même
transaction que la recette. Le champ de lecture `equipment` ne remplace pas ces
identifiants. Un PUT sans `equipmentIds` conserve les associations ; `[]` les efface
et un tableau fourni les remplace. Supprimer la recette supprime ses liens par cascade,
sans supprimer le catalogue ni les ingrédients. Un équipement associé ne peut
pas être supprimé (`RESTRICT`).

Modifier `EQUIPMENT_VOCABULARY` dans `recipe-equipment.ts` puis relancer
`equipment:sync` crée les entrées manquantes, réactive celles réintroduites et
désactive les entrées retirées. L'opération est atomique et relançable. Une entrée
désactivée reste en base avec ses liens, disparaît des lectures et ne peut plus
être attribuée. Le retrait du lien reste autorisé. Les autres catalogues sont indépendants.

Erreurs : 400 `INVALID_EQUIPMENT` ou `INVALID_RECIPE_ID`, 404
`RECIPE_NOT_FOUND`, `EQUIPMENT_NOT_FOUND`, `EQUIPMENT_NOT_ASSIGNED`,
409 `EQUIPMENT_INACTIVE`, 405 avec `Allow`, 503 `EQUIPMENT_READ_FAILED` /
`EQUIPMENT_WRITE_FAILED`. Les routes sont optionnelles en cas d'injection manuelle
du serveur ; `startServer` injecte le repository. Aucun écran d'administration ajouté.

## Tests

```bash
npm run test:equipment
npm run test:recipe-tags
npm run test:repository
npm run test:db
npm test
```

Le test d'intégration couvre la migration sur une base existante, les associations
multiples et idempotentes, les lectures et compteurs, la conservation lors d'un PUT,
la désactivation/réactivation, le retrait, la persistance après redémarrage et les
contraintes de suppression. Les tests unitaires vérifient la normalisation et la validation.
