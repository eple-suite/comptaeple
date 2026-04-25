import { z } from "zod";

/**
 * Schéma Zod canonique des élèves pour l'import (fonds sociaux).
 * Aligné sur la table fs_eleves + champs aplatis pour le 1er responsable légal.
 */
export const VOIES = ["GT", "PRO", "1er_degre"] as const;

export const eleveImportSchema = z.object({
  nom: z.string().trim().min(1, "Nom obligatoire").max(100),
  prenom: z.string().trim().min(1, "Prénom obligatoire").max(100),
  classe: z.string().trim().max(50).optional().default(""),
  niveau: z.string().trim().max(50).optional().nullable(),
  filiere: z.string().trim().max(100).optional().nullable(),
  voie: z.enum(VOIES).default("GT"),
  ine: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{11}$/i, "INE invalide (11 caractères alphanumériques)")
    .optional()
    .nullable(),
  date_naissance: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")
    .optional()
    .nullable(),
  demi_pensionnaire: z.boolean().default(false),
  interne: z.boolean().default(false),
  statut_boursier: z.boolean().default(false),
  echelon_bourse: z.number().int().min(1).max(6).optional().nullable(),
  responsable_nom: z.string().trim().max(150).optional().nullable(),
  responsable_email: z.string().trim().email("Email invalide").optional().nullable(),
  responsable_telephone: z.string().trim().max(30).optional().nullable(),
  adresse_rue: z.string().trim().max(200).optional().nullable(),
  adresse_cp: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal à 5 chiffres")
    .optional()
    .nullable(),
  adresse_ville: z.string().trim().max(100).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.statut_boursier && !data.echelon_bourse) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["echelon_bourse"],
      message: "echelon_bourse obligatoire si boursier",
    });
  }
});

export type EleveImportInput = z.infer<typeof eleveImportSchema>;

export const TARGET_FIELDS = [
  "nom",
  "prenom",
  "classe",
  "niveau",
  "filiere",
  "voie",
  "ine",
  "date_naissance",
  "demi_pensionnaire",
  "interne",
  "statut_boursier",
  "echelon_bourse",
  "responsable_nom",
  "responsable_email",
  "responsable_telephone",
  "adresse_rue",
  "adresse_cp",
  "adresse_ville",
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

/** Coerce une valeur brute (string Excel/CSV) vers le bon type Zod. */
export function coerceValue(
  field: TargetField,
  raw: unknown,
): unknown {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (s === "") return undefined;

  switch (field) {
    case "demi_pensionnaire":
    case "interne":
    case "statut_boursier":
      return /^(true|1|oui|yes|x|o)$/i.test(s);
    case "echelon_bourse": {
      const n = parseInt(s, 10);
      return isNaN(n) ? undefined : n;
    }
    case "ine":
      return s.toUpperCase();
    case "date_naissance": {
      // Accepte JJ/MM/AAAA ou AAAA-MM-JJ
      const m1 = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
      if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
      return s;
    }
    case "voie": {
      const up = s.toUpperCase().replace(/\s+/g, "_");
      if (up.startsWith("PRO")) return "PRO";
      if (up.startsWith("1ER") || up.includes("PRIMAIRE")) return "1er_degre";
      return "GT";
    }
    default:
      return s;
  }
}

/**
 * Construit un payload fs_eleves à partir d'une ligne validée.
 * Les champs aplatis "responsable_*" et "adresse_*" sont regroupés en JSONB.
 */
export function toFsElevePayload(
  row: EleveImportInput,
  ctx: { establishment_id: string; user_id: string; annee_scolaire: string },
) {
  const responsables_legaux = row.responsable_nom
    ? [
        {
          nom: row.responsable_nom,
          email: row.responsable_email ?? null,
          telephone: row.responsable_telephone ?? null,
        },
      ]
    : [];

  const adresse_postale =
    row.adresse_rue || row.adresse_cp || row.adresse_ville
      ? {
          rue: row.adresse_rue ?? null,
          code_postal: row.adresse_cp ?? null,
          ville: row.adresse_ville ?? null,
        }
      : null;

  return {
    establishment_id: ctx.establishment_id,
    user_id: ctx.user_id,
    annee_scolaire: ctx.annee_scolaire,
    nom: row.nom,
    prenom: row.prenom,
    classe: row.classe ?? "",
    niveau: row.niveau ?? null,
    filiere: row.filiere ?? null,
    voie: row.voie,
    ine: row.ine ?? null,
    date_naissance: row.date_naissance ?? null,
    demi_pensionnaire: row.demi_pensionnaire,
    interne: row.interne,
    statut_boursier: row.statut_boursier,
    echelon_bourse: row.echelon_bourse ?? null,
    responsables_legaux,
    adresse_postale,
    actif: true,
  };
}