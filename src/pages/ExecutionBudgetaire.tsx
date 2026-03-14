import { TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import AlertesCreditsTab from "./execution/AlertesCreditsTab";
import PrevisionnelTab from "./execution/PrevisionnelTab";

const ExecutionBudgetaire = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Exécution budgétaire"
        description="Alertes crédits, simulations DBM et prévisionnel N+1"
      />

      <Tabs defaultValue="alertes">
        <TabsList>
          <TabsTrigger value="alertes"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Alertes crédits</TabsTrigger>
          <TabsTrigger value="previsionnel"><BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Prévisionnel N+1</TabsTrigger>
        </TabsList>
        <TabsContent value="alertes"><AlertesCreditsTab /></TabsContent>
        <TabsContent value="previsionnel"><PrevisionnelTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutionBudgetaire;
