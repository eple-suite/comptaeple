import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, ChevronDown, ChevronUp, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export interface YearlyFinancialData {
  year: number;
  totalRecettes: number;
  totalDepenses: number;
  fdr: number;
  bfr: number;
  tresorerie: number;
  resultat: number;
  caf: number;
  cafNette: number;
  tauxRecouvrement: number;
  joursFDR: number;
  tresoreriePropre: number;
  poidsCharges: number;
  poidsSRH: number;
  dotationAmortissements: number;
  neutralisations: number;
}

const defaultCurrentYear: YearlyFinancialData = {
  year: 2023,
  totalRecettes: 1855230,
  totalDepenses: 1840000,
  fdr: 245832,
  bfr: 78450,
  tresorerie: 167382,
  resultat: 15230,
  caf: 80230,
  cafNette: 22230,
  tauxRecouvrement: 94.2,
  joursFDR: 42,
  tresoreriePropre: 87382,
  poidsCharges: 78.5,
  poidsSRH: 62.3,
  dotationAmortissements: 65000,
  neutralisations: 58000,
};

const defaultHistoricalData: YearlyFinancialData[] = [
  { year: 2022, totalRecettes: 1780000, totalDepenses: 1762000, fdr: 238000, bfr: 75000, tresorerie: 163000, resultat: 18000, caf: 72000, cafNette: 65000, tauxRecouvrement: 93.1, joursFDR: 40, tresoreriePropre: 82000, poidsCharges: 79.2, poidsSRH: 63.1, dotationAmortissements: 54000, neutralisations: 47000 },
  { year: 2021, totalRecettes: 1720000, totalDepenses: 1708000, fdr: 225000, bfr: 68000, tresorerie: 157000, resultat: 12000, caf: 65000, cafNette: 58000, tauxRecouvrement: 91.8, joursFDR: 38, tresoreriePropre: 76000, poidsCharges: 80.1, poidsSRH: 64.5, dotationAmortissements: 53000, neutralisations: 46000 },
  { year: 2020, totalRecettes: 1650000, totalDepenses: 1665000, fdr: 198000, bfr: 72000, tresorerie: 126000, resultat: -15000, caf: 38000, cafNette: 32000, tauxRecouvrement: 88.5, joursFDR: 32, tresoreriePropre: 48000, poidsCharges: 82.3, poidsSRH: 65.8, dotationAmortissements: 53000, neutralisations: 47000 },
  { year: 2019, totalRecettes: 1600000, totalDepenses: 1602000, fdr: 210000, bfr: 65000, tresorerie: 145000, resultat: -2000, caf: 52000, cafNette: 48000, tauxRecouvrement: 92.4, joursFDR: 35, tresoreriePropre: 65000, poidsCharges: 79.8, poidsSRH: 62.9, dotationAmortissements: 54000, neutralisations: 50000 },
];

interface HistoricalDataPanelProps {
  onDataChange: (allYears: YearlyFinancialData[]) => void;
  currentYearData?: YearlyFinancialData;
}

const fieldLabels: { key: keyof YearlyFinancialData; label: string; unit: string; group: string }[] = [
  { key: "totalRecettes", label: "Total recettes", unit: "€", group: "Budget" },
  { key: "totalDepenses", label: "Total dépenses", unit: "€", group: "Budget" },
  { key: "resultat", label: "Résultat", unit: "€", group: "Budget" },
  { key: "fdr", label: "Fonds de roulement", unit: "€", group: "Bilan" },
  { key: "bfr", label: "BFR", unit: "€", group: "Bilan" },
  { key: "tresorerie", label: "Trésorerie nette", unit: "€", group: "Bilan" },
  { key: "tresoreriePropre", label: "Trésorerie propre", unit: "€", group: "Bilan" },
  { key: "caf", label: "CAF brute", unit: "€", group: "CAF" },
  { key: "cafNette", label: "CAF nette", unit: "€", group: "CAF" },
  { key: "dotationAmortissements", label: "Dot. amortissements", unit: "€", group: "CAF" },
  { key: "neutralisations", label: "Neutralisations", unit: "€", group: "CAF" },
  { key: "joursFDR", label: "Jours de FDR", unit: "j.", group: "Ratios" },
  { key: "tauxRecouvrement", label: "Taux de recouvrement", unit: "%", group: "Ratios" },
  { key: "poidsCharges", label: "Poids des charges", unit: "%", group: "Ratios" },
  { key: "poidsSRH", label: "Poids SRH", unit: "%", group: "Ratios" },
];

const groups = ["Budget", "Bilan", "CAF", "Ratios"];

export function HistoricalDataPanel({ onDataChange, currentYearData }: HistoricalDataPanelProps) {
  const current = currentYearData || defaultCurrentYear;
  const [historicalData, setHistoricalData] = useState<YearlyFinancialData[]>(defaultHistoricalData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeGroup, setActiveGroup] = useState("Budget");

  const updateField = (yearIndex: number, field: keyof YearlyFinancialData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setHistoricalData(prev => {
      const updated = [...prev];
      updated[yearIndex] = { ...updated[yearIndex], [field]: numValue };
      return updated;
    });
  };

  const handleSave = () => {
    const allYears = [current, ...historicalData].sort((a, b) => a.year - b.year);
    onDataChange(allYears);
    toast({ title: "Données historiques sauvegardées", description: "Les graphiques d'évolution ont été mis à jour." });
  };

  const handleReset = () => {
    setHistoricalData(defaultHistoricalData);
    const allYears = [current, ...defaultHistoricalData].sort((a, b) => a.year - b.year);
    onDataChange(allYears);
    toast({ title: "Données réinitialisées" });
  };

  const filteredFields = fieldLabels.filter(f => f.group === activeGroup);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Données des exercices antérieurs (N-1 à N-4)</CardTitle>
            <Badge variant="outline" className="text-[9px]">Saisie manuelle</Badge>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                💡 Renseignez les données des exercices passés pour alimenter les graphiques d'évolution pluriannuelle.
              </p>

              {/* Group tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {groups.map(g => (
                  <Button
                    key={g}
                    variant={activeGroup === g ? "default" : "outline"}
                    size="sm"
                    className={`text-xs h-7 ${activeGroup === g ? "gradient-primary border-0" : ""}`}
                    onClick={() => setActiveGroup(g)}
                  >
                    {g}
                  </Button>
                ))}
              </div>

              {/* Data table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 font-medium text-muted-foreground min-w-[140px]">Indicateur</th>
                      <th className="text-center py-2 px-1 font-medium text-primary min-w-[90px]">
                        {current.year} <Badge className="text-[8px] bg-primary/10 text-primary border-0 ml-1">actuel</Badge>
                      </th>
                      {historicalData.map((d, i) => (
                        <th key={i} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[90px]">{d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map(field => (
                      <tr key={field.key} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="py-1.5 pr-2 text-muted-foreground">
                          {field.label} <span className="text-[9px] opacity-60">({field.unit})</span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className="font-mono font-medium text-primary">
                            {typeof current[field.key] === "number"
                              ? field.unit === "€"
                                ? (current[field.key] as number).toLocaleString("fr-FR")
                                : (current[field.key] as number).toFixed(field.unit === "%" ? 1 : 0)
                              : current[field.key]}
                          </span>
                        </td>
                        {historicalData.map((_, yi) => (
                          <td key={yi} className="py-1.5 px-1">
                            <Input
                              type="number"
                              value={historicalData[yi][field.key]}
                              onChange={e => updateField(yi, field.key, e.target.value)}
                              className="h-7 text-xs text-center font-mono w-full min-w-[80px]"
                              step={field.unit === "%" ? 0.1 : 1000}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-7">
                  <RotateCcw className="h-3 w-3 mr-1" /> Réinitialiser
                </Button>
                <Button size="sm" onClick={handleSave} className="text-xs h-7 gradient-primary border-0">
                  <Save className="h-3 w-3 mr-1" /> Appliquer aux graphiques
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export { defaultCurrentYear, defaultHistoricalData };
