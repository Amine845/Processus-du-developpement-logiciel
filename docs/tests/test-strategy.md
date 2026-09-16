# Stratégie de tests

## Objectifs

Les tests protègent en priorité :

- authentification et autorisations ;
- création et modification des recettes ;
- gestion des ingrédients et tags ;
- import et provenance CIQUAL ;
- calculs de portions et macros ;
- filtre d'allergènes ;
- recherche par nom et tag ;
- agrégation et progression de la liste de courses ;
- ergonomie mobile-first des parcours critiques.

La couverture est un indicateur, pas une preuve suffisante de qualité.

## Niveaux

| Niveau | Portée | Outil envisagé | Fréquence |
|---|---|---|---|
| Unitaire | Domaine et fonctions pures | Vitest | Chaque PR |
| Intégration | BDD, migrations, repositories, CIQUAL | Vitest | Chaque PR |
| API | Routes, validation, auth et autorisation | Vitest + client HTTP | Chaque PR concernée |
| Composant | Composants React | React Testing Library | Chaque PR concernée |
| End-to-end | Parcours Web complet | Playwright | Chaque PR ou avant fusion selon durée |
| Responsive | Viewports mobile et desktop | Playwright | Parcours critiques |
| Exploratoire | Ergonomie et cas inattendus | Manuel guidé | Avant chaque démonstration |

## Cas critiques

### Authentification

- connexion valide ;
- mot de passe invalide ;
- message ne révélant pas l'existence du compte ;
- session expirée ou invalidée ;
- déconnexion ;
- route protégée sans session ;
- modification d'une recette non autorisée ;
- absence de mot de passe dans les réponses et logs.

### Recettes

- création minimale valide ;
- titre absent ;
- nombre de personnes invalide ;
- ajout et réordonnancement d'étapes ;
- modification autorisée et refus non autorisé ;
- archivage sans corruption des références.

### Portions et nutrition

- passage de deux à quatre portions ;
- rejet de zéro et valeur négative ;
- somme correcte des ingrédients ;
- calcul total et par portion ;
- unité convertible et unité incompatible ;
- donnée CIQUAL inconnue préservée ;
- arrondis documentés.

### Allergènes

- allergène connu ;
- plusieurs allergènes ;
- information inconnue ;
- tag `gourmand` non traité comme allergène ;
- absence CIQUAL non interprétée comme absence d'allergène.

### Recherche et tags

- recherche insensible à la casse ;
- correspondance par nom ;
- correspondance par tag ;
- espaces normalisés ;
- aucun résultat ;
- combinaison recherche et filtre.

### Courses

- regroupement d'ingrédients identiques ;
- conversion grammes/kilogrammes ;
- séparation d'unités incompatibles ;
- mise à jour selon les portions ;
- cocher et décocher ;
- progression `0/0`, `0/Y`, `X/Y` et `Y/Y` ;
- persistance de l'état.

### CIQUAL

- import déterministe d'un fixture ;
- code et version conservés ;
- ligne invalide signalée ;
- valeur absente non transformée en zéro ;
- transaction annulée en cas d'échec ;
- rapport d'import cohérent.

### Responsive

- connexion sur viewport mobile ;
- création d'une recette sans défilement horizontal ;
- champs et boutons utilisables au clavier ;
- bibliothèque lisible sur mobile ;
- checklist utilisable au tactile ;
- comportement desktop non régressé.

## Structure

```text
tests/
  unit/
  integration/
  api/
  component/
  e2e/
  fixtures/
```

## Données de test

- comptes fictifs ;
- bases temporaires ;
- petit fixture CIQUAL synthétique ou extrait autorisé ;
- valeurs simples vérifiables manuellement ;
- allergènes connus, absents et inconnus ;
- aucun appel réseau dans les tests unitaires ;
- aucune donnée personnelle réelle.

## Politique de défaut

1. reproduire le défaut par un test lorsque raisonnable ;
2. vérifier que le test échoue avant correction ;
3. corriger ;
4. exécuter la suite pertinente ;
5. documenter toute vérification manuelle indispensable.

## Critères de sortie d'une release

- zéro défaut critique ouvert ;
- parcours connexion -> recette -> recherche -> courses réussi ;
- viewport mobile validé ;
- migrations testées depuis une base vide ;
- autorisations testées ;
- import CIQUAL contrôlé ;
- rapports CI conservés ;
- limites connues documentées.

