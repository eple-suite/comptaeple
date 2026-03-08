import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockData";

interface BalanceScaleProps {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  leftColor?: string;
  rightColor?: string;
  title?: string;
}

export function BalanceScale({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftColor = "hsl(var(--primary))",
  rightColor = "hsl(var(--secondary))",
  title,
}: BalanceScaleProps) {
  const total = leftValue + rightValue;
  const ratio = total > 0 ? (leftValue - rightValue) / total : 0;
  // Tilt angle: max ±12 degrees
  const tiltAngle = ratio * 12;
  // Determine which side is heavier
  const leftHeavier = leftValue > rightValue;
  const balanced = Math.abs(ratio) < 0.02;

  return (
    <div className="flex flex-col items-center w-full">
      {title && <p className="text-sm font-semibold text-foreground mb-3">{title}</p>}
      <svg viewBox="0 0 400 220" className="w-full max-w-[400px]" aria-label={`Balance: ${leftLabel} vs ${rightLabel}`}>
        {/* Base / pillar */}
        <rect x="185" y="180" width="30" height="30" rx="4" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <polygon points="200,30 185,180 215,180" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Pivot circle */}
        <circle cx="200" cy="30" r="8" fill="hsl(var(--foreground))" opacity="0.15" />
        <circle cx="200" cy="30" r="4" fill="hsl(var(--foreground))" opacity="0.4" />

        {/* Beam group — rotates around pivot */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: tiltAngle }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
          style={{ transformOrigin: "200px 30px" }}
        >
          {/* Beam */}
          <rect x="40" y="26" width="320" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.2" />

          {/* Left chain */}
          <line x1="80" y1="34" x2="80" y2="70" stroke="hsl(var(--border))" strokeWidth="2" />
          {/* Left plate */}
          <ellipse cx="80" cy="75" rx="55" ry="8" fill={leftColor} opacity="0.15" stroke={leftColor} strokeWidth="1.5" />
          <rect x="30" y="66" width="100" height="18" rx="6" fill={leftColor} opacity="0.12" />

          {/* Left value */}
          <text x="80" y="60" textAnchor="middle" fontSize="11" fontWeight="700" fill={leftColor}>
            {formatCurrency(leftValue)}
          </text>
          <text x="80" y="100" textAnchor="middle" fontSize="9" fill="currentColor" className="fill-muted-foreground">
            {leftLabel}
          </text>

          {/* Right chain */}
          <line x1="320" y1="34" x2="320" y2="70" stroke="hsl(var(--border))" strokeWidth="2" />
          {/* Right plate */}
          <ellipse cx="320" cy="75" rx="55" ry="8" fill={rightColor} opacity="0.15" stroke={rightColor} strokeWidth="1.5" />
          <rect x="270" y="66" width="100" height="18" rx="6" fill={rightColor} opacity="0.12" />

          {/* Right value */}
          <text x="320" y="60" textAnchor="middle" fontSize="11" fontWeight="700" fill={rightColor}>
            {formatCurrency(rightValue)}
          </text>
          <text x="320" y="100" textAnchor="middle" fontSize="9" fill="currentColor" className="fill-muted-foreground">
            {rightLabel}
          </text>
        </motion.g>

        {/* Status label */}
        <text x="200" y="215" textAnchor="middle" fontSize="10" fontWeight="600"
          fill={balanced ? "hsl(var(--success))" : leftHeavier ? leftColor : rightColor}
        >
          {balanced ? "≈ Équilibre" : leftHeavier ? `${leftLabel} > ${rightLabel}` : `${rightLabel} > ${leftLabel}`}
        </text>
      </svg>
    </div>
  );
}
