# Sprint 2 — référentiel nutritionnel CIQUAL : sous-ensemble

Ce document était absent de l'archive de base. Il précise la dépendance demandée
par l'issue sans modifier les engagements des autres sprints.

## Ready : éléments concrets fournis

- Source officielle CIQUAL 2025 V1.0 identifiée par DOI et fichier XLSX inspecté.
- Format de travail choisi : `ciqual-subset-json-v1`, dérivé du XLSX ; échantillon
  de 30 aliments livré dans `data/ciqual/subset-2025.json`.
- Sélection par codes dans `selection.json`, manifeste, extraction reproductible,
  conventions nutritionnelles et licence documentés dans `docs/data/ciqual.md`.
- Politique de rejet : atomique, sans écrasement d'un code existant différent.

## Livraison technique

Migration additive, tables CIQUAL distinctes, liaison optionnelle par code stable,
import explicite et relançable, double empreinte, audit et contrôles des valeurs.
Helpers de recherche locale, association et estimation par masse en grammes.
Fixture isolé incluant rollback et conservation des anciennes données ; CI dédiée.
Le nombre de fichiers importés ne remplace pas les preuves de validation.

## Démonstration

1. Migrer une base contenant une recette et un ingrédient manuel.
2. Importer les 30 aliments ; examiner le rapport, le code et la provenance.
3. Réimporter ; vérifier zéro création et conservation de la recette.
4. Exécuter `npm run test:ciqual` pour les rejets et le rollback.
5. Vérifier que les absences et traces ne produisent pas de zéro nutritionnel.

## Suite à estimer séparément

- Référentiel exhaustif et traitement des 74 constituants.
- Changement de version, historique et arbitrage des renommages.
- API, écrans de sélection/recherche et crédits visibles dans l'application.
- Calcul nutritionnel des recettes : masses, cuisson, rendement, couverture et
  propagation des inconnues, sans extrapolation abusive d'une unité « pièce ».
- Référentiel d'allergènes indépendant : inconnu ne signifie pas absent.

La livraison ne constitue pas une intégration CIQUAL complète. La revue produit
et la décision de fermeture de l'issue restent à l'équipe.
