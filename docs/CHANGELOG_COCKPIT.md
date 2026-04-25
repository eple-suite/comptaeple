# Cockpit Rectoral — Livraison

## Backend (migration appliquée)
- `groupements_comptables` : identité du groupement (siège, AC, fondé de pouvoir, rectorat)
- `establishments.groupement_id` (FK)
- `alertes_transverses` : table unifiée (module, EPLE, niveau rouge/orange/jaune/info, statut, dedup_key, action_url, ref. réglementaire) + RLS par accès EPLE
- `cockpit_jalons_perso` : jalons calendrier personnels (RLS owner)
- `profiles.profile_role` + `profiles.tour_complete`

## Lib (`src/lib/cockpit/`)
- `seuils.ts` — seuils DAF/M9-6 (trésorerie, FDR, créances, CICF, échéances)
- `calendrierReglementaire.ts` — 11 jalons (M9-6, L.421-11, R.421-77, GBCP, DAF A3)
- `dataBuilder.ts` — agrégation réelle depuis balances, vs_voyages, mp_marches, agents + dataset démo cohérent
- `types.ts` — KPI, EpleResume, AlerteTransverse, CockpitDataset

## Composants (`src/components/cockpit/`)
- `EnTeteRepublique` — bandeau RF + Min. Éducation + Académie Guadeloupe
- `CarteIdentiteGroupement` — AC titulaire, fondé de pouvoir, siège, EPLE rattachés
- `KpiCockpitGrid` — 8 KPI réglementaires avec tooltip formule + source + lien drill-down
- `HeatmapEple` — matrice 7 EPLE × 8 indicateurs colorée + tableau détaillé repliable
- `AlertesTransversesPanel` — filtres niveau/module + recherche + dedup
- `CalendrierTimeline` — frise 12 mois cliquable avec fiche échéance
- `ProfilSwitcher` — AC / Ordonnateur / SG / Régisseur (séparation stricte)
- `PremierUsageBanner` + `TourGuide` (7 étapes, persistance localStorage)
- `ModeDemoBadge` (admin uniquement) + dataset démo de 7 EPLE Guadeloupe
- `exportCockpitPdf.ts` — PDF A4 paysage, en-tête RF, KPI, heatmap, top 10 alertes, signature
- `Cockpit.tsx` — composition complète avec filtrage par profil

## Intégration Dashboard
- Toggle "Cockpit rectoral" / "Vue classique" en haut du `/` (état persistant)
- **Aucune régression** : la vue classique préserve hero, KPI, charts, alertes, outils

## Recette
- `scripts/verify-cockpit.mjs` — **26 / 26 OK** (seuils + calendrier + profils + alertes + export)
- `npx tsc --noEmit` — 0 erreur

## Conformité réglementaire
- M9-6 (calendrier, trésorerie pièce 14, FDR tome 4 art. 43231)
- GBCP 2012-1246 (article 86 — compétences AC)
- Code éducation L.421-11 (vote BP avant 1er nov.) et R.421-77 (CF)
- Circulaire DAF A3 (créances, fonds sociaux)
- Méthode AUDITAC AJI (score CICF)

## Hors-périmètre (non livré dans cette itération)
- Assistant Claude contextuel : ChatEple existant déjà disponible (chantier 8 reposant dessus)

## Branchement rétroactif des modules — `alertes_transverses` ✅

### `src/lib/cockpit/alertesSync.ts`
5 scanners purs + orchestration upsert/clôture :
- **balance** : comptes 47x non apurés (orange), 511 sens anormal (rouge), 531 caisse négative (rouge) — M9-6 tome 4
- **voyages** : autorisation CA manquante (rouge, L.421-14/R.421-20), bilan > 30/60 j (orange/rouge, MENE2407159C)
- **marches** : saucissonnage > 40 k€ HT (rouge, CCP R.2123-1), procédure formalisée requise > 143 k€ HT (rouge, R.2124-1)
- **delegations** : expirée (rouge), expire ≤ 30 j (orange), ≤ 60 j (jaune) — Code éducation R.421-13
- **entretiens** : entretien tenu non finalisé > 60 j orange / > 90 j rouge — Décret 2010-888

### Idempotence
Index unique `(module_origine, establishment_id, dedup_key)` exploité via `upsert(onConflict)`. Les alertes dont la condition disparaît sont automatiquement clôturées (statut `close`, `closed_at`).

### Intégration UI (`Cockpit.tsx`)
- Auto-sync silencieux au premier chargement (hors démo)
- Bouton **« Resync alertes »** (toast récapitulatif : N actives · M clôturées · K erreurs)
- Désactivé en mode démo

### Recette
`scripts/verify-alertes-sync.mjs` — **23 / 23 OK** (règles, niveaux, dedup, agrégation, couverture)
