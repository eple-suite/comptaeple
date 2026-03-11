// ═══════════════════════════════════════════════════════════════
// COFIEPLE — Journal des Imports (Audit Log)
// Lecture seule — traçabilité pour contrôles extérieurs
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { FileText, Download, ShieldCheck, ShieldAlert, Clock, RefreshCw, Loader2 } from 'lucide-react';

interface ImportLog {
  id: string;
  uai: string;
  opale_number: string;
  exercice: number;
  file_name: string;
  file_type: string;
  budget_type: string;
  rows_count: number;
  result: string;
  reject_reason: string | null;
  file_uai_detected: string | null;
  file_opale_detected: string | null;
  file_exercice_detected: number | null;
  file_type_detected: string | null;
  created_at: string;
}

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: 'Validé', color: 'bg-emerald-600 text-white' },
  blocked_opale: { label: 'Bloqué — Op@le', color: 'bg-destructive text-destructive-foreground' },
  blocked_exercice: { label: 'Bloqué — Exercice', color: 'bg-destructive text-destructive-foreground' },
  blocked_colonnes: { label: 'Bloqué — Colonnes', color: 'bg-destructive text-destructive-foreground' },
  error: { label: 'Erreur', color: 'bg-warning text-warning-foreground' },
};

const TYPE_LABELS: Record<string, string> = {
  sde: 'SDE', sde1: 'SDE N-1', sdr: 'SDR', sdr1: 'SDR N-1', bal: 'Balance', bal1: 'Balance N-1',
};

export function ImportHistorySection() {
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  const exercice = useCofiepleStore(s => s.etablissement.exercice);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!user || !selectedEstablishment) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cofieple_import_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('uai', selectedEstablishment.uai)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setLogs(data as ImportLog[]);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [user?.id, selectedEstablishment?.uai]);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date/Heure', 'Fichier', 'Type', 'Budget', 'UAI', 'Op@le', 'Exercice', 'Lignes', 'Résultat', 'Motif rejet', 'UAI détecté', 'Op@le détecté', 'Exercice détecté'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString('fr-FR'),
      l.file_name, TYPE_LABELS[l.file_type] || l.file_type, l.budget_type,
      l.uai, l.opale_number, l.exercice,
      l.rows_count, RESULT_LABELS[l.result]?.label || l.result,
      l.reject_reason || '', l.file_uai_detected || '', l.file_opale_detected || '',
      l.file_exercice_detected ?? '',
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_imports_${selectedEstablishment?.uai || 'all'}_${exercice}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = logs.filter(l => l.result === 'success').length;
  const blockedCount = logs.filter(l => l.result.startsWith('blocked')).length;

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong>Journal des imports — Audit Log</strong> — Ce registre est en <strong>lecture seule</strong> et
            consigne chaque tentative d\u2019importation. Il constitue la preuve que les données n\u2019ont pas été
            manipulées manuellement. Exportez-le pour le joindre à vos dossiers de clôture.
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{logs.length} entrée{logs.length > 1 ? 's' : ''}</Badge>
          {successCount > 0 && <Badge className="bg-emerald-600 text-white text-xs">{successCount} validé{successCount > 1 ? 's' : ''}</Badge>}
          {blockedCount > 0 && <Badge className="bg-destructive text-destructive-foreground text-xs">{blockedCount} bloqué{blockedCount > 1 ? 's' : ''}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={logs.length === 0}>
            <Download className="h-3 w-3 mr-1" />
            Télécharger le log (CSV)
          </Button>
        </div>
      </div>

      {!selectedEstablishment ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
          Sélectionnez un établissement pour consulter le journal des imports.
        </CardContent></Card>
      ) : logs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
          {loading ? 'Chargement…' : 'Aucun import enregistré pour cet établissement.'}
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg py-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique des importations
              <span className="ml-auto text-slate-400 text-xs font-normal">
                Établissement {selectedEstablishment.uai} · Exercice {exercice}
              </span>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="max-h-[500px]">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-semibold">Date/Heure</th>
                    <th className="text-left p-2 font-semibold">Fichier</th>
                    <th className="text-left p-2 font-semibold">Type</th>
                    <th className="text-center p-2 font-semibold">Lignes</th>
                    <th className="text-center p-2 font-semibold">Résultat</th>
                    <th className="text-left p-2 font-semibold">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => {
                    const r = RESULT_LABELS[log.result] || { label: log.result, color: 'bg-muted' };
                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2 text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-2 font-mono max-w-[200px] truncate" title={log.file_name}>{log.file_name}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">{TYPE_LABELS[log.file_type] || log.file_type}</Badge>
                        </td>
                        <td className="p-2 text-center">{log.rows_count}</td>
                        <td className="p-2 text-center">
                          <Badge className={`text-xs ${r.color}`}>
                            {log.result === 'success' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                            {r.label}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground max-w-[300px] truncate" title={log.reject_reason || ''}>
                          {log.reject_reason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
