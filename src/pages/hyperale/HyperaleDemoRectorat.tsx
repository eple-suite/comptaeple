import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_ETABLISSEMENT, DEMO_POINTS_VIGILANCE } from '@/lib/demo/fixtures';
import {
  Sparkles, Play, ArrowRight, ChevronRight, Trophy, Presentation,
  Clock, Users, Target, BarChart3, Bot, FileSpreadsheet, BookOpen, BellRing,
} from 'lucide-react';

/**
 * Démo guidée HYPER@LE pour le rectorat.
 * Active le mode démonstration global et propose un parcours scénarisé en 6 scènes,
 * chacune renvoyant vers la page concernée du module.
 */

interface Scene {
  id: string;
  duree: string;
  titre: string;
  pitch: string;
  route: string;
  icon: any;
  highlight?: string;
}

const SCENES: Scene[] = [
  {
    id: 'accueil',
    duree: '1 min',
    titre: '1 — Sélection multi-EPLE et KPI consolidés',
    pitch: "Démontrer la vue agence comptable : choix d'établissement, FDR/CAF/Trésorerie/Réserves en un coup d'œil, score de santé.",
    route: '/hyperale',
    icon: Trophy,
    highlight: 'Vue groupement absente d\'Ide@le',
  },
  {
    id: 'analyse',
    duree: '3 min',
    titre: '2 — Analyse augmentée et storytelling IA',
    pitch: "Faire dérouler les 6 exercices d'historique, montrer les graphiques de tendance et le commentaire généré prêt à coller dans le COFI.",
    route: '/hyperale/analyse',
    icon: BarChart3,
    highlight: 'Profondeur ×6 vs N/N-1 d\'Ide@le',
  },
  {
    id: 'alertes',
    duree: '2 min',
    titre: '3 — Moteur d\'alertes hiérarchisées',
    pitch: "Présenter les 3 vigilances : DRFN 94 j, marge SRH -8 k€, projection FDR. Chaque alerte renvoie vers le levier d'action.",
    route: '/hyperale',
    icon: BellRing,
    highlight: 'Recommandations actionnables',
  },
  {
    id: 'assistant',
    duree: '2 min',
    titre: '4 — Assistant IA contextuel',
    pitch: "Poser une question type : « Comment expliquer la baisse de CAF au CA ? » → réponse sourcée M9-6, ton ajusté CA.",
    route: '/hyperale/assistant',
    icon: Bot,
    highlight: 'Aucun équivalent dans Ide@le',
  },
  {
    id: 'import',
    duree: '1 min',
    titre: '5 — Import Op@le guidé',
    pitch: "Montrer le guide « quels fichiers exporter d'Op@le » (Balance, SDE, SDR, ECBU) et le mapping automatique.",
    route: '/hyperale/import',
    icon: FileSpreadsheet,
    highlight: '0 minute de saisie manuelle',
  },
  {
    id: 'mode-emploi',
    duree: '1 min',
    titre: '6 — Pédagogie et mode d\'emploi',
    pitch: "Conclure sur le mode Débutant/Expert, le glossaire intégré et les parcours d'apprentissage 10 / 20 minutes.",
    route: '/hyperale/mode-emploi',
    icon: BookOpen,
    highlight: 'Support de formation continue',
  },
];

const HYPERALE_VIGILANCES = DEMO_POINTS_VIGILANCE.filter(
  (p) => p.module === 'HYPER@LE' || p.module === 'Compte financier',
);

export default function HyperaleDemoRectorat() {
  const { isDemoMode, enable, disable } = useDemoMode();
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-6"
      >
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-primary shrink-0">
              <Presentation className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <Badge className="mb-2 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border-amber-500/30">
                Démonstration rectorat
              </Badge>
              <h2 className="text-2xl font-display font-bold tracking-tight">
                HYPER@LE — parcours guidé pour le rectorat
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                6 scènes, ~10 minutes. Le mode démonstration charge l'EPLE fictif
                « <strong>{DEMO_ETABLISSEMENT.nom}</strong> » ({DEMO_ETABLISSEMENT.uai},
                {' '}{DEMO_ETABLISSEMENT.nb_eleves} élèves, budget {(DEMO_ETABLISSEMENT.budget_annuel/1_000_000).toFixed(1)} M€)
                avec des points de vigilance pédagogiques. Aucune écriture en base.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {!isDemoMode ? (
              <Button onClick={enable} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Activer le mode démonstration
              </Button>
            ) : (
              <Button onClick={disable} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Mode démo actif — désactiver
              </Button>
            )}
            <span className="text-[10px] text-muted-foreground">
              Statut : {isDemoMode ? 'données fictives chargées' : 'données réelles'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Mini KPI scénario */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Clock} label="Durée totale" value="~10 min" />
        <KpiCard icon={Users} label="Public" value="Rectorat / AC" />
        <KpiCard icon={Target} label="Points de vigilance" value={`${DEMO_POINTS_VIGILANCE.length}`} />
        <KpiCard icon={Trophy} label="Comparaison" value="vs Ide@le" />
      </div>

      {/* Vigilances mises en scène */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Points de vigilance financiers à mettre en avant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {HYPERALE_VIGILANCES.map((v) => (
            <div
              key={v.titre}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <span
                className={`h-2.5 w-2.5 mt-1.5 rounded-full shrink-0 ${
                  v.niveau === 'rouge' ? 'bg-destructive' : 'bg-amber-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{v.titre}</span>
                  <Badge variant="outline" className="text-[10px]">{v.module}</Badge>
                  <span className="text-[10px] text-muted-foreground">{v.reference}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{v.detail}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate(v.route)} className="shrink-0 h-7">
                Voir <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Scènes du parcours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Parcours guidé en 6 scènes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {SCENES.map((s, i) => {
            const Icon = s.icon;
            const active = currentScene === s.id;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`group rounded-lg border p-3 transition-all ${
                  active ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{s.titre}</span>
                      <Badge variant="outline" className="text-[10px]">{s.duree}</Badge>
                      {s.highlight && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/30">
                          <Sparkles className="h-2.5 w-2.5 mr-1" />{s.highlight}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.pitch}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!isDemoMode) enable();
                      setCurrentScene(s.id);
                      navigate(s.route);
                    }}
                    className="shrink-0"
                  >
                    Lancer <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Conclusion pitch */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Phrase de clôture (à dire au rectorat)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed">
          <p className="italic">
            « HYPER@LE n'entre pas en concurrence avec Ide@le : il en prolonge la valeur. Ide@le fournit les
            chiffres officiels Op@le ; HYPER@LE les interprète, les met en perspective sur 6 ans et propose
            au chef d'établissement comme à l'agent comptable un plan d'action sourcé M9-6. »
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
          <div className="text-base font-display font-bold text-foreground truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}