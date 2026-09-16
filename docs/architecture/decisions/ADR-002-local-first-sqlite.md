# ADR-002 - Persistance local-first avec SQLite

- **Statut :** remplacé par ADR-005
- **Date :** 2026-09-15
- **Date de remplacement :** `2026-09-16`
- **Décideurs :** équipe de réalisation

> La demande d'une application Web avec connexion implique une persistance et une authentification accessibles côté serveur. Le moteur relationnel définitif reste à sélectionner pendant le Sprint 0.

## Contexte

Le MVP doit conserver profils, recettes, plannings et listes de courses. Un backend distant introduirait authentification, hébergement, synchronisation, disponibilité réseau et protection de données sans être nécessaire au parcours principal.

## Décision

Utiliser SQLite comme persistance locale et accéder aux données par des interfaces de repositories.

## Raisons

- aucune infrastructure serveur requise ;
- transactions et contraintes relationnelles ;
- fichier local facile à initialiser pour les tests ;
- migrations versionnables ;
- adapté au volume prévu.

## Conséquences positives

- développement et démonstration hors ligne ;
- réduction des coûts et dépendances externes ;
- données personnelles non envoyées par défaut à un serveur.

## Conséquences négatives

- absence de synchronisation multi-appareils ;
- gestion explicite des migrations ;
- accès à la base limité au processus principal Electron.

## Mesures

- versionner les migrations ;
- tester la création d'une base vide et les migrations ;
- ne jamais exposer directement la connexion SQLite au renderer ;
- définir des repositories pour permettre une évolution future.
