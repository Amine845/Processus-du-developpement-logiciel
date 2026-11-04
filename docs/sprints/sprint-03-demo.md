# Sprint 03 — Scénario de démonstration

## Préparation

Fixer branche/commit, base SQLite de démo dédiée et état d'import ; conserver les recettes existantes. Utiliser les procédures de lancement du dépôt et vérifier l'API active. Ne pas exécuter une seed destructive sur une base personnelle.

Préparer deux jeux distincts : un échantillon de codes CIQUAL officiels vérifiés (classification et provenance) et des fixtures nutritionnelles artificielles (tests chiffrés). Les chiffres ci-dessous ne décrivent pas les valeurs nutritionnelles réelles de l'œuf.

## Parcours principal à présenter au PO

| Étape | Action | Résultat observable |
| --- | --- | --- |
| 1 | Ouvrir la bibliothèque | Recettes persistées, titre/portions, recherche réellement disponible |
| 2 | Créer puis saisir « œuf » | Suggestions CIQUAL d'aliments, catégories et code identifiables |
| 3 | Chercher semoule sèche puis couscous cuisiné | Semoule dans aliments ; plat composé dans sa catégorie explicite |
| 4 | Sélectionner un aliment, quantité en g, autre ligne en kg | Identités conservées et aperçu de référence avec provenance |
| 5 | Ajouter titre, portions et deux étapes distinctes | Description facultative, préparation réelle ordonnée |
| 6 | Sauvegarder puis recharger | Même recette/id, ingrédients liés, code CIQUAL et étapes conservés |
| 7 | Ouvrir la fiche, passer de 4 à 2 puis à 4 | Quantités proportionnelles sans écriture ni dérive ; étapes visibles |
| 8 | Ouvrir la nutrition | Total/portion et couverture de chaque macro clairement différenciés |
| 9 | Refaire avec une ligne manuelle ou en pièces sans masse | Recette sauvegardée ; macros partielles et cause visible |
| 10 | Revenir, rechercher titre/ingrédient/tag si retenus | Combinaison des critères conforme ; critères conservés au retour |
| 11 | Supprimer après une annulation de contrôle | Annuler conserve ; confirmer supprime la recette, pas les ingrédients partagés |

Si la photo est engagée, ajouter choix → aperçu → sauvegarde → redémarrage → image carte/fiche ; tester retrait et fichier invalide. Si les tags/filtres sont différés, les signaler explicitement dans la review au lieu de présenter des boutons inactifs.

## Vérifications chiffrées reproductibles

Fixture artificielle A pour 100 g : énergie 200 kcal, protéines 10 g, glucides 20 g, lipides 8 g.

| Cas | Attendu |
| --- | --- |
| 200 g, 4 portions | Total 400 kcal / P20 / G40 / L16 ; portion 100 kcal / P5 / G10 / L4 |
| 0,2 kg, 4 portions | Strictement équivalent avant arrondi |
| Cible 2 portions | 100 g, total 200/P10/G20/L8 ; portion inchangée |
| Retour cible 4 | Valeurs initiales retrouvées |
| 2 pièces, masse comestible totale explicite 100 g | Total 200/P10/G20/L8 |
| 2 pièces sans masse | Contribution inconnue, cause visible |
| Ajout manuel sans valeurs | Total non complet ; sous-total connu séparé |
| Protéines manquantes seulement | Couverture protéines partielle ; autres macros calculables selon les lignes |
| Exact zéro, trace et < seuil | Zéro exact préservé ; trace et seuil ne deviennent pas zéro |

## Cas d'erreur et non-régression

- Recherche trop courte, vide, sans résultat, retour serveur en retard et panne avec nouvelle tentative.
- Catégorie inconnue, groupe non classé, réimport et synchronisation sans perte de codes ni de tags.
- Quantité vide/zéro/négative/non finie, unité interdite, portions invalides ; aucun enregistrement partiel.
- Sélection puis modification du texte : ancien code invalidé ; même libellé avec deux codes : aucune fusion arbitraire.
- 404 recette versus panne GET : états distincts et sortie disponible.
- Suppression annulée/échouée ; autre recette partageant l'ingrédient toujours intacte.
- Clavier, toucher et focus ; 390 × 844 / 1440 × 900 sans débordement involontaire.

## Preuves à relever

| Élément | Résultat | Preuve | Anomalie / action |
| --- | --- | --- | --- |
| Commit et base testés | À renseigner | | |
| Parcours principal | Non exécuté à la préparation | | |
| Tests chiffrés et erreurs | Non exécutés à la préparation | | |
| Commandes et CI | Non exécutées à la préparation | | |
| Viewports et clavier | Non vérifiés à la préparation | | |
| Retour PO | Non recueilli | | |

La démo prouve un incrément ; elle ne remplace pas les tests de migration et de rollback.
