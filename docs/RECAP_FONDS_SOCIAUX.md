# RECAP FONDS SOCIAUX — État réel avant livraison

_Date d'audit : 2026-04-25_
_Périmètre : module Fonds sociaux + audit transverse vocabulaire « mandat »_

## 1. Modules existants

| Chemin | Rôle | Statut |
|---|---|---|
| `src/pages/FondsSociaux.tsx` | Ancienne page monolithique | **À retirer du routage** (route `/fonds-sociaux` toujours active) |
| `src/pages/fonds-sociaux/` | Ancien sous-module (5 fichiers : Budget, Commissions, Documents, Procedure, Stats, types) | Plus référencé dans les routes mais fichiers présents |
| `src/pages/fonds-sociaux-v2/` | Module v2 actif (FondsSociauxV2Home + 4 pages + Wizard 5 étapes) | **Base de la livraison** |
| `src/lib/fs-pdf/decisionPdf.ts` | 3 PDF (Décision CE, Notification famille, Pièce comptable) | À enrichir + corrections vocabulaire |

## 2. Schéma DB existant (tables `fs_*`)

| Table | Statut |
|---|---|
| `fs_eleves` | Conservé tel quel |
| `fs_commissions` | Conservé, à enrichir (convocation, PV anonymisé) |
| `fs_decisions` | À étendre : `type_fonds` doit accepter `FSC`, `FSC_COL`, `FSL` ; renommer `date_mandatement`→`date_demande_paiement`, `numero_mandat`→`numero_dp` |
| `fs_subventions_rectorat` | Conservé |
| `fs_reliquats_ouverture` | Conservé |

## 3. Correctif 1 — Compte 411200

- Compte `411200` **déjà connu** : référentiel `referentielFallback.ts`, hook SATD, calculs budgétaires.
- Aucune occurrence `4116xx` dans le code **fonds sociaux**.
- Occurrences `4116xx` dans **Voyages** (`VoyageCourriersPdfTab.tsx`) : conservées (créances familles voyages = compte voyages spécifique, distinct de la créance DP scolaire).
- Action : ajouter une constante `COMPTE_CREANCE_DP_FAMILLE = "411200"` dans `fsv2Types.ts` et l'utiliser dans le wizard quand l'aide cantine est imputée en extinction de créance.

## 4. Correctif 2 — Vocabulaire « mandat » → « demande de paiement »

**163 occurrences `mandat` dans tout `src/`**, réparties ainsi :

| Module | Occurrences | Action |
|---|---|---|
| `fonds-sociaux-v2/` (Wizard, Decisions, types) | 7 | **Renommer intégralement** (statut `mandate`→`demande_paiement`, libellé « Mandaté »→« Demande de paiement émise », champs DB) |
| `lib/fs-pdf/decisionPdf.ts` | 5 | **Renommer** (« PIÈCE COMPTABLE — MANDAT »→« DEMANDE DE PAIEMENT », « par mandat administratif »→« par demande de paiement Op@le ») |
| `fonds-sociaux/` (ancien) | 17 | Module non référencé, conservé tel quel (ne pas casser) |
| `voyages/`, `voyages-v2/` | ~40 | « Mandat de remboursement »→« Demande de paiement » dans libellés UI ; conserver les références réglementaires |
| `data/aide/glossaire.ts`, `regulatoryKnowledge.ts`, `m96_knowledge.ts`, `gbcp_knowledge.ts` | ~15 | Ajouter entrée glossaire « Demande de paiement (Op@le) » avec « Mandat » comme synonyme historique pré-Op@le |
| `lib/import/`, `lib/opaleSdeSdrParser.ts`, `lib/cofieple_*` | ~30 | **Conservé** : terminologie technique des imports SDE/SDR (Op@le exporte effectivement « Mandats émis » dans certains états — vérifié dans `opaleSdeSdrParser.ts`) |
| `regies/`, `parametres/`, autres | ~30 | Hors périmètre (mandat de régie, délégations, etc. — autre sens du mot « mandat ») |

**Politique adoptée** : remplacement chirurgical dans les modules **utilisateur final** (fonds sociaux, voyages-v2 UI, PDF générés). Conservation des termes réglementaires cités explicitement et des parsers d'imports Op@le qui doivent matcher les libellés exacts des fichiers SDE/SDR.

## 5. Correctif 3 — Pièces à générer

Existant : 3 PDF (Décision CE, Notification famille, Pièce comptable).

À ajouter :
- Convocation commission (à partir des `membres_presents` de `fs_commissions`)
- PV commission anonymisé (CA) + intégral (archivage)
- Bordereau de demandes de paiement (regroupement multi-décisions)
- Courrier demande de complément de pièces
- Courrier de refus motivé
- Bilan annuel anonymisé pour CA
- Bilan complet rectorat (BOP 230)

## 6. Plan d'exécution livré

- **Étape 0** : ce document — ✅
- **Étape 1** : retrait route `/fonds-sociaux` (ancien) avec redirection vers `/fonds-sociaux/v2`
- **Étape 2** : migration DB — trois fonds + renommage colonnes mandat→DP + ajout délibération CA
- **Étape 3** : table `fs_deliberations_ca` + UI saisie modalités d'attribution
- **Étape 4** : wizard étape « Imputation » — checkbox « Extinction créance DP famille (C/411200) » quand nature=restauration
- **Étape 5** : table `fs_commission_convocations` + générateurs PDF convocation/PV
- **Étape 6** : refonte `decisionPdf.ts` avec voies de recours, visa délibération CA, visa avis commission ; nouveaux PDF (refus, complément, bordereau DP)
- **Étape 7** : `BilanFondsSociauxPage` (tableau de bord 3 fonds + bilan annuel)
- **Étape 8** : vue consolidée groupement (page admin)
- **Étape 9** : RGPD — anonymisation PV CA, durée conservation 5 ans, journal accès
- **Étape 10** : 8 scripts de recette
- **Étape 11** : audit transverse mandat→DP (libellés UI)

## 7. Justifications réglementaires

- **FSC / FSC_COL / FSL** : circulaire 2017-122 du 22/8/2017 distingue Fonds social collégien (FSC_COL), Fonds social lycéen (FSL), Fonds social cantine (FSC) — financements BOP 230 distincts.
- **C/411200** : plan comptable Op@le M9-6 tome 3 — « Frais scolaires — élèves » = compte de créance des familles DP.
- **Demande de paiement** : Op@le ne génère plus de mandats. Circuit GBCP 2012-1246 adapté Op@le : Engagement → DP → Prise en charge → Paiement.
- **Voies de recours** : art. R.421-1 CJA — recours gracieux 2 mois, contentieux 2 mois devant TA territorialement compétent (TA Basse-Terre pour Académie Guadeloupe).
