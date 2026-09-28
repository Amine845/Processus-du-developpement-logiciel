# Index documentaire

La documentation fait partie du produit. Elle est versionnée avec le code et mise à jour dans les mêmes Pull Requests.

## Produit

- [`product/vision.md`](product/vision.md) : problème, utilisateurs, proposition de valeur et objectifs.
- [`product/scope.md`](product/scope.md) : contenu du MVP, extensions et éléments exclus.
- [`product/personas.md`](product/personas.md) : profils utilisateurs initiaux.
- [`product/initial-backlog.md`](product/initial-backlog.md) : epics et premières user stories.

## Architecture

- [`architecture/overview.md`](architecture/overview.md) : architecture logique et règles de dépendance.
- [`architecture/domain-model.md`](architecture/domain-model.md) : entités, relations et règles métier.
- [`architecture/decisions/ADR-001-electron-react-typescript.md`](architecture/decisions/ADR-001-electron-react-typescript.md).
- [`architecture/decisions/ADR-002-local-first-sqlite.md`](architecture/decisions/ADR-002-local-first-sqlite.md).
- [`architecture/decisions/ADR-003-modular-monolith.md`](architecture/decisions/ADR-003-modular-monolith.md).
- [`architecture/decisions/ADR-004-responsive-web-mobile-first.md`](architecture/decisions/ADR-004-responsive-web-mobile-first.md).
- [`architecture/decisions/ADR-005-server-persistence-auth.md`](architecture/decisions/ADR-005-server-persistence-auth.md).

## Données

- [`data/ciqual.md`](data/ciqual.md) : source, version, import et limites de CIQUAL.

## Organisation

- [`organisation/roles.md`](organisation/roles.md) : Product Owner professeur, Scrum Master et développeurs.
- [`organisation/scrum-process.md`](organisation/scrum-process.md) : événements, artefacts et règles de fonctionnement.
- [`organisation/git-workflow.md`](organisation/git-workflow.md) : branches, Pull Requests et traçabilité.
- [`organisation/github-project-setup.md`](organisation/github-project-setup.md) : champs, labels, vues et exports.
- [`organisation/definition-of-ready.md`](organisation/definition-of-ready.md).
- [`organisation/definition-of-done.md`](organisation/definition-of-done.md).

## Développement et qualité

- [`development/local-setup.md`](development/local-setup.md) : installation et commandes.
- [`development/ci-cd.md`](development/ci-cd.md) : pipeline cible et règles de livraison.
- [`tests/test-strategy.md`](tests/test-strategy.md) : niveaux de tests et rapports.
- [`risks/risk-register.md`](risks/risk-register.md) : risques, réponses et responsables.

## Modèles de travail

- [`meetings/MEETING-TEMPLATE.md`](meetings/MEETING-TEMPLATE.md).
- [`meetings/001-first-product-owner-meeting.md`](meetings/001-first-product-owner-meeting.md).
- [`sprints/SPRINT-PLANNING-TEMPLATE.md`](sprints/SPRINT-PLANNING-TEMPLATE.md).
- [`sprints/SPRINT-REVIEW-TEMPLATE.md`](sprints/SPRINT-REVIEW-TEMPLATE.md).
- [`sprints/SPRINT-RETROSPECTIVE-TEMPLATE.md`](sprints/SPRINT-RETROSPECTIVE-TEMPLATE.md).
- [`sprints/sprint-00-planning.md`](sprints/sprint-00-planning.md).

## Règles de mise à jour

- La documentation change dans la même Pull Request que le comportement concerné.
- Les comptes rendus sont ajoutés au plus tard le lendemain de la réunion.
- Une décision structurante reçoit un ADR numéroté.
- À la fin de chaque sprint, les tableaux sont exportés dans un format ouvert et les documents du sprint sont finalisés.
- Les documents obsolètes sont corrigés ou explicitement marqués comme remplacés ; ils ne sont pas laissés silencieusement faux.
