
-- Table for voyage templates per establishment
CREATE TABLE public.voyage_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nom text NOT NULL,
  description text DEFAULT '',
  destination text NOT NULL DEFAULT '',
  pays text NOT NULL DEFAULT 'France',
  transport_type text DEFAULT 'bus',
  type_voyage text DEFAULT 'pedagogique',
  nb_eleves integer NOT NULL DEFAULT 0,
  nb_accompagnateurs integer NOT NULL DEFAULT 0,
  transport numeric NOT NULL DEFAULT 0,
  hebergement numeric NOT NULL DEFAULT 0,
  restauration numeric NOT NULL DEFAULT 0,
  activites numeric NOT NULL DEFAULT 0,
  assurance numeric NOT NULL DEFAULT 0,
  divers numeric NOT NULL DEFAULT 0,
  regie_avances numeric NOT NULL DEFAULT 0,
  participation_familles numeric NOT NULL DEFAULT 0,
  subvention_collectivite numeric NOT NULL DEFAULT 0,
  subvention_etat numeric NOT NULL DEFAULT 0,
  subvention_autre numeric NOT NULL DEFAULT 0,
  autofinancement numeric NOT NULL DEFAULT 0,
  service_ap text DEFAULT 'AP',
  domaine text DEFAULT '',
  code_activite_gfc text DEFAULT '',
  compte_classe7 text DEFAULT '706700',
  objectif_pedagogique text DEFAULT '',
  classe text DEFAULT '',
  echeances jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.voyage_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates of their establishments"
  ON public.voyage_templates FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_templates.establishment_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can insert templates"
  ON public.voyage_templates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_templates.establishment_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update own templates"
  ON public.voyage_templates FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_templates.establishment_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete templates"
  ON public.voyage_templates FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_templates.establishment_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger updated_at
CREATE TRIGGER update_voyage_templates_updated_at
  BEFORE UPDATE ON public.voyage_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
