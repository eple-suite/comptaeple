Instruction codificatrice M9-6 du 19/01/2026 — structure complète intégrée dans l'application.

## Document source
- Fichier : Annexe_–_Instruction_codificatrice_M9.6_–_OP@LE-479564.pdf
- Date : 19 janvier 2026
- Contenu : 4 Tomes + Annexes (26 planches comptables + textes de référence)

## Sources intégrées (Mars 2026)

### 1. Instruction M9-6
- `src/lib/m96_knowledge.ts` — base structurée complète
- `src/lib/m96nomenclature.ts` — nomenclature des comptes

### 2. Décret GBCP n° 2012-1246
- `src/lib/gbcp_knowledge.ts` — articles clés (Titre Ier principes fondamentaux, agents comptables, exécution recettes/dépenses, compte financier, contrôle interne)
- Art. 4 : Titres II-III ne s'appliquent pas aux EPLE → Titre Ier + Code éducation

### 3. Code de l'éducation (version 16/03/2026)
- `src/lib/code_education_knowledge.ts` — L421/R421 (EPLE), acteurs, organisation financière
- Note : le PDF fourni contenait la table des matières, pas le texte intégral des articles

### 4. Chatbot (edge function)
- `supabase/functions/chat-eple/index.ts` — SYSTEM_PROMPT enrichi avec les 3 sources
- Règles strictes : terminologie Op@le, plan M9-6 (pas PCG privé), citation des articles GBCP et Code éducation

## Prochaines sources potentielles
- Code de la commande publique (seuils 2026 déjà intégrés, articles détaillés à ajouter)
- Documentation Op@le officielle
- Guides IH2EF / Eduscol
