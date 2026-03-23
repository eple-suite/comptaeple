import { TrendingUp, FileText, Receipt, Scale, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import SituationDepensesTab from "./execution/SituationDepensesTab";
import SituationRecettesTab from "./execution/SituationRecettesTab";
import CoherenceBudgetaireTab from "./execution/CoherenceBudgetaireTab";
import ControlesACTab from "./execution/ControlesACTab";

const ExecutionBudgetaire = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Exécution budgétaire"
        description="Analyse des situations de dépenses et de recettes — M9-6 Tome 2"
      />

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
