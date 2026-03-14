import { Landmark, BookOpen, Coins, FileSignature } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import JournalCaisseTab from "./regies/JournalCaisseTab";
import BilletageTab from "./regies/BilletageTab";
import ModelesRegieTab from "./regies/ModelesRegieTab";

const RegiesCaisse = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Landmark}
        title="Régies & Caisse"
        description="Tenue de caisse, billetage et actes constitutifs de régie — M9.6 2026"
      />

      <Tabs defaultValue="journal">
        <TabsList className="flex-wrap">
          <TabsTrigger value="journal"><BookOpen className="h-3.5 w-3.5 mr-1.5" /> Journal de caisse</TabsTrigger>
          <TabsTrigger value="billetage"><Coins className="h-3.5 w-3.5 mr-1.5" /> Billetage</TabsTrigger>
          <TabsTrigger value="modeles"><FileSignature className="h-3.5 w-3.5 mr-1.5" /> Modèles d'actes</TabsTrigger>
        </TabsList>

        <TabsContent value="journal"><JournalCaisseTab /></TabsContent>
        <TabsContent value="billetage"><BilletageTab /></TabsContent>
        <TabsContent value="modeles"><ModelesRegieTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RegiesCaisse;
