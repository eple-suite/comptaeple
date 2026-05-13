
-- 1. Storage: accreditation-pieces — scope by establishment folder
DROP POLICY IF EXISTS accred_pieces_agent_select ON storage.objects;
DROP POLICY IF EXISTS accred_pieces_agent_insert ON storage.objects;

CREATE POLICY accred_pieces_agent_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'accreditation-pieces'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.user_has_establishment_access(
         auth.uid(),
         NULLIF((storage.foldername(name))[1], '')::uuid
       )
  )
);

CREATE POLICY accred_pieces_agent_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'accreditation-pieces'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.user_has_establishment_access(
         auth.uid(),
         NULLIF((storage.foldername(name))[1], '')::uuid
       )
  )
);

-- 2. habilitations_recapitulatif_annuel — scope by groupement
DROP POLICY IF EXISTS recap_authenticated_select ON public.habilitations_recapitulatif_annuel;
DROP POLICY IF EXISTS recap_agent_write ON public.habilitations_recapitulatif_annuel;
DROP POLICY IF EXISTS recap_agent_update ON public.habilitations_recapitulatif_annuel;

CREATE POLICY recap_groupement_select ON public.habilitations_recapitulatif_annuel
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    JOIN public.establishments e ON e.id = ue.establishment_id
    WHERE ue.user_id = auth.uid()
      AND e.groupement_id::text = habilitations_recapitulatif_annuel.groupement_id
  )
);

CREATE POLICY recap_groupement_insert ON public.habilitations_recapitulatif_annuel
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    JOIN public.establishments e ON e.id = ue.establishment_id
    WHERE ue.user_id = auth.uid()
      AND e.groupement_id::text = habilitations_recapitulatif_annuel.groupement_id
  )
);

CREATE POLICY recap_groupement_update ON public.habilitations_recapitulatif_annuel
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    JOIN public.establishments e ON e.id = ue.establishment_id
    WHERE ue.user_id = auth.uid()
      AND e.groupement_id::text = habilitations_recapitulatif_annuel.groupement_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_establishments ue
    JOIN public.establishments e ON e.id = ue.establishment_id
    WHERE ue.user_id = auth.uid()
      AND e.groupement_id::text = habilitations_recapitulatif_annuel.groupement_id
  )
);

-- 3. bottin_institutionnel — restrict to authenticated; writes admin-only
DROP POLICY IF EXISTS bottin_select ON public.bottin_institutionnel;
DROP POLICY IF EXISTS bottin_insert ON public.bottin_institutionnel;
DROP POLICY IF EXISTS bottin_update ON public.bottin_institutionnel;

CREATE POLICY bottin_select ON public.bottin_institutionnel
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY bottin_insert ON public.bottin_institutionnel
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY bottin_update ON public.bottin_institutionnel
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. arretes_actes — tighten INSERT
DROP POLICY IF EXISTS actes_insert ON public.arretes_actes;

CREATE POLICY actes_insert ON public.arretes_actes
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (establishment_id IS NOT NULL AND public.user_has_establishment_access(auth.uid(), establishment_id))
);

-- 5. user_is_entretien_party — remove broad establishment access
CREATE OR REPLACE FUNCTION public.user_is_entretien_party(_user_id uuid, _entretien_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.entretiens_professionnels e
    LEFT JOIN public.agents a ON a.id = e.agent_evalue_id
    WHERE e.id = _entretien_id
      AND (
        e.evaluateur_user_id = _user_id
        OR e.autorite_n2_user_id = _user_id
        OR a.email IN (SELECT email FROM auth.users WHERE id = _user_id)
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  );
$function$;

-- 6. Revoke public/anon execution on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.user_has_establishment_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_entretien_party(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.opale_user_can_view_fiche(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_unclaimed_establishment(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_create_establishment_with_uai(text) FROM PUBLIC, anon;
