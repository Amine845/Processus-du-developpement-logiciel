# Definition of Done

Un élément est terminé seulement lorsque toutes les conditions applicables sont satisfaites.

## Fonctionnement

- [ ] Les critères d'acceptation sont satisfaits.
- [ ] Le comportement a été démontré dans l'application Web.
- [ ] Les cas d'erreur pertinents sont gérés.
- [ ] Aucune régression critique connue n'est introduite.

## Web et mobile-first

- [ ] Le parcours principal est utilisable au viewport mobile retenu.
- [ ] Aucun défilement horizontal involontaire n'apparaît.
- [ ] Les contrôles essentiels fonctionnent au clavier et au tactile.
- [ ] Les états chargement, vide, erreur et succès sont traités.
- [ ] Le viewport desktop ne régresse pas.

## Sécurité et données

- [ ] Authentification et autorisation sont vérifiées côté serveur si concernées.
- [ ] Aucun mot de passe, secret ou donnée sensible n'est journalisé ou envoyé au client.
- [ ] Les entrées sont validées côté serveur.
- [ ] Les migrations nécessaires existent et sont testées.
- [ ] La provenance CIQUAL est conservée si des données nutritionnelles changent.
- [ ] Une information d'allergène inconnue n'est pas présentée comme sûre.

## Code

- [ ] Le code est intégré sur `main`.
- [ ] Les frontières modulaires sont respectées.
- [ ] Aucun secret n'est présent dans le dépôt.
- [ ] Le code mort et les traces temporaires sont retirés.
- [ ] Les contrats client/API sont cohérents.

## Vérifications automatiques

- [ ] Formatage et lint réussissent.
- [ ] Typecheck réussit.
- [ ] Tests pertinents réussissent.
- [ ] Build client et serveur réussit.
- [ ] La couverture des règles modifiées est suffisante.
- [ ] La CI est verte.

## Revue et traçabilité

- [ ] Une Pull Request est liée à l'issue.
- [ ] Au moins un autre étudiant a relu.
- [ ] Les discussions sont résolues.
- [ ] L'auteur a vérifié le diff final.
- [ ] Complexité, temps estimé et temps réel sont renseignés.

## Documentation et produit

- [ ] README, guides et ADR sont mis à jour si nécessaire.
- [ ] Les nouvelles commandes ou variables sont documentées.
- [ ] Les preuves de test sont accessibles.
- [ ] Le résultat est présentable pendant la séance.
- [ ] Le Product Owner peut vérifier les critères.

## Règle

Un élément qui ne satisfait pas une condition applicable n'appartient pas à l'incrément. Il reste en cours ou retourne au Product Backlog.

