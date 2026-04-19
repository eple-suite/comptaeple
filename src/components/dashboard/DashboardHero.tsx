import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardHeroProps {
  greeting: string;
  exercice: number;
  etabName?: string;
  hasData: boolean;
  fdr?: string;
  resume?: string;
}

export function DashboardHero({ greeting, exercice, etabName, hasData, fdr, resume }: DashboardHeroProps) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/30"
    >
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-secondary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none" />

      <div className="relative px-8 py-10 md:px-10 md:py-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Exercice {exercice}
          </span>
          {etabName && (
            <span className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
              {etabName}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground mb-2">
          {timeGreeting}, <span className="font-serif-accent text-primary">{greeting}</span>.
        </h1>

        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          {hasData ? (
            <>
              Voici votre cockpit financier consolidé.{" "}
              {fdr && <>Le fonds de roulement s'établit à <span className="font-semibold text-foreground tabular-nums">{fdr}</span>. </>}
              {resume || "L'ensemble des indicateurs réglementaires sont à jour."}
            </>
          ) : (
            <>
              Bienvenue sur votre cockpit. Pour démarrer, importez une balance Op@le et l'analyse pluriannuelle se construira automatiquement.
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          <Button
            size="default"
            onClick={() => navigate("/hyperale")}
            className="gradient-primary border-0 shadow-primary hover:shadow-lg transition-all gap-2 font-semibold"
          >
            Ouvrir l'analyse HYPER@LE <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="default"
            variant="outline"
            onClick={() => navigate("/compte-financier")}
            className="border-border/60 hover:bg-accent/60 gap-2"
          >
            Compte financier
          </Button>
          {!hasData && (
            <Button
              size="default"
              variant="ghost"
              onClick={() => navigate("/import")}
              className="gap-2 text-primary hover:bg-primary/10"
            >
              Importer une balance →
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
