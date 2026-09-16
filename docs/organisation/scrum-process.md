# Processus Scrum adapté au projet

## Cadre convenu avec le Product Owner

Le professeur est Product Owner. Le groupe de réalisation compte quatre étudiants : un Scrum Master également développeur et trois autres développeurs.

Chaque séance constitue un point d'inspection et d'adaptation. Elle doit couvrir :

1. démonstration de l'état actuel et des avancées ;
2. comparaison avec le backlog et l'objectif du sprint ;
3. Sprint Review de l'incrément terminé ;
4. rétrospective du sprint ;
5. mise à jour des priorités avec le Product Owner ;
6. organisation du sprint suivant ;
7. backlog à jour avec complexité, temps estimé et temps réel.

Si une séance ne correspond pas exactement à une fin de sprint, l'équipe distingue clairement l'inspection intermédiaire de la clôture du sprint.

## Cadence

- un sprint couvre l'intervalle entre deux séances, sauf décision contraire ;
- préparation de la démo avant la séance ;
- Daily Scrum de 10 à 15 minutes les jours de travail commun ;
- synchronisation asynchrone courte les autres jours ;
- refinement avant le prochain Sprint Planning ;
- review, rétrospective et planning regroupés pendant la séance selon le cadre du cours.

## Déroulement d'une séance

### 1. Démonstration

- rappeler l'objectif du sprint ;
- démontrer l'application exécutée ;
- montrer les éléments terminés ;
- identifier explicitement les travaux en cours ;
- relier chaque résultat à une issue, une PR et des tests.

Un travail en cours peut être montré, mais n'est pas compté comme terminé.

### 2. Sprint Review

- recueillir le retour du Product Owner ;
- noter les éléments acceptés, refusés ou à modifier ;
- enregistrer les nouvelles demandes ;
- réordonner le Product Backlog ;
- vérifier les hypothèses produit.

### 3. Rétrospective

- analyser le processus, les outils et la collaboration ;
- éviter l'évaluation personnelle ;
- choisir au maximum trois améliorations concrètes ;
- attribuer une prochaine action et une mesure de réussite.

Les sujets sensibles peuvent être discutés d'abord entre les quatre étudiants. La synthèse et les actions utiles restent documentées.

### 4. Sprint suivant

- formuler un objectif ;
- vérifier la Definition of Ready ;
- sélectionner le travail selon la capacité ;
- estimer complexité et temps ;
- identifier risques et dépendances ;
- définir le scénario de démonstration.

## Artefacts

### Product Backlog

- source de vérité : GitHub Issues et GitHub Projects ;
- ordonné par le Product Owner ;
- estimé par les développeurs ;
- exporté en CSV à chaque séance ou fin de sprint.

### Sprint Backlog

Contient l'objectif, les issues sélectionnées, le plan, les risques et les travaux imprévus. Il appartient aux développeurs et peut évoluer tant que l'objectif reste protégé.

### Incrément

Seuls les éléments respectant la Definition of Done appartiennent à l'incrément. Une branche non fusionnée ou une fonctionnalité non testée n'est pas terminée.

## Estimation

Trois mesures distinctes sont conservées :

| Mesure | Moment | Usage |
|---|---|---|
| Complexité | Avant le sprint | Comparaison relative en points `1, 2, 3, 5, 8` |
| Temps estimé | Avant le sprint | Planification en heures |
| Temps réel | Pendant/après | Apprentissage et analyse des écarts |

Les story points ne sont pas convertis automatiquement en heures. L'estimation originale n'est pas écrasée après réalisation.

## Daily Scrum

Le Daily Scrum sert aux développeurs à adapter leur plan, pas à rendre compte au Scrum Master.

- Quel progrès vers l'objectif ?
- Quel prochain travail est prioritaire ?
- Quel obstacle menace l'objectif ?
- Quelle revue ou coordination est nécessaire ?

## Refinement

- clarifier les stories suivantes ;
- écrire les critères d'acceptation ;
- découper les éléments trop grands ;
- identifier les dépendances ;
- poser les questions au Product Owner ;
- estimer complexité et temps.

## Gestion des obstacles

1. l'obstacle est signalé dans l'issue ;
2. son impact sur l'objectif est évalué ;
3. une prochaine action et un responsable de suivi sont identifiés ;
4. le Scrum Master facilite la résolution ;
5. une question produit précise est envoyée au Product Owner si nécessaire ;
6. le problème est repris en rétrospective s'il révèle une faiblesse du processus.

## Transparence

- ne jamais marquer artificiellement une issue terminée ;
- enregistrer les tâches imprévues ;
- distinguer démo d'un travail en cours et incrément terminé ;
- conserver estimation initiale et temps réel ;
- écrire les hypothèses et désaccords ;
- mettre le backlog à jour avant chaque séance.

