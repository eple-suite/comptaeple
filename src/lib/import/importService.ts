// ═══════════════════════════════════════════════════════════════
// SERVICE D'IMPORT — persistance, archivage, versioning
// Utilise la table imports_historique + bucket imports-archive
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/integrations/supabase/client';
import { sha256Hex } from './textUtils';
import type { ImportFileType } from './fileTypeDetector';

export interface PersistImportInput {
  establishmentId: string;
  type: ImportFileType;
  file: File;
  periodeDebut?: Date | null;
  periodeFin?: Date | null;
  uaiDetecte?: string | null;
  totaux?: Record<string, unknown>;
  anomalies?: unknown[];
  ecartVsPrecedent?: Record<string, unknown>;
  commentaire?: string;
}

export interface PersistImportResult {
  id: string;
  storagePath: string | null;
  ecraseCount: number;
}

/**
 * Persiste un import :
 *  1. archive le fichier original dans imports-archive
 *  2. insère une ligne imports_historique (le trigger marque
 *     les précédents identiques comme "ecrase")
 */
export async function persistImport(input: PersistImportInput): Promise<PersistImportResult> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Authentification requise pour archiver l'import.");
  const userId = userData.user.id;

  const buffer = await input.file.arrayBuffer();
  const hash = await sha256Hex(buffer);

  // Chemin storage : {userId}/{etabId}/{type}/{timestamp}_{hash8}_{filename}
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const path = `${userId}/${input.establishmentId}/${input.type}/${Date.now()}_${hash.slice(0, 8)}_${safeName}`;

  let storagePath: string | null = null;
  try {
    const { error: upErr } = await supabase.storage
      .from('imports-archive')
      .upload(path, input.file, {
        contentType: input.file.type || 'application/octet-stream',
        upsert: false,
      });
    if (!upErr) storagePath = path;
  } catch {
    // archivage best-effort : on continue même si l'upload échoue
    storagePath = null;
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('imports_historique')
    .insert({
      establishment_id: input.establishmentId,
      type_import: input.type,
      filename: input.file.name,
      taille_octets: input.file.size,
      hash_sha256: hash,
      periode_debut: input.periodeDebut ? input.periodeDebut.toISOString().slice(0, 10) : null,
      periode_fin: input.periodeFin ? input.periodeFin.toISOString().slice(0, 10) : null,
      importe_par: userId,
      statut: 'succes',
      totaux_json: (input.totaux ?? {}) as never,
      anomalies_json: (input.anomalies ?? []) as never,
      ecart_vs_precedent_json: (input.ecartVsPrecedent ?? {}) as never,
      fichier_original_path: storagePath,
      uai_detecte: input.uaiDetecte ?? null,
      commentaire: input.commentaire ?? null,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) throw new Error(insertErr?.message ?? 'Échec insertion historique.');

  // Compter les "écrasés" produits par le trigger (pour info UI)
  const { count } = await supabase
    .from('imports_historique')
    .select('id', { count: 'exact', head: true })
    .eq('establishment_id', input.establishmentId)
    .eq('type_import', input.type)
    .eq('statut', 'ecrase');

  return {
    id: inserted.id,
    storagePath,
    ecraseCount: count ?? 0,
  };
}

export interface HistoriqueRow {
  id: string;
  type_import: ImportFileType;
  filename: string;
  date_import: string;
  date_edition_fichier: string | null;
  periode_debut: string | null;
  periode_fin: string | null;
  statut: 'succes' | 'ecrase' | 'echec';
  totaux_json: Record<string, unknown> | null;
  anomalies_json: unknown[] | null;
  fichier_original_path: string | null;
  uai_detecte: string | null;
  commentaire: string | null;
  taille_octets: number;
}

export async function listHistorique(
  establishmentId: string,
  options: { limit?: number; type?: ImportFileType } = {},
): Promise<HistoriqueRow[]> {
  let q = supabase
    .from('imports_historique')
    .select('id,type_import,filename,date_import,date_edition_fichier,periode_debut,periode_fin,statut,totaux_json,anomalies_json,fichier_original_path,uai_detecte,commentaire,taille_octets')
    .eq('establishment_id', establishmentId)
    .order('date_import', { ascending: false })
    .limit(options.limit ?? 100);

  if (options.type) q = q.eq('type_import', options.type);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as HistoriqueRow[];
}

/**
 * Génère une URL signée temporaire pour retélécharger un fichier
 * archivé. Valide 5 minutes.
 */
export async function getArchivedFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('imports-archive')
    .createSignedUrl(path, 300);
  if (error) return null;
  return data?.signedUrl ?? null;
}