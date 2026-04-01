import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await verifyAuth(req);
  if (authError) return authError;
  try {
    const { section, etablissement, resultats, balanceSummary, indicateurs, historique, contexte, chargesComparative, produitsComparative } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const etab = etablissement;
    const R = resultats;
    const BS = balanceSummary || {};
    const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

    const indBlock = indicateurs
      ? `Données de contexte : ${indicateurs.effectif_eleves || 0} élèves (${indicateurs.effectif_dp || 0} DP, ${indicateurs.effectif_internes || 0} internes), ${indicateurs.effectif_boursiers || 0} boursiers, ${indicateurs.nb_repas_servis || 0} repas/an (coût denrées ${indicateurs.cout_denrees_repas || 0} €/repas), surface ${indicateurs.surface_batiments || 0} m², eau ${indicateurs.conso_eau || 0} €, gaz ${indicateurs.conso_gaz || 0} €, électricité ${indicateurs.conso_electricite || 0} €.`
      : '';

    const histBlock = historique && historique.length > 0
      ? `Historique pluriannuel :\n${historique.map((h: any) => `- ${h.exercice} : Résultat ${fmtEur(h.resultat_budgetaire)}, FDR ${fmtEur(h.fdr)}, BFR ${fmtEur(h.bfr)}, Tréso ${fmtEur(h.tresorerie)}, CAF ${fmtEur(h.caf)}, Réserves ${fmtEur(h.reserves)}`).join('\n')}`
      : '';

    const ctxBlock = contexte ? `Éléments qualitatifs : ${contexte}` : '';

    const chargesBlock = chargesComparative && chargesComparative.length > 0
      ? `Détail charges N vs N-1 :\n${chargesComparative.map((c: any) => `- ${c.name} : N=${fmtEur(c.N)}, N-1=${fmtEur(c['N-1'])}, variation=${fmtEur(c.variation)}`).join('\n')}`
      : '';

    const produitsBlock = produitsComparative && produitsComparative.length > 0
      ? `Détail produits N vs N-1 :\n${produitsComparative.map((p: any) => `- ${p.name} : N=${fmtEur(p.N)}, N-1=${fmtEur(p['N-1'])}, variation=${fmtEur(p.variation)}`).join('\n')}`
      : '';

    const systemPrompt = `Tu es un expert-comptable spécialisé dans la comptabilité publique des EPLE, maîtrisant parfaitement l'instruction M9-6 2026 et le Décret GBCP 2012-1246.

CONTEXTE : Tu rédiges l'annexe comptable officielle destinée au Rectorat (Dém'act) et au Juge des comptes (Infocentre). Document à valeur probante.

STYLE :
- Ton institutionnel, précis et analytique — adapté au contrôle de légalité.
- Interprète les chiffres, identifie les causes des variations, signale les points d'attention réglementaires.
- Cite les références M9-6 pertinentes.
- N'invente aucune donnée. Utilise uniquement les chiffres fournis.
- Structure avec des titres markdown (##, ###).`;

    const sectionPrompts: Record<string, string> = {
      // 1. Faits caractéristiques
      faitsCaracteristiques: `Rédige « 1. Faits caractéristiques de l'exercice » de l'annexe M9-6.
${etab.nom} — UAI ${etab.uai} — ${etab.type} — Exercice ${etab.exercice}
Ordonnateur : ${etab.ordonnateur || '—'} — Agent comptable : ${etab.agentComptable || '—'}
Résultat budgétaire : ${fmtEur(R.resultatBudgetaire)} | CAF : ${fmtEur(R.cafBudgetaire)} | FDR : ${fmtEur(R.fdrComptable)} | Trésorerie : ${fmtEur(R.tresorerieNette)}
${indBlock}
${histBlock}
${ctxBlock}
Synthétise les variations majeures de l'exercice : hausse/baisse des subventions, travaux, changements de personnel, événements marquants. 2-3 paragraphes.`,

      // 2. Principes comptables — DYNAMIQUE: s'adapte aux réalités de la balance
      principesComptables: `Rédige « 2. Principes, règles et méthodes comptables » de l'annexe M9-6.
${etab.nom} — ${etab.type} — Exercice ${etab.exercice}
Total immobilisations : ${fmtEur((BS.totalImmo20 || 0) + (BS.totalImmo21 || 0))} | Amortissements : ${fmtEur(BS.totalAmort28 || 0)}
Stocks : ${fmtEur((BS.stocks31 || 0) + (BS.stocks32 || 0))} | Provisions : ${fmtEur(BS.provisions15 || 0)}

CONSIGNE DYNAMIQUE — Adapte le contenu aux réalités de la balance :
${(BS.totalImmo20 || 0) + (BS.totalImmo21 || 0) > 0 ? '- IMMOBILISATIONS PRÉSENTES : détaille la méthode d\'amortissement linéaire et les durées par catégorie (mobilier 10 ans, matériel informatique 3-5 ans, véhicules 5 ans, bâtiments 25-50 ans).' : '- PAS D\'IMMOBILISATIONS : ne mentionne pas les méthodes d\'amortissement.'}
${(BS.stocks31 || 0) + (BS.stocks32 || 0) > 0 ? '- STOCKS PRÉSENTS : détaille la méthode d\'évaluation des stocks (PAMP ou coût moyen pondéré) et l\'inventaire physique.' : '- PAS DE STOCKS (comptes 31/32 à zéro) : ne mentionne PAS les méthodes de stock.'}
${(BS.provisions15 || 0) > 0 ? '- PROVISIONS PRÉSENTES : détaille les principes de provisionnement (risques et charges, dépréciations).' : '- PAS DE PROVISIONS : mentionne simplement qu\'aucune provision n\'a été constituée.'}
${(BS.cl8 || 0) > 0 ? '- ENGAGEMENTS HORS BILAN (classe 8) présents : mentionne les engagements et leur traitement.' : ''}

Génère un texte conforme M9-6 incluant :
- Référentiel comptable applicable (M9-6 2026, RGCP 2012-1246)
- Rattachement des charges et produits à l'exercice
- UNIQUEMENT les méthodes pertinentes selon les données ci-dessus
2-3 paragraphes.`,

      // 3. Actif immobilisé
      actifImmobilise: `Rédige « 3. Notes sur l'actif immobilisé et les amortissements » de l'annexe M9-6.
Immobilisations incorporelles (20*) : ${fmtEur(BS.totalImmo20)}
Immobilisations corporelles (21*) : ${fmtEur(BS.totalImmo21)}
Amortissements cumulés (28*) : ${fmtEur(BS.totalAmort28)}
Valeur nette : ${fmtEur((BS.totalImmo20 || 0) + (BS.totalImmo21 || 0) - (BS.totalAmort28 || 0))}
${histBlock}
${ctxBlock}
Analyse : mouvements d'entrée/sortie d'actifs, taux d'amortissement, immobilisations en cours. Cite M9-6 § III.3.`,

      // 4. Stocks
      stocks: `Rédige « 4. Notes sur les stocks » de l'annexe M9-6.
Stocks matières (31*) : ${fmtEur(BS.stocks31)} | Stocks marchandises (32*) : ${fmtEur(BS.stocks32)}
${ctxBlock}
Analyse : variation de stock, méthode d'évaluation, impact sur le résultat. Si les stocks sont nuls ou très faibles, indique-le. 1-2 paragraphes.`,

      // 5. Créances
      creances: `Rédige « 5. Notes sur les créances » de l'annexe M9-6.
Total créances cl.4 débitrices : ${fmtEur(BS.cl4Debiteurs)}
Créances douteuses (416) : ${fmtEur(BS.creancesDouteuses416)}
Provisions pour dépréciation (49*) : ${fmtEur(BS.provisions)}
${histBlock}
${ctxBlock}
Focus sur le compte 411. Génère une analyse par ancienneté : créances courantes vs créances anciennes non mouvementées. Mentionne les diligences de recouvrement et le provisionnement. Cite M9-6 § V.4. 2-3 paragraphes pour le juge des comptes.`,

      // 6. Dettes
      dettes: `Rédige « 6. Notes sur les dettes » de l'annexe M9-6.
Total dettes cl.4 créditrices : ${fmtEur(BS.cl4Crediteurs)}
${ctxBlock}
Détail des comptes 401 (fournisseurs) et des dettes fiscales/sociales (43*, 44*). Analyse les dettes anciennes non apurées. 2 paragraphes.`,

      // 7. Financements
      financements: `Rédige « 7. Notes sur les financements » de l'annexe M9-6.
Réserves (106*) : ${fmtEur(BS.reserves106)}
Subventions d'investissement (13*) : ${fmtEur(BS.subvInvest13)}
FDR : ${fmtEur(R.fdrComptable)} | BFR : ${fmtEur(R.bfr)} | Trésorerie : ${fmtEur(R.tresorerieNette)}
Jours d'autonomie : ${Math.round(R.joursAutonomie || 0)} j | CAF : ${fmtEur(R.cafBudgetaire)}
${R.prelevementsReserves ? `
PRÉLÈVEMENTS SUR RÉSERVES (DONNÉE DE PILOTAGE CRITIQUE) :
- Total prélèvements (mvt débiteurs 106*) : ${fmtEur(R.prelevementsReserves.totalPrelevements)}
- Dont investissement (section d'opérations en capital) : ${fmtEur(R.prelevementsReserves.prelevementsInvestissement)}
- Dont fonctionnement exceptionnel : ${fmtEur(R.prelevementsReserves.prelevementsFonctionnement)}
- Variation des réserves N vs N-1 : ${fmtEur(R.prelevementsReserves.variationReserves)}
- Cohérence FRNG/prélèvements : ${R.prelevementsReserves.coherent ? 'OK' : 'ÉCART DÉTECTÉ (' + fmtEur(R.prelevementsReserves.ecartFrngVsPrelevements) + ')'}
` : ''}
${histBlock}
${ctxBlock}
Analyse l'évolution des réserves, les prélèvements effectués et leur destination (investissement vs fonctionnement), le respect du seuil de 30 jours. Analyse l'amortissement des subventions d'investissement. Mentionne la phrase de synthèse sur les prélèvements. 3 paragraphes.`,

      // 8. Provisions
      provisions: `Rédige « 8. Notes sur les provisions » de l'annexe M9-6.
Provisions pour risques (15*) : ${fmtEur(BS.provisions15)}
Provisions pour dépréciation créances (49*) : ${fmtEur(BS.provisions)}
${ctxBlock}
Si des comptes 15* ou 68* (dotations) sont mouvementés, exige une note de justification juridique : nature du risque provisionné, base juridique, estimation du montant. Si aucune provision, indique-le et recommande si nécessaire. 1-2 paragraphes.`,

      // 9. Charges
      charges: `Rédige « 9. Notes sur les charges » de l'annexe M9-6.
Total charges (classe 6) : ${fmtEur(BS.totalCharges6)}
Mandatements : ${fmtEur(R.totalChargesReel)} — Taux d'exécution : ${((R.tauxExecCharges || 0) * 100).toFixed(1)} %
${chargesBlock}
${histBlock}
${ctxBlock}
Analyse comparative N/N-1 des charges : identifie les postes en forte hausse/baisse, explique les causes (hausse énergie, travaux, personnel). Cite M9-6 § IV. 2-3 paragraphes.`,

      // 10. Produits
      produits: `Rédige « 10. Notes sur les produits » de l'annexe M9-6.
Total produits (classe 7) : ${fmtEur(BS.totalProduits7)}
Recettes : ${fmtEur(R.totalProduitsReel)} — Taux d'exécution : ${((R.tauxExecProduits || 0) * 100).toFixed(1)} %
${produitsBlock}
${histBlock}
${ctxBlock}
Analyse des ressources propres et subventions : ventilation par nature, plus/moins-values de recettes, évolution des dotations. 2-3 paragraphes.`,

      // 11. Autres informations
      autresInfos: `Rédige « 11. Autres informations » de l'annexe M9-6.
Engagements hors bilan (classe 8) : ${fmtEur(BS.cl8 || 0)}
Trésorerie nette : ${fmtEur(R.tresorerieNette)} | Solde classe 5 : ${fmtEur(BS.cl5Solde || 0)}
${R.prelevementsReserves && R.prelevementsReserves.totalPrelevements > 0 ? `
PRÉLÈVEMENTS SUR RÉSERVES RÉALISÉS DURANT L'EXERCICE :
Total : ${fmtEur(R.prelevementsReserves.totalPrelevements)} (investissement : ${fmtEur(R.prelevementsReserves.prelevementsInvestissement)}, fonctionnement : ${fmtEur(R.prelevementsReserves.prelevementsFonctionnement)})
` : ''}
${ctxBlock}
Section libre : engagements hors bilan (marchés notifiés, baux), événements post-clôture (sinistres, litiges), informations complémentaires pour le juge. Mentionne le respect de l'unité de caisse. Si des prélèvements sur réserves ont eu lieu, inclus la synthèse. 1-2 paragraphes.`,
    };

    const userPrompt = sectionPrompts[section] || sectionPrompts.faitsCaracteristiques;

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
