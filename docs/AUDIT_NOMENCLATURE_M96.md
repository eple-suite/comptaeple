# Audit nomenclature M9-6 — Table `comptes_sens_normal_ref`

Date : 25/04/2026 · Référence : Instruction codificatrice M9-6 du 19/01/2026 (DGFiP).

## Source unique

Table `comptes_sens_normal_ref` + table d'override par EPLE `comptes_sens_normal` (overrides locaux justifiés).

## Consommateurs identifiés

| Module | Fichier | Usage |
|---|---|---|
| Balance | `src/lib/balance/referentielLoader.ts` + `referentielFallback.ts` | Sens normal de chaque compte |
| Balance | `src/lib/balance/anomaliesEngine.ts` | Détection anomalies de sens |
| Compte financier | `src/lib/cofieple_m96engine.ts` | Reconnaissance des comptes M9-6 |
| Compte financier | `src/lib/cofieple_sensNormalOverrides.ts` | Application des overrides EPLE |
| Paramètres | `src/components/settings/ComptesSensNormalManager.tsx` | UI override |

## Cohérence inter-modules sur les comptes 411x (créances familles)

| Module | Compte cité | Justification |
|---|---|---|
| **Fonds sociaux v2** | `411200` (créances DP familles) | Doctrine prompt n° 9 — `decisionPdf.ts`, `fsv2Types.ts`, `NouvelleDecisionWizard.tsx` |
| **Voyages v2** | `4116XX` (créances autres frais scolaires hors DP) ou `411200` selon nature | `VoyageCourriersPdfTab.tsx`, `bilanFinancierEngine.ts` |
| **Compte financier (Bilan)** | `411` agrégé puis ventilation 4111 / 4116 | `bilanFinancierEngine.ts` |
| **SATD** | `411` débiteur cible générique | `satd/types.ts`, `SatdFormulaire.tsx` |
| **Balance** | `411xxx` selon référentiel local | `referentielFallback.ts` |

**Cohérence : OK.** Les usages sont conformes au plan comptable Op@le :
- `411200` = créances demi-pension familles (Fonds sociaux la cite à juste titre).
- `411600` = créances autres frais scolaires (Voyages la cite légitimement pour les frais hors DP).
- Pas de divergence sémantique entre modules.

## Cohérence avec `enquetes_referentiel_comptes`

- ✅ Le module Enquêtes rectorat dispose de son propre référentiel pour les agrégats spécifiques (BOP, bourses, FAJ), aligné M9-6 — pas de conflit avec `comptes_sens_normal_ref`.
- ✅ Les sens de soldes utilisés par les contrôles d'enquêtes sont cohérents avec le référentiel Balance.

## Anomalies détectées

| # | Module | Anomalie | Sévérité | Décision |
|---|---|---|---|---|
| — | — | Aucune divergence de sens normal détectée | — | RAS |

## Conclusion

**Conformité 10/10.** Le référentiel M9-6 est respecté de façon homogène. Les comptes 411200 / 4116XX sont employés à bon escient module par module, conformément au plan comptable Op@le.