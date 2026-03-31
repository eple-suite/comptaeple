# DRFN — Dépenses Réelles de Fonctionnement Nettes

## Formule (conforme Op@le Pièce 14 / M9-6)
DRFN = Total dépenses mandatées de FONCTIONNEMENT (SDE réalisé, section FONC)
       MOINS dotations aux amortissements (comptes 681xxx)
       MOINS charges d'investissement (classe 2)

## Indicateurs en jours
- Jours FDR = (FDR × 365) / DRFN → arrondi 2 décimales
- Jours Trésorerie = (Trésorerie × 365) / DRFN → arrondi 2 décimales

## Règles d'affichage
- Toujours afficher avec 2 décimales (ex: 106,99 jours)
- Infobulle au survol expliquant le calcul et le coût journalier moyen (DRFN/365)
- Ne jamais afficher la DRFN comme résultat principal

## Validation référence (Collège Maurice Satineau 2025)
- FDR = 238 762,16 € → 106,99 jours
- Trésorerie = 577 670,21 € → 258,85 jours
- DRFN implicite ≈ 814 888 €/an

## Implémentation
- `cofieple_m96engine.ts` : calcul DRFN et jours
- `cofieple_types.ts` : champ `drfn` dans ResultatsM96
- Tooltips via `SharedComponents.tsx` KPICard `tooltip` prop
