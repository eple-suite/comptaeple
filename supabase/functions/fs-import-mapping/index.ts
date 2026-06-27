import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAuth } from "../_shared/verifyAuth.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Champs cibles de la table fs_eleves (snake_case Postgres).
 * `null` = colonne ignorée à l'import.
 */
const TARGET_FIELDS = [
  "nom",
  "prenom",
  "classe",
  "niveau",
  "filiere",
  "voie",
  "ine",
  "date_naissance",
  "demi_pensionnaire",
  "interne",
  "statut_boursier",
  "echelon_bourse",
  "responsable_nom",
  "responsable_email",
  "responsable_telephone",
  "adresse_rue",
  "adresse_cp",
  "adresse_ville",
] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authError = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { headers, sample } = await req.json();
    if (!Array.isArray(headers) || headers.length === 0) {
      return json({ error: "headers (string[]) requis" }, 400);
    }
    if (!Array.isArray(sample)) {
      return json({ error: "sample (array) requis" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY manquant" }, 500);

    const systemPrompt = `Tu es un assistant qui mappe des en-têtes de colonnes d'un fichier CSV/Excel d'élèves (extrait de SIECLE, PRONOTE, ou tableurs Excel libres) vers les champs canoniques d'une base de données EPLE.

Champs cibles disponibles : ${TARGET_FIELDS.join(", ")}.

Règles :
- Pour chaque en-tête source, propose le champ cible le plus probable, ou null si aucun ne convient.
- Reconnais les variations courantes : "NOM", "Nom de famille", "lastname" → nom ; "Prénom" → prenom ; "Division" → classe ; "Code INE", "INE_RNIE" → ine ; "Demi-pension", "DP" → demi_pensionnaire ; "Boursier" → statut_boursier ; "Échelon" → echelon_bourse ; "Mail responsable" → responsable_email ; etc.
- Donne une "confiance" entre 0 et 1 (1.0 = mapping certain).
- Réponds UNIQUEMENT via l'appel d'outil propose_mapping.`;

    const userPrompt = `En-têtes : ${JSON.stringify(headers)}
Échantillon (5 premières lignes) : ${JSON.stringify(sample.slice(0, 5))}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "propose_mapping",
              description: "Renvoie le mapping proposé en-tête source → champ cible.",
              parameters: {
                type: "object",
                properties: {
                  mappings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source: { type: "string", description: "En-tête source du fichier" },
                        target: {
                          type: ["string", "null"],
                          enum: [...TARGET_FIELDS, null],
                          description: "Champ cible canonique ou null",
                        },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                      },
                      required: ["source", "target", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["mappings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "propose_mapping" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "rate_limited" }, 429);
    if (aiResp.status === 402) return json({ error: "credits_exhausted" }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "ai_gateway_error" }, 500);
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "no_tool_call", raw: data }, 500);

    const args = JSON.parse(toolCall.function.arguments);
    return json({ mappings: args.mappings, target_fields: TARGET_FIELDS });
  } catch (e) {
    console.error("fs-import-mapping error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}