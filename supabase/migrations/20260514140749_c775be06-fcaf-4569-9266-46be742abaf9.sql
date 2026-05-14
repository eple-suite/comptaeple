
-- 1) Remove email-based bypass in user_is_entretien_party
CREATE OR REPLACE FUNCTION public.user_is_entretien_party(_user_id uuid, _entretien_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.entretiens_professionnels e
    WHERE e.id = _entretien_id
      AND (
        e.evaluateur_user_id = _user_id
        OR e.autorite_n2_user_id = _user_id
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  );
$function$;

-- 2) Remove self-link policy on user_establishments (admin invitation required now)
DROP POLICY IF EXISTS "Users can self-link to unclaimed establishments" ON public.user_establishments;

-- 3) Restrict null-establishment fiches de poste to admins
DROP POLICY IF EXISTS fiches_poste_select ON public.entretiens_fiches_poste;
DROP POLICY IF EXISTS fiches_poste_insert ON public.entretiens_fiches_poste;
DROP POLICY IF EXISTS fiches_poste_update ON public.entretiens_fiches_poste;

CREATE POLICY fiches_poste_select
  ON public.entretiens_fiches_poste
  FOR SELECT
  TO authenticated
  USING (
    (establishment_id IS NOT NULL AND user_has_establishment_access(auth.uid(), establishment_id))
    OR (partagee_groupement = true AND establishment_id IS NOT NULL)
    OR (establishment_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY fiches_poste_insert
  ON public.entretiens_fiches_poste
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (establishment_id IS NOT NULL AND user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY fiches_poste_update
  ON public.entretiens_fiches_poste
  FOR UPDATE
  TO authenticated
  USING (
    (establishment_id IS NOT NULL AND user_has_establishment_access(auth.uid(), establishment_id))
    OR (establishment_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  );
