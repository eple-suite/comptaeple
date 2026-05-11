// ════════════════════════════════════════════════════════════════
// Transformation des alertes en recommandations actionnables
// (action concrète + check-list + étape du wizard à corriger)
// ════════════════════════════════════════════════════════════════
import type { CategorieAlerte } from "./alertesEngine";

export interface Recommandation {
  /** Action principale à mener (verbe d'action). */
  action: string;
  /** Cases à cocher : sous-tâches concrètes. */
  checklist: string[];
  /** Numéro de l'étape du wizard concernée (1..9). */
  step?: number;
  /** Libellé court du champ ciblé (pour le bouton « Aller au champ »). */
  champLabel?: string;
}

export const RECOMMANDATIONS: Record<CategorieAlerte, Recommandation> = {
  ca_manquant: {
    action: "Faire délibérer le CA avant tout engagement de dépense.",
    checklist: [
      "Inscrire le voyage à l'ordre du jour du prochain CA",
      "Préparer la note de présentation (objectifs, budget, financement)",
      "Renseigner la date de délibération une fois le CA tenu",
    ],
    step: 7,
    champLabel: "Date d'autorisation CA",
  },
  delai_ca: {
    action: "Sécuriser le caractère exécutoire de l'acte du CA.",
    checklist: [
      "Transmettre l'acte au rectorat / DSDEN",
      "Vérifier l'absence d'observation dans les 15 jours",
      "Conserver l'AR de transmission au dossier",
    ],
    step: 7,
    champLabel: "Date d'autorisation CA",
  },
  engagement_anticipe: {
    action: "Régulariser ou annuler l'engagement antérieur au CA.",
    checklist: [
      "Identifier la dépense engagée avant CA",
      "Documenter la régularisation (note au dossier)",
      "Mettre à jour la date de premier engagement",
    ],
    step: 5,
    champLabel: "Première dépense engagée",
  },
  budget_desequilibre: {
    action: "Rétablir l'équilibre recettes / dépenses (instruction M9-6).",
    checklist: [
      "Vérifier que toutes les recettes sécurisées sont saisies",
      "Réviser à la baisse les dépenses non engagées",
      "Mobiliser un complément (FSE, ressources propres) si besoin",
    ],
    step: 4,
    champLabel: "Recettes & dépenses",
  },
  recette_notifiee_sans_piece: {
    action: "Joindre la pièce justificative de la recette notifiée.",
    checklist: [
      "Récupérer la notification officielle du financeur",
      "Téléverser le PDF dans la fiche recette",
    ],
    step: 4,
    champLabel: "Recettes",
  },
  accompagnateurs_factures_familles: {
    action: "Isoler le coût accompagnateurs hors participation des familles.",
    checklist: [
      "Marquer la dépense comme « accompagnateur »",
      "Imputer sur subvention / ressources propres",
      "Ajuster le montant facturé aux familles en conséquence",
    ],
    step: 5,
    champLabel: "Dépenses accompagnateurs",
  },
  reste_a_charge_eleve: {
    action: "Réduire le reste à charge famille pour éviter l'éviction sociale.",
    checklist: [
      "Solliciter une aide complémentaire (région, département, FSE)",
      "Mobiliser le fonds social établissement pour les boursiers",
      "Étaler le paiement (échéancier)",
    ],
    step: 4,
    champLabel: "Budget global",
  },
  anti_discrimination_boursiers: {
    action: "Mobiliser les fonds sociaux pour les élèves boursiers.",
    checklist: [
      "Identifier les élèves boursiers non inscrits",
      "Proposer une aide individualisée (fonds social, ANCV)",
      "Tracer les sollicitations dans le dossier",
    ],
    step: 3,
    champLabel: "Participants",
  },
  marche_seuil_mapa: {
    action: "Lancer une procédure formalisée (CCP 2026).",
    checklist: [
      "Définir le besoin et rédiger le DCE",
      "Publier l'avis de marché sur la plateforme adéquate",
      "Recueillir au moins 3 offres et tracer le choix",
    ],
    step: 5,
    champLabel: "Dépenses",
  },
  fournisseur_seuil_12mois: {
    action: "Surveiller le cumul fournisseur sur 12 mois glissants.",
    checklist: [
      "Vérifier le cumul réel via la balance",
      "Anticiper la procédure si seuil approché",
    ],
    step: 5,
    champLabel: "Dépenses",
  },
  ligne_sans_devis: {
    action: "Joindre un devis pour la ligne de dépense > 5 000 € HT.",
    checklist: [
      "Demander le devis au fournisseur",
      "Téléverser le devis dans la fiche dépense",
    ],
    step: 5,
    champLabel: "Devis dépense",
  },
  etranger_sans_ariane: {
    action: "Inscrire le groupe sur Ariane (MEAE).",
    checklist: [
      "Créer la mission sur pastel.diplomatie.gouv.fr/fildariane",
      "Renseigner la liste des participants",
      "Cocher « Inscription Ariane » dans la fiche voyage",
    ],
    step: 1,
    champLabel: "Inscription Ariane",
  },
  voyage_sans_assurance_annulation: {
    action: "Souscrire une assurance annulation.",
    checklist: [
      "Demander un devis assurance annulation à l'agence",
      "Faire approuver le surcoût par le chef d'établissement",
      "Cocher « Assurance annulation souscrite »",
    ],
    step: 6,
    champLabel: "Assurance annulation",
  },
  cautionnement_post_rgp: {
    action: "Mettre à jour l'acte de régie (suppression du cautionnement).",
    checklist: [
      "Modifier la délibération régie",
      "Substituer la mention par « indemnité de maniement de fonds »",
      "Soumettre l'acte au CA pour approbation",
    ],
    step: 7,
    champLabel: "Acte régie",
  },
  famille_impaye: {
    action: "Relancer la famille et émettre un titre exécutoire si nécessaire.",
    checklist: [
      "Envoyer une relance écrite (LRAR conseillée)",
      "Mettre à jour la date de dernière relance",
      "Saisir l'agent comptable pour titre exécutoire le cas échéant",
    ],
    step: 3,
    champLabel: "Participants — paiements",
  },
  passeport_expirant: {
    action: "Demander un renouvellement de passeport avant le départ.",
    checklist: [
      "Informer la famille (délai mairie / préfecture)",
      "Conserver une copie du nouveau passeport au dossier",
    ],
    step: 3,
    champLabel: "Participants — passeport",
  },
  regle_8_euros: {
    action: "Vérifier le respect du seuil de 8 € de don tacite.",
    checklist: [
      "Recalculer la différence recettes / dépenses par élève",
      "Documenter la décision en CA si > 8 €",
    ],
    step: 4,
    champLabel: "Budget global",
  },
};

export function getRecommandation(cat: CategorieAlerte): Recommandation {
  return (
    RECOMMANDATIONS[cat] || {
      action: "Vérifier le point signalé et documenter la correction.",
      checklist: ["Analyser l'alerte", "Apporter la correction", "Tracer dans le dossier"],
    }
  );
}