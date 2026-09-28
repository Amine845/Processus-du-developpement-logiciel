# Environnement de développement local

## État de transition

Le dépôt contient encore le prototype Electron. L'architecture cible est désormais une application Web responsive avec API et base côté serveur. Le Sprint 0 doit établir les commandes finales sans casser durablement `main`.

## Prérequis

- Git ;
- Node.js dans une version commune à l'équipe ;
- npm ;
- le moteur de base de données retenu ;
- éventuellement Docker si l'équipe le décide, sans en faire une obligation non documentée.

La version Node doit être fixée dans `.nvmrc`, `.node-version` ou le champ `engines` de `package.json`.

## Installation actuelle

```bash
git clone <URL_DU_DEPOT>
cd <NOM_DU_DEPOT>
npm ci
npm run dev
```

## Contrat de commandes cible

Après la migration Web, les développeurs et la CI doivent disposer de commandes stables :

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run db:migrate
```

Le nom exact peut varier selon l'organisation retenue, mais une même opération doit utiliser la même commande en local et en CI.

## Configuration

Créer un `.env.example` ne contenant aucun secret :

```dotenv
APP_BASE_URL=http://localhost:5173
API_PORT=3000
DATABASE_URL=<local-development-url>
SESSION_SECRET=<replace-locally>
```

Règles :

- `.env` réel ignoré par Git ;
- aucun secret préfixé `VITE_` ;
- aucune valeur de production dans le dépôt ;
- validation de configuration au démarrage ;
- secrets CI gérés par la plateforme.

## Base de données

```bash
npm run db:migrate
npm run db:seed
```

Les commandes de reset doivent :

- être réservées au développement ou aux tests ;
- vérifier l'environnement ciblé ;
- refuser une cible de production ;
- afficher clairement les données supprimées.

## CIQUAL

Le fichier CIQUAL officiel n'est pas téléchargé au démarrage de l'application. La procédure est décrite dans [`../data/ciqual.md`](../data/ciqual.md).

Le dépôt peut contenir un petit fixture synthétique pour les tests. Le fichier officiel complet est géré selon sa taille et sa licence.

## Données de démonstration

- comptes fictifs uniquement ;
- mots de passe de démonstration non réutilisés ailleurs ;
- recettes et ingrédients fictifs ou correctement licenciés ;
- données déterministes ;
- allergènes connus, absents et inconnus couverts ;
- aucun renseignement personnel réel.

## Résolution des problèmes

Avant d'ouvrir une issue :

1. vérifier la version de Node ;
2. exécuter `npm ci` ;
3. appliquer les migrations ;
4. reproduire depuis `main` à jour ;
5. conserver le message d'erreur complet sans secret ;
6. préciser navigateur, système, viewport et étapes de reproduction.

