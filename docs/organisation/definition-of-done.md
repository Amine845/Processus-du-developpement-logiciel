# Definition of Done

Un élément du backlog est terminé seulement lorsque toutes les conditions applicables suivantes sont satisfaites.

## Fonctionnement

- [ ] Les critères d'acceptation sont satisfaits.
- [ ] Le comportement a été démontré localement.
- [ ] Les cas d'erreur pertinents sont gérés.
- [ ] Aucune régression connue critique n'est introduite.

## Code

- [ ] Le code est intégré sur `main`.
- [ ] La structure modulaire et les règles de dépendance sont respectées.
- [ ] Aucun secret, mot de passe ou jeton n'est présent dans le dépôt.
- [ ] Les noms et responsabilités sont compréhensibles.
- [ ] Le code mort et les traces temporaires ont été retirés.

## Vérifications automatiques

- [ ] Le lint réussit.
- [ ] Le typecheck réussit.
- [ ] Les tests automatisés réussissent.
- [ ] Le build réussit.
- [ ] La couverture des règles modifiées est jugée suffisante.
- [ ] La CI GitHub est verte.

## Revue

- [ ] Une Pull Request est liée à l'issue.
- [ ] Au moins un autre étudiant a effectué une revue.
- [ ] Les discussions de revue sont résolues.
- [ ] L'auteur a vérifié le diff final.

## Documentation

- [ ] Le README ou les guides sont mis à jour si nécessaire.
- [ ] Les décisions architecturales durables sont consignées dans un ADR.
- [ ] Les nouveaux paramètres ou commandes sont documentés.
- [ ] Les preuves de test nécessaires au rendu sont accessibles.

## Produit

- [ ] Le comportement est accessible dans l'application, sans manipulation cachée.
- [ ] Le résultat est présentable pendant la Sprint Review.
- [ ] Le Product Owner peut vérifier les critères d'acceptation.

## Règle

Si une condition applicable n'est pas remplie, l'élément n'est pas terminé. Il reste en cours ou retourne dans le Product Backlog. Une fonctionnalité presque terminée ne contribue pas à l'incrément.

