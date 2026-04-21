// ═══════════════════════════════════════════════════════════════
// Moteur de validation Enquête Rectorat DGESCO — Fonds sociaux
// 16 règles R1-R16 issues du cahier des charges du prompt.
// Sortie : { ok, severity, code, message, hint }
// ═══════════════════════════════════════════════════════════════

import type {
  FsEleve, FsDecision, FsCommission,
  FsSubventionRectorat, FsReliquatOuverture,
  TypeFonds, NatureAide,
} from "@/pages/fonds-sociaux-v2/fsv2Types";
import { NATURES_Q10 } from "@/pages/fonds-sociaux-v2/fsv2Types";

export type Severity = "error" | "warning" | "info";

export interface ValidationIssue {
  code: string;            // R1..R16
  severity: Severity;
  message: string;
  hint?: string;
  count?: number;
}

export interface EnqueteContext {
  anneeScolaire: string;
  eleves: FsEleve[];
  decisions: FsDecision[];
  commissions: FsCommission[];
  subventions: FsSubventionRectorat[];
  reliquats: FsReliquatOuverture[];
}

/** KPIs Q1 → Q17 calculés à partir des données. */
export interface EnqueteKpis {
  q1_total_demandes: number;          // = nb décisions hors annulé
  q2_total_aides_accordees: number;   // statut decide/mandate/paye
  q3_montant_total_verse: number;     // somme montants payés/mandatés
  q4_montant_moyen: number;
  q5_eleves_aides: number;            // unique eleve_id
  q6_repartition_voie: Record<string, number>;
  q7_repartition_type_fonds: Record<TypeFonds, number>;
  q8_repartition_modalite: Record<string, number>;
  q9_repartition_attribution: Record<string, number>;
  q10_repartition_nature: Record<NatureAide, { count: number; montant: number }>;
  q11_subv_rectorat_recue: number;
  q12_reliquats_ouverture: number;
  q13_taux_consommation: number;       // versé / (subv + reliquat)
  q14_nb_commissions: number;
  q15_nb_eleves_boursiers_aides: number;
  q16_nb_aides_urgence: number;
  q17_eleves_total_etablissement: number;
}

export function computeEnqueteKpis(ctx: EnqueteContext): EnqueteKpis {
  const annee = ctx.anneeScolaire;
  const decisionsAnnee = ctx.decisions.filter(d => d.annee_scolaire === annee && d.statut !== "annule");
  const accordees = decisionsAnnee.filter(d => ["decide", "mandate", "paye"].includes(d.statut));
  const versees = decisionsAnnee.filter(d => ["mandate", "paye"].includes(d.statut));

  const total = versees.reduce((s, d) => s + Number(d.montant), 0);
  const moyen = accordees.length ? total / accordees.length : 0;
  const elevesAides = new Set(accordees.map(d => d.eleve_id)).size;

  const repartVoie: Record<string, number> = {};
  accordees.forEach(d => {
    const e = ctx.eleves.find(el => el.id === d.eleve_id);
    const v = e?.voie ?? "inconnu";
    repartVoie[v] = (repartVoie[v] ?? 0) + 1;
  });

  const repartType: Record<TypeFonds, number> = { FS: 0, FSC: 0 };
  accordees.forEach(d => { if (d.type_fonds === "FS" || d.type_fonds === "FSC") repartType[d.type_fonds as TypeFonds] += 1; });

  const repartModalite: Record<string, number> = {};
  accordees.forEach(d => { repartModalite[d.modalite_versement] = (repartModalite[d.modalite_versement] ?? 0) + 1; });

  const repartAttrib: Record<string, number> = {};
  accordees.forEach(d => { repartAttrib[d.modalite_attribution] = (repartAttrib[d.modalite_attribution] ?? 0) + 1; });

  const repartNature: Record<NatureAide, { count: number; montant: number }> = {} as any;
  NATURES_Q10.forEach(n => { repartNature[n] = { count: 0, montant: 0 }; });
  accordees.forEach(d => {
    const n = d.nature_aide as NatureAide;
    if (repartNature[n]) {
      repartNature[n].count += 1;
      repartNature[n].montant += Number(d.montant);
    }
  });

  const subvRecue = ctx.subventions
    .filter(s => s.annee_scolaire === annee && !s.est_avance_annee_suivante)
    .reduce((s, x) => s + Number(x.montant), 0);

  const yearStart = parseInt(annee.split("-")[0] || "0", 10);
  const reliquats = ctx.reliquats
    .filter(r => r.annee_civile === yearStart)
    .reduce((s, x) => s + Number(x.montant), 0);

  const denom = subvRecue + reliquats;
  const taux = denom > 0 ? (total / denom) * 100 : 0;

  const boursiersAides = new Set(
    accordees
      .map(d => ctx.eleves.find(e => e.id === d.eleve_id))
      .filter(e => e?.statut_boursier)
      .map(e => e!.id),
  ).size;

  return {
    q1_total_demandes: decisionsAnnee.length,
    q2_total_aides_accordees: accordees.length,
    q3_montant_total_verse: total,
    q4_montant_moyen: moyen,
    q5_eleves_aides: elevesAides,
    q6_repartition_voie: repartVoie,
    q7_repartition_type_fonds: repartType,
    q8_repartition_modalite: repartModalite,
    q9_repartition_attribution: repartAttrib,
    q10_repartition_nature: repartNature,
    q11_subv_rectorat_recue: subvRecue,
    q12_reliquats_ouverture: reliquats,
    q13_taux_consommation: taux,
    q14_nb_commissions: ctx.commissions.filter(c => c.annee_scolaire === annee).length,
    q15_nb_eleves_boursiers_aides: boursiersAides,
    q16_nb_aides_urgence: accordees.filter(d => d.modalite_attribution === "urgence").length,
    q17_eleves_total_etablissement: ctx.eleves.filter(e => e.actif).length,
  };
}

/** Validation R1 → R16. */
export function validateEnquete(ctx: EnqueteContext, kpis: EnqueteKpis): ValidationIssue[] {
  const annee = ctx.anneeScolaire;
  const decisionsAnnee = ctx.decisions.filter(d => d.annee_scolaire === annee);
  const issues: ValidationIssue[] = [];

  // R1 — Au moins une commission tenue
  if (kpis.q14_nb_commissions === 0) {
    issues.push({ code: "R1", severity: "warning",
      message: "Aucune commission fonds social n'a été enregistrée pour cette année scolaire.",
      hint: "Saisissez au moins une commission dans l'onglet Commissions." });
  }

  // R2 — Toute décision en commission doit pointer une commission existante
  const orphanesCommission = decisionsAnnee.filter(d => d.modalite_attribution === "commission" && !d.commission_id);
  if (orphanesCommission.length > 0) {
    issues.push({ code: "R2", severity: "error",
      message: `${orphanesCommission.length} décision(s) "commission" sans commission rattachée.`,
      count: orphanesCommission.length,
      hint: "Éditez chaque décision et sélectionnez la commission concernée." });
  }

  // R3 — Aide d'urgence doit avoir un motif renseigné
  const urgencesSansMotif = decisionsAnnee.filter(d => d.modalite_attribution === "urgence" && !d.motif?.trim());
  if (urgencesSansMotif.length > 0) {
    issues.push({ code: "R3", severity: "error",
      message: `${urgencesSansMotif.length} aide(s) d'urgence sans motif renseigné.`,
      count: urgencesSansMotif.length });
  }

  // R4 — Versement organisme tiers : nom + SIRET requis
  const tiersIncomplets = decisionsAnnee.filter(d =>
    d.modalite_versement === "organisme_tiers" && (!d.organisme_tiers_nom || !d.organisme_tiers_siret));
  if (tiersIncomplets.length > 0) {
    issues.push({ code: "R4", severity: "error",
      message: `${tiersIncomplets.length} décision(s) versement tiers sans nom ou SIRET.`,
      count: tiersIncomplets.length });
  }

  // R5 — Code activité Op@le obligatoire
  const sansCode = decisionsAnnee.filter(d => !d.code_activite_opale?.trim());
  if (sansCode.length > 0) {
    issues.push({ code: "R5", severity: "error",
      message: `${sansCode.length} décision(s) sans code activité Op@le.`,
      count: sansCode.length });
  }

  // R6 — Compte d'imputation conseillé
  const sansCompte = decisionsAnnee.filter(d => !d.compte_imputation_opale?.trim());
  if (sansCompte.length > 0) {
    issues.push({ code: "R6", severity: "warning",
      message: `${sansCompte.length} décision(s) sans compte d'imputation Op@le.`,
      count: sansCompte.length });
  }

  // R7 — Montant > 0
  const montantInvalide = decisionsAnnee.filter(d => Number(d.montant) <= 0 && d.statut !== "annule");
  if (montantInvalide.length > 0) {
    issues.push({ code: "R7", severity: "error",
      message: `${montantInvalide.length} décision(s) avec montant nul ou négatif.`,
      count: montantInvalide.length });
  }

  // R8 — Statut payé/mandaté : numéro de mandat requis
  const sansMandat = decisionsAnnee.filter(d => (d.statut === "mandate" || d.statut === "paye") && !d.numero_mandat);
  if (sansMandat.length > 0) {
    issues.push({ code: "R8", severity: "warning",
      message: `${sansMandat.length} décision(s) mandatée(s)/payée(s) sans n° de mandat.`,
      count: sansMandat.length });
  }

  // R9 — Élève existant et actif
  const elevesIds = new Set(ctx.eleves.map(e => e.id));
  const decisionsElevesInconnus = decisionsAnnee.filter(d => !elevesIds.has(d.eleve_id));
  if (decisionsElevesInconnus.length > 0) {
    issues.push({ code: "R9", severity: "error",
      message: `${decisionsElevesInconnus.length} décision(s) référencent un élève inconnu.`,
      count: decisionsElevesInconnus.length });
  }

  // R10 — FSC ⇒ nature = restauration ou alimentation
  const fscMauvaiseNature = decisionsAnnee.filter(d =>
    d.type_fonds === "FSC" && !["restauration", "alimentation_bons_alimentation"].includes(d.nature_aide));
  if (fscMauvaiseNature.length > 0) {
    issues.push({ code: "R10", severity: "warning",
      message: `${fscMauvaiseNature.length} décision(s) FSC dont la nature n'est pas restauration / alimentation.`,
      count: fscMauvaiseNature.length });
  }

  // R11 — Taux de consommation cohérent
  if (kpis.q13_taux_consommation > 110) {
    issues.push({ code: "R11", severity: "error",
      message: `Taux de consommation = ${kpis.q13_taux_consommation.toFixed(1)} % (> 110 %). Versements supérieurs aux subventions + reliquats.`,
      hint: "Vérifiez les subventions saisies ou identifiez un reliquat manquant." });
  } else if (kpis.q13_taux_consommation > 100) {
    issues.push({ code: "R11", severity: "warning",
      message: `Taux de consommation = ${kpis.q13_taux_consommation.toFixed(1)} % (> 100 %).` });
  }

  // R12 — Subventions Rectorat saisies
  if (kpis.q11_subv_rectorat_recue === 0 && decisionsAnnee.length > 0) {
    issues.push({ code: "R12", severity: "warning",
      message: "Aucune subvention Rectorat saisie pour cette année alors que des décisions existent.",
      hint: "Saisissez les notifications dans l'onglet Subventions." });
  }

  // R13 — BOP cohérent (141, 230, 214, 140)
  const bopValides = ["141", "230", "214", "140"];
  const subvBopInvalide = ctx.subventions.filter(s => s.annee_scolaire === annee && !bopValides.includes(s.bop));
  if (subvBopInvalide.length > 0) {
    issues.push({ code: "R13", severity: "error",
      message: `${subvBopInvalide.length} subvention(s) avec un BOP non standard.`,
      count: subvBopInvalide.length });
  }

  // R14 — Numéros de décisions uniques
  const nums = decisionsAnnee.map(d => d.numero_decision);
  const dupes = nums.filter((n, i) => n && nums.indexOf(n) !== i);
  if (dupes.length > 0) {
    issues.push({ code: "R14", severity: "error",
      message: `${new Set(dupes).size} numéro(s) de décision en doublon.`,
      count: new Set(dupes).size });
  }

  // R15 — Cohérence Q5 vs Q1 (élèves uniques ≤ demandes)
  if (kpis.q5_eleves_aides > kpis.q1_total_demandes) {
    issues.push({ code: "R15", severity: "error",
      message: "Incohérence : nombre d'élèves aidés > nombre de décisions." });
  }

  // R16 — Élèves boursiers représentés (info)
  if (kpis.q15_nb_eleves_boursiers_aides === 0 && kpis.q5_eleves_aides > 0) {
    issues.push({ code: "R16", severity: "info",
      message: "Aucun élève boursier parmi les bénéficiaires. Vérifiez les statuts boursier dans la base élèves." });
  }

  return issues;
}

export function severityWeight(s: Severity): number {
  return s === "error" ? 3 : s === "warning" ? 2 : 1;
}