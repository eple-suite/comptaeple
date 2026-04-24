// ════════════════════════════════════════════════════════════════
// Sidebar alertes permanente — toutes alertes actives de l'EPLE
// Réf : A.3 du cahier des charges rectoral
// ════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ShieldAlert, Info, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { fetchAlertesActivesEtablissement } from "./lib/alertesPersistence";

interface Props {
  establishmentId: string | null;
  refreshKey?: number;
}

const NIVEAU_STYLES: Record<string, { tone: string; Icon: any; label: string }> = {
  critique: {
    tone: "border-l-4 border-l-destructive bg-destructive/5",
    Icon: ShieldAlert,
    label: "BLOQUANT",
  },
  warning: {
    tone: "border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
    Icon: AlertTriangle,
    label: "VIGILANCE",
  },
  info: {
    tone: "border-l-4 border-l-sky-500 bg-sky-50 dark:bg-sky-950/20",
    Icon: Info,
    label: "INFO",
  },
};

function tsRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const j = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (j === 0) return "aujourd'hui";
  if (j === 1) return "hier";
  if (j < 7) return `il y a ${j} j`;
  if (j < 30) return `il y a ${Math.floor(j / 7)} sem`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function SidebarAlertes({ establishmentId, refreshKey = 0 }: Props) {
  const [alertes, setAlertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!establishmentId) return;
    setLoading(true);
    const data = await fetchAlertesActivesEtablissement(establishmentId);
    setAlertes(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId, refreshKey]);

  const counts = useMemo(() => {
    return alertes.reduce(
      (acc, a) => {
        const k = (a.niveau || "info") as keyof typeof acc;
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      },
      { critique: 0, warning: 0, info: 0 } as Record<string, number>,
    );
  }, [alertes]);

  if (!establishmentId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          Sélectionnez un établissement pour voir ses alertes voyages.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Alertes actives ({alertes.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={load}
            disabled={loading}
            title="Actualiser"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <div className="flex gap-1 flex-wrap pt-1">
          {counts.critique > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {counts.critique} bloquant{counts.critique > 1 ? "s" : ""}
            </Badge>
          )}
          {counts.warning > 0 && (
            <Badge className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white">
              {counts.warning} vigilance{counts.warning > 1 ? "s" : ""}
            </Badge>
          )}
          {counts.info > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {counts.info} info{counts.info > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {alertes.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-xs text-muted-foreground">
              Aucune alerte active sur les voyages de cet établissement.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[480px]">
            <div className="space-y-2 p-3">
              {alertes.map((a) => {
                const cfg = NIVEAU_STYLES[a.niveau] || NIVEAU_STYLES.info;
                const Icon = cfg.Icon;
                return (
                  <div key={a.id} className={`rounded-md p-2.5 ${cfg.tone}`}>
                    <div className="flex items-start gap-2">
                      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant={a.niveau === "critique" ? "destructive" : "outline"}
                            className="text-[9px] py-0 px-1"
                          >
                            {cfg.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {tsRelative(a.created_at)}
                          </span>
                        </div>
                        <p className="text-xs font-medium mt-1 leading-tight">
                          {a.message}
                        </p>
                        {a.voyage_libelle && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">
                            🚌 {a.voyage_libelle}
                          </p>
                        )}
                        {a.contexte?.reference_legale && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            📚 {a.contexte.reference_legale}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}