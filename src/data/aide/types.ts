export type Niveau = "debutant" | "confirme" | "expert" | "transverse";

export interface AideArticleSeed {
  slug: string;
  module: string;
  niveau: Niveau;
  titre: string;
  resume?: string;
  contenu_md: string;
  references_legales: string[];
  tags: string[];
  ordre: number;
}

export interface AideGlossaireSeed {
  terme: string;
  acronyme?: string;
  definition: string;
  references_legales: string[];
  voir_aussi: string[];
  modules: string[];
}

export interface AideModeleSeed {
  nom: string;
  module: string;
  type_doc: "acte" | "courrier" | "pv" | "arrete" | "convention" | "fiche" | "tableau" | "rapport";
  destinataire?: string;
  description?: string;
  references_legales: string[];
  tags: string[];
}

export interface AideFaqSeed {
  question: string;
  reponse: string;
  module: string;
  tags: string[];
}

export const MODULES = [
  { id: "cockpit", label: "Cockpit rectoral", icon: "LayoutDashboard" },
  { id: "parametres", label: "Paramètres (RH & Établissements)", icon: "Settings" },
  { id: "import", label: "Import des données", icon: "Upload" },
  { id: "balance", label: "Balance comptable", icon: "BarChart3" },
  { id: "compte-financier", label: "Compte financier", icon: "BookOpen" },
  { id: "marches", label: "Marchés publics", icon: "Gavel" },
  { id: "voyages", label: "Voyages scolaires", icon: "Bus" },
  { id: "fonds-sociaux", label: "Fonds sociaux", icon: "HandHeart" },
  { id: "enquetes", label: "Enquêtes rectorat", icon: "FileSpreadsheet" },
  { id: "entretiens", label: "Entretiens professionnels", icon: "UserCheck" },
  { id: "calendrier", label: "Calendrier comptable", icon: "Calendar" },
  { id: "transverse", label: "Transverse / Application", icon: "Globe" },
] as const;

export type ModuleId = typeof MODULES[number]["id"];