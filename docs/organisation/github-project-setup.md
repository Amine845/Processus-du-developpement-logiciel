# Configuration de GitHub Projects

## Objectif

GitHub Projects est la source de vérité du Product Backlog et du Sprint Backlog. À chaque séance, le tableau doit permettre de montrer les avancées, les écarts et le sprint suivant.

## Champs

| Champ | Type | Valeurs / usage |
|---|---|---|
| Status | Sélection | Backlog, To refine, Ready, In progress, In review, Done |
| Type | Sélection | Epic, Story, Bug, Technical task, Documentation |
| Priority | Sélection | Must, Should, Could, Won't now |
| Sprint | Itération | Sprint 0, Sprint 1, Sprint 2, etc. |
| Complexity | Nombre | Story points `1, 2, 3, 5, 8` |
| Estimated time | Nombre | Heures prévues avant réalisation |
| Actual time | Nombre | Heures réellement constatées |
| Risk | Sélection | Low, Medium, High, Critical |
| Assignee | Personne | Responsable du prochain travail |
| PO validation | Sélection | Pending, Accepted, Changes requested |

Complexité, temps estimé et temps réel ne sont pas interchangeables. Ne pas modifier l'estimation initiale après réalisation.

## Labels

### Type

- `type:epic`
- `type:story`
- `type:bug`
- `type:technical-task`
- `type:documentation`

### Domaine

- `area:auth`
- `area:recipes`
- `area:ingredients`
- `area:nutrition`
- `area:tags`
- `area:shopping`
- `area:responsive`
- `area:api`
- `area:database`
- `area:ciqual`
- `area:ci`

Le label `area:electron` peut être conservé uniquement pour les tâches de migration, puis archivé.

### État particulier

- `status:to-triage`
- `status:to-refine`
- `blocked`
- `question-product-owner`
- `security`
- `migration`

## Vues

1. **Product Backlog** : priorité puis ordre du PO ;
2. **Current Sprint** : Kanban du sprint ;
3. **PO Questions** : label `question-product-owner` ;
4. **Review Queue** : statut `In review` ;
5. **Risks and Blocks** : risques élevés, critiques ou `blocked` ;
6. **Mobile-first** : domaine responsive ;
7. **Done by Sprint** : historique et validation PO ;
8. **Estimates** : complexité, temps estimé et réel.

## Limites de travail en cours

- au plus une tâche principale `In progress` par développeur ;
- priorité à la revue et à la finalisation ;
- un blocage conserve une prochaine action visible.

## Automatisations

- issue ajoutée -> `Backlog` ;
- PR ouverte et liée -> `In review` ;
- PR fusionnée -> vérifier DoD puis `Done` ;
- issue fermée sans PR -> vérification manuelle ;
- validation du PO renseignée pendant la séance.

## Préparation de chaque séance

- mettre les statuts à jour ;
- compléter temps réel et liens PR ;
- vérifier les éléments réellement Done ;
- préparer la vue de démonstration ;
- exporter le backlog en CSV ;
- conserver le document de review et rétrospective ;
- noter le commit ou tag démontré ;
- vérifier l'accès du professeur.

