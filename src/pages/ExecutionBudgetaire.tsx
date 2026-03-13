import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import AlertesCreditsTab from "./execution/AlertesCreditsTab";
import PrevisionnelTab from "./execution/PrevisionnelTab";

const ExecutionBudgetaire = () => {
  const { selectedEstablishment } = useEstablishment();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-bold font-display">Exécution budgétaire</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Alertes crédits, simulations DBM et prévisionnel N+1
            {selectedEstablishment && (
              <span className="ml-2">
                — <strong>{selectedEstablishment.name}</strong>
                <Badge variant="outline" className="ml-1 text-[9px]">{selectedEstablishment.uai}</Badge>
              </span>
            )}
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="alertes">
        <TabsList>
          <TabsTrigger value="alertes">🚨 Alertes crédits</TabsTrigger>
          <TabsTrigger value="previsionnel">📊 Prévisionnel N+1</TabsTrigger>
        </TabsList>
        <TabsContent value="alertes"><AlertesCreditsTab /></TabsContent>
        <TabsContent value="previsionnel"><PrevisionnelTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutionBudgetaire;
