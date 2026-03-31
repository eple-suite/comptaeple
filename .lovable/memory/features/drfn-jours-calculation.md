# DRFN — Dépenses Réelles de Fonctionnement Nettes

## Formule (conforme Op@le Pièce 14 / M9-6)
DRFN = Total dépenses mandatées de FONCTIONNEMENT (SDE réalisé, section FONC)
       MOINS dotations aux amortissements (comptes 681xxx)
       MOINS charges d'investissement (classe 2)

## Indicateurs en jours
- Jours FDR = (FDR × 365) / DRFN → arrondi 2 décimales
- Jours Trésorerie = (Trésorerie × 365) / DRFN → arrondi 2 décimales

## Trésorerie — Source de vérité
- La trésorerie est lue depuis la **ligne agrégée "5 -"** de la balance (colonne Solde Débit).
- C'est le montant exact affiché sur la Pièce 14 Op@le.
- Fallback si pas d'agrégé : comptes spécifiques (511200, 515100, etc.) puis solde net classe 5.

## FDR — Source de vérité
- Le FDR est calculé depuis les lignes agrégées "1 -" et "2 -" de la balance.
- FDR = (Classe 1 solCrd - solDbt) - (Classe 2 solDbt - solCrd)
- Le FDR peut être négatif (pas de Math.max(0, ...)).
- Si impossible à calculer de manière certaine, demander la Pièce 14.

## Règles d'affichage
- Toujours afficher avec 2 décimales (ex: 106,99 jours)
- Infobulle au survol expliquant le calcul et le coût journalier moyen (DRFN/365)
- Ne jamais afficher la DRFN comme résultat principal

## Validation référence (Collège Maurice Satineau 2025)
- FDR = 238 762,16 € → 106,99 jours
- Trésorerie = 577 670,21 € → 258,85 jours
- DRFN implicite ≈ 814 888 €/an

## Implémentation
- `cofieple_m96engine.ts` : calcul DRFN et jours, agrégés classe 5 pour trésorerie
- `cofieple_types.ts` : champ `drfn` dans ResultatsM96
- Tooltips via `SharedComponents.tsx` KPICard `tooltip` prop
