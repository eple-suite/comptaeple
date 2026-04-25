/**
 * Construction du dataset complet du Cockpit AC à partir des tables Supabase.
 * Repose exclusivement sur des données réelles : balances, vs_voyages, mp_marches,
 * agents, establishments, alertes_transverses. Aucune valeur codée en dur.
 */

import { supabase } from '@/integrations/supabase/client';
import { instancierJalons, echeancesProchaines } from './calendrierReglementaire';
import { niveauTresorerie, niveauFdr, niveauCreances, niveauCICF, niveauEcheance } from './seuils';
import type { CockpitDataset, EpleResume, KpiCockpitValeur, AlerteTransverse, NiveauAlerte } from './types';

function eur(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function jours(montant: number, charges: number): number {
  if (!charges || charges <= 0) return 0;
  return Math.round((montant / charges) * 360);
}

/** Score CICF allégé calculé depuis la balance (anomalies M9-6). */
function scoreCICFFromBalance(balance: any[]): number {
  if (!balance || balance.length === 0) return 0;
  // Méthode allégée AUDITAC : 100 - 5 par anomalie majeure détectée.
  const anomalies = detecterAnomaliesM96(balance).length;
  return Math.max(0, Math.min(100, 100 - anomalies * 5));
}

function detecterAnomaliesM96(balance: any[]): { compte: string; raison: string }[] {
  const anomalies: { compte: string; raison: string }[] = [];
  for (const b of balance) {
    const num: string = b.account_number || '';
    const solde: number = Number(b.balance) || 0;
    // Comptes 471/472/473 (attente) ne devraient pas avoir de solde
    if (/^47[1-3]/.test(num) && Math.abs(solde) > 0) {
      anomalies.push({ compte: num, raison: 'compte d\'attente non apuré' });
    }
    // 511 chèques à encaisser ne doit pas être créditeur
    if (num.startsWith('511') && solde < -0.01) {
      anomalies.push({ compte: num, raison: 'sens anormal créditeur' });
    }
    // Caisse négative
    if (num.startsWith('531') && solde < -0.01) {
      anomalies.push({ compte: num, raison: 'caisse négative' });
    }
  }
  return anomalies;
}

/** Calcul des indicateurs bilanciels à partir d'une balance N. */
function indicateursDepuisBalance(balance: any[]): {
  fdr: number; tresorerie: number; creances: number; chargesAnnualisees: number;
} {
  let fdr = 0;
  let tresorerie = 0;
  let creances = 0;
  let chargesAnnualisees = 0;
  let recettes = 0;

  for (const b of balance) {
    const num: string = b.account_number || '';
    const solde: number = Number(b.balance) || 0;
    // Trésorerie = comptes 5151, 5159, 5311, 50
    if (/^5(15|31)/.test(num)) tresorerie += solde;
    // Créances clients = 411, 416
    if (/^41[16]/.test(num)) creances += Math.max(0, solde);
    // FDR comptable simplifié = capitaux permanents (10,11,12,13,14) - actif immo (20,21,23,28)
    if (/^(10|11|12|13|14|15)/.test(num)) fdr += -solde; // crédit -> +
    if (/^(20|21|23|28)/.test(num)) fdr += -Math.abs(solde);
    // Charges (classe 6) hors amortissements
    if (/^6/.test(num) && !/^68/.test(num)) chargesAnnualisees += Math.abs(solde);
    if (/^7/.test(num)) recettes += Math.abs(solde);
  }
  return { fdr: Math.abs(fdr), tresorerie, creances, chargesAnnualisees };
}

/** Construit le dataset cockpit complet. */
export async function buildCockpitDataset(opts: { demo?: boolean } = {}): Promise<CockpitDataset> {
  const today = new Date();

  if (opts.demo) {
    return buildDemoDataset(today);
  }

  // 1. Établissements accessibles
  const { data: estabs } = await supabase
    .from('establishments')
    .select('id, uai, name, type, ordonnateur, agent_comptable, secretaire_general, groupement_id');

  const eples = estabs || [];

  // 2. Groupement (premier rencontré, sinon défaut)
  let groupement: CockpitDataset['groupement'] = {
    nom: 'Groupement comptable',
    rectorat: 'Académie de la Guadeloupe',
    academie: 'Guadeloupe',
    siege: eples[0]?.name || '—',
    agentComptable: eples[0]?.agent_comptable || '—',
    fondeDePouvoir: '—',
    nbEple: eples.length,
    nbEleves: 0,
    nbAgents: 0,
  };

  const groupementId = eples.find(e => e.groupement_id)?.groupement_id;
  if (groupementId) {
    const { data: g } = await supabase
      .from('groupements_comptables')
      .select('*, lycee_siege:establishments!groupements_comptables_lycee_siege_id_fkey(name)')
      .eq('id', groupementId)
      .maybeSingle();
    if (g) {
      groupement = {
        nom: g.nom,
        rectorat: g.rectorat_libelle,
        academie: g.academie,
        siege: (g as any).lycee_siege?.name || eples[0]?.name || '—',
        agentComptable: g.agent_comptable_titulaire || eples[0]?.agent_comptable || '—',
        fondeDePouvoir: g.fonde_de_pouvoir || '—',
        nbEple: eples.length,
        nbEleves: 0,
        nbAgents: 0,
      };
    }
  }

  // 3. Agents (compteur)
  const { count: nbAgents } = await supabase
    .from('agents').select('id', { count: 'exact', head: true }).in('establishment_id', eples.map(e => e.id));
  groupement.nbAgents = nbAgents || 0;

  // 4. Pour chaque EPLE, charger balance N + N-1 et compteurs
  const annee = today.getFullYear();
  const eplesResume: EpleResume[] = [];
  let totalFdr = 0, totalTreso = 0, totalCreances = 0, totalCharges = 0, totalAnomalies = 0;

  for (const e of eples) {
    const { data: bal } = await supabase
      .from('balances').select('account_number, balance').eq('establishment_id', e.id).eq('year', annee);
    const ind = indicateursDepuisBalance(bal || []);
    const ano = detecterAnomaliesM96(bal || []).length;
    const score = scoreCICFFromBalance(bal || []);

    const [voyagesRes, marchesRes] = await Promise.all([
      supabase.from('vs_voyages').select('id', { count: 'exact', head: true })
        .eq('establishment_id', e.id).in('statut', ['projet', 'autorise', 'en_cours']),
      supabase.from('mp_marches').select('id', { count: 'exact', head: true })
        .eq('establishment_id', e.id).in('statut_marche' as any, ['preparation', 'consultation', 'analyse', 'attribue']).then(r => r, () => ({ count: 0 } as any)),
    ]);

    eplesResume.push({
      id: e.id,
      uai: e.uai,
      nom: e.name,
      type: e.type || 'Lycée',
      ordonnateur: e.ordonnateur || '—',
      secretaireGeneral: e.secretaire_general || '—',
      scoreCICF: score,
      tresorerie: ind.tresorerie,
      joursTresorerie: jours(ind.tresorerie, ind.chargesAnnualisees),
      fdr: ind.fdr,
      joursFdr: jours(ind.fdr, ind.chargesAnnualisees),
      creances: ind.creances,
      anomalies: ano,
      echeancesOuvertes: 0,
      voyagesEnCours: voyagesRes.count || 0,
      marchesEnCours: (marchesRes as any).count || 0,
    });
    totalFdr += ind.fdr; totalTreso += ind.tresorerie; totalCreances += ind.creances;
    totalCharges += ind.chargesAnnualisees; totalAnomalies += ano;
  }

  // 5. Alertes transverses ouvertes
  const { data: alertesData } = await supabase
    .from('alertes_transverses').select('*').eq('statut', 'ouverte').order('created_at', { ascending: false });
  const alertes = (alertesData || []) as AlerteTransverse[];

  // 6. KPI consolidés
  const joursTresoConsolide = jours(totalTreso, totalCharges);
  const joursFdrConsolide = jours(totalFdr, totalCharges);
  const recettes = totalCharges; // approx pour ratio créances
  const pctCreances = recettes > 0 ? (totalCreances / recettes) * 100 : 0;
  const scoreMoy = eplesResume.length > 0
    ? eplesResume.reduce((s, e) => s + e.scoreCICF, 0) / eplesResume.length : 0;

  const ech30 = echeancesProchaines(30, today);
  const ech30Min = ech30.length > 0 ? Math.min(...ech30.map(e => e.joursRestants)) : 999;
  const niveauEch = ech30.length === 0 ? 'info' : niveauEcheance(ech30Min);

  // Marchés et voyages totaux
  const totalMarches = eplesResume.reduce((s, e) => s + e.marchesEnCours, 0);
  const totalVoyages = eplesResume.reduce((s, e) => s + e.voyagesEnCours, 0);

  const kpis: KpiCockpitValeur[] = [
    {
      id: 'cicf',
      label: 'Score CICF consolidé',
      valeur: `${Math.round(scoreMoy)}/100`,
      valeurNumerique: scoreMoy,
      sublabel: `Moyenne ${eplesResume.length} EPLE`,
      niveau: niveauCICF(scoreMoy),
      formule: 'Moyenne du score AUDITAC allégé : 100 − 5 × anomalies M9-6 détectées par EPLE.',
      source: 'AUDITAC AJI / M9-6',
    },
    {
      id: 'tresorerie',
      label: 'Trésorerie consolidée',
      valeur: `${joursTresoConsolide} j`,
      valeurNumerique: joursTresoConsolide,
      sublabel: eur(totalTreso),
      niveau: niveauTresorerie(joursTresoConsolide),
      formule: 'Σ trésorerie (5151+5159+5311) / charges décaissables annualisées × 360.',
      source: 'M9-6 pièce 14',
    },
    {
      id: 'fdr',
      label: 'Fonds de roulement consolidé',
      valeur: `${joursFdrConsolide} j`,
      valeurNumerique: joursFdrConsolide,
      sublabel: eur(totalFdr),
      niveau: niveauFdr(joursFdrConsolide),
      formule: 'Σ FDR / charges annualisées × 360.',
      source: 'M9-6 tome 4 art. 43231',
    },
    {
      id: 'creances',
      label: 'Créances non recouvrées',
      valeur: eur(totalCreances),
      valeurNumerique: totalCreances,
      sublabel: `${pctCreances.toFixed(1)} % des recettes`,
      niveau: niveauCreances(pctCreances),
      formule: 'Σ comptes 411X + 416 (soldes débiteurs) sur les EPLE du groupement.',
      source: 'DAF A3',
      actionUrl: '/satd',
    },
    {
      id: 'anomalies',
      label: 'Anomalies M9-6 ouvertes',
      valeur: String(totalAnomalies),
      valeurNumerique: totalAnomalies,
      sublabel: 'Sur balances importées',
      niveau: totalAnomalies === 0 ? 'success' : totalAnomalies < 5 ? 'jaune' : 'orange',
      formule: 'Soldes anormaux + comptes d\'attente non apurés détectés par moteur M9-6.',
      source: 'Instruction M9-6',
      actionUrl: '/balance',
    },
    {
      id: 'echeances',
      label: 'Échéances réglementaires (30 j)',
      valeur: String(ech30.length),
      valeurNumerique: ech30.length,
      sublabel: ech30.length > 0 ? `Plus proche : J+${ech30Min}` : 'Aucune sous 30 j',
      niveau: niveauEch as NiveauAlerte,
      formule: 'Jalons du calendrier comptable annuel sous 30 jours.',
      source: 'M9-6 / Code éducation L.421-11',
    },
    {
      id: 'marches',
      label: 'Marchés en cours',
      valeur: String(totalMarches),
      valeurNumerique: totalMarches,
      sublabel: 'Préparation, consultation, attribués',
      niveau: 'info',
      formule: 'Compteur des marchés au statut préparation/consultation/analyse/attribué.',
      source: 'CCP / Décret seuils',
      actionUrl: '/agence',
    },
    {
      id: 'voyages',
      label: 'Voyages scolaires',
      valeur: String(totalVoyages),
      valeurNumerique: totalVoyages,
      sublabel: 'Programmés ou en cours',
      niveau: 'info',
      formule: 'Compteur des voyages au statut projet/autorisé/en cours.',
      source: 'M9-6 / circulaire voyages',
      actionUrl: '/voyages-v2',
    },
  ];

  return {
    generationAt: today,
    groupement,
    eples: eplesResume,
    kpis,
    alertes,
  };
}

/** Dataset démo cohérent (groupement de 7 EPLE en Guadeloupe). */
function buildDemoDataset(today: Date): CockpitDataset {
  const eples: EpleResume[] = [
    { id: 'd1', uai: '9710001A', nom: 'Lycée Baimbridge', type: 'Lycée', ordonnateur: 'Mme MARTIN', secretaireGeneral: 'M. DUVAL', scoreCICF: 82, tresorerie: 1_240_000, joursTresorerie: 65, fdr: 980_000, joursFdr: 51, creances: 42_000, anomalies: 2, echeancesOuvertes: 1, voyagesEnCours: 4, marchesEnCours: 3 },
    { id: 'd2', uai: '9710002B', nom: 'Lycée Charles Coëffin', type: 'Lycée Pro', ordonnateur: 'M. JOSEPH', secretaireGeneral: 'Mme PIERRE', scoreCICF: 71, tresorerie: 410_000, joursTresorerie: 28, fdr: 320_000, joursFdr: 22, creances: 38_000, anomalies: 5, echeancesOuvertes: 2, voyagesEnCours: 2, marchesEnCours: 1 },
    { id: 'd3', uai: '9710003C', nom: 'Collège Front de Mer', type: 'Collège', ordonnateur: 'Mme RAMOS', secretaireGeneral: 'Mme TOTO', scoreCICF: 64, tresorerie: 180_000, joursTresorerie: 19, fdr: 145_000, joursFdr: 15, creances: 12_000, anomalies: 7, echeancesOuvertes: 1, voyagesEnCours: 1, marchesEnCours: 0 },
    { id: 'd4', uai: '9710004D', nom: 'Lycée Pointe-Noire', type: 'Lycée', ordonnateur: 'M. RICHARD', secretaireGeneral: 'M. PAUL', scoreCICF: 88, tresorerie: 920_000, joursTresorerie: 72, fdr: 720_000, joursFdr: 56, creances: 18_000, anomalies: 1, echeancesOuvertes: 0, voyagesEnCours: 3, marchesEnCours: 2 },
    { id: 'd5', uai: '9710005E', nom: 'Collège Sainte-Anne', type: 'Collège', ordonnateur: 'Mme BAYANI', secretaireGeneral: 'M. SAINT', scoreCICF: 58, tresorerie: 95_000, joursTresorerie: 11, fdr: 80_000, joursFdr: 9, creances: 22_000, anomalies: 9, echeancesOuvertes: 3, voyagesEnCours: 1, marchesEnCours: 1 },
    { id: 'd6', uai: '9710006F', nom: 'LP Petit-Bourg', type: 'Lycée Pro', ordonnateur: 'M. EDOUARD', secretaireGeneral: 'Mme NICOLAS', scoreCICF: 76, tresorerie: 530_000, joursTresorerie: 42, fdr: 420_000, joursFdr: 33, creances: 25_000, anomalies: 3, echeancesOuvertes: 1, voyagesEnCours: 2, marchesEnCours: 1 },
    { id: 'd7', uai: '9710007G', nom: 'Lycée Gerville-Réache', type: 'Lycée', ordonnateur: 'Mme LECLERC', secretaireGeneral: 'M. MOREAU', scoreCICF: 79, tresorerie: 680_000, joursTresorerie: 53, fdr: 540_000, joursFdr: 42, creances: 31_000, anomalies: 2, echeancesOuvertes: 1, voyagesEnCours: 5, marchesEnCours: 4 },
  ];

  const totalTreso = eples.reduce((s, e) => s + e.tresorerie, 0);
  const totalFdr = eples.reduce((s, e) => s + e.fdr, 0);
  const totalCreances = eples.reduce((s, e) => s + e.creances, 0);
  const totalAnomalies = eples.reduce((s, e) => s + e.anomalies, 0);
  const totalMarches = eples.reduce((s, e) => s + e.marchesEnCours, 0);
  const totalVoyages = eples.reduce((s, e) => s + e.voyagesEnCours, 0);
  const scoreMoy = eples.reduce((s, e) => s + e.scoreCICF, 0) / eples.length;
  const joursTresoConsolide = Math.round(eples.reduce((s, e) => s + e.joursTresorerie, 0) / eples.length);
  const joursFdrConsolide = Math.round(eples.reduce((s, e) => s + e.joursFdr, 0) / eples.length);
  const ech30 = echeancesProchaines(30, today);
  const ech30Min = ech30.length > 0 ? Math.min(...ech30.map(e => e.joursRestants)) : 999;

  const kpis: KpiCockpitValeur[] = [
    { id: 'cicf', label: 'Score CICF consolidé', valeur: `${Math.round(scoreMoy)}/100`, valeurNumerique: scoreMoy, sublabel: `Moyenne ${eples.length} EPLE`, niveau: niveauCICF(scoreMoy), formule: 'Moyenne AUDITAC allégé.', source: 'AUDITAC AJI / M9-6', tendance: 'up', variationPct: 4.2 },
    { id: 'tresorerie', label: 'Trésorerie consolidée', valeur: `${joursTresoConsolide} j`, valeurNumerique: joursTresoConsolide, sublabel: eur(totalTreso), niveau: niveauTresorerie(joursTresoConsolide), formule: 'Σ trésorerie / charges × 360.', source: 'M9-6 pièce 14', tendance: 'up', variationPct: 2.1 },
    { id: 'fdr', label: 'Fonds de roulement consolidé', valeur: `${joursFdrConsolide} j`, valeurNumerique: joursFdrConsolide, sublabel: eur(totalFdr), niveau: niveauFdr(joursFdrConsolide), formule: 'Σ FDR / charges × 360.', source: 'M9-6 tome 4 art. 43231', tendance: 'flat', variationPct: 0.4 },
    { id: 'creances', label: 'Créances non recouvrées', valeur: eur(totalCreances), valeurNumerique: totalCreances, sublabel: '3.1 % des recettes', niveau: 'orange', formule: 'Σ 411X + 416.', source: 'DAF A3', tendance: 'down', variationPct: -1.2, actionUrl: '/satd' },
    { id: 'anomalies', label: 'Anomalies M9-6 ouvertes', valeur: String(totalAnomalies), valeurNumerique: totalAnomalies, sublabel: 'Sur balances importées', niveau: 'orange', formule: 'Soldes anormaux + comptes d\'attente.', source: 'M9-6', actionUrl: '/balance' },
    { id: 'echeances', label: 'Échéances réglementaires (30 j)', valeur: String(ech30.length), valeurNumerique: ech30.length, sublabel: ech30.length > 0 ? `Plus proche : J+${ech30Min}` : 'Aucune', niveau: ech30.length > 0 ? niveauEcheance(ech30Min) : 'info', formule: 'Jalons calendrier comptable.', source: 'M9-6 / L.421-11' },
    { id: 'marches', label: 'Marchés en cours', valeur: String(totalMarches), valeurNumerique: totalMarches, sublabel: 'Préparation à attribué', niveau: 'info', formule: 'Compteur statuts actifs.', source: 'CCP', actionUrl: '/agence' },
    { id: 'voyages', label: 'Voyages scolaires', valeur: String(totalVoyages), valeurNumerique: totalVoyages, sublabel: 'Programmés ou en cours', niveau: 'info', formule: 'Compteur statuts actifs.', source: 'Circulaire voyages', actionUrl: '/voyages-v2' },
  ];

  const alertes: AlerteTransverse[] = [
    { id: 'a1', module_origine: 'balance', establishment_id: 'd5', niveau: 'rouge', titre: 'Caisse négative au 31/03', description: 'Le compte 5311 présente un solde créditeur — anomalie M9-6.', echeance: null, statut: 'ouverte', action_url: '/balance', reference_reglementaire: 'M9-6 tome 4', dedup_key: null, created_at: today.toISOString(), updated_at: today.toISOString(), closed_at: null, closed_by: null },
    { id: 'a2', module_origine: 'voyages', establishment_id: 'd2', niveau: 'rouge', titre: 'Bilan voyage Madrid en retard', description: 'Voyage clôturé depuis 45 jours sans bilan financier (règle 8 €).', echeance: null, statut: 'ouverte', action_url: '/voyages-v2', reference_reglementaire: 'Circulaire voyages', dedup_key: null, created_at: today.toISOString(), updated_at: today.toISOString(), closed_at: null, closed_by: null },
    { id: 'a3', module_origine: 'marches', establishment_id: 'd1', niveau: 'orange', titre: 'Cumul famille fournitures > 40 k€ HT', description: 'Risque saucissonnage — bascule en MAPA exigée.', echeance: null, statut: 'ouverte', action_url: '/agence', reference_reglementaire: 'CCP art. R.2123-1', dedup_key: null, created_at: today.toISOString(), updated_at: today.toISOString(), closed_at: null, closed_by: null },
    { id: 'a4', module_origine: 'compte_financier', establishment_id: 'd3', niveau: 'orange', titre: 'Sens anormal compte 471', description: 'Compte d\'attente non apuré au 31/03.', echeance: null, statut: 'ouverte', action_url: '/compte-financier', reference_reglementaire: 'M9-6', dedup_key: null, created_at: today.toISOString(), updated_at: today.toISOString(), closed_at: null, closed_by: null },
    { id: 'a5', module_origine: 'entretiens', establishment_id: 'd1', niveau: 'jaune', titre: 'CREP en attente de visa N+2', description: '3 CREP signés N+1 en attente de validation N+2.', echeance: null, statut: 'ouverte', action_url: '/entretiens/campagne', reference_reglementaire: 'Décret 2010-888', dedup_key: null, created_at: today.toISOString(), updated_at: today.toISOString(), closed_at: null, closed_by: null },
  ];

  return {
    generationAt: today,
    groupement: {
      nom: 'Groupement comptable de Pointe-à-Pitre (DÉMO)',
      rectorat: 'Académie de la Guadeloupe',
      academie: 'Guadeloupe',
      siege: 'Lycée Baimbridge',
      agentComptable: 'Mme Marie-Joseph PETIT (titulaire depuis 2022)',
      fondeDePouvoir: 'M. Jean DUVAL',
      nbEple: eples.length,
      nbEleves: 8420,
      nbAgents: 142,
    },
    eples,
    kpis,
    alertes,
  };
}
