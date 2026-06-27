import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, ClipboardCheck, CheckCircle2, AlertTriangle, ListChecks,
  Plus, Trash2, ArrowRight, Map, MessageCircleQuestion, Gauge,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  useAuditStore, scoreMission, cartographie, critMeta,
  type TypeBudget, type Criticite,
} from "@/lib/audit";

const BUDGETS: TypeBudget[] = ["EPLE", "GRETA", "CFA"];

const STATUT_META: Record<string, { label: string; color: string }> = {
  preparation: { label: "Préparation", color: "bg-muted text-muted-foreground border-0" },
  en_cours: { label: "En cours", color: "bg-warning/10 text-warning border-0" },
  cloturee: { label: "Clôturée", color: "bg-success/10 text-success border-0" },
  archivee: { label: "Archivée", color: "bg-muted text-muted-foreground border-0" },
};

type Reponse = { titre: string; corps: string } | null;

const AuditHub = () => {
  const navigate = useNavigate();
  const { selectedEstablishment, establishments = [] } = useEstablishment();
  const missions = useAuditStore((s) => s.missions);
  const creer = useAuditStore((s) => s.creer);
  const remove = useAuditStore((s) => s.remove);

  // ───────── Formulaire nouvelle mission ─────────
  const [etabId, setEtabId] = useState<string>(selectedEstablishment?.id ?? "");
  const [etabLibre, setEtabLibre] = useState("");
  const [etabIdLibre, setEtabIdLibre] = useState("");
  const [budget, setBudget] = useState<TypeBudget>("EPLE");
  const [campagne, setCampagne] = useState<number>(new Date().getFullYear());
  const [reponse, setReponse] = useState<Reponse>(null);

  const aDesEtabs = establishments.length > 0;

  const lancer = () => {
    let id = etabId;
    let nom = "";
    if (aDesEtabs) {
      const e = establishments.find((x) => x.id === etabId);
      if (!e) return;
      id = e.id;
      nom = e.name;
    } else {
      if (!etabIdLibre.trim() || !etabLibre.trim()) return;
      id = etabIdLibre.trim();
      nom = etabLibre.trim();
    }
    const missionId = creer(id, nom, budget, campagne);
    navigate(`/audit/${missionId}`);
  };

  // ───────── Indicateurs consolidés ─────────
  const scores = useMemo(
    () => missions.map((m) => ({ mission: m, score: scoreMission(m) })),
    [missions],
  );

  const nbMissions = missions.length;
  const nbCloturees = missions.filter((m) => m.statut === "cloturee" || m.statut === "archivee").length;
  const tauxMoyen = scores.length
    ? scores.reduce((acc, x) => acc + x.score.tauxConformite, 0) / scores.length
    : 0;
  const totalAnomalies = scores.reduce((acc, x) => acc + x.score.nonConformes + x.score.reserves, 0);
  const totalActions = missions.reduce(
    (acc, m) => acc + m.actions.filter((a) => a.etat === "a_faire" || a.etat === "en_cours").length,
    0,
  );

  // ───────── Cartographie consolidée (pire criticité par domaine) ─────────
  const ORDRE: Criticite[] = ["conforme", "vigilance", "important", "critique"];
  const cartoConsolidee = useMemo(() => {
    const map = new Map<string, { libelle: string; pire: Criticite }>();
    for (const m of missions) {
      for (const e of cartographie(m)) {
        const cur = map.get(e.domaineId);
        if (!cur || ORDRE.indexOf(e.criticite) > ORDRE.indexOf(cur.pire)) {
          map.set(e.domaineId, { libelle: e.libelle, pire: e.criticite });
        }
      }
    }
    return Array.from(map.entries()).map(([domaineId, v]) => ({
      domaineId, libelle: v.libelle, criticite: v.pire,
    }));
  }, [missions]);

  // ───────── Assistant déterministe ─────────
  const repondre = (q: "risques" | "actions" | "restants") => {
    if (missions.length === 0) {
      setReponse({ titre: "Aucune mission", corps: "Lancez une première mission d'audit pour obtenir une analyse." });
      return;
    }
    if (q === "risques") {
      const critiques = cartoConsolidee
        .filter((c) => c.criticite === "critique" || c.criticite === "important")
        .sort((a, b) => ORDRE.indexOf(b.criticite) - ORDRE.indexOf(a.criticite));
      const corps = critiques.length
        ? critiques.map((c) => `${critMeta(c.criticite).emoji} ${c.libelle} (${critMeta(c.criticite).label})`).join(" · ")
        : "Aucun domaine en criticité importante ou critique sur l'ensemble des missions.";
      setReponse({ titre: "Principaux risques", corps });
      return;
    }
    if (q === "actions") {
      const prioritaires = missions.flatMap((m) =>
        m.actions
          .filter((a) => (a.priorite === "critique" || a.priorite === "important") && a.etat !== "fait" && a.etat !== "abandonne")
          .map((a) => `${m.etablissementNom} — ${a.libelle}`),
      );
      const corps = prioritaires.length
        ? prioritaires.slice(0, 8).join(" · ") + (prioritaires.length > 8 ? ` … (+${prioritaires.length - 8})` : "")
        : "Aucune action prioritaire (critique/important) en attente.";
      setReponse({ titre: "Actions prioritaires", corps });
      return;
    }
    const totalCtrl = scores.reduce((acc, x) => acc + x.score.total, 0);
    const totalEval = scores.reduce((acc, x) => acc + x.score.evalues, 0);
    const restants = totalCtrl - totalEval;
    setReponse({
      titre: "Contrôles restants",
      corps: `${restants} contrôle(s) non évalué(s) sur ${totalCtrl} au total (${totalEval} déjà évalués) sur l'ensemble des missions.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Audit complet EPLE"
        description="Contrôle interne comptable — M9-6 / GBCP / RGP"
        badge={{ label: "Module Audit", variant: "secondary" }}
      />

      {/* Nouvelle mission */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Nouvelle mission d'audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            {aDesEtabs ? (
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Établissement</label>
                <Select value={etabId} onValueChange={setEtabId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un établissement" /></SelectTrigger>
                  <SelectContent>
                    {establishments.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}{e.uai ? ` — ${e.uai}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nom de l'établissement</label>
                  <Input value={etabLibre} onChange={(e) => setEtabLibre(e.target.value)} placeholder="Lycée…" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Identifiant (UAI)</label>
                  <Input value={etabIdLibre} onChange={(e) => setEtabIdLibre(e.target.value)} placeholder="0971234X" />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Budget</label>
              <Select value={budget} onValueChange={(v: TypeBudget) => setBudget(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUDGETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Campagne (année)</label>
              <Input
                type="number"
                value={campagne}
                onChange={(e) => setCampagne(Number(e.target.value) || new Date().getFullYear())}
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <Button onClick={lancer} className="rounded-lg">
                <Plus className="h-4 w-4 mr-1" /> Lancer l'audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs consolidés */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Missions" value={`${nbMissions}`} icon={ClipboardCheck} variant="primary" />
        <KpiCard title="Clôturées" value={`${nbCloturees}`} icon={CheckCircle2} variant="success" />
        <KpiCard
          title="Conformité moyenne"
          value={`${tauxMoyen.toFixed(0)}%`}
          icon={Gauge}
          variant={tauxMoyen >= 90 ? "success" : tauxMoyen >= 70 ? "warning" : "destructive"}
        />
        <KpiCard title="Anomalies" value={`${totalAnomalies}`} icon={AlertTriangle} variant="destructive" />
        <KpiCard title="Actions à faire" value={`${totalActions}`} icon={ListChecks} variant="warning" />
      </div>

      {/* Cartographie consolidée des risques */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" /> Cartographie consolidée des risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartoConsolidee.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune donnée — lancez une mission et évaluez des contrôles.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {cartoConsolidee.map((c) => {
                const meta = critMeta(c.criticite);
                return (
                  <div
                    key={c.domaineId}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span className="font-medium truncate flex-1">{c.libelle}</span>
                    <span className={`text-[10px] ${meta.classe}`}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assistant */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-primary" /> Assistant audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => repondre("risques")}>
              Principaux risques ?
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => repondre("actions")}>
              Actions prioritaires ?
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => repondre("restants")}>
              Contrôles restants ?
            </Button>
          </div>
          {reponse && (
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
              <p className="text-xs font-semibold">{reponse.titre}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{reponse.corps}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des missions */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Missions d'audit</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 overflow-x-auto">
          {missions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">Aucune mission. Lancez votre premier audit ci-dessus.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Établissement</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Conformité</TableHead>
                  <TableHead>Anomalies</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map(({ mission, score }) => {
                  const st = STATUT_META[mission.statut] ?? STATUT_META.en_cours;
                  const anomalies = score.nonConformes + score.reserves;
                  return (
                    <TableRow key={mission.id}>
                      <TableCell className="text-xs font-medium">{mission.etablissementNom}</TableCell>
                      <TableCell className="text-xs">{mission.budgetType}</TableCell>
                      <TableCell className="text-xs">{mission.campagne}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{score.tauxConformite.toFixed(0)}%</TableCell>
                      <TableCell className="text-xs">{anomalies}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg">
                            <Link to={`/audit/${mission.id}`}>
                              Ouvrir <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => remove(mission.id)}
                            aria-label="Supprimer la mission"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditHub;
