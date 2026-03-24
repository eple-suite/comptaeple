import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Satd, TiersDetenteur, ETAPE_LABELS, STATUT_SATD_CONFIG, TYPE_DEBITEUR_LABELS } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { FileText, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  satds: Satd[];
  tiers: TiersDetenteur[];
}

function getTiers(satd: Satd, tiers: TiersDetenteur[]): TiersDetenteur | undefined {
  return tiers.find(t => t.id === satd.tiersDetenteurId);
}

export default function SatdDocuments({ satds, tiers }: Props) {

  const genererLettreTiersDetenteur = (satd: Satd) => {
    const td = getTiers(satd, tiers);
    const doc = new jsPDF();
    doc.setFontSize(9);
    doc.text(satd.organisme, 20, 15);
    doc.text(`IBAN : ${satd.iban}`, 20, 20);
    doc.text(`BIC : ${satd.bic}`, 20, 25);

    doc.setFontSize(9);
    doc.text(td ? `${td.nom}` : "Tiers détenteur", 120, 40);
    doc.text(td ? td.adresse : "", 120, 45);
    doc.text(td ? `${td.codePostal} ${td.ville}` : "", 120, 50);

    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 120, 60);

    doc.setFontSize(11);
    doc.text("SAISIE ADMINISTRATIVE À TIERS DÉTENTEUR", 20, 75);
    doc.text("Lettre au tiers détenteur", 20, 82);
    doc.setFontSize(9);

    doc.text("Madame, Monsieur,", 20, 95);
    doc.text("En application des articles L. 262-1 et suivants du Livre des procédures fiscales,", 20, 103);
    doc.text("je vous prie de bien vouloir verser entre mes mains, en votre qualité de tiers", 20, 109);
    doc.text(`détenteur de fonds pour le compte de ${satd.debiteur},`, 20, 115);
    doc.text(`la somme de ${satd.montantGlobal.toFixed(2)} € correspondant aux créances suivantes :`, 20, 121);

    autoTable(doc, {
      startY: 128,
      head: [["Compte", "Libellé", "Exercice", "Montant"]],
      body: satd.creances.map(c => [c.compte, c.libelle, String(c.exercice), `${c.resteARecouvrer.toFixed(2)} €`]),
      styles: { fontSize: 8 },
    });

    const y = (doc as any).lastAutoTable?.finalY || 160;
    doc.text("Cette somme est à verser par virement sur le compte dont les références figurent en en-tête.", 20, y + 10);
    doc.text("En cas de contestation, le débiteur dispose d'un délai de deux mois pour former un recours.", 20, y + 18);
    doc.text("Veuillez agréer, Madame, Monsieur, mes salutations distinguées.", 20, y + 30);
    doc.text("L'Agent Comptable", 130, y + 50);

    doc.save(`satd_lettre_tiers_${satd.reference}.pdf`);
  };

  const genererLettreDebiteur = (satd: Satd) => {
    const doc = new jsPDF();
    doc.setFontSize(9);
    doc.text(satd.organisme, 20, 15);

    doc.text(satd.debiteur, 120, 40);
    doc.text(satd.debiteurAdresse, 120, 45);
    doc.text(`${satd.debiteurCP} ${satd.debiteurVille}`, 120, 50);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 120, 60);

    doc.setFontSize(11);
    doc.text("SAISIE ADMINISTRATIVE À TIERS DÉTENTEUR", 20, 75);
    doc.text("Notification au débiteur", 20, 82);
    doc.setFontSize(9);

    doc.text("Madame, Monsieur,", 20, 95);
    doc.text("Je vous informe qu'en application des articles L. 262-1 et suivants du Livre des", 20, 103);
    doc.text("procédures fiscales, j'ai procédé à une saisie administrative à tiers détenteur", 20, 109);
    doc.text(`pour le recouvrement de la somme de ${satd.montantGlobal.toFixed(2)} € correspondant aux`, 20, 115);
    doc.text("créances suivantes :", 20, 121);

    autoTable(doc, {
      startY: 128,
      head: [["Compte", "Libellé", "Exercice", "Montant"]],
      body: satd.creances.map(c => [c.compte, c.libelle, String(c.exercice), `${c.resteARecouvrer.toFixed(2)} €`]),
      styles: { fontSize: 8 },
    });

    const y = (doc as any).lastAutoTable?.finalY || 160;
    const td = getTiers(satd, tiers);
    doc.text(`La saisie a été notifiée à : ${td?.nom || "—"}`, 20, y + 10);
    doc.text("Vous disposez d'un délai de deux mois à compter de la réception de la présente", 20, y + 20);
    doc.text("pour contester cette saisie auprès du juge de l'exécution du tribunal judiciaire", 20, y + 26);
    doc.text("de votre domicile.", 20, y + 32);
    doc.text("L'Agent Comptable", 130, y + 50);

    doc.save(`satd_lettre_debiteur_${satd.reference}.pdf`);
  };

  const genererBordereauRecap = (satd: Satd) => {
    const doc = new jsPDF();
    doc.setFontSize(11);
    doc.text("BORDEREAU RÉCAPITULATIF — SATD", 20, 25);
    doc.setFontSize(9);
    doc.text(`Référence : ${satd.reference}`, 20, 35);
    doc.text(`Date d'émission : ${satd.dateCreation}`, 20, 42);
    doc.text(`Débiteur : ${satd.debiteur} — ${satd.debiteurAdresse}, ${satd.debiteurCP} ${satd.debiteurVille}`, 20, 52);
    const td = getTiers(satd, tiers);
    doc.text(`Tiers détenteur : ${td?.nom || "—"} — ${td?.adresse || ""}, ${td?.codePostal || ""} ${td?.ville || ""}`, 20, 59);

    doc.text("Créances :", 20, 72);
    autoTable(doc, {
      startY: 78,
      head: [["Compte", "Libellé", "Exercice", "Montant initial", "Recouvré", "Reste"]],
      body: satd.creances.map(c => [
        c.compte, c.libelle, String(c.exercice),
        `${c.montantInitial.toFixed(2)} €`, `${c.montantRecouvre.toFixed(2)} €`, `${c.resteARecouvrer.toFixed(2)} €`,
      ]),
      styles: { fontSize: 8 },
    });

    const y = (doc as any).lastAutoTable?.finalY || 120;
    doc.text(`Total créances : ${satd.montantTotal.toFixed(2)} €`, 20, y + 10);
    doc.text(`Frais de poursuites : ${satd.fraisPoursuite.toFixed(2)} €`, 20, y + 17);
    doc.text(`Majorations : ${satd.majorations.toFixed(2)} €`, 20, y + 24);
    doc.setFontSize(10);
    doc.text(`TOTAL À RECOUVRER : ${satd.montantGlobal.toFixed(2)} €`, 20, y + 34);

    doc.setFontSize(9);
    doc.text("Historique de la procédure :", 20, y + 48);
    autoTable(doc, {
      startY: y + 54,
      head: [["Date", "Étape", "Commentaire"]],
      body: satd.etapes.map(e => [
        new Date(e.date).toLocaleDateString("fr-FR"), ETAPE_LABELS[e.type] || e.type, e.commentaire,
      ]),
      styles: { fontSize: 7 },
    });

    doc.save(`satd_bordereau_${satd.reference}.pdf`);
  };

  const genererAvisAvantPoursuites = (satd: Satd) => {
    const doc = new jsPDF();
    doc.setFontSize(9);
    doc.text(satd.organisme, 20, 15);
    doc.text(satd.debiteur, 120, 40);
    doc.text(satd.debiteurAdresse, 120, 45);
    doc.text(`${satd.debiteurCP} ${satd.debiteurVille}`, 120, 50);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 120, 60);

    doc.setFontSize(12);
    doc.text("AVIS AVANT POURSUITES", 20, 75);
    doc.setFontSize(9);
    doc.text(`Réf : ${satd.reference}`, 20, 83);

    doc.text("Madame, Monsieur,", 20, 96);
    doc.text("Malgré nos précédentes relances restées sans effet, vous restez redevable", 20, 104);
    doc.text(`auprès de notre établissement de la somme de ${satd.montantGlobal.toFixed(2)} € au titre de :`, 20, 110);
    doc.text(`« ${satd.motif} »`, 25, 120);
    doc.text("Le présent avis constitue le dernier rappel avant engagement de poursuites.", 20, 133);
    doc.text("Sans régularisation de votre part dans un délai de TRENTE JOURS, nous serons", 20, 141);
    doc.text("contraints de procéder au recouvrement forcé par voie de saisie administrative", 20, 147);
    doc.text("à tiers détenteur (SATD) conformément aux articles L. 262-1 et suivants du", 20, 153);
    doc.text("Livre des procédures fiscales.", 20, 159);
    doc.text("L'Agent Comptable", 130, 190);
    doc.setFontSize(7);
    doc.text("Art. L. 1617-5 al. 4 du CGCT — Envoi obligatoire avant toute poursuite", 20, 270);

    doc.save(`avis_avant_poursuites_${satd.reference}.pdf`);
  };

  const genererDemandeFicoba = (satd: Satd) => {
    const doc = new jsPDF();
    doc.setFontSize(9);
    doc.text(satd.organisme, 20, 15);
    doc.text("Direction Départementale des Finances Publiques", 120, 40);

    doc.setFontSize(12);
    doc.text("DEMANDE DE CONSULTATION FICOBA", 20, 65);
    doc.setFontSize(9);
    doc.text(`Référence : ${satd.reference}`, 20, 75);
    doc.text(`Débiteur : ${satd.debiteur}`, 20, 83);
    doc.text(`Adresse : ${satd.debiteurAdresse}, ${satd.debiteurCP} ${satd.debiteurVille}`, 20, 90);
    doc.text(`Montant de la créance : ${satd.montantGlobal.toFixed(2)} €`, 20, 97);
    doc.text("Madame, Monsieur le Directeur,", 20, 112);
    doc.text("En application de l'article L. 151 A du Livre des procédures fiscales, je sollicite", 20, 122);
    doc.text("la communication des informations relatives aux comptes bancaires détenus par le", 20, 128);
    doc.text("débiteur susmentionné, dans le cadre d'une procédure de recouvrement forcé.", 20, 134);
    doc.text("Cette demande est motivée par l'existence d'une créance certaine, liquide et exigible", 20, 144);
    doc.text(`d'un montant de ${satd.montantGlobal.toFixed(2)} €, pour laquelle les voies amiables sont restées vaines.`, 20, 150);
    doc.text("L'Agent Comptable", 130, 180);
    doc.setFontSize(7);
    doc.text("Art. L. 151 A du LPF — Droit de communication du comptable public", 20, 270);

    doc.save(`demande_ficoba_${satd.reference}.pdf`);
  };

  const genererDemandeAutorisation = (satd: Satd) => {
    const doc = new jsPDF();
    doc.setFontSize(9);
    doc.text("L'Agent Comptable", 20, 15);
    doc.text(satd.organisme, 20, 20);
    doc.text("à", 20, 32);
    doc.text("Monsieur/Madame le/la Chef d'Établissement", 20, 38);
    doc.text(`${satd.organisme}`, 20, 43);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 120, 55);
    doc.setFontSize(12);
    doc.text("DEMANDE D'AUTORISATION DE POURSUITES", 20, 70);
    doc.setFontSize(9);
    doc.text(`Réf : ${satd.reference}`, 20, 78);
    doc.text("Monsieur/Madame le/la Chef d'Établissement,", 20, 92);
    doc.text("Conformément à l'article L. 1617-5 alinéa 2 du Code général des collectivités", 20, 100);
    doc.text("territoriales, j'ai l'honneur de solliciter votre autorisation pour engager une", 20, 106);
    doc.text("procédure de recouvrement forcé (SATD) à l'encontre de :", 20, 112);
    doc.text(`Débiteur : ${satd.debiteur}`, 25, 124);
    doc.text(`Montant : ${satd.montantGlobal.toFixed(2)} €`, 25, 131);
    doc.text(`Motif : ${satd.motif}`, 25, 138);
    doc.text("Les relances amiables et l'avis avant poursuites sont restés sans effet.", 20, 152);
    doc.text("Je vous prie de bien vouloir m'accorder ou me refuser cette autorisation par", 20, 162);
    doc.text("écrit. En cas de refus, celui-ci devra être motivé.", 20, 168);
    doc.text("L'Agent Comptable", 20, 195);
    doc.text("Signature : ____________________", 20, 203);
    doc.text("VISA DE L'ORDONNATEUR", 120, 195);
    doc.text("□ Autorisé    □ Refusé", 120, 203);
    doc.text("Date : ____________________", 120, 211);
    doc.text("Signature : ____________________", 120, 219);
    doc.setFontSize(7);
    doc.text("Art. L. 1617-5 al. 2 du CGCT — Autorisation préalable obligatoire", 20, 270);
    doc.save(`demande_autorisation_${satd.reference}.pdf`);
  };

  const genererMainlevee = (satd: Satd) => {
    const td = getTiers(satd, tiers);
    const doc = new jsPDF();
    doc.setFontSize(9);
    doc.text(satd.organisme, 20, 15);
    doc.text(td ? `${td.nom}` : "Tiers détenteur", 120, 40);
    doc.text(td ? td.adresse : "", 120, 45);
    doc.text(td ? `${td.codePostal} ${td.ville}` : "", 120, 50);
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, 120, 60);
    doc.setFontSize(12);
    doc.text("MAINLEVÉE DE SAISIE ADMINISTRATIVE", 20, 75);
    doc.text("À TIERS DÉTENTEUR", 20, 82);
    doc.setFontSize(9);
    doc.text(`Réf : ${satd.reference}`, 20, 92);
    doc.text("Madame, Monsieur,", 20, 105);
    doc.text("Je vous informe que la saisie administrative à tiers détenteur notifiée le", 20, 113);
    doc.text(`${new Date(satd.dateCreation).toLocaleDateString("fr-FR")} pour un montant de ${satd.montantGlobal.toFixed(2)} €`, 20, 119);
    doc.text(`à l'encontre de ${satd.debiteur} est levée.`, 20, 125);
    doc.text("Cette mainlevée prend effet à compter de la réception de la présente.", 20, 138);
    doc.text("L'Agent Comptable", 130, 170);
    doc.save(`mainlevee_${satd.reference}.pdf`);
  };

  const genererRegistreComplet = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("REGISTRE DES SATD", 20, 20);
    doc.setFontSize(8);
    doc.text(`Extrait au ${new Date().toLocaleDateString("fr-FR")}`, 20, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Réf.", "Débiteur", "Type", "Montant", "Prélevé", "Reste", "Statut", "Création", "Prescription", "Tiers"]],
      body: satds.map(s => [
        s.reference, s.debiteur, TYPE_DEBITEUR_LABELS[s.typeDebiteur],
        `${s.montantGlobal.toFixed(2)} €`, `${s.montantPreleve.toFixed(2)} €`,
        `${(s.montantGlobal - s.montantPreleve).toFixed(2)} €`,
        STATUT_SATD_CONFIG[s.statut].label,
        new Date(s.dateCreation).toLocaleDateString("fr-FR"),
        new Date(s.datePrescription).toLocaleDateString("fr-FR"),
        getTiers(s, tiers)?.nom || "—",
      ]),
      styles: { fontSize: 7 },
      headStyles: { fontSize: 7 },
    });

    doc.save("registre_satd.pdf");
  };

  const satdsAvecDocuments = satds.filter(s => s.statut !== "relance");

  return (
    <div className="space-y-6">
      {/* Documents globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Registre complet des SATD</p>
                <p className="text-xs text-muted-foreground">Tableau récapitulatif de toutes les procédures</p>
              </div>
              <Button size="sm" variant="outline" onClick={genererRegistreComplet} className="text-xs h-8"><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents par procédure */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Documents par procédure</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {satds.map(s => {
              const td = getTiers(s, tiers);
              return (
                <div key={s.id} className="p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={`text-[10px] ${STATUT_SATD_CONFIG[s.statut].color}`}>{s.reference}</Badge>
                      <span className="text-sm font-medium">{s.debiteur}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(s.montantGlobal)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Avis avant poursuites */}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererAvisAvantPoursuites(s)}>
                      <Printer className="h-3 w-3 mr-1" /> Avis avant poursuites
                    </Button>
                    {/* 3 documents SATD */}
                    {(s.statut !== "relance" && s.statut !== "avis_poursuites") && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererLettreDebiteur(s)}>
                          <FileText className="h-3 w-3 mr-1" /> Lettre débiteur
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererLettreTiersDetenteur(s)}>
                          <FileText className="h-3 w-3 mr-1" /> Lettre tiers
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererBordereauRecap(s)}>
                          <FileText className="h-3 w-3 mr-1" /> Bordereau
                        </Button>
                      </>
                    )}
                    {/* Demande FICOBA */}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererDemandeFicoba(s)}>
                      <FileText className="h-3 w-3 mr-1" /> FICOBA
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
