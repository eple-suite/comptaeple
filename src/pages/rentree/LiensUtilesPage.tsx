import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES_LIBELLES,
  LIENS_INSTITUTIONNELS,
  type CategorieLien,
} from "@/lib/rentree/liensInstitutionnels";

export default function LiensUtilesPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<CategorieLien | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIENS_INSTITUTIONNELS.filter((l) => {
      if (activeCat !== "all" && l.categorie !== activeCat) return false;
      if (!q) return true;
      return (
        l.titre.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    const map = new Map<CategorieLien, typeof LIENS_INSTITUTIONNELS>();
    filtered.forEach((l) => {
      const arr = map.get(l.categorie) ?? [];
      arr.push(l);
      map.set(l.categorie, arr);
    });
    return map;
  }, [filtered]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Tableau de bord</Link>
        </Button>
      </div>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Liens utiles institutionnels</h1>
        <p className="text-muted-foreground mt-1">
          {LIENS_INSTITUTIONNELS.length} ressources officielles classées par thème — sources gouvernementales et académiques.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un lien (titre, description, source)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCat === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCat("all")}
            >
              Toutes ({LIENS_INSTITUTIONNELS.length})
            </Badge>
            {(Object.keys(CATEGORIES_LIBELLES) as CategorieLien[]).map((cat) => {
              const count = LIENS_INSTITUTIONNELS.filter((l) => l.categorie === cat).length;
              if (count === 0) return null;
              return (
                <Badge
                  key={cat}
                  variant={activeCat === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActiveCat(cat)}
                >
                  {CATEGORIES_LIBELLES[cat]} ({count})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Aucun lien ne correspond à votre recherche.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([cat, liens]) => (
            <section key={cat}>
              <h2 className="text-xl font-semibold mb-3">{CATEGORIES_LIBELLES[cat]}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {liens.map((lien) => (
                  <Card key={lien.id} className="hover:shadow-md transition">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-start justify-between gap-2">
                        <a
                          href={lien.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1.5"
                        >
                          {lien.titre}
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        </a>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{lien.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">Source : {lien.source}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}