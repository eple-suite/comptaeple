-- Re-grant EXECUTE so RLS policies can call has_role internally
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;

-- Revoke from anon only (prevent unauthenticated enumeration)
REVOKE EXECUTE ON FUNCTION public.has_role FROM anon;
