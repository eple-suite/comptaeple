import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, Send, Plus, Search, Trash2, Archive, Loader2, AlertTriangle, Sparkles, BookOpen, Building2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { cn } from "@/lib/utils";

type Conv = {
  id: string;
  title: string;
  archived: boolean;
  updated_at: string;
};

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

const SUGGESTIONS = [
  "Quelle est la différence entre un service AP et un service ALO en M9-6 ?",
  "Comment imputer une recette de taxe d'apprentissage en Op@le ?",
  "Quel est le seuil de procédure adaptée pour les marchés publics 2026 ?",
  "Procédure exacte pour une DBM de niveau 1 (recette spécifique) ?",
  "Comment justifier un reliquat de bourses non versées au compte 443110 ?",
  "Que fait-on en cas de saisie SATD sur un compte d'élève ?",
  "Distinction entre fonds de roulement et trésorerie en EPLE ?",
  "Règles de déspécialisation des crédits BOP 141 / 230 ?",
  "Comment monter un dossier de fonds social pour la commission ?",
  "Mentions obligatoires d'un acte du conseil d'administration ?",
  "Procédure de passation au 1er septembre (SGEPLE entrant) ?",
  "Calcul du seuil de saucissonnage pour 3 marchés similaires ?",
];

export default function AssistantExpertPage() {
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [searchConv, setSearchConv] = useState("");
  const [contextModule, setContextModule] = useState<string>("Général");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("assistant_conversations")
        .select("id,title,archived,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) {
        toast.error("Erreur chargement conversations");
        return;
      }
      setConversations((data || []) as Conv[]);
      const first = (data || []).find((c) => !c.archived);
      if (first && !activeId) setActiveId(first.id);
    })();
  }, [user]);

  // Load messages of active conversation
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("assistant_messages")
        .select("id,role,content,created_at")
        .eq("conversation_id", activeId)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Erreur chargement messages");
        return;
      }
      setMessages((data || []) as Msg[]);
    })();
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const filteredConvs = useMemo(() => {
    const q = searchConv.trim().toLowerCase();
    return conversations
      .filter((c) => !c.archived)
      .filter((c) => !q || c.title.toLowerCase().includes(q));
  }, [conversations, searchConv]);

  const archivedConvs = useMemo(
    () => conversations.filter((c) => c.archived),
    [conversations],
  );

  async function newConversation() {
    if (!user) return;
    const { data, error } = await supabase
      .from("assistant_conversations")
      .insert({
        user_id: user.id,
        title: "Nouvelle conversation",
        context_module: contextModule,
        context_establishment_id: selectedEstablishment?.id || null,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Impossible de créer la conversation");
      return;
    }
    setConversations((prev) => [data as Conv, ...prev]);
    setActiveId(data.id);
    setMessages([]);
  }

  async function deleteConv(id: string) {
    if (!confirm("Supprimer définitivement cette conversation ?")) return;
    const { error } = await supabase.from("assistant_conversations").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function archiveConv(id: string, archive: boolean) {
    const { error } = await supabase
      .from("assistant_conversations")
      .update({ archived: archive })
      .eq("id", id);
    if (error) {
      toast.error("Action impossible");
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: archive } : c)),
    );
    if (archive && activeId === id) setActiveId(null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || !user) return;

    let convId = activeId;
    // Create conversation on first message
    if (!convId) {
      const { data, error } = await supabase
        .from("assistant_conversations")
        .insert({
          user_id: user.id,
          title: text.slice(0, 60),
          context_module: contextModule,
          context_establishment_id: selectedEstablishment?.id || null,
        })
        .select()
        .single();
      if (error || !data) {
        toast.error("Impossible de créer la conversation");
        return;
      }
      convId = data.id;
      setConversations((prev) => [data as Conv, ...prev]);
      setActiveId(convId);
    }

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    // Persist user message
    await supabase.from("assistant_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: text,
    });

    // Auto-update title if first message
    if (messages.length === 0) {
      await supabase
        .from("assistant_conversations")
        .update({ title: text.slice(0, 60) })
        .eq("id", convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: text.slice(0, 60) } : c)),
      );
    }

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant-expert-eple`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          contextModule,
          contextEstablishment: selectedEstablishment?.name || null,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Trop de requêtes, patientez quelques secondes.");
        else if (resp.status === 402) toast.error("Crédits IA épuisés.");
        else toast.error("Erreur de l'assistant");
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(j);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantContent += c;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      // Persist assistant message
      if (assistantContent) {
        await supabase.from("assistant_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
        });
        await supabase
          .from("assistant_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion à l'assistant");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function applySuggestion(s: string) {
    setInput(s);
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-[1600px] space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/5 p-6">
        <div className="absolute top-0 right-0 h-32 w-32 -mr-10 -mt-10 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Assistant Expert Comptabilité Publique EPLE</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> IA
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Réponses fondées sur votre base documentaire (M9-6, GBCP, contenus de l'app et PDF uploadés).
            </p>
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/30 text-xs">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <span className="text-warning-foreground/90">
                Cet assistant ne se substitue pas à un conseil juridique. En cas de doute, consulter la <strong>DAF A3</strong> ou le service réglementation comptable du rectorat.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4 min-h-[70vh]">
        {/* LEFT — Conversations */}
        <Card className="flex flex-col">
          <CardHeader className="p-3 space-y-2">
            <Button onClick={newConversation} size="sm" className="w-full gap-2">
              <Plus className="h-4 w-4" /> Nouvelle conversation
            </Button>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                placeholder="Rechercher..."
                className="pl-7 h-8 text-xs"
              />
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredConvs.length === 0 && (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  Aucune conversation.
                </p>
              )}
              {filteredConvs.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md px-2 py-2 text-xs cursor-pointer hover:bg-accent transition-colors",
                    activeId === c.id && "bg-accent",
                  )}
                  onClick={() => setActiveId(c.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveConv(c.id, true); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-warning transition-opacity"
                    title="Archiver"
                  >
                    <Archive className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {archivedConvs.length > 0 && (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mt-3 mb-1 font-bold">
                    Archivées ({archivedConvs.length})
                  </p>
                  {archivedConvs.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs cursor-pointer hover:bg-accent text-muted-foreground"
                      onClick={() => archiveConv(c.id, false)}
                      title="Cliquer pour restaurer"
                    >
                      <Archive className="h-3 w-3 shrink-0" />
                      <span className="flex-1 truncate italic">{c.title}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* CENTER — Chat */}
        <Card className="flex flex-col overflow-hidden">
          <ScrollArea className="flex-1" ref={scrollRef as any}>
            <div ref={scrollRef} className="p-4 space-y-4 min-h-[55vh]">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">Posez votre question d'expert</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Les réponses sont fondées sur la M9-6, GBCP, code de l'éducation et code de la commande publique.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-4 py-2.5 max-w-[85%] text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-background prose-pre:text-foreground">
                        {m.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-3 space-y-2">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Posez votre question (Entrée pour envoyer, Maj+Entrée pour saut de ligne)…"
                className="resize-none min-h-[60px] max-h-[200px] text-sm"
                rows={2}
                disabled={streaming}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                size="icon"
                className="h-[60px] w-12 shrink-0"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Les réponses peuvent contenir des inexactitudes — vérifiez systématiquement les références citées.
            </p>
          </div>
        </Card>

        {/* RIGHT — Suggestions & context */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Contexte
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Module :</span>{" "}
                <span className="font-medium">{contextModule}</span>
              </div>
              <div>
                <span className="text-muted-foreground">EPLE :</span>{" "}
                <span className="font-medium">{selectedEstablishment?.name || "Aucun sélectionné"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 pr-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1 text-[11px] text-muted-foreground">
              <div>• M9-6 (tomes 1, 2, 3)</div>
              <div>• GBCP (décret 2012-1246)</div>
              <div>• Code de l'éducation</div>
              <div>• Code de la commande publique</div>
              <div>• Circulaire MENE1704160C</div>
              <div>• Note DAF A3 / DGESCO</div>
              <div>• Documentation Op@le interne</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}