import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart3, Shield, Users, TrendingUp, Info } from 'lucide-react';

interface Indicateur {
  cle: string;
  label: string;
  unite: string;
  monEtab: number;
  q1: number;
  mediane: number;
  q3: number;
  meilleur: number;
  sens: 'haut' | 'bas'; // haut = plus c'est haut mieux c'est
}

const INDICS: Indicateur[] = [
  { cle: 'fdr_jours',  label: 'FDR (jours de fonctionnement)', unite: 'j', monEtab: 78, q1: 45, mediane: 65, q3: 95,  meilleur: 130, sens: 'haut' },
  { cle: 'caf_pct',    label: 'CAF / produits',                 unite: '%', monEtab: 6.2, q1: 3.5, mediane: 5.1, q3: 7.4, meilleur: 11.2, sens: 'haut' },
  { cle: 'drfn',       label: 'DRFN (jours de stock)',          unite: 'j', monEtab: 62, q1: 90, mediane: 70, q3: 55,  meilleur: 35,  sens: 'bas' },
  { cle: 'srh_marge',  label: 'Marge SRH',                      unite: '%', monEtab: 3.1, q1: -1.2, mediane: 2.0, q3: 4.5, meilleur: 7.8, sens: 'haut' },
  { cle: 'cout_eleve', label: 'Coût moyen / élève',             unite: '€', monEtab: 432, q1: 510, mediane: 458, q3: 410, meilleur: 380, sens: 'bas' },
];

function quartile(i: Indicateur): { rang: string; couleur: string } {
  const v = i.monEtab;
  const m = i.sens === 'haut'
    ? (v >= i.meilleur ? 'top' : v >= i.q3 ? 'q4' : v >= i.mediane ? 'q3' : v >= i.q1 ? 'q2' : 'q1')
    : (v <= i.meilleur ? 'top' : v <= i.q3 ? 'q4' : v <= i.mediane ? 'q3' : v <= i.q1 ? 'q2' : 'q1');
  const map = {
    top: { rang: '🥇 Top 10 %',  couleur: 'bg-success/15 text-success border-success/30' },
    q4:  { rang: '↑ Quartile haut',couleur: 'bg-success/10 text-success border-success/20' },
    q3:  { rang: '~ Au-dessus médiane', couleur: 'bg-primary/10 text-primary border-primary/20' },
    q2:  { rang: '~ Sous médiane',couleur: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    q1:  { rang: '↓ Quartile bas', couleur: 'bg-destructive/10 text-destructive border-destructive/20' },
  } as const;
  return map[m];
}

export default function HyperaleBenchmark() {
  const [optin, setOptin] = useState(true);
  const [profil, setProfil] = useState<'taille' | 'type' | 'academie'>('type');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-5"
      >
        <Badge className="mb-2 bg-primary/15 text-primary border-primary/30">Benchmark anonymisé inter-EPLE</Badge>
        <h2 className="text-xl font-display font-bold tracking-tight">Comparez votre établissement à des EPLE similaires</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Données strictement anonymisées (pas de nom, pas d'UAI), agrégées par taille, type et académie. Participation libre et révocable.
        </p>
      </motion.div>

      <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <strong>Confidentialité garantie.</strong> Aucune donnée nominative ni UAI n'est transmise. L'agrégation
            s'effectue sur ≥ 5 EPLE pour empêcher toute ré-identification (k-anonymity = 5). Conforme RGPD et
            doctrine académique.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="optin" className="text-xs">Participation</Label>
            <Switch id="optin" checked={optin} onCheckedChange={setOptin} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comparer à :</span>
        {[
          { id: 'type', label: 'Même type (lycée polyvalent)' },
          { id: 'taille', label: 'Même taille (1200-1500 élèves)' },
          { id: 'academie', label: 'Même académie' },
        ].map(p => (
          <Button
            key={p.id}
            variant={profil === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setProfil(p.id as any)}
          >
            {p.label}
          </Button>
        ))}
        <Badge variant="outline" className="ml-auto"><Users className="h-3 w-3 mr-1" />147 EPLE dans le panel</Badge>
      </div>

      <div className="grid gap-3">
        {INDICS.map((ind, i) => {
          const q = quartile(ind);
          // position relative pour la barre (0-100)
          const min = Math.min(ind.q1, ind.q3, ind.meilleur, ind.monEtab);
          const max = Math.max(ind.q1, ind.q3, ind.meilleur, ind.monEtab);
          const norm = (v: number) => ((v - min) / (max - min || 1)) * 100;
          return (
            <motion.div key={ind.cle} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{ind.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Médiane panel : {ind.mediane}{ind.unite} · Top 10 % : {ind.meilleur}{ind.unite}
                      </div>
                    </div>
                    <Badge className={`border ${q.couleur}`}>{q.rang}</Badge>
                  </div>

                  <div className="relative h-8 rounded-lg bg-muted/40 overflow-hidden">
                    {/* bande inter-quartile */}
                    <div
                      className="absolute h-full bg-primary/15 border-l border-r border-primary/30"
                      style={{ left: `${Math.min(norm(ind.q1), norm(ind.q3))}%`, width: `${Math.abs(norm(ind.q3) - norm(ind.q1))}%` }}
                    />
                    {/* médiane */}
                    <div className="absolute top-0 bottom-0 w-px bg-primary/60" style={{ left: `${norm(ind.mediane)}%` }} />
                    {/* mon étab */}
                    <div
                      className="absolute -top-1 -bottom-1 w-1 rounded-full bg-foreground shadow-lg"
                      style={{ left: `calc(${norm(ind.monEtab)}% - 2px)` }}
                      title={`Mon EPLE : ${ind.monEtab}${ind.unite}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{min}{ind.unite}</span>
                    <span className="font-bold text-foreground">Mon EPLE : {ind.monEtab}{ind.unite}</span>
                    <span>{max}{ind.unite}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Lecture rectorat</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Le benchmark anonymisé permet aux rectorats d'identifier sans nommer les EPLE en difficulté
            <strong> structurelle</strong> (≥ 3 indicateurs en quartile bas) et de cibler l'accompagnement
            (formation, audit, mission d'inspection).
          </p>
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/30">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Les données affichées ici sont des données de démonstration. En production, l'agrégation est
            calculée côté serveur après opt-in explicite de l'EPLE et seuil de k-anonymity ≥ 5.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
