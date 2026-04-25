import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Scale, ShieldCheck, FileSignature, AlertTriangle, BookUser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isDelegationExpired, isDelegationExpiringSoon, validateAgent, validateEstablishment } from "@/lib/parametres/validations";

interface Stats {
  etabs: number;
  agents: number;
  delegActives: number;
  delegExpSoon: number;
  delegExpired: number;
  actes12m: number;
  bottin: number;
  anomaliesEtab: number;
  anomaliesAgent: number;
}

/** Tableau de bord — niveau de complétude et conformité du module Paramètres */
export default function TableauBordTab() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setMonth(since.getMonth() - 12);
      const sinceIso = since.toISOString().slice(0, 10);
      const [etabs, agents, delegs, actes, bottin] = await Promise.all([
        supabase.from("establishments").select("id,uai,siret,email_secretariat,email_intendance,telephone"),
        supabase.from("agents").select("id,email_professionnel,telephone_professionnel,date_naissance,indice_majore,echelon,quotite_travail,statut,corps,role_principal,roles_secondaires,administration_origine").eq("actif", true),
        supabase.from("delegations_signature").select("date_fin,statut"),
        supabase.from("arretes_actes").select("id").gte("date_signature", sinceIso),
        supabase.from("bottin_institutionnel").select("id").eq("actif", true),
      ]);
      const today = new Date();
      let active = 0, expSoon = 0, expired = 0;
      for (const r of (delegs.data || []) as any[]) {
        if (r.statut === "abrogee") continue;
        if (isDelegationExpired(r.date_fin, today)) expired++;
        else if (isDelegationExpiringSoon(r.date_fin, 30, today)) expSoon++;
        else active++;
      }
      const anomaliesEtab = (etabs.data || []).reduce((n, e: any) => n + validateEstablishment(e).filter((x) => x.severity === "error").length, 0);
      const anomaliesAgent = (agents.data || []).reduce((n, a: any) => n + validateAgent(a).filter((x) => x.severity === "error").length, 0);
      setS({
        etabs: etabs.data?.length ?? 0,
        agents: agents.data?.length ?? 0,
        delegActives: active, delegExpSoon: expSoon, delegExpired: expired,
        actes12m: actes.data?.length ?? 0,
        bottin: bottin.data?.length ?? 0,
        anomaliesEtab, anomaliesAgent,
      });
    })();
  }, []);

  if (!s) return <p className="text-sm text-muted-foreground">Calcul en cours…</p>;

  const total = s.anomaliesEtab + s.anomaliesAgent + s.delegExpired;
  const conformite = total === 0 ? "Excellente" : total <= 3 ? "Acceptable" : "À revoir";

  const Tile = ({ icon: I, label, value, hint, color = "text-primary" }: any) => (
    <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><I className={`h-6 w-6 ${color}`} /><div><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div>{hint && <div className="text-[10px] text-muted-foreground italic">{hint}</div>}</div></div></CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Niveau de conformité du groupement</CardTitle><Badge className={total === 0 ? "bg-emerald-100 text-emerald-900" : total <= 3 ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"}>{conformite}</Badge></div></CardHeader>
        <CardContent className="text-xs text-muted-foreground">Sur la base des contrôles GBCP (séparation des fonctions), RAMSESE (UAI), SIRENE (SIRET), et des dates d'expiration des délégations.</CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={Building2} label="Établissements" value={s.etabs} />
        <Tile icon={Users} label="Agents actifs" value={s.agents} />
        <Tile icon={Scale} label="Délégations actives" value={s.delegActives} hint={`${s.delegExpSoon} expirent < 30j`} />
        <Tile icon={FileSignature} label="Actes signés (12 mois)" value={s.actes12m} />
        <Tile icon={BookUser} label="Contacts bottin" value={s.bottin} />
        <Tile icon={ShieldCheck} label="Anomalies établissements" value={s.anomaliesEtab} color={s.anomaliesEtab > 0 ? "text-destructive" : "text-emerald-600"} />
        <Tile icon={ShieldCheck} label="Anomalies agents" value={s.anomaliesAgent} color={s.anomaliesAgent > 0 ? "text-destructive" : "text-emerald-600"} />
        <Tile icon={AlertTriangle} label="Délégations expirées" value={s.delegExpired} color={s.delegExpired > 0 ? "text-destructive" : "text-emerald-600"} />
      </div>
    </div>
  );
}