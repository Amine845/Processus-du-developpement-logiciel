# Sprint 02 — Créer et utiliser ses recettes

## Informations

- **Statut :** proposition de planning, à confirmer par l'équipe et le PO ; aucune issue distante modifiée.
- **Période :** date de début et date de fin à fixer au prochain planning. Le 02/11/2026 est la date de préparation du document, pas une date de sprint présumée.
- **Product Owner :** professeur.
- **Scrum Master indiqué dans le planning existant :** Titiplex, à confirmer si le rôle tourne.
- **Équipe :** Titiplex, Qwantike, Ahrizmo et Amine845.
- **Base examinée :** archive Front fournie, commit `3b4afb2fff84793d8bc3c46fa26d9a831fdeeb97`.
- **Backlog proposé par l'utilisateur :** #28, #29, #30, #33 et #44 ; corps relus sur GitHub le 02/11/2026.

## Objectif pour le Product Owner

> Un utilisateur peut créer une recette avec des ingrédients quantifiés et des étapes, l'enregistrer, la retrouver dans sa bibliothèque après rechargement, consulter sa préparation, adapter les quantités au nombre de personnes et supprimer la recette avec confirmation.

**Parcours de review :** bibliothèque → créer → enregistrer → fiche → recharger → changer les portions → retour à la bibliothèque → rechercher par titre → supprimer avec confirmation.

Une recette est « fonctionnelle » lorsqu'elle est persistée, relisible et utilisable pour préparer un plat. Un formulaire statique ou une carte de démonstration ne suffit pas. L'édition d'une recette existante n'est pas engagée implicitement : elle pourra constituer l'incrément suivant.

## Point de départ constaté dans l'archive

| Élément                      | État observé                                                                          | Conséquence de planning                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Gabarit, carte et navigation | Layout, RecipeCard et HashRouter présents                                             | Réutiliser les composants                                                      |
| Écrans                       | Vues temporaires dans App.tsx ; fichiers des pages liste/détail vides                 | Construire les écrans et les brancher réellement                               |
| Base                         | Recipe, Ingredient, RecipeIngredient et RecipeStep avec migration et seed             | Partir de ce schéma, préserver les données existantes                          |
| API                          | Express : GET liste/détail et DELETE ; serveur Node HTTP distinct : lecture seulement | Choisir et consolider le serveur réellement utilisé                            |
| Création persistée           | Pas de POST recettes ni de méthode de création dans le client inspecté                | Ajouter une tâche API/persistance ; le formulaire seul ne suffit pas           |
| Cohérence serveur            | recipe.repository.ts importe `prisma`, mais prisma.ts n'exporte que createPersistence | Traiter cette incohérence dans la consolidation, avant le raccordement         |
| Données métier               | Pas de modèles CIQUAL, équipement, tags ou allergènes dans le schéma inspecté         | Ne pas engager tous les filtres du backlog en même temps                       |
| Identité recette             | Le titre est actuellement unique                                                      | Prévoir une erreur de doublon explicite ; ne pas écraser une recette existante |
| Commandes                    | `server` et `start:server` lancent deux piles différentes                             | Retenir une procédure locale unique, documentée et testée                      |

Constats issus d'une lecture du code, sans exécution ni déclaration de CI verte. Les corrections de seed d'un autre livrable ne sont pas supposées intégrées tant qu'elles ne sont pas vérifiées dans la branche retenue. Ne pas relancer une seed qui réinitialise ses recettes de démonstration pendant la review d'une création utilisateur.

## Périmètre à engager en priorité

| Élément              | Inclus dans le Sprint 2 proposé                                                                                             | Conservé pour une suite ou une extension                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| #30 — Création       | Titre, description facultative, portions, ingrédients manuels avec quantités/unités et étapes ordonnées ; sauvegarde réelle | Photo uploadée, matériel, macros saisies ou calculées, édition        |
| #29 — Bibliothèque   | Liste persistée, cartes ouvrant une fiche, recherche par titre et états UI                                                  | Recherche croisée tags/matériel ; filtres alimentaires et allergènes  |
| #28 — Fiche          | Lecture complète, quantités proportionnelles aux portions, suppression confirmée                                            | Matériel et modale complète vitamines/minéraux                        |
| Tâche S2-T01 à créer | Consolidation serveur/client et création transactionnelle                                                                   | Refonte générale de l'architecture                                    |
| Tâche S2-T02 à créer | Intégration, non-régression, revue croisée et préparation de la démo                                                        | Déploiement public                                                    |
| #44 — CIQUAL         | Extension conditionnelle : import local d'un sous-ensemble tracé                                                            | Import complet et gestion avancée de toutes les valeurs particulières |
| #33 — Ingrédients    | Extension conditionnelle : recherche d'aliments et sélection d'un résultat identifié                                        | Courses et planificateur, qui ne relèvent pas de cette issue          |

Cette réduction doit être discutée avec l'équipe et le PO. Avant de réécrire une issue large, conserver son contenu initial dans une description de suivi, un historique ou des sous-issues liées, puis reporter explicitement les critères différés. Le patch fournit des **descriptions proposées**, sans publier ce découpage sur GitHub.

## Stories et charge proposées

Toutes les valeurs ci-dessous sont des **estimations de cadrage**, pas une estimation acceptée ni une vélocité constatée. Les temps incluent les tests et la documentation propres à chaque tâche ; la ligne d'intégration couvre les vérifications transversales et les revues croisées. Ne pas compter une seconde fois les mêmes tests.

| Référence              | Résultat                                                                    | Priorité | Points proposés | Heures-personnes proposées | Dépendances                                                |
| ---------------------- | --------------------------------------------------------------------------- | -------- | --------------: | -------------------------: | ---------------------------------------------------------- |
| S2-T01, nouvelle tâche | Un seul parcours serveur/client opérationnel ; POST atomique et validations | Must     |               5 |                          8 | Schéma et migration existants                              |
| #30                    | Créer puis enregistrer une recette complète                                 | Must     |               5 |                          8 | Contrat S2-T01 ; fixtures conformes possibles en parallèle |
| #29                    | Retrouver et rechercher ses recettes persistées                             | Must     |               3 |                          4 | GET validé par S2-T01                                      |
| #28                    | Consulter, ajuster les portions et supprimer avec confirmation              | Must     |               5 |                          8 | GET/DELETE validés par S2-T01                              |
| S2-T02, nouvelle tâche | Valider le parcours de bout en bout et préparer la review                   | Must     |               3 |                          6 | Les quatre lignes précédentes                              |
| **Total du socle**     | **Objectif fonctionnel démontrable**                                        |          |          **21** |                     **34** |                                                            |

Ces chiffres ne remplacent pas d'anciennes estimations enregistrées dans le Project. Conserver leur trace et préciser la date d'une réestimation. Les référents des cinq lignes travaillent avec le reste de l'équipe ; les trois issues front ne deviennent pas trois silos indépendants.

### Extension CIQUAL, uniquement après sécurisation du socle

| Référence                   | Résultat borné                                                                           | Priorité | Points proposés | Heures-personnes proposées | Dépendances                                           |
| --------------------------- | ---------------------------------------------------------------------------------------- | -------- | --------------: | -------------------------: | ----------------------------------------------------- |
| #44                         | Sous-ensemble local CIQUAL importable, relançable et traçable                            | Should   |               5 |                          8 | Format réel de la source vérifié ; migration additive |
| #33                         | Autocomplétion d'ingrédients, sélection par code et récupération des valeurs disponibles | Should   |               5 |                          8 | #44 ; intégration au formulaire #30                   |
| S2-E01, nouvelle sous-tâche | Afficher énergie, protéines, glucides et lipides estimés par portion                     | Could    |               3 |                          4 | #44/#33 et correspondance fiable quantité ↔ masse     |
| **Total extension**         |                                                                                          |          |          **13** |                     **20** |                                                       |
| **Socle + extension**       |                                                                                          |          |          **34** |                     **54** |                                                       |

L'extension n'est pas nécessaire pour accepter l'objectif central. Ne pas promettre l'ensemble des cinq issues avec leurs descriptions actuelles pour 34 h : elles couvrent bien davantage. Un import complet, une modale exhaustive et les filtres allergènes ne sont pas inclus dans les 20 h d'extension.

## Capacité et répartition proposée

| Membre   | Rôle de réalisation proposé        | Disponibilité réelle | Revues proposées                         |
| -------- | ---------------------------------- | -------------------- | ---------------------------------------- |
| Titiplex | S2-T01 : contrat, API, persistance | À renseigner         | API/données avec Qwantike                |
| Amine845 | #30 : formulaire et sauvegarde     | À renseigner         | Parcours de création avec Ahrizmo        |
| Qwantike | #29 et coordination de S2-T02      | À renseigner         | Contrats et non-régression avec Titiplex |
| Ahrizmo  | #28 : fiche, portions, suppression | À renseigner         | Interface et clavier avec Amine845       |

Répartition indicative, à adapter aux disponibilités et compétences. Les 6 h de S2-T02 sont réparties entre les quatre membres ; la ligne ne charge pas Qwantike seul. À titre d'ordre de grandeur, 34 h représentent 8,5 h par personne en moyenne, pas quatre charges identiques.

Remplir les disponibilités avant engagement et garder une marge explicite pour les aléas ; proposition de marge de capacité : environ 20 % au-delà des estimations, sans la présenter comme du temps déjà consommé. Si la capacité manque, retirer d'abord l'extension, puis la recherche par titre et le changement de portions après accord du PO. Ne pas sacrifier la persistance, la consultation, les erreurs ou la vérification pour conserver des options visuelles.

## Contrat fonctionnel commun

### Création et persistance

- Titre non vide après nettoyage, 200 caractères maximum selon la contrainte existante ; doublon de titre signalé selon le schéma actuel.
- Description facultative ; nombre de personnes entier strictement positif.
- Au moins un ingrédient, avec quantité finie positive, unité autorisée et ordre ; au moins une étape non vide et ordonnée.
- Unités du socle : `g`, `kg`, `ml`, `l`, `piece`. Aucun calcul nutritionnel n'est déduit implicitement d'une quantité en pièces ou en volume.
- La validation serveur fait autorité. Une sauvegarde invalide ne crée aucune recette partielle ni de nouvel ingrédient orphelin.
- Les ingrédients partagés sont réutilisés selon une règle de normalisation documentée ; le formulaire ne crée pas des doublons à chaque ligne par accident.
- Après succès, la fiche correspond à l'id renvoyé par le serveur. Après échec, la saisie est conservée et le bouton permet de réessayer.
- Pendant l'envoi, empêcher le double clic. Ne pas promettre une idempotence réseau complète par ce seul mécanisme : prévoir un message de doublon et une nouvelle consultation en cas de résultat incertain.

### Consultation, portions et suppression

- Le nombre de personnes de référence est celui enregistré avec la recette.
- Pour une quantité initiale q, des portions initiales p et une cible n : quantité affichée = q × n / p.
- Le changement de portions est un calcul d'affichage ; il ne réécrit pas la recette. Toujours repartir des quantités de référence pour éviter l'accumulation d'arrondis.
- Conserver les valeurs précises pour le calcul et n'arrondir que l'affichage. Une valeur fractionnaire en pièces reste lisible ; ne pas modifier silencieusement la recette.
- Une suppression annulée conserve les données. Une suppression confirmée réussie retire la recette de la bibliothèque ; les ingrédients partagés restent disponibles pour les autres recettes.
- Distinguer recette absente et serveur indisponible. Une erreur de suppression ne doit pas faire croire à une réussite.

### API à fixer dans S2-T01

| Opération cible         | Résultat attendu                                 | Cas à documenter/tester                                                         |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| GET /api/recipes        | 200, liste dans un ordre déterministe            | Vide et erreur serveur                                                          |
| GET /api/recipes/:id    | 200, recette avec ingrédients et étapes ordonnés | Id invalide, 404 et panne                                                       |
| POST /api/recipes       | 201, recette créée avec son id                   | 400 données invalides ; 409 titre déjà présent ; erreur sans écriture partielle |
| DELETE /api/recipes/:id | 204, sans corps en cas de succès                 | Id invalide ; 404 si déjà absente ; erreur serveur                              |

C'est un contrat cible proposé, pas la description de routes toutes déjà implémentées. Les DTO doivent distinguer l'id d'un aliment, l'id d'une ligne d'ingrédient et le futur code CIQUAL ; le champ `id` actuel du DTO d'ingrédient ne doit pas être supposé être un code alimentaire. Tous les écrans utilisent le même serveur et la même base.

## Ordre de travail et points de contrôle

1. **Début du sprint :** relever capacité et dates, confirmer le périmètre, choisir l'entrée serveur et le contrat. Timebox proposée de 2 h-personnes au sein de S2-T01 pour diagnostiquer les divergences ; si la consolidation déborde, rendre le blocage visible et réestimer.
2. **En parallèle :** API/persistance ; formulaire sur DTO partagé ; bibliothèque ; fiche et calcul de portions sur fixtures conformes. Chaque branche a un reviewer identifié.
3. **Premier point d'intégration, avant le milieu de la capacité consommée :** une recette créée par POST doit être retrouvée par GET sur la même base. Aucun chantier CIQUAL ne doit retarder ce jalon.
4. **Deuxième point :** création depuis l'interface → rechargement → consultation et suppression. Faire les revues au fil de l'eau.
5. **Seulement si la charge restante est compatible :** engager #44 puis #33 ; S2-E01 après vérification des unités et valeurs manquantes.
6. **Fin de sprint :** régression, viewports/clavier, documentation réelle de lancement, intégration sur main, scénario de review et collecte du retour PO.

Limiter chacun à une tâche principale en cours. Une tâche bloquée conserve une prochaine action claire ; les développeurs disponibles aident à l'intégration avant d'ouvrir une nouvelle extension.

## Données, tests et limites

- Utiliser des bases temporaires isolées pour les tests et une base de démo dédiée. Ne pas supprimer les recettes personnelles pour montrer un état vide.
- Tester création valide et invalide, rollback, doublon de titre, ordre des étapes, persistance après rechargement/reconnexion et suppression préservant les ingrédients partagés.
- Tester le calcul de portions avec des cas connus, dont retour à la valeur d'origine ; tester erreurs réseau et absence de recette.
- Vérifier clavier, libellés de champs, confirmation de suppression, états chargement/vide/erreur/succès et absence de débordement à 390 × 844 et 1440 × 900.
- Si l'extension est retenue, suivre [la politique nutritionnelle proposée](sprint-02-nutrition.md) et la documentation CIQUAL existante. Une donnée inconnue ne devient pas zéro ; une valeur nutritionnelle n'est pas une preuve d'absence d'allergène.
- Le sprint vise une démo locale avec données fictives, sans comptes ni partage multi-utilisateur. Toute mise en ligne ou introduction de données privées exige de recadrer les règles d'accès ; une recette « de l'utilisateur » n'implique pas un contrôle de propriété déjà livré.

## Risques et arbitrages

| Risque                                  | Impact sur l'objectif                                          | Réponse prévue                                                 |
| --------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Deux piles serveur divergentes          | Le formulaire et la bibliothèque ne parlent pas à la même base | S2-T01 prioritaire, procédure unique et tests HTTP réels       |
| Formulaire développé sans POST          | Démo visuelle sans enregistrement                              | Contrat partagé et jalon POST → GET précoce                    |
| Backlog nutrition/filtres trop large    | Fin de sprint sans parcours terminé                            | Socle prioritaire, extension séparée                           |
| Schéma à titre unique et seed par titre | Collision ou réinitialisation d'une recette créée              | Message de conflit ; recettes de démo réservées et base dédiée |
| CIQUAL/ml/pièces ou nutriments absents  | Macros affichées à tort comme complètes                        | Calcul limité aux masses fiables et couverture explicite       |
| Retard d'intégration de Front sur main  | DoD non satisfaite malgré une démo locale                      | Revue et intégration progressives ; travail restant visible    |

## Definition of Done

La [DoD générale](../organisation/definition-of-done.md) s'applique. Une issue large n'est pas Done parce que son sous-ensemble Sprint 2 fonctionne : expliciter d'abord le découpage convenu.

- [ ] Parcours complet démontré sur données réellement persistées.
- [ ] Critères des issues retenues, erreurs et contraintes testés.
- [ ] Procédure de lancement et contrat API alignés avec le code livré.
- [ ] Tests pertinents, lint, formatage, types et builds client/serveur réussis ; CI vérifiée.
- [ ] Contrôles mobile, bureau et clavier réalisés.
- [ ] PR relues, liées aux bons tickets et intégrées sur main.
- [ ] Estimations initiales conservées ; temps réels, écarts et preuves renseignés.
- [ ] Retour PO consigné et reliquats reportés explicitement.

## Documents associés et validation du planning

- [Scénario de review](sprint-02-demo.md).
- [Découpage et descriptions d'issues proposées](sprint-02-backlog.md).
- [Règles nutritionnelles de l'extension](sprint-02-nutrition.md).

Avant engagement : dates et disponibilités renseignées, priorité confirmée avec le PO, contrats suffisamment clairs, estimations discutées par les quatre développeurs, charge compatible avec la capacité et décisions de report traçables. Aucune de ces validations n'est supposée acquise par ce document.
