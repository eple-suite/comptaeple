import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap, Search, BookOpen, FileText, MessageCircleQuestion, Library, Compass,
  Sparkles, Download, Scale,
} from "lucide-react";
import { MODULES } from "@/data/aide/types";
import { searchAide, statsAide, articlesByModule } from "@/lib/aide/search";
import { exportModulePdf, exportGlossairePdf } from "@/lib/aide/pdfExport";

export default function AideAccueil() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [activeModule, setActiveModule] = useState<string>("all");
  const stats = statsAide();

  const hits = useMemo(() => {
    if (!q.trim()) return [];
    return searchAide(q, { module: activeModule, limit: 30 });
  }, [q, activeModule]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
        <div className="absolute top-0 right-0 h-32 w-32 -mr-10 -mt-10 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mode d'emploi</h1>
              <p className="text-sm text-muted-foreground">Outil de formation académique — niveau IH2EF / EAFC</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <StatCard icon={BookOpen} label="Articles" value={stats.articles} />
            <StatCard icon={Library} label="Glossaire" value={stats.glossaire} />
            <StatCard icon={MessageCircleQuestion} label="FAQ" value={stats.faq} />
            <StatCard icon={FileText} label="Modèles" value={stats.modeles} />
            <StatCard icon={Compass} label="Modules" value={stats.modules} />
          </div>
        </div>
      </div>

      {/* Recherche unifiée */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" /> Recherche transverse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher : CICF, FdR, voyages, RGPD, marché, entretien…"
                className="pl-9"
              />
            </div>
            <select
              value={activeModule}
              onChange={(e) => setActiveModule(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[180px]"
            >
              <option value="all">Tous les modules</option>
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          {q && (
            <ScrollArea className="h-[320px] rounded-md border">
              <div className="divide-y">
                {hits.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">Aucun résultat pour « {q} »</div>
                )}
                {hits.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(h.href)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
                  >
                    <KindIcon kind={h.kind} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{h.titre}</span>
                        {h.moduleLabel && <Badge variant="outline" className="text-[10px]">{h.moduleLabel}</Badge>}
                      </div>
                      {h.resume && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{h.resume}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modules"><BookOpen className="h-4 w-4 mr-2" /> Guides par module</TabsTrigger>
          <TabsTrigger value="parcours"><Sparkles className="h-4 w-4 mr-2" /> Parcours d'onboarding</TabsTrigger>
          <TabsTrigger value="ressources"><Library className="h-4 w-4 mr-2" /> Ressources</TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((m) => {
              const arts = articlesByModule(m.id);
              return (
                <Card key={m.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{m.label}</span>
                      <Badge variant="secondary">{arts.length} fiches</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {arts.slice(0, 3).map((a) => (
                        <li key={a.slug}>
                          <Link to={`/aide/article/${a.slug}`} className="hover:text-primary hover:underline">
                            • {a.titre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/aide/module/${m.id}`)}>
                        Ouvrir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exportModulePdf(m.id, arts)} title="Exporter le guide PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="parcours">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { id: "sg", label: "Secrétaire général", duree: "45 min", etapes: 8, desc: "Saisie courante, instruction, suivi quotidien." },
              { id: "ac", label: "Agent comptable", duree: "60 min", etapes: 10, desc: "Pilotage, contrôles, clôture mensuelle, CICF." },
              { id: "ordo", label: "Ordonnateur / Chef d'établissement", duree: "30 min", etapes: 6, desc: "Validation, signatures, présentation au CA." },
            ].map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{p.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">{p.etapes} étapes</Badge>
                    <Badge variant="outline">{p.duree}</Badge>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => navigate(`/aide/onboarding/${p.id}`)}>
                    Démarrer le parcours
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ressources">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Library className="h-4 w-4" /> Glossaire institutionnel</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{stats.glossaire} entrées : acronymes, termes financiers, références institutionnelles.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate("/aide/glossaire")}>Consulter</Button>
                  <Button size="sm" variant="outline" onClick={() => exportGlossairePdf()}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Bibliothèque de modèles</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{stats.modeles} modèles d'actes, courriers, conventions et tableaux par module.</p>
                <Button size="sm" onClick={() => navigate("/aide/modeles")}>Parcourir</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4" /> Foire aux questions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{stats.faq} questions consolidées tous modules.</p>
                <Button size="sm" onClick={() => navigate("/aide/faq")}>Ouvrir la FAQ</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4" /> Index réglementaire</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">M9-6, GBCP 2012-1246, Code éducation, CCP 2026, RGP 2022-408, RGPD.</p>
                <Button size="sm" onClick={() => navigate("/aide/reglementation")}>Consulter</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card/60 p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: string }) {
  const map: Record<string, React.ElementType> = {
    article: BookOpen, glossaire: Library, faq: MessageCircleQuestion, modele: FileText,
  };
  const Icon = map[kind] ?? BookOpen;
  return (
    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}