// Tests parsers Bourses et SIECLE (audit #3) — rapprochement C/443110 et
// import liste élèves (validation INE, détection doublons, flag boursier).
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseBourses } from "@/lib/import/parsers/boursesParser";
import { parseSiecleCsv } from "@/lib/import/parsers/siecleParser";

describe("parseBourses — état des bourses (rapprochement 443110)", () => {
  const workbook = () => {
    const aoa = [
      ["INE", "Eleve", "Montant trimestriel", "Statut"],
      ["1234567890A", "Dupont Marie", "150,50", "Attribuée"],
      ["BADINE", "Martin Paul", "100", "En attente"], // INE invalide (6 car.)
      ["", "", "", ""], // ligne vide ignorée
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bourses");
    return wb;
  };

  it("totalise le dû et ne compte que les INE valides", () => {
    const r = parseBourses(workbook());
    expect(r).not.toBeNull();
    expect(r!.lignes).toHaveLength(2);
    expect(r!.totalDu).toBe(250.5);
    expect(r!.ineValides).toBe(1);
    expect(r!.lignes[0]).toMatchObject({ montantTrimestriel: 150.5, statut: "Attribuée" });
  });
});

describe("parseSiecleCsv — liste élèves (RGPD)", () => {
  const csv = [
    "INE;Nom;Prenom;Classe;Boursier",
    "1234567890A;Dupont;Marie;3A;OUI",
    "1234567890A;Dupont;Marie;3A;OUI", // doublon d'INE
    "BADINE;Martin;Paul;3B;NON",        // INE invalide
    ";;;;",                              // ligne vide
  ].join("\n");

  it("valide les INE, détecte les doublons et le statut boursier", () => {
    const r = parseSiecleCsv(csv);
    expect(r.source).toBe("csv");
    expect(r.eleves).toHaveLength(2);        // doublon exclu, élève invalide conservé
    expect(r.doublons).toBe(1);
    expect(r.ineInvalides).toBe(1);
    expect(r.ineValides).toBe(2);            // chaque occurrence d'INE valide comptée
    expect(r.eleves[0]).toMatchObject({ prenom: "Marie", classe: "3A", boursier: true });
    expect(r.eleves[1].boursier).toBe(false);
  });
});
