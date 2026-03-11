// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Structure du bilan fonctionnel (visualisation)
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, PiggyBank, Wallet, CreditCard } from 'lucide-react';
import type { DonneesFinancieres, ResultatAnalyse } from './types';

const fmt = (v: number) => `${(v / 1000).toFixed(0)} k€`;

export function StructureBilan({ donnees, analyse }: { donnees: DonneesFinancieres; analyse: ResultatAnalyse }) {
  const capitauxPermanents =
    donnees.dotationsReserves + donnees.reportANouveau + donnees.resultatExercice +
    donnees.subventionsInvestissement + donnees.provisionsRisques + donnees.emprunts;

  const actifCirculant = donnees.stocks + donnees.creancesClients + donnees.autresCreances + donnees.disponibilites;
  const passifCirculant = donnees.dettesFournisseurs + donnees.autresDettes + donnees.produitsConstatesAvance;

  const totalActif = donnees.immobilisationsNettes + actifCirculant;
  const totalPassif = capitauxPermanents + passifCirculant;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Structure du bilan fonctionnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* ACTIF */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actif</p>
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-3 text-white relative overflow-hidden"
              style={{ minHeight: `${Math.max((donnees.immobilisationsNettes / totalActif) * 160, 50)}px` }}>
              <p className="text-[10px] opacity-75">Emplois stables</p>
              <p className="text-base font-bold">{fmt(donnees.immobilisationsNettes)}</p>
              <Building2 className="absolute right-2 bottom-2 opacity-20" size={32} />
            </div>
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-3 text-white relative overflow-hidden"
              style={{ minHeight: `${Math.max((actifCirculant / totalActif) * 160, 60)}px` }}>
              <p className="text-[10px] opacity-75">Actif circulant</p>
              <p className="text-base font-bold">{fmt(actifCirculant)}</p>
              <div className="text-[9px] opacity-75 mt-1 space-y-0.5">
                <p>Stocks : {fmt(donnees.stocks)}</p>
                <p>Créances : {fmt(donnees.creancesClients + donnees.autresCreances)}</p>
                <p>Disponibilités : {fmt(donnees.disponibilites)}</p>
              </div>
              <Wallet className="absolute right-2 bottom-2 opacity-20" size={32} />
            </div>
          </div>
          {/* PASSIF */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passif</p>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-3 text-white relative overflow-hidden"
              style={{ minHeight: `${Math.max((capitauxPermanents / totalPassif) * 160, 60)}px` }}>
              <p className="text-[10px] opacity-75">Ressources stables</p>
              <p className="text-base font-bold">{fmt(capitauxPermanents)}</p>
              <div className="text-[9px] opacity-75 mt-1 space-y-0.5">
                <p>Fonds propres : {fmt(donnees.dotationsReserves + donnees.reportANouveau + donnees.resultatExercice)}</p>
                <p>Subv. inv. : {fmt(donnees.subventionsInvestissement)}</p>
              </div>
              <PiggyBank className="absolute right-2 bottom-2 opacity-20" size={32} />
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 text-white relative overflow-hidden"
              style={{ minHeight: `${Math.max((passifCirculant / totalPassif) * 160, 50)}px` }}>
              <p className="text-[10px] opacity-75">Passif circulant</p>
              <p className="text-base font-bold">{fmt(passifCirculant)}</p>
              <CreditCard className="absolute right-2 bottom-2 opacity-20" size={32} />
            </div>
          </div>
        </div>
        {/* Indicateurs sous le graphique */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Fonds de roulement</p>
            <p className={`text-lg font-bold ${analyse.fondsRoulement >= 0 ? 'text-success' : 'text-destructive'}`}>
              {fmt(analyse.fondsRoulement)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Besoin en FR</p>
            <p className="text-lg font-bold text-warning">{fmt(analyse.besoinFondsRoulement)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Trésorerie nette</p>
            <p className={`text-lg font-bold ${analyse.tresorerieNette >= 0 ? 'text-success' : 'text-destructive'}`}>
              {fmt(analyse.tresorerieNette)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
