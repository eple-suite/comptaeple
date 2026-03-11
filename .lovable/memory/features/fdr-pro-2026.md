FDR Pro 2026 module architecture — fusion of existing + Claude code.

## Sub-components (src/pages/working-capital/)
- `types.ts`: DonneesFinancieres, Prelevement, ResultatAnalyse, calculerAnalyse(), seuils (30/60/90j)
- `FdrGauges.tsx`: CircularGauge (SVG) + ProgressBarZoned (color zones)
- `FdrStructureBilan.tsx`: Visual actif/passif bilan fonctionnel
- `FdrSimulateur.tsx`: Slider-based prélèvement simulator with max calculation
- `FdrPrelevements.tsx`: Editable DBM tracking table
- `FdrHistorique.tsx`: Pluriannual N-N4 from cofieple_exercises DB

## Main Page (WorkingCapital.tsx)
- 4 tabs: Dashboard | Simulateur | DBM | Historique
- Dashboard: KPIs, CircularGauge, ratios, FDR mobilisable breakdown, autonomie financière, bilan structure
- Connected to EstablishmentContext for establishment data
- PDF export via pdfWorkingCapital.ts (kept from existing)
- Still uses mockData for some values — will connect to m96engine later

## Key Formulas (DAF A3 / M9-6)
- FDRm = FR - stocks - créances - provisions - engagements non soldés
- Jours = FDRm / (charges annuelles / 365)
- Seuil critique: 30 jours
- ratioLiquidite = (disponibilités + créances) / passif circulant
- tauxCouvertureBFR = (FR / BFR) × 100
