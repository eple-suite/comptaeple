// ════════════════════════════════════════════════════════════════
// Jeu de données fictif — Mode démonstration rectorat
// Scénario : EPLE globalement conforme + 4 points de vigilance
// ════════════════════════════════════════════════════════════════

export const DEMO_ETABLISSEMENT = {
  uai: "0DEMO123",
  nom: "Lycée Démonstration Rectorat",
  ville: "Académie de Démonstration",
  type: "lycee" as const,
  nb_eleves: 850,
  budget_annuel: 2_400_000,
  taux_boursiers: 0.28,
};

/** Points de vigilance pédagogiques mis en avant pour le rectorat. */
export const DEMO_POINTS_VIGILANCE = [
  {
    module: "Voyages scolaires",
    route: "/voyages-v2",
    niveau: "rouge" as const,
    titre: "Voyage Espagne — délai CA insuffisant",
    detail: "Délibération CA J+0, départ J+15 (< 30 j). L'acte n'est pas exécutoire.",
    reference: "Code éducation art. L.421-14",
  },
  {
    module: "HYPER@LE",
    route: "/hyperale",
    niveau: "orange" as const,
    titre: "DRFN à 94 jours",
    detail: "Délai de rotation des fonds de nourriture au-dessus du seuil prudentiel (90 j).",
    reference: "Instruction M9-6",
  },
  {
    module: "Compte financier",
    route: "/compte-financier",
    niveau: "orange" as const,
    titre: "SRH — marge négative -8 k€",
    detail: "Service de restauration et hébergement déficitaire. Sous-tarification cantine à expliquer en CA.",
    reference: "M9-6 / Pièce 14",
  },
  {
    module: "SATD",
    route: "/satd",
    niveau: "rouge" as const,
    titre: "1 procédure SATD dépassée 60 j sans relance",
    detail: "Avis à tiers détenteur émis il y a 67 jours, aucune relance tracée.",
    reference: "Procédure DDFiP",
  },
  {
    module: "Marchés publics",
    route: "/marches",
    niveau: "orange" as const,
    titre: "Cumul fournisseur transport 78 k€ /12 mois",
    detail: "87 % du seuil MAPA (90 k€ HT). Anticiper la procédure formalisée.",
    reference: "CCP 2026 art. R.2123-1",
  },
];

/** Demo-mode metadata par route. Affiché dans le bandeau de chaque module. */
export const DEMO_MODULE_HINTS: Record<string, { titre: string; pitch: string }> = {
  "/": {
    titre: "Tableau de bord — vue d'ensemble fictive",
    pitch: "850 élèves, budget 2,4 M€. 5 points de vigilance répartis sur 4 modules.",
  },
  "/voyages-v2": {
    titre: "Voyages — voyage Espagne fautif",
    pitch: "Démonstrez le moteur d'alertes A.3 (17 catégories) avec recommandations actionnables.",
  },
  "/voyages": {
    titre: "Voyages (v1) — données démo",
    pitch: "Vue historique. Préférez /voyages-v2 pour le pitch rectorat.",
  },
  "/hyperale": {
    titre: "HYPER@LE — analyse augmentée",
    pitch: "FDR 92 j (OK), DRFN 94 j (vigilance), trésorerie saine. Score d'alerte calibré.",
  },
  "/compte-financier": {
    titre: "Compte financier — REPROFI 4.6",
    pitch: "13 sections S1-S13. SRH déficitaire à commenter en page Annexe Comptable.",
  },
  "/balance": {
    titre: "Balance — anomalies M9-6",
    pitch: "2 anomalies mineures détectées : compte 408 non soldé, écart 4011/40171.",
  },
  "/satd": {
    titre: "SATD — gestion intelligente",
    pitch: "3 dossiers : 2 traités, 1 dépassé (alerte rouge). Scoring DDFiP automatique.",
  },
  "/marches": {
    titre: "Marchés publics — vigie seuils",
    pitch: "4 marchés actifs, dont 1 approchant le seuil MAPA. Saucissonnage détecté = non.",
  },
  "/entretiens": {
    titre: "Entretiens RH — campagne en cours",
    pitch: "8 fiches : 6 validées, 2 en retard. Export ESTEVE prêt.",
  },
  "/fonds-sociaux/v2": {
    titre: "Fonds sociaux — commission",
    pitch: "12 demandes, 1 dossier en attente d'avis CA. Tableau de bord anonymisé.",
  },
  "/enquetes-rectorat": {
    titre: "Enquêtes rectorat — partiellement remplies",
    pitch: "2 campagnes ouvertes. Wizard reliquats BOP et bourses SIECLE disponibles.",
  },
  "/regies": {
    titre: "Régies & caisse — post-RGP 2022-408",
    pitch: "Mention cautionnement obsolète détectée → indemnité de maniement de fonds.",
  },
  "/controle-interne": {
    titre: "Contrôle interne comptable",
    pitch: "Cartographie des risques + plan d'action démonstratif.",
  },
};

export function getDemoHint(pathname: string): { titre: string; pitch: string } | null {
  // Match exact, puis préfixe le plus long
  if (DEMO_MODULE_HINTS[pathname]) return DEMO_MODULE_HINTS[pathname];
  const match = Object.keys(DEMO_MODULE_HINTS)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? DEMO_MODULE_HINTS[match] : null;
}