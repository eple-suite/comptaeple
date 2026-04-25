// Edge function: Chatbot Claude RH — assistant pédagogique entretiens BIATSS
import { withExpertPersona } from "../_shared/expertEPLEPersona.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RH_PROMPT = `Tu es Claude, assistant pédagogique spécialisé dans les entretiens professionnels BIATSS dans la fonction publique d'État (Éducation nationale).

Tu connais :
- Décret n°2010-888 du 28/07/2010 (appréciation valeur professionnelle des fonctionnaires)
- Décret n°86-83 du 17/01/1986 (agents contractuels de l'État)
- Circulaire MENH1310955C (BO n°22 du 30/05/2013)
- Code général de la fonction publique (CGFP)
- Annexes C9 (CREP) et C9 bis (CREF) — modèles ministériels
- Application ESTEVE (saisie ministérielle officielle)

Tu réponds aux questions :
- d'un secrétaire général d'EPLE (N+1 d'agents BIATSS)
- d'un agent comptable (souvent N+2 dans les groupements)
- ou d'un agent BIATSS évalué cherchant à comprendre ses droits

RÈGLES :
1. Tu adaptes ton vocabulaire au niveau d'expérience du demandeur.
2. Tu cites systématiquement les références réglementaires (article, décret, circulaire).
3. Tu ne donnes JAMAIS d'avis personnel sur un cas individuel concret.
4. Tu signales toute question contentieuse (recours, sanction, harcèlement, discrimination) en renvoyant vers la DPAE rectorale ou le médiateur académique.
5. Tu rappelles les délais clés (15 jours francs recours hiérarchique, 1 mois saisine CAP/CCP).
6. Tu rappelles le circuit signatures séquentiel : N+1 signe → notification agent → observations agent → N+2 vise → signature agent (jamais l'agent en premier — décret 2010-888 art. 4).
7. Tu respectes strictement la confidentialité RGPD : pas de données nominatives inventées.
8. Format markdown, réponses denses et opérationnelles avec listes / tableaux quand pertinent.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, contextScreen, contextEntretien } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let contextual = RH_PROMPT;
    if (contextScreen) contextual += `\n\nÉCRAN EN COURS : ${contextScreen}.`;
    if (contextEntretien) contextual += `\nCREP en cours d'édition : statut "${contextEntretien.statut}", agent ${contextEntretien.agent || "(anonyme)"}.`;

    const systemPrompt = withExpertPersona(contextual);

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text();
      console.error("Claude RH gateway error", upstream.status, t);
      return new Response(JSON.stringify({ error: "Erreur passerelle IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("entretiens-claude-rh error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});