# Audit cohérence — Table `establishments` (source unique de vérité des EPLE)

Date : 25/04/2026 · Nom technique de la table : `establishments` (alias FR « établissements »).

## Vues consolidées qui lisent depuis `establishments`

| Module | Lecture FK | Usage |
|---|---|---|
| Cockpit | `useEstablishmentContext` | Bandeau, KPI consolidés |
| Balance | `BalanceAnalysis` | Filtrage par EPLE, en-tête PDF |
| Compte financier | `CompteFinancier` | Sommaire, en-tête, ordonnateur référent |
| Voyages v2 | `VoyageWizard`, `BilanFinancierPageV2` | UAI, signature institutionnelle |
| Marchés | `MarchesPage` | UAI acheteur public |
| Fonds sociaux v2 | `FondsSociauxV2Home`, `DecisionsPage` | EPLE rattaché |
| Enquêtes rectorat | `EnquetesHubPage`, `VueRectoratEnquetesPage` | Filtrage UAI |
| Habilitations Op@le | `HabilitationsOpalePage`, `VueRectoratPage` | Vue rectorat consolidée |
| Accréditation | `AccreditationOrdoPage` | UAI cible + ordonnateur entrant |
| Passation SGEPLE | `PassationSgeplePage` | EPLE concerné |
| Entretiens | `EntretiensHome`, `VueRectoratEntretiensPage` | UAI agent + vue rectorat |
| Mode démo | `establishments` (jeu démo) | Données fictives cohérentes |

## Tables liées (toujours via FK `establishment_id`)

- `establishment_branding` (logo, charte locale)
- `establishment_annexes` (budgets annexes : SEGPA, GRETA, hébergement)
- `user_establishments` (rattachement utilisateur ↔ EPLE)

## Anomalies détectées

| # | Module | Anomalie | Sévérité | Décision |
|---|---|---|---|---|
| — | — | Aucune saisie libre d'UAI ou de nom d'EPLE détectée dans les composants | — | RAS |
| — | — | Aucune duplication de logo : tous tirés de `establishment_branding.logo_url` | — | RAS |

## Vérifications complémentaires

- ✅ UAI normalisé majuscules (contrainte `can_create_establishment_with_uai`).
- ✅ Logo : composant `BrandingCard` lit uniquement depuis `establishment_branding`.
- ✅ Adresse, type, ordonnateur référent : exclusivement via `establishments.*`.
- ✅ Vues rectorat (Enquêtes, Habilitations, Entretiens) lisent toutes depuis `establishments` (RLS rôle `observateur_rectoral`).

## Conclusion

**Conformité 10/10.** Aucune divergence détectée.