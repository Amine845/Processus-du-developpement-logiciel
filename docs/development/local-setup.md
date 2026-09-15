# Environnement de développement local

## Prérequis

- Git ;
- Node.js dans une version compatible avec `package.json` ;
- npm ;
- un éditeur ou IDE prenant en charge TypeScript.

L'équipe doit choisir et documenter une version commune de Node pendant le Sprint 0, idéalement dans un fichier `.nvmrc` ou `.node-version`.

## Installation

```bash
git clone <URL_DU_DEPOT>
cd <NOM_DU_DEPOT>
npm ci
```

`npm ci` est privilégié lorsque `package-lock.json` existe, car il installe exactement les versions verrouillées.

## Développement

```bash
npm run dev
```

## Contrôles disponibles dans le squelette initial

```bash
npm run lint
npm run build
npm run preview
```

## Scripts cibles du Sprint 0

Les noms suivants constituent le contrat souhaité pour les développeurs et la CI :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

Ils ne doivent être ajoutés au README principal qu'une fois fonctionnels.

## Variables d'environnement

- Les valeurs non secrètes par défaut sont documentées dans `.env.example`.
- Les fichiers `.env` réels ne sont pas commités.
- Aucun secret ne doit commencer par `VITE_`, car les variables exposées au renderer sont publiques dans le bundle.
- Le MVP local-first ne devrait pas nécessiter de secret applicatif.

Exemple futur :

```dotenv
VITE_APP_NAME=Gestion Recette
LOG_LEVEL=info
```

## Base locale

La base SQLite doit être créée dans le dossier de données utilisateur fourni par Electron, jamais dans le dossier source du dépôt.

En développement, une commande de réinitialisation contrôlée pourra être ajoutée :

```bash
npm run db:reset:dev
npm run db:seed
```

Cette commande doit refuser de supprimer une base qui n'est pas explicitement identifiée comme base de développement.

## Données de démonstration

Les fixtures ou seeds doivent :

- contenir des recettes fictives ou correctement licenciées ;
- couvrir plusieurs régimes, allergènes et équipements ;
- inclure des valeurs nutritionnelles connues ;
- rester déterministes pour les tests ;
- ne contenir aucune donnée personnelle réelle.

## Résolution des problèmes

Avant d'ouvrir une issue :

1. vérifier la version de Node ;
2. exécuter `npm ci` ;
3. reproduire depuis `main` à jour ;
4. conserver le message d'erreur complet ;
5. indiquer le système d'exploitation et les étapes de reproduction.

