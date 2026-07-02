// Tests moteur budgétaire voyages scolaires (audit #3) — règle d'or M9-6
// « Recettes = Dépenses » (zéro-profit sur les familles) et seuils de la
// commande publique. Module pur.
import { describe, it, expect } from "vitest";
import type { VoyageBudgetData } from "@/lib/voyageBudgetEngine";
import {
  validerEquilibreBudgetaire, calculerParticipationEquilibre,
  calculerCoutParParticipant, calculerResteApayer, cumulerSeuils, evaluerSeuilCCP,
} from "@/lib/voyageBudgetEngine";

const data = (over: Partial<VoyageBudgetData> = {}): VoyageBudgetData => ({
  nbEleves: 10, participationFamilles: 0, subventionCollectivite: 0, subventionEtat: 0,
  subventionAutre: 0, autofinancement: 0, transport: 0, hebergement: 0, restauration: 0,
  activites: 0, assurance: 0, divers: 0, ...over,
});

describe("Voyages — équilibre budgétaire (M9-6)", () => {
  it("budget équilibré → aucune erreur, participation suggérée par élève", () => {
    const v = validerEquilibreBudgetaire(data({ participationFamilles: 800, subventionCollectivite: 200, transport: 1000 }));
    expect(v.equilibre).toBe(true);
    expect(v.solde).toBe(0);
    expect(v.erreurs).toHaveLength(0);
    expect(v.participationSuggestion).toBe(80); // (1000 − 200) / 10
  });

  it("excédent → erreur (profit interdit sur les familles)", () => {
    const v = validerEquilibreBudgetaire(data({ participationFamilles: 1000, subventionCollectivite: 200, transport: 1000 }));
    expect(v.equilibre).toBe(false);
    expect(v.solde).toBe(200);
    expect(v.erreurs.some((e) => /Excédent/.test(e))).toBe(true);
  });

  it("déficit → avertissement (charge sur FDR), pas d'erreur", () => {
    const v = validerEquilibreBudgetaire(data({ participationFamilles: 500, transport: 1000 }));
    expect(v.solde).toBe(-500);
    expect(v.erreurs).toHaveLength(0);
    expect(v.avertissements.some((a) => /Déficit/.test(a))).toBe(true);
  });

  it("participation > coût réel → erreur zero_profit", () => {
    const v = validerEquilibreBudgetaire(data({ participationFamilles: 1200, transport: 1000 }));
    expect(v.erreurs.some((e) => /zero_profit/.test(e))).toBe(true);
  });

  it("régie d'avances > 15 % du budget → avertissement", () => {
    const v = validerEquilibreBudgetaire(data({ participationFamilles: 1000, transport: 800, regieAvances: 200 }));
    expect(v.avertissements.some((a) => /15%/.test(a))).toBe(true);
  });
});

describe("Voyages — participation et coût par participant", () => {
  it("participation d'équilibre = reste à financer / (élèves + accompagnateurs)", () => {
    const p = calculerParticipationEquilibre(data({ nbEleves: 8, nbAccompagnateurs: 2, subventionCollectivite: 200, transport: 1000 }));
    expect(p).toBe(80); // (1000 − 200) / 10
  });

  it("coût par participant réparti élèves + accompagnateurs", () => {
    const r = calculerCoutParParticipant(data({ nbEleves: 8, nbAccompagnateurs: 2, participationFamilles: 640, transport: 1000 }));
    expect(r.totalParticipants).toBe(10);
    expect(r.coutParParticipant).toBe(100);
    expect(r.partFamilles).toBe(80);            // 640 / 8
    expect(r.partEtablissementAccomp).toBe(200); // 100 × 2 accompagnateurs
  });
});

describe("Voyages — fonds social et cumuls", () => {
  it("reste à payer déduit le fonds social, plancher à 0", () => {
    expect(calculerResteApayer(100, 30, 20)).toBe(50);
    expect(calculerResteApayer(100, 90, 50)).toBe(0);
  });

  it("cumule les dépenses par catégorie sur l'exercice", () => {
    const c = cumulerSeuils([
      data({ transport: 1000, hebergement: 500 }),
      data({ transport: 2000, activites: 300 }),
    ]);
    expect(c.transport).toBe(3000);
    expect(c.hebergement).toBe(500);
    expect(c.activites).toBe(300);
  });
});

describe("Voyages — seuils de la commande publique", () => {
  it("classe selon les paliers réglementaires", () => {
    expect(evaluerSeuilCCP(10000).niveau).toBe("ok");
    expect(evaluerSeuilCCP(40000).niveau).toBe("warning");
    expect(evaluerSeuilCCP(90000).niveau).toBe("danger");
    expect(evaluerSeuilCCP(216000).niveau).toBe("critical");
  });
});
