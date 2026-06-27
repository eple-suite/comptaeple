import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withExpertPersona } from "../_shared/expertEPLEPersona.ts";
import { corsHeaders } from "../_shared/cors.ts";

async function verifyAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
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
    const { balanceData, establishmentName, year } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un expert-comptable spécialisé dans la comptabilité publique des EPLE (Établissements Publics Locaux d'Enseignement) en France, utilisant le logiciel Op@le.
Tu maîtrises parfaitement la nomenclature M9-6 (instruction codificatrice du 19/01/2026).

RÈGLE FONDAMENTALE SUR LE SENS DES SOLDES M9-6 :
Les comptes d'amortissements (28x) et de dépréciations (29x, 39x, 49x, 59x) sont TOUJOURS CRÉDITEURS.
Ce sont des comptes de passif correcteur (diminution de l'actif). Un solde débiteur sur ces comptes est une erreur.
- La nomenclature M9-6 (2026) et le plan comptable des EPLE avec les comptes Op@le à 6 chiffres
- Les DEUX SPHÈRES Op@le : ordonnateur (classe 7 pour les recettes) et comptable (classe 4 pour les créances/dettes)
- Le sens normal des soldes de chaque compte

COMPTES SUBVENTIONS ÉTAT (sphère comptable) :
- 4411 : Subventions État à recevoir (CRÉDITEUR)
- 44311 : Bourses nationales — Crédit à répartir (CRÉDITEUR, avances État)
- 44312 : Bourses nationales — Part familles (DÉBITEUR, excédent à rembourser)
- 4432 : Primes et indemnités État
- 4438 : Fonds sociaux État (FSE, FSL)
- 468100 : Produits à répartir — Bourses (compte pivot entre 44311 et 4112/4113)

COMPTES SUBVENTIONS ÉTAT (sphère ordonnateur) :
- 7411 : Subventions État fonctionnement (CRÉDITEUR)

COMPTES SUBVENTIONS COLLECTIVITÉS (sphère comptable) :
- 4412 : Collectivités — Subventions à recevoir
- 441220 : Dotation globale de fonctionnement (Région/Département) — compte Op@le 6 chiffres

COMPTES SUBVENTIONS COLLECTIVITÉS (sphère ordonnateur) :
- 74121 : Subventions Région fonctionnement
- 74122 : Subventions Département fonctionnement
- 7413 : Subventions Communes/EPCI

COMPTES INVESTISSEMENT — Origine du financement (classe 1) :
- 131 : Subventions d'équipement État
- 132 : Subventions d'équipement Collectivités
- 134 : Subventions d'équipement Autres organismes
- 181 : Comptes de liaison investissement (entre sphères)
- 139 : Quote-part virée au CdR (neutralisation)

CIRCUIT DES BOURSES NATIONALES :
1. L'État verse une avance → Crédit 44311 (sphère comptable)
2. Répartition via 468100 → Débit 44311, Crédit 468100
3. Imputation sur créances familles → Débit 468100, Crédit 4112/4113
4. Excédent éventuel à rembourser aux familles → Débit 44312

Tu dois :
1. Analyser chaque ligne de la balance fournie
2. Identifier la sphère (ordonnateur/comptable) de chaque compte
3. Détecter les soldes anormaux (sens inverse du sens normal attendu)
4. Vérifier la cohérence entre les deux sphères
5. Vérifier que les comptes 4411 (État) et 4412 (collectivités) sont bien distingués
6. Vérifier le circuit des bourses : 44311/443110 ↔ 468100 ↔ 4112/4113 ↔ 44312/443120
7. Analyser les comptes de classe 1 (131, 132, 134, 181) pour l'origine du financement des investissements
8. Donner des préconisations concrètes et opérationnelles

RÈGLES IMPORTANTES :
- Le compte 185000 (liaison BP/BA) ne doit être analysé QUE si l'établissement possède un budget annexe (GRETA, CFA, SRH). Si aucun budget annexe n'est détecté dans la balance, NE PAS signaler de solde anormal sur 185000.
- Le compte 443110 (=44311 bourses crédit à répartir) est normalement CRÉDITEUR. Un solde débiteur temporaire est possible en cours d'exercice (bourses distribuées avant le versement de l'État). Ne signaler en anomalie critique que si c'est un solde de fin d'exercice.
- Le compte 443120 (=44312 bourses part familles) est normalement DÉBITEUR.
- Les comptes 43xxxx (organismes sociaux) sont normalement CRÉDITEURS.
- Les comptes de classe 18 (comptes de liaison) sont de sens MIXTE et ne doivent pas être systématiquement signalés comme anormaux.

Format ta réponse en markdown structuré avec :
## 🔴 Alertes critiques
## 🟠 Points d'attention  
## 🟢 Points positifs
## 📊 Analyse des subventions (État / Collectivités / Familles)
## 🔗 Vérification des circuits comptables (bourses, investissements)
## ⚖️ Cohérence ordonnateur/comptable
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
          { role: "system", content: withExpertPersona(systemPrompt) },
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
    return new Response(JSON.stringify({ error: "Erreur interne du service" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
