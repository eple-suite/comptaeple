// =====================================================================
// GENERATEUR DE RAPPORT CI — Diagnostic financier EPLE
// ---------------------------------------------------------------------
// Exécute les recettes et vérifications, capture leur sortie, et produit :
//   - reports/ci-report.json   (machine-readable)
//   - reports/ci-report.html   (human-readable, archivable)
//
// Exit 0 si toutes les étapes passent, 1 sinon.
// Utilisé en local (npm run report:ci) et en CI (uploadé en artefact).
// =====================================================================

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPORT_DIR = resolve(ROOT, 'reports');
mkdirSync(REPORT_DIR, { recursive: true });

// ---------------------------------------------------------------------
// Étapes à exécuter (ordre identique au workflow CI)
// ---------------------------------------------------------------------
const STEPS = [
  {
    id: 'tsc',
    titre: 'Vérification TypeScript (tsc --noEmit)',
    cmd: 'npx',
    args: ['tsc', '--noEmit'],
    categorie: 'Typage',
  },
  {
    id: 'recette-diagnostic',
    titre: 'Recette — Diagnostic financier (3 scénarios + invariants)',
    cmd: 'npx',
    args: ['tsx', 'scripts/recette-diagnostic-financier.mjs'],
    categorie: 'Recette métier',
  },
  {
    id: 'verify-bilan',
    titre: 'Vérification — Bilan & indicateurs réglementaires',
    cmd: 'npx',
    args: ['tsx', 'scripts/verify-bilan-reprofi.mjs'],
    categorie: 'Recette métier',
  },
  {
    id: 'verify-commentaires',
    titre: 'Vérification — Moteur de commentaires automatiques',
    cmd: 'npx',
    args: ['tsx', 'scripts/verify-commentaires-engine.mjs'],
    categorie: 'Recette métier',
  },
  {
    id: 'verify-sde-sdr',
    titre: 'Vérification — Import SDE / SDR Op@le',
    cmd: 'npx',
    args: ['tsx', 'scripts/verify-sde-sdr-import.mjs'],
    categorie: 'Imports',
  },
  {
    id: 'verify-entretiens-circuit',
    titre: 'Vérification — Circuit signatures entretiens (décret 2010-888)',
    cmd: 'npx',
    args: ['tsx', 'scripts/verify-entretiens-circuit.mjs'],
    categorie: 'Entretiens professionnels',
  },
  {
    id: 'verify-entretiens-ia',
    titre: 'Vérification — Schéma IA répartition entretiens',
    cmd: 'npx',
    args: ['tsx', 'scripts/verify-entretiens-ia-schema.mjs'],
    categorie: 'Entretiens professionnels',
  },
  {
    id: 'verify-entretiens-wizard',
    titre: 'Recette — Wizard nouvel entretien (7 étapes)',
    cmd: 'npx',
    args: ['tsx', 'scripts/verify-entretiens-wizard.mjs'],
    categorie: 'Entretiens professionnels',
  },
];

// ---------------------------------------------------------------------
// Compteurs globaux d'assertions (extraits depuis stdout)
// ---------------------------------------------------------------------
function compterAssertions(stdout) {
  const ok = (stdout.match(/✅/g) || []).length;
  const ko = (stdout.match(/❌/g) || []).length;
  return { ok, ko };
}

function extraireScenarios(stdout) {
  // Détecte les blocs "SCÉNARIO X — TITRE" dans la recette principale
  const lignes = stdout.split('\n');
  const scenarios = [];
  let courant = null;
  for (const l of lignes) {
    const m = l.match(/^SCÉNARIO\s+(\d+)\s+—\s+(.+)$/);
    if (m) {
      if (courant) scenarios.push(courant);
      courant = { numero: Number(m[1]), titre: m[2].trim(), assertions: [] };
      continue;
    }
    const okM = l.match(/^\s+✅\s+(.+)$/);
    const koM = l.match(/^\s+❌\s+(.+)$/);
    if (courant && okM) courant.assertions.push({ ok: true, label: okM[1].trim() });
    if (courant && koM) courant.assertions.push({ ok: false, label: koM[1].trim() });
  }
  if (courant) scenarios.push(courant);
  return scenarios;
}

// ---------------------------------------------------------------------
// Exécution d'une étape
// ---------------------------------------------------------------------
function executerEtape(step) {
  process.stdout.write(`▶ ${step.titre}\n`);
  const t0 = Date.now();
  const res = spawnSync(step.cmd, step.args, {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const duree = Date.now() - t0;
  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  const code = res.status ?? -1;
  const ok = code === 0;
  const compteurs = compterAssertions(stdout);

  process.stdout.write(`  ${ok ? '✓' : '✗'} exit=${code}  assertions=${compteurs.ok}/${compteurs.ok + compteurs.ko}  durée=${duree} ms\n\n`);

  return {
    id: step.id,
    titre: step.titre,
    categorie: step.categorie,
    commande: `${step.cmd} ${step.args.join(' ')}`,
    exitCode: code,
    success: ok,
    dureeMs: duree,
    assertions: compteurs,
    scenarios: step.id === 'recette-diagnostic' ? extraireScenarios(stdout) : [],
    stdout: stdout.slice(-12000), // borné pour éviter rapports géants
    stderr: stderr.slice(-4000),
  };
}

// ---------------------------------------------------------------------
// Génération HTML
// ---------------------------------------------------------------------
function genererHtml(rapport) {
  const echappeur = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const styleGlobal = `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
           margin: 0; padding: 32px; background: #f7f8fa; color: #1f2937; line-height: 1.55; }
    h1 { margin: 0 0 8px; font-size: 28px; color: #0f172a; }
    h2 { margin: 32px 0 12px; font-size: 20px; color: #0f172a;
         border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px; margin: 16px 0 24px; }
    .meta div { background: white; border: 1px solid #e5e7eb; border-radius: 8px;
                padding: 12px 16px; }
    .meta strong { display: block; font-size: 11px; text-transform: uppercase;
                   letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    .verdict { padding: 16px 20px; border-radius: 10px; margin: 16px 0;
               font-weight: 600; font-size: 15px; }
    .verdict.success { background: #dcfce7; color: #14532d; border: 1px solid #86efac; }
    .verdict.error   { background: #fee2e2; color: #7f1d1d; border: 1px solid #fca5a5; }
    table { width: 100%; border-collapse: collapse; background: white;
            border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    th { background: #f8fafc; font-weight: 600; color: #334155; font-size: 12px;
         text-transform: uppercase; letter-spacing: 0.04em; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px;
             font-size: 12px; font-weight: 600; }
    .badge.ok { background: #dcfce7; color: #14532d; }
    .badge.ko { background: #fee2e2; color: #7f1d1d; }
    details { background: white; border: 1px solid #e5e7eb; border-radius: 8px;
              padding: 12px 16px; margin-bottom: 12px; }
    details summary { cursor: pointer; font-weight: 600; color: #0f172a; }
    pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px;
          overflow-x: auto; font-size: 12px; line-height: 1.5; max-height: 480px; }
    .scenario { background: white; border: 1px solid #e5e7eb; border-radius: 8px;
                padding: 16px 20px; margin-bottom: 12px; }
    .scenario h3 { margin: 0 0 8px; font-size: 15px; color: #0f172a; }
    .scenario ul { margin: 0; padding-left: 20px; }
    .scenario li.ok { color: #14532d; }
    .scenario li.ko { color: #7f1d1d; font-weight: 600; }
    footer { margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; }
  `;

  const verdictClass = rapport.success ? 'success' : 'error';
  const verdictTexte = rapport.success
    ? `✅ Recette CI validée — ${rapport.totaux.assertionsOk} assertions sur ${rapport.totaux.assertions}, aucune régression détectée.`
    : `❌ Recette CI en échec — ${rapport.totaux.etapesEchec} étape(s) en erreur, ${rapport.totaux.assertionsKo} assertion(s) KO.`;

  const lignesEtapes = rapport.etapes.map(e => `
    <tr>
      <td>${echappeur(e.categorie)}</td>
      <td>${echappeur(e.titre)}</td>
      <td><span class="badge ${e.success ? 'ok' : 'ko'}">${e.success ? 'OK' : 'KO'}</span></td>
      <td>${e.assertions.ok} / ${e.assertions.ok + e.assertions.ko}</td>
      <td>${e.dureeMs} ms</td>
      <td><code>exit ${e.exitCode}</code></td>
    </tr>`).join('');

  const blocsScenarios = rapport.etapes
    .filter(e => e.scenarios && e.scenarios.length)
    .flatMap(e => e.scenarios.map(s => `
      <div class="scenario">
        <h3>Scénario ${s.numero} — ${echappeur(s.titre)}</h3>
        <ul>${s.assertions.map(a =>
          `<li class="${a.ok ? 'ok' : 'ko'}">${a.ok ? '✅' : '❌'} ${echappeur(a.label)}</li>`
        ).join('')}</ul>
      </div>`)).join('');

  const blocsLogs = rapport.etapes.map(e => `
    <details>
      <summary>${echappeur(e.titre)} — sortie console</summary>
      <pre>${echappeur(e.stdout || '(vide)')}</pre>
      ${e.stderr ? `<strong>stderr :</strong><pre>${echappeur(e.stderr)}</pre>` : ''}
    </details>`).join('');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Rapport de recette CI — Diagnostic financier EPLE</title>
<style>${styleGlobal}</style>
</head>
<body>
  <h1>Rapport de recette CI — Diagnostic financier EPLE</h1>
  <p>Conformité M9-6 tomes 3 &amp; 4 art. 43231 · Op@le pièce 14</p>

  <div class="verdict ${verdictClass}">${verdictTexte}</div>

  <div class="meta">
    <div><strong>Généré le</strong>${echappeur(rapport.genere)}</div>
    <div><strong>Commit</strong>${echappeur(rapport.git.sha || 'local')}</div>
    <div><strong>Branche</strong>${echappeur(rapport.git.ref || 'local')}</div>
    <div><strong>Node</strong>${echappeur(rapport.environnement.node)}</div>
    <div><strong>Étapes</strong>${rapport.totaux.etapesOk}/${rapport.etapes.length} OK</div>
    <div><strong>Assertions</strong>${rapport.totaux.assertionsOk}/${rapport.totaux.assertions} OK</div>
    <div><strong>Durée totale</strong>${rapport.totaux.dureeMs} ms</div>
  </div>

  <h2>Synthèse des étapes</h2>
  <table>
    <thead><tr>
      <th>Catégorie</th><th>Étape</th><th>Statut</th><th>Assertions</th><th>Durée</th><th>Code</th>
    </tr></thead>
    <tbody>${lignesEtapes}</tbody>
  </table>

  ${blocsScenarios ? `<h2>Détail des scénarios métier</h2>${blocsScenarios}` : ''}

  <h2>Sorties détaillées</h2>
  ${blocsLogs}

  <footer>
    Rapport généré automatiquement par <code>scripts/generate-ci-report.mjs</code> ·
    COFI-EPLE · Diagnostic financier conforme M9-6
  </footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------
function main() {
  const t0 = Date.now();
  const etapes = STEPS.map(executerEtape);
  const dureeMs = Date.now() - t0;

  const totaux = {
    etapesOk: etapes.filter(e => e.success).length,
    etapesEchec: etapes.filter(e => !e.success).length,
    assertions: etapes.reduce((s, e) => s + e.assertions.ok + e.assertions.ko, 0),
    assertionsOk: etapes.reduce((s, e) => s + e.assertions.ok, 0),
    assertionsKo: etapes.reduce((s, e) => s + e.assertions.ko, 0),
    dureeMs,
  };

  const rapport = {
    genere: new Date().toISOString(),
    success: totaux.etapesEchec === 0,
    git: {
      sha: process.env.GITHUB_SHA || '',
      ref: process.env.GITHUB_REF_NAME || '',
      runId: process.env.GITHUB_RUN_ID || '',
      runUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : '',
    },
    environnement: {
      node: process.version,
      plateforme: process.platform,
    },
    totaux,
    etapes,
  };

  const jsonPath = resolve(REPORT_DIR, 'ci-report.json');
  const htmlPath = resolve(REPORT_DIR, 'ci-report.html');
  writeFileSync(jsonPath, JSON.stringify(rapport, null, 2), 'utf-8');
  writeFileSync(htmlPath, genererHtml(rapport), 'utf-8');

  process.stdout.write('═'.repeat(70) + '\n');
  process.stdout.write(`Rapport JSON : ${jsonPath}\n`);
  process.stdout.write(`Rapport HTML : ${htmlPath}\n`);
  process.stdout.write(
    `Bilan : ${totaux.etapesOk}/${etapes.length} étapes, ` +
    `${totaux.assertionsOk}/${totaux.assertions} assertions, ` +
    `${(dureeMs / 1000).toFixed(1)} s\n`,
  );
  process.stdout.write('═'.repeat(70) + '\n');

  process.exit(rapport.success ? 0 : 1);
}

main();
