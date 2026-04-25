#!/usr/bin/env node
// Exécute tous les scripts vitest et .mjs de recette puis produit un rapport JSON + Markdown.
import { execSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const scripts = readdirSync(here)
  .filter((f) => f.startsWith("verify-") && (f.endsWith(".test.ts") || f.endsWith(".test.mjs") || f.endsWith(".mjs")))
  .sort();

const results = [];
const t0 = Date.now();
for (const s of scripts) {
  const start = Date.now();
  let exit = 0; let stdout = ""; let stderr = "";
  try {
    if (s.endsWith(".test.ts") || s.endsWith(".test.mjs")) {
      stdout = execSync(`bunx vitest run scripts/${s}`, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    } else {
      stdout = execSync(`node scripts/${s}`, { cwd: root, encoding: "utf8" });
    }
  } catch (e) {
    exit = e.status ?? 1;
    stdout = (e.stdout?.toString?.() ?? "") + (e.stderr?.toString?.() ?? "");
    stderr = e.message ?? "";
  }
  const dur = Date.now() - start;
  results.push({ script: s, exit, duration_ms: dur, stdout_tail: stdout.split("\n").slice(-6).join("\n") });
  process.stdout.write(`${exit === 0 ? "✓" : "✗"} ${s} (${dur} ms)\n`);
}
const total = Date.now() - t0;
const ok = results.filter((r) => r.exit === 0).length;
const ko = results.length - ok;

writeFileSync(resolve(root, "docs/AUDIT_RECETTE.json"), JSON.stringify({ total_ms: total, ok, ko, results }, null, 2));
const md = [
  "# AUDIT_RECETTE — Matrice d'exécution",
  ``,
  `Date : ${new Date().toISOString()}`,
  `Total scripts : ${results.length} · OK : ${ok} · KO : ${ko} · Durée : ${(total/1000).toFixed(1)} s`,
  ``,
  `| Script | Exit | Durée (ms) |`,
  `|---|---|---|`,
  ...results.map((r) => `| ${r.script} | ${r.exit === 0 ? "✅ 0" : `❌ ${r.exit}`} | ${r.duration_ms} |`),
].join("\n");
writeFileSync(resolve(root, "docs/AUDIT_RECETTE.md"), md);
process.exit(ko > 0 ? 1 : 0);