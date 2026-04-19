import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { useHyperaleData } from './useHyperaleData';
import { analyser, buildAssistantContext } from '@/lib/hyperaleAnalyseEngine';
import { Bot, Send, User, Loader2, Lightbulb, Database, BarChart3 } from 'lucide-react';
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
  const nom = etab.nom || 'l\'établissement';
  const analyse = useMemo(() => analyser({ nom, exercice, data }), [nom, exercice, data]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const contextStr = useMemo(() => buildAssistantContext(nom, exercice, data, analyse), [nom, exercice, data, analyse]);

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
            { role: 'system', content: `Tu es un expert en comptabilité publique des EPLE. Tu appliques strictement le décret n°2012-1246 (GBCP), le code de l'éducation, le code de la commande publique, l'instruction M9-6 et l'ordonnance n°2022-408. Tu maîtrises Op@le (plan comptable 6 chiffres, logique services/domaines/activités). Tu raisonnes comme un agent comptable responsable garant de la régularité, sincérité et qualité comptable. Tu expliques toujours ton raisonnement.\n\nDans ce contexte précis, tu es HYPER@LE, un assistant IA d'analyse financière des EPLE. Tu réponds en français, de manière pédagogique. Tu utilises les données financières ci-dessous. Tu ne fais JAMAIS référence à IDÉ@LE. Tes réponses sont adaptées à un assistant comptable débutant.\n\n${contextStr}` },
            ...allMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (resp.status === 429) { toast.error('Limite de requêtes atteinte. Réessayez dans quelques instants.'); setLoading(false); return; }
      if (resp.status === 402) { toast.error('Crédits IA épuisés.'); setLoading(false); return; }

      if (!resp.ok || !resp.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: generateFallback(text, analyse, nom, exercice) }]);
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
          if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
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
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: generateFallback(text, analyse, nom, exercice) }]);
    }
    setLoading(false);
  };

  const analyzeData = () => {
    send('Analyse les indicateurs financiers de l\'établissement sélectionné et donne des recommandations.');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">Assistant IA</h2>
          <p className="text-xs text-muted-foreground">Posez vos questions sur l'analyse financière de {nom}</p>
        </div>
        <div className="flex items-center gap-2">
          {!data.hasData && <Badge className="bg-warning/15 text-warning border-warning/30" variant="outline">Données démo</Badge>}
          <Badge variant="outline" className="text-[10px] gap-1"><Database className="h-3 w-3" /> {exercice}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-4 pt-6">
            <p className="text-center text-sm text-muted-foreground"><Lightbulb className="h-4 w-4 inline mr-1" />Questions suggérées</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
              {SUGGESTIONS.map(s => (
                <Button key={s} variant="outline" size="sm" className="text-xs text-left h-auto py-2.5 px-3 justify-start whitespace-normal leading-snug" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
            <div className="flex justify-center mt-3">
              <Button variant="default" size="sm" className="gap-1.5" onClick={analyzeData}>
                <BarChart3 className="h-3.5 w-3.5" /> Analyser les données affichées
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground/60 mt-4">
              L'assistant utilise les données financières affichées dans le module.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="p-1.5 rounded-lg bg-primary/10 h-fit shrink-0 mt-1"><Bot className="h-3.5 w-3.5 text-primary" /></div>
            )}
            <Card className={`max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
              <CardContent className="p-3 text-sm">
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                ) : (<p>{m.content}</p>)}
              </CardContent>
            </Card>
            {m.role === 'user' && (
              <div className="p-1.5 rounded-lg bg-muted h-fit shrink-0 mt-1"><User className="h-3.5 w-3.5 text-muted-foreground" /></div>
            )}
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pl-8"><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t">
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

function generateFallback(question: string, analyse: ReturnType<typeof analyser>, nom: string, exercice: number): string {
  const q = question.toLowerCase();
  // Préambule institutionnel — posture Agent Comptable Expert EPLE (GBCP / M9-6 / Op@le)
  const preambule = `> *Réponse produite en mode de continuité (IA indisponible), sous la posture d'agent comptable expert EPLE — décret n°2012-1246 (GBCP), instruction M9-6, code de l'éducation, ordonnance n°2022-408, code de la commande publique. L'analyse vise à garantir la régularité, la sincérité et la qualité comptable.*\n\n`;
  const cadreRef = `\n\n---\n*Cadre de référence : GBCP (décret 2012-1246) · M9-6 · Code de l'éducation · Op@le (logique services / domaines / activités).*`;

  if (q.includes('fdr') || q.includes('fonds de roulement')) {
    return `${preambule}## Analyse du FDR — lecture de l'agent comptable\n\n${analyse.engine.analyseDetaillee.filter(p => p.toLowerCase().includes('fdr')).join('\n\n')}\n\n**Points de vigilance (M9-6) :**\n${analyse.vigilance.filter(v => v.toLowerCase().includes('fdr')).map(v => `- ${v}`).join('\n') || '- Aucun point de vigilance spécifique identifié au regard des seuils M9-6.'}${cadreRef}`;
  }
  if (q.includes('risque')) {
    return `${preambule}## Risques financiers — ${nom} (analyse AC)\n\n**Causes identifiées :**\n${analyse.causes.map(c => `- ${c}`).join('\n')}\n\n**Conséquences possibles sur la régularité et la soutenabilité :**\n${analyse.consequences.map(c => `- ${c}`).join('\n')}${cadreRef}`;
  }
  if (q.includes('cofi') || q.includes('annexe')) {
    return `${preambule}## Annexe COFI — ${nom} (${exercice})\n\nFormulation prête à l'emploi, conforme à l'instruction M9-6 :\n\n${analyse.engine.texteCOFI}${cadreRef}`;
  }
  if (q.includes('ca') || q.includes('conseil')) {
    return `${preambule}## Présentation au Conseil d'Administration\n\nFormulation institutionnelle (cadre R.421-58 et suivants du code de l'éducation) :\n\n${analyse.engine.texteCA}${cadreRef}`;
  }
  return `${preambule}## Synthèse financière — ${nom} (${exercice})\n\n${analyse.engine.resume}\n\n**Recommandations opérationnelles (sous responsabilité de l'agent comptable) :**\n${analyse.recommandationsAvecPriorite.map((r, i) => `${i + 1}. ${r.texte}`).join('\n')}${cadreRef}\n\n*Mode de secours — l'IA n'est pas disponible actuellement. La présente analyse repose sur les indicateurs financiers consolidés.*`;
}
