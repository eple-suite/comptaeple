import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye, ChevronRight, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const sections = [
  { num: 1, title: "Présentation de l'établissement", status: "ready", content: "Cet établissement public local d'enseignement (EPLE) est rattaché à la collectivité territoriale. L'exercice comptable porte sur l'année civile N-1 (2023). Le budget est voté en séance du conseil d'administration et exécuté par l'ordonnateur (chef d'établissement) et le comptable assignataire." },
  { num: 2, title: "Analyse financière de l'exercice", status: "ready", content: "Le résultat de l'exercice s'établit à 15 230 €, résultant d'un total de produits de 1 855 230 € et de charges de 1 840 000 €. Le résultat est excédentaire et sera affecté au fonds de roulement lors du vote du compte financier." },
  { num: 3, title: "Analyse du fonds de roulement", status: "ready", content: "Le fonds de roulement s'élève à 245 832 € soit 42 jours de fonctionnement. Après déduction des éléments de fragilité (stocks, créances anciennes, compte 416), le FDR mobilisable s'établit à 201 432 €. Ce niveau permet d'assurer la continuité du fonctionnement de l'établissement." },
  { num: 4, title: "Analyse de la trésorerie", status: "ready", content: "La trésorerie brute s'élève à 167 382 € (dépôt au Trésor : 158 420 €, caisse : 2 350 €, valeurs à encaisser : 6 612 €). Après déduction des dettes à court terme, la trésorerie propre s'établit à 87 382 €." },
  { num: 5, title: "Analyse des créances", status: "warning", content: "Le total des créances s'élève à 69 400 €. Les créances douteuses (compte 416) représentent 3 200 € et devront faire l'objet d'un examen en vue d'une éventuelle admission en non-valeur. Les créances de subventions (441/443110) représentent 53 700 € et sont en cours de recouvrement auprès des financeurs." },
  { num: 6, title: "Analyse des subventions (441/443110)", status: "ready", content: "Les subventions à recevoir se décomposent en : subventions d'État (bourses 443110) pour 8 700 € et subventions de la collectivité (441) pour 45 000 €. L'ancienneté des créances est satisfaisante (< 6 mois pour l'essentiel)." },
  { num: 7, title: "Service restauration et SRH", status: "draft", content: "Le service de restauration et d'hébergement (SRH) représente 62,3% des charges de personnel. Le crédit nourriture assure la couverture des repas pour le trimestre en cours. Une analyse détaillée est disponible dans le module Crédit Nourriture." },
  { num: 8, title: "Investissements et immobilisations", status: "draft", content: "Les immobilisations s'élèvent à 730 000 € (valeur nette). Les investissements de l'exercice concernent principalement le renouvellement du matériel informatique et la mise aux normes des équipements de restauration." },
];

const statusConfig = {
  ready: { label: "Prêt", class: "bg-success/10 text-success border-0", icon: CheckCircle2 },
  warning: { label: "À vérifier", class: "bg-warning/10 text-warning border-0", icon: AlertTriangle },
  draft: { label: "Brouillon", class: "bg-muted text-muted-foreground border-0", icon: Clock },
};

const AccountingAnnex = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSection, setPreviewSection] = useState<typeof sections[0] | null>(null);

  const handlePreviewAll = () => {
    setPreviewSection(null);
    setPreviewOpen(true);
  };

  const handlePreviewSection = (section: typeof sections[0]) => {
    setPreviewSection(section);
    setPreviewOpen(true);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Titre
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ANNEXE COMPTABLE", pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Exercice N-1 (2023)", pageWidth / 2, 33, { align: "center" });

    doc.setDrawColor(60, 100, 180);
    doc.setLineWidth(0.5);
    doc.line(20, 37, pageWidth - 20, 37);

    let y = 48;

    sections.forEach((section) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 25;
      }

      // Section header
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 60, 120);
      doc.text(`${section.num}. ${section.title}`, 20, y);
      y += 3;

      // Status badge
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const statusLabel = statusConfig[section.status as keyof typeof statusConfig].label;
      doc.setTextColor(120, 120, 120);
      doc.text(`[${statusLabel}]`, 20, y + 5);
      y += 10;

      // Content
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(section.content, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Annexe comptable — Exercice 2023 — Page ${i}/${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }

    doc.save("annexe-comptable-2023.pdf");
    toast({ title: "PDF exporté", description: "Le fichier annexe-comptable-2023.pdf a été téléchargé." });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Annexe comptable</h1>
            <p className="text-sm text-muted-foreground mt-1">Génération automatique — Exercice N-1 (2023)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviewAll}>
              <Eye className="h-4 w-4 mr-1" /> Aperçu
            </Button>
            <Button size="sm" className="gradient-primary border-0" onClick={handleExportPdf}>
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
          {sections.map((section) => {
            const StatusIcon = statusConfig[section.status as keyof typeof statusConfig].icon;
            return (
              <motion.div
                key={section.num}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: section.num * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => handlePreviewSection(section)}
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
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[section.status as keyof typeof statusConfig].label}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialog aperçu */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewSection ? `${previewSection.num}. ${previewSection.title}` : "Aperçu complet de l'annexe comptable"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {(previewSection ? [previewSection] : sections).map((section) => (
              <div key={section.num}>
                {!previewSection && (
                  <h3 className="text-sm font-bold text-primary mb-1">{section.num}. {section.title}</h3>
                )}
                <Badge variant="secondary" className={`text-[10px] mb-2 ${statusConfig[section.status as keyof typeof statusConfig].class}`}>
                  {statusConfig[section.status as keyof typeof statusConfig].label}
                </Badge>
                <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
                {!previewSection && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingAnnex;
