import { describe, it, expect } from "vitest";
import {
  OPALE_MODULES,
  OPALE_MODULES_LABELS,
  OPALE_TYPES_CONTENU,
  OPALE_TYPES_LABELS,
  STATUT_ACTUALITE_LABELS,
  STATUT_PUBLICATION_LABELS,
  VISIBILITE_LABELS,
} from "../src/lib/opale/types";

describe("Op@le — Référentiel types", () => {
  it("13 modules Op@le couverts", () => {
    expect(OPALE_MODULES.length).toBe(13);
    OPALE_MODULES.forEach((m) => {
      expect(typeof OPALE_MODULES_LABELS[m]).toBe("string");
      expect(OPALE_MODULES_LABELS[m].length).toBeGreaterThan(2);
    });
  });

  it("6 types de contenu (procédure, blocage, astuce, contournement, paramétrage, Q/R)", () => {
    expect(OPALE_TYPES_CONTENU.length).toBe(6);
    OPALE_TYPES_CONTENU.forEach((t) => {
      expect(OPALE_TYPES_LABELS[t]).toBeDefined();
    });
  });

  it("4 statuts d'actualité avec libellé et couleur", () => {
    const ks = Object.keys(STATUT_ACTUALITE_LABELS);
    expect(ks).toEqual(expect.arrayContaining(["valide", "a_verifier", "obsolete", "en_revision"]));
    ks.forEach((k) => {
      const v = STATUT_ACTUALITE_LABELS[k as keyof typeof STATUT_ACTUALITE_LABELS];
      expect(v.label).toBeTruthy();
      expect(v.color).toMatch(/(success|warning|destructive|muted)/);
    });
  });

  it("6 statuts de publication conformes au workflow modération", () => {
    expect(Object.keys(STATUT_PUBLICATION_LABELS)).toEqual(
      expect.arrayContaining(["brouillon", "soumise", "en_validation", "publiee", "rejetee", "archivee"]),
    );
  });

  it("3 niveaux de visibilité (privé, académique, national)", () => {
    expect(Object.keys(VISIBILITE_LABELS)).toEqual(
      expect.arrayContaining(["prive_groupement", "academique", "national_si_partage"]),
    );
  });
});