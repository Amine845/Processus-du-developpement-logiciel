# ADR-001 - Electron, React et TypeScript

- **Statut :** accepté provisoirement
- **Date :** 2026-09-15
- **Décideurs :** équipe de réalisation

## Contexte

Le dépôt initial utilise Electron, React, TypeScript et Vite. Le projet vise une application desktop et l'équipe doit pouvoir développer une interface interactive avec un outillage commun.

## Décision

Conserver :

- Electron pour le processus desktop ;
- React pour le renderer ;
- TypeScript pour le renderer, le domaine et le processus principal ;
- Vite pour le serveur de développement et le build frontend.

## Raisons

- le squelette existe déjà ;
- un même langage peut être utilisé dans toutes les couches ;
- l'écosystème de tests est adapté ;
- Electron permet une persistance locale et un packaging desktop.

## Conséquences positives

- démarrage rapide ;
- partage de types possible ;
- interface riche ;
- tests automatisables.

## Conséquences négatives

- Electron impose des précautions de sécurité ;
- le packaging multiplateforme devra être configuré ;
- la séparation entre main, preload et renderer doit être rigoureuse.

## Mesures

- désactiver `nodeIntegration` ;
- activer `contextIsolation` et le sandbox ;
- exposer une API preload limitée ;
- valider tous les messages IPC.

