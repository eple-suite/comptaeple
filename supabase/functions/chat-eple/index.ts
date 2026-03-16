import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type KnowledgeSnippet = {
  id: string;
  source: "M9-6" | "GBCP" | "Code de l'éducation" | "Code de la commande publique" | "Ressources pro";
  refs: string[];
  tags: string[];
  content: string;
  critical?: boolean;
};

type StructuredAnswer = {
  status: "grounded" | "insufficient";
  answer_markdown: string;
  citations: string[];
  confidence: "high" | "medium" | "low";
  evidence_quotes?: Array<{
    id: string;
    quote: string;
    rationale?: string;
  }>;
  checks?: {
    ordonnateur_vs_comptable?: "ok" | "uncertain";
    operation_type?: "budgetaire" | "non_budgetaire" | "mixte" | "uncertain";
  };
};

const LEGAL_KNOWLEDGE: KnowledgeSnippet[] = [
  {
    id: "M96_TERMINOLOGIE_OPALE",
    source: "M9-6",
    refs: ["Instruction M9-6 (2026)", "Terminologie Op@le"],
    tags: ["opale", "terminologie", "demande de paiement", "demande de comptabilisation", "demande de versement"],
    content:
      "Terminologie Op@le obligatoire : demande de paiement (dépense budgétaire), demande de comptabilisation (écriture AC), demande de versement (opération non budgétaire), titre de recette (ordonnateur).",
    critical: true,
  },
  {
    id: "M96_ORDO_AC_ROLES",
    source: "M9-6",
    refs: ["Instruction M9-6 (2026)", "Articulation budget/comptabilité"],
    tags: ["ordonnateur", "agent comptable", "rôle", "séparation", "compétence"],
    content:
      "L'ordonnateur émet titres de recettes et demandes de paiement. L'agent comptable passe les écritures techniques (demandes de comptabilisation), assure recouvrement/paiement et tient la comptabilité générale.",
    critical: true,
  },
  {
    id: "M96_REJET_BOURSE_DFT",
    source: "M9-6",
    refs: ["Instruction M9-6 (2026)", "Opérations techniques sur relevé DFT"],
    tags: ["bourse", "rejet", "dft", "5151", "4411", "demande de comptabilisation"],
    content:
      "Rejet de bourse constaté sur relevé DFT : opération technique de l'agent comptable, pas une demande de paiement. Écriture de régularisation : D 4411 (État, subdivision bourses) / C 5151 (Trésor).",
    critical: true,
  },
  {
    id: "M96_CHEQUE_IMPAYE",
    source: "M9-6",
    refs: ["Instruction M9-6 (2026)", "Planche écritures - effets impayés"],
    tags: ["chèque", "impayé", "5117", "4112", "famille"],
    content:
      "Chèque famille impayé : D 5117 / C 5151, puis reconstitution de la créance D 4112 / C 5117. Frais bancaires : D 627 / C 5151.",
    critical: true,
  },
  {
    id: "M96_RECETTES_PHASES",
    source: "M9-6",
    refs: ["Instruction M9-6 (2026)", "Tome 2 - Recettes"],
    tags: ["recette", "titre", "liquidation", "recouvrement", "ordonnateur"],
    content:
      "Exécution des recettes : liquidation des droits, émission du titre, prise en charge par l'agent comptable, recouvrement amiable puis contentieux.",
  },
  {
    id: "M96_DEPENSES_PHASES",
    source: "M9-6",
    refs: ["Instruction M9-6 (2026)", "Tome 2 - Dépenses"],
    tags: ["dépense", "engagement", "liquidation", "ordonnancement", "paiement"],
    content:
      "Exécution des dépenses : engagement, liquidation (service fait), ordonnancement, paiement. La demande de paiement concerne uniquement une dépense.",
    critical: true,
  },
  {
    id: "GBCP_ART_7_9",
    source: "GBCP",
    refs: ["Décret n°2012-1246", "Art. 7 à 9"],
    tags: ["séparation", "ordonnateur", "comptable", "incompatibilité"],
    content:
      "Séparation ordonnateur/comptable : fonctions incompatibles, responsabilités distinctes et contrôle mutuel.",
    critical: true,
  },
  {
    id: "GBCP_ART_18_20",
    source: "GBCP",
    refs: ["Décret n°2012-1246", "Art. 18 à 20"],
    tags: ["contrôle", "paiement", "agent comptable", "validité", "imputation"],
    content:
      "Avant paiement, l'agent comptable contrôle la qualité de l'ordonnateur, disponibilité des crédits, imputation, service fait, pièces justificatives et validité de la dette.",
    critical: true,
  },
  {
    id: "GBCP_ART_23_33",
    source: "GBCP",
    refs: ["Décret n°2012-1246", "Art. 23 à 33"],
    tags: ["recettes", "dépenses", "liquidation", "ordre de recouvrer", "paiement"],
    content:
      "Les recettes et dépenses suivent des phases encadrées. L'ordre de recouvrer est exécutoire. Le paiement intervient après ordonnancement et contrôles.",
  },
  {
    id: "GBCP_ART_38_195",
    source: "GBCP",
    refs: ["Décret n°2012-1246", "Art. 38 et 195"],
    tags: ["suspension", "réquisition", "exceptions"],
    content:
      "En cas d'irrégularité, le comptable peut suspendre. La réquisition est possible sauf cas d'interdiction prévus par l'article 195.",
  },
  {
    id: "CODE_EDU_L421_4",
    source: "Code de l'éducation",
    refs: ["Code de l'éducation", "L421-4"],
    tags: ["ca", "conseil d'administration", "compétence", "budget"],
    content:
      "Le conseil d'administration règle par ses délibérations les affaires de l'établissement, notamment budget, DBM et compte financier.",
  },
  {
    id: "CODE_EDU_R421_9",
    source: "Code de l'éducation",
    refs: ["Code de l'éducation", "R421-9"],
    tags: ["chef d'établissement", "ordonnateur", "r421-9"],
    content:
      "Le chef d'établissement est ordonnateur des recettes et des dépenses.",
    critical: true,
  },
  {
    id: "CODE_EDU_R421_62_70",
    source: "Code de l'éducation",
    refs: ["Code de l'éducation", "R421-62 à R421-70"],
    tags: ["agent comptable", "groupement", "exécution", "réquisition"],
    content:
      "Les articles R421-62 à R421-70 fixent les règles de l'agent comptable, de l'exécution comptable et de la réquisition dans les EPLE.",
    critical: true,
  },
  {
    id: "CCP_SEUILS_2026",
    source: "Code de la commande publique",
    refs: ["CCP 2026", "R2122-8", "R2123-1", "R2124-1"],
    tags: ["seuil", "40 000", "60 000", "90 000", "216 000", "mapa"],
    content:
      "Fournitures/services : dispense < 40k€ HT (60k€ HT à compter du 01/04/2026), publicité BOAMP à partir de 90k€ HT, procédure formalisée à partir de 216k€ HT.",
  },
  {
    id: "CCP_ARTICLES_CLES",
    source: "Code de la commande publique",
    refs: ["L1211-1", "L2113-10", "L2192-10", "L2193-11"],
    tags: ["pouvoir adjudicateur", "allotissement", "30 jours", "sous-traitance"],
    content:
      "Articles clés : pouvoir adjudicateur, allotissement, délai global de paiement de 30 jours, sous-traitance et paiement direct.",
  },
  {
    id: "RESSOURCES_COMMUNAUTAIRES",
    source: "Ressources pro",
    refs: ["IH2EF", "Espac'EPLE", "IntendanceZone"],
    tags: ["ressources", "formation", "guide", "ih2ef", "espaceple", "intendancezone"],
    content:
      "Ressources pratiques : IH2EF (https://www.ih2ef.gouv.fr/les-ressources), Espac'EPLE (https://espaceple.org/spip.php?article762), IntendanceZone (https://www.intendancezone.net/spip.php?article1149).",
  },
];

const STOP_WORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "ou", "en", "dans", "sur", "pour", "avec", "que", "qui", "quoi", "comment", "quand", "est", "sont", "au", "aux", "par", "il", "elle", "on", "ce", "cette", "ces", "d", "l",
]);

const FORBIDDEN_PRIVATE_TERMS = ["pcg", "ifrs", "ias", "comptabilite privee"];
const HIGH_RISK_TERMS = ["écriture", "ecriture", "compte", "comptabilisation", "dft", "rejet", "bourse", "annulation", "anv", "remise gracieuse"];

const STRICT_SYSTEM_PROMPT = `Tu es un assistant juridique/comptable EPLE en mode PREUVE OBLIGATOIRE.

Règles absolues :
1) Tu réponds UNIQUEMENT à partir du corpus fourni (IDs de snippets).
2) Tu n'inventes jamais d'article, de compte, d'écriture, de seuil ni de procédure.
3) Si un doute existe, ou si une preuve textuelle manque, renvoie status="insufficient".
4) Tu utilises exclusivement la terminologie Op@le et la logique M9-6/GBCP/Code de l'éducation/CCP.
5) Pour toute question comptable, tu distingues ordonnateur vs agent comptable.
6) Tu cites au moins 2 snippets en status="grounded".
7) Tu fournis des extraits textuels exacts du corpus via evidence_quotes (citations littérales).
8) Tu réponds en français.

Tu DOIS répondre en JSON strict (sans balises markdown) :
{
  "status": "grounded" | "insufficient",
  "answer_markdown": "string",
  "citations": ["ID_SNIPPET_1", "ID_SNIPPET_2"],
  "confidence": "high" | "medium" | "low",
  "evidence_quotes": [
    {
      "id": "ID_SNIPPET",
      "quote": "extrait exact du snippet",
      "rationale": "pourquoi cet extrait prouve la réponse"
    }
  ],
  "checks": {
    "ordonnateur_vs_comptable": "ok" | "uncertain",
    "operation_type": "budgetaire" | "non_budgetaire" | "mixte" | "uncertain"
  }
}`;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9@]+/g)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function scoreSnippet(questionTokens: string[], snippet: KnowledgeSnippet): number {
  const haystack = normalize(`${snippet.tags.join(" ")} ${snippet.content} ${snippet.refs.join(" ")}`);
  let score = snippet.critical ? 2 : 0;

  for (const token of questionTokens) {
    if (haystack.includes(token)) score += 3;
  }

  return score;
}

function isHighRiskQuestion(question: string): boolean {
  const q = normalize(question);
  return HIGH_RISK_TERMS.some((term) => q.includes(normalize(term)));
}

function selectKnowledge(question: string): KnowledgeSnippet[] {
  const tokens = tokenize(question);
  const scored = LEGAL_KNOWLEDGE
    .map((snippet) => ({ snippet, score: scoreSnippet(tokens, snippet) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9)
    .map((entry) => entry.snippet);

  const mandatory = ["M96_TERMINOLOGIE_OPALE", "M96_ORDO_AC_ROLES", "GBCP_ART_7_9"]
    .map((id) => LEGAL_KNOWLEDGE.find((s) => s.id === id))
    .filter(Boolean) as KnowledgeSnippet[];

  const merged = [...mandatory, ...scored];
  const uniqueById = new Map<string, KnowledgeSnippet>();
  for (const snippet of merged) uniqueById.set(snippet.id, snippet);

  return Array.from(uniqueById.values()).slice(0, 10);
}

function buildKnowledgeBlock(snippets: KnowledgeSnippet[]): string {
  return snippets
    .map((s) => {
      return `- [${s.id}]\n  source: ${s.source}\n  refs: ${s.refs.join(" | ")}\n  tags: ${s.tags.join(", ")}\n  contenu: ${s.content}`;
    })
    .join("\n\n");
}

function hasAll(text: string, terms: string[]): boolean {
  const normalized = normalize(text);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function getPlaybookAnswer(question: string): string | null {
  const q = normalize(question);

  if (hasAll(q, ["rejet", "bourse", "dft"])) {
    return `### Procédure correcte (rejet de bourse sur relevé DFT)

1. **Nature de l'opération** : c'est une **opération technique comptable** (pas une dépense budgétaire).
2. **Acteur compétent** : **agent comptable** (pas l'ordonnateur pour cette écriture technique).
3. **Écriture de régularisation** : **D 4411 / C 5151** (subdivision bourses côté État selon le paramétrage de l'EPLE).
4. **Point de vigilance** : ce n'est **pas** une demande de paiement ; la demande de paiement concerne une dépense.

### Références
- **M96_REJET_BOURSE_DFT** — Instruction M9-6 (opérations techniques sur relevé DFT)
- **M96_TERMINOLOGIE_OPALE** — Terminologie Op@le
- **GBCP_ART_7_9** — séparation ordonnateur/comptable
- **CODE_EDU_R421_9** et **CODE_EDU_R421_62_70** — ordonnateur et exécution comptable EPLE`;
  }

  if (hasAll(q, ["ch", "impay", "famille"]) || hasAll(q, ["cheque", "impaye"])) {
    return `### Procédure correcte (chèque famille impayé)

1. Constatation de l'impayé : **D 5117 / C 5151**.
2. Reconstitution de la créance famille : **D 4112 / C 5117**.
3. Frais bancaires éventuels : **D 627 / C 5151**.

### Références
- **M96_CHEQUE_IMPAYE** — Instruction M9-6 (écritures d'impayés)
- **M96_ORDO_AC_ROLES** — compétence AC pour les écritures techniques
- **GBCP_ART_18_20** — contrôles et responsabilité du comptable`;
  }

  return null;
}

function extractJsonObject(raw: string): string | null {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return cleaned.slice(first, last + 1);
}

function parseStructuredAnswer(rawContent: string): StructuredAnswer | null {
  const jsonCandidate = extractJsonObject(rawContent);
  if (!jsonCandidate) return null;

  const attempts = [
    jsonCandidate,
    jsonCandidate.replace(/,\s*([}\]])/g, "$1"),
  ];

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as StructuredAnswer;
    } catch {
      // try next variant
    }
  }

  return null;
}

function getSnippetText(snippet: KnowledgeSnippet): string {
  return normalize(`${snippet.content} ${snippet.refs.join(" ")} ${snippet.tags.join(" ")}`);
}

function containsExactEvidence(snippet: KnowledgeSnippet, quote: string): boolean {
  const cleanedQuote = normalize((quote || "").trim());
  if (!cleanedQuote || cleanedQuote.length < 12) return false;
  return getSnippetText(snippet).includes(cleanedQuote);
}

function extractAccountNumbers(text: string): string[] {
  const matches = text.match(/\b[1-8]\d{3,5}\b/g) ?? [];
  return Array.from(new Set(matches));
}

function mentionsOrdoAndAC(text: string): boolean {
  const n = normalize(text);
  return n.includes("ordonnateur") && (n.includes("agent comptable") || n.includes("ac"));
}

function validateStructuredAnswer(parsed: StructuredAnswer, snippets: KnowledgeSnippet[], question: string): string[] {
  const errors: string[] = [];
  const snippetIds = new Set(snippets.map((s) => s.id));

  if (!["grounded", "insufficient"].includes(parsed.status)) {
    errors.push("status invalide");
  }

  if (!Array.isArray(parsed.citations) || parsed.citations.length === 0) {
    errors.push("citations absentes");
  } else {
    for (const id of parsed.citations) {
      if (!snippetIds.has(id)) errors.push(`citation hors corpus: ${id}`);
    }
  }

  if (!parsed.answer_markdown?.trim()) {
    errors.push("answer vide");
  }

  const answerNormalized = normalize(parsed.answer_markdown || "");
  for (const term of FORBIDDEN_PRIVATE_TERMS) {
    if (answerNormalized.includes(term)) {
      errors.push(`terme interdit: ${term}`);
    }
  }

  if (isHighRiskQuestion(question) && parsed.status === "grounded") {
    if (parsed.confidence !== "high") errors.push("confiance insuffisante pour question sensible");
    if (parsed.checks?.ordonnateur_vs_comptable !== "ok") {
      errors.push("distinction ordonnateur/comptable non validée");
    }
  }

  if (hasAll(question, ["rejet", "bourse", "dft"])) {
    if (answerNormalized.includes("demande de paiement")) {
      errors.push("erreur critique: demande de paiement sur rejet de bourse DFT");
    }
    if (!answerNormalized.includes("demande de comptabilisation") && !answerNormalized.includes("operation technique")) {
      errors.push("absence de qualification technique sur rejet bourse DFT");
    }
  }

  return errors;
}

function formatGroundedAnswer(parsed: StructuredAnswer, snippets: KnowledgeSnippet[]): string {
  if (parsed.status === "insufficient") {
    return `Je ne suis pas certain de cette procédure sur la base des extraits disponibles. Je vous recommande de vérifier auprès de votre agent comptable, du rectorat ou de la DRFiP.`;
  }

  const byId = new Map(snippets.map((s) => [s.id, s]));
  const citations = parsed.citations
    .filter((id, idx, arr) => byId.has(id) && arr.indexOf(id) === idx)
    .slice(0, 6)
    .map((id) => {
      const snippet = byId.get(id)!;
      return `- **${id}** — ${snippet.source} (${snippet.refs.join(", ")})`;
    })
    .join("\n");

  return `${parsed.answer_markdown.trim()}\n\n### Références mobilisées\n${citations}`;
}

function buildFallbackMessage(): string {
  return `Je ne suis pas certain de cette procédure. Je préfère ne pas risquer une réponse erronée en comptabilité publique. Merci de vérifier auprès de votre agent comptable, du rectorat ou de la DRFiP.`;
}

function toSSE(content: string): string {
  const chunks: string[] = [];
  const maxChunkSize = 220;

  for (let i = 0; i < content.length; i += maxChunkSize) {
    chunks.push(content.slice(i, i + maxChunkSize));
  }

  const events = chunks
    .map((chunk) => `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`)
    .join("");

  return `${events}data: [DONE]\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json() as { messages?: ChatMessage[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const question = messages
      ?.slice()
      .reverse()
      .find((m) => m.role === "user")
      ?.content
      ?.trim();

    if (!question) {
      return new Response(JSON.stringify({ error: "Question manquante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const playbookAnswer = getPlaybookAnswer(question);
    if (playbookAnswer) {
      return new Response(toSSE(playbookAnswer), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const selectedKnowledge = selectKnowledge(question);
    const knowledgeBlock = buildKnowledgeBlock(selectedKnowledge);

    const userPrompt = `Question utilisateur:\n${question}\n\nCorpus disponible (utiliser uniquement ces snippets):\n${knowledgeBlock}\n\nContraintes supplémentaires:\n- Pour toute question d'écriture/procédure, expliciter l'acteur compétent (ordonnateur ou agent comptable).\n- Ne pas utiliser la comptabilité privée.\n- Si preuve insuffisante: status=\"insufficient\".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        stream: false,
        messages: [
          { role: "system", content: STRICT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants. Rechargez votre espace de travail." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const completion = await response.json();
    const rawContent = completion?.choices?.[0]?.message?.content;

    if (typeof rawContent !== "string") {
      const fallback = buildFallbackMessage();
      return new Response(toSSE(fallback), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const parsed = parseStructuredAnswer(rawContent);
    if (!parsed) {
      const fallback = buildFallbackMessage();
      return new Response(toSSE(fallback), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const validationErrors = validateStructuredAnswer(parsed, selectedKnowledge, question);
    if (validationErrors.length > 0) {
      console.warn("chat-eple strict validation blocked response", { validationErrors, question });
      const fallback = buildFallbackMessage();
      return new Response(toSSE(fallback), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const finalText = formatGroundedAnswer(parsed, selectedKnowledge);
    return new Response(toSSE(finalText), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-eple error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
