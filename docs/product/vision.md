# Vision produit

## Problème

Planifier des repas demande de concilier plusieurs contraintes : besoins nutritionnels, nombre de personnes, allergies, régimes, préférences, équipement disponible, budget et organisation des courses. Les solutions manuelles nécessitent des calculs répétés et rendent difficile la traçabilité entre objectifs, recettes choisies et achats.

## Vision

**Pour** les personnes et foyers qui souhaitent organiser leurs repas,
**Gestion Recette** est une application desktop de planification alimentaire
**qui** sélectionne des recettes compatibles, calcule leurs apports, construit un planning et prépare les courses.
**Contrairement à** une simple collection de recettes,
**elle** relie les profils, les objectifs, les repas et les achats dans un parcours cohérent et explicable.

## Utilisateurs cibles

- personne seule souhaitant suivre ses apports ;
- foyer de plusieurs personnes avec préférences différentes ;
- utilisateur soumis à des restrictions alimentaires déclarées ;
- utilisateur disposant d'un budget ou d'un équipement limité.

## Proposition de valeur

L'utilisateur renseigne son contexte une fois, puis obtient :

- des recettes compatibles avec ses contraintes ;
- des quantités adaptées au nombre de portions ;
- des indicateurs nutritionnels compréhensibles ;
- un menu hebdomadaire modifiable ;
- une liste de courses consolidée ;
- une justification des recommandations et exclusions.

## Principes produit

### Sécurité avant préférence

Les allergies et incompatibilités déclarées sont traitées comme des contraintes strictes. Une préférence n'autorise jamais à contourner une restriction.

### Explicabilité

Une recommandation doit pouvoir indiquer pourquoi elle a été proposée : compatibilité, proximité avec les objectifs, budget ou variété.

### Transparence des données

Les données nutritionnelles et tarifaires possèdent une source et, lorsque pertinent, une date. Un prix est présenté comme une estimation.

### Calcul plutôt que duplication

Les valeurs dérivées, comme les macros d'une portion, sont calculées depuis les ingrédients et quantités de référence afin d'éviter des données contradictoires.

### Local-first

Le MVP conserve les données sur l'appareil. Cela réduit la complexité, les risques de confidentialité et la dépendance à un service distant.

## Indicateurs de réussite du MVP

- un utilisateur peut aller du profil à une liste de courses sans manipulation externe ;
- toutes les recettes proposées satisfont les contraintes strictes déclarées dans le jeu de données ;
- les quantités et macros évoluent correctement avec le nombre de portions ;
- un planning hebdomadaire peut être créé et modifié ;
- les règles métier critiques disposent de tests automatisés ;
- le processus de développement est traçable depuis le backlog jusqu'aux tests.

## Limite importante

L'application constitue une aide à la planification. Elle ne produit pas de diagnostic, ne remplace pas un professionnel de santé et ne peut pas garantir l'absence de contamination croisée ou l'exhaustivité des informations d'allergènes.

