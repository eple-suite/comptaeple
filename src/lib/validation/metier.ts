// Schémas de validation métier réutilisables (amélioration #4).
// Brique commune pour standardiser les formulaires sur react-hook-form + zod :
// comptes M9-6 (6 chiffres), montants ≥ 0, SIRET valide (Luhn), dates cohérentes,
// exercice comptable. Messages d'erreur en français, vocabulaire M9-6.

import { z } from "zod";
import { trouverCompte } from "@/lib/m96nomenclature";

// ───────── Comptes M9-6 ─────────

/** Format réglementaire d'un compte détaillé M9-6 : exactement 6 chiffres. */
export const compteSixChiffres = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Le compte doit comporter exactement 6 chiffres (nomenclature M9-6).");

/**
 * Compte M9-6 issu de la nomenclature : 6 chiffres ET reconnu dans
 * `m96nomenclature` (utilisé pour les champs alimentés par liste déroulante,
 * cf. #31 — refus si compte hors nomenclature).
 */
export const compteM96Existant = compteSixChiffres.refine(
  (v) => trouverCompte(v) !== undefined || trouverCompte(v.slice(0, 3)) !== undefined,
  "Compte inconnu de la nomenclature M9-6.",
);

// ───────── Montants ─────────

/** Montant en euros ≥ 0 (recettes, charges, plafonds…). */
export const montantPositif = z
  .number({ invalid_type_error: "Montant invalide." })
  .min(0, "Le montant ne peut pas être négatif.");

/** Montant strictement positif (> 0) — ex. une créance, un titre de recettes. */
export const montantStrictementPositif = z
  .number({ invalid_type_error: "Montant invalide." })
  .gt(0, "Le montant doit être strictement positif.");

// ───────── SIRET (14 chiffres + clé de Luhn) ─────────

function luhnValide(num: string): boolean {
  let somme = 0;
  for (let i = 0; i < num.length; i++) {
    let chiffre = Number(num[num.length - 1 - i]);
    if (i % 2 === 1) {
      chiffre *= 2;
      if (chiffre > 9) chiffre -= 9;
    }
    somme += chiffre;
  }
  return somme % 10 === 0;
}

/** SIRET : 14 chiffres avec clé de Luhn valide. Optionnel via `.optional()`. */
export const siret = z
  .string()
  .trim()
  .regex(/^\d{14}$/, "Le SIRET doit comporter 14 chiffres.")
  .refine(luhnValide, "Clé de contrôle SIRET invalide.");

// ───────── Dates & exercice ─────────

/** Date au format AAAA-MM-JJ (input type=date). */
export const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");

/** Année d'exercice comptable plausible (2000–2100). */
export const exerciceComptable = z
  .number()
  .int()
  .min(2000, "Exercice invalide.")
  .max(2100, "Exercice invalide.");

/** Texte obligatoire (libellé, motif…), longueur minimale paramétrable. */
export const texteRequis = (min = 1, champ = "Ce champ") =>
  z.string().trim().min(min, `${champ} est obligatoire.`);

/**
 * Raffinement à appliquer sur un objet { debut, fin } pour garantir
 * fin ≥ debut (ex. régie temporaire, période d'inventaire).
 */
export function dateFinApresDebut<T extends { debut?: string; fin?: string }>(schema: z.ZodType<T>) {
  return schema.refine(
    (v) => !v.debut || !v.fin || v.fin >= v.debut,
    { message: "La date de fin doit être postérieure ou égale à la date de début.", path: ["fin"] },
  );
}
