import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft, MessageCircleQuestion } from "lucide-react";
import { FAQ_SEED } from "@/data/aide/faq";
import { MODULES } from "@/data/aide/types";

export default function AideFAQ() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    if (q) setParams((p) => { p.set("q", q); return p; });
    else setParams((p) => { p.delete("q"); return p; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    return FAQ_SEED.filter((f) => {
      if (moduleFilter !== "all" && f.module !== moduleFilter) return false;
      if (!q.trim()) return true;
      const blob = `${f.question} ${f.reponse} ${f.tags.join(" ")}`.toLowerCase();
      return blob.includes(q.toLowerCase());
    });
  }, [q, moduleFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof FAQ_SEED>();
    for (const f of filtered) {
      if (!map.has(f.module)) map.set(f.module, []);
      map.get(f.module)!.push(f);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/aide")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Mode d'emploi
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircleQuestion className="h-5 w-5 text-primary" /> Foire aux questions</CardTitle>
          <p className="text-sm text-muted-foreground">{FAQ_SEED.length} questions consolidées tous modules.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans la FAQ…" className="pl-9" />
            </div>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">Tous les modules</option>
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {grouped.map(([modId, items]) => {
        const mod = MODULES.find((m) => m.id === modId);
        return (
          <Card key={modId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {mod?.label ?? modId}
                <Badge variant="secondary">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {items.map((f, i) => (
                  <AccordionItem key={i} value={`${modId}-${i}`}>
                    <AccordionTrigger className="text-sm text-left hover:no-underline">{f.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.reponse}</p>
                      {f.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {f.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {grouped.length === 0 && (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Aucune question ne correspond.</CardContent></Card>
      )}
    </div>
  );
}