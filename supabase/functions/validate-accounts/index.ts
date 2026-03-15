import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { balanceData, indicators, establishmentName, year, validationType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un agent de validation comptable expert spécialisé dans les EPLE (nomenclature M9-6 2026, Op@le).

TON RÔLE : Tu dois VALIDER les données comptables et signaler TOUTE anomalie ou incohérence.

RÉFÉRENCES RÉGLEMENTAIRES QUE TU MAÎTRISES :
- Nomenclature M9-6 (2026) avec les comptes Op@le à 6 chiffres
- Décret n° 2012-1246 du 7 novembre 2012 (GBCP) — art. 18-20 (responsabilité AC), art. 42-43 (séparation ordonnateur/comptable), art. 195-199 (EPLE)
- Code de la commande publique — seuils 2026 (Décret n°2025-1386 du 29/12/2025) : <40k€ HT dispense (60k€ HT à compter du 01/04/2026), 40-90k€ HT procédure adaptée, ≥90k€ HT publicité BOAMP obligatoire, ≥216k€ HT procédure formalisée (seuil européen 2026-2027)
- Circuit des bourses nationales : 44311 → 468100 → 4112/4113 → 44312
- Circulaires rectorales types : EFA, créances impayées, CIC, SRH, régies, bourses

DISTINCTION CRITIQUE — COMPTES ÉTAT vs COLLECTIVITÉ :
⚠️ NE JAMAIS CONFONDRE :
- État (rectorat/DRFIP) : 4411, 44311, 44312, 4432, 4438, 468100, 7411, 131
- Collectivité (Région/Département) : 4412, 441220, 74121, 74122, 7413, 132
- Familles : 4112, 4113, 44312

OUTILS AC DE RÉFÉRENCE :
- REPROFI : profils financiers comparatifs
- Mobilisco : mobilité des AC
- Essatédé : suivi SATD / recouvrement forcé
- Effesco : effectifs restauration / crédit nourriture
- Op@le : progiciel comptable (ex-GFC/COFI)

SOLDES NORMAUX DE RÉFÉRENCE :
- Classe 1 (capitaux) : CRÉDITEUR (sauf 119 débiteur)
- Classe 2 (immobilisations) : DÉBITEUR (sauf 28 amortissements créditeur)
- Classe 3 (stocks) : DÉBITEUR
- Classe 4 (tiers) : VARIABLE selon le compte
  - 401 fournisseurs : CRÉDITEUR
  - 4112/4113 familles : DÉBITEUR (créances)
  - 416 créances douteuses : DÉBITEUR
  - 421 personnel : CRÉDITEUR
  - 4411 État : variable (avance=créditeur)
  - 4412 collectivité : variable
- Classe 5 (financiers) : DÉBITEUR (jamais négatif !)
- Classe 6 (charges) : DÉBITEUR
- Classe 7 (produits) : CRÉDITEUR

TU DOIS PRODUIRE :
1. 🔴 **ALERTES BLOQUANTES** — erreurs qui rendent le compte financier invalide
2. 🟠 **ALERTES MAJEURES** — anomalies qui nécessitent correction
3. 🟡 **POINTS D'ATTENTION** — éléments à surveiller
4. 🟢 **VALIDATIONS** — ce qui est conforme
5. ✅ **VERDICT FINAL** — Le compte financier peut-il être présenté au CA ?

Pour chaque alerte, indique :
- Le numéro de compte concerné
- La règle violée (M9-6 / Décret 2012-1246 / CCP)
- L'action corrective précise
- L'écriture comptable corrective si applicable

Sois INTRANSIGEANT sur la fiabilité. Un compte financier présenté au CA avec des erreurs engage la responsabilité de l'agent comptable.`;

    const userPrompt = validationType === "full"
      ? `VALIDATION COMPLÈTE du compte financier de "${establishmentName || 'EPLE'}" — Exercice ${year || '2024'}.

BALANCE COMPTABLE :
${JSON.stringify(balanceData, null, 2)}

INDICATEURS FINANCIERS :
${JSON.stringify(indicators || {}, null, 2)}

Effectue une validation exhaustive :
1. Équilibre de la balance
2. Soldes anormaux (chaque compte)
3. Cohérence FDR = Classe 1 + Classe 2 (solde net)
4. Cohérence Trésorerie = FDR - BFR
5. Circuit des bourses (44311/468100)
6. Distinction État/Collectivité
7. Amortissements ≤ Immobilisations brutes
8. Concordance ordonnateur/comptable
9. Taux de recouvrement
10. Jours de fonctionnement

VERDICT : Ce compte financier est-il présentable au CA ?`
      : `VALIDATION CIBLÉE — "${establishmentName || 'EPLE'}" — Exercice ${year || '2024'}.

Données :
${JSON.stringify(balanceData, null, 2)}

Vérifie les points spécifiques demandés et donne un avis.`;

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
      return new Response(JSON.stringify({ error: "Erreur du service de validation" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("validate-accounts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
