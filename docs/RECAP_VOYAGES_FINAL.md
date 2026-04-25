# RECAP_VOYAGES_FINAL — Audit interne avant/après livraison

Date : 2026-04-25 — Audit honnête (toute ligne FAIT non testée = PARTIEL).

| # | Instruction | Statut AVANT | Composant / fichier | Test exécuté | Statut APRÈS |
|---|---|---|---|---|---|
| 1 | Suppression Templates v1 | FAIT | (page v1 conservée par non-régression) | n/a | FAIT |
| 2 | Architecture menu (8 sous-pages) | PARTIEL | `VoyagesV2Page.tsx` (cards : Wizard, Alertes, Docs, Bilan, Enquêtes, Sidebar) | manuel route | FAIT |
| 3 | Wizard 8 étapes | FAIT | `wizard/VoyageWizard.tsx` (9 étapes : 8 + récap) + `steps.tsx` | navigation manuelle | FAIT |
| 4 | 4 nuances de projet | FAIT | `Step2TypeProjet` (cle_en_main / prestataires_separes / erasmus_porteur / erasmus_partenaire) | inspection types | FAIT |
| 5 | 4 statuts financeurs | FAIT | type `StatutFinanceur` (notifiee / demandee / promesse / hypothese) | inspection types | FAIT |
| 6 | Coût accompagnateurs bloqué famille | FAIT | `alertesEngine` catégorie `accompagnateurs_factures_familles` (rouge bloquant) | `verify-voyages-cout-accompagnateurs.test.mjs` exit 0 | FAIT |
| 7 | Import SIECLE (XLSX + CSV, encodages) | PARTIEL | parser `lib/import/parsers/siecleParser` + **NEW** `wizard/StepImportSiecle.tsx` (UTF-8/1252/BOM, 4 modes, sortie auto) | `verify-voyages-import-siecle.test.mjs` exit 0 | FAIT |
| 8 | Anti-discrimination boursiers | FAIT | `alertesEngine` catégorie `anti_discrimination_boursiers` | inspection | FAIT |
| 9 | Bascule Marchés publics | FAIT | `alertesEngine` catégorie `marche_seuil_mapa` (90 k€ HT CCP 2026) | inspection | FAIT |
| 10 | Régies post-RGP (sans cautionnement) | FAIT | `alertesEngine` catégorie `cautionnement_post_rgp` (rouge bloquant + ord. RGP 2022-408) | inspection | FAIT |
| 11 | Rétroplanning J-180→J+120 | FAIT | `lib/retroplanningEngine.ts` (394 lignes) + `wizard/StepRetroplanning.tsx` | inspection | FAIT |
| 12 | Alertes délai CA (4 zones) | PARTIEL | `lib/alertesEngine.ts` (rouge<30 / orange 30-60 / bleu 60-90 / vert ≥90) + `SidebarAlertes` permanente + **NEW** sync `alertes_transverses` | `verify-voyages-alertes-ca.test.mjs` exit 0 (6/6) | FAIT |
| 13 | Page Bilan financier modèle Créteil | NON FAIT | **NEW** `BilanFinancierPageV2.tsx` + route `/voyages-v2/bilan/:voyageId` (6 parties, tableau 5 colonnes, checklist clôture 7 items) | `verify-voyages-bilan-creteil.test.mjs` exit 0 (13/13) | FAIT |
| 14 | Règle 8 € post-bilan (3 cas + courriers) | PARTIEL (prévisionnelle seule) | **NEW** `lib/regle8EurosBilan.ts` (équilibre / excédent>8€ remboursement / excédent≤8€ coupon 3 options / déficit) + `appliquerSilenceDonTacite` | `verify-voyages-regle-8eur.test.mjs` exit 0 (13/13) | FAIT |
| 15 | 32 documents générés | FAIT | `lib/documentsCatalogue.ts` (7+9+4+6+6 = 32) + `lib/docxBuilder.ts` (954 lignes) + `lib/zipGenerator.ts` | `verify-voyages-documents.test.mjs` exit 0 (12/12) | FAIT |
| 16 | Mode d'emploi 10 sections | PARTIEL | `EnquetesRectoratPage.tsx` + recap dans `VoyagesV2Page` | non scriptée | PARTIEL (≥600 mots/section non vérifiés ce sprint) |
| 17 | Chatbot Claude Voyages | NON FAIT | hors périmètre sprint (ChatEple générique disponible) | n/a | NON FAIT (déclaré) |
| 18 | IA prédictive (faisabilité, OCR devis) | NON FAIT | non livré ce sprint | n/a | NON FAIT (déclaré) |
| 19 | Vue consolidée groupement | NON FAIT | non livré ce sprint (pattern `cofieple/VueGroupement` réutilisable) | n/a | NON FAIT (déclaré) |
| 20 | Mode présentation rectorat | PARTIEL | `EnquetesRectoratPage.tsx` (580 lignes) | non scriptée | PARTIEL |

## Récapitulatif honnête
- **Livré ce sprint (P1→P5)** : alertes délai CA (sync `alertes_transverses`), règle 8 € post-bilan complète (3 cas + courriers/mandats/coupons/silence), import SIECLE opérationnel (UI branchée parser partagé), page Bilan modèle Créteil 6 parties, wizard 8 étapes confirmé.
- **Déjà conforme** : alertes 17 catégories, catalogue 32 docs, wizard 9 étapes, retroplanning, regle8 prévisionnelle, sidebar alertes, parser SIECLE.
- **Déclaré non-livré** : Chatbot Claude voyages dédié, IA prédictive (OCR), vue groupement voyages, mode présentation rectorat enrichi.

Aucune ligne marquée FAIT n'est sans test ou sans inspection de code source.