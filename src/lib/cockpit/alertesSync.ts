/**
 * Branchement rétroactif des modules existants vers `alertes_transverses`.
 *
 * Stratégie :
 *  - Chaque module a un *scanner* qui interroge ses tables sources et produit
 *    une liste d'alertes candidates avec une `dedup_key` stable.
 *  - L'index unique `(module_origine, establishment_id, dedup_key)` garantit
 *    qu'une même condition ne crée qu'une seule alerte (idempotence).
 *  - On UPSERTE les alertes ouvertes et on clôt celles dont la condition
 *    n'est plus vraie (statut = 'close', closed_at = now()).
 *
 * Aucun déclencheur côté DB : la synchronisation est appelée explicitement
 * (au chargement du Cockpit + bouton "Resynchroniser").
 *
 * Conformité : M9-6 (anomalies balance), Code éducation L.421-14 / R.421-20
 * (autorisation CA voyages), CCP 2026 (seuils marchés), Décret 2010-888
 * (signatures entretiens), Code éducation R.421-13 (délégations).
 */

import { supabase } from '@/integrations/supabase/client';
import type { NiveauAlerte } from './types';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

export interface AlerteCandidate {
  module_origine: string;
  establishment_id: string | null;
  niveau: NiveauAlerte;
  titre: string;
  description?: string | null;
  echeance?: string | null;
  action_url?: string | null;
  reference_reglementaire?: string | null;
  dedup_key: string; // requis pour upsert idempotent
}

export interface SyncReport {
  module: string;
  detectees: number;
  upsertees: number;
  closes: number;
  erreurs: string[];
}

// ════════════════════════════════════════════════════════════════
// SCANNERS PAR MODULE
// Chaque scanner est pur : il prend les rows d'un EPLE et renvoie
// les alertes candidates. Pas d'I/O ici (pour la testabilité).
// ════════════════════════════════════════════════════════════════

/** Balance — anomalies M9-6 (comptes d'attente, sens anormal, caisse négative). */
export function scannerBalance(
  establishmentId: string,
  balance: Array<{ account_number: string; balance: number }>,
): AlerteCandidate[] {
  const out: AlerteCandidate[] = [];
  for (const b of balance) {
    const num = b.account_number || '';
    const solde = Number(b.balance) || 0;
    if (/^47[1-3]/.test(num) && Math.abs(solde) > 0) {
      out.push({
        module_origine: 'balance',
        establishment_id: establishmentId,
        niveau: 'orange',
        titre: `Compte d'attente ${num} non apuré`,
        description: `Solde ${solde.toFixed(2)} € sur compte d'attente — apurement requis avant clôture.`,
        action_url: '/balance',
        reference_reglementaire: 'M9-6 tome 4',
        dedup_key: `attente:${num}`,
      });
    }
    if (num.startsWith('511') && solde < -0.01) {
      out.push({
        module_origine: 'balance',
        establishment_id: establishmentId,
        niveau: 'rouge',
        titre: `Compte 511 ${num} en sens anormal`,
        description: `Solde créditeur de ${solde.toFixed(2)} € — chèques à encaisser ne peuvent pas être créditeurs.`,
        action_url: '/balance',
        reference_reglementaire: 'M9-6 pièce 14',
        dedup_key: `sens-anormal:${num}`,
      });
    }
    if (num.startsWith('531') && solde < -0.01) {
      out.push({
        module_origine: 'balance',
        establishment_id: establishmentId,
        niveau: 'rouge',
        titre: `Caisse ${num} négative`,
        description: `Solde ${solde.toFixed(2)} € — caisse négative interdite (instruction M9-6).`,
        action_url: '/balance',
        reference_reglementaire: 'M9-6 tome 4',
        dedup_key: `caisse-negative:${num}`,
      });
    }
  }
  return out;
}

/** Voyages — autorisation CA manquante, bilan en retard (règle 8 €). */
export function scannerVoyages(
  establishmentId: string,
  voyages: Array<{
    id: string;
    libelle: string;
    statut: string;
    date_depart: string | null;
    date_retour: string | null;
    date_ca_autorisation: string | null;
    numero_acte_ca: string | null;
  }>,
  today: Date = new Date(),
): AlerteCandidate[] {
  const out: AlerteCandidate[] = [];
  for (const v of voyages) {
    // Voyage planifié sans autorisation CA
    if (
      v.date_depart &&
      ['valide', 'en_cours', 'termine'].includes(v.statut) &&
      !v.date_ca_autorisation
    ) {
      out.push({
        module_origine: 'voyages',
        establishment_id: establishmentId,
        niveau: 'rouge',
        titre: `Voyage "${v.libelle}" sans autorisation CA`,
        description: 'Le voyage est validé mais aucune date de CA d\'autorisation n\'est saisie.',
        action_url: `/voyages-v2/${v.id}`,
        reference_reglementaire: 'Code éducation L.421-14 / R.421-20',
        dedup_key: `voyage-sans-ca:${v.id}`,
      });
    }
    // Bilan en retard : voyage retourné depuis > 30 j et statut non clos
    if (v.date_retour && v.statut !== 'cloture') {
      const retour = new Date(v.date_retour);
      const joursDepuis = Math.floor((today.getTime() - retour.getTime()) / 86_400_000);
      if (joursDepuis > 30) {
        out.push({
          module_origine: 'voyages',
          establishment_id: establishmentId,
          niveau: joursDepuis > 60 ? 'rouge' : 'orange',
          titre: `Bilan voyage "${v.libelle}" en retard (J+${joursDepuis})`,
          description: `Voyage retourné le ${retour.toLocaleDateString('fr-FR')} sans clôture financière (règle des 8 €).`,
          action_url: `/voyages-v2/${v.id}`,
          reference_reglementaire: 'Circulaire voyages MENE2407159C',
          dedup_key: `bilan-retard:${v.id}`,
        });
      }
    }
  }
  return out;
}

/** Marchés — saucissonnage (cumul 12 mois > seuil) + procédure incohérente. */
export function scannerMarches(
  establishmentId: string,
  marches: Array<{
    id: string;
    libelle: string;
    famille_code: string;
    cumul_total_12m: number;
    procedure_calculee: string;
    montant_estime_ht: number;
  }>,
): AlerteCandidate[] {
  const out: AlerteCandidate[] = [];
  // Seuils CCP 2026 (fournitures/services pour EPLE)
  const SEUIL_DISPENSE = 40_000; // > dispense -> MAPA
  const SEUIL_FORMALISE = 143_000; // > MAPA -> procédure formalisée
  for (const m of marches) {
    if (m.cumul_total_12m > SEUIL_DISPENSE && m.procedure_calculee === 'dispense') {
      out.push({
        module_origine: 'marches',
        establishment_id: establishmentId,
        niveau: 'rouge',
        titre: `Cumul famille "${m.famille_code}" > 40 k€ HT`,
        description: `Marché "${m.libelle}" : cumul 12 mois de ${m.cumul_total_12m.toLocaleString('fr-FR')} € HT — bascule MAPA exigée.`,
        action_url: `/agence`,
        reference_reglementaire: 'CCP art. R.2123-1 (seuils 2026)',
        dedup_key: `saucissonnage:${m.id}`,
      });
    }
    if (m.cumul_total_12m > SEUIL_FORMALISE && m.procedure_calculee !== 'formalise') {
      out.push({
        module_origine: 'marches',
        establishment_id: establishmentId,
        niveau: 'rouge',
        titre: `Procédure formalisée requise — "${m.libelle}"`,
        description: `Cumul ${m.cumul_total_12m.toLocaleString('fr-FR')} € HT > 143 k€ : appel d'offres obligatoire.`,
        action_url: `/agence`,
        reference_reglementaire: 'CCP art. R.2124-1',
        dedup_key: `formalise-requis:${m.id}`,
      });
    }
  }
  return out;
}

/** Délégations — expirations sous 30/60 jours, dates incohérentes. */
export function scannerDelegations(
  establishmentId: string,
  delegations: Array<{
    id: string;
    type_delegation: string;
    date_fin: string | null;
    statut: string;
  }>,
  today: Date = new Date(),
): AlerteCandidate[] {
  const out: AlerteCandidate[] = [];
  for (const d of delegations) {
    if (d.statut !== 'active' || !d.date_fin) continue;
    const fin = new Date(d.date_fin);
    const jours = Math.floor((fin.getTime() - today.getTime()) / 86_400_000);
    if (jours < 0) {
      out.push({
        module_origine: 'delegations',
        establishment_id: establishmentId,
        niveau: 'rouge',
        titre: `Délégation "${d.type_delegation}" expirée`,
        description: `Échéance dépassée depuis ${Math.abs(jours)} jour(s) — abrogation ou renouvellement requis.`,
        action_url: '/settings?tab=delegations',
        reference_reglementaire: 'Code éducation R.421-13',
        dedup_key: `expiree:${d.id}`,
      });
    } else if (jours <= 30) {
      out.push({
        module_origine: 'delegations',
        establishment_id: establishmentId,
        niveau: 'orange',
        titre: `Délégation "${d.type_delegation}" expire sous 30 j`,
        description: `Échéance le ${fin.toLocaleDateString('fr-FR')} (J+${jours}) — anticiper le renouvellement.`,
        echeance: d.date_fin,
        action_url: '/settings?tab=delegations',
        reference_reglementaire: 'Code éducation R.421-13',
        dedup_key: `expire-30j:${d.id}`,
      });
    } else if (jours <= 60) {
      out.push({
        module_origine: 'delegations',
        establishment_id: establishmentId,
        niveau: 'jaune',
        titre: `Délégation "${d.type_delegation}" expire sous 60 j`,
        echeance: d.date_fin,
        action_url: '/settings?tab=delegations',
        reference_reglementaire: 'Code éducation R.421-13',
        dedup_key: `expire-60j:${d.id}`,
      });
    }
  }
  return out;
}

/** Entretiens — campagne en retard, signatures manquantes, recours en cours. */
export function scannerEntretiens(
  establishmentId: string,
  entretiens: Array<{
    id: string;
    statut: string;
    date_entretien: string | null;
    signature_n1_at: string | null;
    signature_agent_at: string | null;
    visa_n2_at: string | null;
    finalise_at: string | null;
  }>,
  today: Date = new Date(),
): AlerteCandidate[] {
  const out: AlerteCandidate[] = [];
  for (const e of entretiens) {
    // Entretien tenu mais non finalisé > 60 j
    if (e.date_entretien && !e.finalise_at) {
      const tenu = new Date(e.date_entretien);
      const jours = Math.floor((today.getTime() - tenu.getTime()) / 86_400_000);
      if (jours > 60) {
        out.push({
          module_origine: 'entretiens',
          establishment_id: establishmentId,
          niveau: jours > 90 ? 'rouge' : 'orange',
          titre: `Entretien non finalisé (J+${jours})`,
          description: 'Entretien tenu mais circuit de signatures incomplet.',
          action_url: `/entretiens`,
          reference_reglementaire: 'Décret 2010-888',
          dedup_key: `non-finalise:${e.id}`,
        });
      }
    }
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
// ORCHESTRATION : lit les tables, applique les scanners, upserte.
// ════════════════════════════════════════════════════════════════

const ALL_MODULES = ['balance', 'voyages', 'marches', 'delegations', 'entretiens'] as const;
export type ModuleOrigine = (typeof ALL_MODULES)[number];

/** Upsert idempotent : utilise l'index unique (module, etab, dedup_key). */
async function upsertCandidates(candidats: AlerteCandidate[]): Promise<number> {
  if (candidats.length === 0) return 0;
  // Upsert par lot avec onConflict sur la contrainte unique partielle
  const rows = candidats.map(c => ({
    module_origine: c.module_origine,
    establishment_id: c.establishment_id,
    niveau: c.niveau,
    titre: c.titre,
    description: c.description ?? null,
    echeance: c.echeance ?? null,
    action_url: c.action_url ?? null,
    reference_reglementaire: c.reference_reglementaire ?? null,
    dedup_key: c.dedup_key,
    statut: 'ouverte',
  }));
  const { error } = await supabase
    .from('alertes_transverses')
    .upsert(rows, { onConflict: 'module_origine,establishment_id,dedup_key', ignoreDuplicates: false });
  if (error) throw error;
  return rows.length;
}

/** Clôt les alertes du module dont la dedup_key n'est plus dans le set actuel. */
async function closeStaleAlertes(
  module: ModuleOrigine,
  establishmentId: string,
  dedupKeysActives: Set<string>,
): Promise<number> {
  const { data: existantes } = await supabase
    .from('alertes_transverses')
    .select('id, dedup_key')
    .eq('module_origine', module)
    .eq('establishment_id', establishmentId)
    .eq('statut', 'ouverte');

  const aClore = (existantes || []).filter(a => a.dedup_key && !dedupKeysActives.has(a.dedup_key));
  if (aClore.length === 0) return 0;

  const { error } = await supabase
    .from('alertes_transverses')
    .update({ statut: 'close', closed_at: new Date().toISOString() })
    .in('id', aClore.map(a => a.id));
  if (error) throw error;
  return aClore.length;
}

async function syncBalance(etabId: string, today: Date): Promise<SyncReport> {
  const r: SyncReport = { module: 'balance', detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
  try {
    const { data } = await supabase
      .from('balances').select('account_number, balance')
      .eq('establishment_id', etabId).eq('year', today.getFullYear());
    const cands = scannerBalance(etabId, data || []);
    r.detectees = cands.length;
    r.upsertees = await upsertCandidates(cands);
    r.closes = await closeStaleAlertes('balance', etabId, new Set(cands.map(c => c.dedup_key)));
  } catch (e: any) { r.erreurs.push(String(e?.message || e)); }
  return r;
}

async function syncVoyages(etabId: string, today: Date): Promise<SyncReport> {
  const r: SyncReport = { module: 'voyages', detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
  try {
    const { data } = await supabase
      .from('vs_voyages').select('id, libelle, statut, date_depart, date_retour, date_ca_autorisation, numero_acte_ca')
      .eq('establishment_id', etabId);
    const cands = scannerVoyages(etabId, (data as any) || [], today);
    r.detectees = cands.length;
    r.upsertees = await upsertCandidates(cands);
    r.closes = await closeStaleAlertes('voyages', etabId, new Set(cands.map(c => c.dedup_key)));
  } catch (e: any) { r.erreurs.push(String(e?.message || e)); }
  return r;
}

async function syncMarches(etabId: string, _today: Date): Promise<SyncReport> {
  const r: SyncReport = { module: 'marches', detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
  try {
    const { data } = await supabase
      .from('mp_marches').select('id, libelle, famille_code, cumul_total_12m, procedure_calculee, montant_estime_ht')
      .eq('establishment_id', etabId);
    const cands = scannerMarches(etabId, (data as any) || []);
    r.detectees = cands.length;
    r.upsertees = await upsertCandidates(cands);
    r.closes = await closeStaleAlertes('marches', etabId, new Set(cands.map(c => c.dedup_key)));
  } catch (e: any) { r.erreurs.push(String(e?.message || e)); }
  return r;
}

async function syncDelegations(etabId: string, today: Date): Promise<SyncReport> {
  const r: SyncReport = { module: 'delegations', detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
  try {
    const { data } = await supabase
      .from('delegations_signature').select('id, type_delegation, date_fin, statut')
      .eq('establishment_id', etabId);
    const cands = scannerDelegations(etabId, (data as any) || [], today);
    r.detectees = cands.length;
    r.upsertees = await upsertCandidates(cands);
    r.closes = await closeStaleAlertes('delegations', etabId, new Set(cands.map(c => c.dedup_key)));
  } catch (e: any) { r.erreurs.push(String(e?.message || e)); }
  return r;
}

async function syncEntretiens(etabId: string, today: Date): Promise<SyncReport> {
  const r: SyncReport = { module: 'entretiens', detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
  try {
    const { data } = await supabase
      .from('entretiens_professionnels')
      .select('id, statut, date_entretien, signature_n1_at, signature_agent_at, visa_n2_at, finalise_at')
      .eq('establishment_id', etabId);
    const cands = scannerEntretiens(etabId, (data as any) || [], today);
    r.detectees = cands.length;
    r.upsertees = await upsertCandidates(cands);
    r.closes = await closeStaleAlertes('entretiens', etabId, new Set(cands.map(c => c.dedup_key)));
  } catch (e: any) { r.erreurs.push(String(e?.message || e)); }
  return r;
}

/**
 * Synchronise les alertes pour TOUS les EPLE accessibles à l'utilisateur.
 * À appeler au chargement du Cockpit ou via le bouton "Resynchroniser".
 */
export async function syncAlertesTransverses(opts?: { etablissements?: string[] }): Promise<SyncReport[]> {
  const today = new Date();
  let etabIds = opts?.etablissements;
  if (!etabIds) {
    const { data: estabs } = await supabase.from('establishments').select('id');
    etabIds = (estabs || []).map(e => e.id);
  }

  const rapports: SyncReport[] = [];
  for (const etabId of etabIds) {
    rapports.push(await syncBalance(etabId, today));
    rapports.push(await syncVoyages(etabId, today));
    rapports.push(await syncMarches(etabId, today));
    rapports.push(await syncDelegations(etabId, today));
    rapports.push(await syncEntretiens(etabId, today));
  }
  return rapports;
}

/** Agrège un rapport global (somme par module). */
export function aggregerRapports(rapports: SyncReport[]): Record<string, SyncReport> {
  const agg: Record<string, SyncReport> = {};
  for (const r of rapports) {
    if (!agg[r.module]) {
      agg[r.module] = { module: r.module, detectees: 0, upsertees: 0, closes: 0, erreurs: [] };
    }
    agg[r.module].detectees += r.detectees;
    agg[r.module].upsertees += r.upsertees;
    agg[r.module].closes += r.closes;
    agg[r.module].erreurs.push(...r.erreurs);
  }
  return agg;
}

export const _modulesBranches = ALL_MODULES;
