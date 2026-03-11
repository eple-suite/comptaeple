// ═══════════════════════════════════════════════════════════════
// FDR Pro 2026 — Tableau de suivi des prélèvements (DBM)
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/mockData';
import type { Prelevement } from './types';

interface Props {
  prelevements: Prelevement[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Prelevement, value: any) => void;
  onDelete: (id: string) => void;
}

export function TableauPrelevements({ prelevements, onAdd, onUpdate, onDelete }: Props) {
  const totalVote = prelevements.reduce((a, p) => a + p.montantVote, 0);
  const totalExecute = prelevements.reduce((a, p) => a + p.montantExecute, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Suivi des prélèvements (DBM)</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Historique des décisions budgétaires modificatives</p>
          </div>
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {prelevements.length === 0 ? (
          <div className="p-10 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun prélèvement enregistré</p>
            <Button variant="ghost" size="sm" onClick={onAdd} className="mt-3 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Ajouter un prélèvement
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">Date CA</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">N° DBM</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">Objet</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide">Voté</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide">Exécuté</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prelevements.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Input value={p.dateCA} onChange={(e) => onUpdate(p.id, 'dateCA', e.target.value)}
                        className="h-7 text-xs w-24" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input value={p.numeroDBM} onChange={(e) => onUpdate(p.id, 'numeroDBM', e.target.value)}
                        className="h-7 text-xs font-mono w-24" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input value={p.objet} onChange={(e) => onUpdate(p.id, 'objet', e.target.value)}
                        className="h-7 text-xs" placeholder="Objet du prélèvement" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input type="number" value={p.montantVote}
                        onChange={(e) => onUpdate(p.id, 'montantVote', Number(e.target.value))}
                        className="h-7 text-xs font-mono text-right w-24" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input type="number" value={p.montantExecute}
                        onChange={(e) => onUpdate(p.id, 'montantExecute', Number(e.target.value))}
                        className="h-7 text-xs font-mono text-right w-24" />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge variant={p.statut === 'execute' ? 'default' : p.statut === 'en_cours' ? 'secondary' : 'outline'}
                        className="text-[10px] cursor-pointer"
                        onClick={() => {
                          const next = p.statut === 'vote' ? 'en_cours' : p.statut === 'en_cours' ? 'execute' : 'vote';
                          onUpdate(p.id, 'statut', next);
                        }}>
                        {p.statut === 'execute' ? 'Exécuté' : p.statut === 'en_cours' ? 'En cours' : 'Voté'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3} className="px-4 py-2.5 text-muted-foreground">TOTAL</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(totalVote)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-success">{formatCurrency(totalExecute)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
