# Périmètre produit

## Objectif du MVP

Le MVP doit démontrer un parcours complet et fiable :

> Créer un profil de foyer, trouver des recettes compatibles, calculer les portions et macros, construire une semaine de repas et générer la liste de courses correspondante.

## Inclus dans le MVP

### Profil et foyer

- nombre de personnes ;
- pays, devise et système d'unités ;
- allergies et exclusions déclarées ;
- régime alimentaire ;
- préférences et aliments non souhaités ;
- équipements disponibles ;
- budget indicatif.

### Recettes

- catalogue local ;
- fiche recette ;
- ingrédients, quantités, instructions et équipements ;
- filtres par restriction, régime et équipement ;
- adaptation du nombre de portions.

### Nutrition

- calories ;
- protéines ;
- glucides ;
- lipides ;
- valeurs totales et par portion ;
- agrégation quotidienne simple.

### Planification

- planning hebdomadaire ;
- ajout, retrait et remplacement d'une recette ;
- petit-déjeuner, déjeuner et dîner, selon les données disponibles ;
- vérification de la compatibilité des recettes.

### Courses

- agrégation des ingrédients ;
- multiplication par le nombre de portions ;
- normalisation des unités compatibles ;
- possibilité de cocher un article ;
- estimation simple du coût lorsque des prix sont disponibles.

## Extensions après le MVP

- recommandations automatiques pondérées ;
- comparaison entre planifié et consommé ;
- suivi longitudinal des objectifs ;
- gestion du contenu du placard ;
- optimisation combinée nutrition, variété et budget ;
- plusieurs magasins ;
- import de données nutritionnelles ;
- synchronisation entre appareils ;
- comptes utilisateur.

## Hors périmètre initial

- diagnostic ou prescription médicale ;
- garantie qu'un repas est sans allergène ;
- scraping automatique de supermarchés ;
- paiement ou commande de courses ;
- réseau social ;
- génération de recettes par intelligence artificielle ;
- application mobile native ;
- backend distribué ou microservices ;
- modification automatique arbitraire des proportions internes d'une recette.

## Hypothèses

- le premier catalogue est fourni localement ;
- les valeurs nutritionnelles sont exprimées dans une unité canonique, idéalement pour 100 g ;
- les prix, s'ils existent, sont datés et peuvent être incomplets ;
- le pays influence principalement la devise, les unités et les données disponibles ;
- les restrictions sont déclarées par l'utilisateur et dépendent de la qualité des données.

## Gestion des changements de périmètre

Une demande nouvelle suit ce processus :

1. le Product Owner décrit la valeur recherchée ;
2. les développeurs identifient l'impact, les risques et une estimation ;
3. le Product Owner ordonne la demande dans le Product Backlog ;
4. une demande n'est pas ajoutée silencieusement à un sprint en cours ;
5. si l'objectif du sprint devient obsolète, le Product Owner et l'équipe réévaluent explicitement le sprint.

