# Lecture des recettes côté serveur

## Contrat et séparation

`src/server/domain/recipe-repository.ts` définit les DTO et `RecipeRepository`,
sans import Prisma. `findAll()` renvoie les résumés par identifiant croissant ;
`findById(id)` renvoie le détail avec ingrédients, quantités, unités et étapes
par position croissante. Les collections peuvent être vides et les positions
non consécutives. `description` conserve explicitement `null`.

Une recette absente donne `null`. Une erreur de lecture donne `RecipeReadError`,
sans message Prisma, chemin SQLite ni cause contenant la connexion. Un identifiant
hors du domaine entier positif 32 bits donne `RangeError`. Le mapping n'expose
ni les identifiants techniques des lignes/étapes ni leurs clés étrangères recette.
Les unités sont celles validées par les contraintes SQL existantes.

L'adaptateur Prisma est dans `infrastructure/`. La couche applicative reçoit
l'interface par injection ; elle ne crée aucun client. `startServer()` est le
point de composition : un seul client par instance de serveur, partagé entre
les requêtes. La fabrique reste explicite pour isoler les tests.

Le serveur minimal expose `GET /api/recipes` et `GET /api/recipes/:id` en local
sur `127.0.0.1:3001` (variable `PORT` facultative). Le détail absent donne HTTP 404,
un identifiant numérique hors limites 400, une lecture en échec 503 avec un code
stable. Ce serveur de lecture ne fournit pas encore d'authentification ni de
raccordement à l'interface React. Aucun import Prisma n'est ajouté au navigateur.
La compilation serveur est séparée de celle du client.

## Démarrage (Windows CMD, racine du dépôt)

```bat
if not exist src\server\.env copy src\server\.env.example src\server\.env
npm ci
npm run db:migrate
npm run start:server
```

Le lanceur charge `src/server/.env` ; les variables déjà définies ont priorité.
Le démarrage compile le serveur et génère Prisma. L'URL SQLite relative conserve
la résolution depuis le dossier du schéma. Une configuration manquante ou un
échec de connexion arrête le démarrage avec un message générique.

À SIGINT (Ctrl+C) ou SIGTERM, le serveur cesse d'accepter des requêtes, attend
la fin des requêtes actives puis appelle `$disconnect()`. `close()` est également
exposé pour les tests et l'intégration ; plusieurs appels partagent la même
promesse. Un démarrage échoué ferme aussi le client. Un arrêt forcé du processus
ne permet évidemment pas de garantir l'exécution des handlers.

## Validation isolée

```bat
npm run test:repository
npm run test:db
npm run lint
npm run build:server
```

Le premier script compile réellement les sources TypeScript puis utilise le
runner natif Node (sans charger Vite/Electron). Il copie schéma et migrations
dans un dossier temporaire, impose sa propre `DATABASE_URL`, applique
`migrate deploy` et ne charge aucun `.env` pour les migrations de test.
La génération du client utilise le script habituel mais ne lit/écrit aucune base.
Les connexions de test sont fermées avant de supprimer le dossier temporaire,
y compris après un échec d'assertion.

Cas couverts : liste vide, ordre de liste indépendant du titre et de l'insertion,
lecture exacte du DTO, ingrédients et étapes insérés dans le désordre, collections
vides, description nulle, identifiant absent/invalide, connexion SQLite impossible,
injection du repository, réponses HTTP et fermeture idempotente du serveur.
La CI exécute ces tests en plus des tests de migration existants.

L'estimation de l'issue reste 3 points / 4 heures ; le temps réel doit être
renseigné à la clôture à partir du temps effectivement suivi.
