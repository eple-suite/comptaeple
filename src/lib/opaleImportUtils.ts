type SheetCell = string | number | boolean | null | undefined;

type SheetMatrix = SheetCell[][];

export function normalizeColumnName(name: string): string {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim();
}

function cleanHeaderLabel(label: string): string {
  return label
    .replace(/^somme de\s+/i, '')
    .replace(/^affichage\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map((h) => normalizeColumnName(h));
  const normalizedNames = possibleNames.map((n) => normalizeColumnName(n));

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.indexOf(name);
    if (idx !== -1) return idx;
  }

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.findIndex((h) => h.startsWith(name));
    if (idx !== -1) return idx;
  }

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.findIndex((h) => h.includes(name));
    if (idx !== -1) return idx;
  }

  return -1;
}

function scoreHeaderRow(cells: string[]): number {
  const normalized = cells.map((c) => normalizeColumnName(c));
  const nonEmpty = normalized.filter(Boolean).length;
  if (nonEmpty < 2) return -1;

  let score = nonEmpty >= 5 ? 2 : 0;

  const scoreTerms: Array<[string, number]> = [
    ['compte', 4],
    ['compte et intitule', 5],
    ['service', 3],
    ['domaine', 2],
    ['activite', 2],
    ['budget', 2],
    ['aor', 4],
    ['extourne', 4],
    ['realise', 2],
    ['disponible', 3],
    ['en cours', 2],
    ['debit', 3],
    ['credit', 3],
    ['solde', 3],
    ['anterieur', 3],
    ['poste', 2],
  ];

  for (const [term, value] of scoreTerms) {
    if (normalized.some((c) => c.includes(term))) score += value;
  }

  return score;
}

function toStringCell(value: SheetCell): string {
  if (value == null) return '';
  return String(value).trim();
}

function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((raw, index) => {
    const base = cleanHeaderLabel(raw) || `col_${index + 1}`;
    const key = normalizeColumnName(base) || `col_${index + 1}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export function buildRowsFromSheetMatrix(matrix: SheetMatrix): Record<string, string>[] {
  if (!matrix.length) return [];

  const rows = matrix.map((row) => row.map(toStringCell));
  const sampleLimit = Math.min(rows.length, 30);

  let headerRowIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < sampleLimit; i++) {
    const score = scoreHeaderRow(rows[i]);
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  if (bestScore < 2) {
    const fallback = rows.findIndex((r) => r.filter(Boolean).length >= 2);
    headerRowIndex = fallback >= 0 ? fallback : 0;
  }

  const headers = dedupeHeaders(rows[headerRowIndex] || []);
  const dataStart = headerRowIndex + 1;

  return rows
    .slice(dataStart)
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] ?? '';
      });
      return record;
    });
}
