import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Minus, Zap, Trophy, Sparkles, Maximize2 } from 'lucide-react';
import { useState } from 'react';

const LIGNES: Array<{ axe: string; ideale: 'oui' | 'partiel' | 'non'; hyperale: string }> = [
  { axe: 'Profondeur historique',           ideale: 'partiel', hyperale: '6 exercices N→N-5 + projection N+1' },
  { axe: 'Interprétation IA des ratios',    ideale: 'non',     hyperale: 'Score santé 0-100 + commentaires prêts' },
  { axe: 'Assistant conversationnel',       ideale: 'non',     hyperale: 'IA contextuelle sourcée M9-6 / GBCP' },
  { axe: 'Simulations what-if & prévisions',ideale: 'non',     hyperale: 'Simulateur FDR/BFR temps réel' },
  { axe: 'Tableaux de bord par rôle',       ideale: 'partiel', hyperale: 'AC, AdjGest, Chef ét., CA' },
  { axe: 'Pilotage pédagogique',            ideale: 'non',     hyperale: 'Coût/élève, projet, voyage, discipline' },
  { axe: 'Benchmark anonymisé inter-EPLE',  ideale: 'non',     hyperale: 'Quartiles par académie & profil' },
  { axe: 'Rapports CA générés',             ideale: 'non',     hyperale: 'PDF + PPTX prêts à projeter' },
  { axe: 'Alertes actionnables',            ideale: 'partiel', hyperale: 'Hiérarchisées + lien vers le levier' },
  { axe: 'Audit trail & RGPD renforcé',     ideale: 'partiel', hyperale: 'RLS, signature, anonymisation IA' },
  { axe: 'Temps de préparation',            ideale: 'partiel', hyperale: '20 min (vs ~3h aujourd\'hui)' },
];

function Ico({ niveau }: { niveau: 'oui' | 'partiel' | 'non' }) {
  if (niveau === 'oui') return <Check className="h-5 w-5 text-success" />;
  if (niveau === 'partiel') return <Minus className="h-5 w-5 text-amber-500" />;
  return <X className="h-5 w-5 text-destructive" />;
}

export default function HyperaleVsIdealeSlide() {
  const navigate = useNavigate();
  const [full, setFull] = useState(false);

  return (
    <div className={full ? 'fixed inset-0 z-50 bg-background overflow-auto p-8' : 'space-y-4'}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => full ? setFull(false) : navigate('/hyperale/vs-ideale')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {full ? 'Quitter le plein écran' : 'Retour au comparatif'}
        </Button>
        {!full && (
          <Button variant="outline" onClick={() => setFull(true)} className="gap-2">
            <Maximize2 className="h-4 w-4" /> Plein écran (présentation)
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-2 border-primary/30">
          {/* En-tête slide */}
          <div className="relative bg-gradient-to-br from-primary/15 via-card to-primary/5 p-8 border-b border-primary/20">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-primary">
                <Trophy className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Synthèse rectorat</div>
                <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">HYPER@LE vs Ide@le</h1>
                <p className="text-sm text-muted-foreground mt-1">L'analyse financière augmentée pour les EPLE de l'académie</p>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fonction</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Ide@le</th>
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary bg-primary/5">
                    <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> HYPER@LE</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {LIGNES.map((l, i) => (
                  <tr key={l.axe} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/15'}>
                    <td className="px-6 py-3 font-semibold text-sm text-foreground">{l.axe}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex"><Ico niveau={l.ideale} /></div>
                    </td>
                    <td className="px-6 py-3 text-sm bg-primary/5">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span className="text-foreground">{l.hyperale}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>

          {/* Pied slide */}
          <div className="bg-gradient-to-r from-primary/10 to-transparent border-t border-primary/20 p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { v: '×6', l: 'profondeur historique' },
              { v: '−90%', l: 'temps de préparation' },
              { v: '+15', l: 'documents générés' },
              { v: '100%', l: 'conforme M9-6 / GBCP' },
            ].map(k => (
              <div key={k.l} className="text-center">
                <div className="text-3xl lg:text-4xl font-display font-bold text-primary">{k.v}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{k.l}</div>
              </div>
            ))}
          </div>
          <div className="bg-muted/30 px-6 py-2 text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" /> HYPER@LE — module d'analyse financière augmentée pour les EPLE • compatible Op@le, Chorus Pro, GFC/REPROFI
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
