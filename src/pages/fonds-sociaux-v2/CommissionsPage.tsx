// ═══════════════════════════════════════════════════════════════
// Page Commissions fonds social — liste + dialog création
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, ClipboardCheck, Loader2, Mail, FileText, FileLock2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommissions, useUpsertCommission, useUpsertConvocation, useDecisions, useEleves, useLogJournalAcces } from "./useFsData";
import { currentAnneeScolaire, type FsCommission, NATURE_AIDE_LABELS } from "./fsv2Types";
import {
  generateConvocationCommissionPdf,
  generatePvCommissionAnonymisePdf,
  generatePvCommissionIntegralPdf,
  downloadBlob,
} from "@/lib/fs-pdf/decisionPdf";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";

export default function CommissionsPage() {
  const { data: commissions = [], isLoading } = useCommissions();
  const { data: decisions = [] } = useDecisions();
  const { data: eleves = [] } = useEleves();
  const upsert = useUpsertCommission();
  const upsertConvocation = useUpsertConvocation();
  const logAcces = useLogJournalAcces();
  const { selectedEstablishment } = useEstablishment();
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<FsCommission["type"]>("ordinaire");
  const [annee, setAnnee] = useState(currentAnneeScolaire());
  const [observations, setObservations] = useState("");
  const [membresText, setMembresText] = useState("");

  async function handleSave() {
    if (!date) return toast.error("Date requise");
    const membres = membresText.split("\n").filter(l => l.trim()).map(l => {
      const [nom, qualite] = l.split("—").map(s => s?.trim() ?? "");
      return { nom: nom || l, qualite: qualite || "Membre" };
    });
    try {
      await upsert.mutateAsync({
        date_commission: date, type, annee_scolaire: annee,
        observations, membres_presents: membres,
      });
      toast.success("Commission enregistrée");
      setOpen(false); setObservations(""); setMembresText("");
    } catch (e: any) { toast.error(e.message ?? "Erreur"); }
  }

  function buildPdfCtx() {
    return {
      etablissementNom: selectedEstablishment?.name ?? "Établissement",
      etablissementAdresse: selectedEstablishment?.address ?? "",
      etablissementCp: selectedEstablishment?.postal_code ?? "",
      etablissementVille: selectedEstablishment?.city ?? "",
      uai: selectedEstablishment?.uai ?? "",
      ville: selectedEstablishment?.city ?? "",
      signataireOrdonnateur: "",
    };
  }

  function dossiersForCommission(c: FsCommission) {
    return decisions
      .filter(d => d.commission_id === c.id)
      .map(d => {
        const e = eleves.find(x => x.id === d.eleve_id);
        const decisionType: "accord" | "refus" | "complement" =
          d.statut === "refusee" ? "refus" :
          d.statut === "complement_demande" ? "complement" : "accord";
        return {
          eleve: e,
          classe: e?.classe ?? "—",
          nature: NATURE_AIDE_LABELS[d.nature_aide] ?? d.nature_aide,
          montant: Number(d.montant),
          decision: decisionType,
          motif: d.motif,
        };
      });
  }

  async function handleEnvoyerConvocation(c: FsCommission) {
    try {
      const ctx = buildPdfCtx();
      const membres = (c.membres_presents ?? []).map(m => ({ ...m, email: undefined }));
      const convocation = {
        id: "preview",
        establishment_id: c.establishment_id,
        commission_id: c.id,
        date_envoi: new Date().toISOString().slice(0, 10),
        membres_convoques: membres,
        ordre_du_jour: `Examen des dossiers fonds sociaux — commission du ${new Date(c.date_commission).toLocaleDateString("fr-FR")}`,
        pdf_url: null,
      };
      const blob = generateConvocationCommissionPdf(c, convocation, ctx);
      downloadBlob(blob, `convocation-${c.date_commission}.pdf`);
      await upsertConvocation.mutateAsync({
        commission_id: c.id,
        date_envoi: convocation.date_envoi,
        membres_convoques: membres,
        ordre_du_jour: convocation.ordre_du_jour,
      });
      void logAcces({ type_ressource: "commission", ressource_id: c.id, action: "export_pdf", details: { type: "convocation" } });
      toast.success("Convocation générée et enregistrée");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur convocation");
    }
  }

  function handlePvAnonymise(c: FsCommission) {
    const ctx = buildPdfCtx();
    const dossiers = dossiersForCommission(c).map(d => ({
      initiales: d.eleve ? `${d.eleve.prenom?.[0] ?? "?"}.${d.eleve.nom?.[0] ?? "?"}.` : "—",
      classe: d.classe, nature: d.nature, montant: d.montant, decision: d.decision,
    }));
    const blob = generatePvCommissionAnonymisePdf(c, dossiers, ctx);
    downloadBlob(blob, `pv-anonymise-${c.date_commission}.pdf`);
    void logAcces({ type_ressource: "pv", ressource_id: c.id, action: "export_pdf", details: { type: "anonymise" } });
    toast.success("PV anonymisé généré");
  }

  function handlePvIntegral(c: FsCommission) {
    const ctx = buildPdfCtx();
    const dossiers = dossiersForCommission(c).map(d => ({
      eleve_nom: d.eleve?.nom ?? "—",
      eleve_prenom: d.eleve?.prenom ?? "—",
      classe: d.classe, nature: d.nature, montant: d.montant, decision: d.decision, motif: d.motif,
    }));
    const blob = generatePvCommissionIntegralPdf(c, dossiers, ctx);
    downloadBlob(blob, `pv-integral-${c.date_commission}.pdf`);
    void logAcces({ type_ressource: "pv", ressource_id: c.id, action: "export_pdf", details: { type: "integral" } });
    toast.warning("PV intégral généré (CONFIDENTIEL — accès restreint)");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/fonds-sociaux/v2"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display">Commissions fonds social</h1>
          <p className="text-sm text-muted-foreground">{commissions.length} commission(s) enregistrée(s)</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nouvelle commission</Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : commissions.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-30" />
          Aucune commission enregistrée.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commissions.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{new Date(c.date_commission).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                    <div className="text-xs text-muted-foreground">{c.annee_scolaire}</div>
                  </div>
                  <Badge variant={c.type === "urgence" ? "destructive" : c.type === "extraordinaire" ? "secondary" : "outline"}>{c.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Membres présents : </span>{(c.membres_presents ?? []).length}</div>
                <div><span className="text-muted-foreground">Dossiers examinés : </span>{c.dossiers_examines_count}</div>
                {c.observations && <p className="text-xs text-muted-foreground line-clamp-3">{c.observations}</p>}
                <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEnvoyerConvocation(c)}>
                    <Mail className="h-3 w-3 mr-1" /> Convocation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePvAnonymise(c)}>
                    <FileText className="h-3 w-3 mr-1" /> PV anonymisé
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePvIntegral(c)}>
                    <FileLock2 className="h-3 w-3 mr-1" /> PV intégral
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle commission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div><Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as FsCommission["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaire">Ordinaire</SelectItem>
                    <SelectItem value="extraordinaire">Extraordinaire</SelectItem>
                    <SelectItem value="urgence">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Année scolaire</Label><Input value={annee} onChange={e => setAnnee(e.target.value)} placeholder="2025-2026" /></div>
            <div>
              <Label>Membres présents (un par ligne, format « Nom — Qualité »)</Label>
              <Textarea rows={4} value={membresText} onChange={e => setMembresText(e.target.value)} placeholder="Mme Dupont — Proviseure&#10;M. Martin — Agent comptable&#10;Mme Leroy — CPE" />
            </div>
            <div><Label>Observations</Label><Textarea rows={3} value={observations} onChange={e => setObservations(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}