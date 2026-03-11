FDR Pro 2026 module architecture — fusion of existing + Claude code.

## Sub-components (src/pages/working-capital/)
- `types.ts`: DonneesFinancieres, Prelevement, ResultatAnalyse, calculerAnalyse(), seuils (30/60/90j)
- `FdrGauges.tsx`: CircularGauge (SVG) + ProgressBarZoned (color zones)
- `FdrStructureBilan.tsx`: Visual actif/passif bilan fonctionnel
- `FdrSimulateur.tsx`: Slider-based prélèvement simulator with max calculation
- `FdrPrelevements.tsx`: Editable DBM tracking table
- `FdrHistorique.tsx`: Pluriannual N-N4 from cofieple_exercises DB
- `FdrTableauFinancement.tsx`: Prélèvements sur réserves (106*) — investissement vs fonctionnement breakdown, coherence check, synthesis phrase

## Prélèvements sur Réserves (classe 106) — Mars 2026
- Extraction: mouvements débiteurs sur comptes 106* dans la balance = prélèvements
- Distinction: investissement (finançant classe 2 au SDE) vs fonctionnement (le reste)
- Contrôle cohérence: écart entre variation réserves N/N-1 et total prélèvements (seuil 100€)
- Interopérabilité:
  - → Annexe Note 7 (Financements): prompt enrichi avec données prélèvements
  - → Annexe Note 11 (Autres infos): prompt enrichi si prélèvements > 0
  - → Rapport Agent Comptable: phrase de synthèse auto-générée + section dédiée
  - → Edge functions generate-annexe + generate-report: données transmises
- Types: PrelevementsReserves ajouté à ResultatsM96 (cofieple_types.ts)
- Calcul: cofieple_m96engine.ts lignes 137-163

## Main Page (WorkingCapital.tsx)
- 4 tabs: Dashboard | Simulateur | DBM | Historique
- Dashboard: KPIs, CircularGauge, ratios, FDR mobilisable breakdown, autonomie financière, bilan structure, **Tableau de financement (prélèvements)**
- Connected to EstablishmentContext + useCofiepleStore for m96engine data
- PDF export via pdfWorkingCapital.ts (kept from existing)

## Key Formulas (DAF A3 / M9-6)
- FDRm = FR - stocks - créances - provisions - engagements non soldés
- Jours = FDRm / (charges annuelles / 365)
- Seuil critique: 30 jours
- ratioLiquidite = (disponibilités + créances) / passif circulant
- tauxCouvertureBFR = (FR / BFR) × 100
