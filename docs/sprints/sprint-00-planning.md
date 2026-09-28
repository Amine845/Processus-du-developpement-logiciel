# Sprint 00 - Alignement Web et socle de développement

## Informations

- **Période :** `[à compléter]`
- **Product Owner :** professeur
- **Scrum Master :** `Titiplex`
- **Développeurs :** Titiplex, Qwantike, Ahrizmo, Amine845

## Objectif du sprint

> Aligner le dépôt sur la vision Web mobile-first et établir un parcours vertical minimal, vérifié en CI, reliant interface, API et base de données.

## Résultat attendu

- les demandes du premier rendez-vous sont versionnées ;
- Web responsive/PWA est clarifié avec le Product Owner ;
- les anciens ADR restent visibles mais sont marqués comme remplacés ;
- Electron n'est plus une dépendance de l'architecture cible ;
- le framework API, la BDD et la session sont décidés ;
- client, serveur et base peuvent démarrer localement ;
- une migration de base fonctionne ;
- un premier écran mobile-first appelle une API ;
- la CI exécute lint, typecheck, tests et build ;
- le backlog contient complexité, temps estimé et temps réel ;
- l'import CIQUAL est préparé sur un petit fixture, sans import complet prématuré.

## Éléments proposés

| ID | Élément | Priorité | Complexité | Temps estimé |
|---|---|---|---:|---:|
| S0-01 | Valider responsive Web ou PWA avec le PO | Must | À estimer | À estimer |
| S0-02 | Ajouter le compte rendu et réaligner la documentation | Must | À estimer | À estimer |
| S0-03 | Choisir framework API, BDD et session | Must | À estimer | À estimer |
| S0-04 | Créer la structure client/serveur/domaine | Must | À estimer | À estimer |
| S0-05 | Migrer le démarrage Vite hors Electron | Must | À estimer | À estimer |
| S0-06 | Créer la première migration de base | Must | À estimer | À estimer |
| S0-07 | Installer les tests et un test de domaine | Must | À estimer | À estimer |
| S0-08 | Configurer la CI Web | Must | À estimer | À estimer |
| S0-09 | Créer un écran bibliothèque mobile-first minimal | Must | À estimer | À estimer |
| S0-10 | Exposer une route de lecture de recettes | Must | À estimer | À estimer |
| S0-11 | Prototyper l'import d'un fixture CIQUAL | Should | À estimer | À estimer |
| S0-12 | Créer les epics et vues GitHub actualisés | Must | À estimer | À estimer |

## Répartition initiale

- binôme A : squelette serveur, base et migration ;
- binôme B : migration client Web, responsive et CI ;
- travail collectif : choix techniques, backlog et critères ;
- revue croisée entre binômes ;
- le Scrum Master facilite les blocages et contribue au développement.

Cette répartition ne crée pas de silos permanents.

## Questions au Product Owner

- Responsive Web seul ou PWA installable ?
- Qui crée les comptes ?
- Les recettes sont-elles privées, publiques ou partagées ?
- Quels rôles et droits sont nécessaires ?
- Suppression définitive ou archivage ?
- Tags libres ou liste administrée ?
- Quels allergènes pour le MVP ?
- Une liste regroupe-t-elle plusieurs recettes ?
- Le planning, les objectifs et le budget sont-ils explicitement reportés ?
- Quel niveau de macro doit être affiché au-delà de calories, protéines, glucides et lipides ?

## Risques

| Risque | Réponse |
|---|---|
| Migration trop large | Conserver une tranche verticale minimale |
| Choix techniques interminables | Timebox et critères écrits |
| Authentification commencée sans règles produit | Clarifier droits avant CRUD complet |
| Import CIQUAL trop tôt | Fixture réduit et documentation d'abord |
| CI différente du local | Mêmes scripts npm et version Node fixée |

## Démonstration

1. cloner et installer ;
2. appliquer la migration ;
3. lancer client et serveur ;
4. ouvrir la bibliothèque sur un viewport mobile ;
5. charger une recette via l'API ;
6. exécuter lint, tests et build ;
7. montrer issue, branche, PR et pipeline ;
8. présenter le backlog avec complexité, temps estimé et réel.

## Critères de clôture

- [ ] Objectif évalué.
- [ ] Architecture Web décidée et documentée.
- [ ] Build Electron non présenté comme cible.
- [ ] Client, API et migration fonctionnent.
- [ ] CI verte.
- [ ] Au moins un test métier et un test API passent.
- [ ] Un écran mobile est démontrable.
- [ ] Review et rétrospective produites.

