# Sprint 01 — Consulter une bibliothèque de recettes

## Informations

- **Période :** du 06/10/2026 au 02/11/2026.
- **Durée :** intervalle entre deux séances.
- **Product Owner :** professeur.
- **Scrum Master indiqué dans le planning :** Titiplex.
- **Développeurs :** Titiplex, Qwantike, Ahrizmo, Amine845.
- **Issue de suivi :** [#12](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/12).
- **Statut du document :** proposition de cadrage à valider collectivement ; ne vaut pas validation de l'incrément.

## Objectif fonctionnel du sprint

> Permettre au client de parcourir une bibliothèque de recettes sur téléphone ou ordinateur, d'ouvrir une recette et de
> consulter le nombre de personnes, les ingrédients avec leurs quantités et unités, ainsi que les étapes de préparation
> dans l'ordre.

Le résultat attendu est une **démo minimale de consultation**, alimentée par les recettes de démonstration enregistrées
dans la base. Le PO évalue un parcours utilisateur complet, et non une succession de composants techniques présentés
séparément.

**Parcours :** ouvrir la bibliothèque → choisir une recette → lire sa fiche → revenir à la bibliothèque.

## Périmètre de la démo

| Inclus dans l'objectif    | Critère observable par le PO                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Bibliothèque              | Au moins trois recettes de démonstration apparaissent avec leur titre et le nombre de personnes.                         |
| Accès à une recette       | Une carte ou un lien ouvre la fiche de la recette choisie.                                                               |
| Fiche recette             | Le titre, la description si elle existe, les portions, les ingrédients quantifiés et les étapes ordonnées sont lisibles. |
| Retour                    | L'utilisateur revient à la bibliothèque sans se retrouver bloqué dans la fiche.                                          |
| Présentation mobile-first | Le parcours est utilisable à 390 × 844 et sur ordinateur à 1440 × 900, sans défilement horizontal involontaire.          |
| Cas sans résultat         | Une bibliothèque vide et une recette introuvable affichent un message explicite.                                         |
| Lecture asynchrone        | Un chargement et une erreur de lecture sont signalés ; l'utilisateur peut retenter la lecture.                           |
| Données persistées        | Les recettes affichées proviennent du jeu de démonstration chargé dans SQLite via l'API de lecture.                      |

Un visuel de remplacement suffit : photographie et upload d'images ne sont pas nécessaires pour valider cette démo.

**Hors de cet objectif :** création, modification et suppression de recettes, connexion, recherche et filtres, tags,
gestion d'allergènes, calcul nutritionnel/CIQUAL, planificateur, courses et profil. Le nombre de personnes est affiché ;
l'ajustement automatique des quantités n'est pas requis.

Il s'agit d'un cadrage proposé pour ce sprint, pas d'une suppression des fonctionnalités prévues pour le produit. Si une
issue déjà engagée couvre davantage, l'équipe doit décider explicitement du découpage : elle ne sera pas déclarée Done
simplement parce que la partie utile à la démo fonctionne.

## Capacité de l'équipe

| Membre   | Disponibilité estimée | Contraintes |
| -------- | --------------------- | ----------- |
| Titiplex | À compléter           | À compléter |
| Qwantike | À compléter           | À compléter |
| Ahrizmo  | À compléter           | À compléter |
| Amine845 | À compléter           | À compléter |

La capacité comprend développement, tests, documentation, revue et préparation de la démo. Aucune disponibilité ni durée
réelle n'est présumée dans ce document.

## Travail nécessaire et liens d'issues

Les responsabilités ci-dessous reprennent le planning fourni ; elles sont à confirmer par l'équipe. Les valeurs sont des
estimations historiques, pas une mesure du travail restant.

| Issue                                                                            | Livrable                                                                    | Points connus | Heures prévues | Responsable indiqué | Dépendances            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------: | -------------: | ------------------- | ---------------------- |
| [#13](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/13) | Schéma SQLite et migrations recettes                                        |             3 |              5 | Titiplex            | Configuration Prisma   |
| [#14](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/14) | Client BDD centralisé et repository de lecture                              |             3 |              4 | Titiplex            | #13                    |
| [#15](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/15) | Seed de recettes de démonstration                                           |             2 |              2 | Ahrizmo             | #13                    |
| [#19](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/19) | API locale et client front des recettes                                     |             3 |              3 | Qwantike            | #14                    |
| [#20](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/20) | Layout, Header et styles globaux                                            |             1 |              2 | Amine845            | —                      |
| [#22](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/22) | Carte recette réutilisable et accessible                                    |             1 |              1 | Amine845            | #20                    |
| [#25](https://github.com/Amine845/Processus-du-developpement-logiciel/issues/25) | Navigation entre les vues                                                   | 6 (planning)* |   3 (planning) | Amine845            | #20                    |
| **Story de consultation proposée, sans numéro attribué**                         | **Intégration bibliothèque → fiche sur les données persistées et états UI** | **À estimer** |  **À estimer** | **À décider**       | **#15, #19, #22, #25** |

**Sous-total historique des sept issues : 19 points / 20 heures-personnes**, hors story proposée et hors réestimation
des changements de périmètre. Ce n'est pas encore le total validé du sprint.

- Le planning attribue 6 points à #25, en dehors de l'échelle documentée 1, 2, 3, 5, 8. Conserver la trace de cette
  valeur et faire estimer le périmètre retenu par l'équipe, sans la convertir arbitrairement en 5 ou 8.

Corrections de cohérence : #14 désigne le repository, pas l'interface ; la seed est #15, pas #13. #19 indique 3 points
dans son issue actuelle, contre 8 dans le planning fourni. Le tableau précédent représentait 24 points / 20 h alors que
le texte annonçait 8 points / 11 h.

Les tâches techniques restent les supports de la story utilisateur. Ne pas additionner deux fois leur charge si l'équipe
estime la story en incluant ces tâches. La story proposée peut être créée ou portée par une issue existante **après
vérification de son statut et de son périmètre**, sans modifier les issues du Backlog dans cette opération de nettoyage.

## Story proposée — Consulter les recettes disponibles

**En tant qu'utilisateur, je veux parcourir les recettes disponibles et consulter leur préparation, afin de choisir un
plat et savoir comment le réaliser.**

### Critères d'acceptation

- [ ] Avec la base de démonstration chargée, la bibliothèque présente au moins trois recettes.
- [ ] Choisir une recette ouvre sa fiche et conserve la correspondance avec la recette sélectionnée.
- [ ] La fiche présente le nombre de personnes et, si elle existe, la description.
- [ ] Chaque ingrédient présente son nom, sa quantité et son unité dans l'ordre défini.
- [ ] Les étapes sont présentées dans l'ordre défini, avec une numérotation compréhensible.
- [ ] Un retour visible permet de revenir à la bibliothèque ; lien direct et rechargement d'une fiche fonctionnent.
- [ ] Si la bibliothèque est vide, un message explicite remplace la liste.
- [ ] Si la recette n'existe pas, un message et un retour à la bibliothèque sont disponibles.
- [ ] Pendant une lecture, un état de chargement est visible ; en cas d'échec, un message et une nouvelle tentative sont
      disponibles.
- [ ] Le parcours est utilisable au clavier et aux viewports retenus, sans débordement horizontal.
- [ ] Les données sont lues via l'API ; aucune fixture front indépendante ne remplace silencieusement les données
      persistées.
- [ ] Aucune valeur nutritionnelle ni absence d'allergène n'est inventée.

**Estimation, responsable et priorité :** à fixer collectivement avant engagement. Les détails techniques d'une tâche ne
remplacent pas ces critères utilisateur.

## Intégration des tâches au parcours

| Partie                 | Contrat de sortie utile à la démo                                      | Validation attendue                                                |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| #13 — BDD              | Recettes, ingrédients quantifiés et étapes structurés                  | Migration sur base vierge et contraintes testées                   |
| #14 — Repository       | Liste déterministe et détail ordonné ; absence distincte d'une erreur  | Tests sur base isolée                                              |
| #15 — Seed             | Trois recettes, ingrédient partagé, descriptions présente et absente   | Deux exécutions sans doublons ni suppression de données étrangères |
| #19 — API/client       | Lecture de la liste et du détail ; erreurs utilisables par l'interface | Contrat documenté et tests de lecture/absence/erreur               |
| #20/#22 — Présentation | Layout commun et cartes utilisables sur mobile                         | Contrôle responsive, texte long et clavier                         |
| #25 — Navigation       | Routes nécessaires à bibliothèque → fiche → retour                     | Liens directs, rechargement et historique navigateur               |
| Story de consultation  | Assemblage de ces sorties dans les deux écrans                         | Scénario complet exécuté sur la même source de données             |

### Arbitrages nécessaires

- **#19 :** l'issue annonce Express et une suppression, alors que main contient déjà une API Node HTTP de lecture.
  Clarifier si son travail restant est le branchement front/documentation ou une extension serveur. Le parcours de démo
  n'exige pas Express ni suppression.
- **#25 :** l'issue couvre quatre grandes vues et une barre basse. Confirmer si ce sprint réalise ce périmètre ou
  seulement la navigation de consultation. Ne pas montrer des onglets donnant l'impression de fonctionnalités livrées
  lorsqu'elles ne le sont pas.
- **#20/#22 :** des issues fermées et des fichiers vides sur main peuvent révéler une intégration encore manquante.
  Vérifier les branches et PR avant de planifier un second développement.

## Plan de travail proposé

1. Confirmer l'objectif avec le PO et la capacité avec les quatre développeurs.
2. Vérifier les acquis réellement intégrés et les statuts du Project ; préciser les périmètres #19/#25.
3. Estimer la story de consultation et organiser ses tâches sans double comptage.
4. Stabiliser les contrats BDD/repository/API ; développer les écrans en parallèle si des fixtures temporaires conformes
   sont nécessaires.
5. Charger la seed, brancher la lecture réelle et supprimer tout remplacement temporaire des données pour la review.
6. Vérifier le parcours, les états, le responsive et les contrôles communs ; effectuer les revues croisées.
7. Préparer le commit de démonstration et conduire la review avec le PO.

## Démonstration au PO

Le [scénario de review](sprint-01-demo.md) décrit une présentation courte centrée sur les usages : bibliothèque, choix
d'une recette, lecture et retour. La vérification technique de la migration et de la seed soutient cette démonstration ;
elle ne constitue pas l'objectif visible du sprint.

Si le raccordement réel n'est pas prêt, présenter honnêtement l'interface comme prototype. L'objectif fonctionnel
complet reste non atteint : il ne faut pas le remplacer rétrospectivement par une démo de composants isolés.

## Risques et suivi

| Risque                                     | Conséquence                                         | Réponse                                                         |
| ------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| Story d'intégration absente ou non estimée | Composants terminés mais aucun parcours présentable | Ajouter ou identifier la story et ses critères avant engagement |
| #19/#25 trop larges pour la capacité       | Dispersion et démo incomplète                       | Arbitrer explicitement le périmètre et réestimer                |
| PR non intégrées malgré fermeture d'issues | Écart entre tableau et application démontrée        | Vérifier main, les preuves et la DoD                            |
| Seed non reproductible                     | Démo dépendante du poste d'un membre                | Tester migration et deux exécutions sur base dédiée             |
| Contrats front/API incompatibles           | Interface incapable de lire la base                 | Documenter un contrat partagé et tester l'intégration           |
| Capacité ou fin de sprint inconnue         | Engagement impossible à évaluer                     | Compléter les disponibilités et la date de fin                  |

Le constat ancien d'alertes npm hautes doit être daté et revérifié : l'audit effectué sur les dépendances du ZIP le
13/10/2026 ne signalait aucune alerte haute/critique. Le contrôle de sécurité reste applicable.

## Definition of Done et clôture

La [Definition of Done générale](../organisation/definition-of-done.md) s'applique, sans réduction. Le sprint n'est pas
considéré terminé parce que l'issue de suivi #12 est fermée.

- [ ] Les critères fonctionnels sont vérifiés sur le parcours intégré.
- [ ] Migration, seed et lecture réelle sont reproductibles et documentées.
- [ ] États UI, clavier et responsive sont vérifiés.
- [ ] Tests, formatage, lint, types, builds et CI satisfont les conditions applicables.
- [ ] Les PR sont liées, relues et intégrées sur main.
- [ ] Temps réels, preuves et écarts sont renseignés sans écraser les estimations initiales.
- [ ] Le retour du PO est consigné ; le travail restant conserve son état réel.

## Validation du planning

- [ ] Date de fin et capacité renseignées.
- [ ] Objectif et parcours compris par l'équipe et discutés avec le PO.
- [ ] Story de consultation identifiée, estimée et reliée au sprint.
- [ ] Statuts Projects vérifiés sans les déduire de open/closed.
- [ ] #19/#25 clarifiées et estimations traçables.
- [ ] Responsables confirmés, dépendances et charge cohérentes.
- [ ] Scénario de démo retenu et environnement reproductible prévu.
