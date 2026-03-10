import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { type, etablissement, resultats, anomalies, bloquants } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const etab = etablissement;
    const R = resultats;
    const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

    let systemPrompt: string, userPrompt: string;

    if (type === 'ordonnateur') {
      systemPrompt = `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu rédiges des textes officiels pour le conseil d'administration. Style institutionnel, en français. N'invente pas de données.`;
      userPrompt = `Rédige deux paragraphes séparés par "---" pour le rapport de l'ordonnateur.\nPARAGRAPHE 1 — Présentation de l'établissement (3-4 lignes) :\n${etab.nom} — UAI ${etab.uai} — ${etab.type} — Ex. ${etab.exercice}\n${etab.academie}\nOrdonnateur : ${etab.ordonnateur}\n---\nPARAGRAPHE 2 — Points d'attention (4-6 lignes) :\nRésultat budgétaire : ${fmtEur(R.resultatBudgetaire)}\nFDR : ${fmtEur(R.fdrComptable)}\nTrésorerie : ${fmtEur(R.tresorerieNette)}\nCAF : ${fmtEur(R.cafBudgetaire)}\nCharges : ${fmtEur(R.totalChargesReel)} / Produits : ${fmtEur(R.totalProduitsReel)}`;
    } else {
      systemPrompt = `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu rédiges les observations de l'agent comptable. Style institutionnel, 3-4 paragraphes, sans liste à puces. N'invente pas de données.`;
      userPrompt = `Rédige les observations de l'agent comptable pour le compte financier ${etab.exercice}.\n${etab.nom} (${etab.uai})\nAgent comptable : ${etab.agentComptable}\nAnomalies : ${anomalies || 0} dont ${bloquants || 0} bloquant(s)\nRésultat budgétaire : ${fmtEur(R.resultatBudgetaire)}\nRésultat comptable : ${fmtEur(R.resultatComptable)}\nFDR : ${fmtEur(R.fdrComptable)}\nTrésorerie : ${fmtEur(R.tresorerieNette)}\nCAF comptable : ${fmtEur(R.cafComptable)}\nRéserves : ${fmtEur(R.reserves || 0)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
