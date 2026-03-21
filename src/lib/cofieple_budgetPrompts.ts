// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Prompts IA adaptés par type de budget
// M9-6 2026 — §2.1.2.3.1 (budgets annexes sans personnalité juridique)
// ═══════════════════════════════════════════════════════════════

import type { TypeBudget } from './cofieple_storeTypes';

export function getSystemPromptForBudgetType(type: TypeBudget): string {
  const base = `Tu es un expert en comptabilité publique des EPLE (M9-6 2026).`;

  if (type === 'annexe_greta') {
    return `${base}
Tu dois analyser le compte financier d'un budget annexe GRETA (Groupement
d'Établissements pour la Formation Continue des Adultes).

Points de cadrage réglementaire spécifiques :
- Le GRETA est un budget annexe sans personnalité juridique (M9-6 §2.1.2.3.1)
- Sa trésorerie est portée par le compte 185000 (M9-6 §5.3.2), et non par le C/515100
- Son activité relève du domaine D3 de la nomenclature budgétaire M9-6
- L'équilibre financier du GRETA est conditionné par le chiffre d'affaires de formation
- Un déficit du GRETA se reporte sur le budget principal de l'EPLE support
- Les modalités de calcul du FDR sont adaptées : TN = C/185 (M9-6 §2.1.2.3.2)

Dans ton analyse :
1. Insiste sur la viabilité économique (taux de couverture des charges)
2. Commente l'évolution du CA de formation
3. Analyse la situation du compte 185 par rapport au budget principal
4. Propose des recommandations sur la politique de développement commercial`;
  }

  if (type === 'annexe_cfa') {
    return `${base}
Tu dois analyser le compte financier d'un budget annexe CFA (Centre de Formation
d'Apprentis).

Points de cadrage spécifiques :
- Le CFA est un budget annexe sans personnalité juridique (M9-6 §2.1.2.3.1)
- Son financement principal provient de France Compétences depuis la loi Avenir
  Professionnel de 2018 (ex-subvention Région)
- Sa trésorerie est portée par le C/185000 (M9-6 §5.3.2)
- Son activité relève du domaine D4 de la nomenclature M9-6
- L'analyse doit intégrer l'évolution des effectifs apprentis

Dans ton analyse :
1. Commente la dépendance au financement France Compétences / Région
2. Analyse le coût de formation par apprenti
3. Commente l'évolution des effectifs si disponible
4. Analyse la situation du compte 185`;
  }

  if (type === 'annexe_autre') {
    return `${base}
Tu dois analyser le compte financier d'un budget annexe SRH (Service de
Restauration et d'Hébergement).

Points de cadrage spécifiques :
- Le SRH est un budget annexe sans personnalité juridique (M9-6 §2.1.2.3.1)
- Sa trésorerie est portée par le C/185000 (M9-6 §5.3.2)
- L'analyse doit se concentrer sur le coût du repas, le taux d'occupation
  de l'hébergement, et la couverture des charges par les subventions CT
- L'équilibre ou le quasi-équilibre est exigé

Dans ton analyse :
1. Commente le coût du repas vs la moyenne académique
2. Analyse le taux d'occupation de l'hébergement
3. Vérifie que le résultat d'exploitation est proche de zéro
4. Analyse la situation du compte 185`;
  }

  // Budget principal — prompt standard
  return `${base}
Rédige le rapport d'analyse financière complet pour ce budget principal d'EPLE.
Référence principale : M9-6 2026 §4.5.3 (FDR/BFR/TN), §4.5.4 (CAF),
§4.5.5 (ratios), §4.5.6 (délais).`;
}

/**
 * Generates the "Liaisons inter-budgets" section text for the PDF report.
 */
export function generateLiaisonsSection(
  solde185BP: number,
  annexes: { label: string; solde185: number }[],
  formatEur: (n: number) => string,
): string {
  const totalAnnexes = annexes.reduce((s, a) => s + a.solde185, 0);
  const ecart = Math.abs(solde185BP - totalAnnexes);
  const concordant = ecart < 0.02;

  let text = `3.X — LIAISONS INTER-BUDGETS (Compte 185)\n\n`;
  text += `Le compte 185 « Comptes de liaison entre budgets » matérialise les flux\n`;
  text += `financiers entre le budget principal de l'EPLE et ses budgets annexes\n`;
  text += `(M9-6 §5.3.2).\n\n`;
  text += `Au 31/12/N, le solde du compte 185 s'établit comme suit :\n`;
  text += `  - Sur le budget principal        : ${formatEur(solde185BP)} (créditeur)\n`;
  for (const a of annexes) {
    text += `  - Sur le budget annexe ${a.label.padEnd(10)} : ${formatEur(a.solde185)} (débiteur)\n`;
  }
  text += `  - Concordance                    : ${concordant ? '✅ Exacte' : `❌ Écart de ${formatEur(ecart)}`}\n`;

  return text;
}

/**
 * Returns the regulatory note for budget annexe PDF cover pages.
 */
export function getBudgetAnnexePdfNote(type: TypeBudget): string {
  const typeLabel =
    type === 'annexe_greta' ? 'GRETA' :
    type === 'annexe_cfa' ? 'CFA' :
    type === 'annexe_autre' ? 'SRH' : '';

  return `BUDGET ANNEXE ${typeLabel}\n` +
    `Ce budget annexe n'ayant pas de personnalité juridique (M9-6 §2.1.2.3.1), ` +
    `son analyse financière est conduite selon les modalités adaptées définies ` +
    `à la cote §2.1.2.3.2.`;
}
