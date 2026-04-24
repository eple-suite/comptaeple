// ════════════════════════════════════════════════════════════════
// Moteur d'alertes voyages — A.3 (rattrapage critique)
// Réf : Code éducation L.421-14 / R.421-20, vademecum Créteil,
//       Circulaire MENE2407159C, LF 66-948 art. 21, GBCP 2012-1246
// ════════════════════════════════════════════════════════════════

export type NiveauAlerte = "rouge" | "orange" | "bleu" | "vert";
export type CategorieAlerte =
  | "delai_ca"
  | "engagement_anticipe"
  | "ca_manquant"
  | "budget_desequilibre"
  | "recette_notifiee_sans_piece"
  | "accompagnateurs_factures_familles"
  | "reste_a_charge_eleve"
  | "anti_discrimination_boursiers"
  | "marche_seuil_mapa"
  | "fournisseur_seuil_12mois"
  | "ligne_sans_devis"
  | "etranger_sans_ariane"
  | "voyage_sans_assurance_annulation"
  | "cautionnement_post_rgp"
  | "famille_impaye"
  | "passeport_expirant"
  | "regle_8_euros";

export interface AlerteVoyage {
  id: string;
  categorie: CategorieAlerte;
  niveau: NiveauAlerte;
  bloquant: boolean;
  titre: string;
  message: string;
  reference_legale?: string;
  champ_concerne?: string;
  valeur_observee?: string | number;
}

export interface AlertesVoyageInput {
  date_depart?: string | null;
  date_retour?: string | null;
  date_ca_autorisation?: string | null;
  date_premier_engagement?: string | null;
  destination_pays?: string | null;
  inscription_ariane?: boolean;
  budget_total?: number;
  assurance_annulation_souscrite?: boolean;
  acte_regie_mentionne_cautionnement?: boolean;
  niveau_etablissement?: "college" | "lycee";
  nb_eleves_prevus?: number;
  total_recettes?: number;
  total_depenses?: number;
  total_recettes_secured?: number; // hors hypothèses
  recettes?: Array<{
    libelle?: string;
    statut_financeur?: string;
    piece_jointe?: boolean;
    montant?: number;
  }>;
  depenses?: Array<{
    libelle?: string;
    fournisseur?: string;
    montant_ttc?: number;
    montant_ht?: number;
    poste?: string;
    est_accompagnateur?: boolean;
    devis_present?: boolean;
  }>;
  participants?: Array<{
    boursier?: boolean;
    paye?: number;
    du?: number;
    date_derniere_relance?: string | null;
    passeport_expiration?: string | null;
  }>;
  taux_boursiers_etablissement?: number; // 0..1
  cumul_fournisseur_12mois?: Record<string, number>;
  seuil_mapa?: number; // par défaut 90 000 € HT (CCP 2026)
  seuil_reste_charge_college?: number; // défaut 300
  seuil_reste_charge_lycee?: number; // défaut 600
}

const SEUIL_MAPA_DEFAULT = 90000;
const SEUIL_3DEVIS_DEFAULT = 40000;
const SEUIL_LIGNE_DEVIS = 5000;
const SEUIL_RAC_COLLEGE = 300;
const SEUIL_RAC_LYCEE = 600;

function diffJours(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}

function uid(prefix: string, idx = 0): string {
  return `${prefix}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Évalue toutes les alertes pour un voyage. Pure function : utilisable en test
 * et dans l'UI sans I/O.
 */
export function evaluerAlertesVoyage(input: AlertesVoyageInput): AlerteVoyage[] {
  const alertes: AlerteVoyage[] = [];

  // ─── Délai CA ───────────────────────────────────────────────
  if (input.date_depart && !input.date_ca_autorisation) {
    alertes.push({
      id: uid("ca-manquant"),
      categorie: "ca_manquant",
      niveau: "rouge",
      bloquant: true,
      titre: "Aucune délibération du CA enregistrée",
      message:
        "Aucune délibération du CA n'est enregistrée. Aucune dépense ne peut être engagée tant que le CA n'a pas autorisé le voyage.",
      reference_legale: "Code éducation art. R.421-20",
      champ_concerne: "date_ca_autorisation",
    });
  }

  if (input.date_depart && input.date_ca_autorisation) {
    const delai = diffJours(input.date_depart, input.date_ca_autorisation);
    if (delai < 30) {
      alertes.push({
        id: uid("delai-ca"),
        categorie: "delai_ca",
        niveau: "rouge",
        bloquant: true,
        titre: `Délai CA → départ trop court (${delai} jours)`,
        message: `L'acte du CA du ${input.date_ca_autorisation} a été pris seulement ${delai} jours avant le départ. Les actes des EPLE sont exécutoires dans un délai de 15 à 30 jours après transmission aux autorités de contrôle (art. L.421-14 C. éducation et vademecum Créteil). Le voyage risque d'être entrepris sur un acte non exécutoire. Reporter la délibération ou la date de départ.`,
        reference_legale: "Code éducation art. L.421-14",
        valeur_observee: delai,
      });
    } else if (delai < 60) {
      alertes.push({
        id: uid("delai-ca"),
        categorie: "delai_ca",
        niveau: "orange",
        bloquant: false,
        titre: `Délai CA → départ serré (${delai} jours)`,
        message: `Délai serré entre délibération CA et départ (${delai} jours). Vérifier auprès de la DSDEN / rectorat que l'acte est bien rendu exécutoire.`,
        reference_legale: "Code éducation art. L.421-14",
        valeur_observee: delai,
      });
    } else if (delai < 90) {
      alertes.push({
        id: uid("delai-ca"),
        categorie: "delai_ca",
        niveau: "bleu",
        bloquant: false,
        titre: `Délai CA → départ correct mais court (${delai} jours)`,
        message: `Délai correct mais court (${delai} jours). Surveiller le contrôle de légalité.`,
        reference_legale: "Code éducation art. L.421-14",
        valeur_observee: delai,
      });
    }
  }

  // ─── Engagement anticipé ────────────────────────────────────
  if (input.date_ca_autorisation && input.date_premier_engagement) {
    if (diffJours(input.date_premier_engagement, input.date_ca_autorisation) < 0) {
      alertes.push({
        id: uid("engagement-anticipe"),
        categorie: "engagement_anticipe",
        niveau: "rouge",
        bloquant: true,
        titre: "Engagement de dépenses antérieur au CA",
        message:
          "Engagement de dépenses antérieur à la délibération CA. Non conforme à l'art. R.421-20 du Code de l'éducation. Risque de gestion de fait.",
        reference_legale: "Code éducation art. R.421-20",
      });
    }
  }

  // ─── Budget équilibre ───────────────────────────────────────
  const totR = input.total_recettes_secured ?? input.total_recettes ?? 0;
  const totD = input.total_depenses ?? 0;
  if (totD > 0 && Math.abs(totR - totD) > 1) {
    alertes.push({
      id: uid("budget-desequilibre"),
      categorie: "budget_desequilibre",
      niveau: "rouge",
      bloquant: true,
      titre: "Budget non équilibré",
      message: `Recettes sécurisées (${totR.toFixed(2)} €) ≠ dépenses (${totD.toFixed(2)} €). Le budget d'un voyage doit être strictement équilibré (instruction M9-6).`,
      reference_legale: "Instruction M9-6 / GBCP 2012-1246",
    });
  }

  // ─── Recettes notifiées sans pièce ──────────────────────────
  (input.recettes || []).forEach((r, idx) => {
    if (r.statut_financeur === "notifiee" && r.piece_jointe === false) {
      alertes.push({
        id: uid("recette-piece", idx),
        categorie: "recette_notifiee_sans_piece",
        niveau: "orange",
        bloquant: false,
        titre: `Notification manquante : ${r.libelle || "recette"}`,
        message: `La recette « ${r.libelle || ""} » est marquée NOTIFIÉE mais aucune pièce justificative n'est jointe. Joindre la notification officielle.`,
      });
    }
  });

  // ─── Accompagnateurs facturés aux familles ──────────────────
  const accDansFamilles = (input.depenses || []).some(
    (d) => d.est_accompagnateur && (d.poste !== "accompagnateurs")
  );
  if (accDansFamilles) {
    alertes.push({
      id: uid("accomp-familles"),
      categorie: "accompagnateurs_factures_familles",
      niveau: "rouge",
      bloquant: true,
      titre: "Coût accompagnateurs imputable aux familles",
      message:
        "Le coût des accompagnateurs ne peut pas être réparti sur les familles (principe de gratuité du service public d'enseignement). Isoler ces dépenses sur ressources propres / subventions.",
      reference_legale: "Circulaire MENE2407159C",
    });
  }

  // ─── Reste à charge famille ────────────────────────────────
  const seuilRAC =
    input.niveau_etablissement === "lycee"
      ? input.seuil_reste_charge_lycee ?? SEUIL_RAC_LYCEE
      : input.seuil_reste_charge_college ?? SEUIL_RAC_COLLEGE;
  if (input.budget_total && input.nb_eleves_prevus && input.nb_eleves_prevus > 0) {
    const racTheorique = input.budget_total / input.nb_eleves_prevus;
    if (racTheorique > seuilRAC) {
      alertes.push({
        id: uid("rac"),
        categorie: "reste_a_charge_eleve",
        niveau: "orange",
        bloquant: false,
        titre: `Reste à charge élevé (${racTheorique.toFixed(0)} € / élève)`,
        message: `Le coût théorique par élève (${racTheorique.toFixed(0)} €) dépasse le seuil paramétré (${seuilRAC} €). Risque d'éviction sociale.`,
      });
    }
  }

  // ─── Anti-discrimination boursiers ─────────────────────────
  if (input.participants && input.participants.length > 0 && input.taux_boursiers_etablissement) {
    const tauxPart =
      input.participants.filter((p) => p.boursier).length / input.participants.length;
    if (tauxPart < input.taux_boursiers_etablissement * 0.7) {
      alertes.push({
        id: uid("anti-discrim"),
        categorie: "anti_discrimination_boursiers",
        niveau: "orange",
        bloquant: false,
        titre: "Sous-représentation des boursiers",
        message: `Taux de boursiers participants (${(tauxPart * 100).toFixed(1)}%) très inférieur au taux établissement (${(input.taux_boursiers_etablissement * 100).toFixed(1)}%). Mobiliser fonds sociaux / aides ANCV.`,
      });
    }
  }

  // ─── Marchés publics ───────────────────────────────────────
  const seuilMapa = input.seuil_mapa ?? SEUIL_MAPA_DEFAULT;
  (input.depenses || []).forEach((d, idx) => {
    const mt = d.montant_ht ?? d.montant_ttc ?? 0;
    if (mt > SEUIL_LIGNE_DEVIS && d.devis_present === false) {
      alertes.push({
        id: uid("ligne-devis", idx),
        categorie: "ligne_sans_devis",
        niveau: "orange",
        bloquant: false,
        titre: `Devis manquant : ${d.libelle || "ligne"} (${mt.toFixed(0)} €)`,
        message: `Toute ligne > ${SEUIL_LIGNE_DEVIS} € HT doit s'appuyer sur au moins un devis (CCP 2026, principe de bonne gestion).`,
      });
    }
  });
  if (input.cumul_fournisseur_12mois) {
    Object.entries(input.cumul_fournisseur_12mois).forEach(([fn, mt], idx) => {
      if (mt >= seuilMapa) {
        alertes.push({
          id: uid("seuil-mapa", idx),
          categorie: "marche_seuil_mapa",
          niveau: "rouge",
          bloquant: true,
          titre: `Seuil MAPA dépassé : ${fn}`,
          message: `Cumul 12 mois glissants avec ${fn} = ${mt.toFixed(0)} € ≥ seuil MAPA (${seuilMapa} €). Procédure formalisée requise.`,
          reference_legale: "CCP 2026 — articles R.2123-1 et suivants",
        });
      } else if (mt >= seuilMapa * 0.9) {
        alertes.push({
          id: uid("seuil-mapa-90", idx),
          categorie: "marche_seuil_mapa",
          niveau: "orange",
          bloquant: false,
          titre: `Seuil MAPA approché : ${fn}`,
          message: `Cumul 12 mois avec ${fn} = ${mt.toFixed(0)} € (≥ 90 % du seuil MAPA). Anticiper la procédure.`,
        });
      }
    });
  }

  // ─── Étranger sans Ariane ──────────────────────────────────
  if (
    input.destination_pays &&
    input.destination_pays.toLowerCase() !== "france" &&
    input.inscription_ariane === false
  ) {
    alertes.push({
      id: uid("ariane"),
      categorie: "etranger_sans_ariane",
      niveau: "orange",
      bloquant: false,
      titre: "Voyage à l'étranger sans inscription Ariane",
      message:
        "Voyage à l'étranger : inscrire le groupe sur Ariane (MEAE) pour bénéficier de l'assistance consulaire en cas de crise.",
    });
  }

  // ─── Assurance annulation ──────────────────────────────────
  if (
    (input.budget_total ?? 0) > 5000 &&
    input.assurance_annulation_souscrite === false
  ) {
    alertes.push({
      id: uid("assurance"),
      categorie: "voyage_sans_assurance_annulation",
      niveau: "orange",
      bloquant: false,
      titre: "Pas d'assurance annulation pour voyage > 5 000 €",
      message:
        "Voyage > 5 000 € sans assurance annulation : risque financier majeur en cas d'annulation force majeure.",
    });
  }

  // ─── Cautionnement post-RGP ────────────────────────────────
  if (input.acte_regie_mentionne_cautionnement) {
    alertes.push({
      id: uid("caution-rgp"),
      categorie: "cautionnement_post_rgp",
      niveau: "rouge",
      bloquant: true,
      titre: "Cautionnement régisseur — mention obsolète",
      message:
        "L'acte régie mentionne un cautionnement : depuis l'ordonnance RGP 2022-408, le cautionnement est supprimé et remplacé par une indemnité de maniement de fonds. Corriger l'acte.",
      reference_legale: "Ordonnance RGP 2022-408",
    });
  }

  // ─── Familles impayés ──────────────────────────────────────
  (input.participants || []).forEach((p, idx) => {
    if (
      p.du &&
      (p.paye ?? 0) < p.du &&
      p.date_derniere_relance &&
      diffJours(new Date().toISOString(), p.date_derniere_relance) >= 30
    ) {
      alertes.push({
        id: uid("impaye", idx),
        categorie: "famille_impaye",
        niveau: "orange",
        bloquant: false,
        titre: `Impayé famille (≥ 30 j sans relance)`,
        message: `Reste dû ${(p.du - (p.paye ?? 0)).toFixed(2)} € sans relance depuis 30 jours. Émettre un titre exécutoire si nécessaire.`,
      });
    }
    if (p.passeport_expiration && input.date_retour) {
      if (diffJours(p.passeport_expiration, input.date_retour) < 0) {
        alertes.push({
          id: uid("passeport", idx),
          categorie: "passeport_expirant",
          niveau: "rouge",
          bloquant: true,
          titre: "Passeport expirant avant le retour",
          message: `Passeport expirant le ${p.passeport_expiration} (avant la date de retour ${input.date_retour}).`,
        });
      }
    }
  });

  return alertes;
}

/** Tri pour affichage : bloquants → rouge → orange → bleu. */
export function trierAlertes(a: AlerteVoyage[]): AlerteVoyage[] {
  const ordre: Record<NiveauAlerte, number> = { rouge: 0, orange: 1, bleu: 2, vert: 3 };
  return [...a].sort((x, y) => {
    if (x.bloquant !== y.bloquant) return x.bloquant ? -1 : 1;
    return ordre[x.niveau] - ordre[y.niveau];
  });
}

export function compterParNiveau(a: AlerteVoyage[]): Record<NiveauAlerte, number> {
  return a.reduce(
    (acc, x) => {
      acc[x.niveau] = (acc[x.niveau] ?? 0) + 1;
      return acc;
    },
    { rouge: 0, orange: 0, bleu: 0, vert: 0 } as Record<NiveauAlerte, number>
  );
}