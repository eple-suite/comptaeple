/**
 * Synchronisation des anomalies balance vers `alertes_transverses`.
 * Idempotent grâce à `dedup_key` (m96:<year>:<compte>:<regle>).
 * Les alertes dont la condition n'est plus vérifiée sont passées en `close`.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Anomalie } from './anomaliesEngine';
import { anomaliesVersAlertes } from './anomaliesEngine';

export interface BalanceSyncReport {
  detectees: number;
  upsertees: number;
  closes: number;
  erreurs: string[];
}

export async function syncBalanceAlertes(
  anomalies: Anomalie[],
  establishmentId: string,
  year: number,
): Promise<BalanceSyncReport> {
  const report: BalanceSyncReport = { detectees: anomalies.length, upsertees: 0, closes: 0, erreurs: [] };
  if (!establishmentId) {
    report.erreurs.push('establishment_id manquant');
    return report;
  }

  const candidates = anomaliesVersAlertes(anomalies, establishmentId, year);
  const dedupKeysActives = new Set(candidates.map((c) => c.dedup_key));

  // 1) Upsert des candidates
  for (const c of candidates) {
    const { error } = await supabase
      .from('alertes_transverses')
      .upsert(
        {
          module_origine: c.module_origine,
          establishment_id: c.establishment_id,
          niveau: c.niveau,
          titre: c.titre,
          description: c.description,
          reference_reglementaire: c.reference_reglementaire,
          dedup_key: c.dedup_key,
          statut: 'ouverte',
        },
        { onConflict: 'module_origine,establishment_id,dedup_key', ignoreDuplicates: false },
      );
    if (error) report.erreurs.push(error.message);
    else report.upsertees += 1;
  }

  // 2) Clore les alertes balance ouvertes dont la condition n'est plus vraie
  const { data: ouvertes, error: errFetch } = await supabase
    .from('alertes_transverses')
    .select('id, dedup_key')
    .eq('module_origine', 'balance')
    .eq('establishment_id', establishmentId)
    .eq('statut', 'ouverte');

  if (errFetch) {
    report.erreurs.push(errFetch.message);
    return report;
  }

  const aClore = (ouvertes ?? []).filter(
    (a) => a.dedup_key && a.dedup_key.startsWith(`m96:${year}:`) && !dedupKeysActives.has(a.dedup_key),
  );
  if (aClore.length > 0) {
    const ids = aClore.map((a) => a.id);
    const { error } = await supabase
      .from('alertes_transverses')
      .update({ statut: 'close', closed_at: new Date().toISOString() })
      .in('id', ids);
    if (error) report.erreurs.push(error.message);
    else report.closes = ids.length;
  }

  return report;
}