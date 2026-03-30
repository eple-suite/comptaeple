type SheetCell = string | number | boolean | null | undefined;

type SheetMatrix = SheetCell[][];

export type OpaleAmountMetric = 'budget' | 'engagé' | 'réalisé' | 'en cours' | 'disponible' | 'aor' | 'extourne' | '+values/-values';

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

export function extractIndexedColumnNumber(header: string, prefix: 'montant colonne' | 'colonne'): number | null {
  const normalized = normalizeColumnName(header);
  if (!normalized.startsWith(prefix)) return null;
  const suffix = normalized.slice(prefix.length).trim();
  const match = suffix.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function isLikelyNumericCell(value: string): boolean {
  const v = String(value ?? '').trim();
  if (!v) return false;
  const cleaned = v
    .replace(/[\s\u00A0]/g, '')
    .replace(/[€%]/g, '')
    .replace(/\((.*)\)/, '-$1')
    .replace(',', '.');
  return /^-?\d+(?:\.\d+)?$/.test(cleaned);
}

export function detectOpaleAmountMetric(label: string): OpaleAmountMetric | '' {
  const d = normalizeColumnName(label);
  if (!d) return '';

  if (
    d.includes('budget') ||
    d.includes('prevision') ||
    d.includes('credits ouverts') ||
    d.includes('credit ouverts') ||
    d.includes('dotation') ||
    d.includes('credits votes') ||
    d.includes('credit votes') ||
    d.includes('credits initiaux') ||
    d.includes('credit initiaux') ||
    d.includes('budgetise') ||
    d.includes('montant budgetise') ||
    d === 'bi'
  ) return 'budget';

  if (d.includes('engag')) return 'engagé';

  if (
    d.includes('realise') ||
    d.includes('mandate') ||
    d.includes('liquide') ||
    d.includes('montant net') ||
    d.includes('net des depenses') ||
    d.includes('net des recettes') ||
    d.includes('depenses nettes') ||
    d.includes('recettes nettes')
  ) return 'réalisé';

  if (d.includes('en cours')) return 'en cours';
  if (d.includes('disponible')) return 'disponible';
  if (d.includes('aor') || d.includes('emis') || d.includes('titre')) return 'aor';
  if (d.includes('extourne')) return 'extourne';
  if (d.includes('value') || d.includes('+/-') || d.includes('plus value')) return '+values/-values';

  return '';
}

function extractCgrCode(value: string): string {
  const v = String(value || '').trim();
  if (!v || v === '-') return '';
  return (v.split('-')[0] || v).replace(/\s+/g, ' ').trim();
}

export function normalizeRowsForOpaleImport(rows: Record<string, string>[]): Record<string, string>[] {
  if (!rows.length) return rows;

  const headers = Object.keys(rows[0]);
  const amountHeaders = headers.filter((h) => extractIndexedColumnNumber(h, 'montant colonne') !== null);
  if (amountHeaders.length === 0) return rows;

  const metricByAmountHeader = new Map<string, OpaleAmountMetric>();

  for (const amountHeader of amountHeaders) {
    const idx = extractIndexedColumnNumber(amountHeader, 'montant colonne');
    if (idx == null) continue;

    const descriptorHeader = headers.find((h) => extractIndexedColumnNumber(h, 'colonne') === idx);
    const descriptorCandidates: string[] = [];
    const headerTail = amountHeader.split('|').slice(1).join(' ').trim();
    if (headerTail) descriptorCandidates.push(headerTail);
    if (descriptorHeader) descriptorCandidates.push(descriptorHeader);

    for (const row of rows.slice(0, 25)) {
      if (descriptorHeader) {
        const descriptorValue = String(row[descriptorHeader] ?? '').trim();
        if (descriptorValue) descriptorCandidates.push(descriptorValue);
      }

      const amountCellValue = String(row[amountHeader] ?? '').trim();
      if (amountCellValue && !isLikelyNumericCell(amountCellValue)) {
        descriptorCandidates.push(amountCellValue);
      }
    }

    const metric = descriptorCandidates
      .map((candidate) => detectOpaleAmountMetric(candidate))
      .find(Boolean);

    if (metric) metricByAmountHeader.set(amountHeader, metric);
  }

  if (!Array.from(metricByAmountHeader.values()).includes('budget')) {
    const firstAmountHeader = amountHeaders
      .slice()
      .sort((a, b) => (extractIndexedColumnNumber(a, 'montant colonne') ?? 0) - (extractIndexedColumnNumber(b, 'montant colonne') ?? 0))[0];
    if (firstAmountHeader && !metricByAmountHeader.has(firstAmountHeader)) {
      metricByAmountHeader.set(firstAmountHeader, 'budget');
    }
  }

  const keyService = headers.find((h) => {
    const n = normalizeColumnName(h);
    return ['service', 'cgr de niveau 3', 'cgr et intitule reduit 3', 'cgr de niveau 2'].some((alias) => n.startsWith(alias) || n.includes(alias));
  });
  const keyDomaine = headers.find((h) => {
    const n = normalizeColumnName(h);
    return ['domaine', 'cgr de niveau 4', 'cgr et intitule reduit 4'].some((alias) => n.startsWith(alias) || n.includes(alias));
  });
  const keyActivite = headers.find((h) => {
    const n = normalizeColumnName(h);
    return ['activite', 'activites', 'cgr de niveau 6', 'cgr et intitule reduit 6', 'cgr de niveau 5'].some((alias) => n.startsWith(alias) || n.includes(alias));
  });
  const keyCompte = headers.find((h) => {
    const n = normalizeColumnName(h);
    return ['compte', 'compte et intitule'].some((alias) => n.startsWith(alias) || n.includes(alias));
  });

  return rows.map((row) => {
    const next: Record<string, string> = { ...row };

    metricByAmountHeader.forEach((metric, amountHeader) => {
      const current = String(next[metric] ?? '').trim();
      if (!current) next[metric] = String(row[amountHeader] ?? '').trim();
    });

    const serviceCurrent = String(next.service ?? next.Service ?? '').trim();
    if (!serviceCurrent && keyService) next.service = extractCgrCode(String(row[keyService] ?? ''));

    const domaineCurrent = String(next.domaine ?? next.Domaine ?? '').trim();
    if (!domaineCurrent && keyDomaine) next.domaine = extractCgrCode(String(row[keyDomaine] ?? ''));

    const activiteCurrent = String(next.activite ?? next['activités'] ?? next.Activité ?? '').trim();
    if (!activiteCurrent && keyActivite) next.activite = extractCgrCode(String(row[keyActivite] ?? ''));

    const compteCurrent = String(next.compte ?? next.Compte ?? '').trim();
    if (!compteCurrent && keyCompte) next.compte = String(row[keyCompte] ?? '').trim();

    return next;
  });
}

function scoreHeaderRow(cells: string[]): number {
  const normalized = cells.map((c) => normalizeColumnName(c));
  const nonEmpty = normalized.filter(Boolean).length;
  if (nonEmpty < 2) return -1;

  let score = nonEmpty >= 5 ? 2 : 0;

   const amountColumnCount = normalized.filter((c) => c.startsWith('montant colonne')).length;
   const descriptorColumnCount = normalized.filter((c) => c.startsWith('colonne')).length;
   if (amountColumnCount > 0) score += amountColumnCount * 6;
   if (descriptorColumnCount > 0) score += descriptorColumnCount * 3;

  const scoreTerms: Array<[string, number]> = [
    ['compte', 4],
    ['compte et intitule', 5],
    ['cgr', 4],
    ['cgr de niveau', 5],
    ['cgr et intitule reduit', 5],
    ['service', 3],
    ['domaine', 2],
    ['activite', 2],
    ['budget', 2],
    ['montant colonne', 8],
    ['affichage', 3],
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

function buildCompositeHeaders(rows: string[][], headerRowIndex: number): string[] {
  const start = Math.max(0, headerRowIndex - 2);
  const headerRows = rows.slice(start, headerRowIndex + 1);
  const maxCols = Math.max(...headerRows.map((row) => row.length), 0);

  const headers = Array.from({ length: maxCols }, (_, idx) => {
    const parts = headerRows
      .map((row) => cleanHeaderLabel(row[idx] || ''))
      .filter(Boolean)
      .filter((part, partIndex, arr) => arr.indexOf(part) === partIndex);

    return parts.join(' | ');
  });

  return dedupeHeaders(headers);
}

function looksLikeAccountCell(value: string): boolean {
  const v = String(value ?? '').trim();
  return /^\d{3,}/.test(v);
}

function isLikelyDataRow(row: string[]): boolean {
  return row.some((cell) => isLikelyNumericCell(cell) || looksLikeAccountCell(cell));
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

  const rawHeader = rows[headerRowIndex] || [];
  const directHeaders = dedupeHeaders(rawHeader);
  const compositeHeaders = buildCompositeHeaders(rows, headerRowIndex);
  const headers = compositeHeaders.some((header) => normalizeColumnName(header).includes('montant colonne'))
    ? compositeHeaders
    : directHeaders;
  let dataStart = headerRowIndex + 1;
  while (dataStart < rows.length && !isLikelyDataRow(rows[dataStart])) {
    dataStart += 1;
  }

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
