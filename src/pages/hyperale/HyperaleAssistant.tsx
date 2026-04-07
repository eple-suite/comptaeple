import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useHyperaleData } from './useHyperaleData';

import { Bot, Send, User, Loader2, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Explique la variation du FDR entre cette année et l\'année précédente.',
  'Rédige la partie trésorerie de l\'annexe du COFI.',
  'Quels sont les risques financiers pour cet établissement ?',
  'Compare cet établissement à la moyenne nationale.',
  'Rédige une synthèse financière pour le Conseil d\'Administration.',
];

export default function HyperaleAssistant() {
  const etab = useCofiepleStore(s => s.etablissement);
  const exercice = etab.exercice || new Date().getFullYear() - 1;
  const data = useHyperaleData(exercice);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const buildContext = () => {
    return `Données financières de ${etab.nom || 'l\'établissement'} (UAI: ${etab.uai || 'N/A'}, exercice ${exercice}) :
- Fonds de roulement : ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} jours)
- CAF : ${fmt(data.caf)}
- Trésorerie : ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} jours)
- Réserves : ${fmt(data.reserves)}
- DRFN : ${fmt(data.drfn)}
- Résultat comptable : ${fmt(data.resultatComptable)}
- Taux d'exécution charges : ${data.tauxExecCharges.toFixed(1)} %
- Taux d'exécution produits : ${data.tauxExecProduits.toFixed(1)} %
- TNR : ${data.tnr.toFixed(1)} %
- Moyenne nationale FDR : ${data.moyenneNationale.fdrJours} j, trésorerie : ${data.moyenneNationale.tresorerieJours} j
- Historique FDR : ${data.historique.map(h => `${h.exercice}: ${fmt(h.fdr)}`).join(', ')}
${!data.hasData ? '\n⚠️ Ces données sont simulées (démonstration). Préciser que l\'analyse est indicative.' : ''}`;
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const allMessages = [...messages, userMsg];
    let assistantSoFar = '';

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-eple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `Tu es HYPER@LE, un assistant IA spécialisé dans l'analyse financière des EPLE. Tu réponds toujours en français, de manière pédagogique et précise. Tu utilises les données financières fournies ci-dessous pour tes analyses. Tu ne fais JAMAIS référence à IDÉ@LE. Tu cites les normes M9-6 quand pertinent.\n\n${buildContext()}` },
            ...allMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (resp.status === 429) {
        toast.error('Limite de requêtes atteinte. Réessayez dans quelques instants.');
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error('Crédits IA épuisés. Ajoutez des crédits dans Settings > Workspace > Usage.');
        setLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) {
        // Fallback deterministic
        const fallback = generateFallback(text, data, etab.nom || 'l\'établissement', exercice);
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {}
        }
      }
    } catch {
      const fallback = generateFallback(text, data, etab.nom || 'l\'établissement', exercice);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Assistant IA HYPER@LE</h1>
          <p className="text-xs text-muted-foreground">Posez vos questions sur l'analyse financière de {etab.nom || 'votre établissement'}</p>
        </div>
        {!data.hasData && <Badge className="bg-warning/15 text-warning border-warning/30 ml-auto" variant="outline">Données démo</Badge>}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-3 pt-8">
            <p className="text-center text-sm text-muted-foreground mb-4">
              <Lightbulb className="h-4 w-4 inline mr-1" />
              Questions suggérées
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
              {SUGGESTIONS.map(s => (
                <Button key={s} variant="outline" size="sm" className="text-xs text-left h-auto py-2 px-3 justify-start whitespace-normal" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="p-1.5 rounded-lg bg-primary/10 h-fit shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <Card className={`max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
              <CardContent className="p-3 text-sm">
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{m.content}</p>
                )}
              </CardContent>
            </Card>
            {m.role === 'user' && (
              <div className="p-1.5 rounded-lg bg-muted h-fit shrink-0">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && !assistantSoFar && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Posez votre question sur l'analyse financière…"
          className="min-h-[44px] max-h-[120px] text-sm flex-1 resize-none"
          rows={1}
        />
        <Button onClick={() => send(input)} disabled={!input.trim() || loading} size="icon" className="shrink-0 h-11 w-11">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Deterministic fallback when AI is unavailable
function generateFallback(question: string, data: any, nom: string, exercice: number): string {
  const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const q = question.toLowerCase();

  if (q.includes('fdr') || q.includes('fonds de roulement')) {
    return `## Analyse du Fonds de Roulement\n\nLe FDR de ${nom} s'établit à **${fmt(data.fdr)}** soit **${data.fdrJours.toFixed(1)} jours** de fonctionnement (exercice ${exercice}).\n\n${data.fdrJours >= 30 ? '✅ Ce niveau est supérieur au seuil recommandé de 30 jours.' : '⚠️ Ce niveau est inférieur au seuil recommandé de 30 jours.'}\n\nLa moyenne nationale est de ${data.moyenneNationale.fdrJours} jours.`;
  }
  if (q.includes('trésorerie')) {
    return `## Analyse de la Trésorerie\n\nLa trésorerie disponible est de **${fmt(data.tresorerie)}** soit **${data.tresorerieJours.toFixed(1)} jours**.\n\n${data.tresorerieJours >= 15 ? '✅ Niveau satisfaisant.' : '⚠️ Niveau insuffisant (seuil : 15 jours).'}`;
  }
  if (q.includes('risque')) {
    return `## Analyse des risques financiers\n\n${data.fdr < 0 ? '🔴 **FDR négatif** : risque majeur de rupture de trésorerie.\n' : ''}${data.tresorerieJours < 15 ? '🟠 **Trésorerie insuffisante** : risque d\'incident de paiement.\n' : ''}${data.caf < 0 ? '🟠 **CAF négative** : l\'exploitation n\'est pas viable à terme.\n' : ''}${data.fdr >= 0 && data.tresorerieJours >= 15 && data.caf >= 0 ? '✅ Aucun risque majeur identifié.' : ''}`;
  }

  return `## Synthèse financière — ${nom} (${exercice})\n\n| Indicateur | Valeur |\n|---|---|\n| FDR | ${fmt(data.fdr)} (${data.fdrJours.toFixed(1)} j) |\n| CAF | ${fmt(data.caf)} |\n| Trésorerie | ${fmt(data.tresorerie)} (${data.tresorerieJours.toFixed(1)} j) |\n| Réserves | ${fmt(data.reserves)} |\n\n*Mode de secours : l'IA n'est pas disponible actuellement.*`;
}

let assistantSoFar = '';
