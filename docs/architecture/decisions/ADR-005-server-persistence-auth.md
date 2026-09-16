# ADR-005 - Persistance et authentification côté serveur

- **Statut :** accepté au niveau architectural, technologies à sélectionner
- **Date :** `2026-09-16`
- **Décideurs :** équipe de réalisation, besoin validé par le Product Owner

## Contexte

Une application Web avec connexion doit permettre au serveur de vérifier l'identité et les autorisations, puis de conserver recettes, ingrédients, tags et listes de courses.

SQLite embarqué dans Electron ne répond plus à cette architecture. Utiliser uniquement le stockage du navigateur ne fournirait pas une autorité fiable pour les comptes et permissions.

## Décision

Mettre en place :

- une API TypeScript côté serveur ;
- une base de données relationnelle côté serveur ;
- des migrations versionnées ;
- une authentification et des autorisations vérifiées côté serveur ;
- des interfaces de repositories conservant l'indépendance du domaine.

Le framework HTTP, le moteur de base et la stratégie de session sont sélectionnés pendant le Sprint 0 dans des ADR complémentaires ou une mise à jour de celui-ci.

## Options à évaluer

- simplicité locale et en CI ;
- coût et facilité d'hébergement ;
- migrations et transactions ;
- sécurité des sessions ;
- compatibilité avec les compétences de l'équipe ;
- export des données pour la démonstration.

## Conséquences positives

- comptes et autorisations centralisés ;
- accès depuis plusieurs appareils ;
- données partagées ou privées selon les règles choisies ;
- architecture cohérente avec le Web.

## Conséquences négatives

- déploiement plus complexe que l'ancien local-first ;
- gestion des secrets et environnements ;
- risques liés à l'authentification ;
- migrations et sauvegardes à prévoir.

## Mesures

- ne jamais stocker de mot de passe brut ;
- valider toute entrée côté serveur ;
- tester les refus d'accès ;
- appliquer les migrations dans un environnement contrôlé ;
- séparer configuration locale, CI et production ;
- documenter les sauvegardes avant toute démonstration importante.
