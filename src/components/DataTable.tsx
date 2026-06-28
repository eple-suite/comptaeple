import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";

// DataTable unique réutilisable (amélioration #18) : tri, recherche, pagination
// client, export CSV. Générique et typé, appliqué aux listes (écritures, élèves,
// marchés, créances…). Volontairement client-side (volumes EPLE modestes).

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Rendu custom de la cellule. Par défaut : valeur brute via `accessor`. */
  render?: (row: T) => ReactNode;
  /** Valeur scalaire pour tri / recherche / export CSV. */
  accessor?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Clé unique par ligne (sinon index). */
  rowKey?: (row: T, index: number) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  /** Nom du fichier CSV (sans extension). Absent = pas d'export. */
  csvFileName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

const cellValue = <T,>(col: DataTableColumn<T>, row: T): string | number => {
  if (col.accessor) return col.accessor(row);
  const raw = (row as Record<string, unknown>)[col.key];
  return typeof raw === "number" ? raw : String(raw ?? "");
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder = "Rechercher…",
  pageSize = 15,
  csvFileName,
  emptyTitle = "Aucune donnée",
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => String(cellValue(c, row)).toLowerCase().includes(q)),
    );
  }, [data, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = cellValue(col, a);
      const vb = cellValue(col, b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "fr") * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const rows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col.key); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = columns.map((c) => escape(c.header)).join(";");
    const lines = sorted.map((row) => columns.map((c) => escape(cellValue(c, row))).join(";"));
    const csv = "﻿" + [header, ...lines].join("\r\n"); // BOM pour Excel FR
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${csvFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {(searchable || csvFileName) && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className="pl-8 h-9"
                aria-label="Rechercher dans le tableau"
              />
            </div>
          )}
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{sorted.length} ligne(s)</span>
          {csvFileName && (
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!sorted.length}>
              <Download className="h-3.5 w-3.5 mr-1" /> CSV
            </Button>
          )}
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={`${c.className ?? ""} ${c.sortable ? "cursor-pointer select-none" : ""}`}
                  onClick={() => toggleSort(c)}
                  aria-sort={sortKey === c.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable && (
                      sortKey === c.key
                        ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                        : <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow
                  key={rowKey ? rowKey(row, i) : i}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.render ? c.render(row) : cellValue(c, row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Page {safePage + 1} / {pageCount}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Page précédente">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} aria-label="Page suivante">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
