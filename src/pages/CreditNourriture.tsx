import { useState } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Calculator, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/mockData";
import { KpiCard } from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Ventilation {
  poste: string;
  montant: number;
  pourcentage: number;
}

const CreditNourriture = () => {
  const [nbRepas, setNbRepas] = useState(85000);
  const [chargesAlim, setChargesAlim] = useState(252000);
  const [chargesPerso, setChargesPerso] = useState(145000);
  const [chargesFonct, setChargesFonct] = useState(38000);
  const [recettes, setRecettes] = useState(420000);

  const totalCharges = chargesAlim + chargesPerso + chargesFonct;
  const coutRepas = nbRepas > 0 ? totalCharges / nbRepas : 0;
  const coutDenrees = nbRepas > 0 ? chargesAlim / nbRepas : 0;
  const resultatSRH = recettes - totalCharges;

  const ventilation: Ventilation[] = [
    { poste: "Denrées alimentaires", montant: chargesAlim, pourcentage: (chargesAlim / totalCharges) * 100 },
    { poste: "Personnel", montant: chargesPerso, pourcentage: (chargesPerso / totalCharges) * 100 },
    { poste: "Fonctionnement", montant: chargesFonct, pourcentage: (chargesFonct / totalCharges) * 100 },
  ];

  const evolutionData = [
    { mois: "Sep", repas: 9500, cout: 2.85 },
    { mois: "Oct", repas: 10200, cout: 2.92 },
    { mois: "Nov", repas: 9800, cout: 2.88 },
    { mois: "Déc", repas: 7500, cout: 3.05 },
    { mois: "Jan", repas: 9200, cout: 2.95 },
    { mois: "Fév", repas: 8800, cout: 2.90 },
    { mois: "Mar", repas: 10000, cout: 2.97 },
    { mois: "Avr", repas: 8500, cout: 2.93 },
    { mois: "Mai", repas: 9800, cout: 2.96 },
    { mois: "Jun", repas: 7200, cout: 3.10 },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Crédit nourriture</h1>
        <p className="text-sm text-muted-foreground mt-1">Calcul du coût repas et ventilation automatique — SRH</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Coût moyen du repas" value={`${coutRepas.toFixed(2)} €`} icon={UtensilsCrossed} variant="primary" />
        <KpiCard title="Coût denrées / repas" value={`${coutDenrees.toFixed(2)} €`} icon={Calculator} variant="default" />
        <KpiCard title="Nombre de repas" value={nbRepas.toLocaleString("fr-FR")} icon={Users} variant="success" />
        <KpiCard title="Résultat SRH" value={formatCurrency(resultatSRH)} icon={TrendingUp} variant={resultatSRH >= 0 ? "success" : "destructive"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Paramètres de calcul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nombre de repas servis</Label><Input type="number" value={nbRepas} onChange={(e) => setNbRepas(Number(e.target.value))} /></div>
              <div><Label>Recettes SRH (€)</Label><Input type="number" value={recettes} onChange={(e) => setRecettes(Number(e.target.value))} /></div>
              <div><Label>Charges alimentaires (€)</Label><Input type="number" value={chargesAlim} onChange={(e) => setChargesAlim(Number(e.target.value))} /></div>
              <div><Label>Charges de personnel (€)</Label><Input type="number" value={chargesPerso} onChange={(e) => setChargesPerso(Number(e.target.value))} /></div>
              <div><Label>Charges de fonctionnement (€)</Label><Input type="number" value={chargesFonct} onChange={(e) => setChargesFonct(Number(e.target.value))} /></div>
              <div className="flex items-end">
                <div className="p-3 rounded-lg bg-muted/50 w-full text-center">
                  <p className="text-xs text-muted-foreground">Total charges</p>
                  <p className="text-lg font-bold font-display">{formatCurrency(totalCharges)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ventilation des charges</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Par repas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventilation.map((v) => (
                  <TableRow key={v.poste}>
                    <TableCell className="font-medium">{v.poste}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(v.montant)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-[10px] font-mono">{v.pourcentage.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {nbRepas > 0 ? `${(v.montant / nbRepas).toFixed(2)} €` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totalCharges)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                  <TableCell className="text-right font-mono">{coutRepas.toFixed(2)} €</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Évolution mensuelle du nombre de repas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="repas" name="Repas servis" fill="hsl(215,70%,45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Analyse automatique</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>📊 Le coût moyen du repas est de <strong className="text-foreground">{coutRepas.toFixed(2)} €</strong>, dont <strong className="text-foreground">{coutDenrees.toFixed(2)} €</strong> de denrées alimentaires.</p>
          <p>{resultatSRH >= 0 ? "✅" : "⚠️"} Le résultat du SRH est {resultatSRH >= 0 ? "excédentaire" : "déficitaire"} de <strong className="text-foreground">{formatCurrency(Math.abs(resultatSRH))}</strong>.</p>
          <p>📈 La part des charges de personnel représente <strong className="text-foreground">{((chargesPerso / totalCharges) * 100).toFixed(1)}%</strong> du coût total.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditNourriture;
