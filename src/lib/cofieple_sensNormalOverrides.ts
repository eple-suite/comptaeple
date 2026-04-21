// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Registre des surcharges « sens normal » d'un compte
// Source de vérité : table Supabase `cofieple_comptes_sens_normal`
// Le moteur M9-6 (cofieple_m96engine) consulte ce registre EN PRIORITÉ
// avant d'appliquer les règles codées en dur.
// Règle de résolution : préfixe le plus long gagne.
// ═══════════════════════════════════════════════════════════════════

import { supabase } from '@/integrations/supabase/client';
import type { SensNormal } from './cofieple_types';

export interface SensNormalOverride {
  comptePrefix: string;
  sensNormal: SensNormal;
  graviteViolation: 'info' | 'anomalie' | 'bloquant';
  commentaire: string;
  source: string;
}

// Registre global indexé par UAI (clé '*' = règles globales sans UAI).
// Trié par longueur de préfixe décroissante pour la résolution.
const registry: Map<string, SensNormalOverride[]> = new Map();

function sortByPrefixDesc(list: SensNormalOverride[]): SensNormalOverride[] {
  return [...list].sort((a, b) => b.comptePrefix.length - a.comptePrefix.length);
}

/** Remplace l'ensemble des overrides actifs pour un UAI donné. */
export function setSensNormalOverrides(uai: string, overrides: SensNormalOverride[]): void {
  const key = (uai || '*').toUpperCase();
  registry.set(key, sortByPrefixDesc(overrides));
}

/** Vide le registre (tests / déconnexion). */
export function clearSensNormalOverrides(uai?: string): void {
  if (uai) registry.delete(uai.toUpperCase());
  else registry.clear();
}

/**
 * Cherche une surcharge applicable au compte donné, pour l'UAI courant
 * en priorité, puis les règles globales ('*'). Retourne null si aucune.
 */
export function findSensNormalOverride(
  compte: string,
  uai?: string,
): SensNormalOverride | null {
  const c = (compte || '').replace(/\s/g, '').replace(/^C\//i, '');
  if (!c) return null;

  const candidates: SensNormalOverride[] = [];
  if (uai) {
    const list = registry.get(uai.toUpperCase());
    if (list) candidates.push(...list);
  }
  const global = registry.get('*');
  if (global) candidates.push(...global);
  if (candidates.length === 0) return null;

  // Préfixe le plus long gagne. Les listes sont déjà triées localement,
  // mais on retrie pour combiner UAI + global.
  for (const o of sortByPrefixDesc(candidates)) {
    if (c.startsWith(o.comptePrefix)) return o;
  }
  return null;
}

/**
 * Charge depuis Supabase les overrides actifs pour un UAI donné et les
 * publie dans le registre. À appeler à l'ouverture d'un établissement.
 */
export async function loadSensNormalOverridesFromSupabase(uai: string): Promise<number> {
  if (!uai) return 0;
  const { data, error } = await supabase
    .from('cofieple_comptes_sens_normal')
    .select('compte_prefix, sens_normal, gravite_violation, commentaire, source, actif')
    .eq('uai', uai)
    .eq('actif', true);

  if (error) {
    console.warn('[sens_normal] chargement échoué', error);
    return 0;
  }

  const overrides: SensNormalOverride[] = (data || []).map((r) => ({
    comptePrefix: String(r.compte_prefix || '').replace(/\s/g, ''),
    sensNormal: (r.sens_normal as SensNormal) ?? 'mixte',
    graviteViolation: (r.gravite_violation as 'info' | 'anomalie' | 'bloquant') ?? 'anomalie',
    commentaire: r.commentaire || '',
    source: r.source || 'utilisateur',
  })).filter((o) => o.comptePrefix.length > 0);

  setSensNormalOverrides(uai, overrides);
  return overrides.length;
}

/** Snapshot en lecture seule (debug / UI). */
export function getRegistrySnapshot(): Record<string, SensNormalOverride[]> {
  const out: Record<string, SensNormalOverride[]> = {};
  for (const [k, v] of registry.entries()) out[k] = v;
  return out;
}