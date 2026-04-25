import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Building2, ShieldAlert, Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EpleStat {
  establishment_id: string;
  uai: string;
  nom: string;
  total: number;
  finalises: number;
  en_cours: number;
  recours: number;
  retard: number;
}

/**
 * Vue consolidée AC — entretiens professionnels.
 * Anonymisation : seuls des effectifs agrégés par EPLE sont affichés.
 * Aucune donnée nominative n'apparaît côté agent comptable / rectorat.
 */
export default function VueRectoratEntretiensPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<EpleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [campagne, setCampagne] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campagne]);

  async function load() {
    setLoading(true);
    const { data: ents } = await supabase
      .from("entretiens_professionnels")
      .select("id, establishment_id, statut")
      .eq("campagne_annee", campagne);
    const { data: ets } = await supabase
      .from("establishments")
      .select("id, uai, name");
    const { data: rec } = await supabase
      .from("entretiens_recours")
      .select("entretien_id, statut, entretiens_professionnels!inner(establishment_id, campagne_annee)")
      .eq("entretiens_professionnels.campagne_annee", campagne);

    const byEt: Record<string, EpleStat> = {};
    (ets ?? []).forEach((e: any) => {
      byEt[e.id] = {
        establishment_id: e.id,
        uai: e.uai,
        nom: e.name,
        total: 0,
        finalises: 0,
        en_cours: 0,
        recours: 0,
        retard: 0,
      };
    });
    (ents ?? []).forEach((e: any) => {
      const r = byEt[e.establishment_id];
      if (!r) return;
      r.total++;
      if (e.statut === "finalise" || e.statut === "archive") r.finalises++;
      else r.en_cours++;
      if (e.statut === "recours_en_cours") r.recours++;
    });
    (rec ?? []).forEach((r: any) => {
      const et = byEt[r.entretiens_professionnels?.establishment_id];
      if (et && r.statut === "en_cours") et.recours++;
    });
    setStats(Object.values(byEt).filter((s) => s.total > 0).sort((a, b) => b.total - a.total));
    setLoading(false);
  }

  const totalAgents = stats.reduce((acc, s) => acc + s.total, 0);
  const totalFinalises = stats.reduce((acc, s) => acc + s.finalises, 0);
  const totalRecours = stats.reduce((acc, s) => acc + s.recours, 0);
  const tauxFin = totalAgents > 0 ? Math.round((totalFinalises / totalAgents) * 100) : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate("/entretiens")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Entretiens
      </Button>
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">Vue consolidée — Agence comptable</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Suivi anonymisé des campagnes d'entretiens professionnels par établissement.
        Aucune donnée nominative n'est exposée à ce niveau (RGPD — art. 5.1.c minimisation).
      </p>

      <Alert className="mb-6">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Anonymisation stricte</AlertTitle>
        <AlertDescription>
          Cette vue affiche uniquement des effectifs agrégés. L'identité des agents évalués reste
          confinée à l'établissement (N+1, N+2, agent, SG, chef d'établissement).
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Établissements</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Agents évalués</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Taux finalisation</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tauxFin}%</div>
            <div className="text-xs text-muted-foreground">{totalFinalises} / {totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recours en cours</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalRecours}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Par établissement (campagne {campagne})</CardTitle>
          <div className="flex gap-2">
            {[2024, 2025, 2026].map((y) => (
              <Button
                key={y}
                variant={campagne === String(y) ? "default" : "outline"}
                size="sm"
                onClick={() => setCampagne(String(y))}
              >
                {y}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : stats.length === 0 ? (
            <p className="text-muted-foreground">Aucune donnée pour cette campagne.</p>
          ) : (
            <div className="space-y-2">
              {stats.map((s) => {
                const taux = s.total > 0 ? Math.round((s.finalises / s.total) * 100) : 0;
                return (
                  <div key={s.establishment_id} className="flex items-center gap-3 p-3 border rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{s.nom}</div>
                      <div className="text-xs text-muted-foreground">UAI {s.uai}</div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" /> {s.total}
                    </Badge>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {s.finalises}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" /> {s.en_cours}
                    </Badge>
                    {s.recours > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> {s.recours} recours
                      </Badge>
                    )}
                    <div className="font-bold text-lg w-14 text-right">{taux}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}