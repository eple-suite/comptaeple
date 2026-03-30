import type { LigneSDE, LigneSDR } from './cofieple_types';
import { extractIndexedColumnNumber, normalizeColumnName } from './opaleImportUtils';

export type AggregationLevel = 'global' | 'section' | 'service' | 'detail' | 'unknown';

type ExecutionKind = 'sde' | 'sdr';

const METADATA_KEYS = new Set([
  'rne', 'uai', 'exercice', 'ext', 'extourne', 'budget', 'engage', 'engagé', 'realise', 'réalisé',
  'aor', 'encours', 'en cours', 'disponible', 'plusvalues', '+values/-values', 'plus values',
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

function getFallbackMetricValue(kind: ExecutionKind, row: Record<string, string>, metric: string): number {
  const ordered = getOrderedAmountValues(row);
  if (!ordered.length) return 0;

  const mapping = kind === 'sde'
    ? ['budget', 'engage', 'realise', 'encours', 'disponible']
    : ['budget', 'engage', 'aor', 'realise', 'encours', 'plusValues'];

  const idx = mapping.indexOf(metric);
  if (idx === -1) return 0;
  if (metric === 'realise' && kind === 'sdr') return ordered[idx] || ordered[idx - 1] || 0;
  return ordered[idx] || 0;
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
  const globalRows = meaningfulRows.filter((row) => row.aggregationLevel === 'global');
  const preferredGlobal = globalRows.slice().sort((a, b) => Math.max(b.budget, b.engage, b.realise) - Math.max(a.budget, a.engage, a.realise))[0];

  const budgetSource = preferredGlobal ? [preferredGlobal] : serviceRows.length ? serviceRows : detailRows.length ? detailRows : meaningfulRows;
  const realisedSource = detailRows.length ? detailRows : serviceRows.length ? serviceRows : preferredGlobal ? [preferredGlobal] : meaningfulRows;
  const rateSource = preferredGlobal ? [preferredGlobal] : serviceRows.length ? serviceRows : detailRows.length ? detailRows : meaningfulRows;
  const serviceBaseRows = serviceRows.length ? serviceRows : detailRows.length ? detailRows : meaningfulRows.filter((row) => row.aggregationLevel !== 'global' && row.aggregationLevel !== 'section');

  return {
    totalBudget: budgetSource.reduce((sum, row) => sum + (row.budget || 0), 0),
    totalRealise: realisedSource.reduce((sum, row) => sum + ((row.realise > 0 ? row.realise : 0) || 0), 0),
    totalForRate: rateSource.reduce((sum, row) => sum + getChargeRateBase(row), 0),
    serviceBaseRows,
  };
}

export function deriveSdrExecutionTotals(rows: LigneSDR[]) {
  const meaningfulRows = rows.filter((row) => hasAnySdrAmounts(row));
  const detailRows = meaningfulRows.filter((row) => row.aggregationLevel === 'detail');
  const serviceRows = meaningfulRows.filter((row) => row.aggregationLevel === 'service');
  const globalRows = meaningfulRows.filter((row) => row.aggregationLevel === 'global');
  const preferredGlobal = globalRows.slice().sort((a, b) => Math.max(b.budget, b.aor, b.realise) - Math.max(a.budget, a.aor, a.realise))[0];

  const budgetSource = preferredGlobal ? [preferredGlobal] : serviceRows.length ? serviceRows : detailRows.length ? detailRows : meaningfulRows;
  const realisedSource = detailRows.length ? detailRows : serviceRows.length ? serviceRows : preferredGlobal ? [preferredGlobal] : meaningfulRows;
  const rateSource = preferredGlobal ? [preferredGlobal] : serviceRows.length ? serviceRows : detailRows.length ? detailRows : meaningfulRows;
  const serviceBaseRows = serviceRows.length ? serviceRows : detailRows.length ? detailRows : meaningfulRows.filter((row) => row.aggregationLevel !== 'global' && row.aggregationLevel !== 'section');

  return {
    totalBudget: budgetSource.reduce((sum, row) => sum + (row.budget || 0), 0),
    totalRealise: realisedSource.reduce((sum, row) => sum + ((row.realise > 0 ? row.realise : 0) || 0), 0),
    totalForRate: rateSource.reduce((sum, row) => sum + getProductRateBase(row), 0),
    serviceBaseRows,
  };
}