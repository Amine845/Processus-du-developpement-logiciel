# ADR-006 — Schéma minimal des recettes côté serveur

- **Statut :** implémenté pour le développement local et la CI
- **Date :** `2026-10-07`

## Contexte

L'ADR-005 impose une persistance relationnelle côté serveur et des migrations.
La documentation BDD retient SQLite/Prisma mais le dépôt ne contenait pas encore
le schéma ni les dépendances correspondantes.

## Décision

Conserver SQLite, `src/server/prisma` et Prisma 6.12.0 avec son pilote natif,
pour reprendre la configuration `datasource.url` déjà documentée sans migration
vers Prisma 7. Fixer CLI et client à la même version et versionner le lockfile.
La version 6.12.0 évite les alertes supplémentaires de dépendances observées
avec 6.19.0 lors de l’audit ; les mises à niveau devront repasser les tests BDD
et l’audit. Les alertes déjà présentes dans le socle sont une tâche séparée.
Limiter le schéma à Recipe, Ingredient, RecipeIngredient et RecipeStep.
Définir les invariants dans des `CHECK` SQL et couvrir les migrations par un test
isolé. Les unités initiales sont g, kg, ml, l et piece ; le titre est limité à 200
caractères. Ces choix techniques pourront évoluer par migration.

## Conséquences

Les développeurs reproduisent le même schéma sans serveur de base à installer.
Les `CHECK` doivent être conservés manuellement dans les futures migrations.
L'API, l'archivage, l'authentification et le moteur de production restent hors
périmètre. Il ne s'agit pas d'un retour au stockage Electron de l'ADR-002.
Voir [la procédure BDD](../../data/database.md) pour les contraintes et commandes.
