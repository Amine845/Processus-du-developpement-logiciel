# ADR-003 - Monolithe modulaire

- **Statut :** proposé
- **Date :** 2026-09-15
- **Décideurs :** équipe de réalisation

## Contexte

Le produit comprend plusieurs domaines fonctionnels, mais l'équipe compte quatre étudiants et doit livrer une application unique. Une architecture non structurée rendrait les merges, tests et évolutions difficiles. Des microservices seraient disproportionnés.

## Décision

Construire un monolithe modulaire séparant :

- présentation ;
- application ;
- domaine ;
- infrastructure ;
- intégration Electron.

## Raisons

- frontières explicites ;
- tests du domaine sans interface ;
- travail parallèle plus simple ;
- déploiement unique ;
- complexité opérationnelle limitée.

## Conséquences positives

- responsabilités claires ;
- meilleure testabilité ;
- moins de conflits si les modules sont respectés ;
- possibilité de remplacer une infrastructure derrière une interface.

## Conséquences négatives

- discipline d'import nécessaire ;
- davantage de fichiers qu'un prototype non structuré ;
- risque de créer des abstractions inutiles.

## Mesures

- ne créer une interface que pour une frontière ou une dépendance réelle ;
- vérifier les dépendances pendant les revues ;
- refuser les imports circulaires ;
- ajuster l'architecture par ADR lorsque les besoins l'exigent.

