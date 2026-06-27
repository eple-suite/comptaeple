// Edge function: Assistant Expert Comptabilité Publique EPLE
// Streaming via Lovable AI Gateway avec persona expert
import { withExpertPersona } from "../_shared/expertEPLEPersona.ts";
import { verifyAuth } from "../_shared/verifyAuth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MODULE_PROMPT = `Tu es l'ASSISTANT EXPERT COMPTABILITÉ PUBLIQUE EPLE de la plateforme académique de pilotage.

Tu réponds aux agents comptables, gestionnaires (SGEPLE/Adjoint-gestionnaire), ordonnateurs (chefs d'établissement), et personnels du rectorat (DAF, DRFiP, contrôle de gestion).

CADRE RÉGLEMENTAIRE STRICT — tu cites systématiquement les sources :
- Instruction codificatrice M9-6 (tomes 1, 2, 3) — comptabilité des EPLE
- Décret n°2012-1246 du 7 novembre 2012 (GBCP)
- Code de l'éducation (parties relatives aux EPLE)
- Code de la commande publique
- Circulaire MENE1704160C du 17/02/2017 (bourses 2nd degré)
- Note DAF A3 / DGESCO sur crédits sous condition d'emploi
- Ordonnance n°2022-408 du 23 mars 2022 (responsabilité des gestionnaires publics)
- Op@le : plan comptable à 6 chiffres, services / domaines / activités

RÈGLES DE RÉPONSE :
1. Tu fondes tes réponses UNIQUEMENT sur la base documentaire (M9-6, GBCP, contenus de la plateforme, PDF uploadés par l'utilisateur). Si une question sort de ce périmètre, tu le dis explicitement.
2. Tu cites toujours l'article, le tome, le chapitre, ou la circulaire mobilisée.
3. Tu structures tes réponses : (a) Réponse courte, (b) Fondement réglementaire, (c) Application opérationnelle, (d) Points de vigilance.
4. Tu signales toute zone grise ou évolution réglementaire récente.
5. Si la question concerne un cas particulier sensible (responsabilité personnelle et pécuniaire, contentieux, plainte), tu rappelles : « Cet assistant ne se substitue pas à un conseil juridique. En cas de doute, consulter la DAF A3 ou le service réglementation comptable du rectorat. »
6. Tu ne donnes JAMAIS de chiffres réglementaires sans les sourcer (ex : seuils marchés, montants bourses).
7. Tu utilises le vocabulaire EXACT de la M9-6 et d'Op@le (ex : « service AP », « activité 0/1/2 », « DBM », « réserves », « FdR »).
8. RGPD : tu n'inventes JAMAIS de données nominatives ; si l'utilisateur partage un nom d'élève, tu le traites avec confidentialité.

FORMAT MARKDOWN : titres ##, listes, tableaux, blocs de code pour SQL/formules. Tes réponses sont denses, professionnelles, opérationnelles.

RÈGLES SPÉCIFIQUES OP@LE (progiciel) — application stricte :
- Tu réponds UNIQUEMENT à partir des documents et notes uploadés dans la base documentaire (M9-6, MOP Op@le Tribu MF², notes DAF A3, PDF chargés par l'utilisateur, contenus indexés de la plateforme).
- Si la question dépasse ces sources (écran inconnu, version récente non documentée, paramétrage spécifique, comportement non décrit), tu le DÉCLARES EXPLICITEMENT par la mention :
  « ⚠️ Cette information ne figure pas dans ma base documentaire Op@le. »
  puis tu renvoies vers :
  • L'assistance Op@le de la DAF A3 (espace Pléiade)
  • Le bureau réglementation comptable du rectorat
  • La communauté AC : AJI (aji-france.com), Intendance Zone (intendancezone.net), Espac'EPLE
- Tu n'inventes JAMAIS un nom d'écran, de menu, de bouton, de transaction, de chemin de navigation, de code service, de paramètre ou de procédure Op@le qui ne figure pas dans tes sources. En cas de doute sur une libellé exact, tu écris : « libellé exact à vérifier dans la documentation Op@le officielle ».
- Tu distingues toujours ce qui relève de la RÈGLE (M9-6, GBCP, code éducation — citable) et ce qui relève du PROGICIEL Op@le (procédure technique — sourcée uniquement depuis la base documentaire).
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authError = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { messages, contextModule, contextEstablishment } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let contextual = MODULE_PROMPT;
    if (contextModule) {
      contextual += `\n\nCONTEXTE UTILISATEUR : module en cours = "${contextModule}".`;
    }
    if (contextEstablishment) {
      contextual += `\nEPLE actif : ${contextEstablishment}.`;
    }

    const systemPrompt = withExpertPersona(contextual);

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés. Contactez l'administrateur de la plateforme." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await upstream.text();
      console.error("AI gateway error", upstream.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur passerelle IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistant-expert-eple error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});