/**
 * Calendrier comptable annuel de l'agent comptable d'EPLE.
 *
 * Sources :
 *  - Instruction codificatrice M9-6 (calendrier comptable)
 *  - Code de l'éducation L.421-11 (vote du budget primitif avant le 1er nov.)
 *  - Code de l'éducation R.421-77 (compte financier)
 *  - Décret GBCP 2012-1246 (article 86 — compétences AC)
 *  - Circulaire DAF A3 (crédits sous condition d'emploi)
 *  - Ordonnance RGP 2022-408
 */

export interface JalonReglementaire {
  id: string;
  mois: number;            // 0-11
  jour?: number;           // 1-31, optionnel
  titre: string;
  description: string;
  reference: string;
  responsable: 'AC' | 'Ordonnateur' | 'CA' | 'SG' | 'AC+Ordonnateur';
  couleur: 'rouge' | 'orange' | 'jaune' | 'info' | 'success';
  obligatoire: boolean;
}

export const JALONS_REGLEMENTAIRES: JalonReglementaire[] = [
  // JANVIER
  {
    id: 'jan-cloture',
    mois: 0,
    titre: 'Clôture comptable N-1',
    description: 'Opérations de fin d\'exercice : PCA/CCA, reprise des résultats, écritures d\'inventaire.',
    reference: 'M9-6 tome 4 art. 4322',
    responsable: 'AC',
    couleur: 'rouge',
    obligatoire: true,
  },
  // FÉVRIER
  {
    id: 'fev-vote-cf',
    mois: 1,
    titre: 'Vote du compte financier N-1 en CA',
    description: 'Le compte financier de l\'exercice écoulé est présenté au conseil d\'administration.',
    reference: 'Code éducation R.421-77',
    responsable: 'CA',
    couleur: 'orange',
    obligatoire: true,
  },
  // MARS
  {
    id: 'mar-transmission-cf',
    mois: 2,
    titre: 'Transmission compte financier au rectorat',
    description: 'Le compte financier doit être transmis avant le 31 mai (échéance légale M9-6).',
    reference: 'M9-6 / R.421-77',
    responsable: 'AC',
    couleur: 'rouge',
    obligatoire: true,
  },
  // MAI
  {
    id: 'mai-crc',
    mois: 4,
    jour: 31,
    titre: 'Transmission CRC + collectivité de rattachement',
    description: 'Production des comptes à la chambre régionale des comptes et envoi à la collectivité de rattachement.',
    reference: 'CJF + M9-6',
    responsable: 'AC',
    couleur: 'rouge',
    obligatoire: true,
  },
  // JUIN
  {
    id: 'jun-dob',
    mois: 5,
    titre: 'Débat d\'orientation budgétaire (DOB)',
    description: 'Présentation des grandes orientations budgétaires pour le prochain exercice.',
    reference: 'GBCP 2012-1246',
    responsable: 'Ordonnateur',
    couleur: 'jaune',
    obligatoire: false,
  },
  // JUILLET
  {
    id: 'jul-fonds-sociaux',
    mois: 6,
    titre: 'Clôture exercice scolaire — bilans fonds sociaux',
    description: 'Bilan annuel d\'utilisation du fonds social lycéen et collégien.',
    reference: 'Circulaire DAF A3',
    responsable: 'AC+Ordonnateur',
    couleur: 'jaune',
    obligatoire: true,
  },
  // AOÛT
  {
    id: 'aout-rentree',
    mois: 7,
    titre: 'Préparation rentrée — paramétrage exercice',
    description: 'Mise à jour des effectifs prévisionnels, services, et préparation des actes de rentrée.',
    reference: 'M9-6',
    responsable: 'SG',
    couleur: 'info',
    obligatoire: false,
  },
  // AOÛT — RENTRÉE / ACCRÉDITATION / PASSATION / HABILITATIONS
  {
    id: 'aout-reception-pieces-chef',
    mois: 7,
    jour: 31,
    titre: 'Réception des documents du nouveau chef d\'établissement',
    description: 'En cas de changement d\'ordonnateur, l\'AC recueille auprès de chaque chef entrant : arrêté d\'affectation rectoral, copie pièce d\'identité, document d\'accréditation DRFiP, spécimen de signature. Sans ces pièces, l\'AC ne peut valider les actes d\'ordonnancement.',
    reference: 'GBCP art. 10 / Code éducation R.421-13',
    responsable: 'AC+Ordonnateur',
    couleur: 'rouge',
    obligatoire: true,
  },
  {
    id: 'aout-rappel-sgeple-mutation',
    mois: 7,
    jour: 25,
    titre: 'Rappel aux SGEPLE en mutation',
    description: 'En cas de mutation au 1er septembre, le SGEPLE sortant transfère son compte Chorus Pro au SGEPLE entrant et organise la passation de service.',
    reference: 'Code éducation R.421-13',
    responsable: 'AC',
    couleur: 'orange',
    obligatoire: true,
  },
  {
    id: 'aout-programmation-passations',
    mois: 7,
    jour: 28,
    titre: 'Programmation des passations de service',
    description: 'Planifier les passations SGEPLE entrants/sortants et les rendez-vous de remise de service.',
    reference: 'Code éducation R.421-13',
    responsable: 'AC+Ordonnateur',
    couleur: 'orange',
    obligatoire: true,
  },
  {
    id: 'aout-prep-rehabilitations-opale',
    mois: 7,
    jour: 30,
    titre: 'Préparation des ré-habilitations Op@le',
    description: 'Recenser les habilitations à révoquer (sortants) et à créer (entrants). Sphère ordonnateur habilitée par le chef d\'établissement, sphère comptable par l\'AC.',
    reference: 'GBCP art. 9 (séparation des fonctions)',
    responsable: 'AC+Ordonnateur',
    couleur: 'orange',
    obligatoire: true,
  },
  {
    id: 'aout-maj-organigramme-cicf',
    mois: 7,
    jour: 31,
    titre: 'Mise à jour de l\'organigramme fonctionnel CICF',
    description: 'Actualiser l\'organigramme et la cartographie des risques après mouvements de rentrée.',
    reference: 'CICF / instruction 06-031-A-B-M',
    responsable: 'AC',
    couleur: 'jaune',
    obligatoire: true,
  },
  // SEPTEMBRE
  {
    id: 'sep-validation-accreditations',
    mois: 8,
    jour: 7,
    titre: 'Validation des accréditations chefs d\'établissement entrants',
    description: 'L\'AC valide les pièces d\'accréditation reçues pour chaque ordonnateur entrant et débloque la signature des actes.',
    reference: 'GBCP art. 10 / instruction 06-031-A-B-M',
    responsable: 'AC',
    couleur: 'rouge',
    obligatoire: true,
  },
  {
    id: 'sep-revocation-habilitations-sortantes',
    mois: 8,
    jour: 7,
    titre: 'Révocation des habilitations Op@le sortantes',
    description: 'Révoquer les profils Op@le des agents sortis. Vérifier qu\'aucun accès n\'est laissé actif après le 31 août.',
    reference: 'RGPD / GBCP art. 9',
    responsable: 'AC+Ordonnateur',
    couleur: 'rouge',
    obligatoire: true,
  },
  {
    id: 'sep-creation-habilitations-entrantes',
    mois: 8,
    jour: 10,
    titre: 'Création des nouvelles habilitations Op@le',
    description: 'Activer les profils Op@le des agents entrants en respectant la séparation stricte sphère ordonnateur / sphère comptable.',
    reference: 'GBCP art. 9 / Op@le',
    responsable: 'AC+Ordonnateur',
    couleur: 'orange',
    obligatoire: true,
  },
  {
    id: 'sep-transmission-doc-habilitations',
    mois: 8,
    jour: 15,
    titre: 'Transmission du document d\'habilitations au rectorat',
    description: 'Génération du document récapitulatif consolidé des habilitations Op@le du groupement et mise à disposition du rectorat (vue consultant).',
    reference: 'Académie Guadeloupe / DPAE',
    responsable: 'AC',
    couleur: 'orange',
    obligatoire: true,
  },
  {
    id: 'sep-verif-chorus-pro',
    mois: 8,
    jour: 15,
    titre: 'Vérification des habilitations Chorus Pro',
    description: 'Contrôler que tous les utilisateurs Chorus Pro actifs sont bien en poste et que les transferts de compte sont effectifs.',
    reference: 'Décret facturation électronique',
    responsable: 'AC',
    couleur: 'jaune',
    obligatoire: true,
  },
  {
    id: 'sep-droits-constates',
    mois: 8,
    titre: 'Droits constatés DP / Modalités fonds sociaux / Régies',
    description: 'Ouverture année scolaire : droits constatés demi-pension, vote des modalités fonds sociaux, renouvellement régies.',
    reference: 'GBCP art. 22 / DAF A3',
    responsable: 'AC',
    couleur: 'orange',
    obligatoire: true,
  },
  // OCTOBRE
  {
    id: 'oct-bp-prep',
    mois: 9,
    titre: 'Préparation budget primitif',
    description: 'Élaboration du projet de budget primitif pour l\'exercice suivant.',
    reference: 'Code éducation L.421-11',
    responsable: 'Ordonnateur',
    couleur: 'orange',
    obligatoire: true,
  },
  // NOVEMBRE
  {
    id: 'nov-vote-bp',
    mois: 10,
    jour: 1,
    titre: 'Vote budget primitif (avant le 1er novembre)',
    description: 'Délai légal de vote du budget primitif fixé par le Code de l\'éducation.',
    reference: 'Code éducation L.421-11',
    responsable: 'CA',
    couleur: 'rouge',
    obligatoire: true,
  },
  // DÉCEMBRE
  {
    id: 'dec-cloture',
    mois: 11,
    jour: 31,
    titre: 'Clôture, inventaire, PV de caisse au 31/12',
    description: 'Inventaire physique, rapprochement bancaire final, procès-verbal de caisse au 31 décembre.',
    reference: 'M9-6 / GBCP art. 200',
    responsable: 'AC',
    couleur: 'rouge',
    obligatoire: true,
  },
];

export interface JalonInstancie extends JalonReglementaire {
  date: Date;
  joursRestants: number;
  passe: boolean;
}

/** Instancie les jalons sur l'année civile courante avec calcul jours restants. */
export function instancierJalons(today: Date = new Date()): JalonInstancie[] {
  const annee = today.getFullYear();
  return JALONS_REGLEMENTAIRES.map(j => {
    const jour = j.jour ?? 15;
    const date = new Date(annee, j.mois, jour);
    const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      ...j,
      date,
      joursRestants: diff,
      passe: diff < 0,
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Échéances dans les N prochains jours (par défaut 30). */
export function echeancesProchaines(n: number = 30, today: Date = new Date()): JalonInstancie[] {
  return instancierJalons(today).filter(j => j.joursRestants >= 0 && j.joursRestants <= n);
}

export const NIVEAU_ECHEANCE = (jours: number): 'rouge' | 'orange' | 'jaune' | 'info' => {
  if (jours < 7) return 'rouge';
  if (jours < 15) return 'orange';
  if (jours < 30) return 'jaune';
  return 'info';
};
