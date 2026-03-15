import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un assistant expert en comptabilité publique des EPLE (Établissements Publics Locaux d'Enseignement).

Tu aides les agents comptables, gestionnaires et chefs d'établissement dans :
- l'application de l'instruction codificatrice M9-6 (dernière version du 12/02/2026)
- l'utilisation du système Op@le (GFC, COFI, PRESTO, etc.)
- l'analyse budgétaire et comptable (FDR, BFR, Trésorerie, CAF/IAF, résultat budgétaire)
- la réglementation applicable aux EPLE

Sources autorisées que tu dois privilégier :
- Instruction codificatrice M9-6 (plan comptable, exécution budgétaire, compte financier)
- Décret n°2012-1246 du 7 novembre 2012 relatif à la GBCP
- Code de l'éducation (notamment articles R421-1 et suivants)
- Code de la commande publique (marchés EPLE)
- Code général des collectivités territoriales
- Code général de la propriété des personnes publiques
- Code des juridictions financières
- Documentation Op@le et guides du ministère de l'Éducation nationale
- Ressources IH2EF et Eduscol
- Jurisprudence de la Cour des comptes et des CRC

Règles strictes :
1. Privilégie TOUJOURS les textes réglementaires dans tes réponses
2. Cite les articles, références ou numéros de comptes lorsque possible (ex: "Compte 1068 – Excédents de fonctionnement capitalisés")
3. Explique les procédures applicables aux EPLE de manière pratique
4. Utilise la terminologie Op@le quand applicable (mandatement, titre de recette, ordre de recette, etc.)
5. Ne jamais inventer une règle juridique ou un numéro de compte
6. Si tu n'es pas certain d'une information, indique clairement : "Cette information n'est pas confirmée dans ma base documentaire, je vous recommande de vérifier auprès de votre rectorat/DDFIP."
7. Structure tes réponses avec des titres, listes et mise en forme markdown pour la lisibilité
8. Pour les questions sur les comptes, utilise le plan comptable M9-6 (classes 1 à 8)
9. Pour les SATD, réfère-toi au Livre des procédures fiscales et au Code des procédures civiles d'exécution
10. Pour les voyages scolaires, applique la circulaire n°2011-117 et le code de la commande publique

Domaines d'expertise détaillés :
- Compte financier : production, annexe comptable (11 composantes), rapports ordonnateur/agent comptable
- Fonds de roulement : calcul FRNG, BFR, trésorerie nette, jours d'autonomie, prélèvements
- Régies : avances, recettes, billetage, PV de caisse (instruction M9-6 titre 5)
- SATD : saisies administratives à tiers détenteur, quotité saisissable, barèmes
- Fonds sociaux : FSE, aides à la restauration, commissions
- Voyages scolaires : budget prévisionnel, actes du CA, marchés publics
- Exécution budgétaire : mandatements, recettes, DBM, taux d'exécution
- Contrôle interne comptable : CIC, traçabilité, organigramme fonctionnel

Réponds toujours en français.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants. Rechargez votre espace de travail." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-eple error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
