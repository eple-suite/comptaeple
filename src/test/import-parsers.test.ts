// Tests couche d'import (audit #3) — primitives de parsing FR (nombres, dates,
// identifiants INE/UAI) réutilisées par tous les parsers, et parser Grand Livre
// de bout en bout via un classeur construit.
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseFrenchNumber, parseFrenchDate, isValidINE, isValidUAI } from "@/lib/import/textUtils";
import { parseGrandLivre } from "@/lib/import/parsers/grandLivreParser";

describe("parseFrenchNumber", () => {
  it("format FR : virgule décimale + espaces milliers (dont insécables)", () => {
    expect(parseFrenchNumber("1 234,56")).toBe(1234.56);
    expect(parseFrenchNumber("1 234,56")).toBe(1234.56);
  });
  it("parenthèses comptables → négatif", () => {
    expect(parseFrenchNumber("(500)")).toBe(-500);
  });
  it("symbole € et format anglo toléré", () => {
    expect(parseFrenchNumber("1 234,56 €")).toBe(1234.56);
    expect(parseFrenchNumber("1,234.56")).toBe(1234.56);
  });
  it("nombre déjà numérique renvoyé tel quel", () => {
    expect(parseFrenchNumber(1234.5)).toBe(1234.5);
  });
  it("vide ou non numérique → NaN", () => {
    expect(parseFrenchNumber("")).toBeNaN();
    expect(parseFrenchNumber("abc")).toBeNaN();
  });
});

describe("parseFrenchDate", () => {
  const ymd = (d: Date | null) => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];
  it("ISO AAAA-MM-JJ", () => expect(ymd(parseFrenchDate("2026-07-15"))).toEqual([2026, 7, 15]));
  it("FR JJ/MM/AAAA", () => expect(ymd(parseFrenchDate("15/07/2026"))).toEqual([2026, 7, 15]));
  it("année sur 2 chiffres → pivot 2000", () => expect(ymd(parseFrenchDate("15/07/26"))).toEqual([2026, 7, 15]));
  it("valeur absente ou illisible → null", () => {
    expect(parseFrenchDate(null)).toBeNull();
    expect(parseFrenchDate("xyz")).toBeNull();
  });
  it("objet Date valide renvoyé tel quel", () => {
    const d = new Date(2026, 0, 1);
    expect(parseFrenchDate(d)).toBe(d);
  });
});

describe("Identifiants Éducation nationale", () => {
  it("INE = 11 caractères alphanumériques", () => {
    expect(isValidINE("1234567890A")).toBe(true);
    expect(isValidINE("12345")).toBe(false);
  });
  it("UAI = 7 chiffres + 1 lettre", () => {
    expect(isValidUAI("9710001A")).toBe(true);
    expect(isValidUAI("12345")).toBe(false);
  });
});

describe("parseGrandLivre — bout en bout", () => {
  const workbook = () => {
    const aoa = [
      ["Date", "Journal", "Piece", "Compte", "Libelle", "Debit", "Credit"],
      ["15/07/2026", "ACH", "P1", "606100", "Achat fournitures", "100,50", "0"],
      ["16/07/2026", "VTE", "P2", "706000", "Vente prestation", "0", "200,00"],
      ["", "", "", "", "", "", ""], // ligne sans compte → ignorée
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grand Livre");
    return wb;
  };

  it("extrait les écritures, totalise et agrège par compte", () => {
    const r = parseGrandLivre(workbook());
    expect(r).not.toBeNull();
    expect(r!.ecritures).toHaveLength(2);
    expect(r!.totalDebit).toBe(100.5);
    expect(r!.totalCredit).toBe(200);
    expect(r!.comptes).toEqual([
      { compte: "606100", debit: 100.5, credit: 0, solde: 100.5 },
      { compte: "706000", debit: 0, credit: 200, solde: -200 },
    ]);
  });
});
