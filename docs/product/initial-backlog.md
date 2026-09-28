# Product Backlog initial

La source opérationnelle du backlog est GitHub Issues et GitHub Projects. Ce document fixe la structure initiale issue du premier rendez-vous avec le Product Owner.

Le Product Owner ordonne les éléments. Les développeurs estiment séparément :

- la **complexité** en story points `1, 2, 3, 5, 8` ;
- le **temps estimé** en heures ;
- le **temps réel** après réalisation.

## Priorités

- **Must** : indispensable au MVP ;
- **Should** : important mais contournable ;
- **Could** : réalisé si la capacité le permet ;
- **Won't now** : hors MVP ou à confirmer.

## Epic 0 - Fondations Web et processus

| ID | Élément | Priorité | Critère synthétique |
|---|---|---|---|
| E0-01 | Consigner le premier rendez-vous PO | Must | Décisions, demandes et questions sont versionnées |
| E0-02 | Valider Web responsive/PWA avec le PO | Must | La plateforme cible est non ambiguë |
| E0-03 | Retirer progressivement Electron | Must | Le développement et le build Web fonctionnent sans Electron |
| E0-04 | Choisir le framework API et la BDD | Must | Deux ADR validés documentent les choix |
| E0-05 | Configurer la CI | Must | Lint, typecheck, tests et build Web passent sur une PR |
| E0-06 | Configurer les migrations | Must | Une base vide atteint le schéma courant |
| E0-07 | Créer un premier écran mobile-first | Must | Aucun défilement horizontal à la largeur cible |

## Epic 1 - Authentification

### US-01 - Se connecter

**En tant qu'utilisateur, je veux me connecter afin d'accéder aux fonctionnalités protégées.**

Critères d'acceptation :

- des identifiants valides ouvrent une session ;
- des identifiants invalides produisent un message contrôlé ;
- aucun mot de passe brut n'est stocké ou journalisé ;
- la session survit à un rechargement selon la politique décidée ;
- le parcours fonctionne sur mobile.

### US-02 - Se déconnecter

**En tant qu'utilisateur connecté, je veux fermer ma session afin de protéger mon compte.**

Critères d'acceptation :

- la session est invalidée ;
- les pages protégées ne restent pas accessibles ;
- aucune donnée privée ne reste affichée après déconnexion.

## Epic 2 - Gestion des ingrédients et CIQUAL

### US-03 - Gérer un ingrédient

**En tant qu'utilisateur autorisé, je veux créer et modifier un ingrédient afin de le réutiliser dans plusieurs recettes.**

Critères d'acceptation :

- le nom canonique est obligatoire ;
- les doublons évidents sont signalés ;
- les caractéristiques, allergènes et provenance nutritionnelle sont distincts ;
- l'ingrédient peut être retrouvé et réutilisé.

### US-04 - Associer un aliment CIQUAL

**En tant qu'utilisateur autorisé, je veux associer un ingrédient à une entrée CIQUAL afin d'obtenir ses valeurs nutritionnelles.**

Critères d'acceptation :

- le code CIQUAL et la version de source sont conservés ;
- une donnée manquante reste inconnue ;
- la correspondance peut être corrigée ;
- l'association ne génère pas automatiquement des allergènes.

## Epic 3 - Gestion des recettes

### US-05 - Créer une recette

**En tant qu'utilisateur connecté, je veux créer une recette afin de l'ajouter à la bibliothèque.**

Critères d'acceptation :

- titre et nombre de personnes sont obligatoires ;
- au moins un ingrédient avec quantité et unité peut être ajouté ;
- les étapes peuvent être ordonnées ;
- les erreurs sont affichées près des champs concernés ;
- la recette sauvegardée apparaît dans la bibliothèque.

### US-06 - Modifier une recette

**En tant qu'utilisateur autorisé, je veux modifier une recette afin de corriger ou compléter son contenu.**

Critères d'acceptation :

- les valeurs existantes sont préremplies ;
- les règles de validation sont identiques à la création ;
- un utilisateur non autorisé reçoit un refus ;
- les macros sont recalculées après modification.

### US-07 - Archiver une recette

**En tant qu'utilisateur autorisé, je veux archiver une recette afin de la retirer de la bibliothèque courante sans casser l'historique.**

Critères d'acceptation :

- une confirmation est demandée ;
- la recette disparaît de la vue active ;
- les données référencées ne sont pas corrompues ;
- la politique de restauration est documentée.

### US-08 - Adapter les portions

**En tant qu'utilisateur, je veux changer le nombre de personnes afin d'obtenir les quantités et macros correspondantes.**

Critères d'acceptation :

- la valeur est un entier strictement positif ;
- quantités et macros sont recalculées ;
- la recette de référence n'est pas modifiée ;
- les arrondis sont cohérents et testés.

## Epic 4 - Tags, bibliothèque et recherche

### US-09 - Associer des tags

**En tant que créateur, je veux associer des tags à une recette afin de la classer.**

Critères d'acceptation :

- plusieurs tags peuvent être associés ;
- les doublons de casse ou d'espacement sont évités ;
- un tag subjectif n'est pas traité comme allergène.

### US-10 - Rechercher par nom ou tag

**En tant qu'utilisateur, je veux rechercher par nom ou tag afin de retrouver rapidement une recette.**

Critères d'acceptation :

- la recherche est insensible à la casse ;
- nom et tags sont pris en compte ;
- un état vide est affiché ;
- l'interface reste utilisable sur mobile.

### US-11 - Filtrer par allergène

**En tant qu'utilisateur, je veux exclure les recettes contenant certains allergènes afin de limiter les résultats incompatibles.**

Critères d'acceptation :

- plusieurs allergènes peuvent être sélectionnés ;
- une recette explicitement incompatible est exclue ;
- une information inconnue est signalée ;
- les limites de l'application sont visibles.

## Epic 5 - Nutrition

### US-12 - Afficher les macros

**En tant qu'utilisateur, je veux consulter les macros d'une recette afin de connaître sa composition estimée.**

Critères d'acceptation :

- calories, protéines, glucides et lipides sont affichés ;
- valeurs totales et par portion sont distinguées ;
- la source CIQUAL est attribuée ;
- les données manquantes sont visibles.

## Epic 6 - Liste de courses

### US-13 - Générer une liste

**En tant qu'utilisateur, je veux générer une liste depuis une ou plusieurs recettes afin de préparer mes achats.**

Critères d'acceptation :

- les quantités tiennent compte des portions ;
- les ingrédients identiques sont regroupés si leurs unités sont compatibles ;
- les unités incompatibles restent séparées ;
- la liste peut être consultée sur mobile.

### US-14 - Cocher les achats

**En tant qu'utilisateur, je veux cocher les ingrédients achetés afin de suivre ma progression.**

Critères d'acceptation :

- chaque article peut être coché et décoché ;
- l'état persiste ;
- `X/Y` correspond au nombre d'articles cochés et au total ;
- une liste vide affiche `0/0` sans erreur.

## Epic 7 - Extensions à confirmer

| Élément | Priorité initiale |
|---|---|
| Planning hebdomadaire | Won't now |
| Objectifs nutritionnels personnalisés | Won't now |
| Recommandations automatiques | Won't now |
| Budget, pays et magasins | Won't now |
| Équipements de cuisine | Won't now |
| Suivi du consommé | Won't now |
| Temps de préparation comme filtre majeur | Won't now |

## Règles d'utilisation

- chaque story devient une issue ;
- les critères sont complétés avant le Sprint Planning ;
- la complexité, le temps estimé et le temps réel restent trois champs distincts ;
- les travaux imprévus sont ajoutés au tableau ;
- aucun élément n'est terminé sans respecter la Definition of Done ;
- le backlog est actualisé et présenté à chaque séance avec le Product Owner.

