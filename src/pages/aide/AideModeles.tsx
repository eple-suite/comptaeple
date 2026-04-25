import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { MODELES_SEED } from "@/data/aide/modeles";
import { MODULES } from "@/data/aide/types";

export default function AideModeles() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState(params.get("module") ?? "all");

  const filtered = useMemo(() => {
    return MODELES_SEED.filter((m) => {
      if (moduleFilter !== "all" && m.module !== moduleFilter) return false;
      if (!q.trim()) return true;
      const blob = `${m.nom} ${m.description ?? ""} ${m.tags.join(" ")} ${m.references_legales.join(" ")}`.toLowerCase();
      return blob.includes(q.toLowerCase());
    });
  }, [q, moduleFilter]);

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/aide")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Mode d'emploi
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Bibliothèque des modèles</CardTitle>
          <p className="text-sm text-muted-foreground">{MODELES_SEED.length} modèles institutionnels — actes, courriers, conventions, PV.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un modèle…" className="pl-9" />
            </div>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">Tous les modules</option>
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((m, i) => (
          <Card key={i} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-medium text-sm">{m.nom}</div>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">{m.type_doc}</Badge>
              </div>
              {m.description && <p className="text-xs text-muted-foreground mb-2">{m.description}</p>}
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">{MODULES.find((x) => x.id === m.module)?.label ?? m.module}</Badge>
                {m.destinataire && <Badge variant="outline" className="text-[10px]">→ {m.destinataire}</Badge>}
                {m.references_legales.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="pt-6 text-center text-muted-foreground">Aucun modèle.</CardContent></Card>
        )}
      </div>
    </div>
  );
}