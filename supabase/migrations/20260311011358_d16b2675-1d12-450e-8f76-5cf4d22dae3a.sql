
-- Audit trail table for COFIEPLE module (immutable: INSERT + SELECT only)
CREATE TABLE public.cofieple_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  uai text NOT NULL,
  exercice integer NOT NULL,
  action_type text NOT NULL, -- 'import', 'edit_note', 'generate_ai', 'validate', 'export_pdf', 'export_csv'
  action_detail text NOT NULL DEFAULT '',
  section_id text, -- for annexe note edits
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: immutable (no UPDATE, no DELETE)
ALTER TABLE public.cofieple_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own audit logs"
  ON public.cofieple_audit_trail FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own audit logs"
  ON public.cofieple_audit_trail FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.cofieple_audit_trail FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast queries
CREATE INDEX idx_cofieple_audit_trail_user_uai ON public.cofieple_audit_trail (user_id, uai, exercice);
CREATE INDEX idx_cofieple_audit_trail_section ON public.cofieple_audit_trail (section_id, created_at DESC);
