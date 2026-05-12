import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Presentation, Sparkles, Download, Loader2, CheckCircle2,
  BarChart3, MessagesSquare, Brain, Wallet,
} from 'lucide-react';

interface Section { id: string; titre: string; description: string; icon: any; defaut: boolean; }

const SECTIONS: Section[] = [
  { id: 'synth',  titre: 'Synthèse exécutive (1 page)',         description: 'Score santé + situation en 5 lignes vulgarisées', icon: Sparkles, defaut: true },
  { id: 'fdr',    titre: 'Fonds de roulement & trésorerie',     description: 'FDR, BFR, jours de fonctionnement, évolution',     icon: Wallet,   defaut: true },
  { id: 'caf',    titre: 'CAF & équilibre',                     description: 'Capacité d\'autofinancement, ratios M9-6',         icon: BarChart3,defaut: true },
  { id: 'hist',   titre: 'Historique 6 ans (graphiques)',       description: 'Évolutions FDR, CAF, trésorerie N→N-5',            icon: BarChart3,defaut: true },
  { id: 'pedago', titre: 'Pilotage pédagogique',                description: 'Coût/élève, projets, voyages',                     icon: Brain,    defaut: false },
  { id: 'bench',  titre: 'Benchmark anonymisé',                 description: 'Positionnement vs EPLE similaires',               icon: BarChart3,defaut: false },
  { id: 'comm',   titre: 'Commentaire CA généré par IA',        description: 'Texte vulgarisé prêt à lire en séance',           icon: MessagesSquare, defaut: true },
  { id: 'deci',   titre: 'Décisions à voter',                   description: 'DBM, tarifications, conventions',                  icon: CheckCircle2, defaut: true },
];

export default function HyperaleRapportsCA() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Record<string, boolean>>(
    SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaut }), {} as Record<string, boolean>)
  );
  const [generating, setGenerating] = useState<'pdf' | 'pptx' | null>(null);
  const [done, setDone] = useState<'pdf' | 'pptx' | null>(null);

  const toggle = (id: string) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const count = Object.values(selected).filter(Boolean).length;

  const generate = (kind: 'pdf' | 'pptx') => {
    setGenerating(kind);
    setDone(null);
    setTimeout(() => {
      setGenerating(null);
      setDone(kind);
      toast({
        title: kind === 'pdf' ? 'Rapport PDF généré' : 'Présentation PowerPoint générée',
        description: `${count} section(s) intégrée(s). Prêt à diffuser au CA.`,
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-5"
      >
        <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Génération automatique</Badge>
        <h2 className="text-xl font-display font-bold tracking-tight">Rapports CA prêts à l'emploi — PDF + PowerPoint</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionnez les sections, cliquez. HYPER@LE compose le document, rédige les commentaires et applique
          la charte sobre Éducation nationale. Aucune mise en forme manuelle.
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections à inclure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-2">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const checked = selected[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${checked ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/40'}`}
                >
                  <Checkbox checked={checked} className="mt-0.5" onCheckedChange={() => toggle(s.id)} />
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${checked ? 'text-primary' : 'text-foreground'}`}>{s.titre}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-3">{count} section(s) sélectionnée(s) sur {SECTIONS.length}</div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Rapport PDF (A4 paysage)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Document professionnel paginé, sommaire interactif, graphiques pure CSS imprimables, charte EN.
              4 à 12 pages selon les sections retenues.
            </p>
            <Button onClick={() => generate('pdf')} disabled={generating !== null || count === 0} className="w-full gap-2">
              {generating === 'pdf' ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération…</> : <><Download className="h-4 w-4" /> Générer le PDF</>}
            </Button>
            {done === 'pdf' && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Téléchargement disponible (mode démo)
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Presentation className="h-4 w-4 text-primary" /> Présentation PowerPoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Diapositives 16:9 prêtes à projeter en CA, avec notes de l'orateur générées par IA. Une diapositive
              par section + diapo de garde + diapo de clôture (vote).
            </p>
            <Button onClick={() => generate('pptx')} disabled={generating !== null || count === 0} className="w-full gap-2">
              {generating === 'pptx' ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération…</> : <><Download className="h-4 w-4" /> Générer le PPTX</>}
            </Button>
            {done === 'pptx' && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Téléchargement disponible (mode démo)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/5">
        <CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Mode démonstration.</strong> Dans cette préversion, la génération
            est simulée pour la présentation rectorat. Le moteur réel produit les fichiers PDF/PPTX côté
            edge function avec charte EN, signatures électroniques et horodatage.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
