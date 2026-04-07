import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useHyperaleData } from './useHyperaleData';
import { Plus, Trash2, Copy, Check, Bot, CalendarDays, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  source: 'manual' | 'auto';
  category: 'fdr' | 'tresorerie' | 'caf' | 'general';
}

const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const CAT_COLORS: Record<string, string> = {
  fdr: 'bg-primary/15 text-primary',
  tresorerie: 'bg-warning/15 text-warning',
  caf: 'bg-secondary/15 text-secondary',
  general: 'bg-muted text-muted-foreground',
};
const CAT_LABELS: Record<string, string> = { fdr: 'FDR', tresorerie: 'Trésorerie', caf: 'CAF', general: 'Général' };

export default function HyperaleJournal() {
  const etab = useCofiepleStore(s => s.etablissement);
  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const storageKey = `hyperale_journal_${etab.uai || 'demo'}_${exercice}`;
  const [entries, setEntries] = usePersistedState<JournalEntry[]>(storageKey, []);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<JournalEntry['category']>('general');
  const [copied, setCopied] = useState(false);

  const generateAutoEntries = useCallback(() => {
    const auto: JournalEntry[] = [];
    const now = new Date().toISOString().slice(0, 10);
    if (data.fdrJours < 30) {
      auto.push({ id: `auto_fdr_${Date.now()}`, date: now, text: `Le FDR ne couvre que ${data.fdrJours.toFixed(1)} jours — sous le seuil recommandé de 30 jours.`, source: 'auto', category: 'fdr' });
    }
    if (data.tresorerieJours < 15) {
      auto.push({ id: `auto_tres_${Date.now() + 1}`, date: now, text: `La trésorerie ne couvre que ${data.tresorerieJours.toFixed(1)} jours — sous le seuil critique de 15 jours.`, source: 'auto', category: 'tresorerie' });
    }
    if (data.caf < 0) {
      auto.push({ id: `auto_caf_${Date.now() + 2}`, date: now, text: `La CAF est négative (${fmt(data.caf)}) — l'exploitation ne dégage pas de ressources suffisantes.`, source: 'auto', category: 'caf' });
    }
    if (data.resultatComptable < -5000) {
      auto.push({ id: `auto_res_${Date.now() + 3}`, date: now, text: `Le résultat comptable est fortement déficitaire (${fmt(data.resultatComptable)}).`, source: 'auto', category: 'general' });
    }
    if (auto.length === 0) {
      auto.push({ id: `auto_ok_${Date.now()}`, date: now, text: 'Aucune anomalie détectée. Les indicateurs financiers sont dans les normes.', source: 'auto', category: 'general' });
    }
    setEntries(prev => [...auto, ...prev]);
    toast.success(`${auto.length} événement(s) détecté(s)`);
  }, [data, setEntries]);

  const addEntry = () => {
    if (!newText.trim()) return;
    const entry: JournalEntry = {
      id: `m_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      text: newText.trim(),
      source: 'manual',
      category: newCategory,
    };
    setEntries(prev => [entry, ...prev]);
    setNewText('');
    toast.success('Événement ajouté');
  };

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  const generateCofiText = () => {
    if (entries.length === 0) return 'Aucun événement à exporter.';
    const lines = entries.map(e => `• ${e.date} — [${CAT_LABELS[e.category]}] ${e.text}`);
    return `JOURNAL DES ÉVÉNEMENTS FINANCIERS\n${etab.nom || 'Établissement'} — Exercice ${exercice}\n\n${lines.join('\n\n')}`;
  };

  const copyCofi = () => {
    navigator.clipboard.writeText(generateCofiText());
    setCopied(true);
    toast.success('Texte copié pour l\'annexe du COFI');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Data Journal augmenté
          </h2>
          <p className="text-sm text-muted-foreground">{etab.nom || 'Établissement'} — Exercice {exercice}</p>
        </div>
      </div>

      {/* Bloc 1 : Ajout manuel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Ajouter un événement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={newCategory} onValueChange={v => setNewCategory(v as JournalEntry['category'])}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="fdr">FDR</SelectItem>
                <SelectItem value="tresorerie">Trésorerie</SelectItem>
                <SelectItem value="caf">CAF</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Décrivez un événement financier significatif…"
              className="min-h-[60px] text-sm flex-1"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={addEntry} disabled={!newText.trim()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Ajouter l'événement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bloc 2 : Génération automatique */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Génération automatique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Détecte automatiquement les variations inhabituelles et les ruptures de tendance à partir des données financières.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={generateAutoEntries} className="gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5" /> Détecter les anomalies
            </Button>
            <Button variant="outline" size="sm" onClick={copyCofi} className="gap-1.5 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copié' : 'Générer texte COFI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bloc 3 : Liste chronologique */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Événements ({entries.length})
        </h3>
        <div className="space-y-2">
          {entries.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Aucun événement enregistré.<br />
                Ajoutez manuellement ou cliquez sur « Détecter les anomalies ».
              </CardContent>
            </Card>
          )}
          {entries.map(entry => (
            <Card key={entry.id} className="group">
              <CardContent className="p-3 flex items-start gap-3">
                <div className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">{entry.date}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="outline" className={`text-[10px] ${CAT_COLORS[entry.category]}`}>
                      {CAT_LABELS[entry.category]}
                    </Badge>
                    {entry.source === 'auto' && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                        <Bot className="h-2.5 w-2.5 mr-0.5" />Auto
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
