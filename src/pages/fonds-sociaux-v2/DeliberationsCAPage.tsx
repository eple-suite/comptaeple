// ═══════════════════════════════════════════════════════════════
// Page Délibérations du Conseil d'Administration — fonds sociaux
// Circulaire 2017-122 § II.2 : le CA fixe les modalités d'attribution
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
import { ArrowLeft, Plus, Gavel, Loader2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useDeliberationsCa, useUpsertDeliberationCa, useLogJournalAcces } from "./useFsData";
import {
  currentAnneeScolaire, TYPE_FONDS_LABELS,
  type FsDeliberationCa, type TypeFonds,
} from "./fsv2Types";
import { toast } from "sonner";

export default function DeliberationsCAPage() {
  const { data: deliberations = [], isLoading } = useDeliberationsCa();
  const upsert = useUpsertDeliberationCa();
  const logAcces = useLogJournalAcces();
  const [open, setOpen] = useState(false);

  const [numero, setNumero] = useState("");
  const [dateCa, setDateCa] = useState(new Date().toISOString().slice(0, 10));
  const [annee, setAnnee] = useState(currentAnneeScolaire());
  const [typeFonds, setTypeFonds] = useState<TypeFonds | "TOUS">("TOUS");
  const [plafondInd, setPlafondInd] = useState<string>("");
  const [plafondCumul, setPlafondCumul] = useState<string>("");
  const [criteres, setCriteres] = useState("");
  const [piecesText, setPiecesText] = useState("");

  function reset() {
    setNumero(""); setDateCa(new Date().toISOString().slice(0, 10));
    setAnnee(currentAnneeScolaire()); setTypeFonds("TOUS");
    setPlafondInd(""); setPlafondCumul(""); setCriteres(""); setPiecesText("");
  }

  async function handleSave() {
    if (!numero.trim()) return toast.error("Numéro de délibération requis");
    if (!dateCa) return toast.error("Date du CA requise");
    const pieces = piecesText.split("\n").map(s => s.trim()).filter(Boolean);
    try {
      await upsert.mutateAsync({
        numero: numero.trim(),
        date_ca: dateCa,
        annee_scolaire: annee,
        type_fonds: typeFonds,
        plafond_aide_individuelle: plafondInd ? Number(plafondInd) : null,
        plafond_cumul_annuel: plafondCumul ? Number(plafondCumul) : null,
        criteres_attribution: criteres || null,
        pieces_obligatoires: pieces.length > 0 ? pieces : null,
      });
      toast.success("Délibération enregistrée");
      setOpen(false); reset();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  }

  function handleConsulter(d: FsDeliberationCa) {
    void logAcces({
      type_ressource: "decision",
      ressource_id: d.id,
      action: "consultation",
      details: { contexte: "deliberation_ca", numero: d.numero },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/fonds-sociaux/v2"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display">Délibérations du Conseil d'administration</h1>
          <p className="text-sm text-muted-foreground">
            Cadre fixé par le CA pour l'attribution des fonds sociaux — circulaire 2017-122 § II.2
          </p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nouvelle délibération</Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : deliberations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Gavel className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucune délibération CA enregistrée.</p>
            <p className="text-xs mt-2">
              Une délibération annuelle du CA est requise pour fonder les décisions individuelles
              (visa de la délibération apparaît dans le PDF de décision).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliberations.map(d => (
            <Card key={d.id} onClick={() => handleConsulter(d)} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      Délibération n° {d.numero}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      CA du {new Date(d.date_ca).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} · {d.annee_scolaire}
                    </div>
                  </div>
                  <Badge variant={d.type_fonds === "TOUS" ? "secondary" : "outline"}>
                    {d.type_fonds === "TOUS" ? "Tous fonds" : (TYPE_FONDS_LABELS[d.type_fonds as TypeFonds] ?? d.type_fonds)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {d.plafond_aide_individuelle != null && (
                  <div><span className="text-muted-foreground">Plafond individuel : </span>
                    <strong>{Number(d.plafond_aide_individuelle).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>
                  </div>
                )}
                {d.plafond_cumul_annuel != null && (
                  <div><span className="text-muted-foreground">Plafond cumul annuel : </span>
                    <strong>{Number(d.plafond_cumul_annuel).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>
                  </div>
                )}
                {d.criteres_attribution && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{d.criteres_attribution}</p>
                )}
                {d.pieces_obligatoires && d.pieces_obligatoires.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {d.pieces_obligatoires.length} pièce(s) obligatoire(s)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Nouvelle délibération CA</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Numéro</Label><Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="2025-12" /></div>
              <div><Label>Date du CA</Label><Input type="date" value={dateCa} onChange={e => setDateCa(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Année scolaire</Label><Input value={annee} onChange={e => setAnnee(e.target.value)} placeholder="2025-2026" /></div>
              <div>
                <Label>Type de fonds concerné</Label>
                <Select value={typeFonds} onValueChange={(v) => setTypeFonds(v as TypeFonds | "TOUS")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOUS">Tous les fonds</SelectItem>
                    <SelectItem value="FSL">{TYPE_FONDS_LABELS.FSL}</SelectItem>
                    <SelectItem value="FSC_COL">{TYPE_FONDS_LABELS.FSC_COL}</SelectItem>
                    <SelectItem value="FSC">{TYPE_FONDS_LABELS.FSC}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Plafond aide individuelle (€)</Label>
                <Input type="number" min="0" step="50" value={plafondInd} onChange={e => setPlafondInd(e.target.value)} placeholder="500" /></div>
              <div><Label>Plafond cumul annuel (€)</Label>
                <Input type="number" min="0" step="50" value={plafondCumul} onChange={e => setPlafondCumul(e.target.value)} placeholder="1500" /></div>
            </div>
            <div>
              <Label>Critères d'attribution</Label>
              <Textarea rows={3} value={criteres} onChange={e => setCriteres(e.target.value)}
                placeholder="Quotient familial, situation sociale exceptionnelle, ordre de priorité…" />
            </div>
            <div>
              <Label>Pièces obligatoires (une par ligne)</Label>
              <Textarea rows={3} value={piecesText} onChange={e => setPiecesText(e.target.value)}
                placeholder="Avis d'imposition N-1&#10;Justificatif de domicile&#10;Notification CAF" />
            </div>
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