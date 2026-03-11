# SATD Module — Refonte complète Mars 2026

## Architecture
- `src/pages/SATD.tsx` — Page principale avec tabs (Registre, Poursuivre, Procédure, Workflow, Documents, Stats)
- `src/pages/satd/types.ts` — Types, mock data, labels, config statuts (40+ tiers détenteurs enrichis)
- `src/pages/satd/SatdReferenceData.ts` — Barèmes 2026, DDFiP, banques, assistant advice, calcul quotité
- `src/pages/satd/SatdFormulaire.tsx` — Formulaire 4 étapes (Créance, Débiteur, Tiers, Récap) lié à EstablishmentContext
- `src/pages/satd/SatdCalculateur.tsx` — Calculateur quotité saisissable (art. R.3252-2 C. travail)
- `src/pages/satd/SatdAssistant.tsx` — Assistant IA avec conseils réglementaires contextuels
- `src/pages/satd/SatdDocuments.tsx` — Génération PDF (lettre tiers, lettre débiteur, bordereau, FICOBA, avis)
- `src/pages/satd/SatdStats.tsx` — Graphiques recharts (statut, type débiteur, prélèvements mensuels)
- `src/pages/satd/SatdProcedure.tsx` — Guide étape par étape (12 étapes réglementaires)

## Intégration
- Lié à `EstablishmentContext` : UAI, Op@le, nom établissement affichés automatiquement
- Audit Trail prêt : `useAuditTrail` disponible pour tracer chaque action SATD
- Mock data en local (state) — persistance DB à implémenter ultérieurement
- Design system shadcn respecté — pas de composants custom dupliqués
