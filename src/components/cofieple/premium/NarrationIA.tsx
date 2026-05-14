// Carte de narration IA — style éditorial magazine
// Génère une analyse contextuelle d'une section précise
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Copy, RefreshCw, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface NarrationIAProps {
  sectionId: string;            // identifiant pour cache localStorage
  title: string;                // titre affiché ex: "Lecture financière"
  context: Record<string, any>; // données envoyées à l'IA
  systemPrompt?: string;
  initialPrompt?: string;       // prompt par défaut
  variant?: 'default' | 'compact';
}

export function NarrationIA({
  sectionId, title, context, systemPrompt, initialPrompt, variant = 'default',
}: NarrationIAProps) {
  const cacheKey = `cofieple_narration_${sectionId}`;
  const [text, setText] = useState<string>(() => {
    try { return localStorage.getItem(cacheKey) || ''; } catch { return ''; }
  });
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          type: 'narration_section',
          sectionId,
          context,
        },
      });
      if (error) throw error;
      const result = data?.text || data?.content || '';
      setText(result);
      try { localStorage.setItem(cacheKey, result); } catch {}
      toast.success('Analyse générée');
    } catch (e: any) {
      toast.error('Erreur IA : ' + (e?.message || 'inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(text);
    toast.success('Copié');
  };

  if (variant === 'compact') {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {title}
          </div>
          <Button size="sm" variant="ghost" onClick={generate} disabled={loading} className="h-7 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
        {text ? (
          <div className="prose prose-sm max-w-none text-sm text-foreground/90 leading-relaxed">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Cliquez sur ↻ pour générer une lecture IA</p>
        )}
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04] shadow-lg"
    >
      {/* Quote ornament */}
      <Quote className="absolute -top-2 -left-2 h-16 w-16 text-primary/[0.06] rotate-180 pointer-events-none" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary mb-2">
              <Sparkles className="h-2.5 w-2.5 mr-1" /> Narration IA experte
            </Badge>
            <h3 className="font-serif-accent text-xl font-light text-foreground">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {text && (
              <Button size="sm" variant="ghost" onClick={copy} className="h-8 w-8 p-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={generate} disabled={loading} className="h-8">
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Analyse…</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {text ? 'Régénérer' : 'Générer'}</>
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {text ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="prose prose-sm max-w-none text-foreground/90 leading-relaxed first-letter:text-3xl first-letter:font-serif-accent first-letter:font-light first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-primary"
            >
              <ReactMarkdown>{text}</ReactMarkdown>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Cliquez sur <span className="font-semibold">Générer</span> pour obtenir une lecture financière experte de cette section.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
