// Tests parsers État des tiers et Régies (audit #3) — ventilation des soldes
// par nature de compte et calcul des écarts encaissements/mandats.
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseEtatTiers } from "@/lib/import/parsers/etatTiersParser";
import { parseRegies } from "@/lib/import/parsers/regiesParser";

const book = (name: string, aoa: (string | number)[][]) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
  return wb;
};

describe("parseEtatTiers — soldes par nature (411/401/autres)", () => {
  it("ventile familles, fournisseurs et autres, ignore les comptes hors classe 4", () => {
    const r = parseEtatTiers(book("Tiers", [
      ["Code tiers", "Libelle", "Compte", "Solde"],
      ["F001", "DUPONT", "411200", "300,00"],
      ["FOUR1", "ACME", "401100", "-500,00"],
      ["X1", "Autre", "4661", "50,00"],
      ["Z", "Hors", "999", "10,00"], // compte hors classe 4 → ignoré
    ]));
    expect(r).not.toBeNull();
    expect(r!.lignes).toHaveLength(3);
    expect(r!.totalFamilles).toBe(300);
    expect(r!.totalFournisseurs).toBe(-500);
    expect(r!.totalAutres).toBe(50);
  });
});

describe("parseRegies — soldes et écart encaissements/mandats", () => {
  it("calcule l'écart par régie et le total des soldes", () => {
    const r = parseRegies(book("Regies", [
      ["Regie", "Solde", "Encaissements", "Mandats"],
      ["Régie SATD", "1000", "5000", "4800"],
      ["Régie voyages", "500", "2000", "2000"],
      ["", "", "", ""], // régie sans nom → ignorée
    ]));
    expect(r).not.toBeNull();
    expect(r!.regies).toHaveLength(2);
    expect(r!.totalSoldes).toBe(1500);
    expect(r!.regies[0].ecart).toBe(200);
    expect(r!.regies[1].ecart).toBe(0);
  });
});
