# Annexe technique

> Académie de la Guadeloupe — Plateforme **comptaeple**
> Document généré le 2026-04-25 — Version 1.0 (présentation rectorat)

## Stack

- Frontend : React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3
- Backend : Lovable Cloud (Supabase managé) — Postgres + RLS + Edge Functions Deno
- IA : Lovable AI Gateway (Gemini 2.5 Pro/Flash, GPT-5)
- PDF : jsPDF + helpers centralisés `src/lib/pdfUtils.ts`
- Tests : Vitest 3 + scripts node

## Tables principales (extrait)

- `establishments`, `agents`, `user_roles`
- `comptes_sens_normal_ref` (M9-6)
- `opale_fiches`, `opale_questions`, `opale_reponses`, `opale_acces_log`
- `voyages`, `fonds_sociaux_decisions`
- `entretiens`, `fiches_poste`
- `habilitations_opale`, `accreditations_chefs_etablissement`

## Migrations

Ordonnées chronologiquement dans `supabase/migrations/`. Toutes irrévocablement appliquées.

## Couverture de tests

Voir `docs/AUDIT_RECETTE.md` (généré par `scripts/run-all-tests.mjs`).
