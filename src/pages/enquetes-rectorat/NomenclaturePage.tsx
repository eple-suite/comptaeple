import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Lock, ShieldCheck, Library } from "lucide-react";
import type { CompteEnqueteRef } from "@/lib/enquetes-rectorat/types";

const FAMILLE_LABELS: Record<string, string> = {
  "4411X":  "Créances État",
  "44191X": "Reliquats État",
  "443110": "Bourses nationales",
  "4412X":  "Créances collectivités",
  "44192X": "Reliquats collectivités",
  "4413X":  "Créances UE",
  "44193X": "Reliquats UE",
  "4416X":  "Autres organismes publics",
  "4417X":  "Organismes privés / dons",
  "44181X": "DGF (dotations globales)",
};

export default function NomenclaturePage() {
  const [comptes, setComptes] = useState<CompteEnqueteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("enquetes_referentiel_comptes" as any)
        .select("*")
        .eq("actif", true)
        .order("compte");
      if (!error && data) setComptes(data as unknown as CompteEnqueteRef[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = filtre.trim().toLowerCase();
    if (!q) return comptes;
    return comptes.filter(
      (c) =>
        c.compte.toLowerCase().includes(q) ||
        c.libelle.toLowerCase().includes(q) ||
        (c.programme_bop ?? "").toLowerCase().includes(q),
    );
  }, [comptes, filtre]);

  const grouped = useMemo(() => {
    const map = new Map<string, CompteEnqueteRef[]>();
    for (const c of filtered) {
      if (!map.has(c.racine_famille)) map.set(c.racine_famille, []);
      map.get(c.racine_famille)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={Library}
        title="Nomenclature M9-6 — Référentiel comptes enquêtes"
        description="Comptes 4411X, 44191X, 443110, 4412X, 4413X, 4416X, 4417X, 44181X — sens normal du solde et règles de déspécialisation (DAF A3)."
      />

      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Lock className="h-5 w-5 text-destructive mt-0.5" />
          <div className="text-sm">
            <strong>Crédits NON DÉSPÉCIALISABLES</strong> (règle DAF A3) : C/443110 (bourses nationales),
            C/44114 / 441914 (AED programme 230). Reversement familles ou restitution rectorat uniquement.
          </div>
        </CardContent>
      </Card>

      <Input
        placeholder="Rechercher par numéro de compte, libellé ou programme BOP…"
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
      />

      {loading && <div className="text-sm text-muted-foreground">Chargement du référentiel…</div>}

      {grouped.map(([famille, list]) => (
        <Card key={famille}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {FAMILLE_LABELS[famille] ?? famille}{" "}
                <Badge variant="outline" className="ml-2">{famille}</Badge>
              </h3>
              <span className="text-xs text-muted-foreground">{list.length} compte(s)</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>BOP</TableHead>
                  <TableHead>Sens normal</TableHead>
                  <TableHead>Déspéc.</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => (
                  <TableRow key={c.compte} className={!c.despecialisable ? "bg-destructive/5" : ""}>
                    <TableCell className="font-mono">{c.compte}</TableCell>
                    <TableCell>{c.libelle}</TableCell>
                    <TableCell className="text-xs">
                      {c.programme_bop ?? "—"}
                      {c.sous_programme && <div className="text-muted-foreground">{c.sous_programme}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.sens_solde_normal === "D" ? "default" : "secondary"}>
                        {c.sens_solde_normal}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.despecialisable ? (
                        <ShieldCheck className="h-4 w-4 text-success" />
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <Lock className="h-3 w-3" /> NON
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.reference_reglementaire ?? "—"}
                      {c.niveau_alerte_si_anormal === "critique" && (
                        <AlertTriangle className="inline h-3 w-3 ml-1 text-destructive" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}