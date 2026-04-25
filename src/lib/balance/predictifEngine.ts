/**
 * Moteur prédictif pour le module Balance.
 * 6 projections obligatoires (cahier des charges CRC) :
 *   1. Trajectoire comptes d'attente (467, 47x)
 *   2. Érosion de trésorerie (515100)
 *   3. Vieillissement créances familles (411x)
 *   4. Sous-consommation subventions fléchées (4411x vs charges)
 *   5. Déséquilibre SRH (706x DP vs 6021/611100)
 *   6. Projection résultat exercice (Σ7 − Σ6 annualisée)
 *
 * Prend en entrée 1 à 3 balances successives (N, N-1, N-2) sous forme de
 * snapshots datés. Sorties : projections + alertes prédictives.
 */

import type { BalanceLigne } from './referentielTypes';

export interface BalanceSnapshot {
  date: Date;       // date d'arrêté
  year: number;     // exercice
  lignes: BalanceLigne[];
}

export interface Projection {
  id: 'attente' | 'erosion_tresor' | 'creances_familles' | 'sous_conso_subv' | 'desequilibre_srh' | 'resultat_exercice';
  titre: string;
  niveau: 'rouge' | 'orange' | 'jaune' | 'info';
  valeur: number;
  unite: string;
  message: string;
  recommandation: string;
  reference: string;
  serie?: Array<{ date: string; valeur: number }>;
}

/** Régression linéaire simple. Renvoie la pente (€/jour). */
function pente(points: Array<{ x: number; y: number }>): number {
  const n = points.length;
  if (n < 2) return 0;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const num = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

function sommePref(b: BalanceLigne[], pref: string): number {
  return b.filter((l) => l.compte.startsWith(pref)).reduce((s, l) => s + l.solde, 0);
}
function sommeAbsPref(b: BalanceLigne[], pref: string): number {
  return b.filter((l) => l.compte.startsWith(pref)).reduce((s, l) => s + Math.abs(l.solde), 0);
}

// ─── PROJECTION 1 : TRAJECTOIRE COMPTES D'ATTENTE ─────────────────
export function projectionAttente(snaps: BalanceSnapshot[]): Projection {
  const serie = snaps.map((s) => ({
    date: s.date.toISOString().slice(0, 10),
    valeur: sommeAbsPref(s.lignes, '467') + sommeAbsPref(s.lignes, '471')
      + sommeAbsPref(s.lignes, '472') + sommeAbsPref(s.lignes, '473')
      + sommeAbsPref(s.lignes, '474') + sommeAbsPref(s.lignes, '475')
      + sommeAbsPref(s.lignes, '477'),
  }));
  const points = serie.map((p, i) => ({ x: i, y: p.valeur }));
  const m = pente(points);
  const dernier = serie[serie.length - 1]?.valeur ?? 0;
  const niveau: Projection['niveau'] = m > 1000 ? 'rouge' : m > 100 ? 'orange' : 'info';
  return {
    id: 'attente',
    titre: 'Trajectoire comptes d\'attente',
    niveau,
    valeur: dernier,
    unite: '€',
    message: m > 0
      ? `Croissance détectée (+${m.toFixed(0)} €/balance). Apurement obligatoire avant clôture (M9-6 T3).`
      : 'Trajectoire stable ou décroissante.',
    recommandation: m > 1000
      ? 'URGENT : engager apurement immédiat des comptes 467/47x avant nouvelle balance.'
      : 'Maintenir surveillance trimestrielle.',
    reference: 'M9-6 T3 §4.7x',
    serie,
  };
}

// ─── PROJECTION 2 : ÉROSION DE TRÉSORERIE ─────────────────────────
export function projectionErosion(
  snaps: BalanceSnapshot[],
  fonctionnementMensuel: number,
): Projection {
  const serie = snaps.map((s) => ({
    date: s.date.toISOString().slice(0, 10),
    valeur: sommePref(s.lignes, '5151'),
  }));
  const points = serie.map((p, i) => ({ x: i, y: p.valeur }));
  const m = pente(points); // €/balance
  const dernier = serie[serie.length - 1]?.valeur ?? 0;
  const seuil30j = fonctionnementMensuel; // 30 jours = 1 mois
  let moisAvantSeuil = Infinity;
  if (m < 0 && fonctionnementMensuel > 0) {
    // Estimation grossière : balance par balance ≈ 1 mois
    moisAvantSeuil = (dernier - seuil30j) / -m;
  }
  const niveau: Projection['niveau'] = moisAvantSeuil < 6 ? 'rouge' : moisAvantSeuil < 12 ? 'orange' : 'info';
  return {
    id: 'erosion_tresor',
    titre: 'Érosion de trésorerie (515100)',
    niveau,
    valeur: isFinite(moisAvantSeuil) ? moisAvantSeuil : 999,
    unite: 'mois avant seuil 30j',
    message: m < 0
      ? `Trésorerie en baisse (${m.toFixed(0)} €/balance). Seuil 30 jours atteint dans ~${isFinite(moisAvantSeuil) ? moisAvantSeuil.toFixed(1) : '∞'} mois.`
      : 'Trésorerie stable ou en hausse.',
    recommandation: niveau === 'rouge'
      ? 'URGENT : DBM, plan de trésorerie, gel des engagements non essentiels.'
      : 'Continuer le suivi mensuel.',
    reference: 'GBCP 2012-1246 art. 175',
    serie,
  };
}

// ─── PROJECTION 3 : VIEILLISSEMENT CRÉANCES FAMILLES ──────────────
export function projectionCreancesFamilles(snaps: BalanceSnapshot[]): Projection {
  const serie = snaps.map((s) => ({
    date: s.date.toISOString().slice(0, 10),
    valeur: sommePref(s.lignes, '4112') + sommePref(s.lignes, '4113'),
  }));
  const points = serie.map((p, i) => ({ x: i, y: p.valeur }));
  const m = pente(points);
  const dernier = serie[serie.length - 1]?.valeur ?? 0;
  const niveau: Projection['niveau'] = m > 500 ? 'rouge' : m > 0 ? 'orange' : 'info';
  return {
    id: 'creances_familles',
    titre: 'Vieillissement créances familles (411x)',
    niveau,
    valeur: dernier,
    unite: '€',
    message: m > 0
      ? `Créances en croissance (+${m.toFixed(0)} €/balance). Risque ANV croissant.`
      : 'Créances stables ou décroissantes.',
    recommandation: niveau !== 'info'
      ? 'Engager campagne de relances familles, étudier passage en créances douteuses (416).'
      : 'Maintenir cycle de relances usuel.',
    reference: 'Ord. RGP 2022-408 art. 9',
    serie,
  };
}

// ─── PROJECTION 4 : SOUS-CONSOMMATION SUBVENTIONS FLÉCHÉES ────────
export function projectionSousConsoSubv(
  snap: BalanceSnapshot,
  moisEcoules: number,
): Projection {
  // Σ avances reçues C/4411X (signe négatif = créditeur = avance)
  const avancesAbs = Math.abs(sommePref(snap.lignes, '4411'));
  // Charges associées : approximation = total classe 6 (à raffiner par activité)
  const charges = sommeAbsPref(snap.lignes, '6');
  const tauxConso = charges > 0 ? Math.min(100, (charges / Math.max(avancesAbs, 1)) * 100) : 0;
  const tauxAttendu = (moisEcoules / 12) * 100;
  const ecart = tauxConso - tauxAttendu;
  const niveau: Projection['niveau'] = (moisEcoules >= 6 && tauxConso < 50) ? 'rouge'
    : ecart < -20 ? 'orange' : 'info';
  return {
    id: 'sous_conso_subv',
    titre: 'Sous-consommation subventions fléchées',
    niveau,
    valeur: tauxConso,
    unite: '%',
    message: `Consommation ${tauxConso.toFixed(1)} % vs attendu ${tauxAttendu.toFixed(1)} % à ${moisEcoules}/12 mois.`,
    recommandation: niveau === 'rouge'
      ? 'Risque de reversement État/collectivité. Programmer engagements ou justifier reports.'
      : 'Suivi standard de consommation.',
    reference: 'Code éducation R.421-77',
  };
}

// ─── PROJECTION 5 : DÉSÉQUILIBRE SRH ───────────────────────────────
export function projectionDesequilibreSRH(snaps: BalanceSnapshot[]): Projection {
  const serie = snaps.map((s) => {
    const recettesDP = Math.abs(sommePref(s.lignes, '7062'));
    const achats = sommeAbsPref(s.lignes, '6021') + sommeAbsPref(s.lignes, '6111');
    return {
      date: s.date.toISOString().slice(0, 10),
      valeur: recettesDP - achats,
    };
  });
  const dernier = serie[serie.length - 1]?.valeur ?? 0;
  const deficitConsecutif = serie.length >= 2
    && serie[serie.length - 1].valeur < 0
    && serie[serie.length - 2].valeur < 0;
  const niveau: Projection['niveau'] = deficitConsecutif ? 'rouge' : dernier < 0 ? 'orange' : 'info';
  return {
    id: 'desequilibre_srh',
    titre: 'Équilibre SRH (recettes DP vs achats denrées + sous-traitance)',
    niveau,
    valeur: dernier,
    unite: '€',
    message: dernier < 0
      ? `Déficit SRH de ${Math.abs(dernier).toFixed(0)} € sur la dernière balance.`
      : `Excédent SRH de ${dernier.toFixed(0)} €.`,
    recommandation: niveau === 'rouge'
      ? 'Tarification DP à revoir (CA) ou maîtrise des coûts à renforcer.'
      : 'Surveillance trimestrielle.',
    reference: 'Code éducation R.531-52',
    serie,
  };
}

// ─── PROJECTION 6 : RÉSULTAT EXERCICE ANNUALISÉ ───────────────────
export function projectionResultatExercice(
  snap: BalanceSnapshot, moisEcoules: number,
): Projection {
  const cl7 = sommeAbsPref(snap.lignes, '7');
  const cl6 = sommeAbsPref(snap.lignes, '6');
  const resultatPartiel = cl7 - cl6;
  const facteur = moisEcoules > 0 ? 12 / moisEcoules : 1;
  const projete = resultatPartiel * facteur;
  const niveau: Projection['niveau'] = projete < 0 ? 'rouge' : projete < cl7 * 0.01 ? 'orange' : 'info';
  return {
    id: 'resultat_exercice',
    titre: 'Projection résultat exercice annualisé',
    niveau,
    valeur: projete,
    unite: '€',
    message: `Résultat partiel ${resultatPartiel.toFixed(0)} € sur ${moisEcoules}/12 mois → projeté ${projete.toFixed(0)} €.`,
    recommandation: niveau === 'rouge'
      ? 'Mesures correctives à envisager. DBM possible. Information CA.'
      : 'Suivi standard.',
    reference: 'GBCP 2012-1246 art. 178',
  };
}

/** Lance les 6 projections et calcule un score de risque global (0-100). */
export function lancerProjections(
  snaps: BalanceSnapshot[],
  options: { fonctionnementMensuel?: number; moisEcoules?: number } = {},
): { projections: Projection[]; scoreRisque: number; topVigilance: string[] } {
  const fm = options.fonctionnementMensuel ?? 50000;
  const me = options.moisEcoules ?? 6;
  const dernier = snaps[snaps.length - 1];
  if (!dernier) return { projections: [], scoreRisque: 0, topVigilance: [] };

  const projs: Projection[] = [
    projectionAttente(snaps),
    projectionErosion(snaps, fm),
    projectionCreancesFamilles(snaps),
    projectionSousConsoSubv(dernier, me),
    projectionDesequilibreSRH(snaps),
    projectionResultatExercice(dernier, me),
  ];
  // Score : rouge=20, orange=8, jaune=3, info=0, plafond 100
  const score = Math.min(100, projs.reduce((s, p) => s
    + (p.niveau === 'rouge' ? 20 : p.niveau === 'orange' ? 8 : p.niveau === 'jaune' ? 3 : 0), 0));
  const topVigilance = projs
    .filter((p) => p.niveau === 'rouge' || p.niveau === 'orange')
    .map((p) => p.titre)
    .slice(0, 5);
  return { projections: projs, scoreRisque: score, topVigilance };
}