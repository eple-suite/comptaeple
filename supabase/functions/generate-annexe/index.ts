import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { section, etablissement, resultats, balanceSummary, indicateurs, historique, contexte } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const etab = etablissement;
    const R = resultats;
    const BS = balanceSummary || {};
    const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

    const indBlock = indicateurs
      ? `Données de contexte : ${indicateurs.effectif_eleves || 0} élèves (${indicateurs.effectif_dp || 0} DP, ${indicateurs.effectif_internes || 0} internes, ${indicateurs.effectif_externes || 0} externes), ${indicateurs.effectif_boursiers || 0} boursiers, ${indicateurs.nb_repas_servis || 0} repas/an (coût denrées ${indicateurs.cout_denrees_repas || 0} €/repas), ${indicateurs.effectif_personnel || 0} personnel, ${indicateurs.etp_ressources_propres || 0} ETP ressources propres, surface ${indicateurs.surface_batiments || 0} m², eau ${indicateurs.conso_eau || 0} €, gaz ${indicateurs.conso_gaz || 0} €, électricité ${indicateurs.conso_electricite || 0} €.`
      : '';

    const histBlock = historique && historique.length > 0
      ? `Historique pluriannuel :\n${historique.map((h: any) => `- ${h.exercice} : Résultat ${fmtEur(h.resultat_budgetaire)}, FDR ${fmtEur(h.fdr)}, BFR ${fmtEur(h.bfr)}, Tréso ${fmtEur(h.tresorerie)}, CAF ${fmtEur(h.caf)}, Réserves ${fmtEur(h.reserves)}, ${Math.round(h.jours_autonomie)} jours`).join('\n')}`
      : '';

    const ctxBlock = contexte ? `Éléments qualitatifs : ${contexte}` : '';

    const balBlock = BS
      ? `Synthèse balance classe 4 : Débiteurs Cl.4 = ${fmtEur(BS.cl4Debiteurs)}, Créditeurs Cl.4 = ${fmtEur(BS.cl4Crediteurs)}, Solde Cl.5 = ${fmtEur(BS.cl5Solde)}, Créances douteuses (416) = ${fmtEur(BS.creancesDouteuses416)}, Provisions (49*) = ${fmtEur(BS.provisions)}.`
      : '';

    const systemPrompt = `Tu es un expert-comptable spécialisé dans la comptabilité publique des EPLE, maîtrisant parfaitement l'instruction M9-6 2026 et le Décret GBCP 2012-1246.

CONTEXTE JURIDIQUE : Tu rédiges l'annexe comptable obligatoire destinée au Rectorat (Dém'act) et au Juge des comptes (Infocentre). Ce document a une valeur probante.

STYLE IMPÉRATIF :
- Ton institutionnel, précis et analytique — adapté au contrôle de légalité.
- Tu ne te contentes pas de citer des chiffres : tu les interprètes, identifies les causes des variations, et signales les points d'attention réglementaires.
- Tu cites les références M9-6 pertinentes (§ III, IV, V).
- Si des données de contexte (changement d'ordonnateur, travaux) sont fournies, utilise-les pour justifier les ruptures de séries statistiques.
- N'invente aucune donnée. Utilise uniquement les chiffres fournis.`;

    const sectionPrompts: Record<string, string> = {
      presentation: `Rédige la section "I. Présentation générale" de l'annexe comptable.
${etab.nom} — UAI ${etab.uai} — ${etab.type} — Exercice ${etab.exercice}
${etab.academie} — ${etab.regionAcademique || ''}
Ordonnateur : ${etab.ordonnateur || '—'} — Agent comptable : ${etab.agentComptable || '—'}
${indBlock}
${ctxBlock}
Rédige 2-3 paragraphes : présentation de l'établissement, environnement socio-éducatif, faits marquants. Mentionne les changements de direction s'ils sont fournis, car ils justifient des ruptures de gestion.`,

      execution: `Rédige la section "II. Analyse de l'exécution budgétaire".
Résultat budgétaire : ${fmtEur(R.resultatBudgetaire)} (${R.resultatBudgetaire >= 0 ? 'excédent' : 'déficit'})
Mandatements : ${fmtEur(R.totalChargesReel)} — Taux d'exécution charges : ${((R.tauxExecCharges || 0) * 100).toFixed(1)} %
Recettes : ${fmtEur(R.totalProduitsReel)} — Taux d'exécution produits : ${((R.tauxExecProduits || 0) * 100).toFixed(1)} %
Crédits ouverts : ${fmtEur(R.totalChargesPrev)} — Prévisions recettes : ${fmtEur(R.totalProduitsPrev)}
${histBlock}
${ctxBlock}
Rédige 2-3 paragraphes : analyse des taux d'exécution, crédits non consommés (reliquats), plus/moins-values de recettes. Compare à N-1 si disponible. Cite M9-6 § IV.1.`,

      patrimoine: `Rédige la section "III. Situation patrimoniale et financière".
FDR comptable : ${fmtEur(R.fdrComptable)} | BFR : ${fmtEur(R.bfr)} | Trésorerie nette : ${fmtEur(R.tresorerieNette)}
Jours d'autonomie : ${Math.round(R.joursAutonomie || 0)} jours (seuil prudentiel : 30 jours)
CAF budgétaire : ${fmtEur(R.cafBudgetaire)} — CAF comptable : ${fmtEur(R.cafComptable)}
Résultat comptable : ${fmtEur(R.resultatComptable)} | Réserves : ${fmtEur(R.reserves || 0)}
Immobilisations brutes : ${fmtEur(R.totalImmo || 0)} — Amortissements : ${fmtEur(R.totalAmortissements || 0)}
Vérification : FDR = BFR + Trésorerie → ${Math.abs((R.fdrComptable || 0) - (R.bfr || 0) - (R.tresorerieNette || 0)) < 1 ? 'Vérifié ✓' : 'Écart ⚠️'}
${histBlock}
${ctxBlock}
Rédige 3-4 paragraphes : construction du FRNG (haut et bas de bilan), analyse du BFR, analyse de la trésorerie (M9-6 § III.1), analyse de la CAF/IAF (M9-6 § IV.3). Interprète les évolutions pluriannuelles.`,

      srh: `Rédige la section "IV. SRH & Viabilisation".
${indBlock}
${histBlock}
${ctxBlock}
Rédige 2 paragraphes : analyse du SRH (coût denrées, fréquentation), ratios de viabilisation (fluides/m² si surface renseignée). Recommandations si ratios anormaux.`,

      perspectives: `Rédige la section "V. Perspectives et recommandations".
Résultat : ${fmtEur(R.resultatBudgetaire)} | FDR : ${fmtEur(R.fdrComptable)} | Trésorerie : ${fmtEur(R.tresorerieNette)} | ${Math.round(R.joursAutonomie || 0)} jours
CAF : ${fmtEur(R.cafBudgetaire)} | Réserves : ${fmtEur(R.reserves || 0)}
${histBlock}
${ctxBlock}
Rédige 2-3 paragraphes : capacité d'investissement, risques identifiés pour le juge des comptes, recommandations. Conclus sur la soutenabilité financière.`,

      restesARecouvrer: `Rédige une note explicative sur les restes à recouvrer (apurement de la classe 4).
${balBlock}
${histBlock}
${ctxBlock}
Analyse :
- L'état des créances débitrices de la classe 4 et l'existence de créances anciennes non mouvementées.
- Le niveau des créances douteuses (compte 416) et leur provisionnement (compte 49*).
- Les diligences entreprises par l'agent comptable pour le recouvrement (M9-6 § V.4).
- Si des créances douteuses existent sans provision, signale l'anomalie.
Rédige 2-3 paragraphes analytiques à destination du juge des comptes.`,

      reserves: `Rédige une note explicative sur l'utilisation des réserves et les décisions de prélèvements.
Réserves (cpte 1068) : ${fmtEur(R.reserves || 0)}
Résultat comptable N : ${fmtEur(R.resultatComptable)}
FDR : ${fmtEur(R.fdrComptable)} — Jours d'autonomie : ${Math.round(R.joursAutonomie || 0)} j
${histBlock}
${ctxBlock}
Analyse :
- L'évolution du niveau des réserves sur 5 ans.
- La justification des prélèvements éventuels (investissement, fonctionnement exceptionnel).
- Le respect du seuil prudentiel de 30 jours d'autonomie après prélèvement.
- La conformité des décisions de prélèvement aux actes du Conseil d'Administration.
Rédige 2 paragraphes à destination du contrôleur rectoral et du juge.`,

      tresorerie: `Rédige une note explicative sur la situation de trésorerie et le respect de l'unité de caisse.
Trésorerie nette : ${fmtEur(R.tresorerieNette)} — ${Math.round(R.joursAutonomie || 0)} jours d'autonomie
Solde classe 5 (balance) : ${fmtEur(BS.cl5Solde || 0)}
FDR : ${fmtEur(R.fdrComptable)} | BFR : ${fmtEur(R.bfr)}
${histBlock}
${ctxBlock}
Analyse :
- La cohérence Trésorerie = FDR - BFR (M9-6 § III.1).
- Le respect du principe d'unité de caisse (pas de fonds hors comptabilité).
- L'existence de fonds de tiers (comptes 46*) et leur régularité.
- Les placements éventuels et leur conformité.
- Si la trésorerie est négative, analyse les causes et les risques.
Rédige 2-3 paragraphes à destination du juge des comptes.`,
    };

    const userPrompt = sectionPrompts[section] || sectionPrompts.presentation;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
