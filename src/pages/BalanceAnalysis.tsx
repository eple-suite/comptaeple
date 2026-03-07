import { motion } from "framer-motion";
import { mockBalanceData, formatCurrency } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

const BalanceAnalysis = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Analyse de la balance comptable</h1>
        <p className="text-sm text-muted-foreground mt-1">Balance générale par classe — Exercice 2023</p>
      </motion.div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Soldes par classe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockBalanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="classe" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="debit" name="Débits" fill="hsl(215,70%,45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="credit" name="Crédits" fill="hsl(160,45%,45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Détail par classe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Débits</TableHead>
                <TableHead className="text-right">Crédits</TableHead>
                <TableHead className="text-right">Solde</TableHead>
                <TableHead>Sens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBalanceData.map((row) => (
                <TableRow key={row.classe}>
                  <TableCell className="font-medium">{row.classe}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(row.debit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(row.credit)}</TableCell>
                  <TableCell className={cn("text-right font-mono text-sm font-semibold", row.solde >= 0 ? "text-foreground" : "text-primary")}>
                    {formatCurrency(row.solde)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.solde >= 0 ? "default" : "secondary"} className="text-[10px]">
                      {row.solde >= 0 ? "Débiteur" : "Créditeur"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceAnalysis;
