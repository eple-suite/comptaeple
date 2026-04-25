# FORMULES BILANCIELLES — Compte financier EPLE

**Document de référence à destination du Rectorat / de l'autorité académique de contrôle.**

| | |
|---|---|
| Application | COFI-EPLE — module *Compte financier* |
| Périmètre | EPLE (lycées, collèges, EREA) – instruction M9-6 |
| Version document | 1.0 — avril 2026 |
| Sources réglementaires | M9-6 tomes 3 & 4 (DGFiP / DAF), Op@le pièce 14, Code de l'éducation art. R.421-66 et s. |
| Modules de calcul | `src/lib/compteFinancier/bilanFinancierEngine.ts` et `reprofiIndicateursEngine.ts` |
| Recette automatisée | `scripts/recette-diagnostic-financier.mjs` (exit 0 = conforme) |

> Les formules sont implémentées en TypeScript pur, sans dépendance UI ni base de données, ce qui garantit leur reproductibilité et leur auditabilité. Toutes les conventions de signe respectent les usages comptables EPLE (soldes débiteurs / créditeurs de la balance générale Op@le).

---

## Glossaire des notions financières

Le glossaire ci-dessous précise les sigles, hypothèses et unités utilisés dans tout le document. Chaque notion est rattachée à sa source réglementaire (M9-6, GBCP, Code de l'éducation) et au paragraphe technique correspondant.

| Sigle | Libellé complet | Définition synthétique | Unité | Hypothèses & conventions de calcul | Source / § |
|---|---|---|---|---|---|
| **FR** | Fonds de Roulement | Excédent durable des **capitaux permanents** (classes 10 à 18) sur l'**actif immobilisé net** (classes 20 à 27, nets de 28/29). Mesure la marge de manœuvre à moyen / long terme de l'EPLE. | € | Calculé selon **deux méthodes convergentes** (haut / bas de bilan), tolérance < 1 €. Les soldes sont lus à la **balance générale Op@le** en fin d'exercice. Le FR mobilisable est obtenu en retranchant les **réserves grevées** d'affectation spéciale (10681, 10683, 10687). | M9-6 t.4 art. 43231 — § 1 |
| **BFR** | Besoin en Fonds de Roulement | Solde net du **cycle d'exploitation** : créances d'exploitation (familles, État, collectivités, stocks) moins dettes d'exploitation (fournisseurs, personnel, organismes sociaux). | € | Limité au périmètre **exploitation pédagogique et restauration** : exclut volontairement les comptes financiers (50, 51, 53, 54) et les comptes de liaison. Un BFR positif signifie que l'EPLE finance temporairement son cycle d'exploitation. | M9-6 t.4 (analyse fonctionnelle) — § 2 |
| **TN** | Trésorerie Nette | Disponibilités effectives (Trésor, caisse, régies) diminuées des concours bancaires. Conceptuellement : `TN = FR − BFR`. | € | Vérifiée par **double lecture** : (a) `TN_calc = FR − BFR` ; (b) `TN_obs` lue à la balance (51 + 53 + 54 − 519). L'écart toléré est < 1 €. Les valeurs sont arrêtées au **31/12** ou à la date de clôture officielle. | M9-6 t.4 ; Op@le pièce 14 — § 3 |
| **CAF** | Capacité d'AutoFinancement | Flux de ressources internes dégagé par l'activité, disponible pour financer les investissements, rembourser des emprunts ou alimenter le FR. | € | Calculée par la **méthode additive** à partir du résultat (12), corrigée des dotations / reprises (681, 686, 687, 781, 786, 787) et des opérations de cession (675, 775, 777). Hypothèse : exercice clos, balance équilibrée, écritures de clôture passées. La méthode soustractive (à partir de l'EBE) sert de contrôle (`|CAF_add − CAF_sous| < 1 €`). | M9-6 t.4 ; PCG art. 832-7 ; GBCP — § 5 |
| **SRH** | Service annexe d'Restauration et d'Hébergement | Service à comptabilité distincte couvrant la restauration scolaire et, le cas échéant, l'hébergement (internat, demi-pension, commensaux). | € (réserves), unités physiques (repas) | Identifié par les comptes **70** (ventes de repas), **74** (subventions SRH éventuelles), **60-64** affectés au service. Les **réserves SRH** correspondent au compte **10681** : elles sont **grevées** (affectation spéciale) et ne peuvent financer le budget général sans délibération motivée du conseil d'administration. | M9-6 t.3 (plan comptable EPLE) ; Code éducation art. R.531-52 — § 8, § 9.1 |
| **Jours de fonctionnement** | Jours de FR / Jours de TN | Mesure du nombre de jours pendant lesquels l'EPLE peut couvrir ses **charges décaissables** courantes avec son FR (ou sa TN), sans ressources nouvelles. | jours (base **360**) | Formule : `Jours_X = (X / Charges_décaissables) × 360`. Les **charges décaissables** = total classe 6 net, **diminué** des dotations aux amortissements (681) et des dotations aux provisions (686, 687) qui ne donnent pas lieu à sortie de trésorerie. Base 360 retenue pour homogénéité avec les pratiques académiques. Seuils REPROFI : < 30 j critique / 30-60 fragile / 60-120 confortable / > 120 surdimensionné. | Pratique académique consolidée alignée M9-6 — § 4 |

### Notions complémentaires citées dans le document

| Sigle | Libellé | Précision |
|---|---|---|
| **EPLE** | Établissement Public Local d'Enseignement | Lycées, collèges, EREA — entités juridiques autonomes au sens des articles L.421-1 et R.421-1 et s. du Code de l'éducation. |
| **PCG** | Plan Comptable Général | Référentiel des numéros de comptes (1 à 7) appliqué aux EPLE via l'instruction M9-6. |
| **DCT** | Dettes à Court Terme | Dettes exigibles à moins d'un an : fournisseurs (40), personnel (42c), organismes sociaux (43c), État créditeur (44c), créditeurs divers (46c), comptes transitoires créditeurs (47c). |
| **ΔFR / ΔBFR / ΔTN** | Variations annuelles | Différentiel `N − N-1` ; servent à reconstruire le **tableau de financement** (M9-6 t.4) et à valider la triple convergence (cf. § 6). |
| **Op@le pièce 14** | Situation patrimoniale | Document officiel produit par Op@le présentant le bilan fonctionnel et servant de référence pour la confrontation FR / BFR / TN. |

### Hypothèses transversales

1. **Source de données unique** : balance générale Op@le après opérations d'inventaire et de clôture. Aucun retraitement extra-comptable n'est appliqué sans traçabilité.
2. **Devise et arrondi** : euros, arrondi à l'unité pour les montants, à une décimale pour les pourcentages, à une décimale pour les ratios et les durées en années.
3. **Conventions de signe** : un FR / BFR / TN / CAF positif est favorable (sauf BFR pour lequel un excédent peut signaler un sur-stockage). Les indicateurs en pourcentage sont **toujours positifs** (valeurs absolues utilisées le cas échéant, ex. § 9.4 CAP).
4. **Périodicité** : tous les indicateurs sont calculés sur l'exercice clos N. Les comparaisons N / N-1 utilisent des balances retraitées en cas de changement de périmètre (fusion, transfert SRH, etc.) — un commentaire explicite est alors apposé dans le rapport ordonnateur.
5. **Auditabilité** : chaque formule est implémentée dans un module TypeScript pur (sans I/O), couvert par la recette `recette-diagnostic-financier.mjs` exécutée à chaque livraison (CI GitHub Actions).

---

## Conventions et notations

- `Σ Deb(prefixe)` : somme des **soldes débiteurs** de tous les comptes dont le numéro PCG commence par `prefixe`.
- `Σ Cred(prefixe)` : somme des **soldes créditeurs** de tous les comptes dont le numéro PCG commence par `prefixe`.
- `SoldeNetCred(prefixe) = Σ Cred(prefixe) − Σ Deb(prefixe)` (utilisé pour les comptes structurellement créditeurs : 10, 11, 12, 13, 14, 15, 16, 18).
- Toutes les valeurs sont exprimées en euros, arrondies à l'unité dans les restitutions.
- La cohérence est vérifiée à l'arrondi près (écart toléré < 1 €).

---

## 1. Fonds de roulement (FR)

**Référence :** M9-6 tome 4, art. 43231 — *Détermination du fonds de roulement de l'établissement.*

Le FR est calculé selon **deux méthodes** qui doivent converger.

### 1.1 — Méthode du haut de bilan

```
FR_haut = Capitaux permanents − Actif immobilisé net
```

- **Capitaux permanents** = `SoldeNetCred(10) + SoldeNetCred(11) + SoldeNetCred(12) + SoldeNetCred(13) + SoldeNetCred(14) + SoldeNetCred(15) + SoldeNetCred(16) + SoldeNetCred(18)`
  - 10 : dotations, fonds, réserves
  - 11 : report à nouveau
  - 12 : résultat de l'exercice
  - 13 : subventions d'investissement
  - 14 : provisions réglementées
  - 15 : provisions pour risques et charges
  - 16 : emprunts et dettes assimilées
  - 18 : comptes de liaison (long terme)
- **Actif immobilisé net** = `[Σ Deb(20) + Σ Deb(21) + Σ Deb(23) + Σ Deb(26) + Σ Deb(27)] − Σ Cred(28) − Σ Cred(29)`

### 1.2 — Méthode du bas de bilan

```
FR_bas = Actif circulant − Dettes à court terme
```

- **Actif circulant** = `Σ Deb(3) + Σ Deb(41) + Σ Deb(42) + Σ Deb(43) + Σ Deb(44) + Σ Deb(45) + Σ Deb(46) + Σ Deb(47) + Σ Deb(50)`
- **Dettes court terme** = `Σ Cred(40) + Σ Cred(42) + Σ Cred(43) + Σ Cred(44) + Σ Cred(46) + Σ Cred(47)`

### 1.3 — Contrôle de cohérence

`|FR_haut − FR_bas| < 1 €` ⇒ équilibre du bilan validé.

### 1.4 — FR mobilisable (M9-6 art. 43231)

```
FR_mobilisable = FR − Réserves grevées d'affectation spéciale
```

Réserves grevées prises en compte :
- `10681` — réserves SRH (service annexe d'hébergement)
- `10683` — réserves taxe d'apprentissage
- `10687` — autres réserves affectées (manuels scolaires, projets pédagogiques sous condition d'emploi…)

---

## 2. Besoin en fonds de roulement (BFR)

**Référence :** M9-6 tome 4 (analyse fonctionnelle du bilan).

```
BFR = Actif circulant d'exploitation − Dettes d'exploitation
```

- **Actif circulant d'exploitation** = `Σ Deb(3) + Σ Deb(41) + Σ Deb(44) + Σ Deb(46)`
- **Dettes d'exploitation** = `Σ Cred(40) + Σ Cred(42) + Σ Cred(43) + Σ Cred(44) + Σ Cred(46)`

Les comptes financiers (50, 51, 53, 54) et les comptes de liaison sont exclus pour isoler le besoin strictement lié au cycle d'exploitation pédagogique et de restauration.

---

## 3. Trésorerie nette (TN)

**Référence :** M9-6 tome 4 ; Op@le pièce 14 (situation patrimoniale).

### 3.1 — TN par différence
```
TN_calc = FR − BFR
```

### 3.2 — TN observée à la balance
```
TN_obs = [Σ Deb(51) + Σ Deb(53) + Σ Deb(54)] − Σ Cred(519)
```

- 51 : banques et trésor
- 53 : caisse
- 54 : régies d'avances et d'accréditifs
- 519 : concours bancaires courants (à déduire)

### 3.3 — Contrôle

`|TN_calc − TN_obs| < 1 €` ⇒ cohérence balance / pièce 14 garantie.

---

## 4. Jours de fonctionnement (base 360)

**Référence :** pratique académique consolidée alignée sur la grille indicative M9-6.

```
Charges_décaissables = (Σ Deb(6) − Σ Cred(6)) − Dot_amort_681 − Dot_prov_686 − Dot_prov_687

Jours_FR = (FR / Charges_décaissables) × 360
Jours_TN = (TN / Charges_décaissables) × 360
```

**Seuils d'évaluation des Jours_FR :**

| Niveau | Plage |
|---|---|
| 🔴 Critique | < 30 jours |
| 🟠 Fragile | 30 – 60 jours |
| 🟢 Confortable | 60 – 120 jours |
| 🔵 Surdimensionné | > 120 jours |

---

## 5. Capacité d'autofinancement (CAF)

**Référence :** M9-6 tome 4 ; PCG art. 832-7 ; instruction DGFiP comptable EPLE.

### 5.1 — Méthode additive (à partir du résultat)

```
CAF = Résultat
    + Dotations aux amortissements & provisions (681 + 686 + 687)
    − Reprises sur amortissements & provisions (781 + 786 + 787)
    + Valeur nette comptable des actifs cédés (675)
    − Produits de cessions (775)
    − Quote-part des subventions d'investissement virées au résultat (777)
```

où `Résultat = SoldeNetCred(12)`.

### 5.2 — Méthode soustractive (à partir de l'EBE)

Servant de contrôle, elle doit converger avec la méthode additive (`|CAF_add − CAF_sous| < 1 €`).

---

## 6. Variation de FR (triple approche)

**Référence :** M9-6 tome 4 — *Tableau de financement.*

```
ΔFR_calc    = FR_N − FR_N−1
ΔFR_caf     = CAF − Investissements_nets + Subventions_invest_reçues − Remboursements_emprunts
ΔFR_observé = ΔTN + ΔBFR
```

Les trois doivent converger à l'arrondi près (`max(|ΔFR_calc − ΔFR_caf|, |ΔFR_calc − ΔFR_observé|) < 1 €`).

---

## 7. Autonomie financière (ratio structurel)

```
Autonomie = Capitaux propres / Ressources stables totales

Capitaux propres   = SoldeNetCred(10) + SoldeNetCred(11) + SoldeNetCred(12) + SoldeNetCred(13)
Ressources stables = Capitaux propres + SoldeNetCred(16) + SoldeNetCred(14) + SoldeNetCred(15) + SoldeNetCred(18)
```

| Niveau | Plage |
|---|---|
| 🟠 Faible | < 50 % |
| 🟢 Normale | 50 – 80 % |
| 🔵 Forte | > 80 % |

---

## 8. Détail des réserves (M9-6 tome 4 art. 43231)

| Code | Rubrique | Compte PCG |
|---|---|---|
| `reservesGenerales` | Réserves générales (libres d'emploi) | `10682` |
| `reservesSRH` | Réserves SRH (service annexe d'hébergement) | `10681` |
| `reservesTaxeApprent` | Réserves taxe d'apprentissage | `10683` |
| `reservesAffectees` | Autres réserves affectées | `10687` |
| `reservesAutres` | Autres `1068x` non listés | `1068x` résiduels |
| `total` | Somme des 5 rubriques | Σ `1068x` |

---

## 9. Diagnostic financier — 10 indicateurs réglementaires

Les 10 indicateurs ci-dessous (1 panier de réserves + 9 ratios) constituent le **bouquet de diagnostic financier EPLE** restitué dans le rapport ordonnateur, le document CA et le PDF de diagnostic. Référence : grille indicative M9-6, alignée sur les pratiques académiques.

### 9.1 — Réserves (cf. § 8)

Indicateur de diagnostic structurel, ventilé en 5 rubriques. Pas de seuil de niveau (analyse qualitative).

### 9.2 — Taux de non-recouvrement (NR)

```
NR = Σ Deb(416) / [Σ Deb(411) + Σ Deb(416)] × 100
```

| Niveau | Plage |
|---|---|
| 🔵 Excellent | < 2 % |
| 🟢 Normal | 2 – 5 % |
| 🟠 Fragile | 5 – 10 % |
| 🔴 Critique | > 10 % |

### 9.3 — Provisions pour contentieux (CONT)

```
CONT = SoldeNetCred(1511) / [Σ Deb(6) − Σ Cred(6)] × 100
```

| Niveau | Plage |
|---|---|
| 🔵 Excellent | 0 % (pas de litige provisionné) |
| 🟢 Normal | 0 – 2 % |
| 🟠 Fragile | 2 – 5 % |
| 🔴 Critique | > 5 % |

### 9.4 — Comptes d'attente provisoires (CAP)

```
CAP = |Σ Deb(47) − Σ Cred(47)|
```

| Niveau | Plage |
|---|---|
| 🔵 Excellent | ≤ 1 000 € |
| 🟢 Normal | 1 000 – 10 000 € |
| 🟠 Fragile | 10 000 – 50 000 € |
| 🔴 Critique | > 50 000 € |

Tend vers 0 en clôture (M9-6 tome 3, instructions de fin d'exercice).

### 9.5 — Vétusté du parc immobilier (VETU)

```
VETU = Σ Cred(281) / Σ Deb(21) × 100
```

| Niveau | Plage |
|---|---|
| 🔵 Excellent | < 30 % |
| 🟢 Normal | 30 – 60 % |
| 🟠 Fragile | 60 – 80 % |
| 🔴 Critique | > 80 % |

### 9.6 — Dépendance générale aux subventions (DGP)

```
DGP = [Σ Cred(74) − Σ Deb(74)] / [Σ Cred(7) − Σ Deb(7)] × 100
```

| Niveau | Plage |
|---|---|
| 🟢 Normal | < 60 % |
| 🟠 Fragile | 60 – 80 % |
| 🔴 Critique | > 80 % |

### 9.7 — Poids des charges fixes (CHFIX)

```
ChargesFixes = (Σ Deb(64) − Σ Cred(64))
             + (Σ Deb(63) − Σ Cred(63))
             + (Σ Deb(681) − Σ Cred(681))

CHFIX = ChargesFixes / [Σ Deb(6) − Σ Cred(6)] × 100
```

| Niveau | Plage |
|---|---|
| 🟢 Normal | < 60 % |
| 🟠 Fragile | 60 – 75 % |
| 🔴 Critique | > 75 % |

### 9.8 — Capacité d'endettement (ENDET)

```
ENDET = SoldeNetCred(16) / CAF   (en années)
```

Si CAF ≤ 0 et dettes > 0 : ENDET = 999 (capacité épuisée).

| Niveau | Plage |
|---|---|
| 🔵 Excellent | < 2 ans |
| 🟢 Normal | 2 – 5 ans |
| 🟠 Fragile | 5 – 8 ans |
| 🔴 Critique | > 8 ans |

### 9.9 — Liquidité immédiate (LIQ)

```
LIQ = [Σ Deb(51) + Σ Deb(53) + Σ Deb(54)]
    / [Σ Cred(40) + Σ Cred(42) + Σ Cred(43) + Σ Cred(44) + Σ Cred(46)]
```

| Niveau | Plage |
|---|---|
| 🔴 Critique | < 0,8 |
| 🟠 Fragile | 0,8 – 1,2 |
| 🟢 Normal | 1,2 – 2,0 |
| 🔵 Excellent | > 2,0 |

### 9.10 — Indépendance financière (INDEP)

```
INDEP = Capitaux propres / [Capitaux propres + Dettes financières] × 100

Capitaux propres   = SoldeNetCred(10) + SoldeNetCred(11) + SoldeNetCred(12) + SoldeNetCred(13)
Dettes financières = SoldeNetCred(16)
```

| Niveau | Plage |
|---|---|
| 🔴 Critique | < 50 % |
| 🟠 Fragile | 50 – 70 % |
| 🟢 Normal | 70 – 90 % |
| 🔵 Excellent | > 90 % |

---

## 10. Recette automatisée

Le script `scripts/recette-diagnostic-financier.mjs` valide à chaque livraison :

1. **Invariants mathématiques** : `FR_haut = FR_bas`, `TN_obs` cohérente avec la balance, somme des 5 rubriques de réserves = total.
2. **Scénario sain** : aucun indicateur en alerte critique, NR / ENDET / INDEP en zone confortable.
3. **Scénario vigilance** : NR fragile, vétusté fragile, CAP fragile.
4. **Scénario critique** : NR > 10 %, vétusté > 80 %, DGP > 80 %, CAP > 50 000 €, verdict signalant un risque.

Exécution : `npx tsx scripts/recette-diagnostic-financier.mjs` — **exit 0 = recette validée**.

---

## 11. Sources et références consultables

- **Instruction codificatrice M9-6**, tomes 3 (plan comptable) et 4 (analyse financière, art. 43231) — DGFiP / DAF.
- **Pièce 14 du compte financier Op@le** — situation patrimoniale et tableau de financement.
- **Code de l'éducation**, articles R.421-66 et suivants (compte financier de l'EPLE).
- **Décret GBCP** n° 2012-1246 (gestion budgétaire et comptable publique) pour la terminologie de la CAF et du tableau de financement.

---

*Document généré et maintenu à jour à partir du code source. Pour toute évolution réglementaire, mettre à jour les engines `bilanFinancierEngine.ts` et `reprofiIndicateursEngine.ts` puis régénérer ce document.*
