// Test du pont d'ingestion /import → hub COFIEPLE. Vérifie la partie nouvelle
// (matrice d'onglet → records → parser éprouvé) sans toucher au store (le store
// persiste en IndexedDB, indisponible en environnement Node).
import { describe, it, expect } from "vitest";
import { recordsFromMatrix } from "@/lib/import/cofiepleBridge";
import { normalizeRowsForOpaleImport } from "@/lib/opaleImportUtils";
import { parserBalance } from "@/lib/cofieple_calculations";

describe("recordsFromMatrix", () => {
  it("reconstruit des records clé/valeur à partir de la ligne d'en-têtes détectée", () => {
    const matrix = [
      ["Titre parasite", "", ""],           // avant l'en-tête
      ["Compte", "Solde débit", "Solde crédit"],
      ["515100", "1000", "0"],
    ];
    const rec = recordsFromMatrix(matrix, 1);
    expect(rec).toEqual([{ "Compte": "515100", "Solde débit": "1000", "Solde crédit": "0" }]);
  });

  it("retourne vide si l'en-tête est introuvable", () => {
    expect(recordsFromMatrix([["a"]], -1)).toEqual([]);
  });
});

describe("pont balance : matrice Op@le → parserBalance (chemin éprouvé)", () => {
  it("produit des LigneBalance avec les bons soldes", () => {
    const matrix = [
      ["Compte", "Intitulé réduit du compte", "Solde débit", "Solde crédit"],
      ["515100", "Trésor courant", "1000", "0"],
      ["120000", "Résultat de l'exercice", "0", "500"],
    ];
    const lignes = parserBalance(normalizeRowsForOpaleImport(recordsFromMatrix(matrix, 0)), "principal");
    expect(lignes.find((l) => l.compte === "515100")?.solDbt).toBe(1000);
    expect(lignes.find((l) => l.compte === "120000")?.solCrd).toBe(500);
  });
});
