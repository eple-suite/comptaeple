
DROP POLICY IF EXISTS "opale_cons_insert" ON public.opale_fiches_consultations;
CREATE POLICY "opale_cons_insert" ON public.opale_fiches_consultations
FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "opale_log_insert" ON public.opale_acces_log;
CREATE POLICY "opale_log_insert" ON public.opale_acces_log
FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());
