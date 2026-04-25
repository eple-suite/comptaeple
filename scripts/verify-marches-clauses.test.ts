#!/usr/bin/env -S npx tsx
// Simule la logique de checklist du wizard pour les clauses 2026
function checklistFor(d: any) {
  const montant = Number(d.montant_estime_ht || 0);
  return {
    clause_environnementale: !!(d.exigences_environnementales && d.exigences_environnementales.length >= 30),
    capacite_eco_conforme:
      !d.plafond_ca_exige || Number(d.plafond_ca_exige) <= 1.5 * montant,
  };
}
let ok = true;
const expect = (l: string, c: boolean) => { console.log((c ? "✓ " : "✗ ") + l); if (!c) ok = false; };

const sansEnv = checklistFor({ montant_estime_ht: 50000, exigences_environnementales: "" });
expect("Sans clause env → bloqué", sansEnv.clause_environnementale === false);

const avecEnv = checklistFor({ montant_estime_ht: 50000,
  exigences_environnementales: "Tous les produits livrés porteront le label NF Environnement" });
expect("Avec clause env ≥30 car → OK", avecEnv.clause_environnementale === true);

const caTropHaut = checklistFor({ montant_estime_ht: 50000, plafond_ca_exige: 100000,
  exigences_environnementales: "Label NF Environnement obligatoire pour 100% des produits livrés" });
expect("Plafond CA 100k > 1,5 × 50k → bloqué", caTropHaut.capacite_eco_conforme === false);

const caOk = checklistFor({ montant_estime_ht: 50000, plafond_ca_exige: 70000,
  exigences_environnementales: "Label NF Environnement obligatoire pour 100% des produits livrés" });
expect("Plafond CA 70k ≤ 1,5 × 50k → OK", caOk.capacite_eco_conforme === true);

process.exit(ok ? 0 : 1);
