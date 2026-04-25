#!/usr/bin/env -S npx tsx
import { detecterRepetitionFournisseur, calculerCumulsParFamille } from "../src/pages/marches/lib/saucissonnageEngine";

const seuils: any[] = [{ id: "1", date_debut: "2026-01-01", date_fin: null,
  type_marche: "fournitures_services", seuil_dispense: 40000, seuil_mapa_publicite: 90000,
  seuil_formalisee: 215000, base_legale: "R2122-8", commentaire: "" }];

const ref = new Date("2026-06-30");
const m = (i: number, fournId: string, fam: string, montant: number, mois: number) => ({
  id: String(i), reference_interne: "T-" + i, libelle: "x", type_marche: "fournitures",
  famille_code: fam, montant_total_ht: montant, fournisseur_attributaire_id: fournId,
  date_engagement: new Date(2026, mois, 10).toISOString().slice(0, 10),
  date_emission_besoin: new Date(2026, mois, 1).toISOString().slice(0, 10),
  statut: "notifie", checklist_validation: {}, historique: [], criteres: [],
} as any);

const marches: any[] = [
  m(1, "F1", "FOUR_BUREAU", 5000, 0),
  m(2, "F1", "FOUR_BUREAU", 6000, 2),
  m(3, "F1", "FOUR_BUREAU", 7000, 4),
];
const reps = detecterRepetitionFournisseur(marches, { F1: "ACME SAS" }, ref);
let ok = true;
const expect = (label: string, cond: boolean) => { console.log((cond ? "✓ " : "✗ ") + label); if (!cond) ok = false; };
expect("3 commandes/6 mois F1 → critique", reps.find(r => r.fournisseur_id === "F1")?.niveau === "critique");

const beaucoup = Array.from({ length: 10 }, (_, i) => m(100 + i, "F" + i, "FOUR_BUREAU", 3500, i % 6));
const cumuls = calculerCumulsParFamille(beaucoup, seuils, ref);
const c = cumuls.find(x => x.famille === "FOUR_BUREAU")!;
expect("Cumul ≥ 70% seuil → alerte", c.niveau === "alerte" || c.niveau === "critique");

process.exit(ok ? 0 : 1);
