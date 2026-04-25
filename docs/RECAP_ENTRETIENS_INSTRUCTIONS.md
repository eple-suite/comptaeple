# RECAP — Module Entretiens Professionnels — Audit interne préalable

Date : 2026-04-25 — Référence : décret 2010-888, circulaire MENH1310955C, modèles Guadeloupe (annexes C9 / C9 bis).

## Audit prompt antérieur — statut par item

| # | Item | Statut | Composant / preuve | Test manuel |
|---|------|--------|-------------------|-------------|
| 1 | Architecture menu (8 sous-pages) | PARTIEL | `EntretiensHome.tsx`, `NouvelEntretienWizard.tsx`, `CampagneDashboard.tsx` (3/8) | Routes `/entretiens`, `/entretiens/nouveau`, `/entretiens/campagne` opérationnelles ; manque `recours`, `fiches-poste`, `export-esteve`, `vue-ac`, `aide` |
| 2 | Tables Supabase entretiens_* | FAIT | 11 tables (`entretiens_professionnels`, `_campagnes`, `_competences`, `_fiches_poste`, `_recours`, `_signatures`, `_objectifs_passes`, `_objectifs_futurs`, `_formation_bilan`, `_formation_demandes`, `agents`) | `SELECT` dans Supabase OK |
| 3 | Structure CREP 4 rubriques A/B/C/D | FAIT | `src/lib/entretiens/types.ts` — `RUBRIQUES_C_LABELS` + `SOUS_CRITERES_REGLEMENTAIRES` | Constantes exportées, présentes dans wizard |
| 4 | Structure CREF 5 sous-rubriques F.1-F.5 | PARTIEL | `BilanFormationIA` + `DemandeFormationIA` couvrent F.4-F.5, manque F.1 bilan période / F.2 projet pro / F.3 conseil RH explicite | À compléter dans pdfCrep |
| 5 | Saisie en vrac + moteur IA répartition | FAIT | Edge function `entretiens-repartir-texte`, `iaSchema.ts` | Existant testé |
| 6 | Validation post-répartition éditable | FAIT | `mergeApercu.ts`, wizard étape 5 | UI éditable |
| 7 | Génération PDF identique modèle Guadeloupe | PARTIEL | `pdfCrep.ts` génère PDF jsPDF mais sans gabarit officiel calibré | À aligner — chantier 1 |
| 8 | Wizard 7 étapes | FAIT | `wizard.ts` + `NouvelEntretienWizard.tsx` | 7 étapes présentes |
| 9 | Tableau de bord SG + AC | PARTIEL | `CampagneDashboard.tsx` (SG OK) ; vue AC anonymisée groupement à créer | Chantier 6 |
| 10 | Mode d'emploi 10 chapitres | NON FAIT | Aide globale présente mais pas de chapitre dédié Entretiens | À créer dans /aide |
| 11 | Chatbot Claude RH | NON FAIT | Pas d'edge function ni de bouton flottant Entretiens | Chantier 8 |
| 12 | Tests de recette 4 scripts | FAIT | 5 scripts `verify-entretiens-*.mjs` | Tous exit 0 lors du précédent run |
| 13 | Circuit signatures séquentiel verrouillé | FAIT | Trigger PG `entretiens_signatures_circuit_check` (bloque agent avant N+1 + N+2) | Trigger actif en BDD |
| 14 | Délais recours 15 j / 1 mois | PARTIEL | Table `entretiens_recours` créée, sans wizard ni alertes UI | Chantier 3 |
| 15 | Référentiel fiches de poste | PARTIEL | Table `entretiens_fiches_poste` existe, pas d'UI CRUD | Chantier 7 |
| 16 | Export ESTEVE | NON FAIT | Page absente | Chantier 5 |
| 17 | RGPD : chiffrement + log accès + anonymisation AC | PARTIEL | RLS en place ; chiffrement applicatif et logs d'accès à ajouter | Chantier 9 |

## Bilan
- FAIT : 7
- PARTIEL : 8
- NON FAIT : 2
→ Taux PARTIEL+NON FAIT = 10 / 17 = **59 %** > 30 % → rattrapage requis avant chantiers d'extension.

## Plan de rattrapage exécuté dans cet itération
1. Compléter tables `entretiens_recours`, `entretiens_fiches_poste` ; ajouter `entretiens_acces_log` (RGPD), `entretiens_export_esteve`.
2. Verrouiller circuit signature (trigger déjà actif — augmenté d'une table d'audit `entretiens_etat_log`).
3. Workflow recours hiérarchique + CAP avec compteurs + alertes proactives.
4. Renforcer audit IA via test scripté et UI traçabilité chunk source.
5. Page Export ESTEVE.
6. Vue consolidée AC anonymisée + export EAFC.
7. CRUD fiches de poste avec articulation CREP.
8. Edge function chatbot Claude RH + bouton flottant.
9. Logs d'accès, anonymisation effective, RGPD art. 15.
10. 6 scripts de recette + livrables.

## Acquis à PRÉSERVER strictement
- Trigger `entretiens_signatures_circuit_check` (sécurité réglementaire critique).
- Schéma JSON IA (`IaRepartitionResponse`).
- Constantes `SOUS_CRITERES_REGLEMENTAIRES` (article 3 décret 2010-888).
- Routes `/entretiens`, `/entretiens/nouveau`, `/entretiens/campagne`.
- Tables et FK existantes : aucune altération destructive.