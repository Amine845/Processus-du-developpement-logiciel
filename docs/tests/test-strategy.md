# Stratégie de tests

## Objectifs

Les tests doivent protéger en priorité :

- les restrictions et allergènes ;
- les calculs de portions et de nutrition ;
- les conversions d'unités ;
- l'agrégation de la liste de courses ;
- la persistance des profils et plannings ;
- la frontière sécurisée entre renderer et processus principal.

La couverture est un indicateur, pas une preuve suffisante de qualité.

## Niveaux

| Niveau | Portée | Outil envisagé | Fréquence |
|---|---|---|---|
| Unitaire | Domaine et fonctions pures | Vitest | Chaque PR |
| Intégration | SQLite, migrations, repositories | Vitest | Chaque PR |
| Composant | Composants React | React Testing Library | Chaque PR concernée |
| Contractuel | Contrats IPC et validation | Vitest | Chaque PR concernée |
| End-to-end | Parcours utilisateur Electron | Playwright | Chaque PR ou avant fusion selon durée |
| Exploratoire | Ergonomie et cas inattendus | Manuel guidé | Sprint Review et avant release |

## Répartition souhaitée

La majorité des tests doit être unitaire ou d'intégration. Les tests de bout en bout restent peu nombreux et ciblent les parcours critiques.

## Cas critiques initiaux

### Portions

- passage de deux à quatre portions ;
- portion égale à un ;
- rejet de zéro, valeur négative ou non entière ;
- arrondis documentés.

### Nutrition

- somme correcte de plusieurs ingrédients ;
- calcul par portion ;
- donnée nutritionnelle inconnue ;
- quantité exprimée dans une unité convertible ;
- refus d'une conversion incompatible.

### Restrictions

- allergène direct ;
- ingrédient sans information d'allergène ;
- régime incompatible ;
- préférence non traitée comme allergie ;
- équipement obligatoire absent.

### Courses

- regroupement d'ingrédients identiques ;
- conversion grammes/kilogrammes ;
- séparation des unités non compatibles ;
- mise à jour après remplacement d'un repas ;
- multiplication correcte par les portions.

### Persistance

- création d'une base vide ;
- application des migrations ;
- sauvegarde et relecture d'un profil ;
- transaction annulée en cas d'erreur ;
- données isolées entre tests.

### IPC

- canal autorisé ;
- paramètres valides ;
- rejet d'une entrée invalide ;
- erreur interne convertie en réponse contrôlée ;
- renderer sans accès direct à Node.js.

## Structure

```text
tests/
  unit/
  integration/
  component/
  e2e/
  fixtures/
```

Les tests peuvent aussi être colocalisés avec les modules si l'équipe le préfère. Le choix doit rester cohérent et être consigné.

## Nommage

Exemple :

```text
calculate-recipe-nutrition.test.ts
sqlite-recipe-repository.integration.test.ts
recipe-filter.component.test.tsx
weekly-planning.e2e.spec.ts
```

Chaque nom décrit le comportement attendu, pas les détails internes.

## Données de test

- jeux déterministes ;
- valeurs simples permettant un calcul manuel ;
- allergènes explicitement présents ou absents ;
- bases SQLite temporaires ;
- aucun appel réseau dans les tests unitaires ;
- aucune donnée personnelle réelle.

## Politique de défaut

Lorsqu'un bug est corrigé :

1. reproduire le défaut par un test lorsque raisonnable ;
2. vérifier que le test échoue avant la correction ;
3. corriger ;
4. vérifier que le test et la suite complète réussissent ;
5. documenter les limites si le défaut ne peut pas être automatisé.

## Critères de sortie d'une release

- zéro défaut critique ouvert ;
- parcours principal E2E réussi ;
- migrations testées sur une base vide ;
- installation vérifiée sur la plateforme cible ;
- rapports CI conservés ;
- défauts mineurs connus documentés dans la release.

