import { describe, it, expect } from "vitest";
import { evaluerRegle8Euros, SEUIL_DON_TACITE } from "@/pages/voyages-v2/lib/regle8Euros";

describe("Règle des 8 € — LF 66-948 art. 21", () => {
  it("retourne warning si effectif inconnu", () => {
    const r = evaluerRegle8Euros({ nbEleves: 0, totalDepensesTTC: 1000, partFamilles: 1000, partSubventions: 0, partAutres: 0 });
    expect(r.niveau).toBe("warning");
    expect(r.bloquant).toBe(false);
  });

  it("OK si reste à charge négatif (sponsorisé)", () => {
    const r = evaluerRegle8Euros({ nbEleves: 30, totalDepensesTTC: 3000, partFamilles: 0, partSubventions: 4000, partAutres: 0 });
    expect(r.niveau).toBe("ok");
    expect(r.bloquant).toBe(false);
  });

  it("BLOQUANT si reste à charge entre 0 et 8 €", () => {
    // 30 élèves, 100 € de RAC total → 3,33 €/élève
    const r = evaluerRegle8Euros({ nbEleves: 30, totalDepensesTTC: 1000, partFamilles: 900, partSubventions: 900, partAutres: 0 });
    // dep=1000, sub=900 → RAC = (1000-900)/30 = 3,33 €
    expect(r.bloquant).toBe(true);
    expect(r.niveau).toBe("bloquant");
    expect(r.resteAChargeParEleve).toBeGreaterThan(0);
    expect(r.resteAChargeParEleve).toBeLessThanOrEqual(SEUIL_DON_TACITE);
  });

  it("Pas bloquant si don tacite explicitement accepté", () => {
    const r = evaluerRegle8Euros({ nbEleves: 30, totalDepensesTTC: 1000, partFamilles: 900, partSubventions: 900, partAutres: 0, donTaciteAccepte: true });
    expect(r.bloquant).toBe(false);
    expect(r.niveau).toBe("warning");
  });

  it("OK si reste à charge > 8 €", () => {
    const r = evaluerRegle8Euros({ nbEleves: 30, totalDepensesTTC: 9000, partFamilles: 9000, partSubventions: 0, partAutres: 0 });
    expect(r.niveau).toBe("ok");
    expect(r.bloquant).toBe(false);
    expect(r.resteAChargeParEleve).toBeGreaterThan(SEUIL_DON_TACITE);
  });

  it("Cas limite : reste à charge = 8 € exactement → bloquant (≤ 8)", () => {
    const r = evaluerRegle8Euros({ nbEleves: 10, totalDepensesTTC: 80, partFamilles: 80, partSubventions: 0, partAutres: 0 });
    expect(r.resteAChargeParEleve).toBe(8);
    expect(r.bloquant).toBe(true);
  });

  it("Cas limite : reste à charge = 8,01 € → OK", () => {
    const r = evaluerRegle8Euros({ nbEleves: 100, totalDepensesTTC: 801, partFamilles: 801, partSubventions: 0, partAutres: 0 });
    expect(r.resteAChargeParEleve).toBeCloseTo(8.01, 2);
    expect(r.niveau).toBe("ok");
  });
});
