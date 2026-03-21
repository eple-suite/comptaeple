# PROMPT LOVABLE — MODULE « COMPTE FINANCIER » DU COCKPIT COMPTABLE
## Refonte complète et profonde — Objectif : surpasser REPROFI 4.6

---

## CONTEXTE GÉNÉRAL

Tu travailles sur l'application **Cockpit Comptable**, une application React/TypeScript/Tailwind/shadcn-ui déployée sur Lovable, destinée aux agents comptables d'EPLE (Établissements Publics Locaux d'Enseignement) en France. Elle est basée sur la **M9-6 édition 2026**, le **Code de l'Éducation** et le **décret GBCP 2012-1246**.

L'application importe déjà 6 fichiers (Excel ou CSV) :
- `depenses_N` : situation des dépenses de l'exercice N
- `depenses_N1` : situation des dépenses de l'exercice N-1
- `recettes_N` : situation des recettes de l'exercice N
- `recettes_N1` : situation des recettes de l'exercice N-1
- `balance_N` : balance des comptes de l'exercice N
- `balance_N1` : balance des comptes de l'exercice N-1

**⚠️ IMPÉRATIF ABSOLU : Ne pas toucher aux modules d'importation existants. Conserver intégralement le système d'import et la persistence localStorage de ces 6 fichiers. Tous les calculs du module Compte Financier doivent lire ces données depuis le store existant.**

---

## OBJECTIF

Reconstruire entièrement le menu **« Compte Financier »** pour qu'il soit **2 fois supérieur à REPROFI 4.6** (outil Excel de référence des EPLE), avec :
1. Tous les indicateurs de REPROFI + de nombreux indicateurs supplémentaires
2. Des commentaires IA générés automatiquement en référence à la M9-6
3. Un rapport de l'ordonnateur complet (bien au-delà des 8 indicateurs actuels)
4. Un rapport de l'agent comptable avec commentaires éditables + IA
5. Un suivi pluriannuel sur 5 exercices avec saisie manuelle des données antérieures
6. Une vérification automatique des points bloquants
7. Un rapport PDF complet générable en un clic
8. Une intelligence croisée avec les autres menus de l'application

---

## ARCHITECTURE DU MENU « COMPTE FINANCIER »

### Structure des sous-menus (tabs ou sidebar) :

```
📁 Compte Financier
├── 🏛️ Vue d'ensemble
├── 📊 Rapport Ordonnateur (Rpt Ordo)
│   ├── Exécution Budgétaire Dépenses
│   ├── Exécution Budgétaire Recettes
│   ├── Analyse des Écarts
│   ├── Opérations d'Ordre
│   └── Résultats de l'Exercice
├── 📋 Rapport Agent Comptable (Rpt AC)
│   ├── Équilibre Financier (FDR / BFR / Trésorerie)
│   ├── Autofinancement (CAF / IAF)
│   ├── Ratios de Gestion
│   ├── Analyse des Restes
│   ├── Vérifications Comptables
│   └── Saisie Données Complémentaires
├── 📅 Évolution Pluriannuelle (N à N-4)
├── ⚠️ Points Bloquants (15 vérifications M9-6)
├── 🤖 Analyse IA Globale
└── 📄 Génération Rapport Complet
```

---

## MODULE 1 — VUE D'ENSEMBLE (Dashboard)

Créer un dashboard résumé avec :

### KPI Cards (ligne du haut, 6 cartes) :
| Indicateur | Formule | Couleur seuil |
|---|---|---|
| Fonds de Roulement (FDR) | Capitaux permanents − Actif immobilisé net | Vert si >0, Rouge si <0 |
| Besoin en FDR (BFR) | Actif circulant hors tréso − Dettes court terme hors tréso | Vert si BFR<FDR, Orange sinon |
| Trésorerie Nette | FDR − BFR | Vert si >0, Rouge si <0 |
| CAF / IAF | Résultat + dotations − reprises | Vert/Rouge |
| Taux exécution dépenses | Mandats N / Crédits ouverts N | Vert si 85-100% |
| Taux exécution recettes | Titres N / Prévisions N | Vert si ≥90% |

### Graphique radar (8 axes) :
- Liquidité, Solvabilité, Autonomie financière, Taux dépenses, Taux recettes, Délai paiement, CAF, Trésorerie

### Alertes automatiques (badges rouges) :
- Points bloquants détectés
- Soldes anormaux
- Indicateurs hors seuils M9-6

---

## MODULE 2 — RAPPORT DE L'ORDONNATEUR (Rpt Ordo)

### 2.1 — Exécution budgétaire en DÉPENSES

Calculer et afficher pour chaque **section** (Fonctionnement, Investissement, Annexes) et chaque **service** (01 Administration générale, 02 Activités pédagogiques, 03 Hébergement/restauration, etc.) :

| Colonne | Formule |
|---|---|
| Crédits ouverts N | Issu de `depenses_N` colonne "Crédits ouverts" |
| Crédits ouverts N-1 | Issu de `depenses_N1` |
| Mandats N | Issu de `depenses_N` colonne "Mandats émis" |
| Mandats N-1 | Issu de `depenses_N1` |
| Restes à réaliser N | Crédits ouverts N − Mandats N |
| Taux d'exécution N | (Mandats N / Crédits ouverts N) × 100 |
| Taux d'exécution N-1 | (Mandats N-1 / Crédits ouverts N-1) × 100 |
| Variation | Mandats N − Mandats N-1 |
| Évolution % | ((Mandats N − Mandats N-1) / Mandats N-1) × 100 |
| Commentaire IA | Bouton « Générer » via API Claude |
| Commentaire manuel | Zone de texte éditable (persistée) |

**Indicateurs synthèse section Fonctionnement :**
- Taux global de consommation des crédits (cote M9-6 §4.3.2)
- Répartition des dépenses par domaine (D1 à D9)
- Part des dépenses de personnel (compte 6411, 6413) / Total dépenses
- Part des dépenses pédagogiques / Total dépenses
- Analyse des DBM : nombre, montant total, % du budget initial
- Opérations d'ordre budgétaires (OOB) : total, justification

**Tableau comparatif N/N-1 par domaine :**
```
D1 - Actes de gestion courante
D2 - Formation initiale sous statut scolaire  
D3 - Formation continue adultes
D4 - Formation par apprentissage
D5 - Hébergement et restauration
D6 - Social et santé
D7 - Culturel, sportif, environnemental
D8 - Investissement
D9 - Opérations en capital
```

### 2.2 — Exécution budgétaire en RECETTES

Même structure que dépenses, avec :

| Colonne | Formule |
|---|---|
| Prévisions initiales N | Issu de `recettes_N` |
| Prévisions révisées N | Après DBM |
| Titres émis N | Issu de `recettes_N` |
| Encaissements N | Issu de balance_N (compte 5112/5115) |
| Restes à recouvrer N | Titres émis N − Encaissements N |
| Taux de réalisation recettes N | (Titres N / Prévisions révisées N) × 100 |
| Taux d'encaissement N | (Encaissements N / Titres N) × 100 |

**Indicateurs recettes spécifiques :**
- Part des ressources propres / Total recettes (autonomie financière)
- Part de la subvention de fonctionnement CT / Total recettes
- Part des ressources humaines mises à disposition
- Taux de réalisation des ressources propres (objectif M9-6 §3.2)
- Produits des services annexes (restauration, hébergement)
- Évolution recettes N vs N-1 par source de financement
- Analyse des recettes exceptionnelles

### 2.3 — Résultats de l'exercice

```
Résultat section Fonctionnement = Recettes réalisées − Dépenses exécutées
Résultat section Investissement = Recettes Invest − Dépenses Invest
Résultat global = Résultat Fonct + Résultat Invest
Report à nouveau N-1 (saisie manuelle si non disponible)
Résultat cumulé = Résultat global + RAN N-1
```

Afficher :
- Excédent ou déficit avec badge coloré
- Interprétation automatique selon M9-6 §4.4 (CAF positive = autofinancement)
- Comparaison avec N-1

### 2.4 — Analyse des écarts budgétaires

Pour chaque service/domaine : 
- Écart absolu = Mandats − Prévisions révisées
- Écart relatif = Écart / Prévisions révisées × 100
- Classement des 5 plus grands écarts (positifs et négatifs)
- Commentaire automatique sur les écarts significatifs (>10%)

### 2.5 — Opérations d'ordre

Tableau des opérations d'ordre budgétaires et non budgétaires (M9-6 §5.3) :
- OOB (opérations d'ordre budgétaires) : amortissements, provisions
- OONB (opérations d'ordre non budgétaires) : virements de compte
- Vérification de l'équilibre des OO (D = R pour chaque opération)

---

## MODULE 3 — RAPPORT DE L'AGENT COMPTABLE (Rpt AC)

### 3.1 — Équilibre financier : FDR / BFR / Trésorerie

**Méthode de calcul conforme M9-6 §4.5.3 (obligatoire) :**

#### BILAN FINANCIER CONDENSÉ (extrait de la balance)

**Actif immobilisé net (AI) :**
```
Comptes 2xxx net = Immobilisations brutes − Amortissements (28xx)
  Immobilisations incorporelles : C/20x − C/280x
  Terrains : C/211
  Constructions : C/213 − C/2813
  Installations techniques : C/215 − C/2815
  Mobilier bureau, matériel informatique : C/218 − C/2818
  Immobilisations en cours : C/23x
  Immobilisations financières : C/26x, C/27x
```

**Actif circulant hors trésorerie (ACT) :**
```
Stocks : C/3xxx
Créances clients (titres à recouvrer) : C/41x − C/491x (provision)
Autres créances : C/4xxx (hors 5xxx)
Charges constatées d'avance : C/486
```

**Trésorerie Actif (TA) :**
```
Disponibilités : C/5115 (compte au Trésor)
  + C/5112 (régies)
  + C/5141 (compte bancaire si existant)
  + C/5311 (caisse)
```

**Capitaux permanents (CP) :**
```
Fonds propres : C/10xxx
  C/102 : Dotations
  C/106 : Réserves
  C/110 : Report à nouveau (solde créditeur)
  C/120 : Résultat positif de l'exercice
Provisions pour risques et charges : C/15x
Emprunts et dettes assimilées LT : C/16x (> 1 an)
```

**Dettes à court terme hors trésorerie (DCT) :**
```
Dettes fournisseurs : C/401x − C/408x
Dettes État/CT (subventions à rembourser) : C/441x, C/451x
Produits constatés d'avance : C/487
Autres dettes CT : C/4xxx court terme
Emprunts CT (< 1 an) : fraction CT du C/16x
```

**Trésorerie Passif (TP) :**
```
Concours bancaires courants : C/519 (si débiteur)
```

**Calculs :**
```
FDR = CP − AI
  (ou FDR = ACT + TA − DCT − TP, vérification par le bas du bilan)
BFR = ACT − DCT
Trésorerie Nette (TN) = TA − TP = FDR − BFR
```

**FDR mobilisable (FDRm) — M9-6 §4.5.3.2 :**
```
FDRm = FDR − Réserves obligatoires − Engagements pluriannuels non liquidés
     = TN + BFR − Stocks incompressibles − Créances douteuses
```
*(Les réserves obligatoires et engagements sont à saisir manuellement)*

**Affichage :**
- Tableau bilan condensé N vs N-1 (4 masses : AI, ACT+TA, CP, DCT+TP)
- Graphique en barres empilées comparant N et N-1
- FDR, BFR, TN en grandes cartes colorées avec variation N/N-1
- Interprétation automatique :
  - TN > 0 : "La structure financière est saine. Le FDR couvre le BFR."
  - TN < 0 : "⚠️ La trésorerie nette est négative. Le BFR excède le FDR."
  - FDR < 0 : "🔴 ALERTE : Le fonds de roulement est négatif. L'actif immobilisé n'est pas intégralement financé par les ressources permanentes (M9-6 §4.5.3.1)."

### 3.2 — Autofinancement (CAF / IAF)

**M9-6 §4.5.4 :**
```
CAF = Résultat net de l'exercice
    + Dotations aux amortissements (C/68x)
    + Dotations aux provisions (C/68x)
    − Reprises sur amortissements (C/78x)
    − Reprises sur provisions (C/78x)
    − Produits des cessions d'éléments d'actif (C/775)
    + Valeur comptable des éléments cédés (C/675)
```

Si CAF > 0 : capacité d'autofinancement → finance le renouvellement des immobilisations  
Si CAF < 0 : insuffisance d'autofinancement (IAF) → signal d'alerte

**Taux d'autofinancement :**
```
Taux CAF = CAF / Total des dépenses × 100
```

**Zone de commentaire** :
- Commentaire IA automatique (bouton) référençant §4.5.4 de la M9-6
- Champ texte éditable pour commentaire personnalisé du comptable
- Les deux sont persistés en localStorage

### 3.3 — Ratios de gestion

Calculer et afficher les ratios suivants avec leur valeur N, valeur N-1, variation, interprétation et référence M9-6 :

| Ratio | Formule | Seuil M9-6 | Référence |
|---|---|---|---|
| Ratio de liquidité générale | ACT / DCT | ≥ 1 | §4.5.3 |
| Ratio de liquidité réduite | (ACT − Stocks) / DCT | ≥ 0,8 | §4.5.3 |
| Ratio de liquidité immédiate | TA / DCT | ≥ 0,2 | §4.5.3 |
| Ratio d'autonomie financière | Fonds propres / Total passif | ≥ 0,5 | §4.5.5 |
| Ratio de solvabilité générale | Total actif / Total dettes | ≥ 1,5 | §4.5.5 |
| Taux d'endettement | Dettes LT / CP | ≤ 0,5 | §4.5.5 |
| Délai global de paiement (DGP) | (Dettes fournisseurs / Achats TTC) × 365 | ≤ 30 jours | §4.5.6 |
| Délai global de recouvrement | (Créances / CA TTC) × 365 | À surveiller | §4.5.6 |
| Taux de charges de personnel | Charges C/6411+6413 / Total charges | Benchmark | §4.5.7 |
| Ratio d'investissement | Dépenses Invest / Total dépenses | — | §4.5.8 |
| Taux de réalisation recettes propres | Recettes propres / Prévisions recettes propres | ≥ 90% | §3.2 |
| Taux de couverture des charges | Recettes propres / Charges propres | — | — |

**Pour chaque ratio :**
- Jauge visuelle (progress bar) avec zone verte/orange/rouge
- Flèche de tendance vs N-1
- Info-bulle avec explication du ratio et référence M9-6 exacte
- Champ commentaire éditable
- Bouton « Commentaire IA » (appel API Claude)

### 3.4 — Analyse des restes

#### Restes à recouvrer (RAR) :
```
RAR total N = Titres émis N − Encaissements N
RAR N-1 non encore recouvrés = Solde C/41x − C/491x
Taux de RAR = RAR / Titres émis × 100
Ancienneté des RAR : < 1 an, 1-2 ans, > 2 ans (saisie manuelle)
```

Afficher :
- Montant total RAR
- RAR par nature (frais scolaires, restauration, autres)
- Tableau de vieillissement (créances 0-30j, 31-60j, 61-90j, > 90j)
- Taux de recouvrement effectif
- Provisions constituées (C/491x) vs RAR
- Commentaire IA sur la politique de recouvrement
- Champ commentaire comptable

#### Restes à payer (RAP) :
```
RAP = Dépenses mandatées non encore payées = Solde C/401x
```

- Montant RAP total
- RAP > 30 jours (risque retard de paiement)
- Analyse conformité décret 2013-269 (délais de paiement)

### 3.5 — Vérifications comptables automatiques (15 points M9-6)

Créer une liste de vérifications booléennes avec statut ✅/⚠️/❌ :

```
1.  Concordance balance / grand livre
    → Vérification : Σ soldes débiteurs balance = Σ soldes créditeurs balance
    → Formule : Total colonnes SD − Total colonnes SC = 0

2.  Équilibre du bilan
    → Total Actif = Total Passif (à ±1€ près pour arrondis)

3.  Compte 185 soldé (virements internes)
    → Solde C/185 = 0 (M9-6 §5.3.2)
    → Point bloquant au CF si ≠ 0

4.  Compte 181 soldé (mouvements entre ordonnateur et comptable)
    → Solde C/181 = 0

5.  Absence de soldes débiteurs sur comptes de ressources (1xxx, 4xxx créditeurs)
    → Alerter si C/10x, C/15x, C/16x en solde débiteur anormal

6.  Absence de soldes créditeurs sur comptes d'emplois (2xxx, 3xxx, 4xxx débiteurs)
    → Alerter si C/411x en solde créditeur (= un client nous doit moins que 0 ?)

7.  Concordance compte courant Trésor
    → Solde C/5115 = Solde du relevé de compte du Trésor (saisie manuelle du relevé)

8.  Concordance recettes ordonnateur / comptable
    → Total titres émis (sphère ordo) = Total titres pris en charge (sphère compta)
    → Écart = 0 exigé

9.  Concordance dépenses ordonnateur / comptable
    → Total mandats émis (sphère ordo) = Total mandats payés (sphère compta)
    → Écart = Mandats non encore payés (RAP) → à justifier

10. Dotations aux amortissements calculées
    → Solde C/68x > 0 si immobilisations amortissables existent
    → Alerte si C/21x−C/28x > 0 ET C/68x = 0

11. Provisions pour risques constituées si RAR > 0
    → Solde C/491x > 0 si RAR significatifs
    → Alerte si C/41x > seuil (ex: > 5% recettes) ET C/491x = 0

12. Compte 119 (déficits reportés) vérifié
    → Si C/119 en solde débiteur : déficit antérieur non résorbé → signaler

13. Résultat exercice comptable = Résultat exercice budgétaire (hors OOB/OONB)
    → Écart acceptable : uniquement OO et produits/charges sans contrepartie budgétaire

14. Vérification des comptes de régularisation
    → C/486 (CCA) et C/487 (PCA) justifiés
    → Alerte si montants inhabituellement élevés (> 10% du total)

15. Absence de compte de classe 8 (engagements hors bilan)
    → Les EPLE n'utilisent généralement pas la classe 8, sauf engagements spécifiques
    → Afficher si des montants sont présents en C/8xxx
```

**Pour chaque vérification :**
- Statut calculé automatiquement depuis la balance (quand possible)
- Statut saisi manuellement avec justification (quand non calculable)
- Lien vers la cote M9-6 correspondante
- Champ "Observation du comptable" persisté

### 3.6 — Saisie données complémentaires (non importables)

Certains indicateurs ne peuvent pas être calculés depuis les 6 fichiers importés. Créer un formulaire de saisie structuré :

```
DONNÉES EXERCICE N (à saisir par le comptable) :
├── Solde compte courant Trésor au 31/12 (relevé Trésor)
├── Engagements pluriannuels non liquidés
├── Réserves obligatoires (fonds de roulement minimum légal)
├── Montant des RAR par ancienneté (0-1 an, 1-2 ans, >2 ans)
├── Nombre d'élèves (effectif moyen annuel)
├── Nombre de jours ouvrés restauration
├── Valeur des biens mis à disposition par la CT (hors bilan)
└── Observations générales du comptable

DONNÉES PLURIANNUELLES (N-2 à N-4, saisie une fois puis persistée) :
├── FDR des exercices N-2, N-3, N-4
├── BFR des exercices N-2, N-3, N-4
├── TN des exercices N-2, N-3, N-4
├── CAF des exercices N-2, N-3, N-4
├── Taux d'exécution dépenses N-2, N-3, N-4
├── Taux d'exécution recettes N-2, N-3, N-4
└── Résultats des exercices N-2, N-3, N-4
```

Toutes ces données sont persistées en **localStorage** sous la clé `cockpit_cf_complementaire`.

---

## MODULE 4 — ÉVOLUTION PLURIANNUELLE (N à N-4)

### 4.1 — Tableau de bord historique

Créer un tableau comparatif sur 5 exercices pour les indicateurs clés :

| Indicateur | N-4 | N-3 | N-2 | N-1 | N | Tendance |
|---|---|---|---|---|---|---|
| FDR (€) | | | | | | ↗/↘/→ |
| BFR (€) | | | | | | |
| TN (€) | | | | | | |
| CAF (€) | | | | | | |
| FDRm (€) | | | | | | |
| Taux exécution dépenses (%) | | | | | | |
| Taux exécution recettes (%) | | | | | | |
| Taux liquidité générale | | | | | | |
| Ratio autonomie financière (%) | | | | | | |
| DGP (jours) | | | | | | |
| RAR (€) | | | | | | |
| Résultat exercice (€) | | | | | | |

- Colonnes N et N-1 : calculées automatiquement depuis les imports
- Colonnes N-2 à N-4 : issues de la saisie manuelle du Module 3.6
- Flèche de tendance calculée sur les 3 dernières années

### 4.2 — Graphiques d'évolution

4 graphiques en courbes (recharts) :
1. **Évolution FDR / BFR / TN** sur 5 ans (3 courbes)
2. **Évolution taux d'exécution** dépenses et recettes (2 courbes)
3. **Évolution CAF** sur 5 ans (1 barre + courbe tendance)
4. **Évolution résultats** de l'exercice (barres + ligne 0)

### 4.3 — Commentaire d'évolution IA

Bouton « Analyser les tendances sur 5 ans » :
- Appel API Claude avec tous les chiffres historiques
- Analyse automatique des tendances
- Identification des exercices atypiques
- Recommandations pour l'exercice suivant
- Résultat affiché dans une zone éditable (le comptable peut modifier avant d'inclure au rapport)

---

## MODULE 5 — POINTS BLOQUANTS (PRÉREQUIS AU COMPTE FINANCIER)

Créer un module dédié avec 3 niveaux de sévérité :

### 🔴 Points bloquants MAJEURS (empêchent l'arrêté du CF) :

```
PB-01 : Compte 185 non soldé
  → Vérifier solde C/185 dans balance_N
  → Si ≠ 0 : "BLOQUANT — Le compte 185 (Opérations en attente) n'est pas soldé.
     Les virements internes entre services doivent être tous extournés avant clôture.
     Référence : M9-6 §5.3.2"

PB-02 : Déséquilibre de la balance
  → Σ SD ≠ Σ SC : bloquant absolu

PB-03 : Résultat comptable non concordant avec résultat budgétaire
  → Écart inexplicable par les opérations d'ordre

PB-04 : Compte courant Trésor non rapproché
  → Écart entre C/5115 et relevé Trésor non justifié
```

### 🟠 Points d'attention MAJEURS (nécessitent justification) :

```
PA-01 : FDR négatif
PA-02 : TN négative (> -10% des recettes totales)
PA-03 : Taux d'exécution dépenses < 75% (sous-consommation anormale)
PA-04 : RAR > 5% des titres émis sans provision suffisante
PA-05 : DGP > 30 jours (décret 2013-269)
PA-06 : Dotations aux amortissements manquantes
PA-07 : Déficit reporté (C/119 débiteur)
```

### 🟡 Points de vigilance (à commenter dans le rapport) :

```
PV-01 : Forte variation FDR vs N-1 (>25%)
PV-02 : Taux d'exécution recettes < 90%
PV-03 : CAF négative (IAF)
PV-04 : Ratio liquidité < 1
PV-05 : Autonomie financière < 50%
PV-06 : Stocks > 3% du total actif sans explication
```

**Pour chaque point :**
- Statut calculé automatiquement
- Référence M9-6 précise
- Prescription réglementaire (texte complet)
- Champ "Action corrective prise" persisté
- Date de résolution saisie

---

## MODULE 6 — ANALYSE IA GLOBALE

### Interface :

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 ANALYSE IA — Compte Financier Exercice N                │
│                                                             │
│  [Générer l'analyse complète]  [Réinitialiser]             │
│                                                             │
│  Périmètre :                                                │
│  ☑ Rapport ordonnateur    ☑ Rapport comptable              │
│  ☑ Points bloquants       ☑ Évolution pluriannuelle        │
│  ☑ Recommandations        ☑ Formulation CRC                │
│                                                             │
│  Niveau de détail : ○ Résumé  ● Standard  ○ Exhaustif     │
│                                                             │
│  [Zone résultat IA — éditable]                             │
│                                                             │
│  [Copier]  [Inclure au rapport PDF]                        │
└─────────────────────────────────────────────────────────────┘
```

### Appel API Claude (claude-sonnet-4-20250514) :

```typescript
const systemPrompt = `
Tu es un expert en comptabilité publique des EPLE (Établissements Publics Locaux 
d'Enseignement), spécialisé dans l'instruction codificatrice M9-6 édition 2026,  
le décret GBCP 2012-1246 et le Code de l'Éducation.

Tu dois rédiger le rapport d'analyse financière de l'exercice N pour cet EPLE.
Le rapport doit :
1. Respecter le vocabulaire réglementaire exact (M9-6)
2. Citer les cotes précises de la M9-6 à l'appui de chaque affirmation
3. Structurer le rapport en : Exécution budgétaire / Situation financière / Points de vigilance / Recommandations
4. Adopter le ton professionnel d'un rapport destiné au conseil d'administration et à la CRC
5. Être factuel, précis, et proposer des explications sur les variations significatives
6. Mentionner explicitement les points positifs ET les axes d'amélioration
7. Conclure par des recommandations opérationnelles pour l'exercice N+1
`;

const userPrompt = `
Voici les données financières de l'EPLE pour l'exercice N :

SECTION BUDGÉTAIRE :
${JSON.stringify(budgetData, null, 2)}

SECTION COMPTABLE :
FDR = ${fdr}€ (N-1 : ${fdrN1}€)
BFR = ${bfr}€ (N-1 : ${bfrN1}€)
TN = ${tn}€ (N-1 : ${tnN1}€)
CAF = ${caf}€
...

RATIOS :
${JSON.stringify(ratios, null, 2)}

POINTS BLOQUANTS :
${JSON.stringify(pointsBloquants, null, 2)}

ÉVOLUTION PLURIANNUELLE (N-4 à N) :
${JSON.stringify(historique, null, 2)}

Rédige un rapport d'analyse financière complet, structuré et professionnel.
`;
```

---

## MODULE 7 — GÉNÉRATION DU RAPPORT COMPLET PDF

### Contenu du rapport généré :

**PAGE DE GARDE :**
- Logo République Française (Marianne)
- Nom de l'établissement (depuis paramètres application)
- UAI/RNE
- Exercice N
- Date de génération
- Nom et qualité du comptable

**SOMMAIRE AUTOMATIQUE :**
1. Rapport de l'ordonnateur
2. Rapport de l'agent comptable
3. Analyse pluriannuelle
4. Points bloquants et observations

**RAPPORT DE L'ORDONNATEUR (Annexe B du compte financier) :**
- Tableau d'exécution budgétaire dépenses (tous services)
- Tableau d'exécution budgétaire recettes (toutes natures)
- Analyse des écarts significatifs
- Résultats de l'exercice

**RAPPORT DE L'AGENT COMPTABLE :**
- Bilan financier condensé
- Tableau FDR / BFR / TN
- Tableau des ratios (20 ratios)
- Analyse de l'autofinancement
- Analyse des restes à recouvrer et à payer
- Vérifications comptables (15 points)

**ÉVOLUTION PLURIANNUELLE :**
- Tableau historique 5 ans
- Graphiques en version imprimable

**POINTS BLOQUANTS ET OBSERVATIONS :**
- Liste des points bloquants avec statut
- Actions correctives
- Observations du comptable

**ANALYSE ET RECOMMANDATIONS IA :**
- Texte IA édité et validé par le comptable

### Implémentation :

Utiliser `jsPDF` + `jspdf-autotable` pour la génération. Alternativement, générer un HTML stylisé avec CSS print-optimized et déclencher `window.print()`.

```typescript
// Bouton génération rapport
const generatePDF = async () => {
  // 1. Collecter toutes les données du store
  // 2. Générer le HTML du rapport
  // 3. Ouvrir dans une nouvelle fenêtre avec CSS print
  // 4. Déclencher window.print()
  // Ou utiliser jsPDF si la bibliothèque est disponible
};
```

Style du rapport : identité visuelle République Française
- Bandeau tricolore en haut (bleu #002395, blanc #FFFFFF, rouge #ED2939)
- Police : Marianne (ou fallback Arial)
- Tableau sobre et professionnel

---

## INTELLIGENCE CROISÉE AVEC LES AUTRES MENUS

### Contexte partagé (store global) :

Créer un hook `useFinancialContext()` qui expose les données clé du module Compte Financier aux autres menus :

```typescript
interface FinancialContext {
  exercice: string; // "N-1" (les imports sont toujours N-1 au moment de l'analyse)
  fdr: number;
  bfr: number;
  tn: number;
  caf: number;
  fdrm: number;
  tauxExecutionDepenses: number;
  tauxExecutionRecettes: number;
  pointsBloquants: PointBloquant[];
  ratesARécupérer: number;
  isDataLoaded: boolean;
}
```

**Utilisation dans les autres menus :**
- **Menu CICF (Contrôle Interne)** : pré-remplir les indicateurs financiers dans les fiches de contrôle
- **Menu Clôture** : vérifier automatiquement les points bloquants avant validation
- **Menu FDR (Fonds de Roulement Mobilisable)** : réutiliser FDRm calculé ici
- **Menu Préparation BP** : utiliser les données N-1 comme base de prévision
- **Menu Tableau de bord** : afficher les KPI du dernier compte financier chargé

Afficher dans chaque menu qui utilise ces données : un bandeau informatif "📊 Données issues du Compte Financier N-1 — Chargé le [date]"

---

## SPÉCIFICATIONS TECHNIQUES

### Stack et contraintes :

```typescript
// Technologies imposées
React + TypeScript + Tailwind CSS + shadcn/ui
recharts // graphiques
localStorage // persistance obligatoire

// Structure de persistance localStorage
const STORAGE_KEYS = {
  CF_COMPLEMENTAIRE: 'cockpit_cf_complementaire',    // données saisies manuellement
  CF_PLURIANNUEL: 'cockpit_cf_pluriannuel',          // données N-2 à N-4
  CF_COMMENTAIRES: 'cockpit_cf_commentaires',         // commentaires éditables
  CF_POINTS_BLOQUANTS: 'cockpit_cf_points_bloquants', // statuts et justifications
  CF_ANALYSE_IA: 'cockpit_cf_analyse_ia',            // textes IA générés
  CF_RAPPORT_CONFIG: 'cockpit_cf_rapport_config',     // config rapport PDF
};
```

### API Claude (commentaires IA) :

```typescript
// Pour chaque bouton "Commentaire IA" individuel
const generateCommentaire = async (
  indicateur: string,
  valeurN: number,
  valeurN1: number,
  contexte: Record<string, number>
) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `
          Tu es expert en comptabilité publique EPLE (M9-6 2026).
          Rédige un commentaire professionnel (3-5 phrases max) sur l'indicateur suivant,
          en citant la référence M9-6 précise et en proposant une interprétation réglementaire.
          
          Indicateur : ${indicateur}
          Valeur N : ${valeurN}
          Valeur N-1 : ${valeurN1}
          Variation : ${((valeurN - valeurN1) / Math.abs(valeurN1) * 100).toFixed(1)}%
          Contexte : ${JSON.stringify(contexte)}
          
          Le commentaire doit être factuel, professionnel, prêt à inclure dans le rapport du CA.
        `
      }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
};
```

### Composants à créer :

```
src/components/CompteFinancier/
├── CompteFinancierLayout.tsx          // Layout principal avec navigation tabs
├── VueEnsemble/
│   ├── KPICards.tsx                   // 6 cartes KPI
│   ├── RadarChart.tsx                 // Graphique radar 8 axes
│   └── AlertesBanner.tsx              // Bandeau alertes
├── RapportOrdo/
│   ├── ExecutionDepenses.tsx          // Tableau exécution dépenses
│   ├── ExecutionRecettes.tsx          // Tableau exécution recettes
│   ├── AnalyseEcarts.tsx              // Écarts significatifs
│   └── ResultatsExercice.tsx          // Résultats globaux
├── RapportAC/
│   ├── BilanCondense.tsx              // Bilan financier condensé
│   ├── FDRBFRTresorerie.tsx           // FDR/BFR/TN avec jauge
│   ├── Autofinancement.tsx            // CAF/IAF
│   ├── RatiosGestion.tsx              // 12 ratios avec jauges
│   ├── AnalyseRestes.tsx              // RAR et RAP
│   ├── VerificationsComptables.tsx    // 15 points vérification
│   └── SaisieComplementaire.tsx       // Formulaire saisie données
├── Pluriannuel/
│   ├── TableauHistorique.tsx          // Tableau 5 ans
│   └── GraphiquesEvolution.tsx        // 4 graphiques recharts
├── PointsBloquants/
│   └── ListePointsBloquants.tsx       // 3 niveaux de sévérité
├── AnalyseIA/
│   └── AnalyseIAGlobale.tsx           // Interface analyse complète
├── Rapport/
│   └── GenerateurRapport.tsx          // Génération rapport PDF/HTML
└── shared/
    ├── CommentaireEditable.tsx        // Composant réutilisable commentaire + IA
    ├── IndicateurCard.tsx             // Carte indicateur avec variation
    ├── JaugeIndicateur.tsx            // Jauge avec seuils colorés
    └── useFinancialContext.ts         // Hook données partagées
```

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ À LOVABLE

1. **D'abord** : Créer l'architecture du composant `CompteFinancierLayout.tsx` avec les 7 onglets
2. **Ensuite** : Implémenter `VueEnsemble` (dashboard KPI) en lisant les données déjà importées
3. **Ensuite** : Implémenter `RapportOrdo` complet avec tous les tableaux et graphiques
4. **Ensuite** : Implémenter `RapportAC` avec FDR/BFR/TN et les 12 ratios
5. **Ensuite** : Implémenter `VerificationsComptables` (15 points bloquants)
6. **Ensuite** : Implémenter `SaisieComplementaire` et `Pluriannuel`
7. **Ensuite** : Implémenter `PointsBloquants` 
8. **Ensuite** : Implémenter `AnalyseIAGlobale`
9. **En dernier** : Implémenter `GenerateurRapport`

---

## DESIGN ET UX

### Charte graphique :
- **Couleurs EPLE** : Bleu République (#002395), Rouge (#ED2939), Blanc
- **Positif** : Vert (#16a34a) | **Attention** : Orange (#f59e0b) | **Alerte** : Rouge (#dc2626)
- **Fond** : Blanc/Gris très clair (#f8fafc)
- **Cards** : Blanc avec ombre légère, bordure arrondie (radius 8px)

### Comportements UX :
- Tous les tableaux sont exportables (bouton CSV par tableau)
- Toutes les zones de commentaires sont auto-saved (debounce 1s)
- Les graphiques recharts sont interactifs (tooltip au survol)
- Un indicateur de chargement des données (si les 6 imports ne sont pas tous présents, afficher un message d'invitation à importer)
- Mode impression : CSS `@media print` masquant la navigation et les boutons
- Responsive : fonctionnel sur tablette (1024px minimum)

### Message si données manquantes :
```
⚠️ Données insuffisantes
Certains indicateurs ne peuvent pas être calculés.
Fichiers manquants : [liste des fichiers non importés]
→ Aller au module Import pour charger les données
```

---

## RÉSUMÉ DES AVANTAGES SUR REPROFI 4.6

| Critère | REPROFI 4.6 | Cockpit Comptable CF |
|---|---|---|
| Format | Excel (lourd, lent) | Web (léger, rapide) |
| Indicateurs ordonnateur | ~8 indicateurs | 35+ indicateurs |
| Indicateurs comptable | ~15 indicateurs | 40+ indicateurs |
| Commentaires | Manuels uniquement | IA + manuels |
| Vérifications bloquants | Partielle | 15 vérifications systématiques |
| Suivi pluriannuel | 5 ans (manuel) | 5 ans (auto N/N-1 + saisie) |
| Graphiques | Basiques Excel | recharts interactifs |
| Génération rapport | Impression Excel | PDF professionnel formaté |
| Intelligence croisée | Aucune | Partage avec tous les menus |
| Mise à jour réglementaire | Manuelle (auteur) | M9-6 2026 intégrée |
| Multi-établissements | Non | Oui (via profils) |
| Accessibilité | PC uniquement | Web, tablette |
| Sauvegarde | Fichier local | localStorage + export JSON |

---

*Prompt généré pour Lovable — Cockpit Comptable EPLE — Module Compte Financier v2.0*
*Référence réglementaire : M9-6 édition 2026 — Décret GBCP 2012-1246 — Code de l'Éducation*
*Objectif : surpasser définitivement REPROFI 4.6 et devenir la référence académique*
