# Sprint 03 — Backlog et descriptions prêtes à publier

## Statut de publication

Descriptions préparées le 04/11/2026 après lecture des issues #29, #71, #27, #72, #65 et #73. Les cinq tentatives de mise à jour ont échoué avec GitHub 403 « Resource not accessible by integration ». Aucune modification distante, création de ticket, affectation, milestone ou mise à jour de Project n'est revendiquée. Les anciennes descriptions sont archivées dans chaque fichier d'issue pour conserver les exigences et le contexte.

## Cinq issues demandées

| Issue | Périmètre retenu | Document | Charge proposée |
| --- | --- | --- | --- |
| [#29](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/29) | Bibliothèque cohérente et recherche titre | [Corps #29](sprint-03-issues/issue-029.md) | 3 points / 4 h |
| [#71](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/71) | Tags persistés des ingrédients | [Corps #71](sprint-03-issues/issue-071.md) | 3 points / 5 h |
| [#27](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/27) | Filtres ingrédients et tags | [Corps #27](sprint-03-issues/issue-027.md) | 5 points / 7 h |
| [#72](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/72) | Photo, extension partagée avec #51 | [Corps #72](sprint-03-issues/issue-072.md) | 5 points / 8 h |
| [#65](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/65) | Préparation, portions et restitution nutritionnelle | [Corps #65](sprint-03-issues/issue-065.md) | 5 points / 8 h |

Les titres initiaux de #29 et #65 ne correspondent plus clairement aux responsabilités des écrans. Le nouveau découpage évite que bibliothèque, filtres et fiche soient trois fois décrits comme une « page recette détaillée ».

## Nouvelles issues proposées

| Référence locale | Besoin manquant | Markdown | Dépendances |
| --- | --- | --- | --- |
| S3-T01 | Classification CIQUAL aliments/plats | [Issue à créer](sprint-03-issues/task-ciqual-classification.md) | Pipeline d'import |
| S3-T02 | Choix CIQUAL persisté, quantités, manuel et étapes | [Issue à créer](sprint-03-issues/task-ciqual-recipe-link.md) | T01 pour filtre par défaut |
| S3-T03 | Calcul des macros, masses et couverture | [Issue à créer](sprint-03-issues/task-recipe-nutrition.md) | T02 |
| S3-T04 | Vérification du parcours et review | [Issue à créer](sprint-03-issues/task-integration-demo.md) | Parcours sélectionné |

Ces quatre tâches sont nécessaires au résultat demandé dans le code examiné. Réutiliser un ticket équivalent s'il existe au moment du planning. Après création, remplacer les références locales par les vrais numéros dans les corps et les liens de suivi ; ne pas inventer de numéros.

## Issues voisines à coordonner

- **#74 — ingrédient utilisateur :** existe, description vide à la lecture. Conserver la responsabilité du CRUD manuel global ici. S3-T02 inclut seulement le mode manuel du formulaire nécessaire au parcours ; pas de doublon de modèle.
- **#51 — photo :** périmètre déjà stockage/compression/nom aléatoire/photo/OpenGraph. Réalisation commune avec #72 ; OpenGraph ne devient pas Done par l'upload seul.
- **#70 — page recette complète :** description vide. Peut servir de suivi de #65 et du matériel ; éviter un deuxième développement de fiche.
- **#33/#44/#69 :** fermées ; réutiliser les composants et imports disponibles. S3-T02 est une consolidation des lacunes observées sur Front, pas une réouverture automatique.
- **#73 — Sprint 3 :** parent existant des cinq issues demandées. [Corps de suivi proposé](sprint-03-issues/issue-073.md).

## Reliquats explicites, à découper avant clôture des suivis larges

| Besoin original | Suivi actuel proposé | Précondition et décision |
| --- | --- | --- |
| Gourmand/Rapide | #27 et suivi #73 | Tags propres aux recettes ; pas déductibles des tags d'ingrédients |
| Recherche/filtre matériel | #29/#27 et #31, suivi #73 | Matériel persisté et exposé ; règle de correspondance à définir |
| Matériel sur fiche | #65/#70, suivi #73 | Extension estimée 3 points / 5 h ; migration, création, lecture et rendu |
| Allergènes et régimes | #27/#29, suivi #73 | Source dédiée, statut inconnu, règles séparant lait/lactose/régime ; aucune certification de ce sprint |
| Fibres/vitamines/minéraux | #65/#70, suivi #73 | Couverture par constituant, unités et valeurs particulières ; pas inclus dans les quatre macros |
| OpenGraph | #51 | Métadonnées et routage à traiter séparément de #72 |
| Édition avancée/administration manuelle | #74 et backlog produit | Ne pas inclure implicitement dans S3-T02 |

Ce tableau maintient la trace des exigences ; il ne crée pas de sous-issues distantes. Ne pas clore une issue large avant d'avoir fait accepter son découpage et créé/lié les reliquats nécessaires.

## Mise en place proposée dans GitHub

1. Copier titres et corps des cinq fichiers dans les issues existantes, après vérification qu'elles n'ont pas changé entre-temps ; conserver les assignees/labels/estimations existants.
2. Créer les tâches retenues, leur donner leur vrai numéro et les rattacher à #73 ; relier les dépendances.
3. Reporter priorité, points, heures et responsables convenus dans le Project existant ; ne pas assimiler #73 à une milestone.
4. Confirmer la capacité avant sélection ; les estimations du planning restent des propositions.
5. Mettre à jour #73 avec le corps fourni et les nouveaux numéros, puis lier les PR au fil du travail.
