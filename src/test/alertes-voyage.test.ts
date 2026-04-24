import { describe, it, expect } from "vitest";
import { evaluerAlertesVoyage } from "@/pages/voyages-v2/lib/alertesEngine";

function dateOffset(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

describe("Moteur d'alertes voyages — A.3", () => {
  it("Délai CA → départ < 30 jours : alerte ROUGE bloquante", () => {
    const a = evaluerAlertesVoyage({
      date_depart: dateOffset(15),
      date_ca_autorisation: dateOffset(0),
    });
    const al = a.find((x) => x.categorie === "delai_ca");
    expect(al).toBeDefined();
    expect(al!.niveau).toBe("rouge");
    expect(al!.bloquant).toBe(true);
  });

  it("Engagement antérieur au CA : alerte ROUGE bloquante", () => {
    const a = evaluerAlertesVoyage({
      date_depart: dateOffset(120),
      date_ca_autorisation: dateOffset(-30),
      date_premier_engagement: dateOffset(-60),
    });
    const al = a.find((x) => x.categorie === "engagement_anticipe");
    expect(al).toBeDefined();
    expect(al!.niveau).toBe("rouge");
  });

  it("Date départ sans CA : alerte ROUGE 'CA manquant'", () => {
    const a = evaluerAlertesVoyage({
      date_depart: dateOffset(60),
      date_ca_autorisation: null,
    });
    const al = a.find((x) => x.categorie === "ca_manquant");
    expect(al).toBeDefined();
    expect(al!.niveau).toBe("rouge");
  });

  it("Délai CA ≥ 90 jours : aucune alerte délai_ca", () => {
    const a = evaluerAlertesVoyage({
      date_depart: dateOffset(120),
      date_ca_autorisation: dateOffset(0),
    });
    expect(a.find((x) => x.categorie === "delai_ca")).toBeUndefined();
  });

  it("Budget déséquilibré : alerte ROUGE bloquante", () => {
    const a = evaluerAlertesVoyage({
      total_recettes_secured: 5000,
      total_depenses: 6000,
    });
    const al = a.find((x) => x.categorie === "budget_desequilibre");
    expect(al).toBeDefined();
    expect(al!.bloquant).toBe(true);
  });

  it("Accompagnateurs sur famille : ROUGE bloquant", () => {
    const a = evaluerAlertesVoyage({
      depenses: [{ libelle: "Hôtel accomp.", poste: "hebergement", est_accompagnateur: true }],
    });
    expect(a.find((x) => x.categorie === "accompagnateurs_factures_familles")).toBeDefined();
  });

  it("Étranger sans Ariane : ORANGE", () => {
    const a = evaluerAlertesVoyage({
      destination_pays: "Espagne",
      inscription_ariane: false,
    });
    const al = a.find((x) => x.categorie === "etranger_sans_ariane");
    expect(al).toBeDefined();
    expect(al!.niveau).toBe("orange");
  });
});