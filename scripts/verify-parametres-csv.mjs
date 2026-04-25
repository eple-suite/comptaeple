#!/usr/bin/env node
// Recette 4 — Imports CSV / mapping intelligent / déduplication
import { strict as assert } from "node:assert";

function detectDelimiter(sample) {
  const candidates = [";", ",", "\t", "|"];
  let best = ",", bestScore = -1;
  for (const d of candidates) {
    const lines = sample.split(/\r?\n/).filter((l) => l.trim()).slice(0, 10);
    if (lines.length === 0) continue;
    const counts = lines.map((l) => l.split(d).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + (b - avg) ** 2, 0) / counts.length;
    const score = avg - variance;
    if (avg > 1 && score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

const ALIAS = {
  matricule_education_nationale: ["matricule en", "matricule_en", "matricule", "men"],
  nom: ["nom", "nom usage", "last name", "lastname"],
  prenom: ["prenom", "prénom", "first name"],
  email_professionnel: ["email", "courriel", "mail", "email_pro"],
  date_naissance: ["date de naissance", "ddn", "birthdate"],
};

function suggestMapping(headers) {
  const out = {};
  for (const h of headers) {
    const norm = normalize(h);
    let found = null;
    for (const [field, list] of Object.entries(ALIAS)) {
      if (list.some((a) => normalize(a) === norm)) { found = field; break; }
    }
    out[h] = found;
  }
  return out;
}

function dedupKey(row) {
  if (row.matricule_education_nationale) return `mat:${row.matricule_education_nationale}`;
  if (row.nom && row.prenom && row.date_naissance) return `npd:${row.nom}|${row.prenom}|${row.date_naissance}`;
  return null;
}

let pass = 0, fail = 0;
function t(n, fn) { try { fn(); console.log("  ✓", n); pass++; } catch (e) { console.error("  ✗", n, "—", e.message); fail++; } }

console.log("\n=== Recette IMPORT CSV ===");

t("Détection point-virgule (Excel FR)", () => {
  assert.equal(detectDelimiter("a;b;c\n1;2;3\n4;5;6"), ";");
});

t("Détection virgule (CSV anglo-saxon)", () => {
  assert.equal(detectDelimiter("a,b,c\n1,2,3\n4,5,6"), ",");
});

t("Détection tabulation", () => {
  assert.equal(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");
});

t("Mapping alias FR (Matricule EN → matricule_education_nationale)", () => {
  const m = suggestMapping(["Matricule EN", "Nom", "Prénom"]);
  assert.equal(m["Matricule EN"], "matricule_education_nationale");
  assert.equal(m["Nom"], "nom");
  assert.equal(m["Prénom"], "prenom");
});

t("Mapping alias EN (First name → prenom, Email → email_professionnel)", () => {
  const m = suggestMapping(["First name", "Last name", "Email"]);
  assert.equal(m["First name"], "prenom");
  assert.equal(m["Last name"], "nom");
  assert.equal(m["Email"], "email_professionnel");
});

t("Headers inconnus → null", () => {
  const m = suggestMapping(["xyz123", "champ_inutile"]);
  assert.equal(m["xyz123"], null);
  assert.equal(m["champ_inutile"], null);
});

t("Déduplication par matricule EN", () => {
  assert.equal(dedupKey({ matricule_education_nationale: "12345" }), "mat:12345");
});

t("Déduplication par nom + prénom + DDN", () => {
  const k = dedupKey({ nom: "Dupont", prenom: "Jean", date_naissance: "1980-01-01" });
  assert.equal(k, "npd:Dupont|Jean|1980-01-01");
});

t("Pas de clé si données insuffisantes", () => {
  assert.equal(dedupKey({ nom: "Dupont" }), null);
});

t("Normalisation insensible aux accents", () => {
  assert.equal(normalize("Prénom"), "prenom");
  assert.equal(normalize("Téléphone"), "telephone");
});

console.log(`\nRésultat CSV : ${pass} OK / ${fail} KO`);
process.exit(fail === 0 ? 0 : 1);