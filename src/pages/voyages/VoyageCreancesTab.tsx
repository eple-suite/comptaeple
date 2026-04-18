/**
 * Onglet Créances — Suivi des impayés et liaison SATD
 */
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, FileText, Download, Mail, Clock, Gavel, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Voyage, Eleve } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { toast } from "sonner";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

type StatutCreance = "en_cours" | "relance1" | "relance2" | "mise_en_demeure" | "titre_executoire" | "satd" | "irrecoverable";

const STATUT_CREANCE: Record<StatutCreance, { label: string; class: string; icon: typeof AlertTriangle }> = {
  en_cours: { label: "En cours", class: "bg-warning/10 text-warning", icon: Clock },
  relance1: { label: "1ère relance", class: "bg-warning/10 text-warning", icon: Mail },
  relance2: { label: "2ème relance", class: "bg-orange-100 text-orange-700", icon: Mail },
  mise_en_demeure: { label: "Mise en demeure", class: "bg-destructive/10 text-destructive", icon: FileText },
  titre_executoire: { label: "Titre exécutoire", class: "bg-destructive/10 text-destructive", icon: Gavel },
  satd: { label: "Transmis SATD", class: "bg-primary/10 text-primary", icon: ShieldAlert },
  irrecoverable: { label: "Irrécouv.", class: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

export const VoyageCreancesTab = ({ voyage, onUpdateVoyage }: Props) => {
  const navigate = useNavigate();
  const [creanceStatuts, setCreanceStatuts] = useState<Record<string, StatutCreance>>({});

  const creances = useMemo(() => {
    return voyage.eleves
      .map(e => {
        const totalPaye = e.paiements.reduce((s, p) => s + p.montant, 0);
        const reste = e.participationDue - totalPaye;
        if (reste <= 0.01) return null;
        const lastPaiement = e.paiements.length > 0 ? e.paiements[e.paiements.length - 1] : null;
        const joursRetard = voyage.dateLimiteInscription
          ? Math.max(0, Math.floor((Date.now() - new Date(voyage.dateLimiteInscription).getTime()) / 86400000))
          : 0;
        return {
          eleve: e,
          reste,
          totalPaye,
          joursRetard,
          lastPaiement,
          statut: creanceStatuts[e.id] || (joursRetard > 90 ? "mise_en_demeure" : joursRetard > 30 ? "relance1" : "en_cours") as StatutCreance,
        };
      })
      .filter(Boolean) as {
        eleve: Eleve; reste: number; totalPaye: number; joursRetard: number;
        lastPaiement: { date: string; montant: number } | null; statut: StatutCreance;
      }[];
  }, [voyage.eleves, voyage.dateLimiteInscription, creanceStatuts]);

  const totalCreances = creances.reduce((s, c) => s + c.reste, 0);
  const nbCritiques = creances.filter(c => ["mise_en_demeure", "titre_executoire", "satd"].includes(c.statut)).length;

  const handleStatutChange = (eleveId: string, statut: StatutCreance) => {
    setCreanceStatuts(prev => ({ ...prev, [eleveId]: statut }));
    toast.success("Statut de la créance mis à jour");
  };

  const handleTransferSATD = () => {
    const satdEligible = creances.filter(c => c.statut === "titre_executoire");
    if (satdEligible.length === 0) {
      toast.error("Aucune créance avec titre exécutoire à transmettre");
      return;
    }
    satdEligible.forEach(c => handleStatutChange(c.eleve.id, "satd"));
    toast.success(`${satdEligible.length} créance(s) transmise(s) au module SATD`);
    setTimeout(() => navigate("/satd"), 1500);
  };

  const generateEtatCreancesPDF = () => {
    const doc = createStyledPDF({
      title: "État des créances — Voyages scolaires",
      subtitle: `${voyage.intitule || voyage.destination} — ${voyage.classe}`,
    });
    autoTable(doc, {
      startY: 52,
      head: [["Élève", "Classe", "Dû", "Payé", "Reste", "Jours retard", "Statut"]],
      body: creances.map(c => [
        `${c.eleve.nom} ${c.eleve.prenom}`,
        c.eleve.classe,
        formatCurrency(c.eleve.participationDue),
        formatCurrency(c.totalPaye),
        formatCurrency(c.reste),
        String(c.joursRetard),
        STATUT_CREANCE[c.statut].label,
      ]),
      headStyles: { fillColor: [180, 40, 40], textColor: 255 },
      foot: [["", "", "", "", formatCurrency(totalCreances), "", ""]],
      footStyles: { fillColor: [240, 244, 248], fontStyle: "bold" },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8 },
    });
    const y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Total des créances : ${formatCurrency(totalCreances)} — ${creances.length} famille(s) concernée(s)`, 14, y);
    doc.text(`Dont ${nbCritiques} créance(s) en phase contentieuse`, 14, y + 5);
    doc.text(`Date d'édition : ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 12);
    savePDF(doc, `Creances_${voyage.destination}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("État des créances généré");
  };

  const generateRelancePDF = (c: typeof creances[0]) => {
    const doc = createStyledPDF({ title: "Lettre de relance", subtitle: `Voyage ${voyage.intitule || voyage.destination}` });
    let y = 52;
    doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    doc.text(`${c.eleve.responsable1}`, 14, y); y += 5;
    doc.text(`Objet : Relance — Participation au voyage scolaire`, 14, y + 10); y += 20;
    doc.text(`Madame, Monsieur,`, 14, y); y += 8;
    const text = `Nous vous informons que la participation financière relative au voyage scolaire à ${voyage.destination} (${voyage.dateDepart} — ${voyage.dateRetour}) de votre enfant ${c.eleve.prenom} ${c.eleve.nom} n'a pas été intégralement réglée.\n\nMontant dû : ${formatCurrency(c.eleve.participationDue)}\nMontant réglé : ${formatCurrency(c.totalPaye)}\nSolde restant : ${formatCurrency(c.reste)}\n\nNous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais.\n\nEn l'absence de règlement dans un délai de 15 jours, nous serons contraints d'émettre un titre de recette exécutoire conformément à l'article L. 252 A du Livre des Procédures Fiscales.`;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, 175);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 15;
    doc.text("L'Agent Comptable", 14, y);
    doc.text("_______________________", 14, y + 10);
    savePDF(doc, `Relance_${c.eleve.nom}_${c.eleve.prenom}.pdf`);
    toast.success(`Lettre de relance générée pour ${c.eleve.nom} ${c.eleve.prenom}`);
  };

  if (creances.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-success" />
          </div>
          <h3 className="font-semibold text-lg">Aucune créance en cours</h3>
          <p className="text-sm text-muted-foreground mt-1">Toutes les participations ont été réglées intégralement. 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alerte synthèse */}
      <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold">{creances.length} créance{creances.length > 1 ? "s" : ""} en souffrance — {formatCurrency(totalCreances)}</AlertTitle>
        <AlertDescription className="text-sm">
          {nbCritiques > 0 && <span className="font-semibold">{nbCritiques} dossier(s) en phase contentieuse. </span>}
          Les créances peuvent être transmises au module SATD pour recouvrement forcé après émission du titre exécutoire.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={generateEtatCreancesPDF}>
          <Download className="h-3.5 w-3.5 mr-1" /> État des créances PDF
        </Button>
        <Button size="sm" variant="destructive" onClick={handleTransferSATD}>
          <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Transmettre au SATD
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Tableau créances */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gavel className="h-4 w-4" /> Suivi des créances par famille
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève / Responsable</TableHead>
                <TableHead className="text-right">Dû</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead className="text-center">Retard</TableHead>
                <TableHead className="text-center">Phase</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creances.map(c => {
                const cfg = STATUT_CREANCE[c.statut];
                const Icon = cfg.icon;
                return (
                  <TableRow key={c.eleve.id} className="group">
                    <TableCell>
                      <div className="font-medium text-sm">{c.eleve.nom} {c.eleve.prenom}</div>
                      <div className="text-[10px] text-muted-foreground">{c.eleve.responsable1} — {c.eleve.emailResponsable}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(c.eleve.participationDue)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(c.totalPaye)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-destructive">{formatCurrency(c.reste)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-semibold ${c.joursRetard > 60 ? "text-destructive" : c.joursRetard > 30 ? "text-warning" : ""}`}>
                        J+{c.joursRetard}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] ${cfg.class} border-0`}>
                        <Icon className="h-3 w-3 mr-1" />{cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => generateRelancePDF(c)} title="Lettre de relance">
                          <Mail className="h-3 w-3" />
                        </Button>
                        {c.statut !== "satd" && c.statut !== "irrecoverable" && (
                          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => {
                            const progression: StatutCreance[] = ["en_cours", "relance1", "relance2", "mise_en_demeure", "titre_executoire", "satd"];
                            const idx = progression.indexOf(c.statut);
                            if (idx < progression.length - 1) handleStatutChange(c.eleve.id, progression[idx + 1]);
                          }} title="Phase suivante">
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Connexion SATD */}
      <Card className="shadow-card border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate("/satd")}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Module SATD — Recouvrement forcé</p>
              <p className="text-xs text-muted-foreground">Les créances avec titre exécutoire peuvent être transférées vers le module SATD pour engagement de la procédure de saisie administrative à tiers détenteur.</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};
