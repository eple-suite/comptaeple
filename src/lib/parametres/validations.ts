// ═══════════════════════════════════════════════════════════════
// Module Paramètres — Validations métier (chantier 3)
// Réf : Code éducation, GBCP 2012-1246, instruction 06-031-A-B-M,
//       ordonnance RGP 2022-408, RGPD UE 2016/679.
// ═══════════════════════════════════════════════════════════════

export type Severity = "info" | "warning" | "error";

export interface ValidationIssue {
  field?: string;
  severity: Severity;
  code: string;
  message: string;
  reference?: string;
}

/** Format UAI : 7 chiffres + 1 lettre (RAMSESE). */
export function isUaiFormatValid(uai: string | null | undefined): boolean {
  if (!uai) return false;
  return /^[0-9]{7}[A-Z]$/i.test(uai.trim());
}

/** SIRET : 14 chiffres + algorithme Luhn. */
export function isSiretValid(siret: string | null | undefined): boolean {
  if (!siret) return false;
  const s = siret.replace(/\s+/g, "");
  if (!/^[0-9]{14}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(s[i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** E-mail RFC 5322 simplifié. */
export function isEmailValid(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Téléphone — DOM Guadeloupe (0590/0690/0691/0696) ou métropole. */
export function isPhoneValid(tel: string | null | undefined): boolean {
  if (!tel) return false;
  const cleaned = tel.replace(/[\s.\-]/g, "");
  return /^(\+?33|0)[1-9][0-9]{8}$/.test(cleaned);
}

export function isIndiceMajoreValid(im: number | null | undefined): boolean {
  if (im == null) return true;
  return im >= 200 && im <= 1500;
}

export function isEchelonValid(ech: number | null | undefined): boolean {
  if (ech == null) return true;
  return ech >= 1 && ech <= 15;
}

export function isQuotiteValid(q: number | null | undefined): boolean {
  if (q == null) return true;
  return q >= 0 && q <= 100;
}

export function isAgeReasonable(dateNaissance: string | null | undefined, refDate: Date = new Date()): boolean {
  if (!dateNaissance) return true;
  const d = new Date(dateNaissance);
  if (Number.isNaN(d.getTime())) return false;
  const ageMs = refDate.getTime() - d.getTime();
  const ageY = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return ageY >= 16 && ageY <= 75;
}

/** Rôles incompatibles (séparation des fonctions GBCP). */
const INCOMPATIBLES: Record<string, string[]> = {
  ac: ["ordonnateur", "ordonnateur_suppleant", "regisseur_recettes", "regisseur_avances"],
  ordonnateur: ["ac", "fp", "regisseur_recettes", "regisseur_avances"],
  ordonnateur_suppleant: ["ac", "fp"],
  fp: ["ordonnateur", "ordonnateur_suppleant"],
  regisseur_recettes: ["ac", "ordonnateur"],
  regisseur_avances: ["ac", "ordonnateur"],
  correspondant_cicf: ["ac", "ordonnateur"],
};

/** Vérifie le cumul de rôles d'un agent (principal + secondaires). */
export function checkRoleCompatibility(rolePrincipal: string | null, rolesSecondaires: string[] = []): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!rolePrincipal) return issues;
  const allRoles = [rolePrincipal, ...rolesSecondaires];
  for (const r of allRoles) {
    const incompat = INCOMPATIBLES[r] || [];
    for (const other of allRoles) {
      if (other !== r && incompat.includes(other)) {
        issues.push({
          field: "role_principal",
          severity: "error",
          code: "GBCP_SEPARATION",
          message: `Cumul incompatible (séparation des fonctions GBCP) : « ${r} » ne peut pas coexister avec « ${other} ».`,
          reference: "Décret GBCP 2012-1246 art. 10 et 78",
        });
      }
    }
  }
  return issues;
}

/** Régisseur ⇒ suppléant obligatoire (instr. 06-031-A-B-M art. 5). */
export function checkRegisseurSuppleant(
  agentRole: string | null,
  hasSuppleantInGroupement: boolean
): ValidationIssue | null {
  if (!agentRole) return null;
  const isReg = ["regisseur_recettes", "regisseur_avances"].includes(agentRole);
  if (!isReg) return null;
  if (hasSuppleantInGroupement) return null;
  return {
    field: "role_principal",
    severity: "error",
    code: "REGIE_SUPPLEANT_MANQUANT",
    message:
      "Tout régisseur doit avoir un suppléant désigné par arrêté (instruction n° 06-031-A-B-M article 5).",
    reference: "Instruction codificatrice n° 06-031-A-B-M du 21/04/2006",
  };
}

/** Plusieurs AC titulaires actifs sur un même groupement → bloquant. */
export function checkUniqueAcTitulaire(allActiveAc: { id: string; statut?: string | null }[]): ValidationIssue | null {
  if (allActiveAc.length <= 1) return null;
  return {
    severity: "error",
    code: "AC_MULTIPLE",
    message: `Plusieurs Agents Comptables titulaires actifs (${allActiveAc.length}) — un seul est autorisé par groupement.`,
    reference: "Décret GBCP 2012-1246 art. 86",
  };
}

/** Délégation expirant dans X jours. */
export function isDelegationExpiringSoon(dateFin: string | null, days = 30, today = new Date()): boolean {
  if (!dateFin) return false;
  const fin = new Date(dateFin);
  const diff = (fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function isDelegationExpired(dateFin: string | null, today = new Date()): boolean {
  if (!dateFin) return false;
  return new Date(dateFin).getTime() < today.getTime();
}

/** Validation complète d'une fiche agent — agrégateur. */
export interface AgentLike {
  uai?: string | null;
  email_professionnel?: string | null;
  telephone_professionnel?: string | null;
  date_naissance?: string | null;
  indice_majore?: number | null;
  echelon?: number | null;
  quotite_travail?: number | null;
  statut?: string | null;
  corps?: string | null;
  role_principal?: string | null;
  roles_secondaires?: string[] | null;
  date_prevue_fin_fonction?: string | null;
  administration_origine?: string | null;
}

export function validateAgent(agent: AgentLike): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (agent.email_professionnel && !isEmailValid(agent.email_professionnel))
    issues.push({ field: "email_professionnel", severity: "error", code: "EMAIL_INVALID", message: "E-mail invalide." });

  if (agent.telephone_professionnel && !isPhoneValid(agent.telephone_professionnel))
    issues.push({ field: "telephone_professionnel", severity: "warning", code: "TEL_INVALID", message: "Téléphone non standard (DOM 0590/0690/0691/0696 ou métropole)." });

  if (!isAgeReasonable(agent.date_naissance))
    issues.push({ field: "date_naissance", severity: "warning", code: "AGE_RANGE", message: "Âge hors plage 16-75 ans." });

  if (!isIndiceMajoreValid(agent.indice_majore))
    issues.push({ field: "indice_majore", severity: "warning", code: "IM_RANGE", message: "Indice majoré hors plage 200-1500." });

  if (!isEchelonValid(agent.echelon))
    issues.push({ field: "echelon", severity: "warning", code: "ECH_RANGE", message: "Échelon hors plage 1-15." });

  if (!isQuotiteValid(agent.quotite_travail))
    issues.push({ field: "quotite_travail", severity: "error", code: "QUOTITE_RANGE", message: "Quotité doit être entre 0 et 100." });

  if (agent.statut === "titulaire" && !agent.corps)
    issues.push({ field: "corps", severity: "error", code: "CORPS_OBLIGATOIRE", message: "Corps obligatoire pour un titulaire (décret 2010-888 / 86-83)." });

  if ((agent.statut === "detache_entrant" || agent.statut === "detache_sortant") && !agent.administration_origine)
    issues.push({ field: "administration_origine", severity: "error", code: "DETACHEMENT_ORIGINE", message: "Administration d'origine obligatoire pour un détachement." });

  if (!agent.role_principal)
    issues.push({ field: "role_principal", severity: "warning", code: "ROLE_MANQUANT", message: "Cet agent n'a pas de rôle principal — à compléter ou archiver." });

  issues.push(...checkRoleCompatibility(agent.role_principal ?? null, agent.roles_secondaires ?? []));

  return issues;
}

export interface EstablishmentLike {
  uai?: string | null;
  siret?: string | null;
  email_secretariat?: string | null;
  email_intendance?: string | null;
  telephone?: string | null;
}

export function validateEstablishment(e: EstablishmentLike): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (e.uai && !isUaiFormatValid(e.uai))
    issues.push({ field: "uai", severity: "error", code: "UAI_FORMAT", message: "UAI invalide : 7 chiffres + 1 lettre (référentiel RAMSESE)." });
  if (e.siret && !isSiretValid(e.siret))
    issues.push({ field: "siret", severity: "error", code: "SIRET_INVALID", message: "SIRET invalide (14 chiffres + algorithme Luhn)." });
  if (e.email_secretariat && !isEmailValid(e.email_secretariat))
    issues.push({ field: "email_secretariat", severity: "error", code: "EMAIL_INVALID", message: "E-mail secrétariat invalide." });
  if (e.email_intendance && !isEmailValid(e.email_intendance))
    issues.push({ field: "email_intendance", severity: "error", code: "EMAIL_INVALID", message: "E-mail intendance invalide." });
  if (e.telephone && !isPhoneValid(e.telephone))
    issues.push({ field: "telephone", severity: "warning", code: "TEL_INVALID", message: "Téléphone non standard." });
  return issues;
}

/** Pour un agent : vrai si au moins un blocage critique. */
export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}