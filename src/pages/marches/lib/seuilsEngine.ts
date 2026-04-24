// ═══════════════════════════════════════════════════════════════
// Moteur de seuils CCP — détermine la procédure applicable selon
// la date d'engagement et le type de marché
// Source : table mp_seuils_ccp (horodatée, modifiable par l'AC)
// ═══════════════════════════════════════════════════════════════

import type { ProcedureCalculee, SeuilCcp, TypeMarche, TypeMarcheSeuil } from "../types";

function toSeuilType(t: TypeMarche): TypeMarcheSeuil {
  return t === "travaux" ? "travaux" : "fournitures_services";
}

/** Sélectionne le jeu de seuils en vigueur à `date` pour `type`. */
export function getSeuilsApplicables(
  seuils: SeuilCcp[],
  date: Date | string,
  type: TypeMarche
): SeuilCcp | null {
  const d = typeof date === "string" ? new Date(date) : date;
  const target = toSeuilType(type);
  const candidates = seuils
    .filter((s) => s.type_marche === target)
    .filter((s) => new Date(s.date_debut) <= d && (!s.date_fin || new Date(s.date_fin) >= d))
    .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());
  return candidates[0] || null;
}

/** Calcule la procédure applicable. */
export function determinerProcedure(
  seuils: SeuilCcp[],
  date: Date | string,
  type: TypeMarche,
  montantTotalHT: number
): { procedure: ProcedureCalculee; seuil: SeuilCcp | null; baseLegale: string; libelle: string } {
  const seuil = getSeuilsApplicables(seuils, date, type);
  if (!seuil) {
    return {
      procedure: "dispense",
      seuil: null,
      baseLegale: "Aucun seuil paramétré",
      libelle: "Procédure indéterminée — paramétrer les seuils CCP",
    };
  }
  if (montantTotalHT < seuil.seuil_dispense) {
    return {
      procedure: "dispense",
      seuil,
      baseLegale: seuil.base_legale,
      libelle: `Dispense de publicité (< ${formatEur(seuil.seuil_dispense)} HT)`,
    };
  }
  if (montantTotalHT < seuil.seuil_formalisee) {
    if (seuil.seuil_mapa_publicite && montantTotalHT >= seuil.seuil_mapa_publicite) {
      return {
        procedure: "mapa_publicite",
        seuil,
        baseLegale: `${seuil.base_legale} ; R2123-1, R2131-12 CCP`,
        libelle: `MAPA avec publicité BOAMP/JAL obligatoire (≥ ${formatEur(seuil.seuil_mapa_publicite)} HT)`,
      };
    }
    return {
      procedure: "mapa",
      seuil,
      baseLegale: `${seuil.base_legale} ; R2123-1 CCP`,
      libelle: "Procédure adaptée (MAPA) — publicité adaptée",
    };
  }
  return {
    procedure: "formalisee",
    seuil,
    baseLegale: "R2124-1 CCP, AAO JOUE+BOAMP",
    libelle: `Procédure formalisée (≥ ${formatEur(seuil.seuil_formalisee)} HT)`,
  };
}

export function formatEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function profilAcheteurObligatoire(
  seuils: SeuilCcp[],
  date: Date | string,
  type: TypeMarche,
  montant: number
): boolean {
  const s = getSeuilsApplicables(seuils, date, type);
  if (!s || !s.seuil_profil_acheteur) return false;
  return montant >= s.seuil_profil_acheteur;
}
