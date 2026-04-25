import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, ArrowLeft, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GLOSSAIRE_SEED } from "@/data/aide/glossaire";
import { MODULES } from "@/data/aide/types";
import { exportGlossairePdf } from "@/lib/aide/pdfExport";

export default function AideGlossaire() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState<string>("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return GLOSSAIRE_SEED.filter((g) => {
      if (moduleFilter !== "all" && !g.modules.includes(moduleFilter)) return false;
      if (letter && !(g.acronyme ?? g.terme).toUpperCase().startsWith(letter)) return false;
      if (!q.trim()) return true;
      const blob = `${g.terme} ${g.acronyme ?? ""} ${g.definition}`.toLowerCase();
      return blob.includes(q.toLowerCase());
    }).sort((a, b) => (a.acronyme ?? a.terme).localeCompare(b.acronyme ?? b.terme));
  }, [q, letter, moduleFilter]);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/aide")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Mode d'emploi
        </Button>
        <Button size="sm" onClick={() => exportGlossairePdf(filtered)}>
          <Download className="h-4 w-4 mr-1" /> Exporter PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5 text-primary" /> Glossaire institutionnel</CardTitle>
          <p className="text-sm text-muted-foreground">{GLOSSAIRE_SEED.length} entrées — terminologie M9-6, GBCP, Code éducation, RGPD.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un terme ou un acronyme…" className="pl-9" />
            </div>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">Tous les modules</option>
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={letter === "" ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setLetter("")}>Tout</Button>
            {letters.map((l) => (
              <Button key={l} size="sm" variant={letter === l ? "default" : "ghost"} className="h-7 w-7 p-0 text-xs" onClick={() => setLetter(l)}>{l}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.map((g) => (
          <Card key={`${g.terme}-${g.acronyme ?? ""}`} id={g.acronyme ?? g.terme} className="scroll-mt-20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {(g.acronyme ?? g.terme)[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {g.acronyme && <span className="text-base font-bold text-primary">{g.acronyme}</span>}
                    <span className="font-semibold">{g.terme}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{g.definition}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {g.references_legales.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                    {g.voir_aussi.length > 0 && (
                      <span className="text-[11px] text-muted-foreground ml-2">
                        Voir aussi : {g.voir_aussi.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">Aucun terme trouvé.</CardContent></Card>
        )}
      </div>
    </div>
  );
}