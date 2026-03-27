// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Backend Sync Service
// Persists establishment identity + CSV snapshots to Supabase
// so data survives browser changes and device switches.
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/integrations/supabase/client';
import type { TypeBudget } from './cofieple_storeTypes';

// ── 1. Establishment identity (ordonnateur, agent comptable, SG) ──

export async function saveEstablishmentIdentity(
  establishmentId: string,
  fields: { ordonnateur?: string; agent_comptable?: string; secretaire_general?: string }
) {
  const { error } = await supabase
    .from('establishments')
    .update(fields)
    .eq('id', establishmentId);
  if (error) console.warn('[Backend] Failed to save identity:', error.message);
}

export async function loadEstablishmentIdentity(establishmentId: string) {
  const { data, error } = await supabase
    .from('establishments')
    .select('ordonnateur, agent_comptable, secretaire_general')
    .eq('id', establishmentId)
    .single();
  if (error) { console.warn('[Backend] Failed to load identity:', error.message); return null; }
  return data as { ordonnateur: string; agent_comptable: string; secretaire_general: string };
}

// ── 2. COFIEPLE Snapshots (CSV data + results) ──────────────

interface SnapshotPayload {
  sde: any[];
  sde1: any[];
  sdr: any[];
  sdr1: any[];
  balance: any[];
  balance1: any[];
  fichierCharge: Record<string, boolean>;
  resultats: any;
  checkItems: any[];
  anomaliesBalance: any[];
  etablissement: any;
  budgets: any[];
}

export async function saveSnapshot(
  userId: string,
  uai: string,
  exercice: number,
  budgetType: TypeBudget,
  data: SnapshotPayload
) {
  try {
    const { error } = await supabase
      .from('cofieple_snapshots')
      .upsert({
        user_id: userId,
        uai,
        exercice,
        budget_type: budgetType,
        snapshot_data: data as any,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,uai,exercice,budget_type',
      });
    if (error) console.warn('[Backend] Snapshot save failed:', error.message);
  } catch (e) {
    console.warn('[Backend] Snapshot save exception:', e);
  }
}

export async function loadSnapshot(
  userId: string,
  uai: string,
  exercice: number,
  budgetType: TypeBudget
): Promise<SnapshotPayload | null> {
  try {
    const { data, error } = await supabase
      .from('cofieple_snapshots')
      .select('snapshot_data')
      .eq('user_id', userId)
      .eq('uai', uai)
      .eq('exercice', exercice)
      .eq('budget_type', budgetType)
      .maybeSingle();
    if (error) { console.warn('[Backend] Snapshot load failed:', error.message); return null; }
    return data?.snapshot_data as unknown as SnapshotPayload | null;
  } catch { return null; }
}

/** Load ALL snapshots for a given UAI+exercice (all budget types) */
export async function loadAllSnapshots(
  userId: string,
  uai: string,
  exercice: number
): Promise<Record<TypeBudget, SnapshotPayload | null>> {
  const result: Record<TypeBudget, SnapshotPayload | null> = {
    principal: null,
    annexe_greta: null,
    annexe_cfa: null,
    annexe_autre: null,
  };
  try {
    const { data, error } = await supabase
      .from('cofieple_snapshots')
      .select('budget_type, snapshot_data')
      .eq('user_id', userId)
      .eq('uai', uai)
      .eq('exercice', exercice);
    if (error) { console.warn('[Backend] loadAll failed:', error.message); return result; }
    for (const row of data || []) {
      const bt = row.budget_type as TypeBudget;
      if (bt in result) {
        result[bt] = row.snapshot_data as unknown as SnapshotPayload;
      }
    }
  } catch { /* silent */ }
  return result;
}

/** Save full state for all budget types at once */
export async function saveFullState(
  userId: string,
  uai: string,
  exercice: number,
  state: {
    budgets: any[];
    sde: Record<TypeBudget, any[]>;
    sde1: Record<TypeBudget, any[]>;
    sdr: Record<TypeBudget, any[]>;
    sdr1: Record<TypeBudget, any[]>;
    balance: Record<TypeBudget, any[]>;
    balance1: Record<TypeBudget, any[]>;
    fichierCharge: Record<string, boolean>;
    resultats: Record<TypeBudget, any>;
    checkItems: any[];
    anomaliesBalance: any[];
    etablissement: any;
  }
) {
  // Save one snapshot per budget type that has data
  const budgetTypes: TypeBudget[] = ['principal', 'annexe_greta', 'annexe_cfa', 'annexe_autre'];
  const promises: Promise<void>[] = [];
  
  for (const bt of budgetTypes) {
    const hasData = (state.sde[bt]?.length > 0) || (state.sdr[bt]?.length > 0) || 
                    (state.balance[bt]?.length > 0) || state.resultats[bt];
    if (hasData) {
      // Filter fichierCharge keys for this budget type
      const filteredFichiers: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(state.fichierCharge)) {
        if (k.endsWith(`_${bt}`)) filteredFichiers[k] = v;
      }
      
      promises.push(saveSnapshot(userId, uai, exercice, bt, {
        sde: state.sde[bt] || [],
        sde1: state.sde1[bt] || [],
        sdr: state.sdr[bt] || [],
        sdr1: state.sdr1[bt] || [],
        balance: state.balance[bt] || [],
        balance1: state.balance1[bt] || [],
        fichierCharge: filteredFichiers,
        resultats: state.resultats[bt],
        checkItems: bt === state.etablissement?.activeBudget ? state.checkItems : [],
        anomaliesBalance: bt === state.etablissement?.activeBudget ? state.anomaliesBalance : [],
        etablissement: state.etablissement,
        budgets: state.budgets,
      }));
    }
  }
  
  await Promise.all(promises);
}

// ── 3. Establishment Annexes ──────────────────────────────────

export async function loadEstablishmentAnnexes(supportEstablishmentId: string) {
  const { data, error } = await supabase
    .from('establishment_annexes')
    .select('*, annexe_establishment:establishments!establishment_annexes_annexe_establishment_id_fkey(*)')
    .eq('support_establishment_id', supportEstablishmentId);
  if (error) { console.warn('[Backend] Annexes load failed:', error.message); return []; }
  return data || [];
}

export async function linkAnnexeEstablishment(
  supportEstablishmentId: string,
  annexeEstablishmentId: string,
  budgetType: TypeBudget,
  compte185Solde: number = 0
) {
  const { data, error } = await supabase
    .from('establishment_annexes')
    .upsert({
      support_establishment_id: supportEstablishmentId,
      annexe_establishment_id: annexeEstablishmentId,
      budget_type: budgetType,
      compte_185_solde: compte185Solde,
    }, { onConflict: 'support_establishment_id,annexe_establishment_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function unlinkAnnexeEstablishment(annexeLinkId: string) {
  const { error } = await supabase
    .from('establishment_annexes')
    .delete()
    .eq('id', annexeLinkId);
  if (error) throw error;
}
