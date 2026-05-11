// ════════════════════════════════════════════════════════════════
// Page de pilotage du Mode démonstration — pitch rectorat
// ════════════════════════════════════════════════════════════════
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sparkles,
  Power,
  PowerOff,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Building2,
  Users,
  Wallet,
  GraduationCap,
} from "lucide-react";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { DEMO_ETABLISSEMENT, DEMO_POINTS_VIGILANCE } from "@/lib/demo/fixtures";

export default function Demo() {
  const { isDemoMode, enable, disable } = useDemoMode();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <Badge variant="outline" className="text-xs">Présentation rectorat</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Mode démonstration</h1>
          <p className="text-muted-foreground mt-1">
            Pilotez la démo pour votre présentation au rectorat. Données fictives en mémoire,
            <strong> aucune écriture en base de données</strong>.
          </p>
        </div>
        <div>
          {isDemoMode ? (
            <Button size="lg" variant="outline" onClick={disable}>
              <PowerOff className="h-4 w-4 mr-2" /> Désactiver le mode démo
            </Button>
          ) : (
            <Button size="lg" onClick={enable} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Power className="h-4 w-4 mr-2" /> Activer le mode démonstration
            </Button>
          )}
        </div>
      </div>

      <Alert className={isDemoMode ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" : ""}>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>
          {isDemoMode ? "Mode démonstration actif" : "Mode démonstration inactif"}
        </AlertTitle>
        <AlertDescription>
          {isDemoMode ? (
            <>
              Un bandeau orange est visible en haut de chaque écran. Chaque module affiche les
              points de vigilance correspondants. Les boutons d'enregistrement restent inopérants
              tant que le mode démo est actif (no-op + toast).
            </>
          ) : (
            <>
              Cliquez sur <strong>« Activer le mode démonstration »</strong> pour basculer dans
              un EPLE fictif <em>{DEMO_ETABLISSEMENT.nom}</em>. Vous pourrez revenir aux vraies
              données à tout moment.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Carte d'identité de l'EPLE fictif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Scénario fictif — {DEMO_ETABLISSEMENT.nom}
          </CardTitle>
          <CardDescription>
            EPLE de démonstration utilisé pour la présentation rectorat. UAI&nbsp;:{" "}
            <span className="font-mono">{DEMO_ETABLISSEMENT.uai}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> Élèves
              </div>
              <div className="text-2xl font-bold mt-1">{DEMO_ETABLISSEMENT.nb_eleves}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Budget
              </div>
              <div className="text-2xl font-bold mt-1">
                {(DEMO_ETABLISSEMENT.budget_annuel / 1_000_000).toFixed(1)} M€
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Boursiers
              </div>
              <div className="text-2xl font-bold mt-1">
                {Math.round(DEMO_ETABLISSEMENT.taux_boursiers * 100)}%
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Type</div>
              <div className="text-2xl font-bold mt-1 capitalize">
                {DEMO_ETABLISSEMENT.type}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points de vigilance — le pitch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Points de vigilance à mettre en avant ({DEMO_POINTS_VIGILANCE.length})
          </CardTitle>
          <CardDescription>
            Le scénario combine conformité globale et 4-5 anomalies pédagogiques pour démontrer la
            valeur ajoutée des moteurs d'alerte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEMO_POINTS_VIGILANCE.map((p, i) => (
            <div
              key={i}
              className={`rounded-md border-l-4 p-3 ${
                p.niveau === "rouge"
                  ? "border-l-destructive bg-destructive/5"
                  : "border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.niveau === "rouge" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        <ShieldAlert className="h-3 w-3 mr-1" /> BLOQUANT
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
                        VIGILANCE
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {p.module}
                    </Badge>
                    <span className="text-sm font-semibold">{p.titre}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.detail}</p>
                  {p.reference && (
                    <p className="text-[10px] italic text-muted-foreground mt-1">
                      📚 {p.reference}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!isDemoMode) enable();
                    navigate(p.route);
                  }}
                  className="h-8 text-xs"
                >
                  Démontrer <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Conseil pratique</AlertTitle>
        <AlertDescription className="text-sm">
          Avant la présentation, activez le mode démo, parcourez chaque module via les boutons
          « Démontrer » ci-dessus, puis désactivez-le en fin de séance pour retrouver vos
          données réelles intactes.
        </AlertDescription>
      </Alert>
    </div>
  );
}