// Tests des moteurs métier (audit #3) — indicateurs REPROFI 4.6 (compte
// financier) et moteur Logements (décompte de charges, titres). Modules purs.
import { describe, it, expect } from "vitest";
import type { Balance } from "@/lib/compteFinancier/bilanFinancierEngine";
import {
  calculerReserves, calculerNonRecouvrement, calculerContentieux, calculerCAP,
  calculerVetuste, calculerDGP, calculerChargesFixes, calculerEndettement,
  calculerLiquidite, calculerIndependance, calculerTousIndicateursReprofi,
} from "@/lib/compteFinancier/reprofiIndicateursEngine";
import {
  consoCalcul, decompteAnnuel, indexInitialReporte, anneesReleves, montantTitre,
} from "@/lib/logements/engine";
import type { Logement, ReleveConso } from "@/lib/logements/types";

// Construit une balance à partir de {compte: [debit, credit]}.
const bal = (m: Record<string, [number, number]>): Balance =>
  Object.fromEntries(Object.entries(m).map(([k, [d, c]]) => [k, { solde_deb: d, solde_cred: c }]));

describe("REPROFI — taux de non-recouvrement", () => {
  it("classe en critique au-delà de 10 %", () => {
    const r = calculerNonRecouvrement(bal({ "411": [80000, 0], "416": [20000, 0] }));
    expect(r.valeur).toBe(20);
    expect(r.niveau).toBe("critique");
    expect(r.detail).toEqual({ creancesDouteuses: 20000, creancesTotales: 100000 });
  });
  it("balance vide → 0 % (aucune créance)", () => {
    expect(calculerNonRecouvrement(bal({})).valeur).toBe(0);
  });
});

describe("REPROFI — comptes d'attente (47)", () => {
  it("solde net > 50 000 € → critique", () => {
    expect(calculerCAP(bal({ "47": [60000, 0] })).niveau).toBe("critique");
  });
  it("solde net résiduel < 1 000 € → excellent", () => {
    const r = calculerCAP(bal({ "470": [800, 300] }));
    expect(r.valeur).toBe(500);
    expect(r.niveau).toBe("excellent");
  });
});

describe("REPROFI — vétusté du parc (amort 281 / brut 21)", () => {
  it("85 % amortis → critique, sans confondre 21 et 281", () => {
    const r = calculerVetuste(bal({ "21": [100000, 0], "281": [0, 85000] }));
    expect(r.valeur).toBe(85);
    expect(r.niveau).toBe("critique");
  });
});

describe("REPROFI — dépendance aux subventions (74 / 7)", () => {
  it("85 % de subventions → critique", () => {
    const r = calculerDGP(bal({ "74": [0, 85000], "706": [0, 15000] }));
    expect(r.valeur).toBe(85);
    expect(r.niveau).toBe("critique");
  });
});

describe("REPROFI — poids des charges fixes", () => {
  it("personnel 64 = 70 % des charges → fragile", () => {
    const r = calculerChargesFixes(bal({ "64": [70000, 0], "60": [30000, 0] }));
    expect(r.valeur).toBe(70);
    expect(r.niveau).toBe("fragile");
  });
});

describe("REPROFI — capacité d'endettement (années de CAF)", () => {
  it("10 ans de CAF → critique", () => {
    const r = calculerEndettement(bal({ "16": [0, 100000] }), 10000);
    expect(r.valeur).toBe(10);
    expect(r.niveau).toBe("critique");
  });
  it("CAF nulle avec dette → plafond 999 (critique)", () => {
    expect(calculerEndettement(bal({ "16": [0, 50000] }), 0).valeur).toBe(999);
  });
});

describe("REPROFI — liquidité immédiate", () => {
  it("disponibilités = 3× dettes court terme → excellent", () => {
    const r = calculerLiquidite(bal({ "51": [300000, 0], "40": [0, 100000] }));
    expect(r.valeur).toBe(3);
    expect(r.niveau).toBe("excellent");
  });
});

describe("REPROFI — indépendance financière", () => {
  it("capitaux propres = 95 % → excellent", () => {
    const r = calculerIndependance(bal({ "10": [0, 95000], "16": [0, 5000] }));
    expect(r.valeur).toBe(95);
    expect(r.niveau).toBe("excellent");
  });
});

describe("REPROFI — provisions pour contentieux (1511)", () => {
  it("provisions = 3 % des charges → fragile", () => {
    const r = calculerContentieux(bal({ "1511": [0, 3000], "60": [100000, 0] }));
    expect(r.valeur).toBe(3);
    expect(r.niveau).toBe("fragile");
  });
});

describe("REPROFI — réserves (5 rubriques 1068x)", () => {
  it("ventile les rubriques et isole 'autres'", () => {
    const r = calculerReserves(bal({
      "10681": [0, 1000], "10682": [0, 2000], "10683": [0, 3000],
      "10687": [0, 4000], "10688": [0, 500],
    }));
    expect(r.reservesSRH).toBe(1000);
    expect(r.reservesGenerales).toBe(2000);
    expect(r.reservesTaxeApprent).toBe(3000);
    expect(r.reservesAffectees).toBe(4000);
    expect(r.reservesAutres).toBe(500);
    expect(r.total).toBe(10500);
  });
});

describe("REPROFI — agrégateur", () => {
  it("retourne les 9 indicateurs + le détail réserves", () => {
    const panier = calculerTousIndicateursReprofi(bal({ "411": [1000, 0] }), 5000);
    expect(panier.indicateurs).toHaveLength(9);
    expect(panier.reserves.total).toBe(0);
  });
});

// ---------------------------------------------------------------------
// Moteur Logements
// ---------------------------------------------------------------------

const logement = (over: Partial<Logement> = {}): Logement => ({
  id: "L1", libelle: "Logement A", typeConcession: "COP", occupantNom: "Dupont",
  dateDebut: "2026-01-01", redevanceMensuelle: 400, provisionsChargesMensuelles: 100, ...over,
});
const releve = (over: Partial<ReleveConso> = {}): ReleveConso => ({
  id: "r1", logementId: "L1", annee: 2026, fluide: "eau",
  indexInitial: 100, indexFinal: 150, prixUnitaire: 2, ...over,
});

describe("Logements — calcul de consommation", () => {
  it("conso = index final − initial, montant = conso × prix", () => {
    expect(consoCalcul(releve())).toEqual({ fluide: "eau", conso: 50, montant: 100 });
  });
  it("index régressif (compteur remplacé) → conso plancher 0", () => {
    expect(consoCalcul(releve({ indexInitial: 200, indexFinal: 150 })).conso).toBe(0);
  });
});

describe("Logements — décompte annuel de charges", () => {
  it("régularisation = charges réelles − provisions appelées", () => {
    const releves = [
      releve({ fluide: "eau", indexInitial: 0, indexFinal: 500, prixUnitaire: 2 }),   // 1000 €
      releve({ id: "r2", fluide: "electricite", indexInitial: 0, indexFinal: 1000, prixUnitaire: 0.5 }), // 500 €
    ];
    const d = decompteAnnuel(logement(), releves, 2026);
    expect(d.chargesReelles).toBe(1500);
    expect(d.provisionsAppelees).toBe(1200); // 100 × 12
    expect(d.regularisation).toBe(300);      // solde à recouvrer
  });
  it("ignore les relevés d'un autre logement ou d'une autre année", () => {
    const releves = [
      releve({ id: "a", logementId: "L2" }),
      releve({ id: "b", annee: 2025 }),
    ];
    expect(decompteAnnuel(logement(), releves, 2026).chargesReelles).toBe(0);
  });
});

describe("Logements — report d'index N→N+1", () => {
  it("l'index final de N−1 devient l'initial de N", () => {
    const releves = [releve({ annee: 2025, indexFinal: 175 })];
    expect(indexInitialReporte(releves, "L1", "eau", 2026)).toBe(175);
    expect(indexInitialReporte(releves, "L1", "gaz", 2026)).toBeUndefined();
  });
});

describe("Logements — années présentes et titre exécutoire", () => {
  it("liste les années distinctes, triées décroissant", () => {
    const releves = [releve({ annee: 2024 }), releve({ id: "x", annee: 2026 }), releve({ id: "y", annee: 2024 })];
    expect(anneesReleves(releves, "L1")).toEqual([2026, 2024]);
  });
  it("montant du titre = (redevance + provisions) × mois", () => {
    expect(montantTitre(logement(), 6)).toEqual({ redevance: 2400, charges: 600, total: 3000 });
  });
});
