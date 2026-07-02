// Tests moteur d'audit (audit #3) — table de décision de criticité (voyant) et
// scoring/cartographie/plan d'actions ancrés sur le référentiel réel.
import { describe, it, expect } from "vitest";
import type { AuditMission } from "@/lib/audit/types";
import { criticite, scoreMission, cartographie, planActionsAuto } from "@/lib/audit/engine";
import { controlesPourBudget } from "@/lib/audit/referentiel";

describe("criticite — escalade résultat × risque", () => {
  it("conforme / non évalué → conforme (voyant vert)", () => {
    expect(criticite("conforme", "critique")).toBe("conforme");
    expect(criticite("non_evalue", "critique")).toBe("conforme");
  });
  it("non vérifiable → vigilance", () => {
    expect(criticite("non_verifiable", "critique")).toBe("vigilance");
  });
  it("conforme avec réserve : important si risque élevé, sinon vigilance", () => {
    expect(criticite("conforme_reserve", "critique")).toBe("important");
    expect(criticite("conforme_reserve", "important")).toBe("important");
    expect(criticite("conforme_reserve", "moyen")).toBe("vigilance");
    expect(criticite("conforme_reserve", "faible")).toBe("vigilance");
  });
  it("non conforme : escalade selon le niveau de risque", () => {
    expect(criticite("non_conforme", "critique")).toBe("critique");
    expect(criticite("non_conforme", "important")).toBe("important");
    expect(criticite("non_conforme", "moyen")).toBe("important");
    expect(criticite("non_conforme", "faible")).toBe("vigilance");
  });
});

// Mission de test bâtie sur le référentiel réel (aucun id codé en dur).
const mission = (controles: AuditMission["controles"]): AuditMission => ({
  id: "m1", etablissementId: "e1", etablissementNom: "Lycée test", budgetType: "EPLE",
  campagne: 2026, statut: "en_cours", controles, actions: [], dateDebut: "2026-01-01",
});

describe("scoreMission — sur contrôles applicables EPLE", () => {
  const applicables = controlesPourBudget("EPLE");
  const c0 = applicables[0];

  it("un contrôle non conforme → taux de conformité 0 %", () => {
    const s = scoreMission(mission({ [c0.id]: { resultat: "non_conforme" } }));
    expect(s.total).toBe(applicables.length);
    expect(s.evalues).toBe(1);
    expect(s.nonConformes).toBe(1);
    expect(s.tauxConformite).toBe(0);
  });

  it("un contrôle conforme → taux de conformité 100 %", () => {
    const s = scoreMission(mission({ [c0.id]: { resultat: "conforme" } }));
    expect(s.conformes).toBe(1);
    expect(s.tauxConformite).toBe(100);
  });
});

describe("planActionsAuto — génère une action par anomalie", () => {
  const c0 = controlesPourBudget("EPLE")[0];

  it("reprend la recommandation saisie et la priorité = risque du contrôle", () => {
    const actions = planActionsAuto(mission({ [c0.id]: { resultat: "non_conforme", recommandation: "Régulariser sous 30 j" } }));
    expect(actions).toHaveLength(1);
    expect(actions[0].controleId).toBe(c0.id);
    expect(actions[0].libelle).toBe("Régulariser sous 30 j");
    expect(actions[0].priorite).toBe(c0.risque);
    expect(actions[0].etat).toBe("a_faire");
  });

  it("ignore les contrôles conformes", () => {
    expect(planActionsAuto(mission({ [c0.id]: { resultat: "conforme" } }))).toHaveLength(0);
  });
});

describe("cartographie — pire criticité par domaine", () => {
  const c0 = controlesPourBudget("EPLE")[0];
  it("remonte la criticité du contrôle non conforme sur son domaine", () => {
    const carto = cartographie(mission({ [c0.id]: { resultat: "non_conforme" } }));
    const entree = carto.find((d) => d.domaineId === c0.domaineId);
    expect(entree).toBeDefined();
    expect(entree!.criticite).toBe(criticite("non_conforme", c0.risque));
    expect(entree!.nbAnomalies).toBeGreaterThanOrEqual(1);
  });
});
