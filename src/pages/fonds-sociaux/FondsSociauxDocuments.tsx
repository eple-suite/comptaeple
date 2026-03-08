import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemandeAide, Commission, Budget, TYPE_LABELS, NATURES_AIDE, STATUT_CONFIG } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { FileText, Download, Printer, Users, BarChart3 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  demandes: DemandeAide[];
  commissions: Commission[];
  budgets: Budget[];
}

export default function FondsSociauxDocuments({ demandes, commissions, budgets }: Props) {
  const accordes = demandes.filter(d => d.statut === "accorde" || d.statut === "verse");
  const totalVerse = accordes.reduce((s, d) => s + d.montantAccorde, 0);

  const genererNotificationFamille = (d: DemandeAide) => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text("ÉTABLISSEMENT PUBLIC LOCAL D'ENSEIGNEMENT", 20, 20);
    doc.setFontSize(14);
    doc.text("NOTIFICATION DE DÉCISION — Fonds Social", 20, 35);
    doc.setFontSize(10);

    if (d.statut === "accorde" || d.statut === "verse") {
      doc.text(`N° de décision : ${d.numeroDecision}`, 20, 50);
      doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 20, 58);
      doc.text(`Destinataire : ${d.eleve.responsableLegal}`, 20, 70);
      doc.text(`Élève concerné(e) : ${d.eleve.prenom} ${d.eleve.nom} — ${d.eleve.classe}`, 20, 78);
      doc.text("Madame, Monsieur,", 20, 95);
      doc.text("La commission sociale réunie a examiné votre demande d'aide au titre du", 20, 105);
      doc.text(`${TYPE_LABELS[d.type]} pour le motif suivant :`, 20, 112);
      doc.text(`« ${NATURES_AIDE[d.nature] || d.nature} »`, 25, 122);
      doc.text(`La commission a décidé d'accorder une aide d'un montant de ${d.montantAccorde.toFixed(2)} €.`, 20, 135);
      if (d.serviceRestauration) {
        doc.text("Cette aide sera directement imputée sur le compte de restauration de votre enfant.", 20, 145);
      } else {
        doc.text("Le versement sera effectué par virement sur le compte bancaire communiqué.", 20, 145);
      }
      doc.text("Nous vous rappelons que cette aide est confidentielle.", 20, 160);
      doc.text("Le Chef d'Établissement", 130, 190);
    } else {
      doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 20, 50);
      doc.text(`Destinataire : ${d.eleve.responsableLegal}`, 20, 62);
      doc.text(`Élève concerné(e) : ${d.eleve.prenom} ${d.eleve.nom} — ${d.eleve.classe}`, 20, 70);
      doc.text("Madame, Monsieur,", 20, 87);
      doc.text("La commission sociale a examiné votre demande d'aide. Après étude,", 20, 97);
      doc.text("la commission n'a pas donné une suite favorable à cette demande.", 20, 104);
      if (d.motifRefus) {
        doc.text(`Motif : ${d.motifRefus}`, 20, 117);
      }
      doc.text("Vous pouvez, si votre situation évolue, déposer une nouvelle demande.", 20, 130);
      doc.text("Le Chef d'Établissement", 130, 170);
    }

    doc.save(`notification_${d.eleve.nom}_${d.eleve.prenom}.pdf`);
  };

  const genererPieceJustificative = (d: DemandeAide) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("PIÈCE JUSTIFICATIVE COMPTABLE", 20, 25);
    doc.setFontSize(10);
    doc.text(`Fonds Social — ${TYPE_LABELS[d.type]}`, 20, 35);
    doc.text(`N° décision : ${d.numeroDecision}`, 20, 48);
    doc.text(`Mandat : ${d.mandatRef || "En attente"}`, 120, 48);
    doc.text(`Bénéficiaire : ${d.eleve.prenom} ${d.eleve.nom}`, 20, 60);
    doc.text(`Classe : ${d.eleve.classe} — Régime : ${d.eleve.regime === "dp" ? "Demi-pensionnaire" : d.eleve.regime === "interne" ? "Interne" : "Externe"}`, 20, 68);
    doc.text(`Responsable légal : ${d.eleve.responsableLegal}`, 20, 76);
    doc.text(`Nature de l'aide : ${NATURES_AIDE[d.nature] || d.nature}`, 20, 88);
    doc.text(`Motif : ${d.motifDetaille}`, 20, 96);
    doc.text(`Montant accordé : ${d.montantAccorde.toFixed(2)} €`, 20, 110);
    doc.text(`Commission du : ${d.commissionId ? new Date(commissions.find(c => c.id === d.commissionId)?.date || "").toLocaleDateString("fr-FR") : "—"}`, 20, 118);
    doc.text(`Date versement : ${d.dateVersement ? new Date(d.dateVersement).toLocaleDateString("fr-FR") : "En attente"}`, 20, 126);

    if (d.serviceRestauration) {
      doc.text("Mode : Imputation directe sur compte restauration", 20, 138);
    } else {
      doc.text("Mode : Virement bancaire au responsable légal", 20, 138);
    }

    doc.text("Visa du gestionnaire : ___________________", 20, 160);
    doc.text("Visa du chef d'établissement : ___________________", 20, 172);

    doc.save(`piece_justificative_${d.numeroDecision || d.id}.pdf`);
  };

  const genererRapportCA = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("RAPPORT D'ACTIVITÉ — FONDS SOCIAUX", 20, 25);
    doc.setFontSize(10);
    doc.text(`Année scolaire 2024-2025 — Présenté au Conseil d'Administration`, 20, 35);

    doc.setFontSize(12);
    doc.text("1. Données générales", 20, 52);
    doc.setFontSize(10);
    doc.text(`Nombre total de demandes instruites : ${demandes.length}`, 25, 62);
    doc.text(`Nombre de bénéficiaires : ${new Set(accordes.map(d => d.eleveId)).size}`, 25, 70);
    doc.text(`Taux d'acceptation : ${demandes.length > 0 ? ((accordes.length / demandes.length) * 100).toFixed(0) : 0}%`, 25, 78);
    doc.text(`Montant total attribué : ${totalVerse.toFixed(2)} €`, 25, 86);
    doc.text(`Montant moyen par bénéficiaire : ${new Set(accordes.map(d => d.eleveId)).size > 0 ? (totalVerse / new Set(accordes.map(d => d.eleveId)).size).toFixed(2) : 0} €`, 25, 94);

    doc.setFontSize(12);
    doc.text("2. Répartition par type de fonds", 20, 112);
    autoTable(doc, {
      startY: 118,
      head: [["Fonds", "Dotation", "Versé", "Reste", "Taux conso."]],
      body: budgets.map(b => [
        TYPE_LABELS[b.type], `${b.totalDisponible.toFixed(2)} €`, `${b.verse.toFixed(2)} €`,
        `${b.reste.toFixed(2)} €`, `${b.totalDisponible > 0 ? ((b.verse / b.totalDisponible) * 100).toFixed(0) : 0}%`,
      ]),
      styles: { fontSize: 8 },
    });

    const y2 = (doc as any).lastAutoTable?.finalY || 160;

    doc.setFontSize(12);
    doc.text("3. Répartition par nature d'aide", 20, y2 + 15);
    const natures: Record<string, { nb: number; montant: number }> = {};
    accordes.forEach(d => {
      const k = NATURES_AIDE[d.nature] || d.nature;
      if (!natures[k]) natures[k] = { nb: 0, montant: 0 };
      natures[k].nb++;
      natures[k].montant += d.montantAccorde;
    });
    autoTable(doc, {
      startY: y2 + 21,
      head: [["Nature", "Nb dossiers", "Montant total"]],
      body: Object.entries(natures).map(([k, v]) => [k, String(v.nb), `${v.montant.toFixed(2)} €`]),
      styles: { fontSize: 8 },
    });

    const y3 = (doc as any).lastAutoTable?.finalY || 200;

    doc.setFontSize(12);
    doc.text("4. Commissions sociales", 20, y3 + 15);
    autoTable(doc, {
      startY: y3 + 21,
      head: [["Date", "Type", "Dossiers", "Accordés", "Refusés", "Montant"]],
      body: commissions.filter(c => c.statut === "cloturee" || c.statut === "tenue").map(c => {
        const d = demandes.filter(dd => dd.commissionId === c.id);
        const acc = d.filter(dd => dd.statut === "accorde" || dd.statut === "verse");
        return [
          new Date(c.date).toLocaleDateString("fr-FR"), c.type, String(d.length),
          String(acc.length), String(d.filter(dd => dd.statut === "refuse").length),
          `${acc.reduce((s, dd) => s + dd.montantAccorde, 0).toFixed(2)} €`,
        ];
      }),
      styles: { fontSize: 8 },
    });

    doc.save("rapport_fonds_sociaux_CA.pdf");
  };

  const genererRegistreDecisions = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("REGISTRE DES DÉCISIONS — Fonds Sociaux", 20, 20);
    doc.setFontSize(8);
    doc.text(`Extrait au ${new Date().toLocaleDateString("fr-FR")}`, 20, 28);

    autoTable(doc, {
      startY: 35,
      head: [["N° décision", "Date", "Élève", "Classe", "Type", "Nature", "Demandé", "Accordé", "Statut", "Mandat", "Commission"]],
      body: demandes.filter(d => d.numeroDecision).map(d => [
        d.numeroDecision, new Date(d.dateDepot).toLocaleDateString("fr-FR"),
        `${d.eleve.nom} ${d.eleve.prenom}`, d.eleve.classe, d.type,
        NATURES_AIDE[d.nature] || d.nature,
        `${d.montantDemande.toFixed(2)} €`, `${d.montantAccorde.toFixed(2)} €`,
        STATUT_CONFIG[d.statut].label, d.mandatRef || "—",
        commissions.find(c => c.id === d.commissionId)?.date ? new Date(commissions.find(c => c.id === d.commissionId)!.date).toLocaleDateString("fr-FR") : "—",
      ]),
      styles: { fontSize: 7 },
      headStyles: { fontSize: 7 },
    });

    doc.save("registre_decisions_fonds_sociaux.pdf");
  };

  const documents = [
    { icon: BarChart3, title: "Rapport annuel pour le CA", desc: "Synthèse complète pour présentation au Conseil d'Administration", action: genererRapportCA, color: "text-primary" },
    { icon: FileText, title: "Registre des décisions", desc: "Tableau exhaustif de toutes les décisions avec références comptables", action: genererRegistreDecisions, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Générateurs de documents globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((d, i) => (
          <Card key={i} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <d.icon className={`h-5 w-5 ${d.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                </div>
                <Button size="sm" variant="outline" onClick={d.action} className="text-xs h-8">
                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents par dossier */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Documents par dossier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {demandes.filter(d => d.statut === "accorde" || d.statut === "verse" || d.statut === "refuse").map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`text-[10px] ${STATUT_CONFIG[d.statut].color}`}>
                    {d.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{d.eleve.nom} {d.eleve.prenom}</p>
                    <p className="text-[10px] text-muted-foreground">{d.eleve.classe} — {NATURES_AIDE[d.nature]} — {d.numeroDecision || "Sans n°"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererNotificationFamille(d)}>
                    <Printer className="h-3 w-3 mr-1" /> Notification
                  </Button>
                  {(d.statut === "accorde" || d.statut === "verse") && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => genererPieceJustificative(d)}>
                      <FileText className="h-3 w-3 mr-1" /> Pièce compt.
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
