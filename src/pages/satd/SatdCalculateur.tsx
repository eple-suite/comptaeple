import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, AlertCircle, Info, Banknote } from "lucide-react";
import { calculerQuotiteSaisissable, type QuotiteSaisissable, BAREME_SAISIE_2026 } from "./SatdReferenceData";
import { formatCurrency } from "@/lib/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SatdCalculateur({ open, onOpenChange }: Props) {
  const [salaire, setSalaire] = useState("");
  const [personnes, setPersonnes] = useState("0");
  const [result, setResult] = useState<QuotiteSaisissable | null>(null);

  const handleCalculer = () => {
    const s = parseFloat(salaire) || 0;
    const p = parseInt(personnes) || 0;
    setResult(calculerQuotiteSaisissable(s, p));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculateur de quotité saisissable
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info barème */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold">Barème 2026 (art. R.3252-2 Code du travail)</p>
                <p className="text-muted-foreground mt-0.5">
                  Tranches de saisie sur rémunération avec majoration pour personnes à charge.
                  SBI = {formatCurrency(BAREME_SAISIE_2026.sbi)}.
                </p>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Salaire / Pension mensuel net</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={salaire}
                  onChange={e => setSalaire(e.target.value)}
                  placeholder="Ex: 1800"
                  className="pl-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Montant net imposable</p>
            </div>
            <div className="space-y-1.5">
              <Label>Personnes à charge</Label>
              <Select value={personnes} onValueChange={setPersonnes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n} personne{n > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCalculer} className="w-full gradient-primary border-0">
            <Calculator className="h-4 w-4 mr-2" />
            Calculer la quotité saisissable
          </Button>

          {/* Résultat */}
          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Rémunération nette</p>
                  <p className="text-xl font-bold">{formatCurrency(result.montantBrut)}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-primary">Montant saisissable</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(result.montantSaisissable)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    soit {(result.fractionSaisissable * 100).toFixed(1)}% du revenu
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Détail par tranche</p>
                {result.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground">{d.tranche}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px]">{d.taux.toFixed(0)}%</Badge>
                      <span className="font-mono font-medium w-16 text-right">{formatCurrency(d.montant)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
