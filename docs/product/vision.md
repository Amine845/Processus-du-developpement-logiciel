# Vision produit

## Problème

Construire et réutiliser une recette demande de gérer des ingrédients, des quantités, des portions, des caractéristiques nutritionnelles et des contraintes comme les allergènes. Lorsque ces informations sont dispersées, la recherche et la préparation des courses deviennent longues et incohérentes.

## Vision

**Pour** les personnes qui veulent organiser leurs recettes depuis un téléphone ou un navigateur,
**Gestion Recette** est une application Web mobile-first
**qui** centralise recettes, ingrédients, tags, allergènes, portions, macros et listes de courses.
**Contrairement à** une collection de recettes statique,
**elle** permet de créer, rechercher, adapter et exploiter les recettes dans un parcours cohérent.

## Proposition de valeur

L'utilisateur peut :

- se connecter à son espace ;
- créer et maintenir ses recettes ;
- gérer un référentiel cohérent d'ingrédients ;
- retrouver une recette par nom ou par tag ;
- filtrer selon des allergènes déclarés ;
- adapter les quantités au nombre de personnes ;
- consulter les macronutriments calculés ;
- transformer des recettes en checklist de courses ;
- suivre l'avancement des courses sous la forme `X/Y`.

## Principes produit

### Mobile-first

Les parcours sont d'abord conçus pour un écran étroit et une interaction tactile. L'affichage est ensuite enrichi pour tablette et ordinateur sans créer un second produit.

### Gestion explicite

Les recettes, ingrédients et tags sont des objets identifiables et modifiables. Une recette ne doit pas dupliquer silencieusement les informations nutritionnelles de ses ingrédients.

### Séparation nutrition et allergènes

CIQUAL fournit des données de composition nutritionnelle. Les allergènes sont gérés par un modèle distinct. Une valeur manquante n'est jamais interprétée comme une absence de risque.

### Calcul plutôt que duplication

Les macros d'une recette et la progression d'une checklist sont dérivées des données sources : ingrédients, quantités, portions et articles cochés.

### Traçabilité

Les besoins sont reliés au backlog, aux Pull Requests, aux tests et aux démonstrations. Les changements demandés par le Product Owner restent visibles dans les comptes rendus et ADR.

## Indicateurs de réussite du MVP

- un utilisateur peut se connecter et fermer sa session ;
- une recette peut être créée depuis un téléphone sans affichage cassé ;
- la recette indique ses ingrédients, étapes, tags et nombre de personnes ;
- la recherche par nom et par tag renvoie les résultats attendus ;
- le filtre d'allergènes exclut les recettes explicitement incompatibles ;
- les quantités et macros évoluent correctement avec les portions ;
- une liste de courses est générée et sa progression `X/Y` est correcte ;
- chaque séance présente un backlog à jour avec complexité, temps estimé et temps réel ;
- les règles critiques sont protégées par des tests automatisés.

## Limite importante

L'application ne produit pas de diagnostic et ne garantit pas l'absence de contamination croisée. Les informations affichées dépendent des sources et des données renseignées.

