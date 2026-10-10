# ADR-007 : Architecture de communication Front/Back via API REST locale

- **Statut :** Accepté
- **Date :** Octobre 2026
- **Décideurs :** Équipe Sprint 1

## Contexte

L'application doit faire interagir une interface utilisateur développée en React (Vite) avec une base de données relationnelle locale SQLite gérée par l'ORM Prisma.

Dans l'environnement Electron, deux approches majeures de communication sont envisageables :

1. Le canal IPC natif d'Electron (`ipcMain` / `ipcRenderer`).
2. Une API REST HTTP locale embarquée (Node.js / Express).

## Décision

Nous choisissons d'exposer une **API REST locale légère** propulsée par Express sur `http://localhost:3001` :

- Les DTOs d'échange sont centralisés dans `src/shared/types/recipe.types.ts`.
- La logique d'accès aux données est encapsulée dans une couche Repository et Service côté serveur (`src/server/`).
- Le frontend consomme l'API via un client HTTP dédié (`src/client/api/recipes.api.ts`).

## Conséquences

### Positives

- **Découplage fort :** l'équipe travaillant sur le frontend n'a aucune dépendance directe avec Prisma ou le runtime SQLite.
- **Testabilité aisée :** les routes de l'API peuvent être testées de manière isolée via cURL, Postman ou des scripts de test HTTP, sans devoir instancier la fenêtre Electron.
- **Portabilité :** l'architecture permet, si le produit évolue, de déporter le serveur sur une machine distante sans modifier le code de l'interface React.

### Négatives et contraintes

- Nécessite l'ouverture et l'écoute d'un port local (`3001`), ce qui impose de gérer d'éventuels conflits de ports.
- Légère surcharge réseau locale (sérialisation HTTP/JSON) par rapport aux messages IPC en mémoire native.
