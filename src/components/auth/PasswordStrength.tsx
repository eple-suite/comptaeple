import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordEvaluation = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  checks: { label: string; ok: boolean }[];
};

export function evaluatePassword(pwd: string): PasswordEvaluation {
  const checks = [
    { label: "Au moins 8 caractères", ok: pwd.length >= 8 },
    { label: "Une majuscule", ok: /[A-Z]/.test(pwd) },
    { label: "Un chiffre", ok: /\d/.test(pwd) },
    { label: "Un caractère spécial", ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
  const score = checks.filter((c) => c.ok).length as 0 | 1 | 2 | 3 | 4;
  const labels = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];
  return { score, label: labels[score], checks };
}

export function PasswordStrength({ password }: { password: string }) {
  const ev = useMemo(() => evaluatePassword(password), [password]);
  if (!password) return null;
  const colors = [
    "bg-destructive",
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-success",
  ];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < ev.score ? colors[ev.score] : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Robustesse : <span className="font-medium text-foreground">{ev.label}</span>
      </p>
      <ul className="text-xs space-y-1">
        {ev.checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "flex items-center gap-1.5",
              c.ok ? "text-success" : "text-muted-foreground",
            )}
          >
            {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}