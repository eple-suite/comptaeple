import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft } from "lucide-react";
import {
  OPALE_MODULES, OPALE_MODULES_LABELS, OPALE_TYPES_CONTENU, OPALE_TYPES_LABELS,
  type OpaleFiche,
} from "@/lib/opale/types";

/**
 * Recherche avancée : symptôme, contexte, cause, version Op@le, module, type, tags.
 * Implémentation full-text côté client sur fiches publiées (RLS gère déjà l'accès).
 */
export default function OpaleRecherchePage() {
  const [fiches, setFiches] = useState<OpaleFiche[]>([]);
  const [terme, setTerme] = useState("");
  const [moduleF, setModuleF] = useState<string>("all");
  const [typeF, setTypeF] = useState<string>("all");
  const [versionF, setVersionF] = useState<string>("");
  const [actualiteF, setActualiteF] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("opale_fiches")
        .select("*")
        .eq("statut_publication", "publiee")
        .limit(500);
      if (data) setFiches(data as unknown as OpaleFiche[]);
      setLoading(false);
    })();
  }, []);

  const versionsConnues = useMemo(
    () => Array.from(new Set(fiches.map((f) => f.version_opale_concernee).filter(Boolean))).sort(),
    [fiches],
  );

  const resultats = useMemo(() => {
    const t = terme.trim().toLowerCase();
    return fiches
      .filter((f) => moduleF === "all" || f.module_opale === moduleF)
      .filter((f) => typeF === "all" || f.type_contenu === typeF)
      .filter((f) => !versionF || f.version_opale_concernee?.includes(versionF))
      .filter((f) => actualiteF === "all" || f.statut_actualite === actualiteF)
      .filter((f) => {
        if (!t) return true;
        return [
          f.titre,
          f.symptome_observe ?? "",
          f.contexte_apparition ?? "",
          f.cause_identifiee ?? "",
          f.references_documentation_officielle ?? "",
          (f.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(t);
      })
      .sort((a, b) => b.taux_utilite_pct - a.taux_utilite_pct);
  }, [fiches, terme, moduleF, typeF, versionF, actualiteF]);

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/ressources/opale"><ArrowLeft className="h-4 w-4 mr-1" /> Plateforme</Link>
      </Button>
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Recherche avancée</h1>
        <p className="text-muted-foreground">Symptôme, contexte, version Op@le, module, type et statut.</p>
      </header>

      <Card>
        <CardContent className="pt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={terme} onChange={(e) => setTerme(e.target.value)} placeholder="Mots-clés (symptôme, message d'erreur...)" className="pl-9" />
          </div>
          <Select value={moduleF} onValueChange={setModuleF}>
            <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {OPALE_MODULES.map((m) => (
                <SelectItem key={m} value={m}>{OPALE_MODULES_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {OPALE_TYPES_CONTENU.map((t) => (
                <SelectItem key={t} value={t}>{OPALE_TYPES_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actualiteF} onValueChange={setActualiteF}>
            <SelectTrigger><SelectValue placeholder="Fraîcheur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute fraîcheur</SelectItem>
              <SelectItem value="valide">À jour</SelectItem>
              <SelectItem value="a_verifier">À vérifier</SelectItem>
              <SelectItem value="obsolete">Obsolète</SelectItem>
              <SelectItem value="en_revision">En révision</SelectItem>
            </SelectContent>
          </Select>
          <Select value={versionF || "all"} onValueChange={(v) => setVersionF(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Version Op@le" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes versions</SelectItem>
              {versionsConnues.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{loading ? "Recherche..." : `${resultats.length} résultat(s)`}</p>

      <div className="space-y-3">
        {resultats.map((f) => (
          <Link key={f.id} to={`/ressources/opale/fiche/${f.slug}`}>
            <Card className="hover:border-primary/50 transition">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{f.titre}</CardTitle>
                  <Badge variant="outline">Utilité {f.taux_utilite_pct}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p className="line-clamp-2">{f.symptome_observe}</p>
                <p>{OPALE_MODULES_LABELS[f.module_opale]} · Op@le {f.version_opale_concernee} · {f.nb_consultations} vues</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!loading && resultats.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune fiche ne correspond. Essayez d'élargir vos critères ou consultez l'assistance officielle DAF A3.</CardContent></Card>
        )}
      </div>
    </div>
  );
}