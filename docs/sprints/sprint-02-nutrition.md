# Sprint 02 — Règles proposées pour l'extension CIQUAL

L'extension ne conditionne pas l'acceptation du parcours de recettes. Elle suit [la documentation CIQUAL existante](../data/ciqual.md), dont la source officielle, la provenance et le traitement des données inconnues doivent être vérifiés à l'import. Aucun fichier CIQUAL n'a été importé ou validé pour produire ce planning.

## #44 : un référentiel borné et traçable

Inspecter le format officiel réellement téléchargé avant de figer le schéma. Modéliser des aliments de référence CIQUAL distincts des ingrédients manuels, avec code stable et liaison explicite ; ne pas assimiler un libellé à une identité.

Pour l'extension Sprint 2, proposer un sous-ensemble documenté d'environ 20 à 50 aliments utiles à la démo. Garder source, version, code, unités, base de référence, valeur d'origine et état de disponibilité. La plage est une proposition de périmètre, pas une propriété de la table officielle. Un import complet n'est pas annoncé comme livré si seul ce sous-ensemble est testé.

L'import est explicite, local, relançable sans doublons et transactionnel, avec rapport des lignes acceptées/rejetées. Une migration additive préserve recettes et ingrédients existants. La seed de recettes n'est pas un mécanisme de remise à zéro de ce référentiel.

## #33 : recherche d'aliments, pas liste de courses

Proposition d'API : `GET /api/ingredients/search?q=...&limit=...`, réponse bornée contenant identifiant interne, code CIQUAL, libellé et source/version ; les valeurs nutritionnelles peuvent être renvoyées ou récupérées par un endpoint de détail à préciser dans le contrat.

Proposition d'interface : au moins deux caractères, résultat stable, nombre limité de suggestions, navigation clavier, sélection explicite. Annuler ou ignorer les réponses devenues obsolètes lors d'une frappe rapide. Une recherche sans résultat permet de conserver un ingrédient manuel, sans code CIQUAL inventé.

Le titre et le corps de #33 doivent être alignés : les anciennes lignes sur l'agrégation d'une liste de courses restent une demande séparée à conserver dans l'historique ou un ticket lié. Ne pas les faire disparaître sans trace.

## Calcul minimal, après validation des unités

Limiter la première restitution à énergie, protéines, glucides et lipides par portion. Les valeurs manquantes, traces et seuils conservent un état distinct du zéro ; leur conversion numérique exige une règle documentée et testée.

Si une valeur de référence C est exprimée pour une masse R en grammes et si la quantité réellement utilisée est q grammes, la contribution est `q × C / R`. Pour une référence confirmée de 100 g, cela devient `q × C / 100`. Le total de la recette est la somme des contributions ; la valeur par portion est ce total divisé par les portions de référence.

- kg → g : conversion exacte possible.
- ml/l → g : nécessite une densité pertinente et tracée ; ne pas supposer que tous les aliments ont la densité de l'eau.
- pièce → g : nécessite une masse unitaire pertinente et tracée.
- Nom semblable : ne vaut pas correspondance automatique avec un aliment CIQUAL.
- Ingrédient manuel ou quantité sans masse fiable : nutrition indisponible pour cette ligne.

Pour chaque nutriment, si au moins une contribution manque, afficher « estimation partielle » avec les ingrédients non couverts, ou « non disponible ». Un sous-total connu n'est pas étiqueté comme un total complet. Choisir un nutriment peut donc donner une couverture différente d'un autre.

**Cas de test synthétique**, sans attribution à CIQUAL : un aliment à 10 g de protéines pour 100 g, utilisé à 200 g dans 4 portions, donne 20 g au total et 5 g par portion. Doubler les portions affichées pour préparer deux fois plus de nourriture double le total estimé, mais conserve les protéines par portion.

Afficher « estimations d'après les ingrédients », sans prétendre modéliser les pertes à la cuisson ou la rétention des nutriments. Ne pas exposer des vitamines/minéraux complets si cette couverture n'est pas effectivement réalisée.

## Restrictions alimentaires et allergènes

Les filtres « sans gluten », « sans lactose » et « végétarien » ne décrivent pas la même propriété. Végétarien relève d'un régime ; la teneur en lactose n'est pas synonyme d'absence d'allergène lait. CIQUAL seul ne constitue pas une preuve d'absence d'allergène. Aucune de ces étiquettes ne doit être inventée dans ce sprint.

## Tests de l'extension

Import d'un petit fixture représentatif, réimport, migration sur données existantes, code/version conservés, doublon, ligne invalide et rollback. Recherche courte, accents selon la politique retenue, aucun résultat, limite et stabilité des résultats. Calcul connu, unité sans conversion fiable, valeur nulle versus valeur absente, couverture partielle et affichage cohérent après changement de portions.
