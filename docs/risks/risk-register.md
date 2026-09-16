# Registre des risques

## Échelle

- Probabilité : faible, moyenne ou élevée.
- Impact : faible, moyen, élevé ou critique.
- Le propriétaire suit le risque ; l'équipe reste collectivement responsable de la réponse.

## Registre initial actualisé

| ID | Risque | Probabilité | Impact | Réponse prévue | Propriétaire | État |
|---|---|---|---|---|---|---|
| R-01 | Périmètre trop large | Élevée | Élevé | Recentrer sur recettes, ingrédients, auth et courses | Scrum Master | Ouvert |
| R-02 | Sens ambigu de « mobile-first » | Moyenne | Élevé | Confirmer responsive Web, PWA ou natif avec le PO | Scrum Master | Ouvert |
| R-03 | Migration Electron vers Web incomplète | Moyenne | Élevé | Branche dédiée, critères de sortie et suppression progressive | Référent architecture | Ouvert |
| R-04 | Failles d'authentification ou d'autorisation | Moyenne | Critique | Hachage, sessions sûres, contrôles serveur et tests négatifs | Référent qualité | Ouvert |
| R-05 | Secrets exposés dans le bundle ou Git | Moyenne | Critique | `.env.example`, scan secrets et revue de configuration | Référent qualité | Ouvert |
| R-06 | Données CIQUAL obsolètes ou sans provenance | Moyenne | Élevé | DOI, version, date, licence, empreinte et rapport d'import | Référent documentation | Ouvert |
| R-07 | Valeurs CIQUAL manquantes converties en zéro | Moyenne | Élevé | Modèle nullable, validation et fixtures de cas particuliers | Référent qualité | Ouvert |
| R-08 | CIQUAL utilisé à tort pour les allergènes | Moyenne | Critique | Référentiel séparé et avertissement explicite | Référent architecture | Ouvert |
| R-09 | Erreurs de conversion d'unités | Moyenne | Élevé | Unités canoniques et tests paramétrés | Référent qualité | Ouvert |
| R-10 | Interface inutilisable sur téléphone | Moyenne | Élevé | Design mobile-first et tests de viewport | Référent qualité | Ouvert |
| R-11 | Questions produit non résolues | Moyenne | Élevé | Questions groupées et hypothèses écrites | Scrum Master | Ouvert |
| R-12 | Temps estimé confondu avec complexité | Élevée | Moyen | Champs séparés et comparaison en review | Scrum Master | Ouvert |
| R-13 | Pull Requests non relues à temps | Moyenne | Moyen | Créneau de revue et limite WIP | Scrum Master | Ouvert |
| R-14 | Conflits Git pendant la migration | Moyenne | Moyen | Branches courtes et coordination avant déplacement | Scrum Master | Ouvert |
| R-15 | Migrations détruisant des données | Faible | Critique | Tests, sauvegarde et absence de reset production | Référent architecture | Ouvert |
| R-16 | Données personnelles de démonstration | Faible | Élevé | Comptes fictifs et aucune donnée réelle | Équipe | Ouvert |
| R-17 | CI lente ou instable | Faible | Moyen | Tests déterministes, cache contrôlé et jobs séparés | Référent qualité | Ouvert |

## Suivi

Le registre est revu à chaque séance :

- avant la démonstration pour signaler les risques matérialisés ;
- pendant l'organisation du sprint suivant ;
- avant une release ou migration de données.

Chaque mise à jour indique date, évolution, prochaine action et responsable du suivi.

## Historique

| Date | Risque | Changement | Auteur |
|---|---|---|---|
| 2026-09-15 | Tous | Création du registre initial | `[Nom]` |
| `[date du premier rendez-vous]` | Tous | Alignement Web mobile-first, connexion et CIQUAL | `[Nom]` |

