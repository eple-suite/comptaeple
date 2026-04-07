import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useHyperaleData } from './useHyperaleData';
import { Plus, Trash2, Copy, Check, Bot, CalendarDays, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  source: 'manual' | 'auto';
  category: 'fdr' | 'tresorerie' | 'caf' | 'general';
}

export default function HyperaleJournal() {
  const etab = useCofiepleStore(s => s.etablissement);
  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const storageKey = `hyperale_journal_${etab.uai || 'demo'}_${exercice}`;
  const [entries, setEntries] = usePersistedState<JournalEntry[]>(storageKey, []);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<JournalEntry['category']>('general');
  const [copied, setCopied] = useState(false);

  // Generate auto entries from data on first load
  const generateAutoEntries = useCallback(() => {
    const auto: JournalEntry[] = [];
    const now = new Date().toISOString().slice(0, 10);
    if (data.fdrJours < 30) {
      auto.push({ id: `auto_fdr_${Date.now()}`, date: now, text: `Le FDR ne couvre que ${data.fdrJours.toFixed(1)} jours — sous le seuil de 30 jours.`, source: 'auto', category: 'fdr' });
    }
    if (data.tresorerieJours < 15) {
      auto.push({ id: `auto_tres_${Date.now()}`, date: now, text: `La trésorerie ne couvre que ${data.tresorerieJours.toFixed(1)} jours — sous le seuil critique de 15 jours.`, source: 'auto', category: 'tresorerie' });
    }
    if (data.caf < 0) {
      auto.push({ id: `auto_caf_${Date.now()}`, date: now, text: `La CAF est négative (${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.caf)}) — l'exploitation ne dégage pas de ressources.`, source: 'auto', category: 'caf' });
    }
    if (auto.length === 0) {
      auto.push({ id: `auto_ok_${Date.now()}`, date: now, text: 'Aucune anomalie détectée. Les indicateurs financiers sont dans les normes.', source: 'auto', category: 'general' });
    }
    setEntries(prev => [...auto, ...prev]);
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
    toast.success('Entrée ajoutée');
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const generateAnnexeText = () => {
    const lines = entries.map(e => `${e.date} — ${e.text}`);
    return `JOURNAL DES ÉVÉNEMENTS FINANCIERS — ${etab.nom || 'Établissement'}\nExercice ${exercice}\n\n${lines.join('\n\n')}`;
  };

  const copyAnnexe = () => {
    navigator.clipboard.writeText(generateAnnexeText());
    setCopied(true);
    toast.success('Texte copié pour l\'annexe');
    setTimeout(() => setCopied(false), 2000);
  };

  const catColors: Record<string, string> = {
    fdr: 'bg-primary/15 text-primary',
    tresorerie: 'bg-warning/15 text-warning',
    caf: 'bg-secondary/15 text-secondary',
    general: 'bg-muted text-muted-foreground',
  };
  const catLabels: Record<string, string> = {
    fdr: 'FDR', tresorerie: 'Trésorerie', caf: 'CAF', general: 'Général',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Data Journal augmenté
          </h1>
          <p className="text-sm text-muted-foreground">Exercice {exercice} — {etab.nom || 'Établissement'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateAutoEntries} className="gap-1.5 text-xs">
            <Bot className="h-3.5 w-3.5" /> Détection IA
          </Button>
          <Button variant="outline" size="sm" onClick={copyAnnexe} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copié' : 'Export annexe'}
          </Button>
        </div>
      </div>

      {/* Add entry */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as JournalEntry['category'])}
              className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium"
            >
              <option value="general">Général</option>
              <option value="fdr">FDR</option>
              <option value="tresorerie">Trésorerie</option>
              <option value="caf">CAF</option>
            </select>
            <Textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Ajouter un événement financier significatif…"
              className="min-h-[60px] text-sm flex-1"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={addEntry} disabled={!newText.trim()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries list */}
      <div className="space-y-2">
        {entries.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Aucun événement enregistré. Cliquez sur « Détection IA » pour générer des entrées automatiques.
            </CardContent>
          </Card>
        )}
        {entries.map(entry => (
          <Card key={entry.id} className="group">
            <CardContent className="p-3 flex items-start gap-3">
              <div className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">{entry.date}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-[10px] ${catColors[entry.category]}`}>{catLabels[entry.category]}</Badge>
                  {entry.source === 'auto' && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary"><Bot className="h-2.5 w-2.5 mr-0.5" />Auto</Badge>}
                </div>
                <p className="text-sm leading-relaxed">{entry.text}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEntry(entry.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
