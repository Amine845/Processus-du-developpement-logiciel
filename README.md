# Gestion Recette

Gestion Recette est une application desktop de planification alimentaire. Elle aide un foyer à sélectionner des recettes compatibles avec ses contraintes, calculer leurs apports nutritionnels, organiser ses repas et générer une liste de courses.

Le projet est réalisé dans le cadre du cours de processus du développement logiciel. L'évaluation porte autant sur la conduite du projet, la traçabilité et la qualité que sur les fonctionnalités développées.

## Objectifs du projet

L'application doit permettre de :

- gérer un foyer et son nombre de personnes ;
- enregistrer allergies, régimes, préférences et équipements disponibles ;
- consulter et filtrer un catalogue de recettes ;
- ajuster les quantités au nombre de portions ;
- afficher les calories et macronutriments d'une recette ;
- planifier les repas sur une semaine ;
- générer une liste de courses agrégée ;
- prendre en compte un budget, un pays et éventuellement un magasin.

Le périmètre exact du MVP est défini dans [`docs/product/scope.md`](docs/product/scope.md).

## Équipe et responsabilités Scrum

Le groupe de réalisation est composé de quatre étudiants :

- **Scrum Master et développeur :** `[Nom]` ;
- **Développeur :** `[Nom]` ;
- **Développeur :** `[Nom]` ;
- **Développeur :** `[Nom]`.

Le **Product Owner est le professeur**, extérieur au groupe de réalisation. Il clarifie les besoins, ordonne ou valide les priorités du Product Backlog et accepte ou refuse l'incrément présenté lors de la Sprint Review.

Les responsabilités techniques, qualité et documentation sont partagées et tournent entre les étudiants. Le Scrum Master facilite le processus, mais ne distribue pas autoritairement les tâches.

Voir [`docs/organisation/roles.md`](docs/organisation/roles.md) pour la description complète.

## Stack technique envisagée

- Electron pour l'application desktop ;
- React pour l'interface ;
- TypeScript pour l'ensemble du code ;
- Vite pour le développement et le build ;
- SQLite pour la persistance locale ;
- Vitest pour les tests unitaires et d'intégration ;
- React Testing Library pour les composants ;
- Playwright pour les tests de bout en bout ;
- GitHub Actions pour l'intégration continue.

Les choix structurants sont consignés sous forme d'ADR dans [`docs/architecture/decisions`](docs/architecture/decisions).

## Documentation

| Sujet | Document |
|---|---|
| Vision produit | [`docs/product/vision.md`](docs/product/vision.md) |
| Périmètre et MVP | [`docs/product/scope.md`](docs/product/scope.md) |
| Personas | [`docs/product/personas.md`](docs/product/personas.md) |
| Backlog initial | [`docs/product/initial-backlog.md`](docs/product/initial-backlog.md) |
| Architecture | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| Modèle métier | [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) |
| Rôles | [`docs/organisation/roles.md`](docs/organisation/roles.md) |
| Processus Scrum | [`docs/organisation/scrum-process.md`](docs/organisation/scrum-process.md) |
| Workflow Git | [`docs/organisation/git-workflow.md`](docs/organisation/git-workflow.md) |
| Configuration GitHub Projects | [`docs/organisation/github-project-setup.md`](docs/organisation/github-project-setup.md) |
| Definition of Ready | [`docs/organisation/definition-of-ready.md`](docs/organisation/definition-of-ready.md) |
| Definition of Done | [`docs/organisation/definition-of-done.md`](docs/organisation/definition-of-done.md) |
| CI/CD | [`docs/development/ci-cd.md`](docs/development/ci-cd.md) |
| Environnement local | [`docs/development/local-setup.md`](docs/development/local-setup.md) |
| Stratégie de tests | [`docs/tests/test-strategy.md`](docs/tests/test-strategy.md) |
| Registre des risques | [`docs/risks/risk-register.md`](docs/risks/risk-register.md) |

L'index complet se trouve dans [`docs/README.md`](docs/README.md).

## Installation actuelle

Prérequis :

- Node.js dans une version compatible avec le projet ;
- npm ;
- Git.

```bash
git clone <URL_DU_DEPOT>
cd <NOM_DU_DEPOT>
npm ci
npm run dev
```

Commandes actuellement disponibles dans le squelette initial :

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Les commandes de tests et de packaging seront ajoutées pendant le Sprint 0. Ne documentez une commande comme fonctionnelle qu'après son intégration et sa vérification.

## Contribution

Toute modification doit partir d'une issue identifiée et passer par une Pull Request. Les règles détaillées sont dans [`CONTRIBUTING.md`](CONTRIBUTING.md).

Résumé du flux :

1. sélectionner une issue prête et priorisée ;
2. créer une branche courte depuis `main` ;
3. développer et tester ;
4. pousser la branche ;
5. ouvrir une Pull Request liée à l'issue ;
6. obtenir une revue d'un autre étudiant ;
7. attendre la réussite de la CI ;
8. fusionner puis supprimer la branche.

## État du projet

Le projet est en phase d'initialisation. Le Sprint 0 doit établir le socle technique, documentaire et qualité avant le développement des fonctionnalités métier.
