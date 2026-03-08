import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/mockData";

interface WaterfallItem {
  name: string;
  value: number;
  type: "positive" | "negative" | "total";
}

interface WaterfallChartProps {
  data: WaterfallItem[];
  height?: number;
}

export function WaterfallChart({ data, height = 300 }: WaterfallChartProps) {
  // Build cumulative data for waterfall
  let cumulative = 0;
  const chartData = data.map((item) => {
    if (item.type === "total") {
      const result = { name: item.name, base: 0, value: item.value, fill: "hsl(215, 70%, 45%)" };
      cumulative = item.value;
      return result;
    }
    const base = cumulative;
    cumulative += item.value;
    return {
      name: item.name,
      base: item.value >= 0 ? base : cumulative,
      value: Math.abs(item.value),
      fill: item.value >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))",
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "base") return ["", ""];
            return [formatCurrency(value), "Montant"];
          }}
        />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
        <Bar dataKey="base" stackId="waterfall" fill="transparent" />
        <Bar dataKey="value" stackId="waterfall" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
