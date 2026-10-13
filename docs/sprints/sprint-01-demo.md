# Sprint 01 — Scénario de review proposé

## Message d'ouverture

L'objectif de ce sprint est de pouvoir parcourir une bibliothèque et consulter une recette pour savoir pour combien de
personnes elle est prévue, quels ingrédients préparer et dans quel ordre réaliser les étapes.

## Préparation avant la séance

- Vérifier que la branche de référence contient les travaux relus et intégrés ; noter le commit démontré.
- Préparer une base locale dédiée avec au moins trois recettes synthétiques et un ingrédient partagé.
- Exécuter la migration et la seed selon les commandes effectivement implémentées et documentées par l'équipe.
- Vérifier une deuxième exécution de la seed sans doublons et sans perte de données étrangères.
- Démarrer l'application et son API, vérifier que les données affichées viennent de cette base.
- Préparer la vue mobile 390 × 844 et la vue ordinateur 1440 × 900.
- Préparer un identifiant absent et un environnement isolé vide ; ne pas vider une base personnelle pour la démo.

Ce document définit le scénario attendu. Il ne prétend pas que la seed, les écrans ou leurs commandes existent déjà, et
n'ajoute aucun code.

## Déroulé (cinq à sept minutes)

| Étape | Action présentée                                                    | Ce que le PO peut vérifier                                        |
| ----- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1     | Ouvrir la bibliothèque sur mobile                                   | Plusieurs recettes lisibles et choix compréhensible               |
| 2     | Choisir une recette                                                 | La fiche correspond à la sélection                                |
| 3     | Lire portions, ingrédients et préparation                           | Informations suffisantes pour préparer le plat, ordre clair       |
| 4     | Revenir à la bibliothèque et choisir une autre recette              | Parcours répété sans blocage ; description facultative bien gérée |
| 5     | Montrer la présentation sur ordinateur                              | Même parcours avec une mise en page adaptée                       |
| 6     | Ouvrir un identifiant absent, puis revenir                          | Message compréhensible et moyen de reprendre le parcours          |
| 7     | Montrer brièvement les preuves de lecture réelle et de vérification | Source des données, reproductibilité et limites transparentes     |

Les états vide, chargement et erreur sont vérifiés avant séance ; les montrer pendant la review si le temps le permet ou
si le PO le demande. Ne pas consacrer l'essentiel de la séance à Prisma ou à la structure des composants.

## Questions au PO

- Trouvez-vous facilement les informations pour préparer la recette ?
- Le nombre de personnes et les quantités sont-ils présentés clairement ?
- Pour le prochain incrément, quelle utilisation souhaitez-vous prioriser ?

## Trace de review à compléter après la séance

- Date et participants : à renseigner.
- Commit effectivement présenté : à renseigner.
- Critères vérifiés et résultats : à renseigner.
- Limites et travaux non terminés : à renseigner.
- Retours, acceptation ou demandes de changement du PO : à renseigner.
- Conséquences sur le sprint suivant : à renseigner.

Un prototype alimenté seulement par des fixtures front est présenté comme tel. Il peut servir à recueillir un retour
visuel, mais ne valide pas le parcours sur données persistées décrit dans l'objectif du sprint.
