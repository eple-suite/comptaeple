// ═══════════════════════════════════════════════════════════════
// Helpers liés à l'enquête DGESCO Fonds Sociaux
// - Complétude d'une fiche élève (champs critiques pour l'enquête)
// - Mapping nature -> ligne Q10 affichée dans l'UI
// - Calcul de l'impact d'une décision sur les questions de l'enquête
// ═══════════════════════════════════════════════════════════════

import type { FsDecision, FsEleve, NatureAide } from "./fsv2Types";

/** Libellés Q10 officiels DGESCO. */
export const Q10_LIGNE_LABELS: Record<NatureAide, string> = {
  restauration: "Restauration",
  internat_hebergement: "Internat, hébergements",
  alimentation_bons_alimentation: "Alimentation, bons d'achat d'alimentation",
  sorties_voyages_periscolaire: "Sorties scolaires, voyages, activités périscolaires",
  transport_scolaire_carburant: "Transport scolaire (dont bons de carburant)",
  fournitures_scolaires_materiel: "Achat de fournitures scolaires",
  vetements: "Vêtements",
  soins_medicaux_hygiene: "Soins médicaux, produits d'hygiène, consultations",
};

/** Champs critiques pour produire une enquête complète. */
export interface CompletudeResult {
  pct: number;                 // 0..100
  missing: string[];           // labels lisibles
  level: "ok" | "warn" | "ko"; // vert / orange / rouge
}

/** Évalue la complétude d'une fiche élève vis-à-vis de l'enquête. */
export function evaluerCompletudeEleve(e: FsEleve): CompletudeResult {
  const checks: { ok: boolean; label: string }[] = [];

  checks.push({ ok: !!e.voie, label: "Voie d'inscription" });
  checks.push({ ok: !!e.niveau && e.niveau.trim().length > 0, label: "Niveau" });
  checks.push({ ok: !!e.classe && e.classe.trim().length > 0, label: "Classe" });
  checks.push({ ok: typeof e.statut_boursier === "boolean", label: "Statut boursier renseigné" });

  if (e.statut_boursier) {
    checks.push({ ok: !!e.echelon_bourse && e.echelon_bourse > 0, label: "Échelon de bourse" });
  }

  checks.push({
    ok: Array.isArray(e.responsables_legaux) && e.responsables_legaux.length > 0
      && !!e.responsables_legaux[0]?.nom,
    label: "Au moins un responsable légal",
  });

  // Adresse postale (peut être absente du modèle existant — on l'ignore si non typée)
  const anyE = e as unknown as { adresse_postale?: { rue?: string; ville?: string } | null };
  if (anyE.adresse_postale !== undefined) {
    const a = anyE.adresse_postale;
    checks.push({ ok: !!a && (!!a.rue || !!a.ville), label: "Adresse postale" });
  }

  const ok = checks.filter(c => c.ok).length;
  const total = checks.length;
  const pct = total === 0 ? 100 : Math.round((ok / total) * 100);
  const missing = checks.filter(c => !c.ok).map(c => c.label);
  const level: CompletudeResult["level"] = pct === 100 ? "ok" : pct >= 70 ? "warn" : "ko";

  return { pct, missing, level };
}

/** Liste les questions DGESCO impactées par une décision donnée. */
export interface ImpactEnquete {
  code: string;        // ex "Q7b", "Q10-restauration"
  label: string;       // tooltip court
}

export function impactsEnquete(d: FsDecision, eleve: FsEleve | undefined): ImpactEnquete[] {
  const out: ImpactEnquete[] = [];
  const voie = eleve?.voie;

  if (voie === "GT") out.push({ code: "Q7b", label: "Q7b — Voie générale & techno" });
  else if (voie === "PRO") out.push({ code: "Q7c", label: "Q7c — Voie professionnelle" });
  else if (voie === "1er_degre") out.push({ code: "Q11", label: "Q11 — 1er degré" });

  if (voie === "GT" || voie === "PRO") {
    out.push({ code: "Q8", label: "Q8 — Bénéficiaires uniques par voie" });
  }

  const natureLabel = Q10_LIGNE_LABELS[d.nature_aide as NatureAide] ?? d.nature_aide;
  out.push({ code: `Q10`, label: `Q10 — ${natureLabel}` });

  out.push({
    code: "Q15",
    label: d.modalite_attribution === "urgence"
      ? "Q15 — Procédure d'urgence"
      : "Q15 — Commission FS",
  });

  out.push({ code: "Q16", label: "Q16 — Cumul des dépenses" });

  if (eleve?.statut_boursier) {
    out.push({ code: "Q15+", label: "Compté dans 'dont boursiers'" });
  }

  return out;
}

/**
 * Détermine si l'élève reçoit ici sa première aide de l'année (sert au tableau
 * "Bénéficiaires uniques" du récapitulatif).
 */
export function premiereAideAnnee(
  eleveId: string,
  annee: string,
  decisions: FsDecision[],
  excludeDecisionId?: string,
): boolean {
  return !decisions.some(d =>
    d.eleve_id === eleveId
    && d.annee_scolaire === annee
    && d.id !== excludeDecisionId
    && d.statut !== "annule",
  );
}

/** Cumul annuel d'aides reçues par un élève (toutes décisions non annulées). */
export function cumulAnnuelEleve(
  eleveId: string,
  annee: string,
  decisions: FsDecision[],
): { total: number; nbFs: number; nbFsc: number } {
  let total = 0;
  let nbFs = 0;
  let nbFsc = 0;
  for (const d of decisions) {
    if (d.eleve_id !== eleveId) continue;
    if (d.annee_scolaire !== annee) continue;
    if (d.statut === "annule") continue;
    total += Number(d.montant);
    if (d.type_fonds === "FS") nbFs += 1;
    if (d.type_fonds === "FSC") nbFsc += 1;
  }
  return { total, nbFs, nbFsc };
}