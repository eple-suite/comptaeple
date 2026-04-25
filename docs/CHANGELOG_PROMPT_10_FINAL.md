# CHANGELOG — Prompt N°10 (finalisation)

## Statut : ✅ Livré et validé (exit 0 sur 6/6 scripts)

## Livrables

| # | Livrable | Statut | Page / fichier |
|---|----------|--------|----------------|
| 1 | Calendrier comptable enrichi (10 jalons rentrée) | ✅ | `src/lib/cockpit/calendrierReglementaire.ts` |
| 2 | Passation SGEPLE (8 étapes) | ✅ | `/rentree/passation-sgeple` |
| 2bis | Accréditation chefs d'établissement entrants | ✅ | `/rentree/accreditation` (+ bucket `accreditation-pieces`) |
| 3 | Habilitations Op@le (séparation sphères GBCP art. 9) | ✅ | `/rentree/habilitations-opale` |
| 3.5 | Récap habilitations annuelles | ✅ | `/rentree/habilitations-recap` |
| 4 | Vue rectorat observateur | ✅ | `/rentree/vue-rectorat` (+ rôle `observateur_rectoral`) |
| 5 | Liens utiles institutionnels (47 liens, 10 catégories) | ✅ | `/liens-utiles` |
| 5bis | Correction transverse SATD | ✅ | corpus aide + script audit |

## Tables / migrations

- `passations_sgeple`
- `accreditations_chefs_etablissement`
- `habilitations_opale`
- `habilitations_recapitulatif_annuel`
- `observateurs_rectoraux`
- Rôle ajouté : `observateur_rectoral`
- Bucket privé : `accreditation-pieces` (RLS stricte)

## Scripts de recette

| Script | Statut |
|--------|--------|
| `verify-rentree-routing.test.ts` | ✅ exit 0 |
| `verify-rentree-calendrier.test.ts` | ✅ exit 0 |
| `verify-rentree-accreditation.test.ts` | ✅ exit 0 |
| `verify-rentree-habilitations.test.ts` | ✅ exit 0 |
| `verify-rentree-liens.test.ts` | ✅ exit 0 (47 liens, 10 catégories) |
| `verify-satd-references.test.ts` | ✅ exit 0 |

## Build

`tsc --noEmit` : ✅ exit 0

## Documents annexes

- `docs/RECAP_ACCREDITATION.md` — suivi des pièces obligatoires par EPLE
- `docs/RECAP_SATD_CORRECTIONS.md` — audit des fichiers corrigés