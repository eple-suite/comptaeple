import { motion } from "framer-motion";
import { FileText, Download, Eye, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sections = [
  { num: 1, title: "Présentation de l'établissement", status: "ready" },
  { num: 2, title: "Analyse financière de l'exercice", status: "ready" },
  { num: 3, title: "Analyse du fonds de roulement", status: "ready" },
  { num: 4, title: "Analyse de la trésorerie", status: "ready" },
  { num: 5, title: "Analyse des créances", status: "warning" },
  { num: 6, title: "Analyse des subventions (441/443110)", status: "ready" },
  { num: 7, title: "Service restauration et SRH", status: "draft" },
  { num: 8, title: "Investissements et immobilisations", status: "draft" },
];

const statusConfig = {
  ready: { label: "Prêt", class: "bg-success/10 text-success border-0" },
  warning: { label: "À vérifier", class: "bg-warning/10 text-warning border-0" },
  draft: { label: "Brouillon", class: "bg-muted text-muted-foreground border-0" },
};

const AccountingAnnex = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Annexe comptable</h1>
            <p className="text-sm text-muted-foreground mt-1">Génération automatique — Exercice N-1 (2023)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" /> Aperçu
            </Button>
            <Button size="sm" className="gradient-primary border-0">
              <Download className="h-4 w-4 mr-1" /> Exporter PDF
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-primary">{sections.filter(s => s.status === "ready").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Sections prêtes</p>
        </Card>
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-warning">{sections.filter(s => s.status === "warning").length}</p>
          <p className="text-xs text-muted-foreground mt-1">À vérifier</p>
        </Card>
        <Card className="shadow-card text-center p-5">
          <p className="text-3xl font-bold text-muted-foreground">{sections.filter(s => s.status === "draft").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Brouillons</p>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Sections de l'annexe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section) => (
            <motion.div
              key={section.num}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: section.num * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {section.num}
                </div>
                <div>
                  <p className="text-sm font-medium">{section.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`text-[10px] ${statusConfig[section.status as keyof typeof statusConfig].class}`}>
                  {statusConfig[section.status as keyof typeof statusConfig].label}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingAnnex;
