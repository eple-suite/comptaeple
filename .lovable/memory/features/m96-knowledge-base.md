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

### 3. Code de l'éducation (version 14/03/2026)
- `src/lib/code_education_knowledge.ts` — L421/R421 (EPLE), acteurs, organisation financière, voyages scolaires, sources communautaires
- Source : PDF complet codes.droit.org (5031 articles)

### 4. Code de la commande publique (version 16/03/2026)
- `src/lib/ccp_knowledge.ts` — seuils 2026, procédures (dispense/MAPA/formalisée), articles clés EPLE, fonctions utilitaires
- Décret n°2025-1386 du 29/12/2025 (seuils 2026)
- Basculement 40k→60k au 01/04/2026 géré dynamiquement

### 5. Chatbot (edge function)
- `supabase/functions/chat-eple/index.ts` — SYSTEM_PROMPT enrichi avec les 4 sources + ressources communautaires
- Règles strictes : terminologie Op@le, plan M9-6 (pas PCG privé), citation articles GBCP, Code éducation ET CCP

### 6. Connaissances réglementaires transversales
- `src/lib/regulatoryKnowledge.ts` — soldes anormaux, contrôles, CIC

## Sources communautaires intégrées
- IH2EF (https://www.ih2ef.gouv.fr/les-ressources)
- Espac'EPLE (https://espaceple.org)
- IntendanceZone (https://www.intendancezone.net)
- gestionnaire03.fr
- M@gistère, MF²

## Prochaines sources potentielles
- Documentation Op@le officielle détaillée
- Guides IH2EF / Eduscol spécifiques
- Code général de la propriété des personnes publiques (domaine)
