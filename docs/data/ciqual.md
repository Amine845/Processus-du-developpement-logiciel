# Référentiel local CIQUAL 2025 — sous-ensemble de 30 aliments

## Périmètre et décision de format

Cette livraison fournit **30 aliments et 4 constituants**, sans intégration exhaustive.
Aucune base n'est supposée préremplie. Les futures migrations de version, les autres
constituants, les routes HTTP et les écrans de sélection/calcul sont des travaux distincts.
Les fonctions locales `scripts/ciqual-reference.mjs` permettent déjà recherche, liaison
explicite par code et estimation par masse en grammes.

## Source inspectée avant modélisation

- Producteur : Anses, unité Observatoire des Aliments.
- DOI : https://doi.org/10.57745/RDMHWY ; dépôt officiel Recherche Data Gouv, V1.0.
- Version retenue : `2025-V1.0-2025-11-03` (publication du dépôt : 19 novembre 2025).
- Fichier : `Table Ciqual 2025_FR_2025_11_03.xlsx`.
- Téléchargement : 2026-11-02 ; URL : https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260.
- SHA-256 du XLSX : `5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0`.
- MD5 du XLSX : `0d9758ce23f3f13dd63a005bc1bb4f2c`, conforme au dépôt.
- Documentation officielle : `Table Ciqual 2025 doc FR_2025_11_19.pdf`,
  https://entrepot.recherche.data.gouv.fr/api/access/datafile/666748.
- Inspection : onglet `composition nutritionnelle`, 3 484 lignes d'aliments,
  84 colonnes ; onglet `codes INFOODS`, 74 constituants avec `ORIGCPCD` et libellés.
  Les cellules de teneur sont des textes (virgule décimale, tiret, `traces`, `< ...`).
  Les en-têtes comprennent des retours à la ligne conservés dans le manifeste.
- Documentation consultée : réutilisation p. 4, base et manquants p. 9,
  traces p. 10 ; les intitulés et codes sont vérifiés dans les deux onglets du XLSX.

Le format d'entrée de l'importeur est un **JSON UTF-8 dérivé explicitement du XLSX**,
`ciqual-subset-json-v1`, et non un format présenté comme officiel. Le script
`extract-ciqual.py` contrôle le SHA-256 officiel et les en-têtes avant extraction.
Le manifeste fixe colonnes, unités, version et attribution. Aucune dépendance Python
n'est nécessaire pour importer le JSON livré ; Python/openpyxl sert uniquement à le
régénérer. Le XLSX officiel et sa documentation sont également fournis dans le kit.

| Code ORIGCPCD | Colonne Excel (1-based) | Constituant                     | Unité / base |
| ------------- | ----------------------- | ------------------------------- | ------------ |
| 328           | 11                      | Énergie, règlement UE 1169/2011 | kcal / 100 g |
| 25003         | 16                      | Protéines brutes, N × 6,25      | g / 100 g    |
| 31000         | 17                      | Glucides                        | g / 100 g    |
| 40000         | 18                      | Lipides                         | g / 100 g    |

Les protéines Jones (code 25000) et l'énergie Jones ne sont pas mélangées aux
conventions retenues. La base est 100 g de **partie comestible**, pas 100 ml ni une pièce.
Les identifiants de constituants sont `ORIGCPCD` ; ce ne sont pas les tags INFOODS.

## Échantillon et reproduction

`data/ciqual/selection.json` fixe les 30 codes sélectionnés, couvrant légumes,
fruits, féculents, légumineuses, farine, viande, lait, huile et sucre. L'état exact
(cru, cuit, appertisé, etc.) figure dans chaque nom officiel ; il doit être choisi
explicitement. Aucun code n'est deviné par similarité de nom.

```cmd
python -m pip install openpyxl==3.1.5
python scripts/extract-ciqual.py chemin\ciqual-2025.xlsx extrait.json
```

Les noms et teneurs sont copiés sans normalisation. Les métadonnées de préparation
proviennent du manifeste revu ; modifier le manifeste est une décision de données
à faire relire, pas une option implicite de l'importeur. Le contrôle de hash assure
l'identité des octets téléchargés, pas une signature numérique de l'Anses.

## Modèle et conservation

`CiqualFood` est distinct d'`Ingredient`. Sa clé est le code officiel textuel stable.
`Ingredient.ciqualCode` est nullable, référencé par clé étrangère : `null` signifie
sans association CIQUAL ; une association conserve l'identité et le nom manuel.
Les ingrédients ne sont jamais créés automatiquement par import CIQUAL.
La migration ajoute trois tables et une colonne nullable, sans reconstruction,
suppression ou modification des anciennes lignes. Recettes, étapes, quantités et
contraintes existantes restent conservées.

`CiqualImport` garde source, version, format, téléchargement, date d'import,
SHA-256 du XLSX officiel et SHA-256 du JSON effectivement lu, licence, attribution
et compteurs. `CiqualNutrient` garde code de constituant, unité, texte brut, état et
valeur numérique éventuelle. `CiqualFood` garde version, base et import d'origine.

Une seule version est gérée. Un code déjà connu avec des données différentes fait
rejeter le fichier entier. Une future mise à jour de version nécessite une stratégie
distincte, sans écraser silencieusement les données ou leur provenance.

## Commandes explicites (Windows CMD)

Depuis la racine du projet, après application des patchs :

```cmd
npm ci
npm run db:generate
set "DATABASE_URL=file:C:/chemin/absolu/recettes.db"
npm run db:migrate
npm run ciqual:import -- data/ciqual/subset-2025.json
npm run ciqual:import -- data/ciqual/subset-2025.json
npm run test:ciqual
```

L'importeur exige une variable exportée ; il ne charge pas le `.env` serveur.
Utiliser le chemin absolu de la base réellement migrée, pas un autre fichier neuf.
Aucun téléchargement, import, seed ou reset n'est lancé au démarrage du serveur.
Ne pas utiliser `db:init` comme commande d'import CIQUAL.

## Politique atomique et rapport

Tout est validé avant écriture : JSON, métadonnées épinglées, 1 à 50 aliments,
codes décimaux textuels non vides, unicité dans le fichier, nom, quatre constituants,
syntaxe et plages (0–100 g ; 0–1000 kcal par 100 g).
Tous les aliments nouveaux et l'audit sont ensuite écrits dans une transaction Prisma.
Un doublon de code dans le fichier est une erreur, même s'il a des teneurs identiques.
Un code existant identique est inchangé ; un conflit ou une erreur SQL annule tout.
Un réimport des mêmes octets ne crée aucun aliment ni nouvel audit. Un JSON aux
mêmes données avec d'autres octets crée un audit distinct, sans doublon alimentaire.

Le rapport JSON distingue `rowsRead`, `rowsValidated`, `rowsAccepted`,
`rowsRejected`, `created`, `unchanged`, `replay` et les erreurs par numéro de ligne
**logique d'aliment** (1-based ; 0 pour le fichier/la transaction).
`rowsAccepted + rowsRejected = rowsRead`. En cas d'échec atomique toutes les lignes
lues sont rejetées, même si certaines étaient valides ; `rowsValidated` conserve ce
nombre de lignes syntaxiquement valides. Un JSON illisible a zéro ligne comptable
et une erreur fichier. Code retour 0 = succès, 1 = échec.
Les échecs ne laissent pas d'audit en base : conserver stderr pour leur historique.
Les audits réussis décrivent le fichier ; les aliments inchangés restent liés à leur
premier import. Ils ne constituent pas une table d'appartenance de tous les imports.

## Valeurs particulières et conversions

| Texte source        | État      | Valeur stockée | Estimation                        |
| ------------------- | --------- | -------------- | --------------------------------- |
| `0`                 | exact     | 0              | zéro explicite                    |
| `-` ou cellule vide | missing   | null           | inconnue                          |
| `traces`            | trace     | null           | non quantifiée                    |
| `< 0,2`             | less_than | 0.2 (seuil)    | borne supérieure exclusive        |
| `1,25`              | exact     | 1.25           | valeur proportionnelle à la masse |

La virgule est remplacée par un point uniquement dans la valeur numérique ; le
texte brut est préservé. Aucun remplacement par zéro ni par demi-seuil. Aucune
conversion kcal/kJ ou ml/g n'est faite : les colonnes choisies ont déjà les unités
attendues. Les estimations exactes multiplient par `grammes / 100` ; les seuils
produisent uniquement `upperBoundExclusive`, les absences/traces restent nulles.
Le test carotte vérifie un doublement à 200 g ; le fixture synthétique vérifie les
quatre états et un seuil de 0.2 donnant une borne de 0.1 à 50 g.
Un total de recette, la couverture et le traitement des masses manquantes restent
à concevoir : additionner seulement les constituants connus serait trompeur.

## Licence et attribution

Le dépôt V1.0 déclare **Etalab Open License 2.0**. La documentation officielle p. 4
confirme la réutilisation avec indication de la source, version et date, sans
dénaturation. Cette licence autorise reproduction, adaptation et redistribution,
y compris commerciale, sous réserve d'attribution et des autres conditions.
Le texte est conservé dans `data/ciqual/LICENSE-etalab-2.0.md` (source Etalab :
https://github.com/etalab/licence-ouverte/blob/master/LO.md).
Les 30 lignes sont un extrait, pas une nouvelle table officielle exhaustive.

Attribution à reprendre dans toute future interface exposant ces données :
**Anses. 2025. Table de composition nutritionnelle des aliments Ciqual. https://doi.org/10.57745/RDMHWY** Version V1.0, fichier du 03/11/2025,
consulté le 02/11/2026. Extrait de 30 aliments et 4 constituants.
La fonction d'estimation renvoie attribution et version ; cette livraison ne crée
pas d'écran de crédits dans le front.

## Tests et limites

`npm run test:ciqual` utilise uniquement des bases temporaires : migration avant/après
avec lignes existantes, import réel des 30 aliments, réimport, mêmes données avec
nouveaux octets, doublon interne, ligne invalide, JSON invalide, unité non prévue,
conflit sur code, échec SQL sur le deuxième aliment avec rollback du premier et de
l'audit, liaison/déliaison par code, recherche, estimation et commandes CLI.
Les cas synthétiques ne constituent pas des valeurs CIQUAL à redistribuer.
La CI exécute ce test ; aucune base développeur n'est utilisée par les fixtures.

Les allergènes restent un référentiel séparé : **l'absence d'information n'est
jamais une preuve d'absence d'allergène**. Ni le nom ni les teneurs ne sont utilisés
pour inférer automatiquement un statut « sans allergène ».
