import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFichesPubliees } from "@/hooks/queries/useOpaleFiches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, ThumbsUp, Eye, Plus } from "lucide-react";
import {
  OPALE_MODULES, OPALE_MODULES_LABELS, type OpaleFiche, type OpaleModule, OPALE_TYPES_LABELS,
} from "@/lib/opale/types";
import { BadgeActualite, BadgeVersion } from "@/components/opale/StatutBadges";

export default function OpaleBibliotheque() {
  const { data: fiches = [], isLoading: loading } = useFichesPubliees();
  const [q, setQ] = useState("");
  const [moduleF, setModuleF] = useState<string>("all");
  const [tri, setTri] = useState<string>("recents");

  const filtered = useMemo(() => {
    let arr = fiches;
    if (moduleF !== "all") arr = arr.filter((f) => f.module_opale === moduleF);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (f) =>
          f.titre.toLowerCase().includes(s) ||
          (f.symptome_observe ?? "").toLowerCase().includes(s) ||
          (f.contexte_apparition ?? "").toLowerCase().includes(s) ||
          (f.cause_identifiee ?? "").toLowerCase().includes(s) ||
          f.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    if (tri === "consultations") arr = [...arr].sort((a, b) => b.nb_consultations - a.nb_consultations);
    if (tri === "utilite") arr = [...arr].sort((a, b) => b.taux_utilite_pct - a.taux_utilite_pct);
    if (tri === "alpha") arr = [...arr].sort((a, b) => a.titre.localeCompare(b.titre));
    return arr;
  }, [fiches, q, moduleF, tri]);

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">Bibliothèque de fiches</h1>
          <p className="text-muted-foreground">{filtered.length} fiche(s) publiée(s) consultable(s) par la communauté académique</p>
        </div>
        <Button asChild>
          <Link to="/ressources/opale/nouvelle"><Plus className="h-4 w-4 mr-1" /> Nouvelle fiche</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans titre, symptôme, tags..." className="pl-9" />
          </div>
          <Select value={moduleF} onValueChange={setModuleF}>
            <SelectTrigger><SelectValue placeholder="Module Op@le" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {OPALE_MODULES.map((m) => <SelectItem key={m} value={m}>{OPALE_MODULES_LABELS[m as OpaleModule]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tri} onValueChange={setTri}>
            <SelectTrigger><SelectValue placeholder="Tri" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recents">Plus récents</SelectItem>
              <SelectItem value="consultations">Plus consultés</SelectItem>
              <SelectItem value="utilite">Plus utiles</SelectItem>
              <SelectItem value="alpha">Alphabétique</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Aucune fiche publiée pour le moment. Soyez le premier à contribuer !
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <Link key={f.id} to={`/ressources/opale/fiche/${f.slug}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <BadgeActualite statut={f.statut_actualite} />
                    <BadgeVersion version={f.version_opale_concernee} />
                  </div>
                  <CardTitle className="text-base leading-snug">{f.titre}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{f.symptome_observe}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>{OPALE_MODULES_LABELS[f.module_opale]} · {OPALE_TYPES_LABELS[f.type_contenu]}</span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {f.nb_consultations}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {f.nb_utiles}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}