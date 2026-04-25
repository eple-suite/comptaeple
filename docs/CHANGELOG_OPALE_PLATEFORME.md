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

## Reste à livrer (itération 2)
- Recherche avancée + pgvector RAG.
- Modération académique complète (workflow approbation/rejet/demande modifs).
- Forum Q&R interactif.
- Tableau de bord rectorat (KPI, heatmap, export PDF mensuel).
- Gamification (score, badges, newsletter).
- Extension corpus Assistant Expert (citation fiches publiées).
- 6 scripts vitest de recette et documents finaux RECETTE / VIDEO_TOUR / AUDIT / GUIDE_DEMARRAGE.