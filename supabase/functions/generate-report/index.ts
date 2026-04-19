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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await verifyAuth(req);
  if (authError) return authError;
  try {
    const { type, etablissement, resultats, anomalies, bloquants, indicateurs, historique, scopeDescription, detailLevel, systemPrompt: incomingSystemPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const jsonError = (status: number, error: string, code?: string) =>
      new Response(JSON.stringify({ error, code }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const etab = etablissement || {};
    const R = resultats || {};
    const toNum = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : 0);
    const fmtEur = (n: unknown) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(toNum(n));
    const fmtPct = (n: unknown) => `${toNum(n).toFixed(2)}%`;

    const indBlock = indicateurs ? `\nDonnées de contexte : ${indicateurs.effectif_eleves || 0} élèves, ${indicateurs.effectif_boursiers || 0} boursiers, ${indicateurs.effectif_dp || 0} DP, ${indicateurs.effectif_internes || 0} internes, ${indicateurs.nb_repas_servis || 0} repas/an, ${indicateurs.effectif_personnel || 0} personnel, ${indicateurs.etp_ressources_propres || 0} ETP ressources propres, surface ${indicateurs.surface_batiments || 0} m².` : '';

    const histBlock = historique && historique.length > 0
      ? `\nHistorique pluriannuel :\n${historique.map((h: any) => `- ${h.exercice} : FDR ${fmtEur(h.fdr)}, Tréso ${fmtEur(h.tresorerie)}, CAF ${fmtEur(h.caf)}, Réserves ${fmtEur(h.reserves)}, ${Math.round(h.jours_autonomie)} jours`).join('\n')}`
      : '';

    const buildFallbackReport = (reason: 'payment_required' | 'rate_limited') => {
      const reasonText = reason === 'payment_required'
        ? "Le service IA est momentanément indisponible (crédits épuisés)."
        : "Le service IA est momentanément indisponible (limite de requêtes atteinte).";

      // Préambule institutionnel — posture Agent Comptable Expert EPLE (GBCP / M9-6 / Op@le)
      const posturePreambule = `*Note de production : ce document est rédigé en mode de continuité automatique, dans le strict respect du cadre réglementaire applicable aux EPLE — décret n°2012-1246 (GBCP), instruction M9-6, code de l'éducation, ordonnance n°2022-408 et code de la commande publique. L'analyse ci-dessous est produite sous la responsabilité de l'agent comptable, garant de la régularité, de la sincérité et de la qualité comptable des écritures portées par Op@le.*\n\n`;

      if (type === 'ordonnateur') {
        return `${posturePreambule}${etab.nom || 'Établissement'} (${etab.uai || 'UAI non renseigné'}) — Exercice ${etab.exercice || 'N/A'}. ${reasonText} La présente synthèse automatique reprend les indicateurs financiers consolidés afin de sécuriser la continuité de production du rapport destiné au conseil d'administration, conformément aux articles R.421-58 et suivants du code de l'éducation. Le résultat budgétaire s'établit à ${fmtEur(R.resultatBudgetaire)}, avec un fonds de roulement de ${fmtEur(R.fdrComptable)} et une trésorerie nette de ${fmtEur(R.tresorerieNette ?? R.tresorerie)}.${indBlock}
---
Points d'attention (analyse de l'agent comptable) : la CAF/IAF budgétaire est de ${fmtEur(R.cafBudgetaire)}, les charges réelles s'élèvent à ${fmtEur(R.totalChargesReel)} et les produits réels à ${fmtEur(R.totalProduitsReel)}. Au regard du cadre M9-6 et du décret GBCP, le suivi des équilibres de court terme et de l'exécution budgétaire doit être poursuivi, en particulier sur les postes pouvant affecter le besoin en fonds de roulement et la soutenabilité des prélèvements sur réserves (compte 1068). Toute mobilisation du fonds de roulement devra faire l'objet d'une délibération motivée du conseil d'administration.`;
      }

      if (type === 'agent_comptable') {
        return `Rapport généré en mode automatique de continuité. ${reasonText} Les observations ci-dessous sont produites à partir des données financières disponibles pour l'exercice ${etab.exercice || 'N/A'}.

Le résultat comptable s'établit à ${fmtEur(R.resultatComptable)}, pour un résultat budgétaire de ${fmtEur(R.resultatBudgetaire)}. La CAF/IAF comptable est de ${fmtEur(R.cafComptable)}, tandis que la CAF/IAF budgétaire atteint ${fmtEur(R.cafBudgetaire)}. Ces éléments traduisent la capacité d'autofinancement actuelle de l'établissement et orientent l'analyse de soutenabilité.

Le fonds de roulement est arrêté à ${fmtEur(R.fdrComptable)} (${Math.round(toNum(R.joursFdr))} jours), dont ${toNum(R.fdrPctEncaissee).toFixed(1)}% en part encaissée. Le FDR mobilisable est évalué à ${fmtEur(R.fdrMobilisable)}. Le besoin en fonds de roulement est de ${fmtEur(R.bfr)} et la trésorerie nette de ${fmtEur(R.tresorerieNette ?? R.tresorerie)} (${Math.round(toNum(R.joursTresorerie))} jours), avec cohérence de lecture entre les masses bilantielles.

Les indicateurs de gestion à court terme s'établissent à TMcap ${fmtPct(R.tmcap)} et TMnr ${fmtPct(R.tmnr)}. Les créances atteignent ${fmtEur(R.totalCreances)} et les dettes ${fmtEur(R.totalDettes)} ; les reliquats de subventions sont de ${fmtEur(R.reliquatsSubventions)}. Une vigilance est recommandée sur les délais de recouvrement et la dynamique des charges à payer.

Le patrimoine net comptable est de ${fmtEur(R.valeurNette)}, avec une variation annuelle de ${fmtEur(R.variationPatrimoine)}. Les réserves (c/1068) s'établissent à ${fmtEur(R.reserves)}. Les mouvements de réserves et leur affectation doivent être explicités dans la délibération du conseil d'administration conformément au cadre M9-6 et au décret 2012-1246.

Conclusion : l'établissement dispose d'un socle financier objectivé par les indicateurs ci-dessus. Il est proposé de maintenir un pilotage prudent de la trésorerie, de sécuriser le recouvrement des créances et de justifier précisément toute mobilisation du fonds de roulement dans les actes budgétaires à venir.`;
      }

      return `## Synthèse financière globale (mode automatique)

${reasonText} Cette analyse est produite automatiquement à partir des données disponibles.

### Situation d'ensemble
Le résultat budgétaire est de ${fmtEur(R.resultatBudgetaire)} et le résultat comptable de ${fmtEur(R.resultatComptable)}. Le fonds de roulement s'établit à ${fmtEur(R.fdrComptable)} (FDR mobilisable : ${fmtEur(R.fdrMobilisable)}). La trésorerie nette atteint ${fmtEur(R.tresorerieNette ?? R.tresorerie)} et le BFR est de ${fmtEur(R.bfr)}.

### Équilibres et risques
Les ratios de suivi court terme ressortent à TMcap ${fmtPct(R.tmcap)} et TMnr ${fmtPct(R.tmnr)}. Les créances (${fmtEur(R.totalCreances)}) et dettes (${fmtEur(R.totalDettes)}) appellent une attention particulière sur la qualité du recouvrement et la maîtrise des engagements.

### Trajectoire
La CAF/IAF comptable (${fmtEur(R.cafComptable)}) et budgétaire (${fmtEur(R.cafBudgetaire)}) doivent être suivies conjointement avec l'évolution des jours de couverture (FDR : ${Math.round(toNum(R.joursFdr))} ; trésorerie : ${Math.round(toNum(R.joursTresorerie))}).

### Actions prioritaires
- Vérifier les postes contribuant le plus aux tensions de trésorerie.
- Sécuriser le plan de recouvrement des créances anciennes.
- Prioriser les dépenses obligatoires et différer les charges non urgentes.
- Encadrer les prélèvements sur réserves par une trajectoire pluriannuelle.
- Présenter en CA un suivi mensuel des indicateurs de liquidité.`;
    };

    let resolvedSystemPrompt: string, userPrompt: string;

    if (type === 'ordonnateur') {
      resolvedSystemPrompt = `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu rédiges des textes officiels pour le conseil d'administration. Style institutionnel, en français. N'invente pas de données. Intègre les indicateurs hors-comptables quand ils sont fournis.`;
      userPrompt = `Rédige deux paragraphes séparés par "---" pour le rapport de l'ordonnateur.\nPARAGRAPHE 1 — Présentation de l'établissement (4-6 lignes) :\n${etab.nom} — UAI ${etab.uai} — ${etab.type} — Ex. ${etab.exercice}\n${etab.academie}${indBlock}\nOrdonnateur : ${etab.ordonnateur}\n---\nPARAGRAPHE 2 — Points d'attention (4-6 lignes) :\nRésultat budgétaire : ${fmtEur(R.resultatBudgetaire)}\nFDR : ${fmtEur(R.fdrComptable)}\nTrésorerie : ${fmtEur(R.tresorerieNette ?? R.tresorerie)}\nCAF : ${fmtEur(R.cafBudgetaire)}\nCharges : ${fmtEur(R.totalChargesReel)} / Produits : ${fmtEur(R.totalProduitsReel)}${histBlock}`;
    } else if (type === 'agent_comptable') {
      resolvedSystemPrompt = `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu rédiges le rapport financier de l'agent comptable sur le modèle REPROFI. Style institutionnel, prose soutenue, paragraphes développés. N'invente pas de données. N'utilise JAMAIS de listes à puces. Rédige en texte continu.

STRUCTURE OBLIGATOIRE du rapport (8-12 paragraphes, chacun développé sur 4-8 lignes) :

1. RÉSULTAT ET AUTOFINANCEMENT : analyse du résultat comptable, comparaison avec l'exercice précédent si historique disponible, explication des charges non décaissables et produits non encaissables, calcul et interprétation de la CAF/IAF.

2. FONDS DE ROULEMENT : niveau du FDR, jours d'autonomie de fonctionnement, composition (part encaissée = autonomie financière vs part non encaissée = créances), FDR mobilisable (hors stocks, créances anciennes, compte 416), rapprochement FDR haut/bas.

3. BESOIN EN FONDS DE ROULEMENT : explication du BFR négatif typique des EPLE (dégagement en FDR), signification (les reliquats de subventions excèdent les créances), vérification FDR = BFR + Trésorerie.

4. TRÉSORERIE : niveau, jours d'autonomie de décaissement, composition (autonomie financière, dépôts et cautions, règlements en attente, reliquats de subventions), rapprochement avec FDR et BFR.

5. CHARGES À PAYER ET RECOUVREMENT : taux moyen de charges à payer (TMcap), taux moyen de non-recouvrement (TMnr), analyse de la solvabilité.

6. PATRIMOINE : valeur résiduelle, variation annuelle, origines de financement (fonds propres vs subventions d'investissement).

7. CRÉANCES ET DETTES : état des créances par origine (État, collectivité, familles), état des dettes par type (fournisseurs, État, collectivité), reliquats de subventions non consommées.

8. RÉSERVES ET AFFECTATION : situation des comptes de réserves (c/1068), variation annuelle, prélèvements effectués, proposition d'affectation du résultat.

9. ÉVOLUTION PLURIANNUELLE (si historique fourni) : tendance du FDR, de la trésorerie, de la CAF, analyse de la trajectoire financière.

10. CONCLUSION : synthèse de la santé financière, points de vigilance, recommandations.

RÈGLES :
- Cite les montants exacts fournis (pas d'arrondi sauf jours)
- Compare systématiquement avec N-1 si les données historiques le permettent
- Mentionne les références M9-6 et le Décret 2012-1246 quand pertinent
- Si des prélèvements sur réserves ont été effectués, intègre obligatoirement la phrase de synthèse type
- Qualifie chaque indicateur (sain/vigilance/critique) selon les seuils M9-6`;

      const prelevBlock = R.prelevementsReserves && R.prelevementsReserves.totalPrelevements > 0
        ? `\nPRÉLÈVEMENTS SUR RÉSERVES :\nTotal : ${fmtEur(R.prelevementsReserves.totalPrelevements)}\nDont investissement : ${fmtEur(R.prelevementsReserves.prelevementsInvestissement)}\nDont fonctionnement : ${fmtEur(R.prelevementsReserves.prelevementsFonctionnement)}`
        : '';

      userPrompt = `Rédige le rapport financier complet de l'agent comptable pour le compte financier ${etab.exercice}.
${etab.nom} (${etab.uai}) — ${etab.type}
Agent comptable : ${etab.agentComptable}
Anomalies : ${anomalies || 0} dont ${bloquants || 0} bloquant(s)

INDICATEURS FINANCIERS :
- Résultat comptable : ${fmtEur(R.resultatComptable)}
- Résultat budgétaire : ${fmtEur(R.resultatBudgetaire)}
- Charges non décaissables (68+675) : ${fmtEur(R.chargesNonDecaissables || 0)}
- Produits non encaissables (78+775…) : ${fmtEur(R.produitsNonEncaissables || 0)}
- CAF/IAF comptable : ${fmtEur(R.cafComptable || 0)}
- CAF/IAF budgétaire : ${fmtEur(R.cafBudgetaire || 0)}
- FDR : ${fmtEur(R.fdrComptable)} (${Math.round(R.joursFdr || 0)} jours)
- FDR part encaissée : ${toNum(R.fdrPctEncaissee).toFixed(1)}% — part non encaissée : ${toNum(R.fdrPctNonEncaissee).toFixed(1)}%
- FDR mobilisable : ${fmtEur(R.fdrMobilisable || 0)}
- BFR : ${fmtEur(R.bfr || 0)}
- Trésorerie : ${fmtEur(R.tresorerieNette ?? R.tresorerie)} (${Math.round(toNum(R.joursTresorerie))} jours)
- TMcap : ${toNum(R.tmcap).toFixed(2)}%
- TMnr : ${toNum(R.tmnr).toFixed(2)}%
- Charges SDE : ${fmtEur(R.totalChargesReel)}
- Produits SDR : ${fmtEur(R.totalProduitsReel)}
- Créances totales : ${fmtEur(R.totalCreances || 0)}
- Dettes totales : ${fmtEur(R.totalDettes || 0)}
- Reliquats subventions : ${fmtEur(R.reliquatsSubventions || 0)}
- Patrimoine (valeur nette) : ${fmtEur(R.valeurNette || 0)}
- Variation patrimoine : ${fmtEur(R.variationPatrimoine || 0)}
- Origines patrimoine : fonds propres ${toNum(R.patrimoineOriginesPctFP).toFixed(1)}%
- Réserves (c/1068) : ${fmtEur(R.reserves || 0)}
- Jours autonomie : ${Math.round(toNum(R.joursAutonomie))}${prelevBlock}${indBlock}${histBlock}`;
    } else if (type === 'analyse_ia_globale') {
      resolvedSystemPrompt = typeof incomingSystemPrompt === 'string' && incomingSystemPrompt.trim().length > 0
        ? incomingSystemPrompt
        : `Tu es expert en comptabilité publique française EPLE, M9-6 2026 et Décret 2012-1246. Tu produis une analyse structurée, pédagogique et exploitable en réunion.`;

      userPrompt = `Rédige une analyse financière globale en français, structurée en sections avec titres courts, sans inventer de données.

Établissement : ${etab?.nom || 'N/A'} (${etab?.uai || 'N/A'}) — Exercice ${etab?.exercice || 'N/A'}
Périmètre demandé : ${scopeDescription || 'global'}
Niveau de détail : ${detailLevel || 'standard'}
Anomalies : ${toNum(anomalies)} (dont bloquants : ${toNum(bloquants)})

Indicateurs clés :
- Résultat budgétaire : ${fmtEur(R.resultatBudgetaire)}
- Résultat comptable : ${fmtEur(R.resultatComptable)}
- FDR : ${fmtEur(R.fdrComptable)}
- FDR mobilisable : ${fmtEur(R.fdrMobilisable)}
- BFR : ${fmtEur(R.bfr)}
- Trésorerie : ${fmtEur(R.tresorerieNette ?? R.tresorerie)}
- CAF/IAF comptable : ${fmtEur(R.cafComptable)}
- CAF/IAF budgétaire : ${fmtEur(R.cafBudgetaire)}
- Jours FDR : ${Math.round(toNum(R.joursFdr))}
- Jours trésorerie : ${Math.round(toNum(R.joursTresorerie))}
- TMcap : ${toNum(R.tmcap).toFixed(2)} %
- TMnr : ${toNum(R.tmnr).toFixed(2)} %
- Créances : ${fmtEur(R.totalCreances)}
- Dettes : ${fmtEur(R.totalDettes)}
- Reliquats subventions : ${fmtEur(R.reliquatsSubventions)}

Contrainte : termine avec un bloc "Actions prioritaires" en 5 points maximum.`;
    } else {
      return jsonError(400, "Type de rapport non supporté", "invalid_type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: withExpertPersona(resolvedSystemPrompt) }, { role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({
          text: buildFallbackReport('rate_limited'),
          fallback: true,
          code: 'rate_limited',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          text: buildFallbackReport('payment_required'),
          fallback: true,
          code: 'payment_required',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return jsonError(500, "Erreur du service IA", "ai_gateway_error");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: "Erreur interne du service" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
