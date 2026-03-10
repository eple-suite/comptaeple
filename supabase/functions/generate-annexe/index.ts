import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { section, etablissement, resultats, indicateurs, historique, contexte } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const etab = etablissement;
    const R = resultats;
    const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

    const indBlock = indicateurs
      ? `Données de contexte : ${indicateurs.effectif_eleves || 0} élèves (${indicateurs.effectif_dp || 0} DP, ${indicateurs.effectif_internes || 0} internes, ${indicateurs.effectif_externes || 0} externes), ${indicateurs.effectif_boursiers || 0} boursiers, ${indicateurs.nb_repas_servis || 0} repas/an (coût denrées ${indicateurs.cout_denrees_repas || 0} €/repas), ${indicateurs.effectif_personnel || 0} personnel, ${indicateurs.etp_ressources_propres || 0} ETP ressources propres, surface ${indicateurs.surface_batiments || 0} m², eau ${indicateurs.conso_eau || 0} m³, gaz ${indicateurs.conso_gaz || 0} kWh, électricité ${indicateurs.conso_electricite || 0} kWh.`
      : '';

    const histBlock = historique && historique.length > 0
      ? `Historique pluriannuel :\n${historique.map((h: any) => `- ${h.exercice} : Résultat ${fmtEur(h.resultat_budgetaire)}, FDR ${fmtEur(h.fdr)}, BFR ${fmtEur(h.bfr)}, Tréso ${fmtEur(h.tresorerie)}, CAF ${fmtEur(h.caf)}, Réserves ${fmtEur(h.reserves)}, ${Math.round(h.jours_autonomie)} jours autonomie`).join('\n')}`
      : '';

    const ctxBlock = contexte
      ? `Éléments qualitatifs de l'utilisateur : ${contexte}`
      : '';

    const systemPrompt = `Tu es un expert-comptable spécialisé dans la comptabilité publique des EPLE, maîtrisant parfaitement l'instruction M9-6 2026 et le Décret GBCP 2012-1246. Tu rédiges l'annexe comptable obligatoire du compte financier. Ton style est institutionnel, précis et analytique. Tu ne te contentes pas de citer des chiffres : tu les interprètes et analyses les tendances. Par exemple, au lieu de "Le FDR est de 150 000 €", tu écris "Le fonds de roulement s'établit à 150 000 €, en progression de 12 % par rapport à N-1, sécurisant ainsi la capacité d'investissement de l'établissement." N'invente aucune donnée. Utilise uniquement les chiffres fournis.`;

    const sectionPrompts: Record<string, string> = {
      presentation: `Rédige la section "Présentation générale de l'établissement" de l'annexe comptable M9-6.
${etab.nom} — UAI ${etab.uai} — ${etab.type} — Exercice ${etab.exercice}
${etab.academie} — ${etab.regionAcademique}
Ordonnateur : ${etab.ordonnateur || '—'} — Agent comptable : ${etab.agentComptable || '—'}
${indBlock}
${ctxBlock}
Rédige 2-3 paragraphes décrivant l'établissement, son environnement, ses effectifs et les faits marquants de l'exercice. Style narratif et institutionnel.`,

      execution: `Rédige la section "Analyse de l'exécution budgétaire" de l'annexe comptable M9-6.
Résultat budgétaire : ${fmtEur(R.resultatBudgetaire)} (${R.resultatBudgetaire >= 0 ? 'excédent' : 'déficit'})
Mandatements (charges réelles) : ${fmtEur(R.totalChargesReel)} — Taux d'exécution : ${(R.tauxExecCharges * 100).toFixed(1)} %
Recettes comptabilisées : ${fmtEur(R.totalProduitsReel)} — Taux d'exécution : ${(R.tauxExecProduits * 100).toFixed(1)} %
Crédits ouverts : ${fmtEur(R.totalChargesPrev)} — Prévisions recettes : ${fmtEur(R.totalProduitsPrev)}
${histBlock}
${ctxBlock}
Rédige 2-3 paragraphes analysant l'exécution budgétaire avec interprétation des taux et comparaison pluriannuelle. Mentionne les plus ou moins-values et les crédits non consommés.`,

      patrimoine: `Rédige la section "Situation patrimoniale et financière" de l'annexe comptable M9-6.
FDR comptable : ${fmtEur(R.fdrComptable)}
BFR : ${fmtEur(R.bfr)}
Trésorerie nette : ${fmtEur(R.tresorerieNette)} — ${Math.round(R.joursAutonomie)} jours d'autonomie
CAF budgétaire : ${fmtEur(R.cafBudgetaire)} — CAF comptable : ${fmtEur(R.cafComptable)}
Résultat comptable : ${fmtEur(R.resultatComptable)}
Réserves (cpte 1068) : ${fmtEur(R.reserves || 0)}
Équation : FDR = BFR + Trésorerie → ${Math.abs(R.fdrComptable - R.bfr - R.tresorerieNette) < 0.05 ? 'Vérifié' : 'Écart'}
${histBlock}
${ctxBlock}
Rédige 3-4 paragraphes : analyse du FRNG (construction et évolution), analyse du BFR, analyse de la trésorerie (liquidité et solvabilité), analyse de la CAF/IAF. Interprète chaque indicateur et son évolution.`,

      srh: `Rédige la section "Service de restauration et d'hébergement (SRH)" de l'annexe comptable M9-6.
${indBlock}
${histBlock}
${ctxBlock}
Rédige 2 paragraphes : analyse de la gestion du SRH (coût denrées, fréquentation, taux d'occupation internat). Interprète les ratios et formule des recommandations si nécessaire.`,

      perspectives: `Rédige la section "Perspectives et recommandations" de l'annexe comptable M9-6.
Résultat budgétaire : ${fmtEur(R.resultatBudgetaire)}
FDR : ${fmtEur(R.fdrComptable)} — Trésorerie : ${fmtEur(R.tresorerieNette)} — ${Math.round(R.joursAutonomie)} jours
CAF : ${fmtEur(R.cafBudgetaire)}
Réserves : ${fmtEur(R.reserves || 0)}
${histBlock}
${ctxBlock}
Rédige 2-3 paragraphes de perspectives : capacité d'investissement, risques identifiés, recommandations pour l'exercice suivant. Conclus sur la viabilité financière.`,
    };

    const userPrompt = sectionPrompts[section] || sectionPrompts.presentation;

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
    console.error("generate-annexe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
