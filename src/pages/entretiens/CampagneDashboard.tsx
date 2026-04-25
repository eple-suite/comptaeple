import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ArrowLeft, AlertTriangle, CheckCircle2, Clock, Plus, Search, Users, Calendar, ListChecks, ArrowRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { currentAnneeScolaire } from "@/lib/entretiens/wizard";
import { STATUT_LABELS, type EntretienStatut } from "@/lib/entretiens/types";
import { buildActionsAFaire, URGENCE_LABELS, ACTEUR_COLORS, sortActions, SORT_LABELS, type Urgence, type ActionAgent, type SortKey } from "@/lib/entretiens/actionsAFaire";
import { usePersistedState } from "@/hooks/usePersistedState";

interface Etablissement {
  id: string;
  uai: string;
  name: string;
}

interface Agent {
  id: string;
  establishment_id: string;
  nom: string;
  prenom: string;
  corps: string | null;
  service: string | null;
  fonction: string | null;
  categorie: string | null;
  n1_user_id: string | null;
  n2_user_id: string | null;
  actif: boolean;
}

interface Entretien {
  id: string;
  establishment_id: string;
  agent_evalue_id: string;
  campagne_annee: string;
  statut: EntretienStatut;
  date_entretien: string | null;
  date_convocation: string | null;
  signature_n1_at: string | null;
  signature_agent_at: string | null;
  visa_n2_at: string | null;
  finalise_at: string | null;
}

interface Campagne {
  id: string;
  establishment_id: string;
  annee_scolaire: string;
  libelle: string | null;
  statut: string;
  date_ouverture: string | null;
  date_cloture: string | null;
  date_butoir_signatures: string | null;
}

type StatutGlobal = "non_commence" | "en_cours" | "attente_n1" | "attente_agent" | "attente_n2" | "finalise";

const STATUT_GLOBAL_LABELS: Record<StatutGlobal, { label: string; color: string }> = {
  non_commence: { label: "Non commencé", color: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
  attente_n1: { label: "Attente N+1", color: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  attente_agent: { label: "Attente Agent", color: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200" },
  attente_n2: { label: "Attente N+2", color: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200" },
  finalise: { label: "Finalisé", color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
};

function deriveStatutGlobal(e?: Entretien): StatutGlobal {
  if (!e) return "non_commence";
  if (e.finalise_at || e.statut === "finalise" || e.statut === "archive") return "finalise";
  if (e.signature_agent_at && !e.visa_n2_at) return "attente_n2";
  if (e.signature_n1_at && !e.signature_agent_at) return "attente_agent";
  if (!e.signature_n1_at) return "attente_n1";
  return "en_cours";
}

function joursRestants(dateISO: string | null | undefined): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((+d - +today) / (1000 * 60 * 60 * 24));
}

export default function CampagneDashboard() {
  const { selectedEstablishment } = useEstablishment();
  const [filtreUai, setFiltreUai] = useState<string>("__current");
  const [filtreCampagne, setFiltreCampagne] = useState<string>(currentAnneeScolaire());
  const [filtreStatut, setFiltreStatut] = useState<StatutGlobal | "all">("all");
  const [search, setSearch] = useState("");
  const [vue, setVue] = usePersistedState<"liste" | "actions">("camp_vue", "actions", { urlParam: "vue" });
  const [filtreUrgence, setFiltreUrgence] = usePersistedState<Urgence | "all">("camp_act_urgence", "all", { urlParam: "urg" });
  const [filtreActeur, setFiltreActeur] = usePersistedState<ActionAgent["acteur"] | "all">("camp_act_acteur", "all", { urlParam: "acteur" });
  const [searchActions, setSearchActions] = usePersistedState<string>("camp_act_search", "", { urlParam: "qa" });
  const [tri, setTri] = usePersistedState<SortKey>("camp_act_tri", "urgence", { urlParam: "tri" });

  /* Tous les établissements accessibles */
  const { data: etablissements = [] } = useQuery({
    queryKey: ["camp-etablissements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("establishments").select("id,uai,name").order("uai");
      if (error) throw error;
      return (data ?? []) as Etablissement[];
    },
  });

  const etabIdsActifs = useMemo(() => {
    if (filtreUai === "__current") return selectedEstablishment ? [selectedEstablishment.id] : [];
    if (filtreUai === "__all") return etablissements.map((e) => e.id);
    const e = etablissements.find((x) => x.uai === filtreUai);
    return e ? [e.id] : [];
  }, [filtreUai, etablissements, selectedEstablishment]);

  /* Agents actifs des établissements filtrés */
  const { data: agents = [] } = useQuery({
    queryKey: ["camp-agents", etabIdsActifs],
    queryFn: async () => {
      if (etabIdsActifs.length === 0) return [];
      const { data, error } = await supabase
        .from("agents")
        .select("id,establishment_id,nom,prenom,corps,service,fonction,categorie,n1_user_id,n2_user_id,actif")
        .in("establishment_id", etabIdsActifs)
        .eq("actif", true)
        .order("nom");
      if (error) throw error;
      return (data ?? []) as Agent[];
    },
    enabled: etabIdsActifs.length > 0,
  });

  /* Entretiens de la campagne courante */
  const { data: entretiens = [] } = useQuery({
    queryKey: ["camp-entretiens", etabIdsActifs, filtreCampagne],
    queryFn: async () => {
      if (etabIdsActifs.length === 0) return [];
      const { data, error } = await supabase
        .from("entretiens_professionnels")
        .select("id,establishment_id,agent_evalue_id,campagne_annee,statut,date_entretien,date_convocation,signature_n1_at,signature_agent_at,visa_n2_at,finalise_at")
        .in("establishment_id", etabIdsActifs)
        .eq("campagne_annee", filtreCampagne);
      if (error) throw error;
      return (data ?? []) as Entretien[];
    },
    enabled: etabIdsActifs.length > 0,
  });

  /* Campagnes pour échéances */
  const { data: campagnes = [] } = useQuery({
    queryKey: ["camp-campagnes", etabIdsActifs, filtreCampagne],
    queryFn: async () => {
      if (etabIdsActifs.length === 0) return [];
      const { data, error } = await supabase
        .from("entretiens_campagnes")
        .select("*")
        .in("establishment_id", etabIdsActifs)
        .eq("annee_scolaire", filtreCampagne);
      if (error) throw error;
      return (data ?? []) as Campagne[];
    },
    enabled: etabIdsActifs.length > 0,
  });

  /* Jonction agents ↔ entretien (un agent peut ne pas en avoir → "non commencé") */
  const lignes = useMemo(() => {
    const byAgent = new Map<string, Entretien>();
    entretiens.forEach((e) => byAgent.set(e.agent_evalue_id, e));
    return agents.map((a) => {
      const e = byAgent.get(a.id);
      return {
        agent: a,
        entretien: e,
        etabUai: etablissements.find((x) => x.id === a.establishment_id)?.uai ?? "—",
        statut: deriveStatutGlobal(e),
      };
    });
  }, [agents, entretiens, etablissements]);

  const lignesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lignes.filter((l) => {
      if (filtreStatut !== "all" && l.statut !== filtreStatut) return false;
      if (q) {
        const txt = `${l.agent.nom} ${l.agent.prenom} ${l.agent.service ?? ""} ${l.agent.fonction ?? ""}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [lignes, filtreStatut, search]);

  /* Compteurs */
  const compteurs = useMemo(() => {
    const acc: Record<StatutGlobal, number> = {
      non_commence: 0, en_cours: 0, attente_n1: 0, attente_agent: 0, attente_n2: 0, finalise: 0,
    };
    lignes.forEach((l) => acc[l.statut]++);
    return acc;
  }, [lignes]);

  const total = lignes.length;
  const tauxFinalise = total > 0 ? (compteurs.finalise / total) * 100 : 0;

  /* Actions à faire — moteur pur */
  const uaiByEtabId = useMemo(() => {
    const m: Record<string, string> = {};
    etablissements.forEach((e) => { m[e.id] = e.uai; });
    return m;
  }, [etablissements]);

  const actions = useMemo(
    () => buildActionsAFaire({ agents, entretiens, campagnes, uaiByEtabId }),
    [agents, entretiens, campagnes, uaiByEtabId]
  );

  const actionsFiltrees = useMemo(() => {
    const q = searchActions.trim().toLowerCase();
    const filtres = actions.filter((a) => {
      if (filtreUrgence !== "all" && a.urgence !== filtreUrgence) return false;
      if (filtreActeur !== "all" && a.acteur !== filtreActeur) return false;
      if (q) {
        const txt = `${a.agentNom} ${a.agentPrenom} ${a.libelle}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
    return sortActions(filtres, tri);
  }, [actions, filtreUrgence, filtreActeur, searchActions, tri]);

  const actionsParUrgence = useMemo(() => {
    const acc: Record<Urgence, number> = { critique: 0, haute: 0, moyenne: 0, basse: 0 };
    actions.forEach((a) => acc[a.urgence]++);
    return acc;
  }, [actions]);

  /* Échéances à venir (≤ 30 jours) */
  const echeances = useMemo(() => {
    const items: { label: string; date: string; etab: string; jours: number; type: "butoir" | "cloture" | "entretien" }[] = [];
    campagnes.forEach((c) => {
      const etabUai = etablissements.find((e) => e.id === c.establishment_id)?.uai ?? "—";
      if (c.date_butoir_signatures) {
        const j = joursRestants(c.date_butoir_signatures)!;
        if (j !== null && j >= -7 && j <= 60) items.push({ label: `Butoir signatures campagne ${c.annee_scolaire}`, date: c.date_butoir_signatures, etab: etabUai, jours: j, type: "butoir" });
      }
      if (c.date_cloture) {
        const j = joursRestants(c.date_cloture)!;
        if (j !== null && j >= -7 && j <= 60) items.push({ label: `Clôture campagne ${c.annee_scolaire}`, date: c.date_cloture, etab: etabUai, jours: j, type: "cloture" });
      }
    });
    entretiens.forEach((e) => {
      if (e.date_entretien && !e.finalise_at) {
        const j = joursRestants(e.date_entretien)!;
        if (j !== null && j >= 0 && j <= 30) {
          const a = agents.find((x) => x.id === e.agent_evalue_id);
          const etabUai = etablissements.find((x) => x.id === e.establishment_id)?.uai ?? "—";
          items.push({ label: `Entretien ${a ? `${a.prenom} ${a.nom}` : "agent"}`, date: e.date_entretien, etab: etabUai, jours: j, type: "entretien" });
        }
      }
    });
    return items.sort((a, b) => a.jours - b.jours).slice(0, 12);
  }, [campagnes, entretiens, agents, etablissements]);

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Tableau de bord — Campagne en cours
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des entretiens professionnels CREP / CREF — statuts par N+1/N+2 et échéances réglementaires.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/entretiens"><ArrowLeft className="h-4 w-4 mr-1" />Retour</Link>
          </Button>
          <Button asChild>
            <Link to="/entretiens/nouveau"><Plus className="h-4 w-4 mr-1" />Nouvel entretien</Link>
          </Button>
        </div>
      </header>

      {/* Filtres */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Établissement (UAI)</label>
            <Select value={filtreUai} onValueChange={setFiltreUai}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__current">Établissement actif</SelectItem>
                <SelectItem value="__all">Tous les UAI accessibles</SelectItem>
                {etablissements.map((e) => (
                  <SelectItem key={e.id} value={e.uai}>{e.uai} — {e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Campagne</label>
            <Input value={filtreCampagne} onChange={(e) => setFiltreCampagne(e.target.value)} placeholder="2024-2025" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Statut</label>
            <Select value={filtreStatut} onValueChange={(v) => setFiltreStatut(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {(Object.keys(STATUT_GLOBAL_LABELS) as StatutGlobal[]).map((k) => (
                  <SelectItem key={k} value={k}>{STATUT_GLOBAL_LABELS[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Recherche</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, service…" className="pl-7" />
            </div>
          </div>
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Agents à évaluer" value={total} accent="primary" />
        <KpiCard icon={CheckCircle2} label="Finalisés" value={compteurs.finalise} accent="emerald" hint={`${tauxFinalise.toFixed(0)} %`} />
        <KpiCard icon={Clock} label="En cours" value={compteurs.en_cours + compteurs.attente_n1 + compteurs.attente_agent + compteurs.attente_n2} accent="amber" />
        <KpiCard icon={AlertTriangle} label="Non commencés" value={compteurs.non_commence} accent="rose" />
      </div>

      {/* Avancement */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Avancement de la campagne {filtreCampagne}</div>
          <div className="text-sm text-muted-foreground">{compteurs.finalise} / {total} finalisés</div>
        </div>
        <Progress value={tauxFinalise} className="h-2" />
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.keys(STATUT_GLOBAL_LABELS) as StatutGlobal[]).map((k) => (
            <Badge key={k} variant="outline" className={STATUT_GLOBAL_LABELS[k].color}>
              {STATUT_GLOBAL_LABELS[k].label} : {compteurs[k]}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Onglets de vue */}
      <Tabs value={vue} onValueChange={(v) => setVue(v as "liste" | "actions")}>
        <TabsList>
          <TabsTrigger value="actions" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Actions à faire
            {actions.length > 0 && (
              <Badge variant="secondary" className="ml-1">{actions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="liste" className="gap-2">
            <Users className="h-4 w-4" />
            Liste des agents
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {vue === "actions" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-0 overflow-hidden lg:col-span-2">
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-600" />
                Actions classées par urgence
              </h2>
              <div className="flex flex-wrap gap-1">
                {(["critique", "haute", "moyenne", "basse"] as Urgence[]).map((u) => (
                  <Badge key={u} variant="outline" className={`${URGENCE_LABELS[u].color} cursor-pointer`}
                    onClick={() => setFiltreUrgence(filtreUrgence === u ? "all" : u)}>
                    {URGENCE_LABELS[u].label} : {actionsParUrgence[u]}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-3 border-b bg-muted/20 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Acteur :</span>
                {(["all", "SG", "N+1", "N+2", "Agent"] as const).map((act) => {
                  const count = act === "all" ? actions.length : actions.filter((a) => a.acteur === act).length;
                  const isActive = filtreActeur === act;
                  return (
                    <Badge
                      key={act}
                      variant={isActive ? "default" : "outline"}
                      className={`cursor-pointer text-[11px] ${!isActive && act !== "all" ? ACTEUR_COLORS[act as ActionAgent["acteur"]] : ""}`}
                      onClick={() => setFiltreActeur(act as ActionAgent["acteur"] | "all")}
                      title={`${count} action${count > 1 ? "s" : ""}`}
                    >
                      {act === "all" ? "Tous" : act} <span className="ml-1 opacity-70">({count})</span>
                    </Badge>
                  );
                })}
                {(filtreUrgence !== "all" || filtreActeur !== "all" || searchActions !== "") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs ml-auto"
                    onClick={() => { setFiltreUrgence("all"); setFiltreActeur("all"); setSearchActions(""); }}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchActions}
                  onChange={(e) => setSearchActions(e.target.value)}
                  placeholder="Rechercher un agent (nom, prénom, action)…"
                  className="pl-7 h-8 text-sm"
                />
                {searchActions && (
                  <button
                    type="button"
                    onClick={() => setSearchActions("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    aria-label="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
              </div>
              {(filtreUrgence !== "all" || filtreActeur !== "all" || searchActions !== "") && (
                <div className="text-[11px] text-muted-foreground">
                  {actionsFiltrees.length} / {actions.length} action{actions.length > 1 ? "s" : ""} affichée{actionsFiltrees.length > 1 ? "s" : ""}
                  {searchActions && <> · recherche : « <span className="font-medium text-foreground">{searchActions}</span> »</>}
                </div>
              )}
            </div>
            <ul className="divide-y">
              {actionsFiltrees.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">
                  {actions.length === 0
                    ? "🎉 Aucune action en attente — la campagne est à jour."
                    : "Aucune action ne correspond aux filtres."}
                </li>
              )}
              {actionsFiltrees.map((a, i) => (
                <li key={`${a.agentId}-${a.type}-${i}`} className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 w-20">
                    <Badge variant="outline" className={URGENCE_LABELS[a.urgence].color}>
                      {URGENCE_LABELS[a.urgence].label}
                    </Badge>
                    {a.joursRestants !== null && (
                      <span className={`text-[10px] font-medium ${a.joursRestants < 0 ? "text-rose-600" : a.joursRestants <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {a.joursRestants < 0 ? `Retard ${-a.joursRestants} j` : a.joursRestants === 0 ? "Aujourd'hui" : `J-${a.joursRestants}`}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{a.agentNom.toUpperCase()} {a.agentPrenom}</span>
                      <Badge variant="outline" className="text-[10px]">{a.etabUai}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${ACTEUR_COLORS[a.acteur]}`}>{a.acteur}</Badge>
                    </div>
                    <div className="text-sm mt-0.5">{a.libelle}</div>
                    {a.detail && <div className="text-xs text-muted-foreground mt-0.5">{a.detail}</div>}
                    {a.butoirISO && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Butoir : {a.butoirISO}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="default" asChild className="flex-shrink-0">
                    <Link to={a.href}>
                      Aller à l'agent
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Échéances colonne droite */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" />Échéances à venir</h2>
            {echeances.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune échéance dans les 30 prochains jours.</p>
            )}
            <ul className="space-y-2">
              {echeances.map((e, i) => (
                <li key={i} className="border rounded-md p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{e.etab}</Badge>
                    <span className={`text-xs font-medium ${e.jours < 0 ? "text-rose-600" : e.jours <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {e.jours < 0 ? `Retard ${-e.jours} j` : e.jours === 0 ? "Aujourd'hui" : `J-${e.jours}`}
                    </span>
                  </div>
                  <div className="font-medium mt-1">{e.label}</div>
                  <div className="text-xs text-muted-foreground">{e.date}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tableau principal */}
        <Card className="p-0 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Agents à évaluer</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>UAI</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>N+1</TableHead>
                  <TableHead>N+2</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignesFiltrees.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Aucun agent ne correspond aux filtres.</TableCell></TableRow>
                )}
                {lignesFiltrees.map((l) => {
                  const sg = STATUT_GLOBAL_LABELS[l.statut];
                  const j = joursRestants(l.entretien?.date_entretien ?? null);
                  return (
                    <TableRow key={l.agent.id}>
                      <TableCell>
                        <div className="font-medium">{l.agent.nom.toUpperCase()} {l.agent.prenom}</div>
                        <div className="text-xs text-muted-foreground">{l.agent.corps ?? "—"} · Cat. {l.agent.categorie ?? "?"}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.etabUai}</Badge></TableCell>
                      <TableCell className="text-xs">{l.agent.service ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={sg.color} variant="outline">{sg.label}</Badge>
                        {l.entretien && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">{STATUT_LABELS[l.entretien.statut]}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {l.entretien?.signature_n1_at
                          ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Signé</Badge>
                          : l.agent.n1_user_id
                          ? <Badge variant="outline">À signer</Badge>
                          : <Badge variant="outline" className="bg-rose-50 text-rose-700">Non assigné</Badge>}
                      </TableCell>
                      <TableCell>
                        {l.entretien?.visa_n2_at
                          ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Visé</Badge>
                          : l.agent.n2_user_id
                          ? <Badge variant="outline">À viser</Badge>
                          : <Badge variant="outline" className="bg-rose-50 text-rose-700">Non assigné</Badge>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {l.entretien?.date_entretien ? (
                          <div>
                            <div>{l.entretien.date_entretien}</div>
                            {j !== null && (
                              <div className={`text-[10px] ${j < 0 ? "text-rose-600" : j <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                                {j < 0 ? `Retard ${-j} j` : j === 0 ? "Aujourd'hui" : `dans ${j} j`}
                              </div>
                            )}
                          </div>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Échéances */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" />Échéances à venir</h2>
          {echeances.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune échéance dans les 30 prochains jours.</p>
          )}
          <ul className="space-y-2">
            {echeances.map((e, i) => (
              <li key={i} className="border rounded-md p-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{e.etab}</Badge>
                  <span className={`text-xs font-medium ${e.jours < 0 ? "text-rose-600" : e.jours <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {e.jours < 0 ? `Retard ${-e.jours} j` : e.jours === 0 ? "Aujourd'hui" : `J-${e.jours}`}
                  </span>
                </div>
                <div className="font-medium mt-1">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.date}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent, hint }: { icon: any; label: string; value: number; accent: "primary" | "emerald" | "amber" | "rose"; hint?: string }) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}{hint ? ` · ${hint}` : ""}</div>
        </div>
      </div>
    </Card>
  );
}