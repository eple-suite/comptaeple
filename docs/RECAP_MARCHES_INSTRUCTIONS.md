# RECAP — Audit interne du module Marchés publics

Date de l'audit : 25/04/2026 — version pré-itération CCP 2026.
Source comparée : prompt précédent « Marchés » + présent prompt CCP 2026.

## Synthèse

| Lot du prompt précédent | Statut | Composants | Tests |
|---|---|---|---|
| Architecture menu (7 sous-pages) | **FAIT** | `MarchesPage.tsx` + 8 routes, `MarchesDashboard`, `MarchesList`, `MarcheNouveau`, `MarcheDetail`, `MarcheBibliotheque`, `MarcheFournisseurs`, `MarcheModeEmploi`, `MarcheParametres` | manuel |
| Table seuils_ccp horodatée | **PARTIEL** | `mp_seuils_ccp` (4 lignes en base) | seuils EU obsolètes : 216 000 / 5 404 000 au lieu des seuils officiels JOUE 2026 (215 000 / 5 382 000 puis 221 000 / 5 538 000 au 01/04/2026) — base légale à corriger |
| Wizard 7 étapes | **PARTIEL** | `MarcheNouveau.tsx` (`STEPS` = 6 entrées : Besoin / Estimation / Planning / Critères & lots / Vérifications / Génération) | manque l'étape Clauses obligatoires 2026 (env BLOQUANTE + critère CA ≤ 1,5×) → passage à 8 étapes |
| 28+ pièces générées | **PARTIEL** | `docs/pieces.ts` : 11 générateurs (FicheBesoin, RC, CCAP, CCTP, AE, RapportAnalyse, DécisionAttribution, LettreNotification, LettreRejet, PvReception, NoteTracabilite) | manque 17 pièces sur 28+4 attendues — focus prioritaire : DUME, DC4 sous-traitance, convention de groupement, RAR |
| Anti-saucissonnage | **PARTIEL** | `lib/saucissonnageEngine.ts` (cumul 12 mois par famille + concentration top 3) | manque détection « 3+ commandes même fournisseur même famille en 6 mois », interface heatmap fournisseur × famille, intégration croisée Voyages/SDE |
| Clause environnementale | **NON FAIT** côté workflow (champ libre `exigences_environnementales` existe mais non bloquant) | `MarcheNouveau.tsx` checklist `clause_environnementale` informative | aucun blocage à la création |
| Mode d'emploi | **FAIT** structurel (`MarcheModeEmploi.tsx`) | à enrichir avec les chantiers 2026 |

## Pourcentage PARTIEL/NON FAIT

5 lots sur 7 en PARTIEL/NON FAIT → **71 %**. Rattrapage **obligatoire** avant chantiers 7-12 du présent prompt.

## Pré-requis de rattrapage déclenchés dans cette itération

1. Reseed `mp_seuils_ccp` avec les 6 lignes officielles 2026 (FS / Travaux × 2 périodes + lignes État inchangées) ; conserver l'historique en `date_fin`.
2. Refonte du wizard `MarcheNouveau` en 8 étapes avec étape 5 Clauses obligatoires 2026 bloquante.
3. Affinage `lib/retroplanningEngine.ts` selon doctrine DAJ (J-15/J-30/J-45/J-75 et standstill 11 j).
4. Extension `lib/saucissonnageEngine.ts` avec détection répétition fournisseur × famille (≥ 3 sur 6 mois).
5. Ajout 4 générateurs docx dans `docs/pieces.ts` (DUME, DC4, convention groupement, RAR).
6. Création tables `mp_marches_avenants`, `mp_marches_bdc`, `mp_marches_reconductions`, `mp_marches_sous_traitants`, `mp_groupements_commandes`, `mp_groupements_membres`, `mp_archives`.
7. 5 scripts `scripts/verify-marches-*.test.ts` exit 0.

## Composants concernés (vue par fichier)

| Fichier | Action |
|---|---|
| `supabase/migrations/<new>.sql` | Reseed seuils + nouvelles tables cycle de vie & groupement |
| `src/pages/marches/MarcheNouveau.tsx` | 8 étapes, blocage clause env + CA ≤ 1,5× |
| `src/pages/marches/lib/seuilsEngine.ts` | Garde la signature, enrichie pour le seuil européen 215 → 221 |
| `src/pages/marches/lib/saucissonnageEngine.ts` | Nouvelle fonction `detecterRepetitionFournisseur` |
| `src/pages/marches/lib/retroplanningEngine.ts` | Templates DISPENSE / MAPA / MAPA pub / Formalisée alignés DAJ |
| `src/pages/marches/docs/pieces.ts` | + `generateDUME`, `generateDC4`, `generateConventionGroupement`, `generateRAR` |
| `src/pages/marches/MarchesPage.tsx` | + routes `/anti-saucissonnage`, `/groupements`, `/rar` |
| `src/pages/marches/MarcheAntiSaucissonnage.tsx` (nouveau) | Heatmap fournisseur × famille |
| `src/pages/marches/MarcheGroupements.tsx` (nouveau) | Mutualisation multi-EPLE |
| `src/pages/marches/MarcheRAR.tsx` (nouveau) | Export annuel DAJ |
| `scripts/verify-marches-seuils.test.ts` etc. | 5 scripts exit 0 |
