# CHANGELOG — Module Enquêtes Rectorat

## 2026-04-25 — Fondations « Plateforme académique » (chantiers 0-2, 4-5, squelette 9-10)

### Backend (migration `20260425123231`)
- **Nouveau type enum** : valeur `observateur_rectoral` ajoutée à `app_role`.
- **Nouvelle table `enquetes_referentiel_comptes`** : 47 lignes pré-remplies couvrant les familles 4411X (créances État), 44191X (reliquats État), 443110 (bourses), 4412X (créances collectivités), 44192X (reliquats collectivités), 4413X (créances UE Erasmus+), 44193X (reliquats UE), 4416X (autres organismes publics), 4417X (organismes privés / dons), 44181X (DGF Région / Département / aides sociales).
  - Champs : compte, libellé, racine_famille, programme_bop, sous_programme, sens_solde_normal, despecialisable, financeur_type, niveau_alerte_si_anormal, commentaire_reglementaire, reference_reglementaire.
  - RLS : lecture pour tout authentifié, modification réservée admin.
- **Nouvelle table `enquetes_campagnes`** : intitulé, type, échéance, périmètre établissements, origine (rectorat / AC / système). RLS : lisible par les utilisateurs des EPLE concernés et par le rôle `observateur_rectoral`.
- **Nouvelle table `enquetes_reponses_eple`** : statut, données JSON, signataires AC + ordonnateur, dates de soumission et validation. RLS : édition bloquée après soumission/validation.

### Frontend
- **Nouveau hub** `/enquetes-rectorat` (`EnquetesHubPage.tsx`) avec 8 cartes vers les sous-modules.
- **Nouvelle page Nomenclature** `/enquetes-rectorat/nomenclature` avec recherche, regroupement par famille, badge sens normal et marquage des comptes non-déspécialisables.
- **Nouvelle page Calendrier** `/enquetes-rectorat/calendrier` listant 15 échéances types (mars → décembre) avec références réglementaires.
- **Nouvelle page Vue Rectorat** `/enquetes-rectorat/vue-rectorat` (squelette dashboard académique avec compteurs conformes, drill-down par EPLE, boutons « Demander complément » et exports).
- **Nouvelle entrée sidebar** « Enquêtes Rectorat » dans le groupe Pilotage AC.

### Logique métier
- **`src/lib/enquetes-rectorat/types.ts`** : types partagés + fonction `controleAction()` qui implémente la règle DAF A3 de non-déspécialisation.
- **`src/lib/enquetes-rectorat/calendrierCampagnes.ts`** : 15 échéances types pré-chargées et helper `groupCampagnesParMois()`.

### Tests de recette (6 scripts, tous exit 0)
- `verify-enquetes-nomenclature.test.ts`
- `verify-enquetes-non-despecialisable.test.ts`
- `verify-enquetes-rapprochement-bourses.test.ts`
- `verify-enquetes-vue-rectorat.test.ts`
- `verify-enquetes-articulation.test.ts`
- `verify-enquetes-pdf.test.ts`

### Préservation de l'existant
- L'enquête fonds sociaux (`src/pages/fonds-sociaux-v2/EnquetePage.tsx`), l'enquête voyages (`src/pages/voyages-v2/EnquetesRectoratPage.tsx`) et leurs validations (16 règles fonds sociaux) sont conservées telles quelles.
- Aucune migration des tables existantes (`vs_enquetes_rectorat`, `fs_*`).