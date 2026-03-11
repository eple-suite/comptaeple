import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Voyage, DOCUMENTS_OBLIGATOIRES } from "./types";
import { FileCheck, Shield, Heart, CreditCard, FileText } from "lucide-react";

interface Props {
  voyage: Voyage;
}

const DOC_CONFIG = [
  { field: "autorisationParentale", label: "Autorisation parentale", Icon: FileCheck },
  { field: "ficheSanitaire", label: "Fiche sanitaire", Icon: Heart },
  { field: "assuranceRC", label: "Attestation assurance", Icon: Shield },
  { field: "passeport", label: "Pièce d'identité", Icon: CreditCard },
];

export const VoyageDocumentsChecklist = ({ voyage }: Props) => {
  const total = voyage.eleves.length;
  if (total === 0) return null;

  const docs = DOC_CONFIG.map(d => {
    const collected = voyage.eleves.filter(e => (e as any)[d.field] === true).length;
    const pct = total > 0 ? (collected / total) * 100 : 0;
    return { ...d, collected, pct };
  });

  const globalCollected = docs.reduce((s, d) => s + d.collected, 0);
  const globalTotal = docs.length * total;
  const globalPct = globalTotal > 0 ? (globalCollected / globalTotal) * 100 : 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Documents collectés
          </span>
          <Badge variant="secondary" className="text-[10px]">{total} élèves</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {docs.map(d => (
          <div key={d.field} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <d.Icon className={`h-3.5 w-3.5 ${d.pct === 100 ? "text-success" : "text-muted-foreground"}`} />
                <span className="font-medium">{d.label}</span>
              </div>
              <span className="font-mono text-[10px]">
                <span className={d.pct === 100 ? "text-success" : "text-foreground"}>{d.collected}</span>
                <span className="text-muted-foreground">/{total}</span>
              </span>
            </div>
            <Progress
              value={d.pct}
              className={`h-1.5 ${d.pct === 100 ? "[&>div]:bg-success" : d.pct > 50 ? "" : "[&>div]:bg-warning"}`}
            />
          </div>
        ))}

        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          Complétude globale : <span className="font-semibold text-foreground">{globalPct.toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  );
};
