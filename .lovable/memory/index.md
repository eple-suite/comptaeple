# Cockpit Comptable EPLE

## Core
Dark theme. Primary blue, success green, warning orange — all HSL tokens.
Inter + DM Sans. Dark sidebar, light content.
Auth: email/password, auto-confirm enabled. Roles: admin/agent via user_roles.
EstablishmentContext: manages selected establishment across the app.
COFIEPLE data persisted: IDB local + cofieple_snapshots backend sync (multi-device).
Identity fields (ordonnateur, agent_comptable, secretaire_general) stored in establishments table.
Budget annexes linked via establishment_annexes table + UAI.

## Memories
- [Color tokens](mem://design/color-tokens) — Full semantic palette
- [COFIEPLE Audit 2026](mem://features/cofieple-audit-2026) — Compte Financier audit module
- [Compte Financier v2](mem://features/compte-financier-v2) — Module specs with GRETA/CFA/SRH
- [REPROFI Report](mem://features/reprofi-report-model) — Rapport financier structure, CAF formulas
- [M96 Knowledge](mem://features/m96-knowledge-base) — M9-6 nomenclature and rules
- [Voyages Pro 2026](mem://features/voyages-pro-2026) — Voyage budget engine, marchés alertes
- [SATD Updates](mem://features/satd-updates) — SATD module updates
- [Audit Compliance](mem://features/audit-regulatory-compliance) — Regulatory audit rules
- [Chat EPLE Strictness](mem://features/chat-eple-strictness) — Zero hallucination for chatbot
- [Op@le Tutorials](mem://features/opale-tutorials) — 73 modes opératoires intégrés

## Database Tables
- profiles, user_roles, establishments (+ ordonnateur, agent_comptable, secretaire_general), balances, indicators, logs, user_establishments
- cofieple_snapshots (user_id, uai, exercice, budget_type, snapshot_data JSONB) — multi-device sync
- cofieple_exercises, cofieple_extra_indicators, cofieple_audit_trail, cofieple_import_logs
- establishment_annexes (support ↔ annexe linking via UAI, budget_type, compte_185_solde)
- voyage_templates, voyages, voyage_participants, voyage_paiements, voyage_marches_alertes
- All have RLS policies

## Key Business Rules
- FDR mobilisable = FDR brut − Stocks − Créances anciennes − Compte 416000
- Threshold: 30 days of operation minimum
- Op@le number format: P + 5 digits
- UAI lookup via data.education.gouv.fr API
- Compte 185 bridges support/annexe budgets

## Removals
- SettingsPage: removed duplicate establishment add form
- Header: removed hardcoded UAI → dynamic dropdown selector
