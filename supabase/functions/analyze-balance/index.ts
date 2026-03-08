import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { balanceData, establishmentName, year } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un expert-comptable spécialisé dans la comptabilité publique des EPLE (Établissements Publics Locaux d'Enseignement) en France.
Tu maîtrises parfaitement :
- La nomenclature M9-6 (2026) et le plan comptable des EPLE
- Le sens normal des soldes de chaque compte
- Les interconnexions entre comptes (ex: 44311 bourses nationales ↔ 4112 familles DP)
- Les subventions État (443xx), collectivités (441x), et fonds sociaux (4438)
- Les principes de l'agent comptable : séparation ordonnateur/comptable, recouvrement, admission en non-valeur
- Les comptes de liaison et régularisation (467, 468, 471, 472)
- L'analyse du fonds de roulement, BFR, trésorerie

Tu dois :
1. Analyser chaque ligne de la balance fournie
2. Détecter les soldes anormaux (sens inverse du sens normal attendu)
3. Identifier les comptes inter-liés et vérifier la cohérence
4. Vérifier que les comptes de subventions (État/collectivités) sont correctement mouvementés
5. Détecter les comptes qui auraient dû être soldés en fin d'exercice (467, 47x...)
6. Vérifier la cohérence bourses : 44311 (crédit avances État) vs 4112 (débit familles)
7. Analyser le taux de provisionnement des créances douteuses (491 vs 416)
8. Vérifier que les amortissements (28x) sont cohérents avec les immobilisations (21x)
9. Donner des préconisations concrètes et opérationnelles

Format ta réponse en markdown structuré avec :
## 🔴 Alertes critiques
## 🟠 Points d'attention  
## 🟢 Points positifs
## 📊 Analyse des subventions (État / Collectivités / Familles)
## 🔗 Vérification des interconnexions comptables
## 💡 Préconisations opérationnelles

Sois précis, cite les numéros de comptes, et propose des écritures correctives si nécessaire.`;

    const userPrompt = `Voici la balance comptable de l'établissement "${establishmentName || 'EPLE'}" pour l'exercice ${year || '2023'}.

Analyse cette balance en profondeur selon la nomenclature M9-6 :

${JSON.stringify(balanceData, null, 2)}

Pour chaque compte :
- Vérifie le sens du solde (débiteur/créditeur) par rapport au sens normal M9-6
- Détecte les anomalies
- Identifie les interconnexions manquantes ou incohérentes
- Donne des préconisations opérationnelles précises`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service d'analyse" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-balance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
