// ════════════════════════════════════════════════════════════════
// Admin — Journal des actions règle 8 € (LF n° 66-948 art. 21)
// ────────────────────────────────────────────────────────────────
// Filtres : code UAI + type d'action. Réservé aux comptes admin.
// ════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchRegle8Logs,
  REGLE8_ACTION_LABELS,
  type Regle8LogAction,
  type Regle8LogEntry,
} from "@/pages/voyages-v2/lib/voyageLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, ShieldAlert, Filter, Download } from "lucide-react";

const ACTION_OPTIONS: Array<{ value: "all" | Regle8LogAction; label: string }> = [
  { value: "all", label: "Toutes les actions" },
  { value: "voyage_regle8_bloquant", label: REGLE8_ACTION_LABELS.voyage_regle8_bloquant },
  { value: "voyage_regle8_don_tacite_assume", label: REGLE8_ACTION_LABELS.voyage_regle8_don_tacite_assume },
  { value: "voyage_regle8_don_tacite_retire", label: REGLE8_ACTION_LABELS.voyage_regle8_don_tacite_retire },
];

function formatEuro(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function actionVariant(a: Regle8LogAction): "destructive" | "default" | "secondary" {
  if (a === "voyage_regle8_bloquant") return "destructive";
  if (a === "voyage_regle8_don_tacite_assume") return "default";
  return "secondary";
}

export default function Regle8LogsAdmin() {
  const { role, loading: authLoading } = useAuth();

  const [uaiFilter, setUaiFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<"all" | Regle8LogAction>("all");
  const [rows, setRows] = useState<Regle8LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRegle8Logs({
        uai: uaiFilter.trim() ? uaiFilter.trim().toUpperCase() : null,
        limit: 500,
      });
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  // Chargement initial dès qu'on est admin confirmé
  useEffect(() => {
    if (role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filtered = useMemo(() => {
    if (actionFilter === "all") return rows;
    return rows.filter((r) => r.action === actionFilter);
  }, [rows, actionFilter]);

  const counts = useMemo(() => {
    const c: Record<Regle8LogAction, number> = {
      voyage_regle8_bloquant: 0,
      voyage_regle8_don_tacite_assume: 0,
      voyage_regle8_don_tacite_retire: 0,
    };
    for (const r of filtered) c[r.action] = (c[r.action] || 0) + 1;
    return c;
  }, [filtered]);

  function exportCsv() {
    const header = [
      "date",
      "uai",
      "action",
      "voyage_id",
      "voyage_libelle",
      "nb_eleves",
      "cout_par_eleve",
      "participation_par_eleve",
      "reste_a_charge_par_eleve",
      "contexte",
      "user_id",
    ];
    const lines = [header.join(";")];
    for (const r of filtered) {
      const d = (r.details || {}) as any;
      const cells = [
        r.created_at,
        r.uai ?? "",
        r.action,
        d.voyage_id ?? "",
        (d.voyage_libelle ?? "").toString().replace(/[\r\n;]/g, " "),
        d.nb_eleves ?? "",
        d.cout_par_eleve ?? "",
        d.participation_par_eleve ?? "",
        d.reste_a_charge_par_eleve ?? "",
        d.contexte ?? "",
        r.user_id ?? "",
      ];
      lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-regle8_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Journal règle 8 € — Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            LF n° 66-948 du 22/12/1966, art. 21 — supervision des dépassements et dons tacites.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="uai">Code UAI</Label>
            <Input
              id="uai"
              placeholder="ex. 9710001A"
              value={uaiFilter}
              onChange={(e) => setUaiFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="uppercase"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground">Vide = tous les UAI visibles.</p>
          </div>
          <div className="space-y-2">
            <Label>Type d'action</Label>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={load} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Appliquer
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Tentatives bloquées</div>
            <div className="text-2xl font-bold text-destructive">{counts.voyage_regle8_bloquant}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Don tacite assumé</div>
            <div className="text-2xl font-bold">{counts.voyage_regle8_don_tacite_assume}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Don tacite retiré</div>
            <div className="text-2xl font-bold">{counts.voyage_regle8_don_tacite_retire}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Événements ({filtered.length}{rows.length !== filtered.length ? ` / ${rows.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucun événement ne correspond aux filtres.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>UAI</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Voyage</TableHead>
                    <TableHead className="text-right">Élèves</TableHead>
                    <TableHead className="text-right">Coût/él.</TableHead>
                    <TableHead className="text-right">Particip./él.</TableHead>
                    <TableHead className="text-right">RAC/él.</TableHead>
                    <TableHead>Contexte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const d = (r.details || {}) as any;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDate(r.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.uai || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={actionVariant(r.action)}>{REGLE8_ACTION_LABELS[r.action]}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={d.voyage_libelle || ""}>
                          {d.voyage_libelle || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">{d.nb_eleves ?? "—"}</TableCell>
                        <TableCell className="text-right">{formatEuro(d.cout_par_eleve)}</TableCell>
                        <TableCell className="text-right">{formatEuro(d.participation_par_eleve)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatEuro(d.reste_a_charge_par_eleve)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.contexte || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}