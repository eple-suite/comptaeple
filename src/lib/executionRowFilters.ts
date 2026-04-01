// ═══════════════════════════════════════════════════════════════
// Filtres de lignes SDE/SDR pour éviter les doubles comptes
// Règle : n'utiliser QUE les niveaux feuilles (detail) OU les
// agrégats CGR de niveau service (AP, VE, ALO, SRH…)
// ═══════════════════════════════════════════════════════════════

import type { LigneSDE, LigneSDR } from './cofieple_types';

/** Retourne uniquement les lignes feuilles (detail) — sans agrégats */
export function getLeafSdeRows(rows: LigneSDE[]): LigneSDE[] {
  if (!rows?.length) return [];
  // If we have aggregationLevel info, use it
  const hasLevels = rows.some(r => r.aggregationLevel && r.aggregationLevel !== 'unknown');
  if (hasLevels) {
    const details = rows.filter(r => r.aggregationLevel === 'detail');
    // Fallback: if no detail rows found, use non-summary rows
    return details.length > 0 ? details : rows.filter(r => !r.isSummary);
  }
  return rows;
}

/** Retourne uniquement les lignes feuilles (detail) — sans agrégats */
export function getLeafSdrRows(rows: LigneSDR[]): LigneSDR[] {
  if (!rows?.length) return [];
  const hasLevels = rows.some(r => r.aggregationLevel && r.aggregationLevel !== 'unknown');
  if (hasLevels) {
    const details = rows.filter(r => r.aggregationLevel === 'detail');
    return details.length > 0 ? details : rows.filter(r => !r.isSummary);
  }
  return rows;
}

/** Retourne la ligne agrégat ETS (racine) si elle existe */
export function getEtsSdeRow(rows: LigneSDE[]): LigneSDE | undefined {
  return rows.find(r => r.aggregationLevel === 'global' && r.budget > 0);
}

export function getEtsSdrRow(rows: LigneSDR[]): LigneSDR | undefined {
  return rows.find(r => r.aggregationLevel === 'global' && r.budget > 0);
}

/** Retourne les lignes agrégats de niveau 'service' (AP, VE, ALO, SRH…) */
export function getServiceSdeRows(rows: LigneSDE[]): LigneSDE[] {
  return rows.filter(r => r.aggregationLevel === 'service');
}

export function getServiceSdrRows(rows: LigneSDR[]): LigneSDR[] {
  return rows.filter(r => r.aggregationLevel === 'service');
}

/** Contrôle de cohérence hiérarchique */
export interface HierarchyCheck {
  sgEqualsSubServices: boolean;
  totalEqualsEts: boolean;
  sgBudget: number;
  ssBudget: number;
  etsBudget: number;
  subServicesBudget: number;
  sgPlusSs: number;
}

export function checkSdeHierarchy(rows: LigneSDE[]): HierarchyCheck | null {
  const serviceRows = getServiceSdeRows(rows);
  const etsRow = getEtsSdeRow(rows);
  if (!etsRow || serviceRows.length === 0) return null;

  // Find SG-level services (AP, VE, ALO are children of SG)
  const sgRow = serviceRows.find(r =>
    r.serviceCode === 'SG' || /\bSG\b/i.test(r.service) || /services?\s+generaux/i.test(r.service)
  );
  const ssRow = serviceRows.find(r =>
    r.serviceCode === 'SS' || /\bSS\b/i.test(r.service) || /services?\s+speciaux/i.test(r.service)
  );
  const apRow = serviceRows.find(r => r.serviceCode === 'AP');
  const veRow = serviceRows.find(r => r.serviceCode === 'VE');
  const aloRow = serviceRows.find(r => r.serviceCode === 'ALO');

  const sgBudget = sgRow?.budget ?? 0;
  const ssBudget = ssRow?.budget ?? 0;
  const etsBudget = etsRow.budget;
  const subServicesBudget = (apRow?.budget ?? 0) + (veRow?.budget ?? 0) + (aloRow?.budget ?? 0);
  const sgPlusSs = sgBudget + ssBudget;

  return {
    sgEqualsSubServices: Math.abs(subServicesBudget - sgBudget) < 0.02,
    totalEqualsEts: Math.abs(sgPlusSs - etsBudget) < 0.02,
    sgBudget,
    ssBudget,
    etsBudget,
    subServicesBudget,
    sgPlusSs,
  };
}

/** Format euros style français */
export function formatEuros(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' €';
}

export function formatPourcent(value: number): string {
  if (!isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + ' %';
}
