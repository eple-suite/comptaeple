import { describe, it, expect } from "vitest";
import { calculerCreditNourriture } from "@/lib/creditNourritureEngine";
import {
  trouverCompte,
  detecterAnomalie,
  classifierParSource,
  NOMENCLATURE_M96,
} from "@/lib/m96nomenclature";
import {
  compteSixChiffres,
  compteM96Existant,
  montantPositif,
  montantStrictementPositif,
  siret,
} from "@/lib/validation/metier";

// Tests métier critiques (amélioration #10) sur les moteurs purs.

describe("calculerCreditNourriture — formule M9-6", () => {
  it("crédit = recettes + stock − charges", () => {
    const r = calculerCreditNourriture({
      recettesEligibles: 100000, chargesDenrees: 60000, stockInitial: 5000,
      joursEcoules: 100, joursRestants: 80,
    });
    expect(r.creditDisponible).toBe(45000); // 100000 + 5000 − 60000
    expect(r.coutMoyenJour).toBeCloseTo(600); // 60000 / 100
    expect(r.projectionChargesRestantes).toBeCloseTo(48000); // 600 × 80
    expect(r.soldeProjeteFin).toBeCloseTo(-3000);
    expect(r.statut).toBe("tension"); // taux 45000/48000 = 0,9375
  });

  it("statut excédent quand le crédit couvre largement la projection", () => {
    const r = calculerCreditNourriture({
      recettesEligibles: 100000, chargesDenrees: 40000, stockInitial: 0,
      joursEcoules: 100, joursRestants: 50,
    });
    expect(r.statut).toBe("excedent"); // taux 60000/20000 = 3
  });

  it("statut déficit quand le crédit est insuffisant", () => {
    const r = calculerCreditNourriture({
      recettesEligibles: 50000, chargesDenrees: 60000, stockInitial: 0,
      joursEcoules: 100, joursRestants: 100,
    });
    expect(r.creditDisponible).toBe(-10000);
    expect(r.statut).toBe("deficit");
  });

  it("aucun jour écoulé : coût/jour nul, alerte explicite", () => {
    const r = calculerCreditNourriture({
      recettesEligibles: 10000, chargesDenrees: 5000, stockInitial: 0,
      joursEcoules: 0, joursRestants: 120,
    });
    expect(r.coutMoyenJour).toBe(0);
    expect(r.projectionChargesRestantes).toBe(0);
    expect(r.alertes.some((a) => a.includes("jour de service"))).toBe(true);
  });
});

describe("nomenclature M9-6", () => {
  it("trouverCompte reconnaît un compte existant et rejette un libellé non numérique", () => {
    expect(trouverCompte("10")).toBeDefined();
    expect(trouverCompte("ZZZ")).toBeUndefined();
  });

  it("detecterAnomalie : solde nul = normal, sens inverse important = critique", () => {
    const c = trouverCompte("10");
    expect(c).toBeDefined();
    if (!c) return;
    expect(detecterAnomalie(c, 0).anomalie).toBe("normal");
    const signeNormal = c.sensNormal === "debiteur" ? 1 : -1;
    expect(detecterAnomalie(c, signeNormal * 1000).anomalie).toBe("normal");
    expect(detecterAnomalie(c, -signeNormal * 50000).anomalie).toBe("critique");
  });

  it("classifierParSource répartit la valeur absolue des soldes sur les buckets", () => {
    const res = classifierParSource([
      { numero: "10", solde: 1000 },
      { numero: "ZZZ", solde: -500 },
    ]);
    const total = Object.values(res).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1500);
    expect(res.inconnu).toBeGreaterThanOrEqual(500);
  });
});

describe("validation métier (zod) — Lot 2", () => {
  it("compteSixChiffres : 6 chiffres exactement", () => {
    expect(compteSixChiffres.safeParse("411211").success).toBe(true);
    expect(compteSixChiffres.safeParse("4112").success).toBe(false);
    expect(compteSixChiffres.safeParse("abcdef").success).toBe(false);
  });

  it("compteM96Existant : accepte un compte de la nomenclature, refuse l'inconnu", () => {
    const base = NOMENCLATURE_M96[0].numero;
    const padded = (base + "000000").slice(0, 6);
    expect(compteM96Existant.safeParse(padded).success).toBe(true);
    expect(compteM96Existant.safeParse("000000").success).toBe(false);
  });

  it("montants : positif vs strictement positif", () => {
    expect(montantPositif.safeParse(0).success).toBe(true);
    expect(montantPositif.safeParse(-1).success).toBe(false);
    expect(montantStrictementPositif.safeParse(0).success).toBe(false);
    expect(montantStrictementPositif.safeParse(250).success).toBe(true);
  });

  it("SIRET : clé de Luhn", () => {
    expect(siret.safeParse("73282932000074").success).toBe(true); // SIRET valide (Luhn)
    expect(siret.safeParse("73282932000073").success).toBe(false); // clé fausse
    expect(siret.safeParse("1234").success).toBe(false);
  });
});
