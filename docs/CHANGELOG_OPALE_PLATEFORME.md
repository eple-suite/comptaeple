# Plateforme académique AIDE Op@le — itération 1 (MVP)

## Base de données (Lovable Cloud)
- Nouveau rôle `moderateur_opale` ajouté à l'enum `app_role`.
- Tables créées avec RLS strict :
  - `opale_fiches`, `opale_fiches_versions`, `opale_fiches_commentaires`,
    `opale_fiches_evaluations`, `opale_fiches_consultations`,
    `opale_fiches_favoris`, `opale_fiches_signalements`,
    `opale_questions`, `opale_reponses`, `opale_acces_log`.
- Index full-text français sur `opale_fiches`, index GIN sur tags.
- Triggers : `update_updated_at`, `opale_recalc_utilite`, `opale_incr_consultation`.
- Helper `opale_user_can_view_fiche(user, fiche)`.

## Frontend
- Sous-menu **Ressources › AIDE Op@le académique** (sidebar) — n'altère pas l'existant.
- Pages livrées :
  - `/ressources/opale` accueil
  - `/ressources/opale/bibliotheque` consultation, filtres, tri
  - `/ressources/opale/nouvelle` wizard 7 étapes (identification, contexte,
    diagnostic, procédure ordonnée, versioning Op@le, visibilité, pré-publication
    avec auto-évaluation RGPD)
  - `/ressources/opale/edition/:id` reprise brouillon
  - `/ressources/opale/fiche/:slug` consultation, vote utilité, signalement
  - Pages stub : mes fiches, recherche, forum, tendances, dashboard, modération, CGU
- Composants partagés : `RappelOfficielBanner` (sur chaque fiche), badges
  fraîcheur / publication / visibilité / version Op@le.
- Lib `src/lib/opale/` : types, slug, anonymisation (regex UAI/SIRET/INE/email/
  téléphone/IBAN), journalisation accès.

## Sécurité & RGPD
- Wizard bloque la publication si une donnée sensible est détectée.
- Auto-évaluation 5 cases obligatoires avant publication.
- Bandeau « complémentaire à l'assistance officielle DAF A3 / Pléiade »
  affiché systématiquement.
- Logs `opale_acces_log` et `opale_fiches_consultations` activés.

## Itération 2 — Livrée le 25/04/2026

### Nouvelles pages réelles (remplacent les stubs)
- `/ressources/opale/recherche` — recherche full-text par mots-clés, module, type, version Op@le, fraîcheur.
- `/ressources/opale/moderation` — workflow approuver / rejeter (avec motif) / demander des modifs. Réservé aux rôles `moderateur_opale` et `admin`. Journalisation systématique.
- `/ressources/opale/mes-fiches` — Tabs brouillons / soumises / publiées / rejetées avec motif de rejet visible.
- `/ressources/opale/forum` — Forum Q&R inter-AC, blocage RGPD à la création de question.
- `/ressources/opale/tendances` — top consultations par module + fiches à re-vérifier.
- `/ressources/opale/dashboard` — KPI consolidés (fiches, consultations, taux d'utilité, modules).
- `/ressources/opale/cgu` — Conditions générales (CC-BY-SA, RGPD, modération, versioning).

### Gamification
- `src/lib/opale/gamification.ts` : 6 badges (premier pas, contributeur actif, rédacteur d'or, expert module, modérateur solidaire, veilleur), formule de score, détecteur de fiches à re-vérifier.

### Tests de recette (6 scripts vitest — 42 assertions, exit 0)
- `verify-opale-anonymisation.test.ts` (8 tests RGPD)
- `verify-opale-types.test.ts` (5 tests référentiel)
- `verify-opale-gamification.test.ts` (6 tests score + badges)
- `verify-opale-routing.test.ts` (14 tests routes & sidebar)
- `verify-opale-rappel-officiel.test.ts` (4 tests positionnement)
- `verify-opale-wizard-rgpd.test.ts` (5 tests wizard 7 étapes)

### Documents
- `docs/RECETTE_OPALE.md` — récapitulatif et conformité.
- `docs/AUDIT_OPALE.md` — audit interne sécurité, RGPD, institutionnel.
- `docs/GUIDE_DEMARRAGE_OPALE.md` — guide utilisateur 7 étapes + charte.
- `docs/VIDEO_TOUR_OPALE.md` — script visite guidée 4'30".

### Build
`bunx tsc --noEmit` : exit 0.

### Reste à venir (itération 3 facultative)
- Intégration RAG pgvector des fiches publiées dans l'Assistant Expert.
- Newsletter mensuelle des fiches les plus consultées.
- Heatmap géographique académique.