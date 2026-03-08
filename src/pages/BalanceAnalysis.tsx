import { motion } from "framer-motion";
import { mockBalanceData, formatCurrency } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  PieChart as RPieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const soldesData = mockBalanceData.map(row => ({
  name: row.classe.replace("Classe ", "C"),
  value: Math.abs(row.solde),
  fill: row.solde >= 0 ? "hsl(215, 70%, 45%)" : "hsl(160, 45%, 45%)",
  label: row.label,
  solde: row.solde,
  sens: row.solde >= 0 ? "Débiteur" : "Créditeur",
}));

const pieData = mockBalanceData.map((row, i) => ({
  name: row.classe.replace("Classe ", "C") + " " + row.label,
  value: row.debit + row.credit,
  fill: [
    "hsl(215, 70%, 45%)", "hsl(160, 45%, 45%)", "hsl(38, 92%, 50%)",
    "hsl(280, 60%, 55%)", "hsl(215, 25%, 65%)", "hsl(0, 70%, 55%)", "hsl(160, 60%, 35%)"
  ][i],
}));

const radarData = mockBalanceData.map(row => ({
  subject: row.classe.replace("Classe ", "C"),
  debit: row.debit / 10000,
  credit: row.credit / 10000,
}));

const BalanceAnalysis = () => {
  const totalDebit = mockBalanceData.reduce((s, r) => s + r.debit, 0);
  const totalCredit = mockBalanceData.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Analyse de la balance comptable</h1>
        <p className="text-sm text-muted-foreground mt-1">Balance générale par classe — Exercice 2023</p>
      </motion.div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-card text-center p-4">
          <p className="text-xl font-bold font-display text-primary">{formatCurrency(totalDebit)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Total Débits</p>
        </Card>
        <Card className="shadow-card text-center p-4">
          <p className="text-xl font-bold font-display text-secondary">{formatCurrency(totalCredit)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Total Crédits</p>
        </Card>
        <Card className="shadow-card text-center p-4">
          <p className={cn("text-xl font-bold font-display", totalDebit - totalCredit >= 0 ? "text-primary" : "text-success")}>
            {formatCurrency(totalDebit - totalCredit)}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Solde net</p>
        </Card>
        <Card className="shadow-card text-center p-4">
          <p className="text-xl font-bold font-display">{mockBalanceData.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Classes comptables</p>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart Débits/Crédits */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Débits & Crédits par classe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockBalanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                <XAxis dataKey="classe" fontSize={10} tickFormatter={v => v.replace("Classe ", "C")} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="debit" name="Débits" fill="hsl(215,70%,45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="credit" name="Crédits" fill="hsl(160,45%,45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart poids de chaque classe */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Poids de chaque classe (mouvements totaux)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RPieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}
                  label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Profil radar Débits / Crédits (×10k€)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Débits" dataKey="debit" stroke="hsl(215, 70%, 45%)" fill="hsl(215, 70%, 45%)" fillOpacity={0.3} />
                <Radar name="Crédits" dataKey="credit" stroke="hsl(160, 45%, 45%)" fill="hsl(160, 45%, 45%)" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Soldes horizontal bar */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Soldes par classe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={soldesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                <YAxis type="category" dataKey="name" width={40} fontSize={11} />
                <Tooltip formatter={(v: number, name: string, props: any) => [formatCurrency(props.payload.solde), props.payload.sens]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {soldesData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
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
              <TableRow className="font-bold bg-muted/30">
                <TableCell colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(totalDebit)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(totalCredit)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(totalDebit - totalCredit)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceAnalysis;
