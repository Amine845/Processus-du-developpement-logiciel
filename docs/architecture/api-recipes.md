# Spécification de l'API REST - Recettes

## 1. Contexte & Architecture

L'application Electron s'appuie sur une API HTTP locale (Node.js / Express) démarrée sur le port `3001`.
Cette interface permet au frontend React de consommer les données de recettes stockées dans la base SQLite locale sans coupler l'interface au moteur Prisma.

- **Base URL locale :** `http://localhost:3001/api/recipes`
- **Format d'échange :** JSON (`Content-Type: application/json`)
- **Types partagés :** Déclarés dans `src/shared/types/recipe.types.ts`

---

## 2. Modèles de Données (DTOs)

### `RecipeDTO`

Représente une recette complète avec ses ingrédients et étapes ordonnées :

```typescript
interface RecipeDTO {
  id: number
  title: string
  description: string | null
  servings: number
  ingredients: IngredientDTO[]
  steps: StepDTO[]
}

interface IngredientDTO {
  id?: number
  canonicalName: string
  quantity: number
  unit: 'g' | 'kg' | 'ml' | 'l' | 'piece' | string
  position: number
}

interface StepDTO {
  id?: number
  instruction: string
  position: number
}
```

---

## 3. Endpoints Disponibles

### `GET /api/recipes`

Récupère l'ensemble des recettes avec leurs ingrédients et étapes associées.

**Codes HTTP :**

- `200 OK` : liste des recettes récupérée avec succès.
- `500 Internal Server Error` : erreur de lecture en base de données.

**Exemple de réponse :**

```json
[
  {
    "id": 1,
    "title": "Omelette simple",
    "description": "Recette rapide du quotidien",
    "servings": 2,
    "ingredients": [
      {
        "id": 1,
        "canonicalName": "Oeuf",
        "quantity": 4,
        "unit": "piece",
        "position": 1
      }
    ],
    "steps": [
      {
        "id": 1,
        "instruction": "Battre les oeufs dans un bol.",
        "position": 1
      }
    ]
  }
]
```

### `GET /api/recipes/:id`

Récupère les détails d'une recette par son identifiant unique.

**Paramètres d'URL :** `id` (entier)

**Codes HTTP :**

- `200 OK` : recette trouvée et retournée.
- `400 Bad Request` : format de l'identifiant invalide (non numérique).
- `404 Not Found` : aucune recette associée à cet identifiant.
- `500 Internal Server Error` : erreur serveur inattendue.

### `DELETE /api/recipes/:id`

Supprime une recette ainsi que ses dépendances (ingrédients et étapes associés supprimés en cascade).

**Paramètres d'URL :** `id` (entier)

**Codes HTTP :**

- `204 No Content` : suppression réussie, aucun corps de réponse.
- `400 Bad Request` : format de l'identifiant invalide.
- `500 Internal Server Error` : erreur lors de la suppression en base.
