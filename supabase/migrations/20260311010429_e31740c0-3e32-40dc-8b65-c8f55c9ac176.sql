
-- Table journal des imports (audit log) - lecture seule pour les utilisateurs
CREATE TABLE public.cofieple_import_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  uai text NOT NULL,
  opale_number text DEFAULT '',
  exercice integer NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL, -- 'sde', 'sdr', 'bal', 'sde1', 'sdr1', 'bal1'
  budget_type text NOT NULL DEFAULT 'principal',
  rows_count integer NOT NULL DEFAULT 0,
  result text NOT NULL, -- 'success', 'blocked_opale', 'blocked_exercice', 'blocked_colonnes', 'error'
  reject_reason text,
  file_uai_detected text,
  file_opale_detected text,
  file_exercice_detected integer,
  file_type_detected text, -- detected document type
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: users can only SELECT their own logs, INSERT their own logs, no UPDATE/DELETE
ALTER TABLE public.cofieple_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import logs"
  ON public.cofieple_import_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import logs"
  ON public.cofieple_import_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all import logs"
  ON public.cofieple_import_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_import_logs_user_uai ON public.cofieple_import_logs (user_id, uai, exercice);
