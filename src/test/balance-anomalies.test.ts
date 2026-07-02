// Tests moteur d'anomalies de balance M9-6 (audit #3) — lookup référentiel,
// règles RGP/clôture/trésorerie/caisse/bourses, scoring de risque et
// conversion en alertes transverses. Module pur.
import { describe, it, expect } from "vitest";
import type { BalanceLigne, CompteRef } from "@/lib/balance/referentielTypes";
import type { Anomalie } from "@/lib/balance/anomaliesEngine";
import {
  lookupCompte, detecterPeriode, aBudgetAnnexe, analyserBalance,
  statsAnomalies, anomaliesVersAlertes,
} from "@/lib/balance/anomaliesEngine";

const ligne = (compte: string, solde: number, libelle = ""): BalanceLigne => ({
  compte, libelle, debit: solde > 0 ? solde : 0, credit: solde < 0 ? -solde : 0, solde,
});

const ref = (compte: string, over: Partial<CompteRef> = {}): CompteRef => ({
  compte, libelle: compte, classe: Number(compte[0]), sous_classe: "", sens_normal: "D",
  sens_cloture: "D", despecialisable: true, type_compte: "financier",
  niveau_alerte_si_anormal: "majeure", message_alerte: "", cause_probable: "",
  action_corrective: "", reference_m96: "M9-6", actif: true, ...over,
});

describe("lookupCompte — exact puis préfixe le plus long", () => {
  const referentiel = [ref("411"), ref("41120"), ref("512")];
  it("privilégie le match exact", () => {
    expect(lookupCompte("411", referentiel)!.compte).toBe("411");
  });
  it("remonte au préfixe partagé le plus long", () => {
    expect(lookupCompte("411200", referentiel)!.compte).toBe("41120");
  });
  it("retourne null si aucun compte proche", () => {
    expect(lookupCompte("999999", referentiel)).toBeNull();
  });
});

describe("detecterPeriode — clôture en déc/janv/févr", () => {
  it("décembre → clôture", () => expect(detecterPeriode("2026-12-15")).toBe("cloture"));
  it("juin → cours", () => expect(detecterPeriode("2026-06-15")).toBe("cours"));
  it("date absente → cours", () => expect(detecterPeriode(null)).toBe("cours"));
});

describe("aBudgetAnnexe — présence d'un compte 185 mouvementé", () => {
  it("détecte le miroir 185", () => expect(aBudgetAnnexe([ligne("185000", 500)])).toBe(true));
  it("faux sans 185", () => expect(aBudgetAnnexe([ligne("512000", 500)])).toBe(false));
});

describe("analyserBalance — règles critiques par compte", () => {
  it("411X créditeur → trop-perçu famille (RGP)", () => {
    const [a] = analyserBalance([ligne("411200", -500)], []);
    expect(a.niveau).toBe("critique");
    expect(a.regle).toBe("rgp");
  });
  it("caisse 531 créditrice → impossible (caisse négative)", () => {
    const [a] = analyserBalance([ligne("531000", -50)], []);
    expect(a.regle).toBe("caisse");
    expect(a.niveau).toBe("critique");
  });
  it("467 non nul en clôture → apurement obligatoire", () => {
    const enCours = analyserBalance([ligne("467100", 100)], [], { periode: "cours" });
    const enCloture = analyserBalance([ligne("467100", 100)], [], { periode: "cloture" });
    expect(enCours).toHaveLength(0);
    expect(enCloture[0].regle).toBe("cloture");
  });
  it("bourses 443110 débiteur → avance État manquante", () => {
    const [a] = analyserBalance([ligne("443110", 300)], []);
    expect(a.regle).toBe("bourses");
  });
  it("règle générique : sens réel ≠ sens normal du référentiel", () => {
    const [a] = analyserBalance([ligne("512000", -100)], [ref("512000", { sens_normal: "D", niveau_alerte_si_anormal: "majeure" })]);
    expect(a.regle).toBe("sens");
    expect(a.niveau).toBe("majeure");
  });
  it("transverse : créances 4411 cumulées sans contrepartie classe 7", () => {
    const out = analyserBalance([ligne("44110", 2000)], []);
    expect(out.some((a) => a.regle === "contrepartie")).toBe(true);
  });
});

describe("statsAnomalies — score de risque pondéré", () => {
  const ano = (niveau: Anomalie["niveau"]): Anomalie => ({
    compte: "x", libelle: "x", solde: 0, sens_reel: "nul", sens_attendu: "D",
    niveau, message: "", cause: "", action: "", reference: "", regle: "sens",
  });
  it("pondère critique×20, majeure×8, mineure×3", () => {
    const s = statsAnomalies([ano("critique"), ano("majeure"), ano("mineure")]);
    expect(s.total).toBe(3);
    expect(s.scoreRisque).toBe(31);
  });
  it("plafonne le score à 100", () => {
    expect(statsAnomalies(Array.from({ length: 6 }, () => ano("critique"))).scoreRisque).toBe(100);
  });
});

describe("anomaliesVersAlertes — dédup et couleur", () => {
  it("mappe niveau→couleur et forge une dedup_key stable", () => {
    const [a] = analyserBalance([ligne("531000", -50)], []);
    const [alerte] = anomaliesVersAlertes([a], "etab-1", 2026);
    expect(alerte.niveau).toBe("rouge");
    expect(alerte.dedup_key).toBe("m96:2026:531000:caisse");
    expect(alerte.establishment_id).toBe("etab-1");
  });
});
