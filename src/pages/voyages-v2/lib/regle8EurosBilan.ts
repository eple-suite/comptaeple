// ════════════════════════════════════════════════════════════════
// Règle des 8 € — VERSION POST-VOYAGE (BILAN)
// ────────────────────────────────────────────────────────────────
// Référence : Loi de finances n° 66-948 du 22/12/1966 art. 21
// Circulaire MENE2407159C du 16/7/2024 — Voyages scolaires
// Vademecum Créteil "Voyages scolaires : sécuriser le bilan"
//
// 3 CAS À L'ARRIVÉE :
//   1. ÉQUILIBRE (|résultat| ≤ tolérance)  → PV de clôture simple
//   2. EXCÉDENT (résultat > 0) :
//        a. reliquat individuel > 8 €  → REMBOURSEMENT OBLIGATOIRE
//                                        (mandats + courriers individualisés
//                                         + acte CA approbation bilan)
//        b. reliquat individuel ≤ 8 €  → INFORMATION OBLIGATOIRE familles
//                                        avec coupon 3 options
//                                        (reversement effectif / don exprès /
//                                         silence après délai = don tacite)
//   3. DÉFICIT (résultat < 0) :          → Délibération d'équilibre, prise
//                                          en charge ressources EPLE,
//                                          aucun complément famille
//                                          (circ. MENE2407159C 16/7/2024)
// ════════════════════════════════════════════════════════════════

export const SEUIL_DON_TACITE_BILAN = 8; // euros — LF 66-948 art. 21
export const TOLERANCE_EQUILIBRE_BILAN = 50; // euros — vademecum Créteil
export const DELAI_REPONSE_FAMILLE_DEFAUT = 30; // jours

export type CasBilan8Eur =
  | "equilibre"
  | "excedent_remboursement"
  | "excedent_information"
  | "deficit";

export interface ParticipantBilan {
  /** Identifiant de la famille (UUID participant). */
  participant_id: string;
  /** INE si disponible (utile au courrier). */
  ine?: string | null;
  nom: string;
  prenom: string;
  /** Montant déjà payé par cette famille (familles ANV exclues). */
  paye: number;
  /** Indique si la famille est partie effectivement (sinon hors calcul). */
  parti?: boolean;
}

export interface BilanCloture8EurInput {
  recettes_reelles: number;
  depenses_reelles: number;
  /** Familles parties = base de calcul du reliquat individuel. */
  participants: ParticipantBilan[];
  /** Tolérance autour de zéro pour considérer le voyage à l'équilibre. */
  tolerance_equilibre?: number;
  /** Délai paramétrable de réponse famille (cas 2b). */
  delai_reponse_jours?: number;
}

export interface RemboursementFamille {
  participant_id: string;
  nom: string;
  prenom: string;
  ine?: string | null;
  montant_a_rembourser: number;
}

export interface CouponFamille {
  participant_id: string;
  nom: string;
  prenom: string;
  ine?: string | null;
  montant_concerne: number;
  date_envoi: string; // ISO
  date_limite_reponse: string; // ISO
  reponse?: "reversement" | "don_expres" | "don_tacite_silence" | null;
  date_reponse?: string | null;
}

export interface BilanCloture8EurResult {
  cas: CasBilan8Eur;
  resultat: number; // recettes - dépenses
  nb_eleves_payants: number;
  reliquat_par_famille: number;
  /** Liste exhaustive des remboursements à émettre (cas 2a). */
  remboursements: RemboursementFamille[];
  /** Liste des coupons à envoyer (cas 2b). */
  coupons: CouponFamille[];
  /** Documents à générer automatiquement. */
  documents_a_generer: string[];
  /** Message à afficher dans l'UI (Bilan Créteil partie 4). */
  message_principal: string;
  /** Recommandation/action complémentaire. */
  recommandation?: string;
  /** Référence légale exhaustive. */
  reference_legale: string;
  /** Bandeau bloquant : aucun complément famille en cas de déficit. */
  bloque_complement_famille: boolean;
}

function isoPlus(jours: number, base?: Date): string {
  const d = base ? new Date(base) : new Date();
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

/** Évalue la règle 8 € au stade du BILAN définitif. Pure function. */
export function evaluerBilan8Euros(
  input: BilanCloture8EurInput,
): BilanCloture8EurResult {
  const ref =
    "LF n° 66-948 du 22/12/1966 art. 21 + circulaire MENE2407159C du 16/7/2024";
  const tolerance = Math.max(
    0,
    Number(input.tolerance_equilibre) || TOLERANCE_EQUILIBRE_BILAN,
  );
  const delai = Math.max(
    7,
    Number(input.delai_reponse_jours) || DELAI_REPONSE_FAMILLE_DEFAUT,
  );

  const recettes = Math.max(0, Number(input.recettes_reelles) || 0);
  const depenses = Math.max(0, Number(input.depenses_reelles) || 0);
  const resultat = +(recettes - depenses).toFixed(2);

  const partis = (input.participants || []).filter(
    (p) => p.parti !== false && (Number(p.paye) || 0) > 0,
  );
  const nbPayants = partis.length;

  // ─── CAS 1 — ÉQUILIBRE ────────────────────────────────────────
  if (Math.abs(resultat) <= tolerance) {
    return {
      cas: "equilibre",
      resultat,
      nb_eleves_payants: nbPayants,
      reliquat_par_famille: 0,
      remboursements: [],
      coupons: [],
      documents_a_generer: ["27_pv_reception.docx", "29_acte_CA_bilan.docx"],
      message_principal:
        "Le voyage est à l'équilibre (|résultat| ≤ tolérance). Aucune régularisation individuelle requise.",
      recommandation:
        "Présenter le PV de clôture et l'acte CA d'approbation du bilan.",
      reference_legale: ref,
      bloque_complement_famille: true,
    };
  }

  // ─── CAS 3 — DÉFICIT ──────────────────────────────────────────
  if (resultat < 0) {
    return {
      cas: "deficit",
      resultat,
      nb_eleves_payants: nbPayants,
      reliquat_par_famille: 0,
      remboursements: [],
      coupons: [],
      documents_a_generer: [
        "29_acte_CA_bilan.docx",
        "BILAN_deliberation_equilibre_deficit.docx",
      ],
      message_principal: `Le voyage présente un déficit de ${Math.abs(resultat).toFixed(2)} €. Doit être couvert par fonds propres EPLE ou subvention exceptionnelle.`,
      recommandation:
        "Aucun complément ne peut être demandé aux familles a posteriori (circulaire MENE2407159C du 16/7/2024). Faire voter une délibération d'équilibre.",
      reference_legale: ref,
      bloque_complement_famille: true,
    };
  }

  // ─── CAS 2 — EXCÉDENT ─────────────────────────────────────────
  if (nbPayants === 0) {
    return {
      cas: "excedent_information",
      resultat,
      nb_eleves_payants: 0,
      reliquat_par_famille: 0,
      remboursements: [],
      coupons: [],
      documents_a_generer: ["29_acte_CA_bilan.docx"],
      message_principal: `Excédent de ${resultat.toFixed(2)} € constaté mais aucune famille payante recensée.`,
      recommandation:
        "Vérifier la liste des participants partis et payants avant clôture.",
      reference_legale: ref,
      bloque_complement_famille: true,
    };
  }

  const reliquat = +(resultat / nbPayants).toFixed(2);

  // 2a : reliquat > 8 € → REMBOURSEMENT OBLIGATOIRE
  if (reliquat > SEUIL_DON_TACITE_BILAN) {
    const remboursements: RemboursementFamille[] = partis.map((p) => ({
      participant_id: p.participant_id,
      nom: p.nom,
      prenom: p.prenom,
      ine: p.ine ?? null,
      montant_a_rembourser: reliquat,
    }));
    return {
      cas: "excedent_remboursement",
      resultat,
      nb_eleves_payants: nbPayants,
      reliquat_par_famille: reliquat,
      remboursements,
      coupons: [],
      documents_a_generer: [
        "16_courrier_remboursement.docx", // par famille
        "30_etat_remboursements.docx",
        "29_acte_CA_bilan.docx",
        "BILAN_mandats_remboursement.csv",
      ],
      message_principal: `Excédent de ${resultat.toFixed(2)} € → reliquat individuel de ${reliquat.toFixed(2)} €/famille (> 8 €). Remboursement obligatoire des ${nbPayants} familles.`,
      recommandation:
        "Émettre les mandats de remboursement, transmettre les courriers individualisés et faire approuver les remboursements par le CA dans le même acte que le bilan.",
      reference_legale: ref,
      bloque_complement_famille: true,
    };
  }

  // 2b : reliquat ≤ 8 € → INFORMATION + COUPON 3 OPTIONS
  const today = new Date();
  const dateEnvoi = today.toISOString().slice(0, 10);
  const dateLimite = isoPlus(delai, today);
  const coupons: CouponFamille[] = partis.map((p) => ({
    participant_id: p.participant_id,
    nom: p.nom,
    prenom: p.prenom,
    ine: p.ine ?? null,
    montant_concerne: reliquat,
    date_envoi: dateEnvoi,
    date_limite_reponse: dateLimite,
    reponse: null,
    date_reponse: null,
  }));
  return {
    cas: "excedent_information",
    resultat,
    nb_eleves_payants: nbPayants,
    reliquat_par_famille: reliquat,
    remboursements: [],
    coupons,
    documents_a_generer: [
      "BILAN_coupon_reponse_3_options.docx",
      "30_etat_remboursements.docx",
      "29_acte_CA_bilan.docx",
    ],
    message_principal: `Excédent de ${resultat.toFixed(2)} € → reliquat individuel de ${reliquat.toFixed(2)} €/famille (≤ 8 €). Information obligatoire des ${nbPayants} familles avec coupon-réponse 3 options.`,
    recommandation: `Délai de réponse famille : ${delai} jours (jusqu'au ${dateLimite}). Sans réponse → don tacite enregistré au C/7588.`,
    reference_legale: ref,
    bloque_complement_famille: true,
  };
}

/**
 * Applique le délai de silence aux coupons : transforme tous les coupons
 * non répondus dont la date_limite_reponse est dépassée en don tacite.
 * Pure function : utilisée pour les tests et le job de relance.
 */
export function appliquerSilenceDonTacite(
  coupons: CouponFamille[],
  dateRef: Date = new Date(),
): CouponFamille[] {
  const refIso = dateRef.toISOString().slice(0, 10);
  return coupons.map((c) => {
    if (c.reponse || !c.date_limite_reponse) return c;
    if (c.date_limite_reponse <= refIso) {
      return {
        ...c,
        reponse: "don_tacite_silence",
        date_reponse: refIso,
      };
    }
    return c;
  });
}