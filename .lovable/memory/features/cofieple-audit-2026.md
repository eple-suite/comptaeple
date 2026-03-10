Audit production du module Compte Financier — Mars 2026

## Corrections appliquées

### A. Conformité M9-6
- ✅ 11 composantes réglementaires présentes (faitsCaracteristiques → autresInfos)
- ✅ Note 2 (Principes comptables) rendue DYNAMIQUE : ne mentionne pas les stocks si cptes 31/32=0, ni les amortissements si pas d'immo, ni les provisions si cptes 15=0
- ✅ Edge function generate-annexe transmet balanceSummary avec stocks31, stocks32, provisions15, cl8 pour adaptation conditionnelle
- ✅ Chiffres narratifs alimentés par m9-6engine.ts via ResultatsUI

### B. Technique
- ✅ Fix immoTable: matching amortissement '28'+substring(1) → substring(1,4) pour correspondance correcte 21xxx→281xx
- ✅ Fix AI_SECTIONS type: utilise un tableau littéral au lieu de .filter() pour typage strict
- ✅ Fix tab completion badge: type cast propre Exclude<AnnexeSectionId, 'autoAudit'>
- ✅ Hook ordering: trendData useMemo avant le early return
- ✅ CSV parsing: PapaParse streaming header:true, délimiteur auto-détecté → OK pour gros fichiers Op@le

### C. Supériorité / Export
- ✅ PDF Dém'act enrichi: page synthèse KPI (11 indicateurs tabulés), tableaux comparatifs charges/produits N/N-1
- ✅ Sommaire indexé avec les 11 composantes M9-6
- ✅ Auto-Audit inclus dans le PDF avec observations du comptable
- ✅ Signatures ordonnateur + agent comptable
