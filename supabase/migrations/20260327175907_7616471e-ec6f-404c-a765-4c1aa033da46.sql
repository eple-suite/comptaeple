
-- 1) Add identity columns to establishments
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS ordonnateur text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS agent_comptable text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS secretaire_general text NOT NULL DEFAULT '';

-- 2) Create cofieple_snapshots table for backend persistence of CSV data + results
CREATE TABLE public.cofieple_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uai text NOT NULL,
  exercice integer NOT NULL,
  budget_type text NOT NULL DEFAULT 'principal',
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, uai, exercice, budget_type)
);

-- 3) RLS on cofieple_snapshots
ALTER TABLE public.cofieple_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.cofieple_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON public.cofieple_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots"
  ON public.cofieple_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots"
  ON public.cofieple_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4) Budget annexe linking table
CREATE TABLE public.establishment_annexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  annexe_establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  budget_type text NOT NULL DEFAULT 'annexe_greta',
  compte_185_solde numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(support_establishment_id, annexe_establishment_id)
);

ALTER TABLE public.establishment_annexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view annexes of their establishments"
  ON public.establishment_annexes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND (ue.establishment_id = establishment_annexes.support_establishment_id
          OR ue.establishment_id = establishment_annexes.annexe_establishment_id)
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can insert annexes"
  ON public.establishment_annexes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id = establishment_annexes.support_establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update annexes"
  ON public.establishment_annexes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id = establishment_annexes.support_establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete annexes"
  ON public.establishment_annexes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_establishments ue
      WHERE ue.user_id = auth.uid()
        AND ue.establishment_id = establishment_annexes.support_establishment_id
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 5) Updated_at trigger for snapshots
CREATE TRIGGER update_cofieple_snapshots_updated_at
  BEFORE UPDATE ON public.cofieple_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
