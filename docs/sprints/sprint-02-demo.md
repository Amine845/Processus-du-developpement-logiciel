# Sprint 02 — Démonstration des recettes fonctionnelles

## Préparer la review

Retenir un commit intégré, une base locale de démonstration et une procédure de lancement vérifiée. Ne pas présenter des fonctionnalités issues de plusieurs branches incompatibles comme un parcours unique.

Préparer trois recettes fictives de référence et une nouvelle recette « Démo Sprint 2 » qui n'utilise pas un titre réservé à la seed. Pour cette nouvelle recette : 4 personnes, 200 g d'un ingrédient manuel, un second ingrédient et deux étapes faciles à reconnaître. Les quantités sont un jeu de test, sans promesse nutritionnelle.

Préparer séparément une base vide, un identifiant absent et un moyen de simuler une indisponibilité API. Contrôler le clavier et les viewports 390 × 844 et 1440 × 900 avant la séance. La création et la suppression se font uniquement sur la base dédiée.

## Parcours PO, environ six minutes

| Temps indicatif | Action                                                                          | Résultat observable                                                               |
| --------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 0:00–0:30       | Ouvrir la bibliothèque et rappeler l'objectif                                   | Des recettes persistées sont disponibles                                          |
| 0:30–1:30       | Choisir Créer ; saisir titre, 4 portions, ingrédients quantifiés et deux étapes | Les champs et l'ordre de préparation sont compréhensibles                         |
| 1:30–2:00       | Essayer une quantité nulle puis corriger                                        | Erreur précise, données conservées, aucune recette partielle                      |
| 2:00–2:45       | Enregistrer, puis recharger la page                                             | La même recette et son id sont relus depuis la base                               |
| 2:45–3:30       | Passer de 4 à 2 portions, puis revenir à 4                                      | Les 200 g deviennent 100 g puis 200 g ; la recette enregistrée n'est pas réécrite |
| 3:30–4:15       | Revenir à la bibliothèque et rechercher « Démo »                                | La recette créée est retrouvée et sa fiche se rouvre                              |
| 4:15–5:00       | Demander la suppression, annuler, puis confirmer                                | Annuler conserve la recette ; confirmer la retire de la bibliothèque              |
| 5:00–6:00       | Recharger la liste, puis montrer le résultat sur ordinateur                     | La suppression est persistée et le parcours s'adapte à l'écran                    |

L'insertion invalide est aussi vérifiée côté API dans les tests ; une validation uniquement dans le navigateur ne démontre pas le rollback serveur.

## Cas à vérifier avant la séance

- Bibliothèque vide et recherche sans résultat : messages distincts, réinitialisation de recherche disponible.
- Recette inexistante : message et retour à la liste.
- API indisponible pendant lecture ou sauvegarde : message honnête et possibilité de réessayer, saisie conservée.
- Suppression en échec : aucune disparition définitive trompeuse dans l'interface.
- Titre déjà utilisé : conflit visible, pas d'écrasement.
- Reconnexion ou redémarrage de l'application sur la même base : création/suppression conservées.
- Une autre recette partage un ingrédient : elle reste intacte après suppression de « Démo Sprint 2 ».

## Si l'extension CIQUAL est réellement terminée

Ajouter deux minutes : saisir au moins deux caractères dans un champ ingrédient, choisir un aliment identifié, montrer sa source/version et sa masse en grammes. Comparer un calcul simple aux données importées. Ajouter ensuite un ingrédient manuel sans données nutritionnelles : l'interface doit afficher une estimation partielle ou une indisponibilité, pas des macros complètes à zéro.

Ne pas montrer une fenêtre exhaustive de micronutriments ou un filtre « sans allergène » s'ils ne sont pas livrés et vérifiés.

## Questions au PO et trace de séance

Demander si la saisie est compréhensible, si les quantités/portions répondent au besoin et quelle priorité il choisit ensuite : modifier une recette, mieux rechercher, ou enrichir sa nutrition.

À renseigner après la séance : date, participants, commit montré, critères vérifiés, résultats des contrôles, limites, retours du PO, décisions pour le sprint suivant et travail non terminé. Aucun accord ou succès n'est prérempli dans ce document.
