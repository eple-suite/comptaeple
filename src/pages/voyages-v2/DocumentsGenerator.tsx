// ════════════════════════════════════════════════════════════════
// UI : sélection + génération des 32 documents en ZIP
// ════════════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Loader2, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CATALOGUE_32, CATEGORIE_LABEL, docsParCategorie, type DocCategorie } from "./lib/documentsCatalogue";
import { telechargerZipVoyage } from "./lib/zipGenerator";
import type { DocxBuildContext } from "./lib/docxBuilder";

interface Props {
  context: DocxBuildContext;
  defaultOpen?: boolean;
}

export function DocumentsGenerator({ context }: Props) {
  const grouped = useMemo(() => docsParCategorie(), []);
  const [selection, setSelection] = useState<Set<string>>(
    new Set(CATALOGUE_32.filter((d) => d.obligatoire).map((d) => d.id))
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });

  const toggle = (id: string) => {
    setSelection((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelection(new Set(CATALOGUE_32.map((d) => d.id)));
  const selectObligatoires = () =>
    setSelection(new Set(CATALOGUE_32.filter((d) => d.obligatoire).map((d) => d.id)));
  const selectNone = () => setSelection(new Set());

  const handleGenerate = async () => {
    if (selection.size === 0) {
      toast.error("Sélectionnez au moins un document");
      return;
    }
    setBusy(true);
    setProgress({ current: 0, total: selection.size, label: "Démarrage…" });
    try {
      await telechargerZipVoyage(
        context,
        Array.from(selection),
        (p) => setProgress({ current: p.current, total: p.total, label: p.currentDoc || "" })
      );
      toast.success(`Dossier ZIP généré : ${selection.size} document(s)`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Erreur génération : ${e?.message || "inconnue"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Générateur 32 documents
            </CardTitle>
            <CardDescription>
              Génération .docx (Word) de l'intégralité du dossier voyage, conformément à la circulaire
              MENE2407159C, M9-6, GBCP, CCP 2026 et RGP 2022-408.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectObligatoires} disabled={busy}>
              <ShieldCheck className="h-4 w-4 mr-1" /> Obligatoires
            </Button>
            <Button variant="outline" size="sm" onClick={selectAll} disabled={busy}>
              Tout
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone} disabled={busy}>
              Aucun
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>{selection.size} / {CATALOGUE_32.length} document(s) sélectionné(s)</AlertTitle>
          <AlertDescription>
            Le ZIP est organisé en 5 dossiers (Amont / Familles / Mise en concurrence / Budgétaires / Après).
            Tous les champs connus du voyage sont pré-remplis ; les champs manquants sont marqués
            « (à compléter) ».
          </AlertDescription>
        </Alert>

        {(Object.keys(grouped) as DocCategorie[]).map((cat) => (
          <div key={cat} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{CATEGORIE_LABEL[cat]}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {grouped[cat].map((d) => (
                <label
                  key={d.id}
                  className="flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={selection.has(d.id)}
                    onCheckedChange={() => toggle(d.id)}
                    disabled={busy}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">
                        {String(d.numero).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium">{d.titre}</span>
                      {d.obligatoire && <Badge variant="secondary" className="text-[10px]">Obligatoire</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                    {d.reference_legale && (
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        Réf : {d.reference_legale}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <Separator />
          </div>
        ))}

        {busy && (
          <div className="space-y-2">
            <Progress value={(progress.current / Math.max(1, progress.total)) * 100} />
            <p className="text-xs text-muted-foreground">
              {progress.current}/{progress.total} — {progress.label}
            </p>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={busy || selection.size === 0} size="lg" className="w-full">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Générer le dossier ZIP ({selection.size} document{selection.size > 1 ? "s" : ""})
        </Button>
      </CardContent>
    </Card>
  );
}