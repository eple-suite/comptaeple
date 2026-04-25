import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { buildCockpitDataset } from "@/lib/cockpit/dataBuilder";
import { EnTeteRepublique } from "./EnTeteRepublique";
import { CarteIdentiteGroupement } from "./CarteIdentiteGroupement";
import { KpiCockpitGrid } from "./KpiCockpitGrid";
import { HeatmapEple } from "./HeatmapEple";
import { AlertesTransversesPanel } from "./AlertesTransversesPanel";
import { CalendrierTimeline } from "./CalendrierTimeline";
import { ProfilSwitcher, type ProfilCockpit } from "./ProfilSwitcher";
import { PremierUsageBanner } from "./PremierUsageBanner";
import { TourGuide } from "./TourGuide";
import { ModeDemoBadge } from "./ModeDemoBadge";
import { exportCockpitPDF } from "./exportCockpitPdf";

const TOUR_KEY = "cockpit_tour_complete";
const PROFIL_KEY = "cockpit_profil_actif";

export function Cockpit() {
  const { profile, role } = useAuth();
  const [demo, setDemo] = useState(false);
  const [profil, setProfil] = useState<ProfilCockpit>(() => {
    return (localStorage.getItem(PROFIL_KEY) as ProfilCockpit) || 'agent_comptable';
  });
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDone, setTourDone] = useState(() => localStorage.getItem(TOUR_KEY) === 'true');

  useEffect(() => { localStorage.setItem(PROFIL_KEY, profil); }, [profil]);

  const { data: dataset, refetch, isLoading } = useQuery({
    queryKey: ['cockpit-dataset', demo],
    queryFn: () => buildCockpitDataset({ demo }),
    staleTime: 60_000,
  });

  const isAdmin = role === 'admin';
  const greeting = profile?.first_name ? `${profile.first_name}` : 'Agent comptable';

  // Filtrage selon profil
  const view = useMemo(() => {
    if (!dataset) return null;
    if (profil === 'ordonnateur') {
      // Vue restreinte : pas de FDR/BFR/trésorerie consolidés
      return {
        ...dataset,
        kpis: dataset.kpis.filter(k => !['tresorerie', 'fdr', 'cicf'].includes(k.id)),
      };
    }
    if (profil === 'secretaire_general') {
      return { ...dataset, kpis: dataset.kpis.filter(k => ['echeances', 'voyages', 'marches', 'anomalies'].includes(k.id)) };
    }
    if (profil === 'regisseur' || profil === 'autre') {
      return { ...dataset, kpis: dataset.kpis.filter(k => ['anomalies', 'echeances'].includes(k.id)) };
    }
    return dataset;
  }, [dataset, profil]);

  const finishTour = (completed: boolean) => {
    setTourOpen(false);
    if (completed) { localStorage.setItem(TOUR_KEY, 'true'); setTourDone(true); }
  };

  if (isLoading || !view) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement du cockpit…</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-5 max-w-[1400px] mx-auto">
        <EnTeteRepublique
          groupement={view.groupement.nom}
          rectorat={view.groupement.rectorat}
          siege={view.groupement.siege}
        />

        {!tourDone && (
          <PremierUsageBanner
            onStart={() => setTourOpen(true)}
            onDismiss={() => { localStorage.setItem(TOUR_KEY, 'true'); setTourDone(true); }}
          />
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold">Bonjour, <span className="font-serif-accent text-primary">{greeting}</span></h1>
            <p className="text-xs text-muted-foreground">Cockpit consolidé · {view.eples.length} EPLE · Exercice {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ProfilSwitcher value={profil} onChange={setProfil} />
            <ModeDemoBadge active={demo} onToggle={() => setDemo(d => !d)} isAdmin={isAdmin} />
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs gap-1.5"><RefreshCw className="h-3 w-3" /> Actualiser</Button>
            <Button size="sm" onClick={() => exportCockpitPDF(view, view.groupement.agentComptable)} className="h-7 text-xs gap-1.5"><Download className="h-3 w-3" /> Exporter cockpit</Button>
          </div>
        </div>

        <KpiCockpitGrid kpis={view.kpis} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {profil !== 'ordonnateur' && profil !== 'regisseur' && (
              <HeatmapEple eples={view.eples} />
            )}
            <CalendrierTimeline />
          </div>
          <div className="space-y-4">
            <AlertesTransversesPanel alertes={view.alertes} eples={view.eples} />
            <CarteIdentiteGroupement dataset={view} />
          </div>
        </div>

        <TourGuide open={tourOpen} onClose={finishTour} />
      </div>
    </TooltipProvider>
  );
}
