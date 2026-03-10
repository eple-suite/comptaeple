import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { type, etablissement, resultats, anomalies, bloquants, indicateurs, historique } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const etab = etablissement;
    const R = resultats;
    const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

    // Build context blocks
    const indBlock = indicateurs ? `\nDonnées de contexte : ${indicateurs.effectif_eleves || 0} élèves, ${indicateurs.effectif_boursiers || 0} boursiers, ${indicateurs.effectif_dp || 0} DP, ${indicateurs.effectif_internes || 0} internes, ${indicateurs.nb_repas_servis || 0} repas/an, ${indicateurs.effectif_personnel || 0} personnel, ${indicateurs.etp_ressources_propres || 0} ETP ressources propres, surface ${indicateurs.surface_batiments || 0} m².` : '';

    const histBlock = historique && historique.length > 0
      ? `\nHistorique pluriannuel :\n${historique.map((h: any) => `- ${h.exercice} : FDR ${fmtEur(h.fdr)}, Tréso ${fmtEur(h.tresorerie)}, CAF ${fmtEur(h.caf)}, Réserves ${fmtEur(h.reserves)}, ${Math.round(h.jours_autonomie)} jours`).join('\n')}`
      : '';

    let systemPrompt: string, userPrompt: string;

    if (type === 'ordonnateur') {
      systemPrompt = `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu rédiges des textes officiels pour le conseil d'administration. Style institutionnel, en français. N'invente pas de données. Intègre les indicateurs hors-comptables quand ils sont fournis.`;
      userPrompt = `Rédige deux paragraphes séparés par "---" pour le rapport de l'ordonnateur.\nPARAGRAPHE 1 — Présentation de l'établissement (4-6 lignes) :\n${etab.nom} — UAI ${etab.uai} — ${etab.type} — Ex. ${etab.exercice}\n${etab.academie}${indBlock}\nOrdonnateur : ${etab.ordonnateur}\n---\nPARAGRAPHE 2 — Points d'attention (4-6 lignes) :\nRésultat budgétaire : ${fmtEur(R.resultatBudgetaire)}\nFDR : ${fmtEur(R.fdrComptable)}\nTrésorerie : ${fmtEur(R.tresorerieNette)}\nCAF : ${fmtEur(R.cafBudgetaire)}\nCharges : ${fmtEur(R.totalChargesReel)} / Produits : ${fmtEur(R.totalProduitsReel)}${histBlock}`;
    } else {
      systemPrompt = `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu rédiges les observations de l'agent comptable. Style institutionnel, 4-5 paragraphes, sans liste à puces. N'invente pas de données. Intègre l'analyse du recouvrement, de la solvabilité et l'évolution pluriannuelle du FRNG quand les données historiques sont fournies.`;
      userPrompt = `Rédige les observations de l'agent comptable pour le compte financier ${etab.exercice}.\n${etab.nom} (${etab.uai})\nAgent comptable : ${etab.agentComptable}\nAnomalies : ${anomalies || 0} dont ${bloquants || 0} bloquant(s)\nRésultat budgétaire : ${fmtEur(R.resultatBudgetaire)}\nRésultat comptable : ${fmtEur(R.resultatComptable)}\nFDR : ${fmtEur(R.fdrComptable)}\nTrésorerie : ${fmtEur(R.tresorerieNette)}\nCAF comptable : ${fmtEur(R.cafComptable)}\nRéserves : ${fmtEur(R.reserves || 0)}\nJours d'autonomie : ${Math.round(R.joursAutonomie)}${indBlock}${histBlock}`;
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
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
