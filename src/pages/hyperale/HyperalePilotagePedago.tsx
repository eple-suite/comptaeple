import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plane, Beaker, Users, AlertTriangle, TrendingDown, TrendingUp, BookOpen } from 'lucide-react';

interface Projet { nom: string; type: string; cout: number; eleves: number; coutEleve: number; statut: 'ok' | 'attention' | 'alerte'; }

const PROJETS: Projet[] = [
  { nom: 'Voyage Espagne — 2nde',   type: 'Voyage scolaire',  cout: 12200, eleves: 32, coutEleve: 381, statut: 'ok' },
  { nom: 'Section européenne',       type: 'Pédagogique',      cout: 8400,  eleves: 48, coutEleve: 175, statut: 'ok' },
  { nom: 'Olympiades de chimie',     type: 'Concours',         cout: 2100,  eleves: 12, coutEleve: 175, statut: 'ok' },
  { nom: 'Atelier théâtre',          type: 'Pédagogique',      cout: 5800,  eleves: 18, coutEleve: 322, statut: 'attention' },
  { nom: 'Voyage Royaume-Uni — 3e',  type: 'Voyage scolaire',  cout: 18900, eleves: 28, coutEleve: 675, statut: 'alerte' },
  { nom: 'Sortie musée Orsay',       type: 'Sortie',           cout: 950,   eleves: 35, coutEleve: 27,  statut: 'ok' },
];

const DISCIPLINES = [
  { nom: 'Sciences (SVT, Phys-Chimie)', dotation: 12500, conso: 11200, pct: 90 },
  { nom: 'Lettres & langues',           dotation: 8400,  conso: 6100,  pct: 73 },
  { nom: 'Mathématiques',               dotation: 4200,  conso: 1800,  pct: 43 },
  { nom: 'EPS',                         dotation: 7800,  conso: 7900,  pct: 101 },
  { nom: 'Arts',                        dotation: 3200,  conso: 2400,  pct: 75 },
  { nom: 'Technologie',                 dotation: 9500,  conso: 5200,  pct: 55 },
];

function statutBadge(s: Projet['statut']) {
  if (s === 'ok') return <Badge className="bg-success/15 text-success border-success/30 border">Conforme</Badge>;
  if (s === 'attention') return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 border">À surveiller</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/30 border">Coût atypique</Badge>;
}

export default function HyperalePilotagePedago() {
  const navigate = useNavigate();
  const totalProjets = PROJETS.reduce((s, p) => s + p.cout, 0);
  const totalEleves = 1284;
  const coutMoyen = Math.round(totalProjets / PROJETS.reduce((s, p) => s + p.eleves, 0));

  const preparerDBM = () => {
    const sousConso = DISCIPLINES.filter(d => d.pct < 60);
    const reaffectable = sousConso.reduce((s, d) => s + (d.dotation - d.conso), 0);
    toast.success('DBM préparée', {
      description: `${sousConso.length} discipline(s) sous-consommée(s) — ${reaffectable.toLocaleString('fr-FR')} € réaffectables. Ouverture de l'exécution budgétaire…`,
    });
    navigate('/execution-budgetaire');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-5"
      >
        <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Pilotage pédagogique</Badge>
        <h2 className="text-xl font-display font-bold tracking-tight">Le lien que Ide@le n'établit pas : dépenses ↔ pédagogie</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque euro est rattaché à un élève, un projet, une discipline. Vous voyez immédiatement où va l'argent et ce qu'il finance.
        </p>
      </motion.div>

      {/* KPI globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { v: '432 €',  l: 'Coût moyen / élève',   d: 'Vie scolaire + projets', icon: GraduationCap },
          { v: `${coutMoyen} €`, l: 'Coût moyen / projet-élève', d: `${PROJETS.length} projets actifs`, icon: BookOpen },
          { v: '12',     l: 'Projets pédagogiques', d: '8 financés sur fonds propres', icon: Beaker },
          { v: '4',      l: 'Voyages scolaires',    d: '1 en alerte coût/élève', icon: Plane },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-4">
                  <Icon className="h-4 w-4 text-primary mb-2" />
                  <div className="text-2xl font-display font-bold text-primary">{k.v}</div>
                  <div className="text-xs font-semibold text-foreground mt-1">{k.l}</div>
                  <div className="text-[11px] text-muted-foreground">{k.d}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Projets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Beaker className="h-4 w-4 text-primary" /> Coût par projet pédagogique</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projet</th>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coût total</th>
                <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Élèves</th>
                <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">€ / élève</th>
                <th className="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {PROJETS.map((p, i) => (
                <tr key={p.nom} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/15'}>
                  <td className="px-4 py-2 font-semibold">{p.nom}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{p.type}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.cout.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.eleves}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold">{p.coutEleve} €</td>
                  <td className="px-4 py-2 text-center">{statutBadge(p.statut)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t border-border font-semibold">
              <tr>
                <td className="px-4 py-2" colSpan={2}>Total</td>
                <td className="px-4 py-2 text-right tabular-nums">{totalProjets.toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-2 text-right tabular-nums">{PROJETS.reduce((s, p) => s + p.eleves, 0)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{coutMoyen} €</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Disciplines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Consommation des crédits par discipline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DISCIPLINES.map(d => {
            const couleur = d.pct > 100 ? 'bg-destructive' : d.pct > 85 ? 'bg-success' : d.pct > 60 ? 'bg-primary' : 'bg-amber-500';
            const Icon = d.pct > 100 ? AlertTriangle : d.pct > 85 ? TrendingUp : TrendingDown;
            const couleurIcon = d.pct > 100 ? 'text-destructive' : d.pct > 85 ? 'text-success' : d.pct > 60 ? 'text-primary' : 'text-amber-500';
            return (
              <div key={d.nom}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-semibold flex items-center gap-2"><Icon className={`h-3.5 w-3.5 ${couleurIcon}`} /> {d.nom}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {d.conso.toLocaleString('fr-FR')} € / {d.dotation.toLocaleString('fr-FR')} € · <strong className="text-foreground">{d.pct} %</strong>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${couleur}`} style={{ width: `${Math.min(d.pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 flex items-start gap-3">
          <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <strong>Lecture chef d'établissement.</strong> 2 disciplines (Maths, Technologie) sous-consomment leurs
            crédits (&lt; 60 %). Une réaffectation au prochain CA permettrait de financer 2 projets pédagogiques
            supplémentaires (≈ 6 000 €).
          </div>
          <Button size="sm" onClick={preparerDBM}>Préparer la DBM</Button>
        </CardContent>
      </Card>
    </div>
  );
}
