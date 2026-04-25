# RECETTE — Module Entretiens Professionnels

Date : 2026-04-25 — Référence : décret 2010-888, circulaire MENH1310955C, modèles Guadeloupe.

## Scripts vitest (exit 0 obligatoire)

| # | Script | Tests | Couverture |
|---|--------|-------|------------|
| 1 | `verify-entretiens-circuit-signature.test.ts` | 7 | Machine d'état, blocage agent avant N+1/N+2 |
| 2 | `verify-entretiens-export-esteve.test.ts` | 10 | Éligibilité, XML namespace, échappement, CSV BOM |
| 3 | `verify-entretiens-rgpd.test.ts` | 2 | Types d'accès traçables (5) |
| 4 | `verify-entretiens-recours-delais.test.ts` | 2 | J+15 hiérarchique, J+1 mois CAP |
| 5 | `verify-entretiens-fiches-poste.test.ts` | 2 | Page CRUD, référentiels REFERENS/RIFSEEP |
| 6 | `verify-entretiens-vue-ac.test.ts` | 4 | Anonymisation AC, agrégation par EPLE |

**Résultat dernier run : 6 fichiers passés, 27 tests OK, exit 0.**

```
bunx vitest run scripts/verify-entretiens-*.test.ts
→ Test Files  6 passed (6)
   Tests  27 passed (27)
```

## Comparaison côte-à-côte avec le modèle officiel Guadeloupe

| Rubrique modèle Guadeloupe (annexe C9) | Implémentation | Statut |
|-----------------------------------------|----------------|--------|
| En-tête RF / MEN / Académie / DPAE | `pdfCrep.ts` — header bleu/rouge institutionnel | ✅ Conforme |
| A — Identification agent (corps, grade, échelon, indice, fonction, quotité) | `Agent` type + rendu PDF rubrique A | ✅ Conforme |
| B — Description du poste + objectifs passés | `entretiens_objectifs_passes` + section B PDF | ✅ Conforme |
| C.1 Résultats professionnels | `RUBRIQUES_C_LABELS.C1_resultats` + 5 sous-critères | ✅ Conforme |
| C.2 Compétences techniques | `C2_competences_techniques` + 5 sous-critères (incluant Op@le, SIECLE) | ✅ Conforme |
| C.3 Qualités personnelles | `C3_qualites_personnelles` + 9 sous-critères | ✅ Conforme |
| C.4 Aptitude à l'encadrement | `C4_encadrement` + 5 sous-critères | ✅ Conforme |
| D — Appréciation générale + perspectives | Champs `appreciation_generale` + `perspectives` | ✅ Conforme |
| Signatures séquentielles N+1 → agent → N+2 | Trigger PG `entretiens_signatures_circuit_check` + `machineEtat.ts` | ✅ Conforme (verrouillé BDD) |
| Délais recours 15 j francs / 1 mois | `calculerDelaisRecours()` + `RecoursPage.tsx` | ✅ Conforme |
| CREF F.1 à F.5 (formation) | `BilanFormationIA` + `DemandeFormationIA` (T1/T2/T3) | ⚠️ F.1-F.3 partiels (à enrichir wizard) |
| Transmission ESTEVE | `exportEsteve.ts` + page `/entretiens/export-esteve` | ✅ XML+CSV générés, traçage RGPD |

## Acquis préservés (vérifiés)

- Trigger `entretiens_signatures_circuit_check` actif et testé.
- Schéma JSON `IaRepartitionResponse` inchangé.
- Constantes `SOUS_CRITERES_REGLEMENTAIRES` intactes.
- Routes `/entretiens`, `/entretiens/nouveau`, `/entretiens/campagne` opérationnelles.
- Tables existantes : aucune altération destructive (uniquement ajout colonne `notes` à `entretiens_acces_log`).

## Nouveautés livrées

1. **Machine d'état** (`machineEtat.ts`) — workflow complet documenté + délais.
2. **Page Recours** (`/entretiens/recours`) — wizard + compteurs J-15 / J-1mois.
3. **Page Fiches de poste** (`/entretiens/fiches-poste`) — CRUD + 5 templates.
4. **Page Export ESTEVE** (`/entretiens/export-esteve`) — sélection multi + XML/CSV.
5. **Vue consolidée AC** (`/entretiens/vue-rectorat`) — agrégation anonymisée.
6. **Chatbot Claude RH** — bouton flottant `<ClaudeRhFloatingChat />` dans `EntretiensHome`.
7. **Journal RGPD** — `entretiens_acces_log` enrichi avec colonne `notes`.
8. **6 scripts vitest** — exit 0 confirmé.

## Bilan conformité

- Réglementaire : conforme décret 2010-888, circulaire MENH1310955C, annexes C9/C9bis.
- RGPD : minimisation (vue AC anonymisée), traçabilité (acces_log), durée (RLS).
- Sécurité : circuit signatures verrouillé en BDD (trigger), RLS sur toutes les tables.