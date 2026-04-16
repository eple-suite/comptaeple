import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useAgenceData, type AgenceEpleRow } from "./useAgenceData";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  Building2, AlertTriangle, TrendingUp, Wallet, Activity,
  ArrowRight, Search, ShieldAlert, Calendar, Banknote, BarChart3, MapPin,
} from "lucide-react";

const RISK_LABELS: Record<AgenceEpleRow["niveau_risque"], string> = {
  faible: "Faible",
  modere: "Modéré",
  eleve: "Élevé",
  critique: "Critique",
  inconnu: "Sans données",
};

const RISK_CLASSES: Record<AgenceEpleRow["niveau_risque"], string> = {
  faible: "bg-success/15 text-success border-success/30",
  modere: "bg-warning/15 text-warning border-warning/30",
  eleve: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
  critique: "bg-destructive/15 text-destructive border-destructive/30",
  inconnu: "bg-muted text-muted-foreground border-border",
};

const fmtEuros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const fmtJours = (n: number) => `${Math.round(n || 0)} j`;

function KpiCard({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const toneClass =
    tone === "success" ? "text-success bg-success/10"
    : tone === "warning" ? "text-warning bg-warning/10"
    : tone === "destructive" ? "text-destructive bg-destructive/10"
    : "text-primary bg-primary/10";
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
            <p className="text-xl font-bold text-foreground mt-0.5 truncate">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgencePage() {
  const navigate = useNavigate();
  const { selectEstablishment } = useEstablishment();
  const { rows, totaux, isLoading, isEmpty } = useAgenceData();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | AgenceEpleRow["niveau_risque"]>("all");

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (riskFilter !== "all" && r.niveau_risque !== riskFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.establishment.name.toLowerCase().includes(q) ||
          r.establishment.uai.toLowerCase().includes(q) ||
          r.establishment.city?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, riskFilter, search]);

  const ranked = useMemo(
    () => [...filtered].sort((a, b) => b.score_risque - a.score_risque),
    [filtered]
  );

  const handleOpen = (row: AgenceEpleRow) => {
    selectEstablishment(row.establishment);
    navigate("/hyperale/analyse");
  };

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Building2}
          title="Agence Comptable"
          description="Vue consolidée du portefeuille d'établissements"
        />
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun établissement rattaché</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez vos établissements pour activer la vue consolidée d'agence.
            </p>
            <Button onClick={() => navigate("/etablissements")}>Gérer les établissements</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Agence Comptable"
        description={`Vue consolidée — ${totaux.nbEple} établissement${totaux.nbEple > 1 ? "s" : ""} dans le portefeuille`}
      />

      {/* KPI Consolidés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Wallet}
          label="FDR cumulé"
          value={fmtEuros(totaux.fdrTotal)}
          sub={`${totaux.nbAvecDonnees}/${totaux.nbEple} EPLE avec données`}
          tone={totaux.fdrTotal >= 0 ? "primary" : "destructive"}
        />
        <KpiCard
          icon={Banknote}
          label="Trésorerie totale"
          value={fmtEuros(totaux.tresorerieTotale)}
          sub={`Moyenne ${fmtJours(totaux.joursTresorerieMoyen)} d'autonomie`}
          tone={totaux.tresorerieTotale >= 0 ? "success" : "destructive"}
        />
        <KpiCard
          icon={TrendingUp}
          label="CAF cumulée"
          value={fmtEuros(totaux.cafTotale)}
          sub="Capacité d'autofinancement"
          tone={totaux.cafTotale >= 0 ? "success" : "warning"}
        />
        <KpiCard
          icon={Activity}
          label="Résultat agrégé"
          value={fmtEuros(totaux.resultatTotal)}
          sub="Somme des résultats comptables"
          tone={totaux.resultatTotal >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Répartition risques */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Répartition des risques sur le portefeuille
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => setRiskFilter("critique")}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                riskFilter === "critique" ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/50"
              }`}
            >
              <p className="text-2xl font-bold text-destructive">{totaux.nbCritiques}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Critique</p>
            </button>
            <button
              onClick={() => setRiskFilter("eleve")}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                riskFilter === "eleve" ? "border-orange-500 bg-orange-500/5" : "border-border hover:border-orange-500/50"
              }`}
            >
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totaux.nbEleves}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Élevé</p>
            </button>
            <button
              onClick={() => setRiskFilter("modere")}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                riskFilter === "modere" ? "border-warning bg-warning/5" : "border-border hover:border-warning/50"
              }`}
            >
              <p className="text-2xl font-bold text-warning">{totaux.nbModeres}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Modéré</p>
            </button>
            <button
              onClick={() => setRiskFilter("faible")}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                riskFilter === "faible" ? "border-success bg-success/5" : "border-border hover:border-success/50"
              }`}
            >
              <p className="text-2xl font-bold text-success">{totaux.nbFaibles}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Faible</p>
            </button>
            <button
              onClick={() => setRiskFilter("all")}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                riskFilter === "all" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-2xl font-bold text-primary">{totaux.nbEple}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tous</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs : tableau + classement */}
      <Tabs defaultValue="tableau" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="tableau"><BarChart3 className="h-4 w-4 mr-1.5" />Tableau détaillé</TabsTrigger>
            <TabsTrigger value="classement"><AlertTriangle className="h-4 w-4 mr-1.5" />Top vigilance</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher (nom, UAI, ville)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="tableau" className="m-0">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">Chargement…</div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">Aucun établissement ne correspond aux filtres.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Établissement</TableHead>
                        <TableHead className="text-center">Exercice</TableHead>
                        <TableHead className="text-right">FDR</TableHead>
                        <TableHead className="text-right">Trésorerie</TableHead>
                        <TableHead className="text-center">Jours tréso.</TableHead>
                        <TableHead className="text-right">Résultat</TableHead>
                        <TableHead className="text-center">Risque</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(row => (
                        <TableRow key={row.establishment.id} className="hover:bg-muted/40">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{row.establishment.name}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {row.establishment.uai} · {row.establishment.city || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {row.exercice ? (
                              <Badge variant="outline" className="gap-1 text-[11px]">
                                <Calendar className="h-3 w-3" />{row.exercice}
                              </Badge>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${row.fdr < 0 ? "text-destructive" : ""}`}>
                            {row.hasData ? fmtEuros(row.fdr) : "—"}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${row.tresorerie < 0 ? "text-destructive" : ""}`}>
                            {row.hasData ? fmtEuros(row.tresorerie) : "—"}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {row.hasData ? fmtJours(row.jours_tresorerie) : "—"}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${row.resultat_comptable < 0 ? "text-destructive" : "text-success"}`}>
                            {row.hasData ? fmtEuros(row.resultat_comptable) : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={RISK_CLASSES[row.niveau_risque]}>
                              {RISK_LABELS[row.niveau_risque]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => handleOpen(row)}>
                              Ouvrir <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classement" className="m-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Établissements à surveiller en priorité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ranked.slice(0, 10).map((row, i) => (
                <div
                  key={row.establishment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                  onClick={() => handleOpen(row)}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    i < 3 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{row.establishment.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.establishment.uai} · Score {row.score_risque}/100
                    </p>
                  </div>
                  <Badge variant="outline" className={RISK_CLASSES[row.niveau_risque]}>
                    {RISK_LABELS[row.niveau_risque]}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
