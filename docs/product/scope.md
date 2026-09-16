# Périmètre produit

## Objectif du MVP

> Permettre à un utilisateur connecté de gérer des recettes et leurs ingrédients depuis une interface Web mobile-first, de les rechercher et filtrer, d'en calculer les macros et de générer une checklist de courses.

## Inclus dans le MVP

### Authentification

- connexion ;
- déconnexion ;
- maintien sécurisé de la session ;
- protection des opérations réservées à un utilisateur authentifié ;
- gestion minimale des autorisations selon les décisions du Product Owner.

Les modalités d'inscription, de récupération de mot de passe et de rôles restent à confirmer.

### Gestion des recettes

- créer une recette ;
- consulter une recette ;
- modifier une recette ;
- archiver ou supprimer une recette selon la politique retenue ;
- renseigner titre, description, nombre de personnes et étapes ;
- ajouter des ingrédients avec quantité et unité ;
- associer des tags ;
- afficher les macros totales et par portion.

### Bibliothèque et recherche

- afficher la bibliothèque de recettes ;
- rechercher par nom ;
- rechercher ou filtrer par tag ;
- filtrer par allergène ;
- consulter une fiche recette depuis les résultats.

### Gestion des ingrédients

- créer, consulter et modifier un ingrédient ;
- stocker ses caractéristiques utiles ;
- associer un ingrédient à un aliment CIQUAL lorsque possible ;
- gérer ses allergènes séparément ;
- utiliser un même ingrédient dans plusieurs recettes.

### Portions et nutrition

- définir le nombre de personnes de référence ;
- recalculer les quantités pour un nombre de personnes choisi ;
- calculer calories, protéines, glucides et lipides ;
- distinguer valeurs totales et par portion ;
- rendre visibles les données inconnues ou incomplètes.

### Liste de courses

- générer une liste depuis une ou plusieurs recettes ;
- regrouper les ingrédients identiques lorsque leurs unités sont compatibles ;
- adapter les quantités aux portions ;
- cocher et décocher un article ;
- afficher la progression `articles cochés / articles totaux`.

### Interface Web mobile-first

- parcours utilisables sur téléphone ;
- formulaires adaptés au tactile ;
- affichage responsive sur tablette et ordinateur ;
- navigation clavier et libellés accessibles pour les actions principales.

## Fonctionnalités antérieurement envisagées, à confirmer

Ces éléments ne sont pas inclus dans le MVP tant que le Product Owner ne les a pas explicitement priorisés :

- planning hebdomadaire ;
- objectifs caloriques ou protéiques personnalisés ;
- recommandations automatiques ;
- suivi des repas consommés ;
- budget ;
- pays et devise ;
- choix d'un magasin ;
- équipement de cuisine ;
- préférences avancées ;
- gestion du placard ;
- optimisation nutritionnelle.

Ils restent visibles dans le Product Backlog avec le statut `Won't now` ou `À confirmer`.

## Hors périmètre initial

- application mobile native distincte ;
- microservices ;
- commande ou paiement de courses ;
- scraping de supermarchés ;
- diagnostic ou prescription médicale ;
- garantie qu'une recette est médicalement sans allergène ;
- génération de recettes par intelligence artificielle ;
- calcul automatique de besoins médicaux personnalisés.

## Hypothèses à valider

- `mobile-first` signifie application Web responsive et non application native ;
- un utilisateur ne modifie que les recettes qu'il est autorisé à gérer ;
- l'archivage est préféré à une suppression définitive lorsque des listes utilisent encore une recette ;
- CIQUAL est importé comme source nutritionnelle versionnée ;
- les allergènes proviennent d'un référentiel distinct ;
- le temps de préparation peut être affiché plus tard mais n'est pas un critère prioritaire du MVP.

## Gestion des changements

1. le Product Owner décrit la valeur attendue ;
2. les développeurs analysent impact, complexité, temps et risques ;
3. le Product Owner ordonne l'élément dans le backlog ;
4. l'élément n'est pas ajouté silencieusement au sprint en cours ;
5. toute modification de périmètre est consignée dans le compte rendu de séance.

