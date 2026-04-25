
-- ============================================================
-- 1) Compléments entretiens_recours
-- ============================================================
ALTER TABLE public.entretiens_recours
  ADD COLUMN IF NOT EXISTS pieces_jointes_urls JSONB,
  ADD COLUMN IF NOT EXISTS date_avis_cap DATE,
  ADD COLUMN IF NOT EXISTS sens_avis_cap TEXT,
  ADD COLUMN IF NOT EXISTS date_decision_finale DATE,
  ADD COLUMN IF NOT EXISTS decision_finale TEXT,
  ADD COLUMN IF NOT EXISTS pdf_recours_url TEXT,
  ADD COLUMN IF NOT EXISTS user_saisie_id UUID;

-- ============================================================
-- 2) Compléments entretiens_fiches_poste
-- ============================================================
ALTER TABLE public.entretiens_fiches_poste
  ADD COLUMN IF NOT EXISTS agent_id UUID,
  ADD COLUMN IF NOT EXISTS corps_grade_cible TEXT,
  ADD COLUMN IF NOT EXISTS positionnement_hierarchique TEXT,
  ADD COLUMN IF NOT EXISTS contraintes_specificites TEXT,
  ADD COLUMN IF NOT EXISTS date_revision DATE,
  ADD COLUMN IF NOT EXISTS validee_par_user_id UUID,
  ADD COLUMN IF NOT EXISTS validee_le TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- ============================================================
-- 3) entretiens_etat_log — traçabilité transitions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entretiens_etat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id UUID NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_role TEXT,
  ancien_statut TEXT,
  nouveau_statut TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etat_log_entretien ON public.entretiens_etat_log(entretien_id, created_at DESC);

ALTER TABLE public.entretiens_etat_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view etat log"
ON public.entretiens_etat_log FOR SELECT
USING (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "Parties insert etat log"
ON public.entretiens_etat_log FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.user_is_entretien_party(auth.uid(), entretien_id));

-- Aucune policy UPDATE / DELETE => journal immuable

-- ============================================================
-- 4) entretiens_acces_log — RGPD
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entretiens_acces_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id UUID NOT NULL REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  consultant_user_id UUID NOT NULL,
  type_acces TEXT NOT NULL CHECK (type_acces IN ('lecture','telechargement','export_esteve','export_pdf','generation_pdf')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acces_log_entretien ON public.entretiens_acces_log(entretien_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acces_log_consultant ON public.entretiens_acces_log(consultant_user_id, created_at DESC);

ALTER TABLE public.entretiens_acces_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view all acces log"
ON public.entretiens_acces_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agent evalue voit son log"
ON public.entretiens_acces_log FOR SELECT
USING (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "Insert own acces log"
ON public.entretiens_acces_log FOR INSERT
WITH CHECK (auth.uid() = consultant_user_id);

-- ============================================================
-- 5) entretiens_export_esteve
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entretiens_export_esteve (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id UUID NOT NULL UNIQUE REFERENCES public.entretiens_professionnels(id) ON DELETE CASCADE,
  exported_by UUID NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  esteve_dossier_ref TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.entretiens_export_esteve ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view export esteve"
ON public.entretiens_export_esteve FOR SELECT
USING (public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "Parties insert export esteve"
ON public.entretiens_export_esteve FOR INSERT
WITH CHECK (auth.uid() = exported_by AND public.user_is_entretien_party(auth.uid(), entretien_id));

CREATE POLICY "Parties update export esteve"
ON public.entretiens_export_esteve FOR UPDATE
USING (public.user_is_entretien_party(auth.uid(), entretien_id));
