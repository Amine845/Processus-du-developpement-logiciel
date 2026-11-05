# Spécification de l'API REST - Recherche CIQUAL (issue #33)

## 1. Contexte

Cette API lit le référentiel local CIQUAL (issue #44, tables `CiqualFood` et
`CiqualNutrient`). Elle ne contacte jamais le réseau et n'écrit rien : chercher ou
consulter un aliment ne crée aucun ingrédient et n'établit aucun lien avec une recette.

- **Base URL locale :** `http://localhost:3001/api/ciqual`
- **Types partagés :** `src/shared/types/ciqual.types.ts` (constantes du contrat comprises)
- **Méthode :** `GET` uniquement (`405` avec `Allow: GET` sinon)

## 2. Règles de recherche

| Règle             | Valeur                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Longueur minimale | 2 caractères, après suppression des espaces de bord (emoji = 1 caractère)                 |
| Longueur maximale | 100 caractères                                                                            |
| Limite par défaut | 10 résultats                                                                              |
| Limite maximale   | 50 résultats                                                                              |
| Périmètre         | aliments actifs de la publication courante                                                |
| Comparaison       | insensible à la casse, aux accents, aux ligatures (œ, æ) et à la ponctuation              |
| Correspondance    | tous les mots de la requête doivent apparaître dans le libellé, dans n'importe quel ordre |

**Ordre des résultats** (entièrement déterministe) :

1. rang 0 : le libellé commence par la requête ;
2. rang 1 : chaque mot de la requête commence un mot du libellé ;
3. rang 2 : simple inclusion (par exemple « crème » dans « écrémé ») ;
4. à rang égal : libellé le plus court, puis ordre alphabétique, puis code numérique croissant.

## 3. Endpoints

### `GET /api/ciqual/foods?q=<texte>&limit=<n>`

Réponse `200` :

```json
{
  "query": "carotte",
  "minLength": 2,
  "limit": 10,
  "truncated": false,
  "results": [
    {
      "code": "20009",
      "name": "Carotte, crue",
      "source": "https://doi.org/10.57745/RDMHWY",
      "version": "2025-V1.0-2025-11-03",
      "baseQuantity": 100,
      "baseUnit": "g"
    }
  ]
}
```

- `code` est le code CIQUAL officiel (texte), clé stable de l'aliment dans le référentiel
  local. Il n'existe pas d'autre identifiant interne pour un aliment CIQUAL.
- `truncated` vaut `true` si d'autres aliments correspondent au-delà de `limit`.
- Aucun résultat : `200` avec `results: []`.

Erreurs `400` (corps `{ "error": "...", "minLength", "defaultLimit", "maxLimit" }`) :
`QUERY_TOO_SHORT`, `QUERY_TOO_LONG`, `INVALID_LIMIT`.

### `GET /api/ciqual/foods/:code`

`:code` : 1 à 12 chiffres. Réponse `200` : le résumé ci-dessus plus `active`,
`attribution` et `nutrients`, triés par identifiant de constituant croissant.

```json
{
  "code": "20009",
  "name": "Carotte, crue",
  "source": "https://doi.org/10.57745/RDMHWY",
  "version": "2025-V1.0-2025-11-03",
  "baseQuantity": 100,
  "baseUnit": "g",
  "active": true,
  "attribution": "Anses. 2025. Table de composition nutritionnelle des aliments Ciqual. https://doi.org/10.57745/RDMHWY",
  "nutrients": [
    {
      "key": "328",
      "label": "Energie, Règlement UE N° 1169/2011",
      "unit": "kcal",
      "status": "exact",
      "raw": "30,2",
      "value": 30.2,
      "upperBoundExclusive": null
    },
    {
      "key": "40000",
      "label": "Lipides",
      "unit": "g",
      "status": "less_than",
      "raw": "< 0,5",
      "value": null,
      "upperBoundExclusive": 0.5
    }
  ]
}
```

Les valeurs sont exprimées pour `baseQuantity` `baseUnit` (100 g de partie comestible).
Un aliment retiré d'une publication ultérieure reste consultable avec `active: false`
mais n'est plus proposé par la recherche. Erreurs : `400 INVALID_CODE`,
`404 CIQUAL_FOOD_NOT_FOUND`.

### États de disponibilité d'un constituant

| `status`    | `value`             | `upperBoundExclusive` | Signification                                     |
| ----------- | ------------------- | --------------------- | ------------------------------------------------- |
| `exact`     | nombre (0 possible) | `null`                | valeur mesurée ; 0 n'apparaît que s'il est source |
| `less_than` | `null`              | seuil                 | « < seuil », borne supérieure exclusive           |
| `trace`     | `null`              | `null`                | présent mais non quantifié                        |
| `missing`   | `null`              | `null`                | information absente                               |

Une donnée absente, tracée ou sous un seuil ne devient **jamais** zéro. `label` vaut
`null` pour un constituant inconnu de la table de libellés ; `raw` conserve le texte source.

### Erreurs communes

`503 CIQUAL_READ_FAILED` : lecture impossible, sans détail technique. Si le serveur est
démarré sans référentiel CIQUAL, ces routes répondent `404 NOT_FOUND`.

## 4. Côté interface

- `IngredientAutocomplete` (`src/client/features/ingredients/`) : liste de suggestions dès
  2 caractères, états chargement / vide / erreur avec « Réessayer », navigation clavier
  (↑ ↓ Entrée Échap), options tactiles d'au moins 48 px, rôle ARIA `combobox`.
- Une ancienne réponse ne remplace jamais une recherche plus récente : chaque nouvelle
  saisie annule la requête précédente (`AbortController`) et l'affichage n'est dérivé que
  du résultat correspondant exactement à la saisie courante.
- Le choix est un `IngredientSelection` : `{ mode: 'ciqual', code, name, source, version }`
  ou `{ mode: 'manual', name }`. L'option « Utiliser … comme ingrédient manuel » est toujours
  proposée, y compris quand la recherche échoue ; elle ne porte ni code ni nutriment.
  Modifier le texte invalide le choix précédent.
- `CiqualNutrientPreview` affiche les valeurs avec leurs unités et états, l'attribution
  et la version, sans conversion en zéro.

## 5. Limites

- Le calcul nutritionnel d'une recette (masses, cuisson, rendement, couverture) relève
  de S2-E01.
- La persistance de `ciqualCode` sur une ligne de recette dépend de l'intégration au
  formulaire (#30) : `PUT/POST /api/recipes` n'accepte pas encore ce champ.
- Le serveur n'envoie pas d'en-têtes CORS : un front servi par Vite sur un autre port
  nécessite un proxy ou ces en-têtes (variable `VITE_API_URL` pour l'origine de l'API).
- Les allergènes sont un référentiel distinct : aucune information d'allergène n'est
  déduite des données CIQUAL.

## 6. Tests

- `tests/unit/ciqual-api.test.ts` : normalisation, classement, validation, routes HTTP
  avec un dépôt simulé (requête courte, aucun résultat, limite, états des valeurs, 404, 405, 503).
- `src/client/features/ingredients/*.test.ts` : réponse tardive ignorée, états d'affichage,
  formatage sans zéro trompeur.
- `npm run test:ciqual:api` : mêmes parcours sur une base SQLite temporaire avec import réel
  du sous-ensemble (accents, ordre, limite, aliment inactif, traces, absence de création d'ingrédient).

## Filtre par catégorie et groupes officiels

La recherche accepte `category=food|prepared_dish|unclassified|all` ; omis signifie
`all` pour compatibilité. Le formulaire transmet `food` par défaut. Valeur inconnue,
vide ou répétée : HTTP 400 `INVALID_CATEGORY`. Le filtrage précède le classement
et la limite. Les résumés et détails incluent `category`, `groupCode`, `groupName`,
`subgroupCode`, `subgroupName`, `detailGroupCode`, `detailGroupName` (groupes nullables
pour les données historiques). Le détail par code inclut toujours les codes
inactifs ou reclassés. Voir [la politique complète](../data/ciqual-classification.md).
