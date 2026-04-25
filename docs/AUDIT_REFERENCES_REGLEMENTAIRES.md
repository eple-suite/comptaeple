# Audit des références réglementaires

Date : 25/04/2026

## Format unique exigé

| Texte | Format normalisé |
|---|---|
| Instruction comptable | « instruction codificatrice M9-6 » |
| GBCP | « décret n° 2012-1246 du 7/11/2012 (GBCP) » |
| RGP | « ordonnance n° 2022-408 du 23/03/2022 (RGP) » |
| Code éducation | « Code de l'éducation, art. R.421-X » |
| CCP | « Code de la commande publique, art. L21XX-X » |
| Circulaire | « circulaire n° XXXXXXC du JJ/MM/AAAA » |
| Loi | « loi n° XXXX-XXX du JJ/MM/AAAA, art. X » |

## Vérifications transversales

| Texte | Modules qui le citent | Format respecté |
|---|---|---|
| M9-6 | Balance, Compte financier, Cockpit, Aide, Voyages, Marchés, Fonds sociaux | ✅ |
| GBCP 2012-1246 | Tous modules métier | ✅ |
| RGP 2022-408 | Paramètres (arrêtés régisseurs), Voyages, Aide, Habilitations | ✅ |
| Code éducation R.421-x | Cockpit, Habilitations, Compte financier, Voyages, Aide | ✅ |
| CCP + décret 2025-1386 | Marchés, Voyages, Aide | ✅ |
| Circulaire MENH1310955C | Entretiens | ✅ |
| Décret 2010-888 | Entretiens | ✅ |
| Décret 86-83 | Entretiens (contractuels) | ✅ |
| Circulaire MENE2407159C 16/07/2024 | Voyages | ✅ |
| Loi 2017-1837 art. 73 | SATD, Aide | ✅ |
| Loi 66-948 art. 21 | **Voyages uniquement** (règle 8 €) | ✅ |
| RGPD UE 2016/679 | Tous modules | ✅ |
| Décret 2019-798 (régies) | Régies, Voyages (mandataire) | ✅ |

## SATD ↔ 1966 (audit ciblé)

- ✅ `src/data/aide/glossaire.ts` : SATD = loi 2017-1837 art. 73 + LPF L.262.
- ✅ `src/data/aide/articles.ts` : entrées séparées SATD vs Règle 8 €.
- ✅ `src/lib/rentree/liensInstitutionnels.ts` : lien SATD pointe loi 2017-1837 (ligne 45 et 88).
- ✅ Aucune association erronée SATD ↔ 1966 dans le code applicatif.
- ✅ Script régressif : `scripts/verify-satd-references.test.ts` exit 0.

## Loi 66-948 — confinement au module Voyages

- ✅ `src/lib/voyageBudgetEngine.ts` (interdiction bénéfice + règle 8 €).
- ✅ `src/test/regle8-euros.test.ts` (tests métier).
- ✅ `src/data/aide/modeles.ts` (modèles voyages uniquement).
- ✅ `src/data/aide/faq.ts` (1 entrée FAQ voyages).
- ✅ Aucune autre apparition.

## Index réglementaire Mode d'emploi

✅ `src/pages/aide/AideReglementation.tsx` liste 10+ textes majeurs avec :
- Date d'entrée en vigueur
- Articles cibles
- Modules consommateurs
- Lien Légifrance

## Anomalies détectées

Aucune anomalie de format. Quelques abréviations historiques (M96, M9.6) subsistent en commentaires de code mais **pas dans l'UI** ; ces commentaires sont sans impact externe.

## Conclusion

**Conformité 10/10.** Format unique respecté dans tous les écrans utilisateur.