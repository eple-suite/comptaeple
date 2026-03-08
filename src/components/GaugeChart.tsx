import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  thresholds?: { ok: number; warning: number };
  size?: "sm" | "md" | "lg";
}

export function GaugeChart({ value, max, label, unit = "", thresholds, size = "md" }: GaugeChartProps) {
  const pct = Math.min((value / max) * 100, 100);
  const angle = (pct / 100) * 180;
  
  const getColor = () => {
    if (!thresholds) return "hsl(var(--primary))";
    if (value >= thresholds.ok) return "hsl(var(--success))";
    if (value >= thresholds.warning) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const dims = { sm: { w: 120, h: 70, r: 45, sw: 8 }, md: { w: 160, h: 90, r: 60, sw: 10 }, lg: { w: 200, h: 110, r: 75, sw: 12 } };
  const d = dims[size];
  const cx = d.w / 2;
  const cy = d.h - 5;

  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = { x: cx + radius * Math.cos((Math.PI * (180 + startAngle)) / 180), y: cy + radius * Math.sin((Math.PI * (180 + startAngle)) / 180) };
    const end = { x: cx + radius * Math.cos((Math.PI * (180 + endAngle)) / 180), y: cy + radius * Math.sin((Math.PI * (180 + endAngle)) / 180) };
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={d.w} height={d.h} viewBox={`0 0 ${d.w} ${d.h}`}>
        <path d={describeArc(0, 180, d.r)} fill="none" stroke="hsl(var(--muted))" strokeWidth={d.sw} strokeLinecap="round" />
        <path d={describeArc(0, angle, d.r)} fill="none" stroke={getColor()} strokeWidth={d.sw} strokeLinecap="round" />
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground font-bold" fontSize={size === "lg" ? 18 : size === "md" ? 15 : 12}>
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}{unit}
        </text>
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-0.5 font-medium">{label}</p>
    </div>
  );
}
