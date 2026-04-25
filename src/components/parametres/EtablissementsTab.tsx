import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Search, ShieldCheck, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateEstablishment } from "@/lib/parametres/validations";

type Etab = {
  id: string;
  uai: string;
  name: string;
  type: string | null;
  city: string | null;
  academy: string | null;
  siret?: string | null;
  telephone?: string | null;
  email_secretariat?: string | null;
  email_intendance?: string | null;
  nb_eleves_total?: number | null;
};

/**
 * Annuaire détaillé des établissements rattachés au groupement
 * Réf : Code éducation R.421-77, RAMSESE (UAI), répertoire SIRENE
 */
export default function EtablissementsTab() {
  const [rows, setRows] = useState<Etab[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("establishments")
        .select("id,uai,name,type,city,academy,siret,telephone,email_secretariat,email_intendance,nb_eleves_total")
        .order("name", { ascending: true });
      setRows((data || []) as any);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(s) || (r.uai || "").toLowerCase().includes(s) || (r.city || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const totalEleves = rows.reduce((s, r) => s + (r.nb_eleves_total || 0), 0);
  const issuesByEtab = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.id, validateEstablishment(r).filter((i) => i.severity === "error").length);
    return m;
  }, [rows]);
  const totalErrors = Array.from(issuesByEtab.values()).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><div><div className="text-2xl font-semibold">{rows.length}</div><div className="text-xs text-muted-foreground">Établissements</div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-semibold">{totalEleves.toLocaleString("fr-FR")}</div><div className="text-xs text-muted-foreground">Élèves cumulés</div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><ShieldCheck className={`h-5 w-5 ${totalErrors === 0 ? "text-emerald-600" : "text-destructive"}`} /><div><div className="text-2xl font-semibold">{totalErrors}</div><div className="text-xs text-muted-foreground">Anomalies bloquantes (UAI / SIRET / e-mail)</div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Établissements détaillés</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-7 w-64" placeholder="Rechercher (nom, UAI, ville)…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UAI</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>SIRET</TableHead>
                  <TableHead className="text-right">Effectif</TableHead>
                  <TableHead>Conformité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const errs = issuesByEtab.get(r.id) || 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.uai}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{r.type || "—"}</span></TableCell>
                      <TableCell>{r.city || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.siret || "—"}</TableCell>
                      <TableCell className="text-right">{r.nb_eleves_total?.toLocaleString("fr-FR") || "—"}</TableCell>
                      <TableCell>
                        {errs === 0 ? (
                          <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200"><ShieldCheck className="h-3 w-3" /> OK</Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {errs} anomalie(s)</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Aucun établissement.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}