#!/usr/bin/env -S npx tsx
// Vérifie la table mp_seuils_ccp via la fonction getSeuilsApplicables
import { getSeuilsApplicables, determinerProcedure } from "../src/pages/marches/lib/seuilsEngine";

const seuils: any[] = [
  { id: "1", date_debut: "2026-01-01", date_fin: "2026-03-31", type_marche: "fournitures_services",
    seuil_dispense: 40000, seuil_mapa_publicite: 90000, seuil_formalisee: 215000, base_legale: "R2122-8", commentaire: "" },
  { id: "2", date_debut: "2026-01-01", date_fin: null, type_marche: "travaux",
    seuil_dispense: 100000, seuil_mapa_publicite: 90000, seuil_formalisee: 5382000, base_legale: "R2122-8 décret 2025-1386", commentaire: "" },
  { id: "3", date_debut: "2026-04-01", date_fin: "2027-12-31", type_marche: "fournitures_services",
    seuil_dispense: 60000, seuil_mapa_publicite: 90000, seuil_formalisee: 215000, base_legale: "R2122-8 décret 2025-1386", commentaire: "" },
];

let ok = true;
function expect(label: string, cond: boolean) {
  console.log((cond ? "✓ " : "✗ ") + label); if (!cond) ok = false;
}

const s1 = getSeuilsApplicables(seuils, "2026-02-15", "fournitures");
expect("15/02/2026 dispense FS = 40 000", s1?.seuil_dispense === 40000);

const s2 = getSeuilsApplicables(seuils, "2026-06-15", "services");
expect("15/06/2026 dispense FS = 60 000", s2?.seuil_dispense === 60000);

const s3 = getSeuilsApplicables(seuils, "2026-01-15", "travaux");
expect("15/01/2026 dispense travaux = 100 000", s3?.seuil_dispense === 100000);
expect("15/01/2026 formalisée travaux = 5 382 000", s3?.seuil_formalisee === 5382000);

const p1 = determinerProcedure(seuils, "2026-02-15", "fournitures", 35000);
expect("35k au 15/02/2026 → dispense", p1.procedure === "dispense");
const p2 = determinerProcedure(seuils, "2026-06-15", "fournitures", 50000);
expect("50k au 15/06/2026 → dispense (seuil rehaussé)", p2.procedure === "dispense");
const p3 = determinerProcedure(seuils, "2026-06-15", "fournitures", 100000);
expect("100k au 15/06/2026 → MAPA publicité", p3.procedure === "mapa_publicite");
const p4 = determinerProcedure(seuils, "2026-06-15", "fournitures", 250000);
expect("250k au 15/06/2026 → formalisée", p4.procedure === "formalisee");

process.exit(ok ? 0 : 1);
