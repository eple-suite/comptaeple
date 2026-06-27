// En-têtes CORS partagés des Edge Functions.
// L'origine autorisée est pilotée par la variable d'environnement ALLOWED_ORIGIN
// (secret Supabase). Définir ALLOWED_ORIGIN = https://<domaine-prod> pour
// bloquer les autres origines (réponse sans en-tête CORS → 403 côté navigateur).
// À défaut (non définie), on conserve "*" pour ne pas casser l'application.
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin",
};
