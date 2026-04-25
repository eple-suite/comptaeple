/**
 * Moteur d'anomalies M9-6 par compte unitaire.
 *
 * Pour chaque ligne de balance :
 *   1. Cherche le compte dans le référentiel (lookup exact, puis remontée
 *      par préfixe le plus long).
 *   2. Compare le sens réel au sens normal (en cours OU en clôture selon
 *      la période).
 *   3. Applique les règles complémentaires (RGP 2022-408, M9-6, etc.).
 *   4. Produit une liste d'anomalies typées + alertes candidates pour
 *      `alertes_transverses`.
 *
 * Pur (pas d'I/O) — testable par les scripts de recette Node.
 */

import type {
  BalanceLigne, CompteRef, NiveauAlerte, Periode, SensNormal,
} from './referentielTypes';
import { sensConforme, sensReel } from './referentielTypes';

export interface Anomalie {
  compte: string;
  libelle: string;
  solde: number;
  sens_reel: 'D' | 'C' | 'nul';
  sens_attendu: SensNormal;
  niveau: NiveauAlerte;
  message: string;
  cause: string;
  action: string;
  reference: string;
  regle: 'sens' | 'rgp' | 'cloture' | 'tresorerie' | 'caisse' | 'bourses' | 'liaison' | 'contrepartie';
}

export interface AlerteCandidate {
  module_origine: 'balance';
  niveau: 'rouge' | 'orange' | 'jaune' | 'info';
  titre: string;
  description: string;
  reference_reglementaire: string;
  dedup_key: string;
}

const NIVEAU_TO_COULEUR: Record<NiveauAlerte, 'rouge' | 'orange' | 'jaune' | 'info'> = {
  critique: 'rouge',
  majeure: 'orange',
  mineure: 'jaune',
  info: 'info',
};

/** Trouve le compte dans le référentiel : exact, puis préfixe le plus long. */
export function lookupCompte(compte: string, referentiel: CompteRef[]): CompteRef | null {
  const c = (compte || '').replace(/\s/g, '');
  if (!c) return null;
  // 1. Match exact
  const exact = referentiel.find((r) => r.compte === c);
  if (exact) return exact;
  // 2. Préfixe le plus long
  const matches = referentiel
    .filter((r) => c.startsWith(r.compte) || r.compte.startsWith(c.slice(0, 3)))
    .sort((a, b) => {
      // Préfixe partagé le plus long en tête
      const la = sharedPrefixLen(c, a.compte);
      const lb = sharedPrefixLen(c, b.compte);
      return lb - la;
    });
  return matches[0] || null;
}

function sharedPrefixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Détecte la période à partir de la date d'édition de la balance. */
export function detecterPeriode(dateEdition: Date | string | null | undefined): Periode {
  if (!dateEdition) return 'cours';
  const d = typeof dateEdition === 'string' ? new Date(dateEdition) : dateEdition;
  if (Number.isNaN(d.getTime())) return 'cours';
  // Décembre, janvier ou février → période de clôture (pose plus stricte)
  const m = d.getMonth() + 1;
  return m === 12 || m === 1 || m === 2 ? 'cloture' : 'cours';
}

/** Détecte si l'EPLE possède un budget annexe (présence d'un compte 1850xx miroir). */
export function aBudgetAnnexe(balance: BalanceLigne[]): boolean {
  return balance.some((l) => l.compte.startsWith('185') && Math.abs(l.solde) > 0.01);
}

/**
 * Analyse principale : produit la liste des anomalies pour une balance donnée.
 */
export function analyserBalance(
  balance: BalanceLigne[],
  referentiel: CompteRef[],
  options: { periode?: Periode; aBA?: boolean } = {},
): Anomalie[] {
  const periode = options.periode ?? 'cours';
  const hasBA = options.aBA ?? aBudgetAnnexe(balance);
  const out: Anomalie[] = [];

  // Cumul classes pour règles transverses
  const cumulCl4411 = balance
    .filter((l) => l.compte.startsWith('4411'))
    .reduce((s, l) => s + l.solde, 0);
  const cumulCl7 = balance
    .filter((l) => l.compte.startsWith('7'))
    .reduce((s, l) => s + Math.abs(l.solde), 0);

  for (const ligne of balance) {
    const c = ligne.compte;
    const reel = sensReel(ligne.solde);
    const ref = lookupCompte(c, referentiel);

    // ─── Règles complémentaires PRIORITAIRES (par compte exact) ─────
    // C/411X CRÉDITEUR → critique (RGP 2022-408 art. 11)
    if (/^411[2-3]/.test(c) && reel === 'C') {
      out.push(makeAnomalie(c, ligne, 'D', 'critique',
        'Trop-perçu famille (RGP 2022-408 art. 11) — émettre titre de remboursement',
        'Encaissement avant émission du titre ou sur-paiement',
        'Émettre titre de remboursement à la famille',
        'Ord. RGP 2022-408 art. 11', 'rgp'));
      continue;
    }
    // C/515900 DÉBITEUR → critique
    if (c === '515900' && reel === 'D') {
      out.push(makeAnomalie(c, ligne, 'C', 'critique',
        'Compte 515900 (placement) ne peut être débiteur — inversion D/C',
        'Inversion d\'écriture sur compte de placement',
        'Inverser l\'OD',
        'M9-6 T2 §5.159', 'tresorerie'));
      continue;
    }
    // C/515100 CRÉDITEUR → critique
    if (c === '515100' && reel === 'C') {
      out.push(makeAnomalie(c, ligne, 'D', 'critique',
        'Compte 515100 (Trésor courant) créditeur = trésorerie négative impossible',
        'Erreur d\'imputation ou découvert non justifié',
        'Vérifier extrait DFT et corriger imputation',
        'M9-6 T2 §5.151', 'tresorerie'));
      continue;
    }
    // C/531 CRÉDITEUR → critique
    if (/^531/.test(c) && reel === 'C') {
      out.push(makeAnomalie(c, ligne, 'D', 'critique',
        'Caisse 531 créditrice = caisse négative impossible',
        'Décaissement sans encaissement préalable',
        'Vérifier billetage et journal de caisse',
        'M9-6 T2 §5.31', 'caisse'));
      continue;
    }
    // C/467 NON NUL EN CLÔTURE → critique
    if (/^467/.test(c) && periode === 'cloture' && reel !== 'nul') {
      out.push(makeAnomalie(c, ligne, 'nul', 'critique',
        'Compte 467 NON NUL en clôture — apurement obligatoire',
        'Imputation manquante en attente',
        'Apurer avant le 31/12 par OD d\'imputation',
        'M9-6 T3 §4.67', 'cloture'));
      continue;
    }
    // C/47X NON NUL EN CLÔTURE → critique
    if (/^47[1-7]/.test(c) && periode === 'cloture' && reel !== 'nul') {
      out.push(makeAnomalie(c, ligne, 'nul', 'critique',
        `Compte ${c} NON NUL en clôture — apurement obligatoire`,
        'Encaissement/décaissement non imputé',
        'Apurer avant le 31/12',
        'M9-6 T3 §4.7x', 'cloture'));
      continue;
    }
    // C/443110 DÉBITEUR → critique (NON-DÉSPÉCIALISABLE)
    if (c === '443110' && reel === 'D') {
      out.push(makeAnomalie(c, ligne, 'C', 'critique',
        'Bourses 443110 DÉBITEUR — paiement bourses sans réception préalable de l\'avance État (compte NON-DÉSPÉCIALISABLE)',
        'Bourses payées avant versement de l\'avance académique',
        'Solliciter l\'avance académique en urgence',
        'M9-6 T2 §4.431', 'bourses'));
      continue;
    }

    // ─── Règle générique : sens normal vs réel ───────────────────────
    if (ref) {
      const attendu = periode === 'cloture' ? ref.sens_cloture : ref.sens_normal;
      if (!sensConforme(reel, attendu)) {
        out.push(makeAnomalie(c, ligne, attendu, ref.niveau_alerte_si_anormal,
          ref.message_alerte || `Sens anormal : ${reel} attendu ${attendu}`,
          ref.cause_probable,
          ref.action_corrective,
          ref.reference_m96, 'sens'));
      }
    }
  }

  // ─── Règle transverse : C/185000 ≠ miroir BA ────────────────────────
  const c185 = balance.find((l) => l.compte === '185000');
  if (c185 && hasBA && Math.abs(c185.solde) > 0.01) {
    // En l'absence de la balance miroir BA, on signale une majeure de vigilance
    out.push(makeAnomalie('185000',
      { compte: '185000', libelle: 'Liaison BP/BA', debit: c185.debit, credit: c185.credit, solde: c185.solde },
      'variable', 'majeure',
      'Compte 185000 doit refléter exactement le miroir du budget annexe',
      'Discordance possible entre sphères BP et BA',
      'Réconcilier les écritures de liaison',
      'M9-6 T1 §1.85', 'liaison'));
  }

  // ─── Règle transverse : Σ 4411X (créances) sans contrepartie 7 ────
  if (Math.abs(cumulCl4411) > 1000 && cumulCl7 < Math.abs(cumulCl4411) * 0.1) {
    out.push(makeAnomalie('4411',
      { compte: '4411', libelle: 'Cumul créances État', debit: 0, credit: 0, solde: cumulCl4411 },
      'D_ou_nul', 'mineure',
      'Créances État cumulées (4411X) sans contrepartie suffisante en classe 7',
      'Subventions notifiées mais pas encore enregistrées en produit',
      'Vérifier les écritures de produits liées aux subventions à recevoir',
      'M9-6 T2 §4.41', 'contrepartie'));
  }

  return out;
}

function makeAnomalie(
  compte: string, ligne: BalanceLigne, attendu: SensNormal,
  niveau: NiveauAlerte, message: string, cause: string, action: string,
  reference: string, regle: Anomalie['regle'],
): Anomalie {
  return {
    compte,
    libelle: ligne.libelle || compte,
    solde: ligne.solde,
    sens_reel: sensReel(ligne.solde),
    sens_attendu: attendu,
    niveau,
    message,
    cause,
    action,
    reference,
    regle,
  };
}

/** Convertit les anomalies en alertes candidates pour `alertes_transverses`. */
export function anomaliesVersAlertes(
  anomalies: Anomalie[], establishmentId: string, year: number,
): Array<AlerteCandidate & { establishment_id: string }> {
  return anomalies.map((a) => ({
    module_origine: 'balance' as const,
    establishment_id: establishmentId,
    niveau: NIVEAU_TO_COULEUR[a.niveau],
    titre: `${a.compte} — ${a.libelle}`,
    description: `${a.message}. Solde ${a.solde.toFixed(2)} € (sens ${a.sens_reel}, attendu ${a.sens_attendu}). Action : ${a.action}.`,
    reference_reglementaire: a.reference,
    dedup_key: `m96:${year}:${a.compte}:${a.regle}`,
  }));
}

/** Stats agrégées pour le dashboard (KPI critiques / majeures / mineures). */
export function statsAnomalies(anomalies: Anomalie[]): {
  total: number; critiques: number; majeures: number; mineures: number; infos: number;
  scoreRisque: number; // 0-100
} {
  const c = anomalies.filter((a) => a.niveau === 'critique').length;
  const m = anomalies.filter((a) => a.niveau === 'majeure').length;
  const mi = anomalies.filter((a) => a.niveau === 'mineure').length;
  const i = anomalies.filter((a) => a.niveau === 'info').length;
  // Score de risque : pondération critique×20, majeure×8, mineure×3, info×1, plafond 100
  const score = Math.min(100, c * 20 + m * 8 + mi * 3 + i);
  return { total: anomalies.length, critiques: c, majeures: m, mineures: mi, infos: i, scoreRisque: score };
}