# Cahier de recette — Module Paramètres (Cellule RH & institutionnelle)

**Version** : 1.0  
**Date** : 25 avril 2026  
**Périmètre** : module Paramètres rectoral — Comptaeple  
**Référentiels** : GBCP 2012-1246, Code de l'éducation (R.421-9 / R.421-13 / R.421-77), instruction codificatrice 06-031-A-B-M, ordonnance RGP 2022-408, règlement (UE) 2016/679 (RGPD).

---

## 1. Synthèse exécutive

| Recette | Tests | Résultat |
|---|---|---|
| Recette 1 — Validations métier (UAI / SIRET / GBCP / régies) | 12 | ✅ 12/12 |
| Recette 2 — Organigramme fonctionnel CICF (3 sphères) | 7 | ✅ 7/7 |
| Recette 3 — Générateur d'arrêtés (13 types) + RGP 2022-408 | 8 | ✅ 8/8 |
| Recette 4 — Imports CSV / mapping intelligent / déduplication | 10 | ✅ 10/10 |
| Recette 5 — RGPD (registre Art. 30, mention Art. 13/14, Art. 15) | 8 | ✅ 8/8 |
| **Total** | **45** | **✅ 45/45 (exit code 0)** |

Compilation TypeScript : `bunx tsc --noEmit` → **0 erreur**.

---

## 2. Recettes détaillées

### 2.1 Recette 1 — Validations métier

- **UAI (RAMSESE)** : format 7 chiffres + 1 lettre. ✅ valide / refus de format invalide / insensible à la casse.
- **SIRET (Luhn)** : 14 chiffres + somme modulo 10. ✅ valide / invalide.
- **Séparation des fonctions GBCP** :
  - AC + Ordonnateur → bloquant ✅
  - AC seul → OK ✅
  - Ordonnateur + Régisseur recettes → bloquant ✅
  - SG + Adjoint gestionnaire → OK ✅
- **Régisseur sans suppléant** (instr. 06-031-A-B-M art. 5) : alerte rouge ✅.

`node scripts/verify-parametres-validations.mjs` → **exit 0**.

### 2.2 Recette 2 — Organigramme fonctionnel CICF

- 3 sphères (Ordonnateur / AC / Opérationnelle) cohérentes avec GBCP art. 78 et 86.
- Répartition des 19 rôles standardisée.
- Génération SVG avec libellé du groupement et carte par agent.
- Compatible "groupement vide" (résilience).

`node scripts/verify-parametres-organigramme.mjs` → **exit 0**.

### 2.3 Recette 3 — Générateur d'arrêtés

- 13 types pris en charge (nominations, régies, délégations, engagement AC, PV installation/remise, lettre CICF).
- Mention RGP 2022-408 systématique sur les actes de régisseur, l'arrêté constitutif de régie, l'engagement et le PV d'installation AC.
- Délégations sans mention RGP (cohérent).
- Hash SHA-256 déterministe (preuve d'intégrité, longueur 64).
- Type inconnu rejeté.

`node scripts/verify-parametres-actes.mjs` → **exit 0**.

### 2.4 Recette 4 — Imports CSV

- Détection automatique : `;` (Excel FR) / `,` / `\t`.
- Mapping FR/EN : "Matricule EN", "First name", "Email", "Prénom"… → champs internes.
- Headers inconnus → `null` (pas d'écrasement silencieux).
- Déduplication par matricule EN, sinon par nom + prénom + DDN.
- Normalisation insensible aux accents.

`node scripts/verify-parametres-csv.mjs` → **exit 0**.

### 2.5 Recette 5 — RGPD

- Registre Art. 30 : 5 traitements (agents, établissements, actes, évaluations, régies) avec finalité / base légale / conservation.
- Conservation 10 ans (référentiel CNIL secteur public) sur les agents et les régies.
- Mention Art. 13/14 conforme (cite UE 2016/679).
- Demande Art. 15 : génération HTML/PDF avec identité, actes et historique.
- Traçabilité : insertion automatique dans `rgpd_acces_logs`.

`node scripts/verify-parametres-rgpd.mjs` → **exit 0**.

---

## 3. Couverture fonctionnelle

### 3.1 Onglets livrés

1. **Tableau de bord** — niveau de conformité, anomalies UAI/SIRET, agents et délégations.
2. **Groupement** — carte d'identité juridique (nom, code, rectorat, AC titulaire, arrêté constitutif).
3. **Établissements** — annuaire détaillé, validation UAI/SIRET temps réel, recherche.
4. **Agents BIATSS** — registre 4 sections, alertes GBCP, historique.
5. **Délégations** — création/abrogation, alertes 30 j, plafonds.
6. **Bottin institutionnel** — 14 catégories (rectorat, DSDEN, DGFiP, ARS, etc.).
7. **Arrêtés** — générateur 13 types + archivage SHA-256.
8. **RGPD** — registre Art. 30, demande Art. 15, mention Art. 13/14.
9. **Mode d'emploi** — 8 chapitres pédagogiques niveau IH2EF/EAFC.
10. **Préférences** — historique préservé (sens normal des comptes, export JSON, etc.).

### 3.2 Tables PostgreSQL

`groupements_comptables` (étendu) · `establishments` (étendu) · `agents` (étendu) · `delegations_signature` · `historique_fonctions` · `bottin_institutionnel` · `arretes_actes` · `rgpd_acces_logs`. Toutes protégées par RLS.

---

## 4. Conditions de bascule en production

- ✅ 5 scripts de recette en exit 0
- ✅ Build TypeScript sans erreur
- ✅ RLS activée sur les 5 nouvelles tables
- ✅ Mention RGP 2022-408 obligatoire respectée sur tous les actes concernés
- ✅ Aucune régression sur les onglets existants (Préférences, Comptes sens normal)

**Décision** : module **éligible à la présentation rectorale**.

---

## 5. Annexes

- `docs/CHANGELOG_PARAMETRES.md` — historique technique
- `docs/VIDEO_TOUR_PARAMETRES.md` — script de démonstration
- `docs/AUDIT_PARAMETRES.md` — audit de conformité réglementaire