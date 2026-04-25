import { describe, it, expect } from "vitest";
import {
  detecterElementsSensibles,
  contientElementsSensibles,
} from "../src/lib/opale/anonymisation";

describe("Op@le — Anonymisation RGPD", () => {
  it("détecte un code UAI (7 chiffres + lettre)", () => {
    const r = detecterElementsSensibles("Voir EPLE 9710001A pour la dépense");
    expect(r.some((d) => d.type === "uai")).toBe(true);
  });

  it("détecte un email", () => {
    expect(contientElementsSensibles("Contact : ce.9710001a@ac-guadeloupe.fr")).toBe(true);
  });

  it("détecte un IBAN français", () => {
    expect(contientElementsSensibles("IBAN : FR76 3000 4000 0300 1234 5678 901")).toBe(true);
  });

  it("détecte un SIRET (14 chiffres)", () => {
    expect(contientElementsSensibles("SIRET 19971000300018")).toBe(true);
  });

  it("détecte un INE élève", () => {
    expect(contientElementsSensibles("INE 1234567890A de l'élève")).toBe(true);
  });

  it("détecte un numéro de téléphone français", () => {
    expect(contientElementsSensibles("Tel : 05 90 12 34 56")).toBe(true);
  });

  it("ne déclenche pas sur un texte propre", () => {
    expect(
      contientElementsSensibles(
        "Bloc dépense Op@le : la pièce de mandatement reste en attente de validation comptable.",
      ),
    ).toBe(false);
  });

  it("retourne plusieurs occurrences pour un texte mixte", () => {
    const r = detecterElementsSensibles(
      "EPLE 9710001A · email test@academie.fr · IBAN FR76 1000 2000 3000 4000 5000 612",
    );
    const types = new Set(r.map((d) => d.type));
    expect(types.has("uai")).toBe(true);
    expect(types.has("email")).toBe(true);
    expect(types.has("iban")).toBe(true);
  });
});