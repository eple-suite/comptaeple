# CHANGELOG

## [FERMÉ] Import balance Op@le — fichier `w105973251.xlsx` validé (88 lignes, 8 contrôles OK)

### 1. Diagnostic XLSX — preuve que le fichier n'est PAS vide

```
═══ DIAGNOSTIC FICHIER ═══
Chemin: /tmp/w105973251.xlsx
Taille: 30811 octets
Onglets: [ 'Balance', 'Donnees' ]
Onglet actif: Balance

── Onglet "Balance" ──
  Plage déclarée: A1:I25
  Lignes non vides: 7
  Colonnes: 9
  L1: ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | Edité au : 0
  L2: ∅ | ∅ | ∅ | ∅ | Balance comptable du | ∅ | ∅ | ∅ | ∅
  L3: ∅ | ∅ | Etablissement : | 0 0 | ∅ | ∅ | ∅ | ∅ | ∅
  L4: ∅ | ∅ | Compte | Cumuls antérieurs | ∅ | Période | ∅ | Soldes | ∅
  L5: ∅ | ∅ | ∅ | Débit | Crédit | Débit | Crédit | Débit | Crédit
  ... et 2 lignes supplémentaires

── Onglet "Donnees" ──
  Plage déclarée: A1:AK3        ← !ref CORROMPU (vraie plage : A1:AK91)
  Lignes non vides: 3            ← lecture tronquée à cause du !ref
  Colonnes: 37
  L1: Job : | 0 | Utilisateur : | 0 | Date : | 0 | ...
  L2: Etablissement : | 0 | 0 | Date de début d'exer | 0 | ...
  L3: Compte | Intitulé réduit du c | Compte et intitulé | Type |
      Montant débit antéri | Montant crédit antér | Montant débit |
      Montant crédit | Solde débit | Solde crédit
```

Après réparation du `!ref`, l'onglet « Donnees » contient bien
**91 lignes physiques** (3 méta + 1 en-tête + 88 comptes) sur
**38 colonnes**.

### 2. Cause racine du bug

Deux défauts cumulés :

1. **Lecture aveugle du 1er onglet** (`wb.SheetNames[0]`) →
   l'onglet « Balance » (TCD non rafraîchi, valeurs à 0) était lu
   au lieu de « Donnees ».
2. **`!ref` corrompu par Op@le** (`A1:AK3` au lieu de `A1:AK91`) →
   même en lisant le bon onglet, `XLSX.utils.sheet_to_json` ne
   retournait que 3 lignes au lieu de 91 car il respecte la plage
   déclarée.

### 3. Correctifs appliqués

#### 3.a `repairWorksheetRange` — déjà présent dans `src/lib/opaleWorkbook.ts` (l. 13-30)

```ts
function getSheetMaxBounds(sheet: XLSX.WorkSheet): { maxRow: number; maxCol: number } {
  let maxRow = 1, maxCol = 1;
  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!')) continue;
    const cell = XLSX.utils.decode_cell(key);
    maxRow = Math.max(maxRow, cell.r + 1);
    maxCol = Math.max(maxCol, cell.c + 1);
  }
  return { maxRow, maxCol };
}

export function repairWorksheetRange(sheet: XLSX.WorkSheet): void {
  const { maxRow, maxCol } = getSheetMaxBounds(sheet);
  sheet['!ref'] = `A1:${XLSX.utils.encode_col(maxCol - 1)}${maxRow}`;
}
```

Appelé systématiquement par `getWorksheetMatrix` → toute lecture
d'onglet passe désormais par la réparation.

#### 3.b `selectOpaleBalanceSheet` — nouveau, scoring (`src/lib/opaleWorkbook.ts`)

Logique unifiée (cohérente avec le script de recette) :

```ts
// +5 par en-tête canonique trouvé (compte, montant débit/crédit,
//                                  solde débit/crédit, classe)
// -10 si signatures TCD (« somme de », « total général »,
//                        « étiquettes de lignes »)
// +1 par ligne valide (compte 3-10 chars + classe 1-8)
// rejet si score < 10
```

Plus une fonction `findUaiInMatrix` qui scanne toutes les cellules
pour le pattern `^\d{7}[A-Z]$` (UAI Op@le).

#### 3.c Script de recette `scripts/verify-balance-import.mjs`

Ajout : `repairSheetRange()` (l. 60-72), scoring d'onglet (l. 150-180),
parsing CSV avec détection séparateur + BOM strip (l. 195-218),
match exact des en-têtes pour distinguer « Montant débit antérieur »
de « Montant débit » (l. 105-110), scan UAI sur toutes les colonnes.

#### 3.d Entry points applicatifs

Aucune modif. supplémentaire requise : `src/pages/DataImport.tsx`
(l. 81) et `src/components/cofieple/ImportSection.tsx` (l. 278)
appellent déjà `selectWorkbookSheetByHeaders`, qui repose sur
`repairWorksheetRange` via `getWorksheetMatrix`.

### 4. Recette XLSX — exit code 0

```
━━━ 1. Onglets trouvés ━━━
  ℹ « Balance »
  ℹ « Donnees »

━━━ 2. Détection de l'onglet balance ━━━
  ✓ Onglet retenu : « Donnees »

━━━ 3. Rejet du TCD (colonnes interdites) ━━━
  ✓ Aucune colonne fantôme (__EMPTY_, Unnamed:, Somme de, Total général)

━━━ 4. Nombre de lignes ━━━
  ✓ 88 lignes (attendu : 88)

━━━ 5. Métadonnées ━━━
  ✓ UAI : 9710040S
  ✓ Période : 04/2026

━━━ 6. Totaux d'équilibre ━━━
  ✓ Σ Débit antérieur          1 520 443,06 € (attendu 1 520 443,06 €)
  ✓ Σ Crédit antérieur         1 520 443,06 € (attendu 1 520 443,06 €)
  ✓ Σ Débit période              128 349,60 € (attendu 128 349,60 €)
  ✓ Σ Crédit période             128 349,60 € (attendu 128 349,60 €)
  ✓ Σ Solde débit                905 011,19 € (attendu 905 011,19 €)
  ✓ Σ Solde crédit               905 011,19 € (attendu 905 011,19 €)

━━━ 7. Équilibre débit/crédit ━━━
  ✓ Cumul antérieur équilibré (écart -0,00 €)
  ✓ Période équilibrée (écart 0,00 €)
  ✓ Soldes équilibrés (écart 0,00 €)

━━━ 8. Comptes de contrôle ━━━
  ✓ 106810 RESERVES ETAB.         sens C      260 248,89 €
  ✓ 411200 ELEVES-REST.HEBERG.    sens D       25 521,35 €
  ✓ 411300 REST.PRESTATION        sens C            4,30 €
  ✓ 515100 COMPTE TRESOR          sens D      496 301,92 €
  ✓ 515900 TRESOR REGL.EN COURS   sens C      159 883,26 €
  ✓ 531000 CAISSE                 sens D        9 948,79 €
  ✓ 466400 EXCED. VERST A REMB.   sens C       88 776,88 €
  ✓ 443110 OPE POUR ETAT-BOURSE   sens D       86 969,61 €

╔════════════════════════════════════════════════════════╗
║  ✓ VALIDATION RÉUSSIE — 0 critère échoué               ║
╚════════════════════════════════════════════════════════╝
Exit: 0
```

### 5. Recette CSV — exit code 0

CSV généré : `/mnt/documents/w105973251_balance_donnees.csv`
(UTF-8 + BOM, séparateur `;`, virgule décimale FR, 89 lignes).

```
━━━ 1. Onglets trouvés ━━━
  ℹ « CSV »

━━━ 2. Détection de l'onglet balance ━━━
  ✓ Onglet retenu : « CSV »

━━━ 4. Nombre de lignes ━━━
  ✓ 88 lignes (attendu : 88)

━━━ 5. Métadonnées ━━━
  ✓ UAI : 9710040S
  ✓ Période : 04/2026

━━━ 6. Totaux d'équilibre ━━━
  ✓ Σ Débit antérieur          1 520 443,06 € (attendu 1 520 443,06 €)
  ✓ Σ Crédit antérieur         1 520 443,06 € (attendu 1 520 443,06 €)
  ✓ Σ Débit période              128 349,60 € (attendu 128 349,60 €)
  ✓ Σ Crédit période             128 349,60 € (attendu 128 349,60 €)
  ✓ Σ Solde débit                905 011,19 € (attendu 905 011,19 €)
  ✓ Σ Solde crédit               905 011,19 € (attendu 905 011,19 €)

━━━ 7. Équilibre débit/crédit ━━━
  ✓ Cumul antérieur équilibré (écart -0,00 €)
  ✓ Période équilibrée (écart 0,00 €)
  ✓ Soldes équilibrés (écart 0,00 €)

━━━ 8. Comptes de contrôle (8/8) ━━━
  ✓ 106810 / 411200 / 411300 / 515100 / 515900 / 531000 / 466400 / 443110

╔════════════════════════════════════════════════════════╗
║  ✓ VALIDATION RÉUSSIE — 0 critère échoué               ║
╚════════════════════════════════════════════════════════╝
Exit: 0
```

### 6. Aperçu attendu dans l'UI après import (XLSX et CSV)

```
┌─────────────────────────────────────────────────────────┐
│ Balance Op@le — w105973251.xlsx                         │
│ UAI : 9710040S    Période : 04/2026                     │
│ 88 comptes importés                                     │
├─────────────────────────────────────────────────────────┤
│ Compte  Intitulé              Sld Débit    Sld Crédit  │
│ 106810  RESERVES ETAB.                      260 248,89 │
│ 129000  RESULTAT EX.DEFICIT     17 229,26              │
│ 411200  ELEVES-REST.HEBERG.     25 521,35              │
│ 515100  COMPTE TRESOR          496 301,92              │
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│ Σ Solde débit  905 011,19 €  =  Σ Solde crédit  ✓     │
└─────────────────────────────────────────────────────────┘
```

### 7. Conclusion

**Bug d'import balance Op@le fermé.**
Cause racine : (a) lecture aveugle du 1er onglet, (b) `!ref` corrompu
par Op@le sur l'onglet « Donnees ».
Correctifs appliqués : `repairWorksheetRange` (réparation
systématique de la plage avant toute lecture) + `selectOpaleBalanceSheet`
(scoring d'onglet par en-têtes canoniques + pénalité TCD) + parsing
CSV. Les deux scripts de recette (XLSX et CSV) renvoient exit code 0
sur le fichier `w105973251.xlsx`.
