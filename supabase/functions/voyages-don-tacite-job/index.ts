// ════════════════════════════════════════════════════════════════
// Job planifié — application du don tacite (règle 8 €)
// ────────────────────────────────────────────────────────────────
// Référence : LF n° 66-948 du 22/12/1966 art. 21
//             Circulaire MENE2407159C du 16/7/2024
//
// Pour chaque coupon-réponse 8 € dont la date_limite_reponse
// est dépassée et sans réponse de la famille :
//   1. on enregistre `reponse = don_tacite_silence`
//   2. on trace une alerte voyage (`vs_alertes`) niveau info
//      avec code stable `regle_8eur::don_tacite` et le détail
//      des familles concernées par voyage.
//
// Endpoint planifié : appelé chaque nuit par pg_cron / pg_net.
// ════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CouponRow {
  id: string;
  voyage_id: string;
  participant_id: string | null;
  ine: string | null;
  nom: string;
  prenom: string;
  montant_concerne: number;
  date_envoi: string;
  date_limite_reponse: string;
  reponse: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "configuration manquante" }, 500);
  }
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Mode dry-run : ?dry=1 → ne modifie rien, retourne seulement le compte
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const refIso = new Date().toISOString().slice(0, 10);

  // 1. Coupons éligibles : sans réponse + date_limite_reponse <= aujourd'hui
  const { data: pending, error: errFetch } = await sb
    .from("vs_coupons_8eur")
    .select("id, voyage_id, participant_id, ine, nom, prenom, montant_concerne, date_envoi, date_limite_reponse, reponse")
    .is("reponse", null)
    .lte("date_limite_reponse", refIso);

  if (errFetch) {
    console.error("[don-tacite-job] fetch:", errFetch.message);
    return jsonResponse({ error: errFetch.message }, 500);
  }

  const coupons = (pending || []) as CouponRow[];
  console.log(`[don-tacite-job] ${coupons.length} coupon(s) éligible(s) au ${refIso}`);

  if (coupons.length === 0) {
    return jsonResponse({
      ok: true,
      mode: dry ? "dry-run" : "applied",
      ref_date: refIso,
      coupons_traites: 0,
      voyages_concernes: 0,
      alertes_inserees: 0,
    });
  }

  // 2. Regrouper par voyage pour la trace d'alerte
  const byVoyage = new Map<string, CouponRow[]>();
  for (const c of coupons) {
    const arr = byVoyage.get(c.voyage_id) || [];
    arr.push(c);
    byVoyage.set(c.voyage_id, arr);
  }

  if (dry) {
    return jsonResponse({
      ok: true,
      mode: "dry-run",
      ref_date: refIso,
      coupons_traites: coupons.length,
      voyages_concernes: byVoyage.size,
      alertes_inserees: 0,
      detail: Array.from(byVoyage.entries()).map(([vid, arr]) => ({
        voyage_id: vid,
        nb: arr.length,
        montant_total: +arr.reduce((s, c) => s + Number(c.montant_concerne || 0), 0).toFixed(2),
      })),
    });
  }

  // 3. Application atomique par lot — bascule en don tacite
  const ids = coupons.map((c) => c.id);
  const { error: errUpdate } = await sb
    .from("vs_coupons_8eur")
    .update({ reponse: "don_tacite_silence", date_reponse: refIso })
    .in("id", ids);
  if (errUpdate) {
    console.error("[don-tacite-job] update:", errUpdate.message);
    return jsonResponse({ error: errUpdate.message }, 500);
  }

  // 4. Trace dans vs_alertes — une entrée par voyage
  let alertesInserees = 0;
  for (const [voyageId, arr] of byVoyage) {
    const montant = +arr.reduce((s, c) => s + Number(c.montant_concerne || 0), 0).toFixed(2);
    const familles = arr.map((c) => ({
      nom: c.nom,
      prenom: c.prenom,
      ine: c.ine,
      montant: Number(c.montant_concerne || 0),
      date_limite: c.date_limite_reponse,
    }));
    const { error: errAlert } = await sb.from("vs_alertes").insert({
      voyage_id: voyageId,
      code: "regle_8eur::don_tacite",
      niveau: "info",
      message: `Don tacite appliqué automatiquement à ${arr.length} famille${arr.length > 1 ? "s" : ""} (silence après délai). Montant total : ${montant.toFixed(2)} € à comptabiliser au C/7588.`,
      contexte: {
        ref_date: refIso,
        nb_coupons: arr.length,
        montant_total_eur: montant,
        familles,
        reference_legale: "LF 66-948 art. 21 / circ. MENE2407159C 16/7/2024",
        job: "voyages-don-tacite-job",
      },
    });
    if (errAlert) {
      console.warn(`[don-tacite-job] alerte voyage=${voyageId}:`, errAlert.message);
    } else {
      alertesInserees++;
    }
  }

  return jsonResponse({
    ok: true,
    mode: "applied",
    ref_date: refIso,
    coupons_traites: coupons.length,
    voyages_concernes: byVoyage.size,
    alertes_inserees: alertesInserees,
  });
});