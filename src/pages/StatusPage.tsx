// Health check public (#24) — vérifie la configuration, la joignabilité de
// Supabase et l'état de la session. Accessible sans authentification pour
// diagnostiquer rapidement une panne (env manquante, backend injoignable).
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CHANGELOG } from "@/lib/changelog";

type Etat = "ok" | "ko" | "warn" | "check";

interface Controle {
  cle: string;
  libelle: string;
  etat: Etat;
  detail: string;
}

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const ICONE: Record<Etat, JSX.Element> = {
  ok: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  ko: <XCircle className="h-5 w-5 text-red-600" />,
  warn: <XCircle className="h-5 w-5 text-amber-500" />,
  check: <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />,
};

const BADGE: Record<Etat, string> = {
  ok: "bg-emerald-100 text-emerald-800",
  ko: "bg-red-100 text-red-800",
  warn: "bg-amber-100 text-amber-800",
  check: "bg-muted text-muted-foreground",
};

export default function StatusPage() {
  const [controles, setControles] = useState<Controle[]>([]);
  const [enCours, setEnCours] = useState(false);

  const lancer = async () => {
    setEnCours(true);
    const res: Controle[] = [];

    // 1. Configuration
    const urlOk = !!URL && !URL.includes("placeholder");
    const keyOk = !!KEY && !KEY.includes("placeholder");
    res.push({
      cle: "config",
      libelle: "Configuration (variables d'environnement)",
      etat: urlOk && keyOk ? "ok" : "ko",
      detail: urlOk && keyOk
        ? "VITE_SUPABASE_URL et clé publiable présentes."
        : "Variables d'environnement manquantes ou valeurs de repli (placeholder).",
    });

    // 2. Joignabilité du backend Supabase (endpoint de santé, sans auth)
    if (urlOk) {
      try {
        const r = await fetch(`${URL}/auth/v1/health`, { headers: KEY ? { apikey: KEY } : {} });
        res.push({
          cle: "backend",
          libelle: "Backend Supabase joignable",
          etat: r.ok ? "ok" : "ko",
          detail: r.ok ? `Réponse ${r.status} de /auth/v1/health.` : `Réponse ${r.status}.`,
        });
      } catch (e) {
        res.push({
          cle: "backend",
          libelle: "Backend Supabase joignable",
          etat: "ko",
          detail: `Injoignable : ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    } else {
      res.push({ cle: "backend", libelle: "Backend Supabase joignable", etat: "warn", detail: "Non testé (configuration incomplète)." });
    }

    // 3. Session d'authentification (information, pas un échec si absente)
    try {
      const { data, error } = await supabase.auth.getSession();
      res.push({
        cle: "session",
        libelle: "Session d'authentification",
        etat: error ? "ko" : "ok",
        detail: error ? error.message : data.session ? "Session active." : "Aucune session (non connecté).",
      });
    } catch (e) {
      res.push({ cle: "session", libelle: "Session d'authentification", etat: "ko", detail: e instanceof Error ? e.message : String(e) });
    }

    setControles(res);
    setEnCours(false);
  };

  useEffect(() => { void lancer(); }, []);

  const version = CHANGELOG[0];
  const global: Etat = controles.length === 0
    ? "check"
    : controles.some((c) => c.etat === "ko")
      ? "ko"
      : controles.some((c) => c.etat === "warn")
        ? "warn"
        : "ok";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">État du service</h1>
          <p className="text-sm text-muted-foreground">
            Version {version.version} — {new Date(version.date).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void lancer()} disabled={enCours}>
          <RefreshCw className={`h-4 w-4 mr-1 ${enCours ? "animate-spin" : ""}`} /> Relancer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {ICONE[global]}
            {global === "ok" ? "Tous les services opérationnels"
              : global === "check" ? "Vérification en cours…"
                : global === "warn" ? "Fonctionnement dégradé"
                  : "Incident détecté"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {controles.map((c) => (
            <div key={c.cle} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
              <div className="mt-0.5">{ICONE[c.etat]}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{c.libelle}</span>
                  <Badge className={`text-[10px] ${BADGE[c.etat]}`}>{c.etat.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
              </div>
            </div>
          ))}
          {controles.length === 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Contrôles en cours…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
