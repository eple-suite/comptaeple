/**
 * Recette — export ESTEVE (XML + CSV).
 * Vérifie : éligibilité, structure XML, échappement, header CSV avec BOM.
 */
import { describe, it, expect } from "vitest";
import {
  eligibleExportEsteve,
  genererXmlEsteve,
  genererCsvEsteve,
  type EstevePayload,
} from "../src/lib/entretiens/exportEsteve";
import type { Agent, EntretienProfessionnel } from "../src/lib/entretiens/types";

const agent: Agent = {
  id: "a1", establishment_id: "e1", nom: "DUPONT", prenom: "Marie",
  statut: "titulaire", actif: true, corps: "SAENES", grade: "Cl normale",
  echelon: 7, indice: 450, categorie: "B", filiere: "AENES",
  fonction: "Gestionnaire <test>", quotite_travail: 100,
};

function ent(over: Partial<EntretienProfessionnel> = {}): EntretienProfessionnel {
  return {
    id: "e1", establishment_id: "e1", agent_evalue_id: "a1", evaluateur_user_id: "u1",
    campagne_annee: "2025", statut: "finalise",
    signature_n1_at: "2025-04-10T10:00:00Z",
    visa_n2_at: "2025-04-12T10:00:00Z",
    signature_agent_at: "2025-04-15T10:00:00Z",
    finalise_at: "2025-04-16T10:00:00Z",
    ...over,
  };
}

describe("Éligibilité export ESTEVE", () => {
  it("accepte un entretien finalisé complet", () => {
    expect(eligibleExportEsteve(ent()).ok).toBe(true);
  });
  it("refuse un brouillon", () => {
    expect(eligibleExportEsteve(ent({ statut: "brouillon" })).ok).toBe(false);
  });
  it("refuse sans signature agent", () => {
    const r = eligibleExportEsteve(ent({ signature_agent_at: null }));
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/agent/i);
  });
});

describe("Génération XML ESTEVE", () => {
  const payload: EstevePayload = {
    entretien: ent(), agent,
    evaluateurNom: "M. Martin", autoriteN2Nom: "Mme Dubois",
    etablissementUai: "9710001A", etablissementNom: "Lycée Test",
  };
  const xml = genererXmlEsteve(payload);

  it("est un XML 1.0 UTF-8", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
  it("contient le namespace ESTEVE", () => {
    expect(xml).toContain("urn:education:esteve:crep:v1");
  });
  it("échappe les caractères dangereux", () => {
    expect(xml).toContain("Gestionnaire &lt;test&gt;");
    expect(xml).not.toContain("Gestionnaire <test>");
  });
  it("inclut UAI et campagne", () => {
    expect(xml).toContain("<UAI>9710001A</UAI>");
    expect(xml).toContain("<CampagneAnnee>2025</CampagneAnnee>");
  });
});

describe("Génération CSV ESTEVE", () => {
  const payload: EstevePayload = {
    entretien: ent(), agent,
    evaluateurNom: "M. Martin", etablissementUai: "9710001A", etablissementNom: "Lycée Test",
  };
  const csv = genererCsvEsteve([payload]);

  it("commence par un BOM UTF-8", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
  it("a un header séparateur point-virgule", () => {
    expect(csv).toMatch(/campagne;uai;etablissement;nom;prenom/);
  });
  it("contient une ligne de données", () => {
    expect(csv).toContain("DUPONT");
    expect(csv).toContain("9710001A");
  });
});