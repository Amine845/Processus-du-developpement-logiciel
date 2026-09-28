# Utilisation de la Table Ciqual

## Source

- **Producteur :** Agence nationale de sécurité sanitaire de l'alimentation, de l'environnement et du travail (Anses)
- **Jeu de données :** Table de composition nutritionnelle des aliments Ciqual 2025
- **DOI :** [10.57745/RDMHWY](https://doi.org/10.57745/RDMHWY)
- **Dépôt officiel :** [Recherche Data Gouv](https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi%3A10.57745%2FRDMHWY)
- **Version importée :** `[à renseigner lors de l'import]`
- **Date de téléchargement :** `[à renseigner]`
- **Licence :** vérifier et enregistrer le fichier de licence attaché à la version téléchargée avant redistribution

La notice historique CIQUAL 2020 indique qu'elle est annulée et remplacée par la version actualisée. Le projet utilise donc le DOI canonique et conserve la version réellement importée.

## Usage dans l'application

CIQUAL fournit la composition nutritionnelle des aliments. Le MVP utilise au minimum :

- énergie ;
- protéines ;
- glucides ;
- lipides.

Les autres constituants peuvent être importés mais ne sont pas forcément exposés dans le MVP.

## Limite : allergènes

CIQUAL n'est pas utilisé comme preuve d'absence d'allergène. Les allergènes sont stockés dans un référentiel séparé et associés explicitement aux ingrédients.

```text
CIQUAL -> composition nutritionnelle
Allergen -> information de restriction distincte
```

Une information absente ou inconnue ne devient jamais automatiquement `sans allergène`.

## Provenance à conserver

Chaque import conserve :

- nom du jeu de données ;
- DOI ;
- version ;
- date de téléchargement ;
- date d'import ;
- empreinte du fichier source ;
- format ;
- attribution ;
- nombre de lignes lues, acceptées et rejetées.

Chaque ingrédient associé conserve le code CIQUAL utilisé.

## Pipeline d'import

1. télécharger manuellement une version officielle ;
2. vérifier le fichier, la licence et son empreinte ;
3. placer le fichier hors du dépôt si sa taille ou sa licence l'exige ;
4. parser dans un script déterministe ;
5. normaliser les valeurs sans perdre l'information d'origine ;
6. valider codes, unités et plages ;
7. importer dans une transaction ;
8. produire un rapport ;
9. exécuter les tests de non-régression.

Le téléchargement ne doit pas être effectué à chaque démarrage de l'application.

## Valeurs manquantes et particulières

Avant l'implémentation, l'équipe doit inspecter le schéma de la version téléchargée et définir explicitement le traitement de :

- valeurs absentes ;
- valeurs sous un seuil ;
- traces ;
- unités différentes ;
- doublons ou renommages ;
- constituants non utilisés.

Une valeur non numérique ne doit pas être convertie silencieusement en zéro.

## Tests minimaux

- import déterministe d'un petit fixture ;
- code CIQUAL conservé ;
- conversion d'unité correcte ;
- valeur manquante préservée ;
- ligne invalide signalée ;
- transaction annulée en cas d'échec ;
- rapport avec totaux cohérents ;
- calcul manuel vérifié sur quelques aliments connus.

## Attribution utilisateur

L'interface ou une page de crédits doit mentionner au minimum la source Anses et la version CIQUAL utilisée, conformément à la licence officielle attachée au jeu importé.
