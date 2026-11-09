# S3-T02 — Conserver la sélection CIQUAL jusqu'à la recette enregistrée

Référence locale : S3-T02. Priorité Must ; estimation initiale : 5 points / 8 h-personnes.
Implémentation et validation automatisée livrées ; revue de parcours dans Electron à effectuer.
Aucune tâche locale équivalente identifiée dans cette archive. Aucun ticket distant créé.
Coordination : #33/#69 (référentiel et sélection), #74 (manuel), S3-T01 (classification),
S3-T03 (calcul des macros). Leur clôture n'a pas servi de preuve d'intégration.

## Archive et parcours livré

L'archive `Processus-du-developpement-logiciel-fix-ciqual.zip` contient les composants
CIQUAL et des pages création/détail vides. Le patch crée le formulaire réel et branche
les routes `/recipes`, `/recipes/new`, `/recipes/:id` dans le HashRouter.
L'autocomplétion existante est réutilisée, avec filtre `food` par défaut et choix
explicite de plats, de toutes les catégories ou du mode manuel.

Un choix CIQUAL garde le code textuel et le libellé officiel. Modifier la saisie
invalide le choix, sans associer le nouveau texte par son nom. Le mode manuel doit
être confirmé par l'option « Utiliser … comme ingrédient manuel ». Après relecture,
`ciqualCode: null` désigne ce mode ; une chaîne désigne le mode CIQUAL. Aucun second
CRUD d'ingrédients n'est créé : #74 peut réutiliser `resolveIngredient(tx, name, null)`.

Le formulaire exige un titre, des portions entières, au moins un ingrédient avec
quantité finie strictement positive et unité g/kg/ml/l/piece, ainsi qu'une vraie
instruction par étape. Les étapes sont ajoutables, supprimables et déplaçables ;
leur ordre d'affichage détermine leurs positions persistées (1, 2…). La description
est facultative et ne remplace jamais la préparation. Une quantité vide ou nulle
n'est jamais changée en 1.

Sur erreur réseau ou API, toutes les valeurs et la sélection restent montées dans
le formulaire ; l'utilisateur peut corriger et réessayer. Les requêtes de recherche
obsolètes sont annulées et ignorées même si le transport ne respecte pas l'annulation.
Le bouton de sauvegarde est protégé contre le double envoi pendant la requête.

## Contrat HTTP

POST `/api/recipes` et PUT `/api/recipes/:id` utilisent `RecipeInputDTO` :

```json
{
  "title": "Oeufs brouillés",
  "description": null,
  "servings": 2,
  "ingredients": [
    {
      "canonicalName": "Oeuf cru",
      "ciqualCode": "22000",
      "quantity": 150,
      "unit": "g"
    },
    {
      "canonicalName": "Mélange maison",
      "ciqualCode": null,
      "quantity": 5,
      "unit": "g"
    }
  ],
  "steps": [
    { "instruction": "Battre les oeufs." },
    { "instruction": "Cuire doucement." }
  ]
}
```

Pour compatibilité du mode manuel, omettre `ciqualCode` signifie également `null`.
PUT est un **remplacement complet** : il faut renvoyer les codes à conserver.
L'ID interne `ingredientId` est renvoyé en lecture ; il n'est jamais utilisé comme
code CIQUAL et aucun ID d'ingrédient fourni par le client ne réassocie une ligne.
Les positions d'entrée sont ignorées au profit de l'ordre des tableaux.

Le serveur valide le code dans la transaction d'écriture. Un code inexistant renvoie
400 `INVALID_CIQUAL_CODE`, un code inactif pour une nouvelle association renvoie 400
`INACTIVE_CIQUAL_CODE`. Le libellé envoyé par le client n'est pas une autorité : le
serveur utilise celui du référentiel. Une catégorie préparée ou à classer explicitement
sélectionnée reste autorisée si le code est actif.

GET détail renvoie `ciqualCode` pour chaque ligne et le libellé officiel courant.
Les anciennes recettes restent lisibles avec un code retiré ou reclassé. PUT peut
conserver un code inactif déjà lié à **cette recette**, pour ne pas empêcher une
correction de quantité ou d'étape ; l'existence de ce code dans une autre recette
n'autorise pas sa nouvelle association. Les erreurs de titre restent 409, les
champs invalides 400, les pannes SQL/réseau côté serveur 503 sans détails internes.
La transaction englobe résolution des ingrédients, recette, lignes, étapes et
relecture finale ; tout échoue ou tout est enregistré.

Les réponses de recettes sont `Cache-Control: no-store`. Le client utilise
`VITE_API_URL` (par défaut `http://localhost:3001`) comme CIQUAL. Le serveur local
accepte le préflight JSON des origines HTTP loopback et de l'origine `null` du
rendu fichier Electron, sans cookies ni autorisation CORS pour des origines web
externes. L'API reste liée à 127.0.0.1 ; ce mécanisme n'est pas une authentification.

## Identité et migration

La migration `20261105140000_ingredient_identity` retire l'unicité du seul
`canonicalName`, ajoute une clé d'identité unique et garde un index de recherche
sur le nom. Elle ne supprime aucune ligne et ne change aucun ID, nom, nutriment,
code CIQUAL ni lien de recette existant.

| Cas                                 | Clé d'identité                                       |
| ----------------------------------- | ---------------------------------------------------- |
| Manuel                              | `manual:` + nom exact (trim effectué à l'entrée API) |
| CIQUAL                              | `ciqual:` + code textuel                             |
| Doublon historique d'un code CIQUAL | `legacy:` + ID préexistant                           |

Lors du backfill, les manuels restent manuels. Pour plusieurs anciens ingrédients
liés au même code, le plus petit ID reçoit la clé `ciqual:...` ; les autres reçoivent
une clé `legacy:...` et gardent leurs liens. Les prochaines sélections du code
réutilisent le premier ID, sans fusionner les anciens. Deux codes distincts ayant le
même libellé et un manuel de ce libellé produisent trois identités distinctes.
Aucun rapprochement par accents, casse, similarité ou nom CIQUAL n'est effectué.

`identityKey` est nullable pour les écritures historiques/outils directs qui ne
connaissent pas encore ce champ. `resolveIngredient` peut adopter une ligne manuelle
sans clé, strictement identique et sans code, par ID croissant. Le formulaire, le
repository et le seed utilisent cette fonction commune. Les nouvelles écritures de
#74 devraient aussi l'utiliser, au lieu d'un upsert sur `canonicalName` désormais non
unique. Une clé existante incohérente avec son code est refusée, jamais réutilisée
comme un faux manuel. Les anciennes fonctions d'association explicite ne doivent
pas servir à réattribuer un ingrédient partagé pendant la création d'une recette.

Changer un choix dans une recette change son `RecipeIngredient.ingredientId` ;
l'ancien objet Ingredient partagé n'est pas réassocié et les autres recettes
restent intactes. La lecture emploie le nom officiel courant lorsque CIQUAL existe,
comme les valeurs nutritionnelles de référence courantes, sans modifier les noms
manuels ni inventer des valeurs.

## Nutrition et matériel

L'aliment choisi puis la recette rechargée affichent la prévisualisation existante :
valeurs pour 100 g, code, version, source/attribution et état actif. Les manuels
portent une mention d'absence de données. Aucun champ de macros ou de matériel
apparemment sauvegardé n'est affiché. Le formulaire explique que le total de la
recette relève de S3-T03. Les unités ml/l/piece n'inventent pas une conversion en
masse et les valeurs absentes ne deviennent pas zéro.

## Installation et validation (CMD)

Arrêter le serveur et sauvegarder la base existante avant migration.

```cmd
npm ci
npm run db:generate
set "DATABASE_URL=file:C:/chemin/absolu/recettes.db"
npm run db:migrate
npm run test:recipe:ciqual
npm test
npm run test:repository
npm run test:db
npm run test:seed
npm run test:ciqual
npm run test:ciqual:sync
npm run test:ciqual:classification
npm run test:ciqual:api
npm run lint
npm run format:check
npm run build
npm run build:server
```

`npm test` construit le serveur puis lance les tests unitaires et React/jsdom.
`npm run test:recipe:ui` isole le parcours UI vers la vraie API et la base temporaire.
Vitest utilise une configuration sans les shims Electron afin que les modules Node
et Prisma soient chargés correctement. Les dépendances de test ajoutées sont
Testing Library et jsdom ; elles ne sont pas utilisées par l'application.

Tests ajoutés : migration avec doublons de codes et recette liée ; recherche réelle,
POST/GET/PUT/rechargement avec redémarrage serveur et nouvelle connexion Prisma ;
manuel explicite et omis ; libellé falsifié corrigé ; deux codes de même nom ; code
invalide ou inactif ; maintien d'un ancien code inactif dans sa recette ; absence
d'orphelin et rollback de POST/PUT après échec SQL tardif ; unités/quantités/étapes
invalides ; description vide et étapes multiples. Le test React couvre sélection,
prévisualisation, réordonnancement, enregistrement HTTP, démontage/remontage du
détail, modification invalidant le code, panne avec saisie conservée et réponse
de recherche tardive ignorée.

Le test DOM vérifie les interactions et les données, pas le rendu natif d'Electron.
Parcours de revue : créer avec « Oeuf cru » CIQUAL, ajouter un manuel et deux étapes,
enregistrer, recharger la fenêtre, vérifier code/étapes/provenance ; simuler l'arrêt
du serveur et vérifier la conservation de la saisie au nouvel essai.
