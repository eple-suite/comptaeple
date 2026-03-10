// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Diaporama Conseil d'Administration
// Présentation du compte financier aux instances
// Conformité : M9-6 2026 · Décret 2012-1246
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import { EmptyState } from './SharedComponents';

export function DiaporamaSection() {
  const etab = useCofiepleStore(s => s.etablissement);
  const resultats = useCofiepleStore(s => s.resultats);
  const activeBudget = useCofiepleStore(s => s.activeBudget);
  const R = resultats[activeBudget];
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!R) return <EmptyState msg="Lancez l'analyse pour générer le diaporama du conseil d'administration." />;

  const dateArrete = etab.dateArrete ? new Date(etab.dateArrete).toLocaleDateString('fr-FR') : '—';
  const fdr = R.fdrComptable;
  const treso = R.tresorerieNette;
  const resBudg = R.resultatBudgetaire;

  const slides = [
    // Slide 0 — Couverture
    <div key="0" className="flex flex-col items-center justify-center h-full text-center p-12 bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl">
      <Badge className="bg-warning text-warning-foreground mb-6 text-xs tracking-widest uppercase px-4 py-2">
        Conseil d'Administration · Exercice {etab.exercice}
      </Badge>
      <h1 className="text-white text-4xl font-black mb-4 leading-tight">{etab.nom || '—'}</h1>
      <p className="text-blue-300 text-lg mb-6">Présentation du compte financier — Exercice {etab.exercice}</p>
      <p className="text-slate-400 text-sm leading-loose">
        {etab.regionAcademique} · {etab.academie}<br />
        Ordonnateur : {etab.ordonnateur || '—'}<br />
        Agent comptable : {etab.agentComptable || '—'}<br />
        Arrêté au : {dateArrete}
      </p>
    </div>,

    // Slide 1 — Résultats clés
    <div key="1" className="flex flex-col h-full p-10 bg-slate-900 rounded-xl">
      <div className="text-warning text-xs font-bold uppercase tracking-widest mb-2">01 — Résultats clés</div>
      <h2 className="text-white text-2xl font-black mb-6">Résultats de l'exercice {etab.exercice}</h2>
      <div className="grid grid-cols-3 gap-5 flex-1">
        {[
          { label: 'Résultat budgétaire', value: resBudg, sub: resBudg >= 0 ? 'Excédent' : 'Déficit' },
          { label: 'Charges réalisées', value: R.totalChargesReel, sub: `Taux : ${(R.totalChargesReel / Math.max(R.totalChargesPrev, 1) * 100).toFixed(1)} %` },
          { label: 'Produits encaissés', value: R.totalProduitsReel, sub: `Prév. : ${formatEur(R.totalProduitsPrev)}` },
        ].map((item, i) => (
          <div key={i} className={`rounded-xl p-5 border-t-4 ${i === 0 ? (resBudg >= 0 ? 'bg-emerald-900/40 border-emerald-400' : 'bg-red-900/40 border-red-400') : 'bg-white/5 border-blue-400'}`}>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">{item.label}</div>
            <div className={`text-2xl font-black font-mono mb-1 ${i === 0 ? (resBudg >= 0 ? 'text-emerald-300' : 'text-red-300') : 'text-white'}`}>
              {formatEur(item.value)}
            </div>
            <div className="text-xs text-slate-400">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>,

    // Slide 2 — Santé financière
    <div key="2" className="flex flex-col h-full p-10 bg-slate-900 rounded-xl">
      <div className="text-warning text-xs font-bold uppercase tracking-widest mb-2">02 — Santé financière</div>
      <h2 className="text-white text-2xl font-black mb-6">Situation financière au 31/12/{etab.exercice}</h2>
      <div className="grid grid-cols-3 gap-5 flex-1">
        {[
          { label: 'Fonds de roulement', value: fdr, sub: fdr >= 0 ? 'Ressources permanentes suffisantes' : '⚠️ Ressources insuffisantes', ok: fdr >= 0 },
          { label: 'Besoin en FDR', value: R.bfr, sub: 'Créances - Dettes d\'exploitation', ok: true },
          { label: 'Trésorerie nette', value: treso, sub: 'Disponibilités DFT', ok: treso >= 0 },
        ].map((item, i) => (
          <div key={i} className={`rounded-xl p-5 border-t-4 bg-white/5 ${item.ok ? 'border-emerald-400' : 'border-red-400'}`}>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">{item.label}</div>
            <div className={`text-2xl font-black font-mono mb-1 ${item.ok ? 'text-emerald-300' : 'text-red-300'}`}>{formatEur(item.value)}</div>
            <div className="text-xs text-slate-400">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>,

    // Slide 3 — Services
    <div key="3" className="flex flex-col h-full p-10 bg-slate-900 rounded-xl">
      <div className="text-warning text-xs font-bold uppercase tracking-widest mb-2">03 — Exécution par service</div>
      <h2 className="text-white text-2xl font-black mb-6">Taux d'exécution budgétaire</h2>
      <div className="space-y-4 flex-1">
        {Object.entries(R.parService).map(([svc, d]: [string, any]) => {
          const tx = d.chargesPrev > 0 ? d.chargesReel / d.chargesPrev : 0;
          const color = tx >= 0.9 ? '#10b981' : tx >= 0.7 ? '#f59e0b' : '#ef4444';
          return (
            <div key={svc}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white font-bold text-sm">{svc} — {d.libelle}</span>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span>{formatEur(d.chargesReel)}</span>
                  <span className="font-bold" style={{ color }}>{(tx * 100).toFixed(1)} %</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-full h-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(tx * 100, 100)}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>,

    // Slide 4 — Conclusion
    <div key="4" className="flex flex-col items-center justify-center h-full text-center p-12 bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl">
      <div className="text-5xl mb-5">🏫</div>
      <h2 className="text-white text-3xl font-black mb-3">Merci pour votre attention</h2>
      <p className="text-blue-300 text-base mb-6">{etab.nom} · RNE {etab.uai}</p>
      <div className="text-slate-400 text-sm leading-loose">
        Exercice {etab.exercice} · {etab.academie}<br />
        Ordonnateur : {etab.ordonnateur || '—'}<br />
        Agent comptable : {etab.agentComptable || '—'}
      </div>
    </div>,
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <span className="text-muted-foreground text-sm font-medium">
          Diapositive {currentSlide + 1} / {slides.length}
        </span>
        <Button variant="outline" onClick={() => window.print()} className="ml-auto">
          <Printer className="h-4 w-4 mr-2" /> Imprimer
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden shadow-xl border" style={{ minHeight: 420 }}>
        {slides[currentSlide]}
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Button variant="secondary" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div className="bg-warning h-2 rounded-full transition-all" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
          </div>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-warning' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`} />
            ))}
          </div>
          <Button variant="secondary" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
            Suivant <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
