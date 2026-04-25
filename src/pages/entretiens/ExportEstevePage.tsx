import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileCode2, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import {
  eligibleExportEsteve,
  genererCsvEsteve,
  genererXmlEsteve,
  type EstevePayload,
} from "@/lib/entretiens/exportEsteve";
import { logAccesEntretien } from "@/lib/entretiens/accesLog";
import type { Agent, EntretienProfessionnel } from "@/lib/entretiens/types";

interface Row {
  entretien: EntretienProfessionnel;
  agent: Agent;
  evaluateurNom: string;
  autoriteN2Nom?: string;
  eligible: boolean;
  raison?: string;
}

export default function ExportEstevePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentEstablishment } = useEstablishment();
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [campagne, setCampagne] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    if (!currentEstablishment) return;
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEstablishment, campagne]);

  async function loadRows() {
    setLoading(true);
    const { data: ents, error } = await supabase
      .from("entretiens_professionnels")
      .select("*, agent:agents!agent_evalue_id(*)")
      .eq("establishment_id", currentEstablishment!.id)
      .eq("campagne_annee", campagne)
      .in("statut", ["finalise", "archive"]);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const mapped: Row[] = (ents ?? []).map((e: any) => {
      const elig = eligibleExportEsteve(e);
      return {
        entretien: e,
        agent: e.agent,
        evaluateurNom: "—",
        autoriteN2Nom: undefined,
        eligible: elig.ok,
        raison: elig.raison,
      };
    });
    setRows(mapped);
    setLoading(false);
  }

  const eligibles = useMemo(() => rows.filter((r) => r.eligible), [rows]);
  const allSelected = eligibles.length > 0 && eligibles.every((r) => selected.has(r.entretien.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(eligibles.map((r) => r.entretien.id)));
  }
  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  function buildPayloads(): EstevePayload[] {
    return rows
      .filter((r) => selected.has(r.entretien.id))
      .map((r) => ({
        entretien: r.entretien,
        agent: r.agent,
        evaluateurNom: r.evaluateurNom,
        autoriteN2Nom: r.autoriteN2Nom,
        etablissementUai: currentEstablishment!.uai,
        etablissementNom: currentEstablishment!.name,
      }));
  }

  async function downloadCsv() {
    const payloads = buildPayloads();
    if (payloads.length === 0) return;
    const csv = genererCsvEsteve(payloads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_esteve_${campagne}_${currentEstablishment!.uai}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    for (const p of payloads) {
      await logAccesEntretien(p.entretien.id, "export_esteve", `CSV — ${payloads.length} agents`);
    }
    toast({ title: "CSV ESTEVE exporté", description: `${payloads.length} agent(s) inclus.` });
  }

  async function downloadXml() {
    const payloads = buildPayloads();
    if (payloads.length === 0) return;
    const xmls = payloads.map((p) => genererXmlEsteve(p));
    // archive zip simplifiée : 1 fichier XML concaténé documenté
    const merged = `<!-- Export ESTEVE — ${payloads.length} payloads -->\n` + xmls.join("\n\n");
    const blob = new Blob([merged], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_esteve_${campagne}_${currentEstablishment!.uai}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    for (const p of payloads) {
      await supabase.from("entretiens_export_esteve").upsert({
        entretien_id: p.entretien.id,
        exported_by: (await supabase.auth.getUser()).data.user!.id,
        notes: `Export XML — campagne ${campagne}`,
      }, { onConflict: "entretien_id" });
      await logAccesEntretien(p.entretien.id, "export_esteve", `XML — ${payloads.length} agents`);
    }
    toast({ title: "XML ESTEVE exporté", description: `${payloads.length} payload(s) générés.` });
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate("/entretiens")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Entretiens
      </Button>
      <div className="flex items-center gap-3 mb-2">
        <FileSpreadsheet className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">Export ESTEVE</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Export des CREP finalisés vers l'application ministérielle ESTEVE (DGRH B1).
        Format XML conforme à la circulaire MENH1310955C — annexe 4 ; CSV de secours pour le SG/AC.
      </p>

      <Alert className="mb-6">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>RGPD — Article 6.1.c</AlertTitle>
        <AlertDescription>
          Le transfert vers ESTEVE constitue un traitement réglementaire. Chaque export est tracé dans
          le journal RGPD (`entretiens_acces_log`).
        </AlertDescription>
      </Alert>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Campagne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {[2024, 2025, 2026].map((y) => (
              <Button
                key={y}
                variant={campagne === String(y) ? "default" : "outline"}
                onClick={() => setCampagne(String(y))}
              >
                {y}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Entretiens éligibles ({eligibles.length} / {rows.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleAll} disabled={eligibles.length === 0}>
              {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
            <Button onClick={downloadCsv} disabled={selected.size === 0}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button onClick={downloadXml} disabled={selected.size === 0} variant="default">
              <FileCode2 className="w-4 h-4 mr-2" /> XML ESTEVE
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">Aucun entretien finalisé pour cette campagne.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.entretien.id}
                  className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(r.entretien.id)}
                    onCheckedChange={() => toggle(r.entretien.id)}
                    disabled={!r.eligible}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {r.agent?.nom} {r.agent?.prenom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.agent?.corps} — {r.agent?.fonction}
                    </div>
                  </div>
                  {r.eligible ? (
                    <Badge variant="default">Éligible</Badge>
                  ) : (
                    <Badge variant="destructive" title={r.raison}>
                      Non éligible
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}