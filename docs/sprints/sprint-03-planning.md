# Sprint 03 — Finaliser le parcours ingrédients et nutrition

## Informations

- **Préparation :** 04/11/2026.
- **Période / durée :** à renseigner par l'équipe selon les séances ; aucune date de fin présumée.
- **Product Owner :** professeur.
- **Scrum Master indiqué précédemment :** Titiplex ; rôle à confirmer au planning.
- **Développeurs :** Titiplex, Qwantike, Ahrizmo, Amine845.
- **Suivi :** [#73](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/73).
- **Statut :** proposition de préparation, pas engagement de capacité ni validation du PO.
- **Publication :** tentative de mise à jour des cinq issues refusée par GitHub (403). Les descriptions du dossier sprint-03-issues sont prêtes à publier ; aucun ticket nouveau créé.

## Objectif fonctionnel

> Un utilisateur trouve un aliment dans CIQUAL sans le confondre avec un plat composé, le sélectionne dans une recette avec ses quantités, enregistre une vraie préparation, puis retrouve la recette et ses macros estimées, avec une indication claire des données manquantes.

Parcours : bibliothèque → création → recherche d'aliment → choix CIQUAL ou manuel → quantités et étapes → enregistrement → rechargement → fiche → portions et macros → retour → recherche par titre, ingrédients et tags.

## Sources et état de départ

Lecture du dépôt le 04/11/2026, sans exécution du produit ni des tests. Aucun nouveau fichier joint n'était accessible dans ce tour : la préparation s'appuie sur la branche de développement **Front**, commit **ca3fbe0604ddba042765c687052724ee1c7f389e**, également tête de Page-Recette-détaillé à la lecture. Les documents Sprint 2 sont lus sur **main**, commit **bbf76183ab0b0b907712c966f539ac0648cce660**, car Front ne contient pas son planning ni sa démo. Revalider les écarts si l'équipe utilise une archive ou un commit plus récent.

| Élément | Constat dans Front | Travail restant |
| --- | --- | --- |
| CIQUAL | Tables, import complet/synchronisation, API et composants de recherche présents | Les réutiliser ; ne pas refaire #33/#44/#69 |
| Classification | Pas de catégorie/groupe typé dans CiqualFood ; extracteur ne conserve pas les groupes | S3-T01 : extraction, mapping, migration, filtre aliments/plats |
| Création | Datalist de six noms ; macros et matériel seulement locaux ; aucune transmission du code | S3-T02 : intégrer le composant existant et conserver le code de bout en bout |
| Quantités et préparation | Quantité vide remplacée par 1 ; description utilisée comme seule étape | Validation stricte et vrai éditeur d'étapes dans S3-T02 |
| Identité Ingredient | canonicalName unique ; ciqualCode optionnel au schéma, absent du DTO de recette | Définir collisions/partage sans réassociation rétroactive |
| Bibliothèque | RecipesPage dans App.tsx est routée ; pas de barre de recherche ; RecipeListPage incomplet et inutilisé | #29 : un seul écran cohérent ; #27 : recherche combinée |
| Fiche | Ingrédients et suppression présents ; pas d'étapes affichées ni portions interactives ; panne GET bloquée en chargement | #65 : lecture complète, erreurs, portions, macros |
| Tags, équipement, photo | Absents du modèle et des DTO | #71 pour tags ; matériel et photo séparés |
| Nutrition | Valeurs CIQUAL consultables par aliment ; aucune chaîne recette/calcul complète observée | S3-T03 pour calcul ; #65 pour restitution |

Une issue fermée atteste son état GitHub, pas l'absence de régression dans la branche. Ce sprint reprend les lacunes de parcours observées sans déclarer les sprints précédents invalidés ou validés.

## Backlog et charge proposée

Points sur l'échelle 1, 2, 3, 5, 8 ; heures-personnes incluant développement, tests et documentation propres. Ces valeurs ne remplacent pas d'estimations existantes du Project. S3-Txx sont des références locales, pas des numéros GitHub.

| Référence | Résultat | Priorité | Points | h-personnes | Dépendances |
| --- | --- | --- | ---: | ---: | --- |
| S3-T01 | Aliments/plats séparés sans perte des liens | Must | 5 | 8 | Pipeline CIQUAL |
| S3-T02 | Choix CIQUAL persisté, manuel, quantités et étapes | Must | 5 | 8 | Contrat classification ; #74 pour cohérence manuel |
| S3-T03 | Calcul des macros et couverture | Must | 5 | 8 | Contrat de S3-T02 |
| #65 | Fiche complète, portions et macros expliquées | Must | 5 | 8 | S3-T02/S3-T03 |
| #29 | Bibliothèque cohérente et recherche titre | Must | 3 | 4 | API recettes existante |
| #71 | Tags d'ingrédients persistés et exposés | Haute | 3 | 5 | Identité S3-T02 |
| #27 | Filtres combinés ingrédients/tags/titre | Haute | 5 | 7 | #29/#71 |
| S3-T04 | Intégration transversale, review et preuves | Must | 3 | 5 | Parcours retenu |
| **Total proposé** | **Parcours et recherche étendue** | | **34** | **53** | |
| #72, avec #51 | Photo facultative persistante | Extension | 5 | 8 | Création, bibliothèque, fiche |
| Matériel, à découper | Persister et restituer le matériel requis | Extension | 3 | 5 | Modèle/DTO/création/fiche |
| **Total avec extensions** | | | **42** | **66** | |

Le noyau du parcours (S3-T01/T02/T03/T04, #65, #29) vaut **26 points / 41 h-personnes**. Si la capacité est insuffisante, différer d'abord photo et matériel, puis #71/#27 ensemble après accord sur le périmètre ; la recherche par titre reste. Les cinq issues demandées sont préparées, même si toutes ne peuvent pas être engagées en même temps.

## Capacité et répartition proposée

| Membre | Travail principal proposé | Revue croisée | Disponibilité réelle |
| --- | --- | --- | --- |
| Titiplex | S3-T01 et S3-T03, 16 h | Contrats avec Qwantike | À renseigner |
| Qwantike | S3-T02 et #71, 13 h | Données/import avec Titiplex | À renseigner |
| Amine845 | #29 et #27, 11 h | Parcours avec Ahrizmo | À renseigner |
| Ahrizmo | #65, 8 h | Recherche/création avec Amine845 | À renseigner |
| Équipe | S3-T04, 5 h réparties | Review commune | À répartir |

Les revues ne créent pas de tâches de développement comptées deux fois. Adapter le partage pour équilibrer la charge et les compétences ; personne n'est affecté sur GitHub par ce document. 53 h représentent 13,25 h par membre en moyenne ; proposer une réserve collective de 20 %, soit environ **64 h de capacité disponible** avant engagement du périmètre complet. Cette réserve n'est pas un temps consommé ni une estimation en points.

Référents qualité, architecture et documentation : à désigner au planning, avec rotation selon les sprints précédents.

## Plan technique et contrats

1. Écrire d'abord les DTO cibles et les fixtures. Adapter les couches domaine/repository/API/client ensemble ; ne pas exposer directement Prisma.
2. Classification additive depuis les groupes CIQUAL et exceptions par code. Conserver les aliments retirés pour lecture historique, distinguer catégorie applicative et données officielles.
3. Réutiliser IngredientAutocomplete ; mode manuel explicite et code invalidé quand le texte change. Revoir l'unicité canonicalName avant de lier des aliments portant le même nom.
4. Calcul nutritionnel unique : masses g/kg ; masse comestible explicite pour volume/pièces ; couverture par macro. Politique de recalcul sur la publication locale courante, annoncée à l'utilisateur.
5. Une seule bibliothèque : texte insensible casse/accents ; ET entre groupes de critères, ET entre ingrédients, OU entre tags. Tags = union des tags des ingrédients, clairement libellés.
6. Affichage des étapes, gestion GET absente/panne et calcul des portions à partir des références dans #65. La photo n'est pas sur le chemin critique.

Une étape absente ne devient pas la description ; une quantité vide ne devient pas 1. Le mode manuel ne doit pas bloquer la création, mais ses macros restent inconnues. Le CRUD d'ingrédients utilisateur de #74 n'est pas repris intégralement : seul le mode manuel nécessaire est inclus dans S3-T02.

## Jalons d'intégration

- **Début :** dates, capacité, périmètre, contrats, taxonomie et choix de branche ; vérifier les commandes existantes et l'état de base. Pas de « Ready » sans ces éléments.
- **Premier jalon :** œuf sélectionné → code transmis → POST → GET → même code après rechargement. Vérifier aussi le manuel et l'absence de mutation d'un ingrédient partagé.
- **Avant la moitié du travail consommé :** recherche aliments/plats et calcul chiffré de référence présents ; UI sur les mêmes DTO.
- **Deuxième jalon :** création complète → fiche/étapes → portions → macros/couverture ; #71/#27 intégrés progressivement.
- **Fin :** validation transversale, revue de PR, CI et démonstration sur une base dédiée. Prendre photo/matériel seulement si le reste tient dans la capacité restante.

Limiter à une tâche principale en cours par membre ; faire avancer les dépendances et les revues avant d'ouvrir une extension.

## Validation et données

Voir [scénario de review](sprint-03-demo.md) et [contrat nutritionnel](sprint-03-issues/task-recipe-nutrition.md).

Commandes déjà présentes dans package.json : npm run lint ; npm run test ; npm run build ; npm run build:server ; npm run db:validate ; npm run test:db ; npm run test:repository ; npm run test:seed ; npm run test:ciqual ; npm run test:ciqual:sync ; npm run test:ciqual:api ; npm run format:check. Les exécuter dans l'environnement préparé et conserver les résultats ; elles **n'ont pas été exécutées pour cette préparation documentaire**. Ajouter les tests de nouveaux services et les intégrer à la CI lors de leur réalisation.

Tests isolés sans base utilisateur ; fixtures nutritionnelles artificielles pour les chiffres attendus, échantillons officiels vérifiés pour la classification. Conserver les tests d'import/synchronisation. Vérifier 390 × 844, 1440 × 900, clavier, toucher, focus, états vides et erreurs. Une nouvelle recette réelle et une relecture après redémarrage sont nécessaires, pas seulement des mocks.

## Risques et arbitrages

| Risque | Probabilité | Impact | Réponse |
| --- | --- | --- | --- |
| Front et main divergents | Haute | Mauvaise base de livraison | Fixer commit source et branche d'intégration |
| Mauvaise séparation plats/aliments | Moyenne | Recherche toujours confuse | Groupes officiels, mapping revu, exceptions et non classés |
| Collision par nom d'ingrédient | Haute | Anciennes recettes réassociées | Identité stable et tests de partage/rollback |
| Pièces/ml traités comme grammes | Haute | Macros fausses | Masse explicite ou résultat partiel |
| Charge de 53 h sans capacité établie | Haute | Parcours inachevé | Réduire extensions puis tags/filtres, garder intégration |
| Fonctions de formulaire non enregistrées | Haute | Interface trompeuse | Retirer/clarifier les champs ou persister de bout en bout |
| Photo commune à #51/#72 | Moyenne | Deux implémentations/charge double | Un seul chantier partagé et reliquat OpenGraph explicite |

## Reliquats et limites

[Backlog détaillé](sprint-03-backlog.md) conserve les besoins différés : allergies et régimes, tags culinaires, matériel, micronutriments, OpenGraph. Aucun filtre de sécurité alimentaire ne se déduit de CIQUAL ou d'un tag descriptif. Pas de modèle cuisson/rendement, ni de nutrition par 100 g de plat fini sans masse finale. Les comptes, l'authentification, le cloud et les courses restent dans leurs issues existantes ; la review vise la démo locale.

## Definition of Done et validation

La [DoD générale](../organisation/definition-of-done.md) s'applique ; lire le document existant dans le dépôt.

- [ ] Périmètre et critères sélectionnés compris, dates et disponibilité renseignées.
- [ ] Objectif et priorités discutés avec le PO ; estimations revues par les quatre membres.
- [ ] Migrations/imports préservant les données existantes ; contrats et documentation alignés.
- [ ] Parcours réellement persisté, erreurs et cas nutritionnels prouvés.
- [ ] Tests pertinents, types, builds, lint, formatage et CI vérifiés.
- [ ] Revue croisée, PR liées, intégration sur main selon le workflow existant.
- [ ] Temps réels, écarts, preuves et retour PO consignés.
- [ ] Reliquats visibles ; aucune clôture globale fondée sur une livraison partielle.

Documents associés : [backlog](sprint-03-backlog.md), [démo](sprint-03-demo.md), [review à remplir](sprint-03-review.md), [rétrospective à remplir](sprint-03-retrospective.md).
