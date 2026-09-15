# Guide de contribution

Ce document définit les règles communes de développement. Elles s'appliquent aux quatre étudiants, Scrum Master compris.

## Principes

- `main` doit toujours rester compilable et démontrable.
- Une modification commence par une issue.
- Une branche représente une tâche, pas une personne.
- Les branches doivent rester courtes et ciblées.
- Une Pull Request ne doit pas être fusionnée par son auteur sans revue, sauf situation exceptionnelle documentée.
- Une modification métier doit être accompagnée de tests adaptés.
- Les décisions importantes doivent être écrites dans le dépôt.

## Avant de commencer une tâche

Vérifier que l'issue satisfait la [Definition of Ready](docs/organisation/definition-of-ready.md) :

- objectif compris ;
- critères d'acceptation testables ;
- priorité connue ;
- estimation réalisée ;
- dépendances identifiées ;
- tâche suffisamment petite pour le sprint.

Le développeur s'assigne lui-même l'issue dans le respect de l'objectif du sprint. Le Scrum Master facilite la coordination mais ne distribue pas les tâches comme un chef de projet.

## Création d'une branche

Mettre `main` à jour :

```bash
git switch main
git pull --ff-only origin main
```

Créer une branche :

```bash
git switch -c feature/18-allergy-filter
```

Préfixes autorisés :

| Préfixe | Usage |
|---|---|
| `feature/` | Nouvelle fonctionnalité |
| `fix/` | Correction d'un défaut |
| `refactor/` | Restructuration sans changement fonctionnel |
| `test/` | Ajout ou correction de tests |
| `docs/` | Documentation uniquement |
| `chore/` | Maintenance, configuration ou dépendances |

Format recommandé : `<type>/<numero-issue>-<description-courte>`.

## Commits

Les commits doivent être petits, cohérents et compréhensibles.

Format recommandé :

```text
<type>(<module>): <description à l'impératif>
```

Exemples :

```text
feat(recipes): add equipment compatibility filter
fix(nutrition): correct per-serving protein calculation
test(planning): cover empty meal plan generation
docs(scrum): add sprint review template
```

Types principaux : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.

Référencer l'issue dans le corps du commit ou dans la Pull Request :

```text
Refs #18
```

Ne pas mélanger dans un même commit une fonctionnalité, un formatage général et une mise à jour indépendante de dépendances.

## Avant de pousser

Exécuter les contrôles disponibles :

```bash
npm run lint
npm run build
```

Lorsque les scripts auront été ajoutés :

```bash
npm run typecheck
npm run test
npm run test:coverage
```

Le fait qu'une vérification n'existe pas encore doit devenir une tâche du backlog, pas être masqué dans la documentation.

## Pull Requests

Une Pull Request doit :

- avoir un titre explicite ;
- référencer l'issue avec `Closes #<numéro>` lorsque la fusion doit la fermer ;
- résumer les changements ;
- expliquer comment les tester ;
- signaler les limites et risques connus ;
- rester suffisamment petite pour être relue ;
- inclure des captures si l'interface change ;
- mettre à jour la documentation si nécessaire.

L'auteur relit lui-même son diff avant de demander une revue.

## Revue de code

Le reviewer vérifie au minimum :

- adéquation avec les critères d'acceptation ;
- lisibilité et modularité ;
- absence de logique métier dans les composants React ;
- gestion des erreurs et entrées invalides ;
- présence et pertinence des tests ;
- impact sécurité, notamment pour Electron et IPC ;
- mise à jour de la documentation ;
- absence de secret ou donnée sensible.

Une demande de changement doit expliquer le problème et, si possible, proposer une direction sans imposer inutilement une implémentation.

## Fusion

Conditions minimales :

- Pull Request approuvée par au moins un autre étudiant ;
- CI réussie ;
- conversations résolues ;
- critères d'acceptation satisfaits ;
- [Definition of Done](docs/organisation/definition-of-done.md) respectée.

Utiliser de préférence **Squash and merge** pour conserver un historique lisible. Supprimer la branche après fusion.

## Désaccord ou blocage

1. discuter sur l'issue ou la Pull Request avec des arguments vérifiables ;
2. solliciter un troisième membre si nécessaire ;
3. demander au Scrum Master de faciliter la résolution ;
4. solliciter le Product Owner uniquement si le désaccord concerne le besoin, la valeur ou la priorité ;
5. consigner toute décision architecturale significative dans un ADR.

