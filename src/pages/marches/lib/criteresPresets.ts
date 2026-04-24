import type { CritereAttribution, TypeMarche } from "../types";

export interface PresetCriteres {
  id: string;
  label: string;
  type: TypeMarche | "all";
  famille?: string; // si famille particulière
  criteres: CritereAttribution[];
}

export const PRESETS_CRITERES: PresetCriteres[] = [
  {
    id: "fournitures-courantes",
    label: "Fournitures courantes (60/40)",
    type: "fournitures",
    criteres: [
      { libelle: "Prix", ponderation: 60, description: "Note linéaire = (Prix offre la plus basse / Prix offre) × 60" },
      { libelle: "Valeur technique", ponderation: 40, description: "Qualité, conformité aux spécifications, délais de livraison" },
    ],
  },
  {
    id: "voyages-scolaires",
    label: "Voyages scolaires (40/30/20/10)",
    type: "services",
    famille: "S-VOY",
    criteres: [
      { libelle: "Prix", ponderation: 40 },
      { libelle: "Valeur pédagogique", ponderation: 30, description: "Programme, accompagnement, lieux visités" },
      { libelle: "Sécurité et garanties", ponderation: 20, description: "APS, assurances, plan B" },
      { libelle: "Délai de paiement", ponderation: 10, description: "Échéancier proposé" },
    ],
  },
  {
    id: "travaux-standard",
    label: "Travaux (50/20/30)",
    type: "travaux",
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Délais d'exécution", ponderation: 20 },
      { libelle: "Valeur technique", ponderation: 30, description: "Mémoire technique, références, garanties" },
    ],
  },
  {
    id: "prestations-intellectuelles",
    label: "Prestations intellectuelles (40/60)",
    type: "services",
    criteres: [
      { libelle: "Valeur technique", ponderation: 60, description: "Méthodologie, équipe, références" },
      { libelle: "Prix", ponderation: 40 },
    ],
  },
  {
    id: "restauration",
    label: "Restauration (40/30/20/10)",
    type: "services",
    famille: "S-REST",
    criteres: [
      { libelle: "Prix", ponderation: 40 },
      { libelle: "Valeur nutritionnelle / EGAlim", ponderation: 30, description: "Bio, local, durable, % conforme EGAlim" },
      { libelle: "Service et logistique", ponderation: 20 },
      { libelle: "Clause environnementale", ponderation: 10 },
    ],
  },
];

export function suggererPreset(type: TypeMarche, famille?: string): PresetCriteres {
  const exact = PRESETS_CRITERES.find((p) => p.famille === famille);
  if (exact) return exact;
  const byType = PRESETS_CRITERES.find((p) => p.type === type);
  return byType || PRESETS_CRITERES[0];
}
