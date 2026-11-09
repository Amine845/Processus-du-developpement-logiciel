# Catégories applicatives CIQUAL

## Source vérifiée et extraction

Le classement repose sur le XLSX officiel **Table Ciqual 2025_FR_2025_11_03.xlsx**,
publication Dataverse **1.0**, fichier **666260**, DOI
https://doi.org/10.57745/RDMHWY, licence Etalab 2.0.
MD5 : `0d9758ce23f3f13dd63a005bc1bb4f2c`.
SHA-256 : `5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0`.

Les six premières colonnes vérifiées dans le fichier réel sont :

| Champ officiel        | Champ local       |
| --------------------- | ----------------- |
| `alim_grp_code`       | `groupCode`       |
| `alim_ssgrp_code`     | `subgroupCode`    |
| `alim_ssssgrp_code`   | `detailGroupCode` |
| `alim_grp_nom_fr`     | `groupName`       |
| `alim_ssgrp_nom_fr`   | `subgroupName`    |
| `alim_ssssgrp_nom_fr` | `detailGroupName` |

Codes textuels avec zéros initiaux et libellés officiels (y compris sauts de ligne
et `-`) sont conservés. L'extracteur bloque si ces en-têtes changent. `rawData`
contient désormais `groups` ; les instantanés `CiqualImport.payload` conservent
les groupes et les teneurs source. Chaque ligne référence toujours son import,
sa version et sa provenance avec empreinte du XLSX.

## Politique métier versionnée

`data/ciqual/classification-v1.json` définit les combinaisons exactes des trois codes
observés, leurs libellés et la justification de chaque décision. Aucune règle ne
cherche un mot dans le nom. La catégorie ne prétend pas définir un aliment brut :
pains, beurre, farine, produits en conserve, sauces, confiseries ou boissons
restent des aliments utilisables seuls ou comme ingrédients. Les plats, entrées,
soupes et certaines préparations sucrées prêtes à consommer sont `prepared_dish`.
Les groupes mixtes non résolus sont `unclassified`.

Ordre d'évaluation :

1. Vérifier la combinaison officielle et ses libellés contre la table revue.
2. Appliquer l'exception par **code CIQUAL**, avant la règle du groupe, si son
   groupe attendu est toujours le même.
3. Sinon appliquer la règle de cette combinaison connue, en l'absence d'exception.
4. Groupe absent, nouveau, déplacé ou libellé modifié : `unclassified`.

Les exceptions sont séparées dans `exceptions`, avec groupe attendu, libellé
relu et justification. Ainsi `22003`, `22004`, `22013` (œufs en poudre) restent
`food`, tandis que les omelettes `22500`, `22506` à `22511` sont `prepared_dish`,
bien qu'ils partagent `04/0410/041003`. Un nouveau code dans ce groupe mixte reste
à classer. Un nouveau code d'un groupe homogène connu suit sa règle. Un nouveau
groupe exige une revue ; aucune valeur absente ne devient implicitement `food`.

La catégorie est recalculée à chaque import, même si `rawData` est identique.
`classificationVersion` combine la version lisible et le SHA-256 du mapping ;
`classificationRule` indique la règle ou l'exception utilisée. Toute modification
requiert revue des codes/libellés officiels, justification, incrément de version,
tests et régénération du rapport. Ne pas éditer uniquement la catégorie en SQL :
la prochaine synchronisation réapplique le mapping. Ajouter les corrections
manuelles dans la table d'exceptions versionnée. `applicationTags` est un JSON
applicatif indépendant, initialisé à `[]` et jamais écrasé par l'import.

## Migration et réimport contrôlé (Windows CMD)

Arrêter le serveur et sauvegarder la base SQLite avant l'opération. La migration
est additive : aucun code, nutriment, lien, ingrédient ou recette n'est supprimé.
Les anciennes lignes deviennent `unclassified` tant qu'elles n'ont pas leurs
groupes officiels. Les anciens `rawData` ne permettent pas de reconstruire ceux-ci.

```cmd
npm ci
npm run db:generate
set "DATABASE_URL=file:C:/chemin/absolu/recettes.db"
npm run db:migrate
npm run ciqual:sync > ciqual-sync-report.json
npm run ciqual:status > ciqual-status.json
```

Le premier sync après migration retélécharge le XLSX **même si la publication est
inchangée**, puis applique les protections existantes : checksum, schéma,
constituants, refus de rétrogradation/rétrécissement et transaction atomique.
Un échec laisse les anciennes données lisibles. La veille détecte également un
changement du hash du mapping sans attendre sept jours. Une exécution identique
ne crée pas de doublon ; une synchronisation ultérieure conserve exceptions et
tags. Un aliment retiré devient inactif et reste accessible par code, avec sa
dernière classification. Aucun plat n'est converti automatiquement en `Recipe`.

Le rapport de sync comprend `classification.counts` et
`classification.unclassified` pour les lignes importées. `ciqual:status` montre
les comptes par catégorie/activité et tous les non classés, y compris historiques.
Pour examiner un XLSX local avant de modifier la base, sans écriture SQL :

```cmd
node scripts/ciqual-classification-report.mjs "C:/chemin/Table Ciqual 2025_FR_2025_11_03.xlsx" > classification-preview.json
```

Même commande via `npm run ciqual:classify:report -- "C:/chemin/source.xlsx"`.
Utiliser `node` pour une redirection JSON sans les en-têtes npm.

## API et formulaire

`GET /api/ciqual/foods?q=...&category=food|prepared_dish|unclassified|all`.
Le paramètre omis conserve la compatibilité de l'API : toutes les catégories.
Une chaîne vide, une valeur inconnue ou un paramètre répété renvoie HTTP 400,
`INVALID_CATEGORY`. Les règles de longueur, limites, classement et troncature
existantes sont conservées. Le filtre est appliqué avant classement et pagination.
Les DTO de recherche et de détail exposent `category` et les six champs de groupe.

Le formulaire de sélection utilise explicitement `category=food` par défaut.
Le sélecteur propose « Aliments et ingrédients », « Plats composés », « À classer »
et « Toutes les catégories (y compris À classer) ». Les résultats indiquent la
catégorie et un libellé officiel utile. Le détail nutritionnel rappelle la catégorie.
Changer de catégorie invalide immédiatement le résultat de recherche précédent et
annule sa requête. Le serveur n'a pas de cache de recherche : chaque appel lit la
base courante et les réponses CIQUAL portent `Cache-Control: no-store`. Les recettes historiques et le détail par code ne filtrent ni la
catégorie ni l'activité ; une reclassification ne casse pas leur lecture.

## Compte rendu et validation

Le rapport complet versionné est
`data/ciqual/classification-report-2025.json` : **3 484 lignes**, dont **2 610 food**,
**621 prepared_dish**, **253 unclassified**. La liste exhaustive des 253 entrées
avec groupes et motifs y figure ; elles nécessitent une revue métier progressive,
sans les inclure dans les recherches d'ingrédients par défaut.

| Exemple vérifié dans le XLSX         | Code  | Résultat                  |
| ------------------------------------ | ----- | ------------------------- |
| Oeuf cru                             | 22000 | food                      |
| Farine T45                           | 9440  | food                      |
| Beurre doux à 80 % MG minimum        | 16400 | food                      |
| Semoule de blé dur crue              | 9610  | food                      |
| Graine de couscous à cuire           | 9681  | food                      |
| Couscous au mouton                   | 25029 | prepared_dish             |
| Taboulé préemballé                   | 25608 | prepared_dish             |
| Jaune d'œuf en poudre (groupe mixte) | 22003 | food (exception)          |
| Omelette au fromage (même groupe)    | 22506 | prepared_dish (exception) |
| Dessert, aliment moyen, groupe 00    | 24999 | unclassified              |

`classification-fixture-2025.json` conserve ces lignes et leur provenance.
`tests/fixtures/ciqual-groups-2025.xlsx` est une réduction du vrai fichier :
uniquement ces dix lignes, avec en-têtes et définitions des 74 constituants.
Les valeurs des tests SQL sont synthétiques ; les codes, noms et groupes viennent
du fichier officiel. Une extraction complète et deux imports successifs du XLSX
réel sur une base temporaire complètent les tests automatiques hors réseau.

```cmd
npm run test:ciqual:classification
npm run test:ciqual:sync
npm run test:ciqual:api
npm run test:ciqual
npm run test:db
npm run test:repository
npm run test:seed
npm test
npm run lint
npm run build
npm run build:server
```

Le test de classification couvre migration d'une base contenant une recette liée,
conservation des nutriments avant réimport, backfill, idempotence, tags,
réapplication d'exception, groupes nouveaux/modifiés, filtres HTTP, retrait d'un
code et accès historique. La CI exécute désormais les tests classification et API.
