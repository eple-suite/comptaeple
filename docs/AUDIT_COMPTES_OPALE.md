# Audit — Comptes comptables Op@le (format M9-6 6 chiffres)

> Date : 2026-05-12 — Périmètre : SATD + audit transverse
> Référentiel : Instruction M9-6 / Op@le (plan de comptes 6 chiffres)

## 1. Module SATD — corrections appliquées

### Format Op@le (6 chiffres) désormais utilisé partout

| Avant (court) | Après (Op@le) | Libellé |
|---|---|---|
| 4112 | **411200** | Familles — demi-pension |
| — | **411300** | Familles — internat (ajouté) |
| 4112 (voyage) | **411500** | Familles — voyages scolaires (ajouté) |
| 4118 | **411800** | Autres créances familles (cautions, manuels) |
| 4122 | **412200** | Commensaux — repas |
| 4128 | **412800** | Autres tiers redevables (locations, asso., refacturations) |
| 416 | **416200 / 416800** | Contentieuses / Douteuses (séparées) |
| 421 | **425000 / 429000** | Personnel — avances / trop-perçus (séparés) |
| 4671 | **467100** | Comptes débiteurs — associations |
| 468 | **467800** | Autres comptes débiteurs divers |
| — | **441200 / 441600** | État, collectivités, organismes publics (ajoutés) |
| — | **443110** | Bourses nationales trop-perçues (ajouté) |

### Natures de créance ajoutées dans le menu déroulant

- **Association — location / hébergement à l'internat non payés → 412800**
  *(réponse au cas pratique remonté : association redevable d'une location de l'internat)*
- Logement NAS / location accessoire → 412800
- Refacturation fluides (eau / élec / gaz) → 412800
- Manuels / fournitures non restitués → 411800
- Bourse nationale trop-perçue → 443110
- Agent — avance / acompte non régularisé → 425000
- Fournisseur — avoir non réglé → 409100
- Collectivité — refacturation → 441200
- Autre organisme public débiteur → 441600
- Créance contentieuse (procédure en cours) → 416200
- Créance déjà transférée en 416 → 416800

### Auto-binding nature → compte

Le formulaire SATD propose désormais un menu **Compte d'imputation Op@le (M9-6)**
exhaustif (15 comptes 6 chiffres) et le compte se met à jour automatiquement
lorsque l'utilisateur sélectionne une nature.

## 2. Cas pratique — « Une association me doit de l'argent pour la location de l'internat »

**Imputation correcte Op@le M9-6 :**

- Côté **créance (bilan, classe 4)** : compte **412800** « Autres tiers
  redevables » (l'association n'est ni une famille — 411x —, ni un commensal
  individuel — 412200).
- Côté **produit (compte de résultat, classe 7)** correspondant à
  l'encaissement attendu : **C/7083** « Locations diverses » (ou **7088**
  « Autres produits d'activités annexes » si la convention couvre des
  prestations mixtes hébergement + restauration).
- Si la créance devient douteuse : transfert au compte **416800**
  (provision via **491000** + dotation **6817**).

**Subvention trop-perçue à reverser** par la même association →
**467100** (et non 412800).

## 3. Audit transverse des autres modules

| Module | Fichier | Statut comptes |
|---|---|---|
| Voyages — recettes | `voyages-v2/types.ts` (`NATURE_RECETTE_IMPUTATION`) | ✅ Op@le 4-5 chiffres conformes M9-6 (70881, 7442, 7411…) |
| Voyages — dépenses | `voyages-v2/types.ts` (`POSTE_DEPENSE_COMPTE`) | ✅ Op@le 4 chiffres conformes (6245, 6256, 6258…) |
| Régies & caisse | `regies/JournalCaisseTab.tsx` | ✅ 5311, 5159 utilisés conformément M9-6 |
| Référentiel balance | `lib/balance/referentielFallback.ts` | ✅ Format Op@le 6 chiffres déjà appliqué (281100, 411200, 443110, 467000…) |
| Anomalies / pédagogie | `lib/regulatoryKnowledge.ts` | ⚠️ Format court historique (4112, 4113, 421, 441…) conservé volontairement — sert de **clé de regroupement pédagogique** (sous-classe). Le moteur d'anomalies utilise le référentiel 6 chiffres. À ne pas migrer pour préserver la lisibilité côté formation. |
| Données mock balance | `lib/mockData.ts` | ⚠️ Format court (3-4 chiffres). Acceptable car données de démonstration legacy ; à migrer lors du prochain refactor démo. |

## 4. Règle de rédaction (à respecter pour les futurs ajouts)

1. **Tout nouveau compte saisi par l'utilisateur ou pré-rempli dans un menu
   déroulant doit être au format Op@le 6 chiffres** (ex. `411200`, jamais `4112`).
2. Les libellés affichés à l'utilisateur précisent toujours :
   `<6 chiffres> — <libellé court M9-6>` (ex. `412800 — Autres tiers redevables`).
3. Les comptes utilisés en clé de regroupement pédagogique (knowledge base,
   articles d'aide) peuvent rester en format court ; ils sont alors
   accompagnés de la mention « (racine M9-6) ».
4. Toute modification du référentiel `comptes_sens_normal_ref` (Supabase) doit
   conserver la cohérence avec `referentielFallback.ts` (6 chiffres).

## 5. Conformité réglementaire

- Instruction codificatrice **M9-6** (DGFiP / DGESCO)
- **Op@le** — plan de comptes 6 chiffres (déploiement EPLE)
- Ord. **2022-408** art. 11 (RGP) — créances familles
- Décret **2012-1246** (GBCP) — recouvrement
- LPF **L.262** & loi **2017-1837** art. 73 — SATD