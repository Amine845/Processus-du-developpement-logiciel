# Changelog

## CIQUAL — catégories aliments et plats composés

- Conservation des groupes officiels, mapping versionné et migration additive.
- Filtre API et sélection par catégorie ; ingrédients par défaut dans le formulaire.
- Backfill, rapports, exceptions par code et tests de conservation des recettes.

Les changements significatifs du projet sont consignés dans ce fichier.

Le format s'inspire de Keep a Changelog et le projet utilise le versionnement sémantique lorsque des versions sont publiées.

## [Unreleased]

### Added

- Schéma minimal SQLite/Prisma des recettes, ingrédients, lignes et étapes, migration initiale avec contraintes SQL et test d’intégration isolé.

- Documentation initiale du produit, de l'architecture et du processus.
- Modèles d'issues et de Pull Request.
- Compte rendu du premier rendez-vous avec le Product Owner.
- Documentation de la source Ciqual 2025 et de sa stratégie d'import.
- ADR sur l'application web responsive mobile-first et sur la persistance serveur avec authentification.

### Changed

- Cible technique réorientée du prototype Electron vers une application web responsive.
- MVP recentré sur les recettes, les ingrédients, les tags, les allergènes, les macros et la liste de courses.
- Backlog et modèles Scrum complétés avec complexité, temps estimé et temps réel.

### Fixed

-

### Security

-

## Règles

- Décrire les changements visibles ou importants, pas chaque commit.
- Ajouter les entrées dans `Unreleased` pendant le développement.
- Lors d'une release, déplacer les entrées vers une section versionnée et datée.
- Utiliser les catégories `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` et `Security` selon le besoin.

## S3-T02 — Identité CIQUAL dans les recettes

- Formulaire réel avec autocomplétion, choix manuel explicite et étapes ordonnées.
- Codes CIQUAL persistés et validés dans les transactions POST/PUT, relus en détail.
- Identités distinctes par code et mode manuel, migration sans réassociation historique.
- Tests React vers API/SQLite, rechargement, collisions et rollback ; contrats documentés.
