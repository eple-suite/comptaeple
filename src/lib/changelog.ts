// Source unique du changelog in-app (amélioration #24). Chaque lot livré ajoute
// une entrée ici → la page /nouveautes la reflète automatiquement.

export type NouveauteTag = "Fondations" | "Design" | "Métier" | "Documents" | "Sécurité";

export interface Nouveaute {
  tag: NouveauteTag;
  texte: string;
}

export interface Release {
  version: string;
  date: string; // ISO court (AAAA-MM-JJ)
  titre: string;
  nouveautes: Nouveaute[];
}

export const CHANGELOG: Release[] = [
  {
    version: "1.2.0",
    date: "2026-06-28",
    titre: "Fiabilité & performance des données",
    nouveautes: [
      { tag: "Fondations", texte: "Couche d'accès aux données unifiée et mise en cache : les listes (agents, fiches Op@le) se chargent plus vite et se rafraîchissent automatiquement après modification." },
      { tag: "Fondations", texte: "Tests automatisés des moteurs de calcul critiques (crédit nourriture, nomenclature M9-6) pour fiabiliser les chiffres." },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-28",
    titre: "Fondations & visibilité",
    nouveautes: [
      { tag: "Fondations", texte: "Filet de sécurité anti-crash : plus aucun écran blanc, un message de repli + bouton « Réessayer » remplace les erreurs (avec journalisation de l'incident)." },
      { tag: "Fondations", texte: "Composants d'état homogènes : chargements en squelette (anti-saut de mise en page), états vides explicites, états d'erreur avec relance." },
      { tag: "Design", texte: "Mode sombre activable depuis la barre supérieure (bascule clair/sombre persistée)." },
      { tag: "Design", texte: "Tableau de données unique réutilisable : tri par colonne, recherche, pagination et export CSV (BOM Excel FR)." },
      { tag: "Design", texte: "Nouvelle page « Système de design » (/design-system) documentant couleurs sémantiques, typographie et composants." },
      { tag: "Design", texte: "Nouvelle page « Nouveautés » (/nouveautes) : ce changelog, pour suivre chaque évolution livrée." },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-27",
    titre: "Persistance des modules existants",
    nouveautes: [
      { tag: "Métier", texte: "Régies & caisse : journal, billetage et modèles d'acte conservés entre les sessions." },
      { tag: "Métier", texte: "Crédit nourriture : paramètres du trimestre (effectifs SRH, repas, coûts) conservés." },
      { tag: "Métier", texte: "SATD : registre, tiers détenteurs, relances et dossiers de surendettement conservés." },
    ],
  },
];
