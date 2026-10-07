# Sprint 01 - Base de recettes et première interface

## Informations

- **Période :** `06/10/2026` au `[date de fin]`
- **Durée :** intervalle entre deux séances, dates à confirmer
- **Product Owner :** professeur
- **Scrum Master :** `Titiplex`
- **Développeurs :** Titiplex, Qwantike, Ahrizmo, Amine845
- **Issue parente :** https://github.com/Amine845/Processus-du-developpement-logiciel/issues/12
- **Statut :** proposition de planning à valider par l'équipe

## Objectif du sprint

> Disposer d'un premier socle de recettes reproductible sur les postes de l'équipe, avec une base structurée, un jeu de
> démonstration et une interface Web mobile-first permettant de présenter le parcours de consultation retenu.

Le périmètre actuellement annoncé comprend trois sous-issues : créer la BDD,
implémenter l'interface et créer une seed. Le détail de la sous-issue interface
reste à confirmer.

## Contexte et priorité du Product Owner

Le premier rendez-vous a établi le besoin d'une application Web mobile-first
permettant notamment de gérer une bibliothèque de recettes, leurs ingrédients
et le nombre de personnes. Ce sprint prépare cette partie du produit sans
chercher à réaliser l'ensemble du MVP.

- **Priorité proposée :** rendre le socle recettes démontrable et reproductible.
- **Retour du sprint précédent :** à compléter depuis la review et la rétrospective.
- **Hypothèses de travail :** React/TypeScript côté client, SQLite/Prisma côté serveur, données synthétiques pour la
  démonstration.
- **Points à confirmer :** écrans exacts, niveau d'interaction et disponibilité d'une API de lecture.

## Capacité

| Membre   | Disponibilité estimée | Contraintes |
| -------- | --------------------: | ----------- |
| Titiplex |           À compléter | À compléter |
| Qwantike |           À compléter | À compléter |
| Ahrizmo  |           À compléter | À compléter |
| Amine845 |           À compléter | À compléter |

La capacité doit inclure développement, tests, documentation, revues et préparation
de la démonstration. La charge ne peut pas être validée avant cette mise à jour.

## Éléments sélectionnés

| Issue                                                                     | Intitulé                | Complexité | Temps estimé | Responsable initial          | Dépendances                                                                        |
| ------------------------------------------------------------------------- | ----------------------- | ---------: | -----------: | ---------------------------- | ---------------------------------------------------------------------------------- |
| https://github.com/Amine845/Processus-du-developpement-logiciel/issues/13 | Créer la BDD minimale   |   3 points |          5 h | Auto-attribution à confirmer | Configuration SQLite/Prisma et conventions de migration                            |
| https://github.com/Amine845/Processus-du-developpement-logiciel/issues/14 | Implémenter l'interface |   3 points |          4 h | Auto-attribution à confirmer | Périmètre des écrans et contrat de données ; API pour une lecture réelle de la BDD |
| https://github.com/Amine845/Processus-du-developpement-logiciel/issues/13 | Créer une seed          |   2 points |          2 h | Auto-attribution à confirmer | Schéma et migration BDD stabilisés                                                 |

**Total prévu :** 8 points / 11 h. Le temps réel sera renseigné dans
chaque issue à la clôture, sans modifier l'estimation initiale.

### 1. Créer la BDD minimale

Le périmètre reprend les critères de la sous-issue :

- modèles `Recipe`, `Ingredient`, `RecipeIngredient` et `RecipeStep` ;
- titre, description facultative et portions pour une recette ;
- quantité, unité et ordre pour une ligne d'ingrédient ;
- position explicite et unique des étapes dans une recette ;
- clés étrangères et règles de suppression explicites ;
- contraintes de titre non vide, portions entières positives, quantités positives et unités reconnues, avec niveau de
  validation documenté ;
- migration versionnée applicable sur une base vierge ;
- configuration, chargement et chemin SQLite vérifiés avec la version installée ;
- exemple de configuration sans secret, bases et fichiers auxiliaires ignorés par Git.

Les comptes, les données nutritionnelles et les courses restent hors de ce schéma.
La procédure est documentée dans [`../data/database.md`](../data/database.md).

### 2. Implémenter l'interface

**Proposition de périmètre à confirmer dans la sous-issue :** une bibliothèque
et une fiche recette consultables, présentant titre, description lorsqu'elle
existe, portions, ingrédients avec quantités/unités et étapes ordonnées.

Critères proposés :

- navigation fonctionnelle entre bibliothèque et fiche recette ;
- interface mobile-first utilisable sur téléphone et ordinateur ;
- libellés accessibles, navigation clavier et actions tactiles utilisables ;
- état vide et recette introuvable prévus ; chargement et erreur gérés si un accès asynchrone est présent ;
- source des données explicitement documentée : API réelle ou fixtures temporaires ;
- absence d'accès direct à SQLite/Prisma depuis le navigateur.

Le branchement sur les données seedées suppose une API de lecture disponible.
Si elle n'existe pas, l'équipe doit décider avant engagement si le raccordement
fait partie de cette sous-issue, avec estimation adaptée, ou si l'interface est
limitée à des fixtures. Dans ce second cas, la démonstration présente séparément
l'interface et la BDD ; elle ne prétend pas valider un parcours de bout en bout.

La création/modification de recettes, les comptes, les filtres, les macros et les
courses ne sont pas ajoutés implicitement à cette sous-issue.

### 3. Créer une seed

**Critères proposés à reporter dans la sous-issue :**

- jeu synthétique versionné contenant plusieurs recettes, des ingrédients réutilisés entre recettes, des
  quantités/unités valides et des étapes ordonnées ;
- présence de descriptions renseignées et absentes pour couvrir les deux affichages ;
- commande reproductible `npm run db:seed`, à implémenter et documenter ;
- exécution après migration sur une base locale de développement ou de test ;
- nouvelle exécution sans doublons et sans suppression de données étrangères au jeu de démonstration ;
- insertion cohérente, avec transaction pour éviter un jeu partiellement chargé en cas d'échec ;
- aucune donnée personnelle, aucun secret, aucun import CIQUAL complet ;
- test sur base temporaire vérifiant les relations et la seconde exécution.

La seed reste une commande explicite : elle ne s'exécute pas automatiquement au
démarrage de l'application. Sa stratégie d'identification des données de
démonstration doit être documentée avant de choisir le mécanisme de réexécution.

## Plan technique

1. **Cadrer :** compléter les liens d'issues, clarifier le périmètre de l'interface et vérifier les acquis réels du
   Sprint 00.
2. **Stabiliser la BDD :** revoir le schéma et la configuration, puis appliquer la migration sur une base temporaire
   vide.
3. **Avancer sur l'interface :** utiliser un contrat de données partagé ; des fixtures conformes à ce contrat permettent
   de travailler avant la seed.
4. **Construire la seed :** s'appuyer sur le schéma stabilisé et vérifier deux exécutions successives.
5. **Intégrer :** brancher la lecture des données si l'API fait partie du périmètre confirmé ; sinon expliciter la
   limite de la démonstration.
6. **Valider :** exécuter les contrôles, effectuer les revues croisées et préparer la séance.

### Tests et documentation

- **BDD :** migration vierge, chemin SQLite, contraintes avec données invalides, références orphelines, règles de
  suppression et exclusions Git.
- **Seed :** données attendues, cohérence relationnelle, absence de doublons et préservation des données hors seed lors
  de la réexécution.
- **Interface :** affichage, navigation, ordre des éléments et états applicables ; vérification manuelle au clavier et
  au tactile.
- **Responsive proposé :** `390 × 844` sur mobile et `1440 × 900` sur ordinateur, à retenir ou adapter collectivement ;
  absence de défilement horizontal involontaire.
- **Contrôles communs :** formatage, lint, vérification TypeScript, tests pertinents, build et CI selon les scripts
  disponibles.
- **Documents :** procédure BDD, installation locale, commande de seed, source des données de l'interface et changelog
  si nécessaire.

L'authentification et l'import CIQUAL ne font pas partie des trois sous-issues
actuelles. Ce sprint ne vaut pas validation d'un accès public sans protection.
Toute extension du périmètre doit être estimée et inscrite au backlog.

## Responsabilités tournantes

- **Référent qualité :** `[à désigner]`
- **Référent architecture :** `[à désigner]`
- **Référent documentation :** `[à désigner]`

Les développeurs s'auto-attribuent les issues. Chaque PR est relue par un autre
membre ; le Scrum Master facilite les blocages et contribue au développement.

## Risques du sprint

Les probabilités et impacts ci-dessous sont des appréciations initiales à revoir
lors du planning.

| Risque                                           | Probabilité                | Impact | Réponse                                                                                    |
| ------------------------------------------------ | -------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Périmètre de l'interface trop large ou ambigu    | Élevée                     | Élevé  | Confirmer les écrans et interactions avant estimation                                      |
| API de lecture absente                           | À vérifier                 | Élevé  | Décider explicitement du raccordement ou de l'usage de fixtures                            |
| Chemin SQLite ou version Prisma incohérents      | Moyenne                    | Élevé  | Utiliser le lockfile et tester la migration sur une base vierge                            |
| Migrations concurrentes                          | Moyenne                    | Moyen  | Se coordonner avant modification et retester l'historique après rebase                     |
| Seed dupliquant ou supprimant des données        | Moyenne                    | Élevé  | Tester la réexécution et limiter les modifications aux données identifiées de la seed      |
| Capacité insuffisante pour les trois sous-issues | À évaluer                  | Élevé  | Compléter les disponibilités et estimations avant engagement                               |
| Audit npm bloquant la CI                         | Constaté sur le ZIP fourni | Élevé  | Suivre la correction des dépendances préexistantes au backlog, sans désactiver le contrôle |

L'audit du ZIP fourni signalait notamment deux alertes élevées préexistantes.
Ce constat doit être revérifié sur la branche actuelle. La correction n'est pas
une quatrième sous-issue implicitement ajoutée : si elle consomme la capacité du
sprint, l'équipe rend ce travail visible et adapte le planning.

## Démonstration prévue

1. Rappeler l'objectif et montrer les trois sous-issues avec leurs critères et leur état réel.
2. Sur une base locale vierge dédiée à la démo, appliquer les migrations.
3. Exécuter la seed et inspecter une recette, ses ingrédients et ses étapes.
4. Relancer la seed et montrer l'absence de doublons.
5. Ouvrir l'interface sur mobile puis sur ordinateur et suivre le parcours confirmé.
6. Préciser la source des données affichées ; si l'API est raccordée, montrer une recette issue de la seed.
7. Présenter les résultats des contrôles, les PR et les limites restantes.
8. Recueillir le retour du Product Owner et mettre à jour le backlog avant la rétrospective et le planning suivant.

## Definition of Done

La [Definition of Done générale](../organisation/definition-of-done.md) s'applique
sans réduction, pour toutes ses conditions applicables. Un patch préparé ou une
branche non fusionnée n'est pas un élément terminé.

Pour ce sprint, vérifier en particulier :

- [ ] Les critères des trois sous-issues sont satisfaits et démontrables.
- [ ] La migration et la seed sont reproductibles et testées sur une base temporaire.
- [ ] L'interface respecte le périmètre confirmé et les viewports retenus.
- [ ] Le raccordement réel ou l'utilisation de fixtures est transparent.
- [ ] Les PR sont relues et intégrées sur `main` ; la CI est verte.
- [ ] La documentation et les nouvelles commandes sont à jour.
- [ ] Les estimations initiales sont conservées et les temps réels renseignés.

La review évalue les résultats effectivement obtenus. Tout élément non terminé
reste visible au backlog ; il n'est pas validé artificiellement pour clôturer le sprint.

## Validation du planning

- [ ] Période et capacité renseignées.
- [ ] Objectif compris par tous et discuté avec le Product Owner.
- [ ] Trois sous-issues liées à l'issue parente.
- [ ] Périmètre exact de l'interface et dépendance API clarifiés.
- [ ] Critères proposés pour l'interface et la seed confirmés dans leurs issues.
- [ ] Definition of Ready vérifiée et estimations complétées.
- [ ] Charge compatible avec la capacité, revues et démonstration comprises.
- [ ] Responsables et référents confirmés par l'équipe.
- [ ] Scénario de démonstration connu et risques visibles.
