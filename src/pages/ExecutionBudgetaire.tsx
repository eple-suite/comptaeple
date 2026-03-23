import { TrendingUp, AlertTriangle, BarChart3, Receipt, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import AlertesCreditsTab from "./execution/AlertesCreditsTab";
import OrdresRecetteTab from "./execution/OrdresRecetteTab";
import AmortissementsDBMTab from "./execution/AmortissementsDBMTab";
import PrevisionnelTab from "./execution/PrevisionnelTab";

const ExecutionBudgetaire = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Exécution budgétaire"
        description="Suivi par service M9-6, ordres de recette, amortissements et prévisionnel N+1"
      />

      <Tabs defaultValue="alertes">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="alertes"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Alertes crédits</TabsTrigger>
          <TabsTrigger value="ordres-recette"><Receipt className="h-3.5 w-3.5 mr-1.5" /> Ordres de recette</TabsTrigger>
          <TabsTrigger value="amortissements"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Amortissements / DBM</TabsTrigger>
          <TabsTrigger value="previsionnel"><BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Prévisionnel N+1</TabsTrigger>
        </TabsList>
        <TabsContent value="alertes"><AlertesCreditsTab /></TabsContent>
        <TabsContent value="ordres-recette"><OrdresRecetteTab /></TabsContent>
        <TabsContent value="amortissements"><AmortissementsDBMTab /></TabsContent>
        <TabsContent value="previsionnel"><PrevisionnelTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutionBudgetaire;
