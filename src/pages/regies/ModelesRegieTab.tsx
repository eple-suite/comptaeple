import { useState } from "react";
import { Download, FileSignature } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { createStyledPDF, savePDF } from "@/lib/pdfUtils";

type TypeRegie = "avances_menues" | "recettes" | "avances_voyage" | "temporaire";

const TYPES_REGIE: Record<TypeRegie, { label: string; plafond: string; desc: string }> = {
  avances_menues: { label: "Régie d'avances — Menues dépenses", plafond: "1 000 €", desc: "Dépenses courantes de fonctionnement < seuil réglementaire" },
  recettes: { label: "Régie de recettes", plafond: "Variable", desc: "Encaissement de recettes au comptant (cantine, photocopies, etc.)" },
  avances_voyage: { label: "Régie d'avances — Voyage scolaire", plafond: "Variable", desc: "Avances pour frais de voyage scolaire (transport, hébergement)" },
  temporaire: { label: "Régie temporaire", plafond: "Selon CA", desc: "Régie à durée limitée pour un événement ponctuel" },
};

const ModelesRegieTab = () => {
  const { selectedEstablishment } = useEstablishment();
  const [typeRegie, setTypeRegie] = useState<TypeRegie>("avances_menues");
  const [mandataire, setMandataire] = useState("");
  const [montantPlafond, setMontantPlafond] = useState("1000");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const genererActeConstitutif = () => {
    const est = selectedEstablishment;
    const info = TYPES_REGIE[typeRegie];
    const doc = createStyledPDF({
      title: "Acte Constitutif de Régie",
      subtitle: info.label,
    });

    let y = 48;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("ACTE CONSTITUTIF DE RÉGIE", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    y += 14;
    doc.text(`Vu le décret n° 2012-1246 du 7 novembre 2012 relatif à la gestion budgétaire et comptable publique ;`, 14, y);
    y += 6;
    doc.text(`Vu l'instruction codificatrice M9.6 — régies des EPLE ;`, 14, y);
    y += 6;
    doc.text(`Vu le recueil des régies des EPLE — édition 2023 ;`, 14, y);
    y += 6;
    doc.text(`Vu la délibération du Conseil d'Administration en date du ______________ ;`, 14, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Article 1 — Création", 14, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(`Il est institué auprès de l'établissement ${est?.name || "___________"} (UAI : ${est?.uai || "___________"})`, 14, y);
    y += 6;
    doc.text(`une ${info.label}.`, 14, y);

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Article 2 — Objet", 14, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(info.desc, 14, y);

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Article 3 — Montant maximum de l'avance", 14, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(`Le montant maximum de l'avance consentie au régisseur est fixé à ${formatCurrencySimple(Number(montantPlafond))} €.`, 14, y);

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Article 4 — Mandataire", 14, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(`Le régisseur / mandataire est : ${mandataire || "___________"}`, 14, y);

    if (typeRegie === "temporaire" && dateDebut) {
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text("Article 5 — Durée", 14, y);
      doc.setFont("helvetica", "normal");
      y += 7;
      doc.text(`Du ${dateDebut} au ${dateFin || "___________"}.`, 14, y);
    }

    y += 20;
    doc.text(`Fait à ${est?.city || "___________"}, le ${new Date().toLocaleDateString("fr-FR")}`, 14, y);
    y += 14;
    doc.text("Le Chef d'établissement (Ordonnateur)", 14, y);
    doc.text("L'Agent Comptable", 120, y);
    y += 10;
    doc.text("Signature : ____________________", 14, y);
    doc.text("Signature : ____________________", 120, y);

    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Document généré par Cockpit Comptable EPLE — Conforme M9.6 2026 — Décret 2012-1246", 14, y + 16);

    savePDF(doc, `acte_regie_${typeRegie}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const genererPVInventaire = () => {
    const est = selectedEstablishment;
    const doc = createStyledPDF({
      title: "PV d'Inventaire de Caisse",
      subtitle: `${est?.name || "Établissement"} — Contrôle périodique`,
    });

    let y = 48;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Établissement : ${est?.name || "___________"}`, 14, y);
    doc.text(`UAI : ${est?.uai || "___________"}    Op@le : ${est?.opale_number || "___________"}`, 14, y + 6);
    doc.text(`Date du contrôle : ${new Date().toLocaleDateString("fr-FR")}`, 14, y + 12);
    doc.text(`Mandataire / Régisseur : ${mandataire || "___________"}`, 14, y + 18);

    y += 30;
    doc.setFont("helvetica", "bold");
    doc.text("1. Vérification du numéraire", 14, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text("Solde théorique (journal de caisse) : ________________ €", 14, y);
    y += 7;
    doc.text("Solde physique (billetage) : ________________ €", 14, y);
    y += 7;
    doc.text("Écart constaté : ________________ €", 14, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("2. Vérification des pièces justificatives", 14, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text("□ Toutes les pièces sont présentes et conformes", 14, y);
    y += 7;
    doc.text("□ Pièces manquantes (détail) : ________________________________", 14, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("3. Observations", 14, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text("__________________________________________________________", 14, y);
    y += 7;
    doc.text("__________________________________________________________", 14, y);

    y += 20;
    doc.text(`Fait à ${est?.city || "___________"}, le ${new Date().toLocaleDateString("fr-FR")}`, 14, y);
    y += 14;
    doc.text("Le Mandataire / Régisseur", 14, y);
    doc.text("L'Agent Comptable", 120, y);
    y += 10;
    doc.text("Signature : ____________________", 14, y);
    doc.text("Signature : ____________________", 120, y);

    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Réf. : M9.6 — Recueil des régies 2023 — Décret 2012-1246 art. 22 et 23", 14, y + 16);

    savePDF(doc, `PV_inventaire_caisse_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Acte constitutif */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="h-4 w-4" /> Acte constitutif de régie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type de régie</Label>
              <Select value={typeRegie} onValueChange={(v: TypeRegie) => setTypeRegie(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPES_REGIE).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{TYPES_REGIE[typeRegie].desc}</p>
            </div>
            <div>
              <Label>Mandataire / Régisseur</Label>
              <Input value={mandataire} onChange={e => setMandataire(e.target.value)} placeholder="Nom et qualité du régisseur" />
            </div>
            <div>
              <Label>Montant plafond (€)</Label>
              <Input type="number" value={montantPlafond} onChange={e => setMontantPlafond(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Plafond recommandé : {TYPES_REGIE[typeRegie].plafond}</p>
            </div>
            {typeRegie === "temporaire" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date début</Label><Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} /></div>
                <div><Label>Date fin</Label><Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} /></div>
              </div>
            )}
            <Button onClick={genererActeConstitutif} className="w-full gradient-primary border-0">
              <Download className="h-3.5 w-3.5 mr-1" /> Générer l'acte constitutif PDF
            </Button>
          </CardContent>
        </Card>

        {/* Modèles rapides */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Modèles d'inventaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Générez les PV d'inventaire de caisse conformes au recueil des régies 2023.
            </p>
            <div className="space-y-2">
              {[
                { label: "PV inventaire mensuel", desc: "Contrôle mensuel de la caisse avec billetage" },
                { label: "PV inventaire annuel", desc: "Contrôle annuel de clôture d'exercice" },
                { label: "PV inventaire de clôture", desc: "Clôture définitive de la régie" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={genererPVInventaire}>
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
              <p className="text-xs text-muted-foreground">
                <strong>Réf. réglementaires :</strong> M9.6 art. 5.2.1 — Recueil des régies des EPLE (édition 2023) —
                Décret n° 2012-1246 du 7 novembre 2012 (art. 22 et 23) — Arrêté du 24 janvier 2023.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function formatCurrencySimple(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default ModelesRegieTab;
