/**
 * Edge function : répartition automatique d'un texte libre vers la structure
 * CREP/CREF (annexes C9 et C9 bis du décret 2010-888).
 *
 * - Modèle : google/gemini-2.5-pro via Lovable AI Gateway (raisonnement fort)
 * - Tool calling pour garantir un JSON strict conforme au schéma
 * - Garde-fous anti-discrimination, anti-jugement personnel
 * - Pas d'invention : tout extrait doit être traçable au texte source
 */

import { verifyAuth } from "../_shared/verifyAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un secrétaire général d'EPLE expérimenté chargé de formaliser le CREP (Compte Rendu d'Entretien Professionnel) d'un agent BIATSS. Tu reçois en entrée un texte libre rédigé en vrac par le supérieur hiérarchique direct. Tu dois répartir le contenu dans la structure officielle du CREP (annexe C9 du décret 2010-888) sans inventer aucun élément qui ne figure pas dans le texte source.

RÈGLES ABSOLUES :
1. Tu ne crées JAMAIS d'information non présente dans le texte source. Si une rubrique n'a pas d'élément, tu la laisses vide avec la mention « non renseigné par l'évaluateur ».
2. Tu reformules dans un style administratif neutre et professionnel (3e personne, présent de l'indicatif, vocabulaire RH État).
3. Tu identifies les éléments factuels (réussites, comportements observés) et tu les distingues des opinions.
4. Tu n'utilises JAMAIS de termes péjoratifs, agressifs ou stigmatisants. Si le texte source contient des éléments négatifs, tu les reformules en termes professionnels (« axe de progrès », « point de vigilance », « à consolider »).
5. Tu identifies les compétences, qualités, défauts et tu les rattaches au sous-critère le plus pertinent du barème C.1, C.2, C.3, C.4.
6. Tu proposes un niveau (excellent / tres_bon / satisfaisant / a_developper / insuffisant) pour chaque sous-critère renseigné mais tu marques ton niveau de confiance (eleve / moyen / faible).
7. Tu rédiges une appréciation générale de synthèse (rubrique D) de 5 à 10 lignes maximum.
8. Pour le CREF, tu identifies les besoins de formation mentionnés et tu les classes en T1 / T2 / T3.
9. Tu signales explicitement tout élément qui ne peut PAS figurer dans un CREP officiel (jugements de valeur personnels, références à la vie privée, comparaisons avec d'autres agents, allusions discriminatoires, état de santé, opinions politiques/syndicales/religieuses) en les listant dans elements_a_retirer.
10. Tu retournes UNIQUEMENT le résultat structuré via l'appel d'outil — aucun texte libre.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "repartir_crep_cref",
    description: "Répartit le texte libre dans la structure officielle du CREP/CREF",
    parameters: {
      type: "object",
      properties: {
        objectifs_passes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              libelle: { type: "string" },
              atteinte: {
                type: "string",
                enum: ["atteint", "partiellement_atteint", "non_atteint", "sans_objet"],
              },
              commentaire: { type: "string" },
            },
            required: ["libelle", "atteinte", "commentaire"],
            additionalProperties: false,
          },
        },
        competences: {
          type: "object",
          properties: {
            C1_resultats: { $ref: "#/definitions/rubrique" },
            C2_competences_techniques: { $ref: "#/definitions/rubrique" },
            C3_qualites_personnelles: { $ref: "#/definitions/rubrique" },
            C4_encadrement: { $ref: "#/definitions/rubrique" },
          },
          required: [
            "C1_resultats",
            "C2_competences_techniques",
            "C3_qualites_personnelles",
            "C4_encadrement",
          ],
        },
        appreciation_generale: { type: "string" },
        perspectives: { type: "string" },
        objectifs_futurs_suggeres: {
          type: "array",
          items: {
            type: "object",
            properties: {
              libelle: { type: "string" },
              indicateur: { type: "string" },
              echeance: { type: "string" },
            },
            required: ["libelle", "indicateur", "echeance"],
          },
        },
        formation: {
          type: "object",
          properties: {
            bilan_periode: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  intitule: { type: "string" },
                  organisme: { type: "string" },
                  duree_heures: { type: "number" },
                  evaluation: {
                    type: "string",
                    enum: ["utile", "partiellement_utile", "non_utile"],
                  },
                  reinvestissement: { type: "string" },
                },
                required: ["intitule"],
              },
            },
            demandes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  intitule: { type: "string" },
                  categorie: { type: "string", enum: ["T1", "T2", "T3"] },
                  priorite: { type: "string", enum: ["haute", "moyenne", "basse"] },
                  fondement: {
                    type: "string",
                    enum: ["agent", "evaluateur", "consensuelle"],
                  },
                  extrait_source: { type: "string" },
                },
                required: ["intitule", "categorie", "priorite", "fondement"],
              },
            },
            projet_professionnel: { type: "string" },
          },
          required: ["bilan_periode", "demandes", "projet_professionnel"],
        },
        elements_a_retirer: {
          type: "array",
          items: {
            type: "object",
            properties: {
              extrait: { type: "string" },
              motif: { type: "string" },
            },
            required: ["extrait", "motif"],
          },
        },
        score_completude: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "objectifs_passes",
        "competences",
        "appreciation_generale",
        "perspectives",
        "objectifs_futurs_suggeres",
        "formation",
        "elements_a_retirer",
        "score_completude",
      ],
      definitions: {
        rubrique: {
          type: "object",
          properties: {
            synthese: { type: "string" },
            sous_criteres: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  critere: { type: "string" },
                  niveau: {
                    type: "string",
                    enum: [
                      "excellent",
                      "tres_bon",
                      "satisfaisant",
                      "a_developper",
                      "insuffisant",
                      "sans_objet",
                    ],
                  },
                  confiance: {
                    type: "string",
                    enum: ["eleve", "moyen", "faible"],
                  },
                  commentaire: { type: "string" },
                  extrait_source: { type: "string" },
                },
                required: ["critere", "niveau", "confiance", "commentaire"],
              },
            },
          },
          required: ["synthese", "sous_criteres"],
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authError = await verifyAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const texteAppreciation: string = (body.texte_appreciation ?? "").toString().trim();
    const texteFormation: string = (body.texte_formation ?? "").toString().trim();
    const contexteAgent = body.contexte_agent ?? {};

    if (!texteAppreciation && !texteFormation) {
      return new Response(
        JSON.stringify({ error: "Au moins un texte (appréciation ou formation) est requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY non configurée." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = `CONTEXTE AGENT (à utiliser uniquement pour mieux comprendre le poste, ne jamais inventer) :
${JSON.stringify(contexteAgent, null, 2)}

═══════════════════════════════════════════
TEXTE LIBRE — APPRÉCIATION (à répartir dans rubriques A/B/C/D)
═══════════════════════════════════════════
${texteAppreciation || "(non renseigné)"}

═══════════════════════════════════════════
TEXTE LIBRE — FORMATION (à répartir dans CREF F.1/F.4)
═══════════════════════════════════════════
${texteFormation || "(non renseigné)"}

Réponds UNIQUEMENT en appelant l'outil repartir_crep_cref avec les arguments structurés.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "repartir_crep_cref" } },
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Quota IA atteint. Réessayez dans quelques instants." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Crédits IA insuffisants. Veuillez recharger l'espace de travail." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const txt = await response.text();
      console.error("Gateway error", response.status, txt);
      return new Response(
        JSON.stringify({ error: `Erreur passerelle IA (${response.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const completion = await response.json();
    const toolCall = completion?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Le modèle n'a pas renvoyé d'appel d'outil." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("JSON parse failed", e);
      return new Response(
        JSON.stringify({ error: "JSON IA invalide." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ data: parsed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});