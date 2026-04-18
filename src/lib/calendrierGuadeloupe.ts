/**
 * Calendrier scolaire Guadeloupe (zone Caraïbes / Académie de Guadeloupe)
 * Référence : calendrier officiel 2024-2025 / 2025-2026 / 2026-2027
 *
 * Service de restauration : lundi → vendredi hors vacances et fériés.
 * Utilisé par le module Crédit Nourriture pour projeter les jours de service restants.
 */

export interface PeriodeVacances {
  nom: string;
  debut: string; // YYYY-MM-DD inclus
  fin: string;   // YYYY-MM-DD inclus
}

export interface AnneeScolaire {
  label: string;
  rentree: string;      // YYYY-MM-DD
  finAnnee: string;     // YYYY-MM-DD (fin officielle des cours)
  vacances: PeriodeVacances[];
  feriesSupplementaires: string[]; // YYYY-MM-DD (fériés locaux/nationaux)
}

/**
 * Calendriers consolidés par année scolaire.
 * Sources : académie de Guadeloupe, BO Éducation nationale.
 */
export const CALENDRIERS_GUADELOUPE: Record<string, AnneeScolaire> = {
  '2024-2025': {
    label: '2024-2025',
    rentree: '2024-09-02',
    finAnnee: '2025-07-04',
    vacances: [
      { nom: 'Toussaint', debut: '2024-10-19', fin: '2024-11-03' },
      { nom: 'Noël', debut: '2024-12-21', fin: '2025-01-05' },
      { nom: 'Carnaval', debut: '2025-02-22', fin: '2025-03-09' },
      { nom: 'Pâques', debut: '2025-04-12', fin: '2025-04-27' },
      { nom: 'Été', debut: '2025-07-05', fin: '2025-08-31' },
    ],
    feriesSupplementaires: [
      '2024-11-01', // Toussaint
      '2024-11-11', // Armistice
      '2024-12-25', // Noël
      '2025-01-01', // Jour de l'an
      '2025-04-18', // Vendredi saint (Antilles)
      '2025-04-21', // Lundi de Pâques
      '2025-05-01', // Fête du travail
      '2025-05-08', // Victoire 1945
      '2025-05-27', // Abolition esclavage Guadeloupe
      '2025-05-29', // Ascension
      '2025-06-09', // Lundi de Pentecôte
      '2025-07-14', // Fête nationale
    ],
  },
  '2025-2026': {
    label: '2025-2026',
    rentree: '2025-09-01',
    finAnnee: '2026-07-03',
    vacances: [
      { nom: 'Toussaint', debut: '2025-10-18', fin: '2025-11-02' },
      { nom: 'Noël', debut: '2025-12-20', fin: '2026-01-04' },
      { nom: 'Carnaval', debut: '2026-02-14', fin: '2026-03-01' },
      { nom: 'Pâques', debut: '2026-04-04', fin: '2026-04-19' },
      { nom: 'Été', debut: '2026-07-04', fin: '2026-08-31' },
    ],
    feriesSupplementaires: [
      '2025-11-01',
      '2025-11-11',
      '2025-12-25',
      '2026-01-01',
      '2026-04-03', // Vendredi saint
      '2026-04-06', // Lundi de Pâques
      '2026-05-01',
      '2026-05-08',
      '2026-05-14', // Ascension
      '2026-05-25', // Lundi de Pentecôte
      '2026-05-27', // Abolition esclavage
      '2026-07-14',
    ],
  },
  '2026-2027': {
    label: '2026-2027',
    rentree: '2026-09-01',
    finAnnee: '2027-07-02',
    vacances: [
      { nom: 'Toussaint', debut: '2026-10-17', fin: '2026-11-01' },
      { nom: 'Noël', debut: '2026-12-19', fin: '2027-01-03' },
      { nom: 'Carnaval', debut: '2027-02-06', fin: '2027-02-21' },
      { nom: 'Pâques', debut: '2027-03-27', fin: '2027-04-11' },
      { nom: 'Été', debut: '2027-07-03', fin: '2027-08-31' },
    ],
    feriesSupplementaires: [
      '2026-11-01',
      '2026-11-11',
      '2026-12-25',
      '2027-01-01',
      '2027-03-26', // Vendredi saint
      '2027-03-29', // Lundi de Pâques
      '2027-05-01',
      '2027-05-06', // Ascension
      '2027-05-08',
      '2027-05-17', // Lundi de Pentecôte
      '2027-05-27', // Abolition esclavage
      '2027-07-14',
    ],
  },
};

/** Retourne l'année scolaire correspondant à une date donnée (rentrée sept → août). */
export function detecterAnneeScolaire(date: Date = new Date()): string {
  const annee = date.getFullYear();
  const mois = date.getMonth(); // 0-indexed
  // Avant septembre → année scolaire commence l'année précédente
  return mois < 8 ? `${annee - 1}-${annee}` : `${annee}-${annee + 1}`;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseIso(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/** Indique si une date donnée est un jour de service (lun-ven hors vacances/fériés). */
export function estJourDeService(date: Date, anneeScolaire?: string): boolean {
  const cal = CALENDRIERS_GUADELOUPE[anneeScolaire ?? detecterAnneeScolaire(date)];
  if (!cal) return false;

  const jour = date.getDay(); // 0=dim, 6=sam
  if (jour === 0 || jour === 6) return false;

  const iso = toIsoDate(date);

  // Hors période scolaire ?
  if (iso < cal.rentree || iso > cal.finAnnee) return false;

  // Vacances ?
  for (const v of cal.vacances) {
    if (iso >= v.debut && iso <= v.fin) return false;
  }

  // Férié ?
  if (cal.feriesSupplementaires.includes(iso)) return false;

  return true;
}

/** Compte les jours de service entre deux dates (incluses). */
export function compterJoursService(debut: Date, fin: Date, anneeScolaire?: string): number {
  if (debut > fin) return 0;
  const annee = anneeScolaire ?? detecterAnneeScolaire(debut);
  let count = 0;
  const cur = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate());
  const end = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
  while (cur <= end) {
    if (estJourDeService(cur, annee)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export interface BilanJoursService {
  anneeScolaire: string;
  dateRentree: string;
  dateFin: string;
  joursTotalAnnee: number;
  joursEcoules: number;
  joursRestants: number;
  pourcentageEcoule: number;
  prochainJourService: string | null;
  prochaineVacances: PeriodeVacances | null;
}

/** Bilan complet à la date du jour pour le module Crédit Nourriture. */
export function bilanJoursService(today: Date = new Date()): BilanJoursService {
  const anneeScolaire = detecterAnneeScolaire(today);
  const cal = CALENDRIERS_GUADELOUPE[anneeScolaire];
  if (!cal) {
    return {
      anneeScolaire,
      dateRentree: '',
      dateFin: '',
      joursTotalAnnee: 0,
      joursEcoules: 0,
      joursRestants: 0,
      pourcentageEcoule: 0,
      prochainJourService: null,
      prochaineVacances: null,
    };
  }

  const rentree = parseIso(cal.rentree);
  const fin = parseIso(cal.finAnnee);
  const todayClamp = today < rentree ? rentree : today > fin ? fin : today;

  const joursTotalAnnee = compterJoursService(rentree, fin, anneeScolaire);
  const joursEcoules = compterJoursService(rentree, todayClamp, anneeScolaire);
  const joursRestants = Math.max(0, joursTotalAnnee - joursEcoules);
  const pourcentageEcoule = joursTotalAnnee > 0 ? (joursEcoules / joursTotalAnnee) * 100 : 0;

  // Prochain jour de service
  let prochainJourService: string | null = null;
  const probe = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  for (let i = 0; i < 60; i++) {
    if (estJourDeService(probe, anneeScolaire)) {
      prochainJourService = toIsoDate(probe);
      break;
    }
    probe.setDate(probe.getDate() + 1);
  }

  // Prochaines vacances
  const todayIso = toIsoDate(today);
  const prochaineVacances = cal.vacances.find(v => v.debut > todayIso) ?? null;

  return {
    anneeScolaire,
    dateRentree: cal.rentree,
    dateFin: cal.finAnnee,
    joursTotalAnnee,
    joursEcoules,
    joursRestants,
    pourcentageEcoule,
    prochainJourService,
    prochaineVacances,
  };
}
