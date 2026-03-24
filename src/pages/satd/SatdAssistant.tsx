import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Bot, User, BookOpen, AlertTriangle, Scale, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ASSISTANT_ADVICE } from "./SatdReferenceData";
import type { Satd } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: string;
  selectedSatd?: Satd | null;
}

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_QUESTIONS = [
  { label: "Procédure complète", q: "Détaille-moi les étapes complètes d'une procédure SATD en EPLE, avec les bases légales et les délais." },
  { label: "Quotité saisissable", q: "Explique-moi le barème des quotités saisissables 2026 et comment le calculer." },
  { label: "FICOBA", q: "Comment faire une demande FICOBA ? À qui l'adresser et quelles informations obtient-on ?" },
  { label: "Auto-SATD bourse", q: "Puis-je me saisir moi-même en tant que tiers détenteur pour récupérer une dette sur la bourse d'un élève ?" },
  { label: "Contestation", q: "Que faire si un débiteur conteste la SATD ? Quels sont les délais et les risques ?" },
  { label: "Proportionnalité", q: "Quelles sont les règles de proportionnalité à respecter ? Quand la SATD est-elle déconseillée ?" },
  { label: "Irrécouvrabilité", q: "Comment déclarer une créance irrécouvrable après échec de la SATD ?" },
  { label: "Compte bancaire vs salaire", q: "Quelles sont les différences entre une SATD sur compte bancaire et une SATD sur salaire ? Laquelle privilégier ?" },
];

export default function SatdAssistant({ open, onOpenChange, context, selectedSatd }: Props) {
  const advice = ASSISTANT_ADVICE[context] || ASSISTANT_ADVICE.creation_satd;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"tips" | "chat">("tips");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setMode("chat");

    let assistantSoFar = "";

    try {
      const satdContext = selectedSatd ? {
        reference: selectedSatd.reference,
        debiteur: selectedSatd.debiteur,
        montant: selectedSatd.montantGlobal,
        preleve: selectedSatd.montantPreleve,
        statut: selectedSatd.statut,
        etapes: selectedSatd.etapes.map(e => e.type),
        prescription: selectedSatd.datePrescription,
        typeDebiteur: selectedSatd.typeDebiteur,
      } : null;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/satd-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: satdContext,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erreur réseau" }));
        throw new Error(err.error || "Erreur du service IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message || "Erreur de connexion à l'assistant IA. Consultez les conseils statiques ci-dessous."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant SATD Pro — IA Réglementaire
          </DialogTitle>
          <div className="flex gap-1 mt-1">
            <Button size="sm" variant={mode === "tips" ? "default" : "ghost"} className="text-xs h-7" onClick={() => setMode("tips")}>
              <BookOpen className="h-3 w-3 mr-1" /> Fiches pratiques
            </Button>
            <Button size="sm" variant={mode === "chat" ? "default" : "ghost"} className="text-xs h-7" onClick={() => setMode("chat")}>
              <Bot className="h-3 w-3 mr-1" /> Chat IA
            </Button>
          </div>
        </DialogHeader>

        {mode === "tips" ? (
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Selected SATD context */}
              {selectedSatd && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary mb-1">Dossier sélectionné</p>
                  <p className="text-sm font-medium">{selectedSatd.reference} — {selectedSatd.debiteur}</p>
                  <p className="text-xs text-muted-foreground">Montant : {selectedSatd.montantGlobal.toFixed(2)} € | Statut : {selectedSatd.statut}</p>
                </div>
              )}

              {/* Tips */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-success font-semibold text-sm mb-2">
                  <Scale className="h-4 w-4" /> {advice.title} — Bonnes pratiques
                </div>
                <ul className="space-y-1.5">
                  {advice.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-success mt-0.5">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warnings */}
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-warning font-semibold text-sm mb-2">
                  <AlertTriangle className="h-4 w-4" /> Points d'attention
                </div>
                <ul className="space-y-1.5">
                  {advice.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-warning mt-0.5">⚠</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* References */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                  <FileText className="h-4 w-4" /> Références réglementaires
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {advice.references.map((ref, i) => (
                    <li key={i}>📌 {ref}</li>
                  ))}
                </ul>
              </div>

              {/* Quick action to switch to chat */}
              <Button variant="outline" className="w-full text-xs" onClick={() => setMode("chat")}>
                <Bot className="h-3.5 w-3.5 mr-1" /> Poser une question à l'assistant IA
              </Button>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[45vh] mb-3">
              {messages.length === 0 && (
                <div className="space-y-3 py-4">
                  <p className="text-xs text-muted-foreground text-center">Posez votre question ou cliquez sur un sujet :</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q.q)}
                        className="text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <span className="text-xs font-medium">{q.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_li]:mb-0.5 [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">Analyse en cours...</div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-2 border-t">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Posez votre question sur la SATD..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button size="sm" onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="gradient-primary border-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
