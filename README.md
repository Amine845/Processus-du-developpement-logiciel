# Gestion Recette

Gestion Recette est une application Web responsive, conçue mobile-first, permettant de gérer une bibliothèque de recettes, leurs ingrédients et leurs informations nutritionnelles, puis de générer une liste de courses utilisable sous forme de checklist.

Le projet est réalisé dans le cadre du cours de processus du développement logiciel. La conduite du projet, la traçabilité, les tests et la documentation sont prioritaires au même titre que le produit livré.

## Fonctionnalités validées avec le Product Owner

- connexion et gestion de session ;
- création, consultation, modification et archivage de recettes ;
- indication du nombre de personnes et adaptation des quantités ;
- gestion des ingrédients et de leurs caractéristiques ;
- association de tags, par exemple `gourmand` ;
- bibliothèque de recettes ;
- recherche par nom et par tag ;
- filtre par allergène ;
- calcul et affichage des macronutriments ;
- génération d'une liste de courses ;
- checklist avec progression `X/Y` ;
- interface utilisable en priorité sur mobile, puis sur écran plus large.

Le [périmètre du MVP](docs/product/scope.md) distingue les fonctionnalités validées des idées antérieures encore à confirmer.

## Équipe et responsabilités Scrum

Le groupe de réalisation est composé de quatre étudiants :

- **Scrum Master et développeur :** `Titiplex` ;
- **Développeur :** `Qwantike` ;
- **Développeur :** `Ahrizmo` ;
- **Développeur :** `Amine845`.

Le **Product Owner est le professeur**, extérieur au groupe de réalisation. Il clarifie les besoins, ordonne le Product Backlog et inspecte les incréments pendant les séances.

Les responsabilités qualité, architecture et documentation tournent entre les étudiants. Le Scrum Master facilite le processus mais ne distribue pas autoritairement les tâches.

## Architecture cible

Le dépôt contient encore le prototype Electron initial. La décision prise après le premier rendez-vous est de migrer vers une application Web responsive. La migration du code est planifiée dans le Sprint 0 et documentée par les ADR.

Stack cible provisoire :

- React et TypeScript pour l'interface Web ;
- Vite pour le développement et le build ;
- API TypeScript côté serveur, framework à sélectionner pendant le Sprint 0 ;
- base de données relationnelle côté serveur, moteur à sélectionner pendant le Sprint 0 ;
- authentification et sessions gérées côté serveur ;
- CI/CD avec GitHub Actions ;
- Vitest, React Testing Library et Playwright pour les tests.

L'application reste un [monolithe modulaire](docs/architecture/overview.md). Le domaine ne dépend ni de React, ni du framework HTTP, ni de la base de données.

## Données nutritionnelles

Les données de composition nutritionnelle proviennent de la **Table Ciqual 2025** publiée par l'Anses. La provenance, la version, la licence, la procédure d'import et les limites sont décrites dans [`docs/data/ciqual.md`](docs/data/ciqual.md).

CIQUAL sert à la composition nutritionnelle. Les allergènes sont modélisés séparément : l'absence d'une donnée dans CIQUAL ne prouve pas l'absence d'un allergène.

## Documentation

| Sujet | Document |
|---|---|
| Vision produit | [`docs/product/vision.md`](docs/product/vision.md) |
| Périmètre et MVP | [`docs/product/scope.md`](docs/product/scope.md) |
| Personas | [`docs/product/personas.md`](docs/product/personas.md) |
| Backlog initial | [`docs/product/initial-backlog.md`](docs/product/initial-backlog.md) |
| Architecture | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| Modèle métier | [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) |
| Données CIQUAL | [`docs/data/ciqual.md`](docs/data/ciqual.md) |
| Rôles | [`docs/organisation/roles.md`](docs/organisation/roles.md) |
| Processus Scrum | [`docs/organisation/scrum-process.md`](docs/organisation/scrum-process.md) |
| Workflow Git | [`docs/organisation/git-workflow.md`](docs/organisation/git-workflow.md) |
| GitHub Projects | [`docs/organisation/github-project-setup.md`](docs/organisation/github-project-setup.md) |
| Definition of Ready | [`docs/organisation/definition-of-ready.md`](docs/organisation/definition-of-ready.md) |
| Definition of Done | [`docs/organisation/definition-of-done.md`](docs/organisation/definition-of-done.md) |
| CI/CD | [`docs/development/ci-cd.md`](docs/development/ci-cd.md) |
| Environnement local | [`docs/development/local-setup.md`](docs/development/local-setup.md) |
| Stratégie de tests | [`docs/tests/test-strategy.md`](docs/tests/test-strategy.md) |
| Registre des risques | [`docs/risks/risk-register.md`](docs/risks/risk-register.md) |

## Installation actuelle

Le code source est en transition entre le prototype Electron et l'architecture Web cible. Les commandes disponibles restent celles du dépôt jusqu'à la fusion de la migration :

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Le guide [`docs/development/local-setup.md`](docs/development/local-setup.md) distingue les commandes actuelles du contrat de commandes visé.

## Contribution

Toute modification part d'une issue identifiée et passe par une Pull Request. Voir [`CONTRIBUTING.md`](CONTRIBUTING.md).

Résumé :

1. sélectionner une issue prête et priorisée ;
2. créer une branche courte depuis `main` ;
3. développer, documenter et tester ;
4. ouvrir une Pull Request liée à l'issue ;
5. obtenir une revue d'un autre étudiant ;
6. attendre la réussite de la CI ;
7. fusionner puis supprimer la branche.

## État du projet

Le premier rendez-vous avec le Product Owner a recentré le MVP sur la gestion de recettes et d'ingrédients, l'authentification, la recherche, les tags, les allergènes, les macros et la liste de courses. Le Sprint 0 doit maintenant aligner le code, le pipeline et la base de données sur cette vision Web mobile-first.
