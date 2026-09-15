# Configuration de GitHub Projects

## Objectif

GitHub Projects est la source de vérité pour le Product Backlog et le Sprint Backlog. Les documents Markdown conservent les décisions et synthèses ; ils ne dupliquent pas quotidiennement l'état de chaque tâche.

## Champs

| Champ | Type | Valeurs |
|---|---|---|
| Status | Sélection | Backlog, To refine, Ready, In progress, In review, Done |
| Type | Sélection | Epic, Story, Bug, Technical task, Documentation |
| Priority | Sélection | Must, Should, Could, Won't now |
| Sprint | Itération | Sprint 0, Sprint 1, Sprint 2, etc. |
| Estimate | Nombre | 1, 2, 3, 5 ou 8 |
| Actual effort | Nombre | Heures constatées, sans écraser l'estimation |
| Risk | Sélection | Low, Medium, High, Critical |
| Assignee | Personne | Étudiant responsable du prochain travail |

## Labels d'issues

### Type

- `type:epic`
- `type:story`
- `type:bug`
- `type:technical-task`
- `type:documentation`

### Domaine

- `area:profile`
- `area:recipes`
- `area:nutrition`
- `area:planning`
- `area:shopping`
- `area:electron`
- `area:database`
- `area:ci`

### État particulier

- `status:to-triage`
- `status:to-refine`
- `blocked`
- `question-product-owner`
- `security`

Éviter de représenter deux fois exactement la même information dans un champ et un label.

## Vues

Créer au minimum :

1. **Product Backlog** : tableau trié par priorité ;
2. **Current Sprint** : Kanban filtré sur le sprint courant ;
3. **Roadmap** : regroupement par epic ou itération ;
4. **Review Queue** : éléments au statut `In review` ;
5. **Risks and Blocks** : filtre sur `blocked`, `security` ou risque élevé ;
6. **Done by Sprint** : historique pour le rendu.

## Limites de travail en cours

Règle initiale :

- au plus une tâche principale `In progress` par développeur ;
- priorité à la revue et à la finalisation avant de démarrer une nouvelle tâche ;
- un élément bloqué reste visible et reçoit une prochaine action.

## Automatisations utiles

- issue ajoutée au projet -> `Backlog` ;
- Pull Request ouverte et liée -> `In review` ;
- Pull Request fusionnée -> `Done` ;
- issue fermée sans PR -> vérification manuelle de la Definition of Done.

## Export pour l'enseignant

À chaque fin de sprint :

- exporter le projet en CSV ;
- conserver le document de planning, review et rétrospective ;
- noter le tag ou commit correspondant à l'incrément ;
- conserver les rapports de tests significatifs ;
- vérifier que le professeur dispose d'un accès en lecture au dépôt et au projet.

