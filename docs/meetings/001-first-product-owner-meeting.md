# Premier rendez-vous avec le Product Owner

## Informations

- **Date :** `2026-09-16`
- **Objectif :** définir et recentrer le projet
- **Participants :** professeur/Product Owner et équipe complète
- **Rédacteur :** `Qwantike, Titiplex`

## Méthode convenue pour chaque séance

- démonstration de l'état actuel et des avancées en cohérence avec le backlog ;
- rétrospective du sprint ;
- organisation du sprint suivant ;
- backlog à jour avec temps estimé, temps réel et complexité.

## Fonctionnalités demandées

- section de gestion des recettes ;
- création, consultation et modification d'une recette ;
- nombre de personnes d'une recette ;
- bibliothèque de recettes ;
- tags, par exemple `gourmand` ;
- recherche par nom et par tag ;
- gestion des ingrédients et de leurs caractéristiques ;
- filtre par allergène ;
- liste d'ingrédients pour les courses ;
- checklist avec progression `X/Y` ;
- ingrédients et macros alimentés par une base de données.

## Orientations

- priorité donnée au processus et à sa démonstration ;
- temps de préparation moins prioritaire ;
- produit plutôt Web et mobile-first ;
- connexion utilisateur ;
- utilisation envisagée de la Table Ciqual de l'Anses.

## Décisions documentaires

- remplacer l'architecture cible Electron par une architecture Web responsive ;
- conserver React, TypeScript, Vite et le monolithe modulaire ;
- marquer les ADR Electron/local-first comme remplacés ;
- recentrer le MVP sur recettes, ingrédients, recherche, allergènes, macros, auth et courses ;
- reporter les objectifs, recommandations, planning, budget, pays, magasin et équipement tant qu'ils ne sont pas confirmés ;
- séparer données nutritionnelles CIQUAL et allergènes ;
- suivre complexité, temps estimé et temps réel séparément.

## Questions ouvertes pour le Product Owner

- Web responsive ou PWA installable ?
- règles d'inscription et de connexion ;
- propriété et visibilité des recettes ;
- rôles et permissions ;
- suppression ou archivage ;
- tags libres ou administrés ;
- allergènes obligatoires ;
- une ou plusieurs recettes par liste de courses ;
- périmètre exact des macros ;
- statut des fonctionnalités antérieurement envisagées.

## Source CIQUAL

- [Table Ciqual 2025 - DOI 10.57745/RDMHWY](https://doi.org/10.57745/RDMHWY)
- documentation interne : [`../data/ciqual.md`](../data/ciqual.md)
