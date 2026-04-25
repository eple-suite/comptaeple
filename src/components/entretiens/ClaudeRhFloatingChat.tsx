import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quels sont les délais légaux de recours hiérarchique sur un CREP ?",
  "Comment formuler une appréciation générale équilibrée et objective ?",
  "Quelles sont les obligations de l'évaluateur (décret 2010-888) ?",
  "Différence entre formation T1, T2 et T3 ?",
];

/**
 * Bouton flottant — chatbot Claude RH spécialisé entretiens professionnels.
 * Branché sur l'edge function `entretiens-claude-rh` (Lovable AI Gateway).
 */
export function ClaudeRhFloatingChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    const newMsgs: Msg[] = [...msgs, { role: "user", content: message }];
    setMsgs(newMsgs);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("entretiens-claude-rh", {
        body: { messages: newMsgs },
      });
      if (error) throw error;
      const reply = data?.reply ?? data?.content ?? "Réponse indisponible.";
      setMsgs([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMsgs([...newMsgs, { role: "assistant", content: `Erreur : ${e.message ?? "service indisponible"}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg"
          aria-label="Ouvrir l'assistant RH"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <Card className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[80vh] flex flex-col shadow-2xl">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Assistant RH — Entretiens
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden">
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div ref={scrollRef} className="space-y-3">
                {msgs.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Spécialisé décret 2010-888 et circulaire MENH1310955C. Ne se substitue pas à un conseil juridique.
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void send(s)}
                        className="w-full text-left text-xs p-2 rounded-md border hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg p-2 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground ml-6" : "bg-muted mr-6",
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                {busy && (
                  <div className="rounded-lg p-2 bg-muted mr-6 text-sm text-muted-foreground">
                    L'assistant rédige…
                  </div>
                )}
              </div>
            </ScrollArea>
            <form
              onSubmit={(e) => { e.preventDefault(); void send(); }}
              className="flex gap-2 pt-2 border-t"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                disabled={busy}
              />
              <Button type="submit" size="icon" disabled={busy}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}