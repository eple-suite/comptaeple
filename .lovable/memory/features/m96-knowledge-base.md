Instruction codificatrice M9-6 du 19/01/2026 — structure complète intégrée dans l'application.

## Document source
- Fichier : Annexe_–_Instruction_codificatrice_M9.6_–_OP@LE-479564.pdf
- Date : 19 janvier 2026
- Contenu : 4 Tomes + Annexes (26 planches comptables + textes de référence)

## Intégration dans l'application

### 1. Base de connaissances TypeScript
- `src/lib/m96_knowledge.ts` — fichier de référence structuré exportant :
  - ACTEURS_EPLE (CA, chef étab., adjoint gestionnaire, AC, régisseurs)
  - CONTROLES (contrôle actes, externes, RGP)
  - PRINCIPES_BUDGETAIRES (annualité, unité, universalité, spécialité, sincérité, équilibre)
  - STRUCTURE_BUDGET (sections, services, nomenclature)
  - EXECUTION_RECETTES (phases, titre, moyens encaissement, recouvrement amiable/contentieux)
  - EXECUTION_DEPENSES (phases, engagement, liquidation, ordonnancement, contrôles AC)
  - REGLES_EVALUATION (passifs, actifs, amortissements, stocks)
  - OPERATIONS_SPECIFIQUES (trésorerie, voyages, objets confectionnés, valeurs inactives, période inventaire)
  - PRINCIPES_COMPTABLES (9 principes)
  - PLAN_COMPTABLE_M96 (classes 1-8, tous comptes détaillés)
  - COMPTE_FINANCIER (contenu, annexe 11 sections, arrêt/transmission)
  - INDICATEURS_FINANCIERS (résultat, CAF/IAF, FRNG, BFR, trésorerie, jours autonomie)
  - PLANCHES_COMPTABLES (26 planches)
  - TERMINOLOGIE_OPALE (demande paiement, versement, comptabilisation, etc.)
  - TEXTES_REFERENCE (M9-6, GBCP, CCP 2026, régies, voyages, RGP)

### 2. Chatbot (edge function)
- `supabase/functions/chat-eple/index.ts` — SYSTEM_PROMPT enrichi avec l'intégralité du plan comptable M9-6 classes 1-8, les formules des indicateurs financiers, les procédures d'exécution des recettes/dépenses, la terminologie Op@le, et les textes de référence actualisés.

### 3. Fichier existant
- `src/lib/m96nomenclature.ts` — nomenclature des comptes (utilisé par le moteur COFIEPLE)

## Structure des 4 Tomes
1. **Tome 1** : EPLE — acteurs (CA, ordonnateur, AC, régisseurs), contrôles (IGESR, CRC, RGP), coopération (groupements)
2. **Tome 2** : Budget (principes, structure, procédure), exécution recettes (liquidation→recouvrement), exécution dépenses (engagement→paiement), passifs/actifs, opérations spécifiques
3. **Tome 3** : Cadre comptable — 9 principes, plan comptable classes 1-8, articulation budget/compta
4. **Tome 4** : Compte financier — préparation, contenu (CR gestion + annexe 11 sections), indicateurs (résultat, CAF, FRNG, BFR, trésorerie)
