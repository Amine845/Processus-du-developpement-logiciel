# Architecture & Gestion de la Base de Données (SQLite + Prisma)

Ce projet utilise **SQLite** avec l'ORM **Prisma** pour le backend Node.js/TypeScript.

Afin de simplifier le développement en équipe, **chaque développeur utilise sa propre base de données locale**, stockée dans un simple fichier `.db` à la racine du serveur. Aucune connexion réseau ni serveur distant n'est nécessaire. La structure de la base de données reste synchronisée entre tous les membres grâce aux migrations Prisma, versionnées sur Git.

## 1. Stockage et Accès

- **Type :** Fichier local SQLite (`dev.db`)
- **Emplacement :** `src/server/prisma/dev.db` (généré automatiquement à la première migration)
- **Condition réseau :** Aucune — tout fonctionne en local, hors ligne, sans VPN ni campus.
- **Outil recommandé :** L'onglet **Database** de WebStorm / IntelliJ, ou DataGrip, pour inspecter le fichier `.db` si besoin.

> Le fichier `dev.db` est propre à chaque machine et **ne doit jamais être commité** sur Git (il doit figurer dans `.gitignore`). Seuls le schéma (`schema.prisma`) et l'historique des migrations (`prisma/migrations/`) sont partagés entre les membres de l'équipe.

## 2. Configuration Locale (.env)

Avec SQLite, la variable `DATABASE_URL` ne pointe plus vers un serveur distant mais vers un chemin de fichier local.

Créez un fichier `.env` à la racine du dossier `src/server/` :

```env
# Fichier: src/server/.env (NE JAMAIS PUSHER SUR GITHUB)
# Format : file:./chemin/vers/le/fichier.db

DATABASE_URL="file:./prisma/dev.db"
```

Dans `schema.prisma`, le bloc `datasource` doit être configuré ainsi :

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

## 3. Initialisation et Synchronisation (Migrations)

La structure de la base de données (la "Single Source of Truth") est entièrement définie dans le fichier `src/server/prisma/schema.prisma`.

Lors de votre première installation ou après avoir récupéré le code de l'équipe (via un `git pull`), exécutez cette commande dans le dossier `src/server/` pour créer/mettre à jour votre fichier `dev.db` local :

```bash
npx prisma migrate dev
```

Prisma va lire l'historique des migrations partagé sur GitHub et appliquer les changements manquants directement dans votre fichier local, sans toucher à celui des autres membres de l'équipe.

## 4. Flux de travail : Modifier la base de données

Si vous devez ajouter une table ou modifier une colonne lors du développement d'une nouvelle fonctionnalité :

1. Ouvrez `src/server/prisma/schema.prisma`.
2. Modifiez les modèles (ex: ajoutez un modèle `Recipe` ou une colonne `imageUrl`).
3. Générez la migration pour appliquer les changements et enregistrer l'historique :

```bash
npx prisma migrate dev --name ajout_table_recettes
```

4. Prisma va générer un fichier SQL dans le dossier `prisma/migrations/` et mettre à jour le client TypeScript automatiquement.
5. Commitez vos modifications (le fichier `schema.prisma` et le dossier `migrations/`, **pas** le fichier `.db`) dans votre Pull Request.

## 5. Utilisation dans le Code TypeScript (Backend)

Prisma génère un client typé sur mesure adapté à notre schéma. L'instanciation centrale se fait dans `src/server/infrastructure/database/index.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

Dans vos contrôleurs ou services, vous pouvez désormais interagir avec la base de données en profitant de l'autocomplétion native de WebStorm :

```typescript
import prisma from '../infrastructure/database';

// Exemple : Récupérer tous les utilisateurs
const users = await prisma.user.findMany();

// Exemple : Créer une recette
const newRecipe = await prisma.recipe.create({
  data: {
    title: 'Gâteau au chocolat',
    authorId: 1
  }
});
```

## 6. Limites de SQLite à connaître

- **Pas d'écritures concurrentes** : SQLite verrouille le fichier entier lors d'une écriture, ce qui peut poser problème si plusieurs process accèdent au même fichier en parallèle (rarement un souci en dev solo).
- **Types limités** : pas de type `Enum` natif ni de tableaux (`String[]`) contrairement à PostgreSQL — Prisma les émule différemment ou les refuse selon le type.
- **Non adapté à la prod** : SQLite convient très bien au développement local, mais un déploiement en production reste généralement préférable avec PostgreSQL.