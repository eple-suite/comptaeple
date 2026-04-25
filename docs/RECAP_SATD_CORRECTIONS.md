# RECAP — Corrections SATD (Prompt N°10, livrable 5 partie 2)

## Erreur historique corrigée

La SATD (Saisie Administrative à Tiers Détenteur) était incorrectement associée à la **loi 66-948 du 22 décembre 1966** dans le corpus d'aide. Cette loi de 1966 (art. 21) ne concerne en réalité **que la règle des 8 €** (seuil de non-poursuite). La SATD elle-même a été créée par la **loi 2017-1837 du 30 décembre 2017, art. 73**.

## Fichiers audités et corrigés

| Fichier | Avant | Après |
|---------|-------|-------|
| `src/data/aide/glossaire.ts` (entrée SATD) | « LPF L.262, Loi 66-948 art. 21 » | « **Loi 2017-1837 art. 73**, LPF L.262 » + précision « voir aussi règle 8 € (seuil distinct) » |
| `src/data/aide/glossaire.ts` (entrée Règle 8 €) | Mention SATD sans clarification | Ajout « distinct de la SATD elle-même (créée par la loi 2017-1837 art. 73) » |
| `src/data/aide/articles.ts` (Mode d'emploi → cadre réglementaire) | « SATD : LPF L.262 + art. 21 loi 66-948 (règle 8 €) » | Deux entrées séparées : SATD → loi 2017-1837 ; Règle 8 € → loi 66-948 (seuil distinct) |

## Audit automatisé

Script : `scripts/verify-satd-references.test.ts`

Règles appliquées :
1. Aucune mention SATD ↔ « 1966 » dans l'aide sans clarification (« 2017-1837 », « distinct », ou contexte « règle des 8 € » + « art. 21 »).
2. Référence « 2017-1837 » présente dans le corpus dès lors que la SATD est mentionnée.
3. Référence loi 66-948 conservée pour les modules concernés (règle des 8 €).

**Résultat** : `exit 0` ✅

## Glossaire à jour

- **SATD** : créée par la **loi 2017-1837 art. 73** (et non par la loi de 1966). Référence procédurale : **LPF L.262**.
- **Règle des 8 €** : seuil de non-poursuite issu de l'**art. 21 de la loi de finances 66-948 du 22 décembre 1966**, distinct de la SATD mais vérifié systématiquement en amont.