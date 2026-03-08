import { useMemo, useState } from "react";
import { Users, UserCheck, Download, Phone, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Voyage, QUALITES_ACCOMPAGNATEUR, Accompagnateur, Devis, CATEGORIES_PRESTATIONS, CatKey } from "./types";
import { formatCurrency } from "@/lib/mockData";
import { CheckCircle2, XCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  voyage: Voyage;
  onUpdateVoyage: (v: Voyage) => void;
}

export const VoyageParticipantsTab = ({ voyage, onUpdateVoyage }: Props) => {
  const [subTab, setSubTab] = useState<"accompagnateurs" | "devis">("accompagnateurs");
  const v = voyage;

  // Export liste participants PDF
  const exportListeParticipants = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Liste des participants — Voyage à ${v.destination}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`${v.pays} — Du ${v.dateDepart} au ${v.dateRetour}`, 14, 28);
    doc.text(`${v.nbEleves} élèves + ${v.nbAccompagnateurs} accompagnateurs`, 14, 34);

    // Accompagnateurs
    doc.setFontSize(12);
    doc.text("ACCOMPAGNATEURS", 14, 46);
    autoTable(doc, {
      startY: 50,
      head: [["Nom", "Prénom", "Qualité", "Fonction", "Téléphone", "Ordre service"]],
      body: v.accompagnateurs.map(a => [
        a.nom, a.prenom, QUALITES_ACCOMPAGNATEUR[a.qualite], a.fonction, a.telephone, a.ordreService ? "✓" : "✗"
      ]),
      theme: "grid",
      headStyles: { fillColor: [41, 98, 255] },
      styles: { fontSize: 9 },
    });

    // Élèves
    const y2 = (doc as any).lastAutoTable?.finalY || 90;
    doc.setFontSize(12);
    doc.text("ÉLÈVES", 14, y2 + 10);
    autoTable(doc, {
      startY: y2 + 14,
      head: [["N°", "Nom", "Prénom", "Classe", "Responsable", "Téléphone", "AP", "FS", "RC", "ID"]],
      body: v.eleves.map((e, i) => [
        String(i + 1), e.nom, e.prenom, e.classe, e.responsable1, e.telResponsable,
        e.autorisationParentale ? "✓" : "✗", e.ficheSanitaire ? "✓" : "✗",
        e.assuranceRC ? "✓" : "✗", e.passeport ? "✓" : "✗",
      ]),
      theme: "grid",
      headStyles: { fillColor: [41, 98, 255] },
      styles: { fontSize: 8 },
    });

    doc.save(`liste_participants_${v.destination}_${v.dateDepart}.pdf`);
  };

  const DocIcon = ({ ok }: { ok: boolean }) => ok
    ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
    : <XCircle className="h-3.5 w-3.5 text-destructive" />;

  // Stats accompagnateurs
  const ordresOk = v.accompagnateurs.filter(a => a.ordreService).length;
  const autAbsOk = v.accompagnateurs.filter(a => a.autorisationAbsence).length;

  // Devis regroupés par catégorie
  const devisParCategorie = useMemo(() => {
    const grouped: Record<CatKey, Devis[]> = {} as any;
    CATEGORIES_PRESTATIONS.forEach(cat => { grouped[cat.key] = []; });
    v.devis.forEach(d => {
      if (grouped[d.categoriePrestationKey]) grouped[d.categoriePrestationKey].push(d);
    });
    return grouped;
  }, [v.devis]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-display">Participants — {v.destination}</h3>
          <p className="text-xs text-muted-foreground">{v.nbEleves} élèves + {v.nbAccompagnateurs} accompagnateurs = {v.nbEleves + v.nbAccompagnateurs} participants</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportListeParticipants}>
          <Download className="h-3 w-3 mr-1" /> Liste PDF
        </Button>
      </div>

      <Tabs value={subTab} onValueChange={v => setSubTab(v as any)}>
        <TabsList>
          <TabsTrigger value="accompagnateurs">👥 Accompagnateurs ({v.accompagnateurs.length})</TabsTrigger>
          <TabsTrigger value="devis">📄 Devis & Mise en concurrence ({v.devis.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="accompagnateurs" className="space-y-4">
          {/* Stats accompagnateurs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Accompagnateurs</div>
                <div className="text-xl font-bold font-display">{v.accompagnateurs.length}</div>
                <div className="text-[10px] text-muted-foreground">Ratio : 1 pour {v.nbEleves > 0 ? Math.ceil(v.nbEleves / Math.max(v.accompagnateurs.length, 1)) : "—"} élèves</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Ordres de service</div>
                <div className={`text-xl font-bold ${ordresOk === v.accompagnateurs.length ? "text-success" : "text-warning"}`}>{ordresOk}/{v.accompagnateurs.length}</div>
                <Progress value={v.accompagnateurs.length > 0 ? (ordresOk / v.accompagnateurs.length) * 100 : 0} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Autorisations absence</div>
                <div className={`text-xl font-bold ${autAbsOk === v.accompagnateurs.length ? "text-success" : "text-warning"}`}>{autAbsOk}/{v.accompagnateurs.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Contact urgence</div>
                <div className="text-sm font-medium">{v.contactUrgence}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{v.telUrgence}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau accompagnateurs */}
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom Prénom</TableHead>
                    <TableHead>Qualité</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Ordre service</TableHead>
                    <TableHead className="text-center">Aut. absence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.accompagnateurs.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.nom} {a.prenom}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{QUALITES_ACCOMPAGNATEUR[a.qualite]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.fonction}</TableCell>
                      <TableCell className="text-xs font-mono">{a.telephone}</TableCell>
                      <TableCell className="text-xs">{a.email}</TableCell>
                      <TableCell className="text-center"><DocIcon ok={a.ordreService} /></TableCell>
                      <TableCell className="text-center"><DocIcon ok={a.autorisationAbsence} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Infos logistiques */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Informations logistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs">Lieu de départ</span><div className="font-medium">{v.lieuDepart || "—"}</div></div>
                <div><span className="text-muted-foreground text-xs">Heure départ</span><div className="font-medium">{v.horairesDepart || "—"}</div></div>
                <div><span className="text-muted-foreground text-xs">Heure retour</span><div className="font-medium">{v.horairesRetour || "—"}</div></div>
                <div><span className="text-muted-foreground text-xs">Moyen de transport</span><div className="font-medium">{v.moyenTransport || "—"}</div></div>
                <div><span className="text-muted-foreground text-xs">Type d'hébergement</span><div className="font-medium">{v.typeHebergement || "—"}</div></div>
                <div><span className="text-muted-foreground text-xs">Contact urgence</span><div className="font-medium">{v.contactUrgence || "—"}</div></div>
                <div><span className="text-muted-foreground text-xs">Tél. urgence</span><div className="font-mono">{v.telUrgence || "—"}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devis" className="space-y-4">
          {/* Mise en concurrence */}
          <Card className="shadow-card border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-warning" /> Rappel réglementaire — Mise en concurrence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>En dessous de 40 000 € HT</strong> par nature de prestation : achat libre, pas de formalité obligatoire.</p>
              <p>• <strong>De 40 000 € à 90 000 € HT</strong> : obligation de solliciter au minimum <strong>3 devis</strong> comparables et de rédiger une grille d'analyse.</p>
              <p>• <strong>Au-delà de 90 000 € HT</strong> : procédure adaptée (MAPA) avec publicité obligatoire sur le profil acheteur.</p>
              <p>• <strong>Au-delà de 221 000 € HT</strong> : appel d'offres formalisé avec publication au JOUE.</p>
              <p className="mt-2 italic">⚠️ Les seuils s'apprécient en cumul annuel par catégorie homogène de prestations, tous voyages confondus.</p>
            </CardContent>
          </Card>

          {/* Devis par catégorie */}
          {CATEGORIES_PRESTATIONS.map(cat => {
            const catDevis = devisParCategorie[cat.key];
            if (catDevis.length === 0) return null;
            const retenu = catDevis.find(d => d.retenu);
            return (
              <Card key={cat.key} className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span>{cat.icon}</span> {cat.label} — {catDevis.length} devis
                    {retenu && <Badge className="bg-success/10 text-success border-0 text-[10px]">Retenu : {retenu.prestataire}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prestataire</TableHead>
                        <TableHead className="text-right">Montant HT</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead>Date réception</TableHead>
                        <TableHead className="text-center">Retenu</TableHead>
                        <TableHead>Motif du choix</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catDevis.map(d => (
                        <TableRow key={d.id} className={d.retenu ? "bg-success/5" : ""}>
                          <TableCell className="font-medium text-sm">{d.prestataire}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(d.montantHT)}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(d.montantTTC)}</TableCell>
                          <TableCell className="text-xs font-mono">{d.dateReception}</TableCell>
                          <TableCell className="text-center">
                            {d.retenu ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px]">{d.motifChoix || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}

          {v.devis.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Aucun devis enregistré pour ce voyage.</p>
                <p className="text-xs mt-1">Ajoutez des devis pour tracer la mise en concurrence.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
