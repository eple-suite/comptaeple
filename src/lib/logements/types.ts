// Module Logements de fonction — modèle métier.
// Concession (NAS / COP / COG), redevance, registre des consommations,
// décompte de charges, titre exécutoire. Réf. CGPPP R.2124-65 s.,
// décret 2012-752, Code de l'éducation R.216-4 à R.216-19.

export type TypeConcession =
  | "NAS"   // Nécessité absolue de service (logement gratuit, avantage en nature)
  | "COP"   // Convention d'occupation précaire avec astreinte (redevance avec abattement)
  | "COG";  // Convention d'occupation à titre onéreux / gratuit (selon délibération)

export const CONCESSION_LABELS: Record<TypeConcession, string> = {
  NAS: "Nécessité absolue de service (NAS)",
  COP: "Convention d'occupation précaire avec astreinte (COP)",
  COG: "Convention d'occupation (COG)",
};

export type Fluide = "eau" | "electricite" | "gaz" | "chauffage";
export const FLUIDES: Fluide[] = ["eau", "electricite", "gaz", "chauffage"];
export const FLUIDE_LABELS: Record<Fluide, string> = {
  eau: "Eau (m³)", electricite: "Électricité (kWh)", gaz: "Gaz (kWh)", chauffage: "Chauffage",
};

export interface Logement {
  id: string;
  etablissementId?: string;
  libelle: string;                  // ex. « Logement A — Loge »
  adresse?: string;
  surface?: number;                 // m²
  typeConcession: TypeConcession;
  occupantNom: string;
  occupantFonction?: string;
  dateDebut: string;
  dateFin?: string;
  redevanceMensuelle: number;       // 0 pour NAS
  provisionsChargesMensuelles: number;
  majLe?: string;
}

export interface ReleveConso {
  id: string;
  logementId: string;
  annee: number;
  fluide: Fluide;
  indexInitial: number;
  indexFinal: number;
  prixUnitaire: number;             // €/unité
}

export interface ConsoCalcul {
  fluide: Fluide;
  conso: number;
  montant: number;
}

export interface DecompteCharges {
  annee: number;
  details: ConsoCalcul[];
  chargesReelles: number;
  provisionsAppelees: number;
  regularisation: number;           // > 0 = à recouvrer ; < 0 = à restituer
}
