// ═══════════════════════════════════════════════════════════════
// Imports CSV/XLSX universels (chantier 6)
// Détection délimiteur, encodage, mapping intelligent, doublons.
// ═══════════════════════════════════════════════════════════════

export interface ImportRow {
  [k: string]: string;
}

export interface ImportPreview {
  headers: string[];
  rows: ImportRow[];
  detectedDelimiter: string;
  detectedEncoding: "utf-8" | "windows-1252";
  mapping: Record<string, string | null>;
}

export type ImportTarget = "agents" | "establishments" | "bottin" | "delegations";

/** Champs cibles connus + alias FR/EN courants. */
const ALIAS_AGENTS: Record<string, string[]> = {
  matricule_education_nationale: ["matricule en", "matricule_en", "matricule", "men"],
  nom_naissance: ["nom de naissance", "nom_naissance"],
  nom: ["nom", "nom usage", "nom_usage", "last name", "lastname", "name"],
  prenom: ["prenom", "prénom", "first name", "firstname"],
  email_professionnel: ["email", "courriel", "mail", "email_pro", "email_professionnel"],
  telephone_professionnel: ["telephone", "téléphone", "tel", "tel pro"],
  date_naissance: ["date de naissance", "date_naissance", "birthdate", "ddn"],
  corps: ["corps"],
  grade: ["grade", "grade détaillé"],
  echelon: ["echelon", "échelon"],
  indice_majore: ["indice majoré", "indice", "im"],
  statut: ["statut"],
  role_principal: ["role", "rôle", "fonction principale", "role_principal"],
  fonction: ["fonction", "poste", "job"],
};

const ALIAS_ETAB: Record<string, string[]> = {
  uai: ["uai", "rne", "code etab", "code_etablissement", "identifiant"],
  name: ["nom", "nom_etablissement", "etablissement", "name"],
  type: ["type", "type_etablissement"],
  city: ["commune", "ville", "city"],
  adresse_ligne_1: ["adresse", "adresse 1", "adresse_ligne_1"],
  code_postal: ["cp", "code postal", "code_postal", "zip"],
  telephone: ["telephone", "tel", "téléphone"],
  email_secretariat: ["email", "courriel", "email_secretariat"],
  siret: ["siret"],
  nb_eleves_total: ["effectif", "nb eleves", "nb_eleves_total", "eleves"],
};

function getAliasFor(target: ImportTarget): Record<string, string[]> {
  switch (target) {
    case "agents": return ALIAS_AGENTS;
    case "establishments": return ALIAS_ETAB;
    default: return {};
  }
}

/** Détecte le délimiteur le plus probable. */
export function detectDelimiter(sample: string): string {
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestScore = -1;
  for (const d of candidates) {
    const lines = sample.split(/\r?\n/).filter((l) => l.trim()).slice(0, 10);
    if (lines.length === 0) continue;
    const counts = lines.map((l) => splitCsvLine(l, d).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + (b - avg) ** 2, 0) / counts.length;
    // on veut beaucoup de colonnes ET peu de variance
    const score = avg - variance;
    if (avg > 1 && score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** Parse une ligne CSV avec respect des guillemets. */
function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Parse un texte CSV complet. */
export function parseCsv(text: string, delim?: string): { headers: string[]; rows: ImportRow[]; delim: string } {
  // BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const d = delim ?? detectDelimiter(text.slice(0, 4000));
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [], delim: d };
  const headers = splitCsvLine(lines[0], d).map((h) => h.trim());
  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCsvLine(lines[i], d);
    const row: ImportRow = {};
    headers.forEach((h, j) => { row[h] = vals[j] ?? ""; });
    rows.push(row);
  }
  return { headers, rows, delim: d };
}

/** Mapping intelligent : pour chaque header source, suggère un champ cible. */
export function suggestMapping(headers: string[], target: ImportTarget): Record<string, string | null> {
  const aliases = getAliasFor(target);
  const out: Record<string, string | null> = {};
  for (const h of headers) {
    const norm = normalize(h);
    let found: string | null = null;
    for (const [field, aliasList] of Object.entries(aliases)) {
      if (aliasList.some((a) => normalize(a) === norm)) {
        found = field;
        break;
      }
    }
    out[h] = found;
  }
  return out;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Construit un preview à partir d'un fichier texte. */
export function buildPreview(text: string, target: ImportTarget): ImportPreview {
  const { headers, rows, delim } = parseCsv(text);
  const mapping = suggestMapping(headers, target);
  return {
    headers,
    rows: rows.slice(0, 10),
    detectedDelimiter: delim,
    detectedEncoding: text.includes("Ã") ? "windows-1252" : "utf-8",
    mapping,
  };
}

export interface ImportReport {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export function emptyReport(): ImportReport {
  return { total: 0, created: 0, updated: 0, skipped: 0, errors: [] };
}

/** Détection de doublon — clé selon cible. */
export function getDedupKey(target: ImportTarget, row: any): string | null {
  if (target === "agents") {
    if (row.matricule_education_nationale) return `mat:${row.matricule_education_nationale}`;
    if (row.nom && row.prenom && row.date_naissance) return `npd:${row.nom}|${row.prenom}|${row.date_naissance}`;
    return null;
  }
  if (target === "establishments") {
    if (row.uai) return `uai:${String(row.uai).toUpperCase()}`;
    return null;
  }
  return null;
}

/** Génère un modèle CSV vide pour téléchargement. */
export function buildCsvTemplate(target: ImportTarget): string {
  const headers: Record<ImportTarget, string[]> = {
    agents: ["matricule_education_nationale","nom","prenom","date_naissance","statut","corps","grade","echelon","indice_majore","email_professionnel","telephone_professionnel","role_principal","fonction"],
    establishments: ["uai","name","type","adresse_ligne_1","code_postal","city","telephone","email_secretariat","siret","nb_eleves_total"],
    bottin: ["categorie","organisme","correspondant_nom","fonction","email","telephone","adresse","notes"],
    delegations: ["agent_delegant","agent_delegataire","type_delegation","perimetre","montant_max","date_debut","date_fin"],
  };
  return headers[target].join(";") + "\n";
}

export function downloadCsvTemplate(target: ImportTarget): void {
  const blob = new Blob([buildCsvTemplate(target)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `modele-${target}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}