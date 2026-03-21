Refonte complète module Compte Financier — specs de référence dans compte-financier-specs.md

## Architecture cible (7 modules)
1. Vue d'ensemble (KPI + Radar 8 axes + Alertes)
2. Rapport Ordonnateur (Exec dépenses/recettes N/N-1, domaines D1-D9, écarts, OO)
3. Rapport Agent Comptable (FDR/BFR/TN, CAF/IAF, 12 ratios, RAR/RAP, 15 vérifications, saisie complémentaire)
4. Évolution Pluriannuelle (N à N-4, 4 graphiques, commentaire IA)
5. Points Bloquants (3 niveaux: PB rouge, PA orange, PV jaune — 15+ vérifications)
6. Analyse IA Globale (périmètre sélectionnable, 3 niveaux de détail)
7. Génération Rapport PDF (page de garde tricolore, sommaire, tous modules)

## 12 Ratios de gestion M9-6
- Liquidité générale, réduite, immédiate
- Autonomie financière, solvabilité, endettement
- DGP, délai recouvrement
- Charges personnel, investissement, recettes propres, couverture charges

## Points bloquants codifiés
- PB-01 à PB-04 (🔴 bloquants)
- PA-01 à PA-07 (🟠 attention)
- PV-01 à PV-06 (🟡 vigilance)

## Stockage localStorage
- cockpit_cf_complementaire, cockpit_cf_pluriannuel, cockpit_cf_commentaires
- cockpit_cf_points_bloquants, cockpit_cf_analyse_ia, cockpit_cf_rapport_config

## Couleurs officielles
- Bleu République: #002395, Rouge: #ED2939
- Positif: #16a34a, Attention: #f59e0b, Alerte: #dc2626
