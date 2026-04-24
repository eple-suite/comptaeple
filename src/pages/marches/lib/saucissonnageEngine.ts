// ═══════════════════════════════════════════════════════════════
// Détection anti-saucissonnage : cumul 12 mois glissants
// par établissement × famille × fournisseur
// ═══════════════════════════════════════════════════════════════

import type { Marche, SeuilCcp } from "../types";
import { getSeuilsApplicables } from "./seuilsEngine";

export interface CumulSaucissonnage {
  famille: string;
  total12m: number;
  marches: Marche[];
  seuilDispense: number;
  pctDuSeuil: number;
  niveau: "ok" | "alerte" | "critique";
}

/** Calcule pour chaque famille le cumul sur 12 mois glissants se terminant à `ref`. */
export function calculerCumulsParFamille(
  marches: Marche[],
  seuils: SeuilCcp[],
  ref: Date = new Date()
): CumulSaucissonnage[] {
  const debut = new Date(ref);
  debut.setMonth(debut.getMonth() - 12);
  const par: Record<string, { total: number; ms: Marche[]; type: Marche["type_marche"] }> = {};
  for (const m of marches) {
    const dEng = m.date_engagement ? new Date(m.date_engagement) : new Date(m.date_emission_besoin);
    if (dEng < debut || dEng > ref) continue;
    if (!m.famille_code) continue;
    if (!par[m.famille_code]) par[m.famille_code] = { total: 0, ms: [], type: m.type_marche };
    par[m.famille_code].total += Number(m.montant_total_ht || 0);
    par[m.famille_code].ms.push(m);
  }
  return Object.entries(par).map(([famille, v]) => {
    const seuil = getSeuilsApplicables(seuils, ref, v.type) ;
    const seuilDispense = seuil?.seuil_dispense || 40000;
    const pct = seuilDispense > 0 ? (v.total / seuilDispense) * 100 : 0;
    let niveau: CumulSaucissonnage["niveau"] = "ok";
    if (pct >= 100) niveau = "critique";
    else if (pct >= 70) niveau = "alerte";
    return { famille, total12m: v.total, marches: v.ms, seuilDispense, pctDuSeuil: pct, niveau };
  }).sort((a, b) => b.pctDuSeuil - a.pctDuSeuil);
}

/** Pour un nouveau marché en préparation, calcule le cumul existant même famille. */
export function cumulMemeFamille(
  famille: string,
  marches: Marche[],
  ref: Date = new Date()
): number {
  const debut = new Date(ref);
  debut.setMonth(debut.getMonth() - 12);
  return marches
    .filter((m) => m.famille_code === famille)
    .filter((m) => {
      const d = m.date_engagement ? new Date(m.date_engagement) : new Date(m.date_emission_besoin);
      return d >= debut && d <= ref;
    })
    .reduce((s, m) => s + Number(m.montant_total_ht || 0), 0);
}

/** Concentration : % cumulé attribué aux top 3 fournisseurs */
export function tauxConcentration(
  marches: Marche[],
  fournisseurNoms: Record<string, string>
): { top3Pct: number; total: number; details: { fournisseur: string; montant: number; pct: number }[] } {
  const par: Record<string, number> = {};
  let total = 0;
  for (const m of marches) {
    if (!m.fournisseur_attributaire_id) continue;
    const k = m.fournisseur_attributaire_id;
    par[k] = (par[k] || 0) + Number(m.montant_total_ht || 0);
    total += Number(m.montant_total_ht || 0);
  }
  const sorted = Object.entries(par)
    .map(([id, montant]) => ({ fournisseur: fournisseurNoms[id] || "Fournisseur inconnu", montant, pct: total ? (montant / total) * 100 : 0 }))
    .sort((a, b) => b.montant - a.montant);
  const top3Pct = sorted.slice(0, 3).reduce((s, x) => s + x.pct, 0);
  return { top3Pct, total, details: sorted };
}
