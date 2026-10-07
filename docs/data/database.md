# Base de données minimale — SQLite + Prisma

## Périmètre et versions

Le schéma du Sprint 1 contient uniquement `Recipe`, `Ingredient`, `RecipeIngredient`
et `RecipeStep`. Les comptes, la nutrition, CIQUAL, les tags et les courses restent
hors de cette migration. SQLite est utilisé côté serveur, jamais depuis React.
Le modèle métier complet reste la cible ; cette migration en implémente un sous-ensemble.
Voir [ADR-006](../architecture/decisions/ADR-006-minimal-recipe-database.md).

`prisma` et `@prisma/client` sont fixés ensemble à **6.12.0** dans `package.json`
et le lockfile. Utiliser `npm ci`, pas une installation globale ni `npx prisma@latest`.
La CI utilise Node 22. Aucun service SQLite ou Docker n'est nécessaire.

## Configuration et chargement

Depuis la racine du dépôt, copier `src/server/.env.example` vers `src/server/.env`
(sans écraser un fichier existant). Exemple PowerShell :

```powershell
Copy-Item src/server/.env.example src/server/.env
npm ci
npm run db:validate
npm run db:migrate
npm run db:generate
```

Sous Linux/macOS, utiliser `cp` pour la copie. Le fichier contient :

```dotenv
DATABASE_URL="file:./dev.db"
```

Les scripts `db:*` exécutent le CLI installé avec `src/server` comme répertoire
courant. Le wrapper charge explicitement `src/server/.env` avec `process.loadEnvFile`
(Node 22, comme la CI), puis Prisma trouve `prisma/schema.prisma`.
Une variable `DATABASE_URL` déjà exportée prend la priorité. Ne pas définir la
même variable dans un second `.env` dans `prisma/` (conflit de chargement).
Ne pas dupliquer `DATABASE_URL` dans le `.env` racine : le CLI Prisma peut
aussi le détecter en remontant jusqu’au `package.json`.

Avec cette version et le pilote natif, le chemin SQLite relatif est résolu
**depuis le dossier du schéma**, pas depuis le terminal : `file:./dev.db` crée
`src/server/prisma/dev.db`. L'ancien exemple `file:./prisma/dev.db` ajoutait
un niveau `prisma` superflu. `npm run test:db` vérifie ce comportement sur une
copie temporaire du schéma et du `.env`, avec le CLI réellement installé.

Le futur démarrage serveur doit charger sa configuration avant de créer le client,
par exemple `node --env-file=src/server/.env <entree-serveur-compilee>` depuis la
racine. Il doit refuser une configuration absente/invalide. Aucun serveur HTTP ni
chargeur de configuration applicatif n'est ajouté par cette issue. Ne jamais
préfixer `DATABASE_URL` par `VITE_` ni importer Prisma depuis `src/client`.

## Modèles, relations et validation

| Élément                         | Contrainte dans SQLite                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Recipe.title`                  | Texte de 1 à 200 caractères, non blanc après retrait des espaces ASCII, tabulations et sauts de ligne aux extrémités |
| `Recipe.description`            | Texte facultatif (`NULL` autorisé)                                                                                   |
| `Recipe.servings`               | Entier stocké entre 1 et 2147483647 (compatible Prisma `Int`)                                                        |
| `Ingredient.canonicalName`      | Texte non blanc, même définition des blancs que le titre                                                             |
| `RecipeIngredient.quantity`     | Nombre strictement positif et fini                                                                                   |
| `RecipeIngredient.unit`         | Une des valeurs exactes `g`, `kg`, `ml`, `l`, `piece`                                                                |
| Positions de lignes et d'étapes | Entiers de 1 à 2147483647, uniques par recette, trous autorisés                                                      |
| `RecipeStep.instruction`        | Texte non blanc                                                                                                      |
| Clés étrangères                 | Recette et ingrédient référencés obligatoirement existants                                                           |

Les `NOT NULL`, `CHECK`, clés étrangères et index uniques sont dans la migration
SQL versionnée. Prisma décrit types, relations et unicité, mais **ne représente
pas les `CHECK` dans son schéma**. Les tests passent aussi par SQL brut pour
vérifier les contraintes sans la validation du client Prisma.
SQLite applique ses affinités avant les `CHECK` : une chaîne numérique convertible
peut devenir un nombre. Les espaces Unicode ne sont pas normalisés par ces `CHECK`.
La future validation serveur devra vérifier les types d'entrée, normaliser les
espaces Unicode et retourner des erreurs métier lisibles. La validation UI sera
complémentaire. La liste d'unités est un choix technique minimal ; toute extension
nécessite une migration. Aucune conversion entre masse, volume et pièces n'est implicite.

Supprimer physiquement une recette applique `CASCADE` à ses lignes et étapes.
Supprimer un ingrédient utilisé applique `RESTRICT`. Les mises à jour des clés
référencées appliquent `CASCADE`. Prisma active les clés étrangères pour ses
connexions ; tout outil SQLite externe doit activer `PRAGMA foreign_keys = ON`
**sur chaque connexion**. Les tests vérifient l'activation et les règles effectives.
L'archivage réversible prévu par le domaine reste une fonctionnalité ultérieure :
ces règles SQL n'exposent pas une suppression définitive dans l'interface.

Une recette peut être créée sans lignes ni étapes pour permettre sa construction
progressive. Le même ingrédient peut figurer à plusieurs positions. Lire les
collections avec `orderBy: { position: 'asc' }` : SQL ne garantit aucun ordre implicite.
Un réordonnancement doit éviter les collisions de positions uniques dans une transaction.

## Appliquer et créer les migrations

Après chaque `git pull`, depuis la racine :

```bash
npm ci
npm run db:migrate
npm run db:generate
```

`db:migrate` utilise `migrate deploy` : applique l'historique existant, sans créer
une nouvelle migration ni proposer de reset. Une deuxième exécution est sans effet.
Ne pas utiliser `db push` : cela ne reproduit pas les `CHECK` SQL personnalisés.

Pour faire évoluer le schéma :

1. Se coordonner sur l'issue et récupérer les migrations déjà fusionnées.
2. Modifier `src/server/prisma/schema.prisma`.
3. Exécuter `npm run db:migrate:dev -- --name nom_explicite --create-only`.
4. Relire le SQL et **préserver les `CHECK`**, notamment lors d'une reconstruction
   de table SQLite. Le schéma Prisma seul ne suffit pas à les reconstruire.
5. Appliquer avec `npm run db:migrate:dev`, puis `npm run db:generate` et `npm run test:db`.
6. Commiter schéma, migration SQL et `migration_lock.toml` ensemble.

Ne pas modifier une migration déjà partagée/appliquée. En cas de migrations
concurrentes, rebaser et vérifier l'historique complet sur une base temporaire,
puis créer une migration corrective si nécessaire. Ne jamais accepter un reset
sur une base à conserver ; aucun script de reset n'est fourni ici.

## Validation et exclusions Git

```bash
npm run test:db
```

Le test crée une base temporaire vide, applique les migrations deux fois, vérifie
le chemin relatif, l'absence de dérive structurelle Prisma, le CRUD minimal,
les `CHECK`, l'unicité, les références orphelines et les suppressions. Il nettoie
uniquement son répertoire temporaire, même en cas d'échec. Il vérifie également
les exclusions Git, y compris les auxiliaires SQLite et la conservation de l'exemple.
La CI exécute ce même script ; aucun `.env` développeur n'est nécessaire.

Les fichiers `.db`, `.sqlite`, `.sqlite3` et leurs suffixes (`-journal`, `-wal`,
`-shm`, etc.) sont ignorés à tous les niveaux. Les `.env` et `.env.*` sont ignorés,
sauf `.env.example`. Une règle ignore ne désindexe pas un fichier déjà suivi :
contrôler le contenu de `git diff --cached` avant de commiter.

## Limites

SQLite sérialise les écritures ; il ne fournit pas un serveur partagé entre les
machines des développeurs. Le choix de production reste ouvert. Les quantités
utilisent `Float` : la politique de conversion et d'arrondi sera traitée dans le
domaine. Aucune authentification, donnée réelle ou seed n'est ajouté.

Références : [environnement Prisma 6](https://www.prisma.io/docs/orm/v6/more/dev-environment/environment-variables),
[CLI Prisma 6](https://www.prisma.io/docs/orm/v6/reference/prisma-cli-reference).
Le comportement de chemin est aussi couvert par un test exécutable versionné.
