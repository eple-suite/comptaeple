#!/usr/bin/env node
// Vérifie la migration imports_historique : table, enums, RLS, trigger, bucket
import fs from 'node:fs';
import path from 'node:path';

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { failed += 1; console.error(`  ✗ ${m}`); };

console.log('═══ VERIFY IMPORTS HISTORIQUE MIGRATION ═══');

const dir = 'supabase/migrations';
const files = fs.readdirSync(dir).map((f) => path.join(dir, f));
const target = files.find((f) => fs.readFileSync(f, 'utf8').includes('CREATE TABLE IF NOT EXISTS public.imports_historique'));
target ? ok(`migration trouvée : ${path.basename(target)}`) : ko('migration imports_historique introuvable');

if (target) {
  const sql = fs.readFileSync(target, 'utf8');
  for (const needle of [
    'CREATE TYPE public.import_file_type AS ENUM',
    'CREATE TYPE public.import_status AS ENUM',
    'CREATE TABLE IF NOT EXISTS public.imports_historique',
    'ALTER TABLE public.imports_historique ENABLE ROW LEVEL SECURITY',
    'user_has_establishment_access',
    'imports_historique_archive_previous',
    'CREATE TRIGGER trg_imports_historique_archive_previous',
    "INSERT INTO storage.buckets",
    "'imports-archive'",
    'fichier_original_path',
    'hash_sha256',
    'totaux_json',
    'anomalies_json',
    'ecart_vs_precedent_json',
    'uai_detecte',
  ]) {
    sql.includes(needle) ? ok(`SQL contient : ${needle}`) : ko(`SQL manquant : ${needle}`);
  }
}

// Service côté front
const svc = fs.readFileSync('src/lib/import/importService.ts', 'utf8');
for (const sym of ['persistImport', 'listHistorique', 'getArchivedFileUrl', 'imports-archive', 'sha256Hex']) {
  svc.includes(sym) ? ok(`service expose : ${sym}`) : ko(`service manque : ${sym}`);
}

console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : `\n❌ ${failed} échec(s)`);
process.exit(failed === 0 ? 0 : 1);