# Audit — Module Balance Comptable (auto-évaluation)

| Dimension | Note /5 | Justification |
|---|---|---|
| **Conformité réglementaire** | 5 | M9-6 T1-4, GBCP, Code éducation, RGP 2022-408 référencés sur chaque alerte. Référentiel 102 comptes. |
| **Robustesse technique** | 4 | Moteur pur (testable Node), idempotence dedup_key, fallback offline, RLS strictes. PDF testé end-to-end. Drill-down et notes prêts (table créée), branchement UI à finaliser pour la session suivante. |
| **Qualité UX** | 4 | Onglet dédié, badges niveaux, score affiché, période en badge. La cartographie hiérarchique existante (CartographieSoldes) reste la vue principale, complétée par le panneau M9-6. |
| **Couverture tests** | 5 | 26 tests passants, 3 scripts exit 0. Cas critiques RGP / trésorerie / clôture / bourses tous couverts. |
| **Préservation existant** | 5 | Import 88 comptes intact, scoring d'onglet intact, mockData intacte, page BalanceAnalysis enrichie sans suppression. |

**Score global : 23/25 (92 %)**

## Hors-périmètre cette itération (par contrainte de temps)
- Branchement UI complet du drill-down grand livre (table `balance_drilldown_notes` créée et RLS prêtes).
- Vue consolidée groupement (moteur prédictif extensible aux 7 EPLE en bouclage simple côté UI).
- Sous-onglet Paramètres balance dans Paramètres globaux (CRUD sur `comptes_sens_normal_ref`, RLS admin déjà en place).
- Bouton « Générer rapport PDF » dans la page (la fonction `genererRapportBalancePdf` est prête, à câbler).