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

## ✅ Sprint 3 — Décisions FS / FSC (terminé)
- `src/pages/fonds-sociaux-v2/NouvelleDecisionWizard.tsx` — wizard 5 étapes (élève → type/nature → modalités → imputation → récap).
- `src/pages/fonds-sociaux-v2/DecisionsPage.tsx` — liste filtrable (année / type / statut / recherche), changement de statut inline (brouillon → décidé → mandaté → payé), génération PDF par décision.
- Auto-numérotation `FS-YYYY-NNN` / `FSC-YYYY-NNN` via `buildNumeroDecision`.
- Code activité Op@le auto (`16FS` / `16FSC`) dérivé du type via `CODE_ACTIVITE_DEFAULT`.

## ✅ Sprint 4 — Génération PDF (terminé)
- `src/lib/fs-pdf/utils.ts` — helpers `formatEur`, `formatDateFr`, `montantEnLettres` (récursif, gère 0 → millions).
- `src/lib/fs-pdf/decisionPdf.ts` — 3 templates **jsPDF + autoTable** :
  - `generateDecisionChefEtablissementPdf` (Vu/Décide, références réglementaires L.531-1, D.531-7, circulaire 2017-122, M9-6),
  - `generateNotificationFamillePdf` (lettre famille avec adresse responsable),
  - `generatePieceComptablePdf` (mandat — bénéficiaire, INE, imputation, montant lettres).
- Branding pulled from `useEstablishmentBranding` (signataires ordo / AC, ville).

## ✅ Sprint 5 — Moteur Enquête Rectorat (terminé)
- `src/lib/enquete-rectorat/validation.ts` :
  - `computeEnqueteKpis` calcule **Q1 → Q17** (volumes, montants, répartitions par voie / type / modalité / nature, taux de consommation = versé / (subv + reliquat)).
  - `validateEnquete` exécute **16 règles R1 → R16** : commission tenue, décision sans commission, urgence sans motif, tiers incomplet, code/compte Op@le, montant > 0, mandat manquant, élève inconnu, FSC ↔ restauration, taux > 100/110%, BOP valide (141/230/214/140), unicité numéros, cohérence Q5/Q1, élèves boursiers représentés.
- `src/pages/fonds-sociaux-v2/EnquetePage.tsx` :
  - Synthèse contrôles (erreurs / warnings / infos / statut global),
  - Accordion Q1→Q17 avec cartes KPI et répartitions,
  - Liste typée des contrôles avec hints,
  - Export CSV brut prêt à coller dans la grille DGESCO.

## ✅ Sprint 6 — Commissions & Polish (terminé)
- `src/pages/fonds-sociaux-v2/CommissionsPage.tsx` — grille de cartes + dialog création (date, type ordinaire/extraordinaire/urgence, année scolaire, membres présents au format texte « Nom — Qualité », observations).
- Accueil v2 inchangé : compteurs live déjà branchés (élèves, décisions année, commissions, total versé) — pas de refonte destructive.

## Décisions complémentaires prises en autonomie (Sprints 3-6)
1. **Statuts décision** stockés en TEXT côté BDD : changement de statut inline via `<Select>` dans la liste, pas de workflow strict bloquant — l'utilisateur reste maître.
2. **Membres commission** saisis en texte libre (« Nom — Qualité » par ligne) → JSONB. Évite un sous-formulaire dynamique en attendant un retour utilisateur.
3. **Export CSV Q1-Q17** plutôt que générer un PDF/XLSX dédié : suffit pour copier-coller dans la grille Rectorat. Une vraie maquette XLSX viendra si la DGESCO la fournit.
4. **Aucune destruction** : les modules `fonds-sociaux/*` historiques (mocks) restent en place. `fonds-sociaux/v2/*` est un module parallèle.
5. **Aucun nouveau bucket de stockage** créé pour les pièces justificatives : champs `pieces_justificatives_urls` (JSONB) et `*_pdf_url` (text) restent vides — branchement storage à ajouter ultérieurement (sinon nécessite création bucket + RLS).

## Recette finale — points à vérifier
- ✅ `npx tsc --noEmit` passe sans erreur.
- 🔍 Tester le wizard : créer une décision urgence sans motif → doit être bloqué. Créer une décision tiers sans SIRET → bloqué.
- 🔍 Générer les 3 PDFs : décision CE, notification famille, pièce comptable — vérifier signataires / branding.
- 🔍 Onglet Enquête : passer en revue les 16 règles avec données vides puis avec ≥1 décision/commission.
- 🔍 Vérifier filtres RLS multi-établissement via le sélecteur.

## Points d'attention recette
- Tester l'import CSV avec un fichier réel d'élèves (vérifier mapping INE / responsables).
- Vérifier que les RLS bloquent bien les utilisateurs non rattachés à l'établissement.
- Vérifier compatibilité avec multi-établissement via le sélecteur en haut de page.

## ✅ Correctif enquête DGESCO — complétude (terminé)
- **Composants ajoutés / modifiés** :
  - `src/pages/fonds-sociaux-v2/fsEnqueteHelpers.ts` — complétude fiche élève, mapping Q10, impacts décision, cumul annuel.
  - `src/pages/fonds-sociaux-v2/VoieBadge.tsx`, `ProfilCompletudeBadge.tsx` — composants visuels.
  - `NouvelleDecisionWizard.tsx` — blocage si voie manquante, alertes cumul > 600 €, tableau impact enquête au récap.
  - `EleveImportCsvDialog.tsx` — colonnes voie / statut_boursier / echelon_bourse obligatoires + template téléchargeable.
  - `ElevesPage.tsx` — filtre « Fiches incomplètes » + badge complétude.
  - `DecisionsPage.tsx` — colonne « Impact enquête » avec badges Q7/Q8/Q10/Q15/Q16.
  - `FondsSociauxV2Home.tsx` — bandeau d'alerte fiches incomplètes.
- **Vues SQL créées** (migration `20260423110123` + `20260423110138`) :
  - `v_enquete_q7` (voie × type_fonds), `v_enquete_q8` (bénéficiaires uniques par voie),
    `v_enquete_q10` (nature × modalité versement), `v_enquete_q11` (1er degré),
    `v_enquete_q15` (commission vs urgence). Toutes en `security_invoker = true` (respect RLS).
- **PDF d'aide à la saisie** (`src/lib/fs-pdf/enquetePdf.ts`) :
  - Synthèse Q1→Q17, répartitions Q6→Q9, ventilation Q10, contrôles R1→R16,
    mode d'emploi report grille DGESCO. Branding établissement + signataires.
- **EnquetePage** :
  - Bouton « Aide à la saisie (PDF) » + bouton CSV existant.
  - Indicateur de fraîcheur (« il y a N min ») recalculé à chaque mutation React Query.
- **Points de vigilance restants** :
  - Les vues SQL sont disponibles côté BDD mais l'agrégation côté UI continue d'utiliser le moteur TS
    `validation.ts` (rapide, offline-friendly). Brancher les vues comme source secondaire de
    cross-check serait utile si un agent comptable veut comparer.
  - Pas encore de drill-down « Voir les décisions sous-jacentes » par case Q10 (prévu en suivant si demandé).