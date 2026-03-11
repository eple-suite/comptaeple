Audit production du module Compte Financier — Mars 2026

## Corrections appliquées

### A. Conformité M9-6
- ✅ 11 composantes réglementaires présentes (faitsCaracteristiques → autresInfos)
- ✅ Note 2 (Principes comptables) rendue DYNAMIQUE
- ✅ Edge function generate-annexe transmet balanceSummary
- ✅ Chiffres narratifs alimentés par m9-6engine.ts via ResultatsUI

### B. Technique
- ✅ Fix immoTable: matching amortissement '28'+substring(1) → substring(1,4)
- ✅ CSV parsing: PapaParse streaming header:true, délimiteur auto-détecté
- ✅ Triple Verrou (Op@le, Exercice, Nature du flux) dans ImportSection

### C. Traçabilité Op@le-Standard (Mars 2026)
- ✅ Table cofieple_audit_trail: immutable (INSERT+SELECT only, pas d'UPDATE/DELETE)
- ✅ Champs: user_id, user_name, uai, exercice, action_type, action_detail, section_id, metadata, created_at
- ✅ action_type: import | edit_note | generate_ai | validate | export_pdf | export_csv
- ✅ Hook useAuditTrail.ts: logAction(), getLastModification(), getAuditHistory()
- ✅ "Dernière modification par [Nom] le [Date] à [Heure]" affiché en bas de chaque NarrativeSection
- ✅ Logging automatique: génération IA, édition manuelle (onBlur), export PDF
- ✅ Certificat de Conformité PDF: Triple Verrou, complétude 11 notes, historique audit, signatures
- ✅ Journal des imports (cofieple_import_logs) synchronisé avec le triple verrou

### D. Export
- ✅ PDF Dém'act enrichi: KPI, tableaux comparatifs, auto-audit, signatures
- ✅ Certificat de Conformité et de Traçabilité (PDF séparé)
