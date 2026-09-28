# ADR-004 - Application Web responsive mobile-first

- **Statut :** accepté sous réserve de confirmation PWA/native
- **Date :** `2026-09-16`
- **Décideurs :** Product Owner et équipe de réalisation

## Contexte

Le prototype initial utilisait Electron et ciblait une application desktop. Lors du premier rendez-vous, le Product Owner a demandé une solution « plutôt Web et mobile-first ».

## Décision

Conserver React, TypeScript et Vite, mais cibler une application Web responsive conçue d'abord pour téléphone. Electron est retiré progressivement du code et du pipeline.

Le responsive Web est l'interprétation de travail. Le Product Owner doit encore confirmer si une PWA installable est attendue. Une application mobile native distincte n'est pas incluse sans nouvelle décision.

## Raisons

- accès depuis un navigateur mobile ou desktop ;
- une seule interface à maintenir ;
- démonstration et déploiement simplifiés ;
- cohérence avec la demande du Product Owner ;
- réutilisation de React, TypeScript et Vite.

## Conséquences positives

- pas d'installateur desktop ;
- déploiement centralisé ;
- tests responsive automatisables ;
- accès depuis plusieurs appareils.

## Conséquences négatives

- besoin d'un serveur et d'un hébergement ;
- authentification et protection réseau nécessaires ;
- migration du prototype Electron ;
- gestion des données hors ligne non garantie.

## Mesures

- définir des viewports de test mobile et desktop ;
- éviter toute dépendance aux API Electron ;
- tester clavier, tactile et absence de défilement horizontal ;
- valider PWA ou responsive simple avec le Product Owner.
