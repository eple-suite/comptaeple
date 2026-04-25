# Module Paramètres — Cellule RH et institutionnelle (niveau rectoral)

**Date** : 25/04/2026 — **Statut** : Livraison partielle (chantiers 1-3 + socle 5/6/7 + recette 1)

## ✅ Chantier 1 — Schéma de données (TERMINÉ, non destructif)

Migration SQL appliquée — toutes les nouvelles colonnes en `NULL` par défaut, aucune donnée existante touchée.

**Tables étendues :**
- `groupements_comptables` : `region_academique`, `code_groupement`, `date_creation_arrete`, `arrete_constitutif_url`, `date_derniere_modification`, `perimetre_actif`
- `establishments` : `type_etablissement`, `statut_juridique`, `siret`, adresse complète, effectifs (DP, internes, externes, boursiers, taux), `classement_ep`, `indice_position_sociale`, surface, gouvernance (FK agents pour chef, adjoint, SG, gestionnaire matériel, chef cuisine, CPE), collectivité, dates rattachement
- `agents` : `matricule_education_nationale`, `civilite`, `nom_naissance`, `nom_usage`, RIFSEEP (`indice_majore`, `rifseeup_groupe`, `montant_ifse_mensuel`, `cia_dernier_montant`), `role_principal` (enum 19 valeurs), `roles_secondaires`, `etablissements_affectation`, `delegation_signature`, `profil_opale`, hiérarchie (`n_plus_un_id`, `n_plus_deux_id`), `photo_url`

**Tables nouvelles :**
- `delegations_signature` (RLS) — type, périmètre, plafond, dates, statut active/expirée/abrogée
- `historique_fonctions` (RLS) — trajectoire avec `payload_avant/apres` JSON
- `bottin_institutionnel` (RLS) — annuaire correspondants externes
- `arretes_actes` (RLS) — archive horodatée des 13 types d'actes générés (`contenu_hash`)
- `rgpd_acces_logs` (RLS) — traçabilité RGPD

**Enums** : `etablissement_type`, `statut_juridique`, `classement_ep`, `collectivite_rattachement`, `statut_rattachement`, `agent_role_principal`, `profil_opale`, `delegation_type`, `delegation_statut`, `bottin_categorie`, `acte_type`, `civilite`.

## ✅ Chantier 3 — Validations métier (TERMINÉ)

`src/lib/parametres/validations.ts` :
- `isUaiFormatValid`, `isSiretValid` (Luhn), `isEmailValid`, `isPhoneValid` (DOM 0590/0690/0691/0696)
- `isIndiceMajoreValid` (200-1500), `isEchelonValid` (1-15), `isQuotiteValid` (0-100), `isAgeReasonable` (16-75)
- `checkRoleCompatibility` — séparation des fonctions GBCP : AC ⊥ ordonnateur ⊥ régisseur, etc.
- `checkRegisseurSuppleant` — instr. 06-031-A-B-M art. 5
- `checkUniqueAcTitulaire` — un seul AC par groupement
- `validateAgent`, `validateEstablishment`, `hasBlockingIssues`

## ✅ Chantier 4 — Organigramme CICF SVG (lib TERMINÉE)

`src/lib/parametres/organigramme.ts` — SVG dynamique, 3 sphères (Ordo bleu / AC vert / Ope gris), cartes nominatives, mention délégation, export téléchargeable. Réf. GBCP art. 78/86.

## ✅ Chantier 5 — Générateur d'actes (lib TERMINÉE, 13 types)

`src/lib/parametres/actesGenerator.ts` — HTML institutionnel A4 imprimable, en-tête République, visas, considérants, articles numérotés, mentions de transmission, signature.

**Mention RGP 2022-408** intégrée automatiquement sur régies / engagement AC / PV installation : *« Conformément à l'ordonnance n° 2022-408 du 23 mars 2022, le cautionnement n'est plus exigé. »*

13 types : régisseur recettes/avances, suppléant, mandataire, constitutif/abrogation régie, délégation ordo/AC, abrogation, engagement AC, PV installation/remise service AC, lettre mission CICF.

`hashContent` SHA-256 pour preuve d'archivage.

## ✅ Chantier 6 — Imports CSV/XLSX (lib TERMINÉE)

`src/lib/parametres/csvImport.ts` — détection délimiteur, encodage UTF-8/Win-1252, mapping intelligent (alias FR/EN), preview 10 lignes, dry-run, dédoublonnage par matricule EN ou nom+prénom+ddn (agents) ou UAI (établissements). Modèles CSV téléchargeables.

## ✅ Chantier 7 — RGPD (lib TERMINÉE)

`src/lib/parametres/rgpd.ts` — registre des 5 traitements (art. 30 RGPD), mention d'information art. 13, demande d'accès art. 15 (HTML imprimable avec actes + historique).

## ✅ Chantier 2 — Onglet Agents (PARTIEL, livré)

`src/components/parametres/AgentsTab.tsx` intégré dans `SettingsPage.tsx` via `<Tabs>` :
- Bandeau alertes globales (erreurs bloquantes / warnings)
- Tableau filtrable (rôle, statut, actif/inactif, recherche full-text)
- Dialog édition complet (4 sections : identité, statut administratif, affectation, coordonnées)
- Validations live affichées dans le dialog, blocage à la sauvegarde si erreur GBCP
- **Archivage automatique** : chaque modification crée une entrée `historique_fonctions` (payload avant/après)
- Dialog import CSV avec preview, dry-run, dédoublonnage

L'ancien contenu Préférences (identité, profil, notifications, données, sens normal des comptes) est intégralement préservé sous l'onglet « Préférences ».

## ✅ Recette 1 — verify-parametres-validations.mjs

```
✅ 12 passed, 0 failed (UAI, SIRET Luhn, séparation GBCP, régisseur/suppléant)
```

## ⚠️ Restant à livrer (planifié, non implémenté faute de temps)

- **Onglets UI** : Mon groupement (vue consolidée), Établissements (refonte fiche détaillée avec sections), Délégations (wizard 6 étapes), Bottin (annuaire pré-rempli Guadeloupe), Arrêtés (vue archive + générateur UI exposant les 13 types), Préférences/RGPD (sous-onglet RGPD)
- **Tableau de bord paramètres** (chantier 8) : KPI complétude, heatmap
- **Mode d'emploi 8 chapitres** (chantier 9)
- **Recettes 2-5** (historique, arrêtés, organigramme, RGPD) : librairies prêtes, scripts à écrire
- **Livrables markdown** : RECETTE_PARAMETRES.md, VIDEO_TOUR_PARAMETRES.md, AUDIT_PARAMETRES.md

## 🔒 Garanties

- ✅ Aucune régression : modules existants intacts (Cockpit, Entretiens, COFIEPLE, HYPER@LE, etc.)
- ✅ Aucune donnée perdue : toutes colonnes nullables, RLS héritées de `user_has_establishment_access`
- ✅ TypeScript : `tsc --noEmit` passe (0 erreur)
- ✅ Recette 1 : exit code 0

## 📚 Conformité réglementaire

- Code éducation R.421-9 (chef d'établissement), R.421-13 (délégation), R.421-77 (compte financier)
- Décret GBCP 2012-1246 art. 10 (délégation ordo), 16 (délégation AC), 78 (rôle AC), 86 (groupement)
- Décret 86-83 du 17/01/1986 (contractuels État) — décret 2010-888 (entretiens)
- Instruction n° 06-031-A-B-M du 21/04/2006 — art. 5 (suppléant régisseur), art. 6
- Ordonnance n° 2022-408 du 23/03/2022 (RGP — fin du cautionnement)
- Règlement (UE) 2016/679 (RGPD) — art. 13, 15, 30
- Référentiel RAMSESE (UAI 7 chiffres + 1 lettre)