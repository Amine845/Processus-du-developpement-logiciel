# Sprint 02 — Découpage proposé du backlog

## Règle de lecture

Ce document prépare le planning et les textes d'issues ; il n'atteste ni leur sélection dans le Project, ni leur état Ready, ni une validation du PO. Les titres et corps #28/#29/#30/#33/#44 ont été relus sur GitHub le 02/11/2026, et leur sélection est proposée par l'utilisateur pour ce sprint. Les fichiers ci-dessous ne sont pas encore publiés sur GitHub.

Les issues actuelles décrivent un périmètre plus large que le socle proposé. Le découpage doit conserver les exigences initiales : soit l'issue devient un suivi avec sous-issues de sprint et critères différés, soit l'équipe accepte une réécriture du périmètre après transfert explicite des reliquats. Une livraison partielle n'est pas artificiellement déclarée complète.

## Titres et descriptions proposés

| Référence       | Titre proposé                                                                   | Priorité de planning | Corps prêt à discuter                                                   |
| --------------- | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| #30             | [FRONT] Créer une recette et l'enregistrer via l'API                            | Must, socle          | [issue-030.md](sprint-02-issues/issue-030.md)                           |
| #29             | [FRONT, API] Consulter et rechercher les recettes de la bibliothèque            | Must, socle          | [issue-029.md](sprint-02-issues/issue-029.md)                           |
| #28             | [FRONT] Consulter une recette, ajuster les portions et confirmer sa suppression | Must, socle          | [issue-028.md](sprint-02-issues/issue-028.md)                           |
| S2-T01, à créer | [BACK, API] Consolider l'API et créer une recette de façon transactionnelle     | Must, socle          | [task-api-recipes.md](sprint-02-issues/task-api-recipes.md)             |
| S2-T02, à créer | [QUALITÉ] Valider le parcours recette et préparer la review du Sprint 2         | Must, socle          | [task-integration-demo.md](sprint-02-issues/task-integration-demo.md)   |
| #44             | [DB] Importer un sous-ensemble traçable d'aliments CIQUAL 2025                  | Should, extension    | [issue-044.md](sprint-02-issues/issue-044.md)                           |
| #33             | [BACK, API, FRONT] Rechercher et sélectionner un ingrédient référencé           | Should, extension    | [issue-033.md](sprint-02-issues/issue-033.md)                           |
| S2-E01, à créer | [FRONT, MÉTIER] Afficher les macros estimées par portion et leur couverture     | Could, extension     | [task-nutrition-display.md](sprint-02-issues/task-nutrition-display.md) |

S2-T01, S2-T02 et S2-E01 sont des références locales de planning, pas des numéros GitHub attribués. Ne pas recréer un ticket si une issue technique équivalente existe déjà dans votre tableau.

## Écarts à corriger avant Ready

| Issue | Écart du texte actuel                                                                                    | Proposition                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| #28   | Consultation, portions, matériel, macros, modale exhaustive et suppression dans une seule phrase étendue | Engager lecture/portions/suppression ; transférer matériel et nutrition avancée dans des sous-issues de suite             |
| #29   | Recherche nom/tag/matériel et filtres dits allergènes, sans données correspondantes dans le schéma       | Commencer par titre et états UI ; distinguer allergies, lactose et régime végétarien ; pas de certification inventée      |
| #30   | Formulaire et macros, mais aucune étape de préparation dans le corps ; pas de POST dans l'archive        | Ajouter les étapes et une sauvegarde réelle ; créer S2-T01 ; lier l'autocomplétion comme extension                        |
| #33   | Titre autocomplétion/nutrition, corps encore consacré aux courses et à une checklist                     | Aligner le corps sur la recherche d'ingrédients ; conserver le besoin de courses dans l'historique ou un autre ticket lié |
| #44   | Corps vide ; titre qui semble engager toute la base CIQUAL                                               | Définir source, identité, sous-ensemble, import, disponibilité, migration, provenance et tests                            |

## Propositions de transfert à conserver explicitement

- #30 : photo uploadée, équipement et édition après création, à chiffrer séparément ; liaison à #33 pour l'autocomplétion.
- #29 : tags, matériel et restrictions alimentaires ; données et règles nécessaires à définir avant Ready.
- #28 : matériel, modale vitamines/minéraux ; liaison à S2-E01 pour les seules macros limitées de l'extension.
- #33 : agrégation de courses et progression de checklist, sans lien fonctionnel avec la recherche d'aliments de ce sprint.
- #44 : import complet et maintenance des versions si seul le sous-ensemble est livré.

Ces propositions ne créent aucun ticket distant. Les responsabilités, estimations initiales et temps réels existants doivent être conservés ; les chiffres du planning Sprint 2 restent des propositions.

## Ordre pour rendre le sprint prêt

1. Accepter l'objectif avec le PO et renseigner dates/disponibilités.
2. Vérifier les acquis de la branche choisie, le traitement de la seed et le serveur réellement utilisé.
3. Discuter le découpage des cinq issues et reporter explicitement les critères non engagés.
4. Créer ou identifier S2-T01 et S2-T02, puis relier les dépendances sans double comptage.
5. Estimer collectivement : proposition de base 21 points / 34 h ; extension séparée 13 points / 20 h.
6. Mettre en Ready les seuls éléments satisfaisant la DoR. Ne passer #44/#33 en cours que si capacité et contrats le permettent.
7. Affecter chaque prochain travail et reviewer ; garder une seule tâche principale en cours par membre.

## Application facultative des textes avec GitHub CLI

À exécuter depuis la racine du repository, **uniquement après adoption du découpage et conservation des critères différés**. Ces commandes remplacent titres et descriptions ; elles ne créent pas les sous-issues de report et ne changent pas les champs du Project. Aucune n'a été exécutée pendant la préparation de ce document.

Socle :

```bat
gh issue edit 30 --repo Amine845/Processus-du-developpement-logiciel --title "[FRONT] Créer une recette et l'enregistrer via l'API" --body-file docs/sprints/sprint-02-issues/issue-030.md
gh issue edit 29 --repo Amine845/Processus-du-developpement-logiciel --title "[FRONT, API] Consulter et rechercher les recettes de la bibliothèque" --body-file docs/sprints/sprint-02-issues/issue-029.md
gh issue edit 28 --repo Amine845/Processus-du-developpement-logiciel --title "[FRONT] Consulter une recette, ajuster les portions et confirmer sa suppression" --body-file docs/sprints/sprint-02-issues/issue-028.md
```

Extension, si retenue et redécoupée :

```bat
gh issue edit 44 --repo Amine845/Processus-du-developpement-logiciel --title "[DB] Importer un sous-ensemble traçable d'aliments CIQUAL 2025" --body-file docs/sprints/sprint-02-issues/issue-044.md
gh issue edit 33 --repo Amine845/Processus-du-developpement-logiciel --title "[BACK, API, FRONT] Rechercher et sélectionner un ingrédient référencé" --body-file docs/sprints/sprint-02-issues/issue-033.md
```

Les corps des nouvelles tâches sont prêts à copier, mais aucun numéro, parent, milestone ou identifiant de Project n'est inventé. L'API de création doit être ajoutée aux dépendances du formulaire avant d'engager une démo d'enregistrement.
