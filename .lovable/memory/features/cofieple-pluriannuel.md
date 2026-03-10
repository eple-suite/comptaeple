Pluriannual architecture (N to N-4) for COFIEPLE module with UX revolution components.

## Database Tables
- `cofieple_exercises`: stores financial results per exercice (FDR, BFR, tréso, CAF, résultat, réserves, score risque) — unique on (user_id, uai, exercice, type_budget)
- `cofieple_extra_indicators`: non-financial indicators (effectifs, boursiers, restauration, hébergement, commentaires) — unique on (user_id, uai, exercice)
- Both have per-user RLS + admin access

## UI Components Added
- `ProgressStepper.tsx`: 6-step workflow guide (Identification → Import → Analyse → Contrôles → Rapports → Diaporama)
- `DashboardOnePage.tsx`: One-page health dashboard with radar chart, structure bars, trend lines, anomaly alerts
- `IndicateursHorsComptables.tsx`: Non-financial indicators form with save to DB
- `PluriannuelSection.tsx`: 5-year comparison with trend charts, variation table, atypical variation detection
- `AuditControlesSection.tsx`: 5 audit algorithms with traffic lights and corrective entries

## Navigation
- 13 tabs total: Accueil, Imports, Check-List, Superviseur, Synthèse, Tableaux, Contrôles, N à N-4, Indicateurs, BA, Rpt Ordo, Rpt AC, Diaporama
- Dashboard One-Page shown on Accueil tab when data is available

## Intelligence Métier
- Automatic detection of atypical variations (CAF drop >20%, FDR/tréso turning negative, jours <30)
- Alerts require user comment for report annexe pre-fill
