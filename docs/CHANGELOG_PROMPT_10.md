# Prompt N°10 — Rentrée / Habilitations Op@le / Liens utiles

## Livraison initiale (cette itération)

### Livrable 1 — Calendrier comptable enrichi ✅
10 nouveaux jalons août/septembre dans `src/lib/cockpit/calendrierReglementaire.ts` :
réception pièces chef d'établissement, rappel SGEPLE en mutation, programmation passations,
préparation ré-habilitations Op@le, mise à jour organigramme CICF, validation accréditations,
révocation/création habilitations, transmission document rectorat, vérification Chorus Pro.

### Livrable 2/3/4 — Tables et pages socle ✅
**Migrations Supabase** :
- `passations_sgeple` (workflow passation SGEPLE)
- `accreditations_chefs_etablissement` (pièces chef entrant + RGPD)
- `habilitations_opale` (sphères ordo/compta + signatures séparées + index unique d'incompatibilité)
- `habilitations_recapitulatif_annuel` (document rectorat consolidé)
- `observateurs_rectoraux` + `observateur_rectoral_logs` (rôle `observateur_rectoral` + traçabilité)
- Bucket privé `accreditation-pieces` (RGPD)
- RLS complète : admin / agent par établissement / observateur lecture seule.

**Pages applicatives créées** :
- `/parametres/passation` — wizard 8 étapes (identification, inventaire outils, dossiers physiques, dossiers en cours, habilitations, PV, notifications, clôture).
- `/parametres/accreditation` — upload pièces, diagnostic complétude, blocage signature ordonnateur si arrêté absent.
- `/habilitations` — sphères ordo/compta avec garde-fou GBCP art. 9 (un agent ne peut être actif dans les deux sphères).
- `/habilitations/recap` — page socle génération document rectorat.
- `/habilitations/rectorat` — page socle vue observateur rectoral.
- Sidebar : entrée « Habilitations Op@le » dans Pilotage.

### Livrable 5 — Liens utiles ✅
- Table `liens_utiles` + 47 liens seedés (Institutionnels, Finances publiques, Commande publique, Métier EPLE, Académies, Outils, Textes, Compléments).
- Page `/liens-utiles` avec recherche et regroupement par catégorie.
- Sidebar : entrée « Liens utiles » dans Ressources.

### Recette ✅ partielle
- `scripts/verify-satd-references.test.ts` : script créé et opérationnel — détecte correctement les associations « SATD ↔ 1966 » à corriger.
- Build TypeScript : `tsc --noEmit` exit 0.

## Reste à exécuter (itérations suivantes)

### Correction transverse SATD (livrable 5 partie 2)
Le script `verify-satd-references.test.ts` signale les fichiers à corriger :
- `src/data/aide/glossaire.ts` — découpler entrée SATD ↔ « 1966 », créer entrées distinctes ATD/OTD/STD/SATD avec référence 2017-1837 art. 73.
- `src/data/aide/articles.ts` — idem.
- Aucune mention 2017-1837 dans le corpus aide aujourd'hui — à ajouter.

### Étapes restantes du prompt
- Wizard passation : étapes 4-7 détaillées + génération PV `.docx` (4 signatures) via skill `docx`.
- Accréditation : génération courrier DRFiP + bordereau + attestation `.docx`.
- Document récapitulatif rectorat : génération PDF + Excel 4 onglets + token magique de consultation.
- Vue rectorat : tableau de bord, heatmap, drill-down EPLE, bouton « Demander mise à jour ».
- Câblage container `agents` : sélection systématique depuis la table agents, alertes sur changement de fonction, propositions de révocation à l'archivage.
- 4 scripts de recette restants : `verify-passation-sgeple`, `verify-accreditation-pieces`, `verify-habilitations-spheres`, `verify-habilitations-rectorat`.
- Documents : `RECETTE_HABILITATIONS.md`, `VIDEO_TOUR_HABILITATIONS.md`, `AUDIT_HABILITATIONS.md`.

## Conformité réglementaire
Code éducation R.421-9, R.421-13, R.421-58-II ; GBCP 2012-1246 art. 9, 10 ; instruction 06-031-A-B-M ;
ordonnance RGP 2022-408 ; M9-6 ; RGPD ; loi 2017-1837 art. 73 (SATD, en vigueur 01/01/2019).