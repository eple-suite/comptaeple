import { useState } from "react";
import { motion } from "framer-motion";
import { Landmark, BookOpen, Coins, FileSignature } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import JournalCaisseTab from "./regies/JournalCaisseTab";
import BilletageTab from "./regies/BilletageTab";
import ModelesRegieTab from "./regies/ModelesRegieTab";

const RegiesCaisse = () => {
  const { selectedEstablishment } = useEstablishment();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Régies & Caisse</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tenue de caisse, billetage et actes constitutifs de régie — M9.6 2026
              {selectedEstablishment && (
                <span className="ml-2">
                  — <strong>{selectedEstablishment.name}</strong>
                  <Badge variant="outline" className="ml-1 text-[9px]">{selectedEstablishment.uai}</Badge>
                </span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="journal">
        <TabsList className="flex-wrap">
          <TabsTrigger value="journal"><BookOpen className="h-3.5 w-3.5 mr-1" /> Journal de caisse</TabsTrigger>
          <TabsTrigger value="billetage"><Coins className="h-3.5 w-3.5 mr-1" /> Billetage</TabsTrigger>
          <TabsTrigger value="modeles"><FileSignature className="h-3.5 w-3.5 mr-1" /> Modèles d'actes</TabsTrigger>
        </TabsList>

        <TabsContent value="journal"><JournalCaisseTab /></TabsContent>
        <TabsContent value="billetage"><BilletageTab /></TabsContent>
        <TabsContent value="modeles"><ModelesRegieTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RegiesCaisse;
