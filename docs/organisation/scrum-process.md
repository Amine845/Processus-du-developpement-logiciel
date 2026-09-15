# Processus Scrum adapté au projet

## Cadre

L'équipe utilise Scrum comme cadre léger de pilotage. Les règles ci-dessous sont adaptées à un groupe étudiant de quatre contributeurs avec un Product Owner professeur.

## Cadence proposée

- durée d'un sprint : **une semaine**, sauf contrainte du calendrier des TP ;
- Sprint Planning : 45 à 60 minutes ;
- Daily Scrum : 10 à 15 minutes les jours de travail commun ;
- synchronisation asynchrone courte les autres jours ;
- Backlog Refinement : 30 minutes au milieu du sprint ;
- Sprint Review : 30 à 45 minutes ;
- Sprint Retrospective : 30 minutes.

Si les séances de TP imposent une autre cadence, la durée est modifiée explicitement dans le document du sprint.

## Artefacts

### Product Backlog

- source de vérité : GitHub Issues et GitHub Projects ;
- ordonné par le Product Owner ;
- estimé et décomposé par les développeurs ;
- exporté en CSV à chaque fin de sprint pour le rendu.

### Sprint Backlog

Le Sprint Backlog contient :

- l'objectif du sprint ;
- les issues sélectionnées ;
- le plan de réalisation ;
- les travaux imprévus découverts pendant le sprint.

Il appartient aux développeurs et peut évoluer tant que l'objectif du sprint reste protégé.

### Incrément

L'incrément est l'ensemble intégré des éléments terminés selon la Definition of Done. Du code présent sur une branche non fusionnée ou une fonctionnalité non testée ne fait pas partie de l'incrément.

## Événements

### Sprint Planning

Entrées :

- Product Backlog ordonné ;
- capacité de l'équipe ;
- Definition of Done ;
- résultats du sprint précédent ;
- contraintes du calendrier.

Sorties :

- objectif du sprint ;
- éléments sélectionnés ;
- estimation et responsables initiaux ;
- risques et dépendances visibles.

Le Product Owner explique les priorités. Les développeurs décident ce qu'ils peuvent raisonnablement livrer.

### Daily Scrum

Le Daily Scrum sert à adapter le plan, pas à faire un rapport au Scrum Master.

Questions possibles :

- Qu'avons-nous terminé vers l'objectif du sprint ?
- Quel est le prochain travail utile ?
- Quel obstacle ou risque menace l'objectif ?
- Une coordination ou revue est-elle nécessaire aujourd'hui ?

Les discussions détaillées continuent après le point avec les personnes concernées.

### Backlog Refinement

Activités :

- clarifier les prochaines stories ;
- écrire des critères d'acceptation ;
- découper les éléments trop grands ;
- identifier dépendances et risques ;
- poser les questions au Product Owner ;
- estimer collectivement.

Une story n'entre pas dans un sprint tant qu'elle ne satisfait pas la Definition of Ready, sauf décision explicite et risque accepté.

### Sprint Review

L'équipe démontre l'incrément exécuté, pas des diapositives ou du code isolé.

Ordre proposé :

1. rappeler l'objectif du sprint ;
2. démontrer chaque résultat terminé ;
3. présenter les éléments non terminés sans les masquer ;
4. recueillir le retour du Product Owner ;
5. mettre à jour le Product Backlog.

### Sprint Retrospective

La rétrospective porte sur le fonctionnement de l'équipe.

Chaque rétrospective produit au maximum trois actions concrètes, dont au moins une est intégrée au Sprint Backlog suivant.

Exemples :

- réduire la taille des Pull Requests ;
- demander une revue dans les 24 heures ;
- écrire les critères de test avant de coder ;
- organiser une session de travail à deux sur SQLite.

## Estimation

Utiliser des story points relatifs : `1, 2, 3, 5, 8`.

- `1` : changement très petit et connu ;
- `2` : petite tâche avec peu d'incertitude ;
- `3` : travail normal ;
- `5` : plusieurs éléments ou incertitude notable ;
- `8` : trop grand ou risqué, à découper si possible.

Les heures peuvent être enregistrées après réalisation pour comparer estimation et effort, mais elles ne remplacent pas l'estimation relative.

## Gestion des obstacles

1. l'obstacle est signalé dans l'issue et au Scrum Master ;
2. son impact sur l'objectif du sprint est évalué ;
3. une personne et une prochaine action sont identifiées ;
4. le Scrum Master facilite la résolution ;
5. si une décision produit est nécessaire, une question précise est envoyée au Product Owner ;
6. l'obstacle et sa résolution sont repris dans la rétrospective s'ils révèlent un problème de processus.

## Transparence

- Une issue n'est pas marquée terminée pour améliorer artificiellement les indicateurs.
- Un élément non conforme à la Definition of Done retourne au backlog.
- Les travaux imprévus sont ajoutés au tableau.
- Les désaccords et hypothèses importantes sont écrits.
- L'estimation originale n'est pas écrasée après réalisation ; l'effort réel est enregistré séparément.

