# Personas initiaux

Les personas guident la conception mobile-first. Ils devront être ajustés à partir des retours du Product Owner et des démonstrations.

## Persona 1 - Camille, utilisateur mobile

### Contexte

- consulte principalement l'application sur téléphone ;
- possède plusieurs recettes personnelles ;
- veut retrouver rapidement une recette au moment de cuisiner ou de faire les courses.

### Besoins

- connexion simple ;
- bibliothèque lisible sur petit écran ;
- recherche par nom et par tag ;
- fiche recette accessible avec peu d'actions ;
- checklist de courses manipulable d'une main.

### Critère de succès

Camille retrouve une recette, adapte les portions et coche ses achats sans zoomer ni faire défiler horizontalement.

## Persona 2 - Alex, créateur de recettes

### Contexte

- ajoute et corrige régulièrement des recettes ;
- réutilise les mêmes ingrédients ;
- souhaite classer ses recettes avec des tags comme `gourmand` ou `végétarien`.

### Besoins

- formulaire de création clair ;
- gestion des ingrédients sans duplication ;
- ajout d'étapes, quantités, unités et portions ;
- modification ou archivage ;
- prévisualisation des macros calculées.

### Critère de succès

Alex crée une recette complète, la retrouve par tag et la modifie sans créer de doublon d'ingrédient.

## Persona 3 - Sam, utilisateur avec restriction

### Contexte

- déclare un ou plusieurs allergènes ;
- veut éviter les recettes explicitement incompatibles ;
- sait que l'application ne remplace pas une vérification médicale ou l'étiquetage du produit.

### Besoins

- filtres compréhensibles ;
- raison d'exclusion visible ;
- distinction entre allergène connu et information inconnue ;
- avertissement sur les limites des données.

### Critère de succès

Sam peut filtrer la bibliothèque et comprendre pourquoi une recette est exclue ou pourquoi sa compatibilité reste incertaine.

## Questions à valider auprès du Product Owner

- Qui peut créer un compte ?
- Chaque utilisateur possède-t-il ses propres recettes ?
- Existe-t-il un rôle administrateur pour les ingrédients et tags ?
- Une recette est-elle privée, publique ou partageable ?
- La suppression est-elle définitive ou remplacée par un archivage ?
- Quels tags sont prédéfinis et lesquels peuvent être créés librement ?
- Quels allergènes doivent être gérés dans le MVP ?
- Une liste de courses peut-elle regrouper plusieurs recettes ?
- Une PWA installable est-elle attendue ou le responsive Web suffit-il ?

