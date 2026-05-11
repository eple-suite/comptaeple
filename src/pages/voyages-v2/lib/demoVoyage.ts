// ════════════════════════════════════════════════════════════════
// Mode démonstration — voyage exemple pré-rempli (Barcelone)
// Données fictives, jamais sauvegardées sans action explicite.
// ════════════════════════════════════════════════════════════════
import type { VoyageRecette, VoyageDepense } from "../types";
import type { VoyageDraft } from "../hooks/useVoyageV2";

function dateOffset(j: number): string {
  const d = new Date();
  d.setDate(d.getDate() + j);
  return d.toISOString().slice(0, 10);
}

export function buildDemoDraft(): VoyageDraft {
  return {
    reference_interne: "VS-DEMO-BARCELONE",
    libelle: "Voyage pédagogique — Barcelone (démonstration)",
    destination_ville: "Barcelone",
    destination_pays: "Espagne",
    type_sortie: "voyage_nuitees",
    caractere: "facultatif",
    type_projet: "cle_en_main",
    date_depart: dateOffset(75),
    date_retour: dateOffset(80),
    nombre_nuitees: 5,
    classes_concernees: ["3A", "3B"],
    nb_eleves_prevus: 48,
    nb_accompagnateurs_prevus: 4,
    responsable_pedago_nom: "Mme Dupont (démo)",
    lien_projet_etablissement: "Axe 2 — Ouverture européenne et linguistique",
    rattachement_adage: true,
    statut: "projet",
    date_ca_principe: dateOffset(-30),
    numero_acte_ca_principe: "CA-2026-014",
    date_ca_budget: dateOffset(-10),
    numero_acte_ca_budget: "CA-2026-027",
    montant_total_ht: 17500,
    montant_total_ttc: 19200,
    devise: "EUR",
    agence_nom: "EuroVoyages SAS (démo)",
    agence_siret: "12345678900012",
    agence_garantie: "APST n°123",
    conditions_annulation: [],
    erasmus_subvention_notifiee: 0,
    erasmus_avance_recue: 0,
    erasmus_taux_cofi: 0,
    tags_pedago: ["linguistique", "culturel"],
    wizard_step: 1,
    wizard_completed: false,
  };
}

export function buildDemoRecettes(): Partial<VoyageRecette>[] {
  return [
    { libelle: "Participation des familles", nature: "famille", montant: 14400, statut_financeur: "demandee", imputation_compte: "C/70881" },
    { libelle: "Subvention Région", nature: "subv_region", montant: 3000, statut_financeur: "notifiee", imputation_compte: "C/7442" },
    { libelle: "FSE / coopérative", nature: "don_fse", montant: 1800, statut_financeur: "promesse", imputation_compte: "C/7588" },
  ];
}

export function buildDemoDepenses(): Partial<VoyageDepense>[] {
  return [
    { poste: "transport", libelle: "Transport bus aller-retour", fournisseur: "TransAuto SARL", montant_ht: 6500, taux_tva: 10, montant_ttc: 7150, compte_charge: "C/6245" },
    { poste: "hebergement", libelle: "Hébergement 5 nuits (½ pension)", fournisseur: "EuroVoyages SAS", montant_ht: 8000, taux_tva: 10, montant_ttc: 8800, compte_charge: "C/6258" },
    { poste: "activites", libelle: "Visites guidées et activités", fournisseur: "EuroVoyages SAS", montant_ht: 2500, taux_tva: 20, montant_ttc: 3000, compte_charge: "C/6257" },
    { poste: "assurance", libelle: "Assurance assistance/rapatriement", fournisseur: "Mutuelle XYZ", montant_ht: 250, taux_tva: 0, montant_ttc: 250, compte_charge: "C/616" },
  ];
}