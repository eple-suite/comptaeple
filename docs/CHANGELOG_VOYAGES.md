# CHANGELOG — Voyages scolaires (livraison rattrapage)

Date : 2026-04-25

## Tables Supabase
Aucune migration. Réutilisation `vs_voyages`, `vs_recettes`, `vs_depenses`,
`vs_participants`, `vs_bilans`, `vs_alertes`, `alertes_transverses`.
Préservation totale des données.

## Composants créés
- `src/pages/voyages-v2/lib/regle8EurosBilan.ts` — règle 8 € post-voyage 3 cas + silence don tacite
- `src/pages/voyages-v2/lib/syncVoyageAlertesTransverses.ts` — remontée alertes voyage → cockpit
- `src/pages/voyages-v2/BilanFinancierPageV2.tsx` — page Bilan modèle Créteil 6 parties
- `src/pages/voyages-v2/wizard/StepImportSiecle.tsx` — import SIECLE XLSX/CSV (UTF-8/1252/BOM, 4 modes, sortie auto)
- 6 scripts de recette `scripts/verify-voyages-*.test.mjs`

## Composants modifiés
- `src/App.tsx` — route `/voyages-v2/bilan/:voyageId`

## Documents
Catalogue 32 docs intact (`lib/documentsCatalogue.ts`). Le moteur règle 8 €
post-bilan ajoute dynamiquement :
- `BILAN_coupon_reponse_3_options.docx` (excédent ≤ 8 €)
- `BILAN_mandats_remboursement.csv` (excédent > 8 €)
- `BILAN_deliberation_equilibre_deficit.docx` (déficit)

## Sortie BRUTE des 6 scripts (exit 0)
════ scripts/verify-voyages-alertes-ca.test.mjs ════
═══ Recette P1 — Alertes délai CA ══════════════════════
  ✓ Cas 1: J+15 → 🔴 délai < 30 jours
  ✓ Cas 2: J+45 → 🔶 délai 30-60 jours
  ✓ Cas 3: J+75 → 🔷 délai 60-90 jours
  ✓ Cas 4: J+120 → 🟢 OK
  ✓ Cas 5: départ sans CA → 🔴 ca_manquant
  ✓ Cas 6: engagement < CA → 🔴 gestion de fait

Résultat : 6 OK / 0 KO
EXIT=0

════ scripts/verify-voyages-regle-8eur.test.mjs ════
═══ Recette P2 — Règle 8 € post-voyage ════════════════
  ✓ S1: cas = excedent_remboursement
  ✓ S1: reliquat = 14 €
  ✓ S1: 30 courriers générés
  ✓ S1: courriers + mandats préparés
  ✓ S2: cas = excedent_information
  ✓ S2: reliquat = 5 €
  ✓ S2: 30 coupons générés
  ✓ S2: pas de mandats automatiques
  ✓ S2: doc coupon présent
  ✓ S3: 30 dons tacites enregistrés (silence > délai)
  ✓ S4: cas = deficit
  ✓ S4: délibération d'équilibre générée
  ✓ S4: aucun courrier famille

Résultat : 13 OK / 0 KO
EXIT=0

════ scripts/verify-voyages-import-siecle.test.mjs ════
═══ Recette P3 — Import SIECLE ════════════════════════
  ✓ Import CSV ; UTF-8 → 30 élèves
  ✓ Import CSV ; UTF-8 BOM → 30 élèves
  ✓ Import XLSX UTF-8 → 30 élèves
  ✓ Import CSV Windows-1252 → accents OK (Pénélope)
  ✓ Doublon INE → MAJ (1 créé, 1 doublon écarté)
  ✓ Élève absent du nouvel import → marqué sorti (pas supprimé)

Résultat : 6 OK / 0 KO
EXIT=0

════ scripts/verify-voyages-cout-accompagnateurs.test.mjs ════
═══ Recette — Coût accompagnateurs ════════════════════
  ✓ Tentative imputation accompagnateurs sur familles → bloquante
  ✓ Ligne accompagnateurs sur poste dédié → OK

Résultat : 2 OK / 0 KO
EXIT=0

════ scripts/verify-voyages-documents.test.mjs ════
═══ Recette — 32 documents voyages ════════════════════
  ✓ Catalogue contient 32 documents (≥ 32 minimum)
  ✓ Numéros uniques (pas de doublon)
  ✓ Tous les fichiers ont une extension valide (docx/csv/pdf)
  ✓ Amont : 7 ≥ 7
  ✓ Familles : 9 ≥ 9
  ✓ Concurrence : 4 ≥ 4
  ✓ Budgétaires : 6 ≥ 6
  ✓ Après-voyage : 6 ≥ 6
  ✓ Bilan financier modèle Créteil présent
  ✓ Courrier remboursement (règle 8 €) présent
  ✓ État remboursements présent
  ✓ Arborescence : 5 catégories (Préparation/Familles/Concurrence/Budget-CA/Bilan) couvrent les 6 sections demandées

Résultat : 12 OK / 0 KO
EXIT=0

════ scripts/verify-voyages-bilan-creteil.test.mjs ════
═══ Recette P4 — Page Bilan modèle Créteil ════════════
  ✓ Page Bilan v2 présente
  ✓ Route /voyages-v2/bilan/:voyageId déclarée
  ✓ Partie 1 présente
  ✓ Partie 2 présente
  ✓ Partie 3 présente
  ✓ Partie 4 présente
  ✓ Partie 5 présente
  ✓ Partie 6 présente
  ✓ Tableau 5 colonnes (Poste/Prévu/Réalisé/Écart/Justification)
  ✓ Branchement règle 8 € post-bilan opérationnel
  ✓ Checklist clôture comptable complète (7 items)
  ✓ Module regle8EurosBilan.ts présent
  ✓ Module sync alertes_transverses présent

Résultat : 13 OK / 0 KO
EXIT=0


**TOTAL : 52 assertions OK / 0 KO — exit 0 sur les 6 scripts.**
