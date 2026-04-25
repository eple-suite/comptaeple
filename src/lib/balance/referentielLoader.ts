/**
 * Charge le référentiel `comptes_sens_normal_ref` depuis Supabase.
 * Fallback : référentiel embarqué en cas d'erreur réseau / hors-ligne.
 */

import { supabase } from '@/integrations/supabase/client';
import type { CompteRef, NiveauAlerte, SensNormal, TypeCompte } from './referentielTypes';
import { REFERENTIEL_FALLBACK } from './referentielFallback';

let cache: CompteRef[] | null = null;
let lastLoad = 0;
const TTL_MS = 5 * 60 * 1000;

export async function loadReferentiel(force = false): Promise<CompteRef[]> {
  const now = Date.now();
  if (!force && cache && (now - lastLoad) < TTL_MS) return cache;

  const { data, error } = await supabase
    .from('comptes_sens_normal_ref' as any)
    .select('*')
    .eq('actif', true)
    .order('compte');

  if (error || !data) {
    console.warn('[balance] référentiel : fallback embarqué', error);
    cache = REFERENTIEL_FALLBACK;
    lastLoad = now;
    return cache;
  }
  cache = (data as any[]).map((r) => ({
    compte: r.compte,
    libelle: r.libelle,
    classe: r.classe,
    sous_classe: r.sous_classe,
    sens_normal: r.sens_normal as SensNormal,
    sens_cloture: r.sens_cloture as SensNormal,
    despecialisable: r.despecialisable,
    type_compte: r.type_compte as TypeCompte,
    niveau_alerte_si_anormal: r.niveau_alerte_si_anormal as NiveauAlerte,
    message_alerte: r.message_alerte ?? '',
    cause_probable: r.cause_probable ?? '',
    action_corrective: r.action_corrective ?? '',
    reference_m96: r.reference_m96 ?? '',
    actif: r.actif,
  }));
  lastLoad = now;
  return cache;
}

export function clearReferentielCache(): void {
  cache = null;
  lastLoad = 0;
}