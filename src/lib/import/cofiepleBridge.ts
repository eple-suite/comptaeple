// Pont d'ingestion : alimente le hub COFIEPLE (useCofiepleStore) à partir d'un
// classeur Op@le importé depuis la plateforme d'import unifiée (/import).
// Réutilise EXACTEMENT les fonctions du chemin éprouvé /compte-financier
// (sélection d'onglet + normalizeRowsForOpaleImport + parserBalance/SDE/SDR),
// pour que la balance/SDE/SDR importée une seule fois alimente COFIEPLE,
// HYPER@LE et l'analyse de balance sans ré-import.
import type * as XLSX from "xlsx";
import { selectOpaleBalanceSheet } from "@/lib/opaleWorkbook";
import { selectOpaleSdeSdrSheet } from "@/lib/opaleSdeSdrParser";
import { normalizeRowsForOpaleImport } from "@/lib/opaleImportUtils";
import { parserBalance, parserSDE, parserSDR } from "@/lib/cofieple_calculations";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import type { TypeBudget } from "@/lib/cofieple_storeTypes";

type SheetCell = string | number | boolean | null | undefined;

/** Reconstruit des enregistrements clé/valeur à partir d'une matrice et de sa
 *  ligne d'en-têtes (celle détectée par les sélecteurs d'onglet Op@le). */
export function recordsFromMatrix(matrix: SheetCell[][], headerRowIndex: number): Record<string, string>[] {
  if (headerRowIndex < 0 || !matrix[headerRowIndex]) return [];
  const headers = matrix[headerRowIndex].map((c) => String(c ?? "").trim());
  return matrix.slice(headerRowIndex + 1).map((row) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => { if (h) rec[h] = String(row?.[i] ?? ""); });
    return rec;
  });
}

export type IngestKind = "balance" | "sde" | "sdr";

/** Ingère un classeur Op@le (balance/SDE/SDR) dans le store COFIEPLE pour le
 *  budget donné. Retourne true si des lignes ont été poussées. */
export function ingestOpaleWorkbookIntoStore(
  wb: XLSX.WorkBook,
  kind: IngestKind,
  budget: TypeBudget = "principal",
): boolean {
  const store = useCofiepleStore.getState();

  if (kind === "balance") {
    const sel = selectOpaleBalanceSheet(wb);
    if (!sel) return false;
    const rows = normalizeRowsForOpaleImport(recordsFromMatrix(sel.matrix, sel.headerRowIndex));
    const lignes = parserBalance(rows, budget);
    if (!lignes.length) return false;
    store.setBalance(lignes, budget);
    return true;
  }

  const sel = selectOpaleSdeSdrSheet(wb, kind);
  if (!sel) return false;
  const rows = normalizeRowsForOpaleImport(recordsFromMatrix(sel.matrix, sel.headerRowIndex));
  if (kind === "sde") {
    const lignes = parserSDE(rows, budget);
    if (!lignes.length) return false;
    store.setSDE(lignes, budget);
    return true;
  }
  const lignes = parserSDR(rows, budget);
  if (!lignes.length) return false;
  store.setSDR(lignes, budget);
  return true;
}

/** Recalcule les résultats M9-6 (FDR, CAF, trésorerie…) après ingestion. */
export function recomputeCofieple(): void {
  useCofiepleStore.getState().lancerAnalyse();
}
