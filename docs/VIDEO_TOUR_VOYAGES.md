# VIDEO_TOUR — Voyages scolaires (vérifiable en 5 minutes)

## Tableau de bord (`/voyages-v2`)
3 cards : Wizard, Moteur d'alertes, Statut livraison + Sidebar permanente
des alertes voyages (col. droite).

## Nouveau voyage — Wizard 9 étapes
1. Identification (libellé, destination)
2. Type projet (4 nuances radio)
3. Dates & effectifs
4. Recettes (4 statuts financeurs)
5. Dépenses → bandeau règle 8 € prévisionnelle activé
6. Accompagnateurs (poste isolé)
7. Validation CA (date + n° acte)
8. Rétroplanning J-180→J+120
9. Récap + finalisation

## Mes voyages
Liste depuis `vs_voyages`, filtres par statut.

## Élèves — `StepImportSiecle`
Drop XLSX/CSV → preview 10 lignes → mapping détecté → 4 modes (Créer / MAJ / Both / Dry-run)
→ rapport (créés / MAJ / sortis / erreurs). Mention RGPD obligatoire affichée.

## Bilan (`/voyages-v2/bilan/:voyageId`)
6 parties : Identification / Pédagogique / Financier détaillé (5 col.) /
Résultat & règle 8 € (3 cas) / Documents générés / Clôture (checklist 7 items).

## Documents
Catalogue 32 docs (`DocumentsGenerator` + `DocumentsGeneratorReal`),
arborescence par catégorie.

## Mode d'emploi
Page enquêtes rectorat (`EnquetesRectoratPage` 580 lignes).

## Paramètres
Hérités du module Cockpit/Paramètres généraux.
