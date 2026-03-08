import { formatCurrency, formatPercent } from "@/lib/mockData";

interface ThermometerChartProps {
  value: number;
  max: number;
  label: string;
  thresholds?: { danger: number; warning: number; ok: number };
  format?: "currency" | "percent" | "days";
  height?: number;
}

export function ThermometerChart({
  value,
  max,
  label,
  thresholds,
  format = "currency",
  height = 180,
}: ThermometerChartProps) {
  const pct = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (!thresholds) return "hsl(var(--primary))";
    if (value >= thresholds.ok) return "hsl(var(--success))";
    if (value >= thresholds.warning) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const formatValue = () => {
    if (format === "currency") return formatCurrency(value);
    if (format === "percent") return formatPercent(value);
    return `${value} j.`;
  };

  const color = getColor();
  const bulbR = 16;
  const tubeW = 12;
  const tubeH = height - bulbR * 2 - 30;
  const cx = 30;
  const tubeTop = 20;
  const fillH = (pct / 100) * tubeH;

  return (
    <div className="flex flex-col items-center">
      <svg width="60" height={height} viewBox={`0 0 60 ${height}`}>
        {/* Tube background */}
        <rect x={cx - tubeW / 2} y={tubeTop} width={tubeW} height={tubeH} rx={tubeW / 2} fill="hsl(var(--muted))" />
        {/* Fill */}
        <rect
          x={cx - tubeW / 2}
          y={tubeTop + tubeH - fillH}
          width={tubeW}
          height={fillH}
          rx={tubeW / 2}
          fill={color}
          opacity="0.85"
        />
        {/* Bulb */}
        <circle cx={cx} cy={tubeTop + tubeH + bulbR - 2} r={bulbR} fill={color} opacity="0.9" />
        {/* Value on top */}
        <text x={cx} y={12} textAnchor="middle" fontSize="9" fontWeight="700" className="fill-foreground">
          {formatValue()}
        </text>
        {/* Threshold marks */}
        {thresholds && (
          <>
            {[thresholds.danger, thresholds.warning, thresholds.ok].map((t, i) => {
              const tPct = Math.min((t / max) * 100, 100);
              const tY = tubeTop + tubeH - (tPct / 100) * tubeH;
              return (
                <g key={i}>
                  <line x1={cx + tubeW / 2 + 2} y1={tY} x2={cx + tubeW / 2 + 8} y2={tY} stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  <text x={cx + tubeW / 2 + 10} y={tY + 3} fontSize="7" className="fill-muted-foreground">{t}</text>
                </g>
              );
            })}
          </>
        )}
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1 font-medium max-w-[80px]">{label}</p>
    </div>
  );
}
