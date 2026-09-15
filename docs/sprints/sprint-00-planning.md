# Sprint 00 - Mise en place du socle

## Informations

- **Période :** `[à compléter]`
- **Durée :** `[à compléter]`
- **Product Owner :** professeur
- **Scrum Master :** `[Votre nom]`
- **Développeurs :** les quatre étudiants, Scrum Master compris

## Objectif du sprint

> Disposer d'un dépôt partagé, sécurisé, documenté et vérifié automatiquement, dans lequel l'équipe peut développer une première tranche fonctionnelle sans contourner les règles de qualité.

## Résultat attendu

À la fin du Sprint 0 :

- le produit et le MVP sont compris ;
- les rôles et événements sont planifiés ;
- le backlog initial existe dans GitHub ;
- le workflow Git est utilisé par tous ;
- Electron possède une frontière main/preload/renderer sécurisée ;
- l'architecture modulaire minimale est créée ;
- la base de tests fonctionne ;
- une Pull Request déclenche la CI ;
- le build part d'un clone propre ;
- une première fonctionnalité verticale très simple est démontrable.

## Éléments proposés

Les identifiants définitifs doivent devenir des numéros d'issues GitHub.

| ID provisoire | Élément | Priorité | Estimation à faire |
|---|---|---|---|
| S0-01 | Valider la vision et le périmètre avec le Product Owner | Must | Oui |
| S0-02 | Créer GitHub Project, labels et milestones | Must | Oui |
| S0-03 | Ajouter les documents initiaux | Must | Oui |
| S0-04 | Configurer les règles de Pull Request | Must | Oui |
| S0-05 | Corriger la sécurité Electron et créer le preload | Must | Oui |
| S0-06 | Installer Vitest et un premier test | Must | Oui |
| S0-07 | Créer la CI lint, typecheck, tests et build | Must | Oui |
| S0-08 | Créer les dossiers de l'architecture cible | Must | Oui |
| S0-09 | Choisir et initialiser SQLite | Should | Oui |
| S0-10 | Afficher une première recette issue de données locales | Should | Oui |

## Découpage recommandé entre les quatre étudiants

Ce découpage sert au démarrage et ne crée pas de silos permanents.

- binôme A : sécurité Electron, preload et contrats IPC ;
- binôme B : Vitest, CI et rapport de tests ;
- travail collectif : périmètre, backlog et architecture ;
- première tranche verticale : réalisée ou relue par des membres des deux binômes.

Chaque production doit recevoir une revue par une personne de l'autre binôme.

## Questions au Product Owner

- Le suivi des repas réellement consommés appartient-il au MVP ?
- Le MVP gère-t-il un seul ensemble de contraintes par foyer ou plusieurs personnes distinctes ?
- Le choix d'un magasin réel est-il obligatoire ?
- Quels pays, devises et unités doivent être démontrés ?
- Quels nutriments, en plus des quatre macros principales, sont attendus ?
- Quelle est la durée attendue d'un sprint dans le cadre des TP ?

## Risques spécifiques

| Risque | Réponse |
|---|---|
| Passer tout le sprint sur l'outillage | Limiter la configuration et conserver une tranche verticale simple |
| Architecture trop abstraite | Créer uniquement les interfaces nécessaires au premier parcours |
| CI différente des postes locaux | Utiliser `npm ci` et fixer une version commune de Node |
| Product Owner non disponible avant la fin | Envoyer les questions groupées et documenter les hypothèses |

## Scénario de démonstration

1. cloner le dépôt ;
2. installer avec `npm ci` ;
3. exécuter lint, tests et build ;
4. lancer l'application ;
5. afficher une recette locale ;
6. montrer une Pull Request et son pipeline ;
7. montrer la traçabilité issue, branche, PR et test.

## Critères de clôture

- [ ] Objectif du sprint évalué.
- [ ] CI fonctionnelle sur une Pull Request.
- [ ] Aucun accès Node direct depuis React.
- [ ] Au moins un test métier passe.
- [ ] Documentation reliée depuis le README.
- [ ] Backlog exportable.
- [ ] Review et rétrospective produites.

