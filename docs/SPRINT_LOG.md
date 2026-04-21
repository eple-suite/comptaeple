# 📋 SPRINT LOG — Module Action sociale & Enquête Rectorat

Source : `PROMPTS_LOVABLE_FONDS_SOCIAUX.md` (994 lignes, 6 sprints).

## Décisions architecturales prises en autonomie

1. **Module additif sous `/fonds-sociaux/v2/*`** — la page `FondsSociaux.tsx` historique (mocks, FSL/FSC/FSE) reste intacte. Nouvelle entrée de menu « Action sociale & Enquête » ajoutée en parallèle.
2. **Tables Supabase préfixées `fs_`** liées à `establishments(id)` avec RLS via `user_establishments` — conforme à l'architecture existante (voyages, balances).
3. **Pas de table `parametres_etablissement`** : réutilisation de `establishments` + `establishment_branding`.
4. **PDF stack = jsPDF + autoTable** (pas `@react-pdf/renderer`) — choix utilisateur, cohérent avec le reste de l'app.
5. **Année scolaire = string `"2025-2026"`** stocké dans chaque ligne (pas de table dédiée).
6. **Design system existant conservé** — pas de Fraunces / Inter Tight, pas de nouvelle palette HEX. Tokens HSL semantic.
7. **Packages exotiques évités** : pas de `canvas-confetti`, `react-countup`, `tiptap`, `browser-image-compression` (cohérence + poids bundle).

## ✅ Sprint 1 — Fondations BDD (terminé)
- Migration : 5 tables `fs_eleves`, `fs_commissions`, `fs_decisions`, `fs_subventions_rectorat`, `fs_reliquats_ouverture`.
- RLS : view/insert/update/delete par appartenance via `user_establishments` ou rôle admin.
- Triggers `updated_at`, index sur `establishment_id`, voie, type_fonds, recherche full-text français.

## ✅ Sprint 2 — UI Base élèves (terminé)
- `src/pages/fonds-sociaux-v2/fsv2Types.ts` — types TS, helpers `currentAnneeScolaire`, `buildNumeroDecision`.
- `src/pages/fonds-sociaux-v2/useFsData.ts` — hooks React Query : `useEleves`, `useUpsertEleve`, `useDeleteEleve`, `useCommissions`, `useUpsertCommission`, `useDecisions`, `useUpsertDecision`, `useSubventions`, `useReliquats`.
- `src/pages/fonds-sociaux-v2/EleveFormDialog.tsx` — modale ajout/édition élève avec responsables légaux dynamiques.
- `src/pages/fonds-sociaux-v2/EleveImportCsvDialog.tsx` — import CSV via Papaparse, preview, gestion doublons par INE.
- `src/pages/fonds-sociaux-v2/ElevesPage.tsx` — liste + filtres (voie, boursier) + recherche.
- `src/pages/fonds-sociaux-v2/FondsSociauxV2Home.tsx` — accueil 4 tuiles + hero.
- `src/pages/fonds-sociaux-v2/StubPage.tsx` — placeholder pour les sprints à venir.
- Routes ajoutées dans `src/App.tsx` : `/fonds-sociaux/v2`, `/eleves`, `/decisions`, `/commissions`, `/enquete`.
- Entrée menu « Action sociale & Enquête » ajoutée dans `src/components/AppSidebar.tsx`.

## ⏳ Sprints 3 → 6 — À livrer
- **Sprint 3** : `DecisionsPage.tsx` (liste + DataTable) + `NouvelleDecisionWizard.tsx` (5 étapes).
- **Sprint 4** : `src/lib/fs-pdf/` avec 3 templates jsPDF (décision CE, notification famille, pièce comptable) + utilitaires `montantEnLettres`, `numerotation`.
- **Sprint 5** : `src/lib/enquete-rectorat/validation.ts` (16 règles R1-R16) + `EnquetePage.tsx` (accordion Q1-Q17 + KPIs).
- **Sprint 6** : `CommissionsPage.tsx` (cards + détail + PV PDF) + polish accueil + `docs/FONDS_SOCIAUX.md`.

## Points d'attention recette
- Tester l'import CSV avec un fichier réel d'élèves (vérifier mapping INE / responsables).
- Vérifier que les RLS bloquent bien les utilisateurs non rattachés à l'établissement.
- Vérifier compatibilité avec multi-établissement via le sélecteur en haut de page.