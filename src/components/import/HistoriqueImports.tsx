// ═══════════════════════════════════════════════════════════════
// Historique des imports (versioning, restauration)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, History, RefreshCw, Loader2, Archive } from 'lucide-react';
import { listHistorique, getArchivedFileUrl, type HistoriqueRow } from '@/lib/import/importService';
import { IMPORT_TYPE_LABELS } from '@/lib/import';
import { useToast } from '@/hooks/use-toast';

interface Props {
  establishmentId: string | null;
}

const STATUT_BADGE: Record<HistoriqueRow['statut'], { label: string; className: string }> = {
  succes: { label: 'Actif', className: 'bg-emerald-600 text-white' },
  ecrase: { label: 'Écrasé', className: 'bg-muted text-muted-foreground' },
  echec: { label: 'Échec', className: 'bg-destructive text-destructive-foreground' },
};

export function HistoriqueImports({ establishmentId }: Props) {
  const [rows, setRows] = useState<HistoriqueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    if (!establishmentId) return;
    setLoading(true);
    try {
      const data = await listHistorique(establishmentId, { limit: 50 });
      setRows(data);
    } catch (err) {
      toast({
        title: 'Erreur de chargement',
        description: err instanceof Error ? err.message : 'Impossible de charger l\'historique.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [establishmentId]);

  const handleDownload = async (path: string, filename: string) => {
    const url = await getArchivedFileUrl(path);
    if (!url) {
      toast({ title: 'Indisponible', description: 'Le fichier archivé n\'a pu être récupéré.', variant: 'destructive' });
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (!establishmentId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Sélectionnez un établissement pour consulter l'historique des imports.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Historique des imports
        </CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Actualiser
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            {loading ? 'Chargement…' : 'Aucun import archivé pour cet établissement.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Fichier</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Période</th>
                  <th className="text-center p-2">Statut</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const badge = STATUT_BADGE[r.statut];
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground whitespace-nowrap">
                        {new Date(r.date_import).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-2 font-mono max-w-[220px] truncate" title={r.filename}>{r.filename}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-[10px]">
                          {IMPORT_TYPE_LABELS[r.type_import] ?? r.type_import}
                        </Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {r.periode_debut ?? '—'}
                        {r.periode_fin && r.periode_fin !== r.periode_debut ? ` → ${r.periode_fin}` : ''}
                      </td>
                      <td className="p-2 text-center">
                        <Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                      </td>
                      <td className="p-2 text-right">
                        {r.fichier_original_path ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleDownload(r.fichier_original_path!, r.filename)}
                          >
                            <Download className="h-3 w-3 mr-1" /> Original
                          </Button>
                        ) : (
                          <span className="text-muted-foreground inline-flex items-center gap-1">
                            <Archive className="h-3 w-3" /> non archivé
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}