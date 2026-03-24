# SATD Module — Refonte v3 Mars 2026

## Architecture
- `src/pages/SATD.tsx` — Page principale avec tabs enrichis
- `src/pages/satd/types.ts` — Types, mock data, labels, config statuts (40+ tiers détenteurs)
- `src/pages/satd/SatdReferenceData.ts` — V3 : 101 DDFiP, 17 banques, base réglementaire complète, analyse proportionnalité, auto-SATD bourse, 7 contextes assistant
- `src/pages/satd/SatdFormulaire.tsx` — Formulaire 4 étapes
- `src/pages/satd/SatdCalculateur.tsx` — Calculateur quotité (barème 2026)
- `src/pages/satd/SatdAssistant.tsx` — V3 : Assistant IA streaming via edge function + fiches pratiques statiques
- `src/pages/satd/SatdDocuments.tsx` — Génération PDF (6 types de documents)
- `src/pages/satd/SatdStats.tsx` — Graphiques recharts
- `src/pages/satd/SatdProcedure.tsx` — Guide 12 étapes réglementaires
- `src/pages/satd/SatdRelancesTab.tsx` — Relances personnalisées + PDF
- `src/pages/satd/SatdSurendettementTab.tsx` — Surendettement
- `src/pages/satd/SatdAlertesCreancesTab.tsx` — Aging report

## Edge Function IA
- `supabase/functions/satd-assistant/index.ts` — Assistant IA contextuel streaming (Lovable AI)
- System prompt strict : réglementaire EPLE, LPF, CGCT, M9-6
- Contexte du dossier SATD sélectionné envoyé automatiquement

## Données de référence enrichies (2x EssatédéSCO)
- 101 DDFiP (métropole + outre-mer) vs ~15 avant
- 17 banques avec adresses saisies (dont néo-banques)
- 10 natures de créances EPLE avec comptes
- Base réglementaire : 7 textes fondateurs, délais, comptes comptables, 8 types de tiers
- Auto-SATD bourse : conditions, cas pratiques
- Analyse de proportionnalité automatique (favorable/attention/déconseillé)
- 7 contextes assistant (vs 3 avant) : création, banque, employeur, FICOBA, contestation, auto-SATD, irrécouvrabilité
