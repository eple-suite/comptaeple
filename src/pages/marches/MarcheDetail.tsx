import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import JSZip from "jszip";
import { useMarche } from "./hooks/useMarchesData";
import { useEstablishmentBranding } from "@/hooks/useEstablishmentBranding";
import { formatEur } from "./lib/seuilsEngine";
import { PROCEDURE_LABELS, STATUT_LABELS, TYPE_MARCHE_LABELS } from "./types";
import { generateFicheBesoin, generateRC, generateCCAP, generateCCTP, generateAE, generateRapportAnalyse, generateDecisionAttribution, generateLettreNotification, generateLettreRejet, generatePvReception, generateNoteTracabilite } from "./docs/pieces";
import { loadLogoBuffer } from "./docs/docxBuilder";

const PIECES_BY_PROC: Record<string, { id: string; label: string; gen: any }[]> = {
  dispense: [
    { id: "fiche-besoin", label: "Fiche d'expression du besoin", gen: generateFicheBesoin },
    { id: "tracabilite", label: "Note de traçabilité (R2122-8)", gen: generateNoteTracabilite },
  ],
  mapa: [
    { id: "fiche-besoin", label: "Fiche d'expression du besoin", gen: generateFicheBesoin },
    { id: "rc", label: "Règlement de la consultation", gen: generateRC },
    { id: "ae", label: "Acte d'engagement (DC3)", gen: generateAE },
    { id: "ccap", label: "CCAP", gen: generateCCAP },
    { id: "cctp", label: "CCTP", gen: generateCCTP },
    { id: "rao", label: "Rapport d'analyse des offres", gen: generateRapportAnalyse },
    { id: "decision", label: "Décision d'attribution", gen: generateDecisionAttribution },
    { id: "rejet", label: "Lettre aux candidats non retenus", gen: generateLettreRejet },
    { id: "notif", label: "Lettre de notification", gen: generateLettreNotification },
    { id: "pv", label: "PV de réception", gen: generatePvReception },
  ],
  mapa_publicite: [
    { id: "fiche-besoin", label: "Fiche d'expression du besoin", gen: generateFicheBesoin },
    { id: "rc", label: "Règlement de la consultation", gen: generateRC },
    { id: "ae", label: "Acte d'engagement (DC3)", gen: generateAE },
    { id: "ccap", label: "CCAP", gen: generateCCAP },
    { id: "cctp", label: "CCTP", gen: generateCCTP },
    { id: "rao", label: "Rapport d'analyse des offres", gen: generateRapportAnalyse },
    { id: "decision", label: "Décision d'attribution", gen: generateDecisionAttribution },
    { id: "rejet", label: "Lettre aux candidats non retenus", gen: generateLettreRejet },
    { id: "notif", label: "Lettre de notification", gen: generateLettreNotification },
    { id: "pv", label: "PV de réception", gen: generatePvReception },
  ],
  formalisee: [
    { id: "fiche-besoin", label: "Fiche d'expression du besoin", gen: generateFicheBesoin },
    { id: "rc", label: "Règlement de la consultation", gen: generateRC },
    { id: "ae", label: "Acte d'engagement (DC3)", gen: generateAE },
    { id: "ccap", label: "CCAP", gen: generateCCAP },
    { id: "cctp", label: "CCTP", gen: generateCCTP },
    { id: "rao", label: "Rapport d'analyse des offres", gen: generateRapportAnalyse },
    { id: "decision", label: "Décision d'attribution", gen: generateDecisionAttribution },
    { id: "rejet", label: "Lettre aux candidats non retenus + standstill", gen: generateLettreRejet },
    { id: "notif", label: "Lettre de notification", gen: generateLettreNotification },
    { id: "pv", label: "PV de réception", gen: generatePvReception },
  ],
};

export default function MarcheDetail() {
  const { id } = useParams();
  const { data: marche } = useMarche(id);
  const { branding, logoUrl } = useEstablishmentBranding();
  const [busy, setBusy] = useState<string | null>(null);

  if (!marche) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const pieces = PIECES_BY_PROC[marche.procedure_calculee] || PIECES_BY_PROC.mapa;

  const ctxBase = async () => ({ marche, branding, logoArrayBuffer: await loadLogoBuffer(logoUrl) });

  const handleGenOne = async (id: string, label: string, gen: any) => {
    setBusy(id);
    try {
      const ctx = await ctxBase();
      const blob = await gen(ctx);
      saveAs(blob, `${marche.reference_interne}_${id}.docx`);
      toast.success(`${label} généré`);
    } catch (e: any) { toast.error("Erreur : " + (e?.message || "")); }
    finally { setBusy(null); }
  };

  const handleGenZip = async () => {
    setBusy("zip");
    try {
      const zip = new JSZip();
      const ctx = await ctxBase();
      const folders: Record<string, string> = {
        "fiche-besoin": "01-Preparation",
        "tracabilite": "01-Preparation",
        "rc": "02-Consultation",
        "ae": "02-Consultation",
        "ccap": "02-Consultation",
        "cctp": "02-Consultation",
        "rao": "03-Attribution",
        "decision": "03-Attribution",
        "rejet": "03-Attribution",
        "notif": "03-Attribution",
        "pv": "04-Execution",
      };
      for (const p of pieces) {
        const blob: Blob = await p.gen(ctx);
        const folder = folders[p.id] || "00-Autres";
        zip.file(`${folder}/${marche.reference_interne}_${p.id}.docx`, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      saveAs(out, `Dossier_marche_${marche.reference_interne}.zip`);
      toast.success("Dossier complet généré");
    } catch (e: any) { toast.error("Erreur : " + (e?.message || "")); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2"><Link to="/marches/liste"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
          <h1 className="text-2xl font-display font-bold">{marche.libelle}</h1>
          <p className="text-sm text-muted-foreground">{marche.reference_interne} • {TYPE_MARCHE_LABELS[marche.type_marche]} • {marche.famille_code}</p>
        </div>
        <Badge variant="outline" className="text-sm">{STATUT_LABELS[marche.statut]}</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Montant total HT</p><p className="text-xl font-bold">{formatEur(Number(marche.montant_total_ht))}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Procédure</p><p className="text-sm font-semibold">{PROCEDURE_LABELS[marche.procedure_calculee]}</p><p className="text-xs text-muted-foreground mt-1">{marche.base_legale}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Cumul 12 mois (anti-saucissonnage)</p><p className="text-xl font-bold">{formatEur(Number(marche.cumul_total_12m))}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Pièces du dossier ({pieces.length})</span>
            <Button onClick={handleGenZip} disabled={busy !== null}>
              {busy === "zip" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Télécharger le dossier complet (ZIP)
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-2">
            {pieces.map(p => (
              <Button key={p.id} variant="outline" className="justify-between h-auto py-3" onClick={() => handleGenOne(p.id, p.label, p.gen)} disabled={busy !== null}>
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> {p.label}</span>
                {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 opacity-50" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Description du besoin</CardTitle></CardHeader>
        <CardContent><p className="text-sm whitespace-pre-wrap">{marche.description || "—"}</p></CardContent>
      </Card>
    </div>
  );
}
