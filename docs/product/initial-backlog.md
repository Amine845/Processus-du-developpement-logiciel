# Product Backlog initial

Ce document amorce le backlog. La source de vérité opérationnelle doit ensuite être GitHub Issues et GitHub Projects. Le Product Owner, c'est-à-dire le professeur, reste responsable de l'ordre du Product Backlog. Les développeurs sont responsables des estimations et de la décomposition technique.

## Convention de priorité

- **Must** : indispensable au parcours MVP ;
- **Should** : importante, mais contournable ;
- **Could** : utile si la capacité le permet ;
- **Won't now** : explicitement reportée.

## Epic 0 - Fondations

| ID | Élément | Priorité | Critère synthétique |
|---|---|---|---|
| E0-01 | Remplacer le README du template | Must | Le projet, les commandes et le processus sont expliqués |
| E0-02 | Sécuriser Electron | Must | `nodeIntegration` désactivé et `contextIsolation` activé |
| E0-03 | Installer le framework de tests | Must | Un test d'exemple passe localement et en CI |
| E0-04 | Configurer la CI | Must | Lint, typecheck, tests et build s'exécutent sur une PR |
| E0-05 | Définir la structure modulaire | Must | Les couches sont présentes et documentées |
| E0-06 | Initialiser SQLite et les migrations | Must | La base peut être créée depuis zéro |

## Epic 1 - Catalogue de recettes

### US-01 - Consulter les recettes

**En tant qu'utilisateur, je veux consulter les recettes disponibles afin de choisir un repas.**

Critères d'acceptation :

- la liste affiche au minimum le nom, la durée, les portions et les macros principales ;
- un état vide compréhensible est affiché sans données ;
- sélectionner une recette ouvre sa fiche complète.

### US-02 - Adapter les portions

**En tant qu'utilisateur, je veux choisir le nombre de portions afin d'obtenir les quantités correspondantes.**

Critères d'acceptation :

- le nombre de portions est strictement positif ;
- les quantités et macros sont recalculées ;
- la recette originale n'est pas modifiée définitivement.

### US-03 - Filtrer selon les contraintes

**En tant qu'utilisateur, je veux exclure les recettes incompatibles afin de ne voir que les options pertinentes.**

Critères d'acceptation :

- les allergènes déclarés sont traités comme exclusions strictes ;
- le régime et l'équipement sont pris en compte ;
- la raison d'une exclusion peut être expliquée.

## Epic 2 - Nutrition

### US-04 - Afficher les macros

**En tant qu'utilisateur, je veux voir les macros d'une recette afin d'évaluer sa compatibilité avec mes objectifs.**

Critères d'acceptation :

- calories, protéines, glucides et lipides sont affichés ;
- les valeurs totales et par portion sont distinguées ;
- une donnée inconnue n'est pas remplacée par zéro sans indication.

### US-05 - Agréger une journée

**En tant qu'utilisateur, je veux connaître l'apport planifié d'une journée afin de le comparer à mon objectif.**

Critères d'acceptation :

- les recettes et portions de la journée sont additionnées ;
- les objectifs et écarts sont visibles ;
- un repas supprimé met immédiatement à jour le total.

## Epic 3 - Profil

### US-06 - Configurer le foyer

**En tant qu'utilisateur, je veux renseigner mon foyer afin d'adapter les recommandations.**

Critères d'acceptation :

- le nombre de personnes est validé ;
- pays, devise, budget et équipements sont modifiables ;
- les données persistent après redémarrage.

### US-07 - Déclarer des restrictions

**En tant qu'utilisateur, je veux déclarer mes restrictions alimentaires afin d'éviter les recettes incompatibles.**

Critères d'acceptation :

- plusieurs restrictions peuvent être sélectionnées ;
- une modification affecte les résultats de recherche ;
- un avertissement précise les limites des données.

## Epic 4 - Planning

### US-08 - Construire une semaine

**En tant qu'utilisateur, je veux affecter des recettes aux repas de la semaine afin d'organiser mes menus.**

Critères d'acceptation :

- une recette peut être ajoutée, déplacée, remplacée et retirée ;
- les portions sont conservées par repas ;
- le planning persiste après redémarrage.

## Epic 5 - Courses

### US-09 - Générer la liste de courses

**En tant qu'utilisateur, je veux générer les courses du planning afin d'acheter les quantités nécessaires.**

Critères d'acceptation :

- les ingrédients identiques sont regroupés ;
- seules les unités compatibles sont additionnées ;
- la quantité dépend des portions planifiées ;
- un article peut être coché sans être supprimé.

## Epic 6 - Extensions

| ID | Élément | Priorité initiale |
|---|---|---|
| E6-01 | Recommandations pondérées | Could |
| E6-02 | Suivi du consommé | Could |
| E6-03 | Gestion du placard | Could |
| E6-04 | Prix réels de magasins | Won't now |
| E6-05 | Synchronisation cloud | Won't now |

## Règles d'utilisation du backlog

- Chaque user story devient une issue.
- Les critères détaillés sont complétés avant le Sprint Planning.
- Les développeurs décomposent une story en tâches si nécessaire.
- Les estimations sont collectives.
- Une tâche imprévue est enregistrée, même si elle est traitée immédiatement.
- Aucun élément n'est marqué terminé sans satisfaire la Definition of Done.

