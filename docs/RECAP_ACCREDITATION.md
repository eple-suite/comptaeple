# RECAP — Accréditation des chefs d'établissement entrants

**Prompt N°10 — livrable 2 (correctif intégré).**

## Pièces obligatoires à transmettre à l'agent comptable

| # | Pièce | Source | Bloquant signature |
|---|-------|--------|--------------------|
| 1 | Arrêté d'affectation rectoral | Rectorat / DSDEN | ✅ OUI |
| 2 | Copie pièce d'identité (recto-verso) | Chef entrant | ✅ OUI |
| 3 | Document d'accréditation DRFiP | DRFiP / DGFiP | ✅ OUI |
| 4 | Spécimen de signature manuscrit | Chef entrant | ✅ OUI |
| 5 | Délégation de signature (le cas échéant) | Chef entrant | ⚠️ Conditionnel |

## Suivi par EPLE

Les pièces sont stockées dans le bucket privé `accreditation-pieces` (RLS strict, accès AC + admin uniquement). La table `accreditations_chefs_etablissement` enregistre :

- Statut : `en_attente` → `pieces_recues_partielles` → `completes` → `valide_par_ac` → `transmis_drfip`
- Dates clés (prise de fonction, arrêté, validation AC, transmission DRFiP)
- Numéro d'arrêté
- URLs des PDF chiffrés (privés)

## Logique de blocage

Tant que l'**Arrêté d'affectation** n'est pas chargé et validé, l'agent comptable ne peut valider aucun acte d'ordonnancement émis par le chef entrant. Le statut reste `en_attente` et un bandeau d'alerte s'affiche dans le tableau de bord.

## Calendrier

- **Août** : recueil anticipé des pièces
- **1er septembre** : prise de fonction effective
- **Septembre** : validation AC + transmission DRFiP (J+15 max)

Voir `src/lib/cockpit/calendrierReglementaire.ts` (jalons `aout-recueil-pieces-accreditation`, `sep-validation-accreditations`).

## Page applicative

`/rentree/accreditation` — `src/pages/rentree/AccreditationOrdoPage.tsx`

## Référence réglementaire

- GBCP (décret 2012-1246), art. 9 : séparation ordonnateur / comptable
- Code de l'éducation R.421-13 : nomination du chef d'établissement
- Instruction codificatrice M9-6