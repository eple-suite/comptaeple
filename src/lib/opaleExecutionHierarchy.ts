import type { LigneSDE, LigneSDR } from './cofieple_types';
import { extractIndexedColumnNumber, normalizeColumnName } from './opaleImportUtils';

export type AggregationLevel = 'global' | 'section' | 'service' | 'detail' | 'unknown';

export type ExecutionSource = 'global' | 'services' | 'details' | 'mixte' | 'aucune';

type ExecutionKind = 'sde' | 'sdr';

const METADATA_KEYS = new Set([
  'rne', 'uai', 'exercice', 'ext', 'extourne', 'budget', 'engage', 'engagé', 'realise', 'réalisé',
  'aor', 'encours', 'en cours', 'disponible', 'plusvalues', '+values/-values', 'plus values',
]);

const NUMERIC_FALLBACK_EXCLUDED_KEYS = new Set([
  ...METADATA_KEYS,
  'service', 'domaine', 'activite', 'activités', 'compte', 'rawlabel', 'issummary', 'aggregationlevel', 'servicecode',
]);

const SERVICE_PATTERNS: Array<{ code: string; label: string; test: RegExp }> = [
  { code: 'AP', label: 'Activités pédagogiques', test: /(^|\b)ap(\b|\s|-)|activites?\s+pedago/i },
  { code: 'VE', label: 'Vie de l’élève', test: /(^|\b)ve(\b|\s|-)|vie\s+de\s+l'?eleve/i },
  { code: 'ALO', label: 'Administration et logistique', test: /(^|\b)alo(\b|\s|-)|administration|logistique/i },
  { code: 'SRH', label: 'Service restauration hébergement', test: /(^|\b)srh(\b|\s|-)|restauration|hebergement|internat/i },
  { code: 'OPC', label: 'Opérations en capital', test: /(^|\b)opc(\b|\s|-)|operations?\s+en\s+capital/i },
];

const SECTION_PATTERNS = [
  /section\s+de\s+fonctionnement/i,
  /section\s+d'?investissement/i,
  /(^|\b)fonc(\b|\s|-)|fonctionnement/i,
  /(^|\b)inv(\b|\s|-)|investissement/i,
  /services?\s+generaux/i,
];

function toNumLoose(value: unknown): number {
  if (value == null || value === '') return 0;
  let raw = String(value).trim();
  if (!raw) return 0;

  let negative = false;
  if (/^\(.*\)$/.test(raw)) {
    negative = true;
    raw = raw.slice(1, -1);
  }

  raw = raw.replace(/[€%]/g, '').replace(/[\s\u00A0\u202F]/g, '').replace(/[^0-9,.-]/g, '');

  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  if (hasComma && hasDot) {
    raw = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
  } else if (hasComma) {
    raw = raw.replace(',', '.');
  } else if ((raw.match(/\./g) || []).length > 1) {
    raw = raw.replace(/\./g, '');
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

function isNumericLike(value: string): boolean {
  const v = String(value ?? '').trim();
  return !!v && Number.isFinite(toNumLoose(v)) && /\d/.test(v);
}

function cleanLabel(value: string): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function getOrderedAmountValues(row: Record<string, string>): number[] {
  return Object.entries(row)
    .map(([key, value]) => {
      const amountIndex = extractIndexedColumnNumber(key, 'montant colonne');
      if (amountIndex == null) return null;
      return { index: amountIndex, value: toNumLoose(value) };
    })
    .filter((entry): entry is { index: number; value: number } => !!entry)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.value);
}

function getIndexedAmountMap(row: Record<string, string>): Map<number, number> {
  return new Map(
    Object.entries(row)
      .map(([key, value]) => {
        const amountIndex = extractIndexedColumnNumber(key, 'montant colonne');
        if (amountIndex == null) return null;
        return [amountIndex, toNumLoose(value)] as const;
      })
      .filter((entry): entry is readonly [number, number] => !!entry)
  );
}

function getSequentialNumericValues(row: Record<string, string>): number[] {
  return Object.entries(row)
    .map(([key, value]) => {
      const normalizedKey = normalizeColumnName(key);
      if (
        NUMERIC_FALLBACK_EXCLUDED_KEYS.has(normalizedKey) ||
        normalizedKey.startsWith('colonne') ||
        normalizedKey.startsWith('montant colonne') ||
        normalizedKey.startsWith('col_')
      ) {
        return null;
      }

      const raw = String(value ?? '').trim();
      if (!raw || !/\d/.test(raw)) return null;

      const parsed = toNumLoose(raw);
      if (!Number.isFinite(parsed)) return null;
      if (Math.abs(parsed) === 0 && !/^[-(]?0(?:[,.]0+)?\)?$/.test(raw.replace(/\s/g, ''))) return null;

      return parsed;
    })
    .filter((value): value is number => value != null);
}

function getFallbackMetricValue(kind: ExecutionKind, row: Record<string, string>, metric: string): number {
  const indexedAmounts = getIndexedAmountMap(row);

  // Standard Op@le column ordering:
  // SDE: col1=budget, col2=liquidé/engagé, col3=réalisé/payé, col4=en instance, col5=disponible
  // SDR: col1=budget, col2=engagé, col3=AOR/émis, col4=réalisé/encaissé, col5=en instance, col6=disponible
  const absoluteIndexByMetric = kind === 'sde'
    ? {
        budget: [1, 2, 3],
        engage: [2, 1, 3],
        realise: [3, 2, 5],
        encours: [4, 3, 5],
        disponible: [5, 4, 7],
      }
    : {
        budget: [1, 2, 3],
        engage: [2, 1, 3],
        aor: [2, 3, 5],
        realise: [3, 4, 5],
        encours: [4, 5, 6],
        plusValues: [5, 6, 7],
      };

  const preferredIndexes = absoluteIndexByMetric[metric as keyof typeof absoluteIndexByMetric] ?? [];
  for (const idx of preferredIndexes) {
    const value = indexedAmounts.get(idx);
    if (typeof value === 'number' && value !== 0) return value;
  }

  const ordered = getOrderedAmountValues(row);
  const sequentialValues = ordered.length > 0 ? ordered : getSequentialNumericValues(row);
  if (!sequentialValues.length) return 0;

  const mapping = kind === 'sde'
    ? ['budget', 'engage', 'realise', 'encours', 'disponible']
    : ['budget', 'engage', 'aor', 'realise', 'encours', 'plusValues'];

  const idx = mapping.indexOf(metric);
  if (idx === -1) return 0;
  if (metric === 'realise' && kind === 'sdr') return sequentialValues[idx] || sequentialValues[idx - 1] || 0;
  return sequentialValues[idx] || 0;
}

function sortRowsByBudgetPriority<T extends { budget: number; realise: number }>(rows: T[], rateSelector: (row: T) => number) {
  return rows.slice().sort((a, b) => {
    const budgetDelta = (b.budget || 0) - (a.budget || 0);
    if (budgetDelta !== 0) return budgetDelta;
    const rateDelta = rateSelector(b) - rateSelector(a);
    if (rateDelta !== 0) return rateDelta;
    return (b.realise || 0) - (a.realise || 0);
  });
}

function collectHierarchyLabels(row: Record<string, string>): string[] {
  const labels: string[] = [];

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    const cleanedValue = cleanLabel(String(value ?? ''));
    if (!cleanedValue || cleanedValue === '-' || isNumericLike(cleanedValue)) continue;
    if (extractIndexedColumnNumber(key, 'montant colonne') != null) continue;
    if (extractIndexedColumnNumber(key, 'colonne') != null) continue;
    if (METADATA_KEYS.has(normalizedKey) || normalizedKey.startsWith('col_')) continue;
    if (!labels.includes(cleanedValue)) labels.push(cleanedValue);
  }

  return labels;
}

function detectServicePattern(label: string) {
  const normalized = cleanLabel(label);
  return SERVICE_PATTERNS.find((entry) => entry.test.test(normalized));
}

function normalizeServiceLabel(label: string): string {
  const match = detectServicePattern(label);
  if (!match) return cleanLabel(label);
  return `${match.code} - ${match.label}`;
}

function detectServiceCode(label: string): string | undefined {
  return detectServicePattern(label)?.code;
}

function isSectionLabel(label: string): boolean {
  return SECTION_PATTERNS.some((pattern) => pattern.test(label));
}

function isServiceLabel(label: string): boolean {
  return !!detectServicePattern(label);
}

function buildHierarchyFields(row: Record<string, string>, explicitService: string, explicitDomaine: string, explicitActivite: string) {
  const labels = collectHierarchyLabels(row);
  const leafLabel = labels[labels.length - 1] || '';
  const parentLabel = labels[labels.length - 2] || '';
  const service = cleanLabel(explicitService) || normalizeServiceLabel(leafLabel || parentLabel);
  let domaine = cleanLabel(explicitDomaine);
  let activite = cleanLabel(explicitActivite);

  if (!domaine && parentLabel && parentLabel !== leafLabel) domaine = cleanLabel(parentLabel);
  if (!activite && labels.length >= 3) activite = cleanLabel(labels[labels.length - 3]);
  if (domaine === service) domaine = '';
  if (activite === service || activite === domaine) activite = '';

  return { service, domaine, activite, labels };
}

function classifyAggregationLevel(compte: string, labels: string[], hasAmounts: boolean): AggregationLevel {
  if (compte) return 'detail';
  if (!hasAmounts) return 'unknown';
  const leaf = labels[labels.length - 1] || '';
  if (isSectionLabel(leaf)) return 'section';
  if (isServiceLabel(leaf)) return 'service';
  if (labels.length <= 1) return 'global';
  return 'global';
}

export function enrichParsedSdeRow(base: LigneSDE, row: Record<string, string>): LigneSDE {
  const budget = base.budget || getFallbackMetricValue('sde', row, 'budget');
  const engage = base.engage || getFallbackMetricValue('sde', row, 'engage');
  const realise = base.realise || getFallbackMetricValue('sde', row, 'realise');
  const encours = base.encours || getFallbackMetricValue('sde', row, 'encours');
  const disponible = base.disponible || getFallbackMetricValue('sde', row, 'disponible');
  const hierarchy = buildHierarchyFields(row, base.service, base.domaine, base.activite);
  const aggregationLevel = classifyAggregationLevel(base.compte, hierarchy.labels, [budget, engage, realise, encours, disponible].some((v) => Math.abs(v) > 0));

  return {
    ...base,
    budget,
    engage,
    realise,
    encours,
    disponible,
    service: hierarchy.service,
    domaine: hierarchy.domaine,
    activite: hierarchy.activite,
    aggregationLevel,
    serviceCode: detectServiceCode(hierarchy.service),
    rawLabel: hierarchy.labels.join(' / '),
    isSummary: aggregationLevel !== 'detail' && aggregationLevel !== 'unknown',
  };
}

export function enrichParsedSdrRow(base: LigneSDR, row: Record<string, string>): LigneSDR {
  const budget = base.budget || getFallbackMetricValue('sdr', row, 'budget');
  const engage = base.engage || getFallbackMetricValue('sdr', row, 'engage');
  const aor = base.aor || getFallbackMetricValue('sdr', row, 'aor');
  const realise = base.realise || getFallbackMetricValue('sdr', row, 'realise');
  const encours = base.encours || getFallbackMetricValue('sdr', row, 'encours');
  const plusValues = base.plusValues || getFallbackMetricValue('sdr', row, 'plusValues');
  const hierarchy = buildHierarchyFields(row, base.service, base.domaine, base.activite);
  const aggregationLevel = classifyAggregationLevel(base.compte, hierarchy.labels, [budget, engage, aor, realise, encours, plusValues].some((v) => Math.abs(v) > 0));

  return {
    ...base,
    budget,
    engage,
    aor,
    realise,
    encours,
    plusValues,
    service: hierarchy.service,
    domaine: hierarchy.domaine,
    activite: hierarchy.activite,
    aggregationLevel,
    serviceCode: detectServiceCode(hierarchy.service),
    rawLabel: hierarchy.labels.join(' / '),
    isSummary: aggregationLevel !== 'detail' && aggregationLevel !== 'unknown',
  };
}

function hasAnySdeAmounts(row: Pick<LigneSDE, 'budget' | 'engage' | 'realise' | 'encours' | 'disponible'>): boolean {
  return [row.budget, row.engage, row.realise, row.encours, row.disponible].some((value) => Math.abs(value || 0) > 0);
}

function hasAnySdrAmounts(row: Pick<LigneSDR, 'budget' | 'engage' | 'aor' | 'realise' | 'encours' | 'plusValues'>): boolean {
  return [row.budget, row.engage, row.aor, row.realise, row.encours, row.plusValues].some((value) => Math.abs(value || 0) > 0);
}

export function getChargeRateBase(row: Pick<LigneSDE, 'engage' | 'realise'>): number {
  return row.engage > 0 ? row.engage : row.realise;
}

export function getProductRateBase(row: Pick<LigneSDR, 'aor' | 'realise'>): number {
  return row.aor > 0 ? row.aor : row.realise;
}

export function deriveSdeExecutionTotals(rows: LigneSDE[]) {
  const meaningfulRows = rows.filter((row) => hasAnySdeAmounts(row));
  const detailRows = meaningfulRows.filter((row) => row.aggregationLevel === 'detail');
  const serviceRows = meaningfulRows.filter((row) => row.aggregationLevel === 'service');
  // ✅ M9-6 STRICT — simple agrégation SUM() sur lignes de DÉTAIL uniquement.
  // Les lignes 'service'/'global'/'section' sont des agrégats Op@le (totaux
  // partiels ou enveloppes non ventilées). Les sommer avec les détails créerait
  // un double comptage ; les utiliser à la place des détails (cascade) prend
  // une ligne tronquée pour le total. La règle métier réelle : SUM des feuilles.
  const validDetailRows = detailRows.filter((r) => isLigneSdeValide(r));
  // Fallback : si aucun détail détecté (parsing dégradé), on prend toutes les
  // lignes utiles non-globales/non-section pour ne pas afficher 0.
  const sourceRows = validDetailRows.length > 0
    ? validDetailRows
    : meaningfulRows.filter((r) => r.aggregationLevel !== 'global' && r.aggregationLevel !== 'section');
  const serviceBaseRows = serviceRows.length
    ? serviceRows
    : detailRows.length
      ? detailRows
      : meaningfulRows.filter((row) => row.aggregationLevel !== 'global' && row.aggregationLevel !== 'section');
  const totalBudget = sourceRows.reduce((sum, row) => sum + (row.budget || 0), 0);
  const totalRealise = sourceRows.reduce((sum, row) => sum + (row.realise > 0 ? row.realise : 0), 0);
  const totalForRate = sourceRows.reduce((sum, row) => sum + getChargeRateBase(row), 0);
  const sourceKind: ExecutionSource = validDetailRows.length > 0 ? 'details' : 'mixte';

  return {
    totalBudget,
    totalRealise,
    totalForRate,
    serviceBaseRows,
    budgetSourceKind: sourceKind,
    realisedSourceKind: sourceKind,
    coverage: {
      linesUsed: sourceRows.length,
      linesTotal: rows.length,
    },
  };
}

export function deriveSdrExecutionTotals(rows: LigneSDR[]) {
  const meaningfulRows = rows.filter((row) => hasAnySdrAmounts(row));
  const detailRows = meaningfulRows.filter((row) => row.aggregationLevel === 'detail');
  const serviceRows = meaningfulRows.filter((row) => row.aggregationLevel === 'service');
  // ✅ M9-6 STRICT — simple SUM() sur lignes de détail valides (cf. SDE)
  const validDetailRows = detailRows.filter((r) => isLigneSdrValide(r));
  const sourceRows = validDetailRows.length > 0
    ? validDetailRows
    : meaningfulRows.filter((r) => r.aggregationLevel !== 'global' && r.aggregationLevel !== 'section');
  const serviceBaseRows = serviceRows.length
    ? serviceRows
    : detailRows.length
      ? detailRows
      : meaningfulRows.filter((row) => row.aggregationLevel !== 'global' && row.aggregationLevel !== 'section');
  const totalBudget = sourceRows.reduce((sum, row) => sum + (row.budget || 0), 0);
  const totalRealise = sourceRows.reduce((sum, row) => sum + (row.realise > 0 ? row.realise : 0), 0);
  const totalForRate = sourceRows.reduce((sum, row) => sum + getProductRateBase(row), 0);
  const sourceKind: ExecutionSource = validDetailRows.length > 0 ? 'details' : 'mixte';

  return {
    totalBudget,
    totalRealise,
    totalForRate,
    serviceBaseRows,
    budgetSourceKind: sourceKind,
    realisedSourceKind: sourceKind,
    coverage: {
      linesUsed: sourceRows.length,
      linesTotal: rows.length,
    },
  };
}

/**
 * Une ligne SDE est valide pour l'agrégation si :
 *  - elle est une feuille (detail), pas un agrégat,
 *  - elle a un compte par nature de classe 6 (charges) renseigné.
 * Les enveloppes non ventilées (compte vide) sont exclues — elles seraient
 * sinon comptées en double quand la ventilation arrive ultérieurement.
 */
function isLigneSdeValide(row: LigneSDE): boolean {
  if (row.aggregationLevel !== 'detail') return false;
  const compte = String(row.compte ?? '').trim();
  if (!compte) return false;
  return /^6\d{2,}/.test(compte) || /^[67]\d{2,}/.test(compte);
}

function isLigneSdrValide(row: LigneSDR): boolean {
  if (row.aggregationLevel !== 'detail') return false;
  const compte = String(row.compte ?? '').trim();
  if (!compte) return false;
  return /^7\d{2,}/.test(compte);
}

function classifySourceKind(
  used: Array<{ aggregationLevel?: AggregationLevel }>,
  detailRef: Array<unknown>,
  serviceRef: Array<unknown>,
  globalRef: Array<unknown>,
): ExecutionSource {
  if (!used || used.length === 0) return 'aucune';
  // Identity match: if the chosen array is exactly one of the references
  if (used === detailRef as unknown) return 'details';
  if (used === serviceRef as unknown) return 'services';
  if (used === globalRef as unknown) return 'global';
  // Fallback: classify by levels present in the chosen rows
  const levels = new Set(used.map(r => r.aggregationLevel));
  if (levels.size === 1) {
    const only = [...levels][0];
    if (only === 'detail') return 'details';
    if (only === 'service') return 'services';
    if (only === 'global' || only === 'section') return 'global';
  }
  return 'mixte';
}