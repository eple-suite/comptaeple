/**
 * Panneau d'anomalies M9-6 — branché sur le moteur `analyserBalance`.
 * Charge le référentiel depuis Supabase (fallback embarqué) et affiche
 * les anomalies critiques/majeures/mineures avec actions correctives.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { loadReferentiel } from '@/lib/balance/referentielLoader';
import { analyserBalance, statsAnomalies, type Anomalie } from '@/lib/balance/anomaliesEngine';
import type { BalanceLigne, Periode } from '@/lib/balance/referentielTypes';

interface Props {
  balance: BalanceLigne[];
  periode?: Periode;
}

export function AnomaliesPanelM96({ balance, periode = 'cours' }: Props) {
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const ref = await loadReferentiel();
      setAnomalies(analyserBalance(balance, ref, { periode }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (balance.length > 0) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance.length, periode]);

  const stats = useMemo(() => statsAnomalies(anomalies), [anomalies]);

  const niveauBadge = (n: Anomalie['niveau']) => {
    if (n === 'critique') return <Badge variant="destructive" className="text-[10px]">Critique</Badge>;
    if (n === 'majeure') return <Badge className="text-[10px] bg-warning text-warning-foreground">Majeure</Badge>;
    if (n === 'mineure') return <Badge variant="secondary" className="text-[10px]">Mineure</Badge>;
    return <Badge variant="outline" className="text-[10px]">Info</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Anomalies M9-6 par compte
            <Badge variant="outline" className="ml-2 text-[10px]">
              {periode === 'cloture' ? 'Période de clôture' : 'En cours d\'exercice'}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Score de risque : <strong>{stats.scoreRisque}/100</strong> · {stats.critiques} critiques · {stats.majeures} majeures · {stats.mineures} mineures
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Réanalyser
        </Button>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Aucune anomalie détectée par le moteur M9-6.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Action corrective</TableHead>
                  <TableHead className="text-xs">Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((a, i) => (
                  <TableRow key={`${a.compte}-${a.regle}-${i}`}>
                    <TableCell className="font-mono text-xs">{a.compte}</TableCell>
                    <TableCell className="text-xs">{a.libelle}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{a.solde.toFixed(2)} €</TableCell>
                    <TableCell>{niveauBadge(a.niveau)}</TableCell>
                    <TableCell className="text-xs">{a.action}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{a.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}