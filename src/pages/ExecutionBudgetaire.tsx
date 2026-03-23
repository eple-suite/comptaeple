import { TrendingUp, FileText, Receipt, Scale, ShieldCheck, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useCofiepleStore } from "@/store/useCofiepleStore";
import { generateRapportExecution } from "@/lib/rapportExecutionPdf";
import { toast } from "sonner";
import SituationDepensesTab from "./execution/SituationDepensesTab";
import SituationRecettesTab from "./execution/SituationRecettesTab";
import CoherenceBudgetaireTab from "./execution/CoherenceBudgetaireTab";
import ControlesACTab from "./execution/ControlesACTab";
import type { LigneSDE, LigneSDR } from "@/lib/cofieple_types";

const ExecutionBudgetaire = () => {
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const sdeRows = useCofiepleStore(s => s.sde[activeBudget]) as LigneSDE[];
  const sdrRows = useCofiepleStore(s => s.sdr[activeBudget]) as LigneSDR[];
  const etab = useCofiepleStore(s => s.etablissement);

  const hasSDE = sdeRows && sdeRows.length > 0;
  const hasSDR = sdrRows && sdrRows.length > 0;
  const canGenerateReport = hasSDE || hasSDR;

  const handleGenerateReport = () => {
    try {
      generateRapportExecution({
        etab,
        sdeRows: sdeRows || [],
        sdrRows: sdrRows || [],
      });
      toast.success('Rapport généré avec succès');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du rapport');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          icon={TrendingUp}
          title="Exécution budgétaire"
          description="Analyse des situations de dépenses et de recettes — M9-6 Tome 2"
        />
        <Button
          onClick={handleGenerateReport}
          disabled={!canGenerateReport}
          className="shrink-0"
        >
          <Printer className="h-4 w-4 mr-2" />
          Rapport complet (PDF)
        </Button>
      </div>

      <Tabs defaultValue="depenses">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="depenses"><FileText className="h-3.5 w-3.5 mr-1.5" /> Situation des dépenses</TabsTrigger>
          <TabsTrigger value="recettes"><Receipt className="h-3.5 w-3.5 mr-1.5" /> Situation des recettes</TabsTrigger>
          <TabsTrigger value="coherence"><Scale className="h-3.5 w-3.5 mr-1.5" /> Cohérence & Équilibre</TabsTrigger>
          <TabsTrigger value="controles"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Contrôles de l'agent comptable</TabsTrigger>
        </TabsList>
        <TabsContent value="depenses"><SituationDepensesTab /></TabsContent>
        <TabsContent value="recettes"><SituationRecettesTab /></TabsContent>
        <TabsContent value="coherence"><CoherenceBudgetaireTab /></TabsContent>
        <TabsContent value="controles"><ControlesACTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutionBudgetaire;
