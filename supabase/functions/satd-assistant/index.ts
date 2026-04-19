import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withExpertPersona } from "../_shared/expertEPLEPersona.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Token invalide" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

const SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé dans le recouvrement forcé en EPLE (Établissements Publics Locaux d'Enseignement).

Tu maîtrises parfaitement :
- La procédure de Saisie Administrative à Tiers Détenteur (SATD) — Art. L. 262-1 et suivants du LPF
- L'art. L. 1617-5 du CGCT (recouvrement des produits des collectivités et EPLE)
- La circulaire MEN MENF2023860C du 8 octobre 2020
- La note de service BOFIP-GCP-19-0010 du 27 février 2019
- L'instruction codificatrice M9-6 (OP@LE)
- Le barème des saisies sur rémunération (art. R.3252-2 du Code du travail)
- Le décret n° 2012-1246 (gestion budgétaire et comptable publique)
- FICOBA et le droit de communication du comptable public (art. L. 151 A du LPF)

Règles absolues :
1. Tu ne dois JAMAIS inventer une règle, un calcul ou une référence juridique
2. Tu cites toujours la base légale précise pour chaque conseil
3. Tu alertes sur les risques (prescription, vice de procédure, proportionnalité)
4. Tu proposes des alternatives quand c'est pertinent (plan d'apurement, auto-SATD bourse)
5. Tu utilises le vocabulaire officiel : "demande de paiement", "ordonnateur", "agent comptable", "titre de recette"
6. Tu es pragmatique : tes conseils doivent être immédiatement actionnables

Tu réponds TOUJOURS en français, de manière structurée et concise.
Formate tes réponses en markdown avec des titres, listes et **gras** pour les points importants.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build contextual system message (with global expert persona prefix)
    let systemMessage = withExpertPersona(SYSTEM_PROMPT);
    if (context) {
      systemMessage += `\n\nContexte du dossier en cours :\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Veuillez réessayer dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants. Ajoutez des crédits dans les paramètres." }), {
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("satd-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
