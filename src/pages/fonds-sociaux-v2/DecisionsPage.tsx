// ═══════════════════════════════════════════════════════════════
// Page Décisions FS / FSC — liste + filtres + actions PDF
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, Plus, FileDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDecisions, useEleves, useUpsertDecision } from "./useFsData";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { useEstablishmentBranding } from "@/hooks/useEstablishmentBranding";
import { NATURE_AIDE_LABELS, currentAnneeScolaire, type FsDecision } from "./fsv2Types";
import { NouvelleDecisionWizard } from "./NouvelleDecisionWizard";
import {
  generateDecisionChefEtablissementPdf,
  generateNotificationFamillePdf,
  generatePieceComptablePdf,
  downloadBlob,
  type PdfContext,
} from "@/lib/fs-pdf/decisionPdf";
import { toast } from "sonner";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  decide: "bg-primary/10 text-primary border-primary/30",
  mandate: "bg-secondary text-secondary-foreground",
  paye: "bg-primary text-primary-foreground",
  annule: "bg-destructive/10 text-destructive",
};

export default function DecisionsPage() {
  const { data: decisions = [], isLoading } = useDecisions();
  const { data: eleves = [] } = useEleves();
  const upsert = useUpsertDecision();
  const { selectedEstablishment } = useEstablishment();
  const { branding } = useEstablishmentBranding();

  const [openWizard, setOpenWizard] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [anneeFilter, setAnneeFilter] = useState(currentAnneeScolaire());

  const elevesById = useMemo(() => {
    const m = new Map<string, typeof eleves[number]>();
    eleves.forEach(e => m.set(e.id, e));
    return m;
  }, [eleves]);

  const filtered = useMemo(() => decisions.filter(d => {
    if (anneeFilter !== "all" && d.annee_scolaire !== anneeFilter) return false;
    if (typeFilter !== "all" && d.type_fonds !== typeFilter) return false;
    if (statutFilter !== "all" && d.statut !== statutFilter) return false;
    if (search) {
      const e = elevesById.get(d.eleve_id);
      const blob = `${d.numero_decision} ${e?.nom ?? ""} ${e?.prenom ?? ""}`.toLowerCase();
      if (!blob.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [decisions, elevesById, search, typeFilter, statutFilter, anneeFilter]);

  const totalVerse = filtered
    .filter(d => d.statut === "mandate" || d.statut === "paye")
    .reduce((s, d) => s + Number(d.montant), 0);

  function pdfCtx(): PdfContext {
    return {
      etablissementNom: selectedEstablishment?.name ?? "Établissement",
      etablissementAdresse: branding?.address,
      etablissementCp: branding?.postal_code,
      etablissementVille: branding?.city ?? selectedEstablishment?.city,
      uai: selectedEstablishment?.uai,
      ville: branding?.city ?? selectedEstablishment?.city,
      signataireOrdonnateur: branding?.signataire_ordonnateur ?? selectedEstablishment?.ordonnateur,
      signataireAgentComptable: branding?.signataire_agent_comptable ?? selectedEstablishment?.agent_comptable,
    };
  }

  function handlePdfDecision(d: FsDecision) {
    const e = elevesById.get(d.eleve_id);
    if (!e) return toast.error("Élève introuvable");
    downloadBlob(generateDecisionChefEtablissementPdf(d, e as any, pdfCtx()), `Decision-${d.numero_decision}.pdf`);
  }
  function handlePdfNotification(d: FsDecision) {
    const e = elevesById.get(d.eleve_id);
    if (!e) return toast.error("Élève introuvable");
    downloadBlob(generateNotificationFamillePdf(d, e as any, pdfCtx()), `Notification-${d.numero_decision}.pdf`);
  }
  function handlePdfMandat(d: FsDecision) {
    const e = elevesById.get(d.eleve_id);
    if (!e) return toast.error("Élève introuvable");
    downloadBlob(generatePieceComptablePdf(d, e as any, pdfCtx()), `Mandat-${d.numero_decision}.pdf`);
  }

  async function changeStatut(d: FsDecision, statut: FsDecision["statut"]) {
    try {
      await upsert.mutateAsync({ id: d.id, statut });
      toast.success(`Statut mis à jour : ${statut}`);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/fonds-sociaux/v2"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Demandes & Décisions FS / FSC</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} décision(s) — Versé : {totalVerse.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Input placeholder="Rechercher (n°, élève)…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={anneeFilter} onValueChange={setAnneeFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes années</SelectItem>
                <SelectItem value={currentAnneeScolaire()}>{currentAnneeScolaire()}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="FS">FS</SelectItem>
                <SelectItem value="FSC">FSC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="decide">Décidé</SelectItem>
                <SelectItem value="mandate">Mandaté</SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setOpenWizard(true)}><Plus className="h-4 w-4 mr-1" /> Nouvelle décision</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
              Aucune décision. Cliquez sur « Nouvelle décision » pour commencer.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Élève</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => {
                  const e = elevesById.get(d.eleve_id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.numero_decision}</TableCell>
                      <TableCell>{e ? `${e.nom} ${e.prenom}` : <span className="text-destructive">élève inconnu</span>}<div className="text-xs text-muted-foreground">{e?.classe}</div></TableCell>
                      <TableCell><Badge variant="outline">{d.type_fonds}</Badge></TableCell>
                      <TableCell className="text-xs">{NATURE_AIDE_LABELS[d.nature_aide as keyof typeof NATURE_AIDE_LABELS] ?? d.nature_aide}</TableCell>
                      <TableCell className="text-right font-medium">{Number(d.montant).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</TableCell>
                      <TableCell className="text-xs">{d.date_decision}</TableCell>
                      <TableCell>
                        <Select value={d.statut} onValueChange={(v) => changeStatut(d, v as FsDecision["statut"])}>
                          <SelectTrigger className={`h-7 text-xs px-2 ${STATUT_COLORS[d.statut] ?? ""}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brouillon">Brouillon</SelectItem>
                            <SelectItem value="decide">Décidé</SelectItem>
                            <SelectItem value="mandate">Mandaté</SelectItem>
                            <SelectItem value="paye">Payé</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Décision CE" onClick={() => handlePdfDecision(d)}><FileDown className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Notification famille" onClick={() => handlePdfNotification(d)}><FileDown className="h-3.5 w-3.5 text-primary" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Pièce comptable" onClick={() => handlePdfMandat(d)}><FileDown className="h-3.5 w-3.5 text-accent-foreground" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NouvelleDecisionWizard open={openWizard} onClose={() => setOpenWizard(false)} />
    </div>
  );
}