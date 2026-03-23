Trois modules ajoutés en mars 2026 : Régies & Caisse, extensions SATD, Exécution budgétaire.

## Régies & Caisse (`/regies`)
- `src/pages/RegiesCaisse.tsx` — Page principale avec 3 onglets
- `src/pages/regies/JournalCaisseTab.tsx` — Journal de caisse éditable avec solde cumulé auto, export PDF signable
- `src/pages/regies/BilletageTab.tsx` — Billetage avec comparaison théorique/physique, alertes écarts, PV de caisse PDF
- `src/pages/regies/ModelesRegieTab.tsx` — Générateur actes constitutifs (avances menues, recettes, voyage, temporaire) + PV inventaire
- Ref réglementaires: M9.6, Recueil des régies 2023, Décret 2012-1246 art. 22-23

## SATD — Extensions
- `src/pages/satd/SatdRelancesTab.tsx` — Relances personnalisées (amiable1/2, mise en demeure, poursuite forcée) + PDF lettres
- `src/pages/satd/SatdSurendettementTab.tsx` — Déclaration créances commission surendettement + suivi plan + PDF BdF
- `src/pages/satd/SatdAlertesCreancesTab.tsx` — Aging report >90j/>180j, prévision encaissement, PDF aging multi-établissement

## Exécution budgétaire (`/execution-budgetaire`) — Refactorisé M9-6
- `src/pages/ExecutionBudgetaire.tsx` — Page principale avec 4 onglets
- `src/pages/execution/AlertesCreditsTab.tsx` — Suivi par service M9-6 (AP, VE, ALO, SRH, OPC), codes d'activité, cadence mensuelle, projection 12 mois
- `src/pages/execution/OrdresRecetteTab.tsx` — Détection ordres de recette à saisir : comparaison dépenses/recettes par code d'activité dans le même service
- `src/pages/execution/AmortissementsDBMTab.tsx` — Calcul DBM type 29 : amortissements prévisionnels (immobilisations OPC) − amortissements budgétisés (0AMOR/ALO)
- `src/pages/execution/PrevisionnelTab.tsx` — Prévisionnel N+1 par service M9-6

## Sidebar
- Régies & Caisse ajouté dans "Outils métiers" (icône Landmark)
- Exécution budgétaire ajouté dans "Pilotage AC" (icône TrendingUp)
- SATD: 3 nouveaux onglets intégrés dans la page existante
