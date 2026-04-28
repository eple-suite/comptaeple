import { describe, it, expect } from "vitest";
import { parserSDE, parserSDR } from "@/lib/cofieple_calculations";

/**
 * Non-régression — Mapping positionnel Op@le SDE/SDR
 * ---------------------------------------------------
 * Lorsque les en-têtes contiennent « Montant colonne 1..5 »,
 * l'ordre Op@le doit être strictement respecté :
 *   col 1 = Budget · col 2 = Engagé · col 3 = Réalisé (AOR pour SDR)
 *   col 4 = En cours · col 5 = Disponible (SDE) / +-values (SDR)
 *
 * Référence : src/lib/cofieple_calculations.ts (parserSDE / parserSDR)
 * et patch positionnel Op@le.
 */
describe("Mapping positionnel Op@le — Montant colonne 1..5", () => {
  const baseRow = {
    RNE: "0000000A",
    Exercice: "2024",
    "Service budgétaire": "AP",
    "Domaine fonctionnel": "DOM",
    "Code activité": "ACT",
    "Compte par nature": "606300",
    "Montant colonne 1": "1000",
    "Montant colonne 2": "200",
    "Montant colonne 3": "300",
    "Montant colonne 4": "400",
    "Montant colonne 5": "500",
  };

  it("SDE : col 1→Budget, 2→Engagé, 3→Réalisé, 4→En cours, 5→Disponible", () => {
    const [ligne] = parserSDE([baseRow], "BI");
    expect(ligne).toBeDefined();
    expect(ligne.budget).toBe(1000);
    expect(ligne.engage).toBe(200);
    expect(ligne.realise).toBe(300);
    expect(ligne.encours).toBe(400);
    expect(ligne.disponible).toBe(500);
  });

  it("SDR : col 1→Budget, 2→Engagé, 3→Réalisé/AOR, 4→En cours, 5→+/-values", () => {
    const [ligne] = parserSDR([baseRow], "BI");
    expect(ligne).toBeDefined();
    expect(ligne.budget).toBe(1000);
    expect(ligne.engage).toBe(200);
    expect(ligne.realise).toBe(300);
    expect(ligne.aor).toBe(300);
    expect(ligne.encours).toBe(400);
    expect(ligne.plusValues).toBe(500);
  });

  it("Aucune contamination : valeurs manquantes restent à 0 (pas de fallback)", () => {
    const partial = {
      ...baseRow,
      "Montant colonne 1": "",
      "Montant colonne 2": "",
      "Montant colonne 4": "",
      "Montant colonne 5": "",
    };
    const [sde] = parserSDE([partial], "BI");
    expect(sde.budget).toBe(0);
    expect(sde.engage).toBe(0);
    expect(sde.realise).toBe(300); // seule colonne renseignée
    expect(sde.encours).toBe(0);
    expect(sde.disponible).toBe(0);
  });
});
