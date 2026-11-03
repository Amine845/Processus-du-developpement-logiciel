# Référentiel CIQUAL complet et mises à jour périodiques

Cette extension remplace le périmètre de démo pour l'utilisation courante : tous les
aliments du fichier officiel et ses 74 constituants sont importés. Le sous-ensemble
reste une fixture historique et ne doit pas être réimporté après un import complet.
Les instructions de ce document prévalent sur celles du sous-ensemble.

## Installation et utilisation sous Windows CMD

Appliquer d'abord les trois patches initiaux, puis le patch 0004 (le ZIP contient
les quatre). Depuis la racine du dépôt, adapter le chemin de votre base existante :

```cmd
npm ci
npm run db:generate
set "DATABASE_URL=file:C:/chemin/absolu/recettes.db"
npm run db:migrate
npm run ciqual:sync
npm run ciqual:status
npm run start:server
```

**Python 3 est requis** pour lire le XLSX officiel, sans aucune bibliothèque
additionnelle. Sous Windows le programme appelé est `python`, sous Linux `python3`.
Pour un autre emplacement : `set "CIQUAL_PYTHON=C:/chemin/python.exe"`.
Node 22 ou ultérieur fournit les API de téléchargement. Les téléchargements exigent
l'accès HTTPS au dépôt Recherche Data Gouv et à son stockage INRAE.

La commande `ciqual:sync` vérifie immédiatement la source officielle et importe la
publication actuelle si nécessaire. `ciqual:status` montre la dernière vérification
réussie, l'identifiant de publication, la dernière erreur et le nombre d'aliments
actifs. Les commandes `start:server` et `server` lancent automatiquement un processus de veille.
La vérification réussie est persistée : redémarrer le serveur ne relance pas un
import. Un réveil horaire vérifie si sept jours sont écoulés ; seul un changement
de publication entraîne un téléchargement et un import.

Pour faire fonctionner la veille séparément, sans lancer le serveur :

```cmd
npm run ciqual:watch
```

La veille fonctionne tant que le processus tourne. Si l'application est fermée,
elle rattrape la vérification à la prochaine ouverture. Ce mécanisme n'installe
aucune tâche Windows et n'exécute rien lorsque l'ordinateur est éteint.
Pour désactiver la veille intégrée : `set "CIQUAL_AUTO_UPDATE=0"`.

## Source et couverture

- DOI officiel : https://doi.org/10.57745/RDMHWY.
- Découverte : API Dataverse `latestVersion`, publication `RELEASED` uniquement.
- Format : fichier français `Table Ciqual ... .xlsx` ; une seule correspondance
  autorisée. Le choix du fichier ne dépend pas d'une URL de téléchargement figée.
- Licence exigée : `etalab 2.0`. Un changement bloque l'automatisation pour revue.
- Contrôle MD5 contre le dépôt, SHA-256 des octets conservé dans chaque audit.
- Le fichier 2025 vérifié contient 3 484 aliments et 74 constituants, soit
  257 816 entrées nutritionnelles avec valeurs, absences, traces et seuils.
- Les deux onglets sont inspectés : codes des constituants et colonnes de teneurs.
  Les définitions attendues sont dans `data/ciqual/constituents-2025.json`.
- Valeurs brutes préservées. Unités g, mg, µg, kcal, kJ, pour 100 g de partie
  comestible ; aucune conversion de volume ou de pièce n'est inventée.
- Tous les constituants sont conservés ; cela n'implique pas qu'ils soient tous
  affichés dans les écrans actuels ou additionnables entre conventions alternatives.
  Énergie Jones/réglementaire et protéines Jones/N × 6,25 restent distinctes par code.

La source 2025, sa licence et l'attribution ont été vérifiées dans le kit initial.
L'automatisation réutilise cette licence et ces conventions uniquement si elles
restent compatibles. Une nouvelle version d'aliments compatible est appliquée
sans modification du code ; de nouvelles définitions nutritionnelles ou unités
nécessitent une revue du parseur et du manifeste avant import.

## Mise à jour atomique et historique

Une migration additive conserve toutes les recettes et tous les ingrédients.
La source est téléchargée et entièrement validée avant la transaction d'écriture.
Le remplacement de la vue courante et de l'état de synchronisation est atomique.
Les valeurs courantes sont remplacées par aliment ; aucune recette ni ingrédient
n'est supprimé. Les codes CIQUAL stables maintiennent les associations existantes.
Un aliment retiré de la source devient `active = false` : il reste accessible aux
recettes déjà associées, avec sa provenance ; les recherches nouvelles l'excluent.
La fonction d'estimation signale son état `active`.

Chaque import complet garde un instantané JSON de **tous** les noms et teneurs
importés dans `CiqualImport.payload`, avec sa provenance, version, empreintes et date.
Avant la première mise à jour, les valeurs des anciens imports de démo sont
archivées également. Ces instantanés sont conservés, sans purge automatique.
Ils permettent la comparaison et un futur outil de restauration ; aucun bouton
de restauration automatique n'est livré.

Une erreur de réseau, de checksum, de parsing ou SQL conserve la version locale.
La dernière erreur est disponible dans `ciqual:status` et dans les logs.
Après échec la veille réessaie au prochain réveil horaire ; après succès elle
attend sept jours. Une réduction du nombre d'aliments supérieure à 10 % ou une
rétrogradation de version bloque l'import pour revue, y compris en cas de concurrence.
Une publication inchangée ne télécharge pas à nouveau le XLSX. Les téléchargements
et la décompression sont bornés ; seules les redirections HTTPS du dépôt vers
son stockage INRAE sont admises. Un nouveau fournisseur de stockage nécessite revue.

La transaction complète peut brièvement retarder les autres écritures SQLite.
Le traitement tourne dans un processus distinct pour garder le serveur HTTP
réactif ; il ne transforme pas SQLite en système à écritures concurrentes illimitées.

## Tests

```cmd
npm run test:ciqual:sync
npm run test:ciqual
npm run test:db
npm run test:repository
npm run test:seed
npm run build:server
```

Les tests de synchronisation sont hors réseau : doublons, 74 constituants, nouvelles
valeurs, renommage, instantanés, conservation des ingrédients, retrait d'aliment,
rollback SQL, panne réseau, cadence, checksum, redirection officielle, publication
inchangée, licence inconnue, rétrogradation et rétrécissement inattendu.
Le fichier officiel complet est aussi validé dans une base temporaire lors de la
préparation de ce kit, en partant de l'ancien sous-ensemble.

## Limites fonctionnelles

La livraison fournit le référentiel local complet et sa synchronisation. Les
routes HTTP et interfaces de sélection/calcul restent à réaliser. Un ingrédient
manuel n'est pas associé automatiquement par son seul nom : une sélection explicite
du code CIQUAL est nécessaire. Les recettes ne changent pas de quantités lors
d'une mise à jour, mais les estimations futures suivent les nouvelles teneurs.
Le calcul d'une recette historique figé sur une version exige un lien explicite
à un instantané et n'est pas implémenté ici.

CIQUAL ne prouve jamais l'absence d'allergènes. Les noms et les valeurs manquantes
ne deviennent pas des garanties de composition ou des indications médicales.
