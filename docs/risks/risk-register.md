# Registre des risques

## Échelle

- Probabilité : faible, moyenne ou élevée.
- Impact : faible, moyen, élevé ou critique.
- Le propriétaire suit le risque ; il n'est pas seul responsable de sa résolution.

## Registre initial

| ID | Risque | Probabilité | Impact | Réponse prévue | Propriétaire | État |
|---|---|---|---|---|---|---|
| R-01 | Périmètre trop large pour le temps disponible | Élevée | Élevé | Verrouiller le MVP et reporter explicitement les extensions | Scrum Master | Ouvert |
| R-02 | Données nutritionnelles inexactes ou incomplètes | Moyenne | Élevé | Conserver source, unité et date ; tester les calculs | Référent qualité | Ouvert |
| R-03 | Allergènes incomplets dans les données | Moyenne | Critique | Exclusion stricte, état inconnu visible et avertissement | Équipe | Ouvert |
| R-04 | Prix réels difficiles à obtenir | Élevée | Moyen | Saisie locale et interface de fournisseur ; hors MVP si nécessaire | Référent architecture | Ouvert |
| R-05 | Erreurs de conversion d'unités | Moyenne | Élevé | Unités canoniques, conversions limitées et tests paramétrés | Référent qualité | Ouvert |
| R-06 | Conflits Git fréquents | Moyenne | Moyen | Branches courtes, petites PR et coordination avant refactoring | Scrum Master | Ouvert |
| R-07 | Pull Requests non relues à temps | Moyenne | Moyen | Créneau quotidien de revue et limite de travail en cours | Scrum Master | Ouvert |
| R-08 | Logique métier dispersée dans React | Moyenne | Élevé | Architecture modulaire et checklist de revue | Référent architecture | Ouvert |
| R-09 | Configuration Electron non sécurisée | Élevée au départ | Élevé | Corriger le preload et les options pendant le Sprint 0 | Référent architecture | Ouvert |
| R-10 | CI lente ou instable | Faible | Moyen | Cache contrôlé, tests déterministes et séparation des jobs | Référent qualité | Ouvert |
| R-11 | Product Owner peu disponible | Moyenne | Élevé | Regrouper les questions, écrire les hypothèses et planifier les validations | Scrum Master | Ouvert |
| R-12 | Répartition déséquilibrée du travail | Moyenne | Élevé | Visualiser le WIP, rotation des responsabilités et entraide | Scrum Master | Ouvert |
| R-13 | Données de santé ou préférences exposées | Faible dans le MVP | Élevé | Stockage local, aucune donnée réelle dans les tests, pas de télémétrie par défaut | Équipe | Ouvert |
| R-14 | Packaging différent selon les systèmes | Moyenne | Moyen | Choisir les plateformes cibles et tester tôt un build propre | Référent qualité | Ouvert |

## Suivi

Le registre est revu :

- pendant le Sprint Planning ;
- lorsqu'un nouveau risque est découvert ;
- avant la Sprint Review ;
- avant chaque release.

Chaque mise à jour conserve :

- la date ;
- l'évolution de la probabilité ou de l'impact ;
- la prochaine action ;
- la personne responsable du suivi.

## Historique

| Date | Risque | Changement | Auteur |
|---|---|---|---|
| 2026-09-15 | Tous | Création du registre initial | `[Nom]` |

