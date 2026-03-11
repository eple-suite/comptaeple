
-- Table principale des voyages scolaires
CREATE TABLE public.voyages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  pays TEXT NOT NULL DEFAULT 'France',
  intitule TEXT,
  date_depart DATE NOT NULL,
  date_retour DATE NOT NULL,
  nb_eleves INTEGER NOT NULL DEFAULT 0,
  nb_accompagnateurs INTEGER NOT NULL DEFAULT 0,
  budget_total NUMERIC NOT NULL DEFAULT 0,
  participation_familles NUMERIC NOT NULL DEFAULT 0,
  subventions NUMERIC NOT NULL DEFAULT 0,
  charge_etablissement NUMERIC NOT NULL DEFAULT 0,
  autofinancement NUMERIC NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'projet',
  -- Ventilation dépenses par nature (marchés publics)
  transport NUMERIC NOT NULL DEFAULT 0,
  hebergement NUMERIC NOT NULL DEFAULT 0,
  restauration NUMERIC NOT NULL DEFAULT 0,
  activites NUMERIC NOT NULL DEFAULT 0,
  assurance NUMERIC NOT NULL DEFAULT 0,
  divers NUMERIC NOT NULL DEFAULT 0,
  regie_avances NUMERIC NOT NULL DEFAULT 0,
  -- Infos pédagogiques
  professeur TEXT NOT NULL DEFAULT '',
  classe TEXT NOT NULL DEFAULT '',
  objectif_pedagogique TEXT DEFAULT '',
  -- Financement détaillé
  subvention_collectivite NUMERIC NOT NULL DEFAULT 0,
  subvention_etat NUMERIC NOT NULL DEFAULT 0,
  subvention_autre NUMERIC NOT NULL DEFAULT 0,
  -- Dates clés
  date_vote_ca TEXT DEFAULT '',
  date_limite_inscription TEXT DEFAULT '',
  -- Transport & hébergement
  transport_type TEXT DEFAULT 'bus',
  type_voyage TEXT DEFAULT 'pedagogique',
  code_activite_gfc TEXT DEFAULT '',
  lieu_depart TEXT DEFAULT '',
  horaires_depart TEXT DEFAULT '',
  horaires_retour TEXT DEFAULT '',
  moyen_transport TEXT DEFAULT '',
  type_hebergement TEXT DEFAULT '',
  contact_urgence TEXT DEFAULT '',
  tel_urgence TEXT DEFAULT '',
  -- Version brouillon/validé
  version_statut TEXT NOT NULL DEFAULT 'brouillon',
  validateur_id UUID,
  date_validation TIMESTAMP WITH TIME ZONE,
  observations TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participants (élèves)
CREATE TABLE public.voyage_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voyage_id UUID NOT NULL REFERENCES public.voyages(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  classe TEXT NOT NULL DEFAULT '',
  regime TEXT NOT NULL DEFAULT 'externe',
  responsable TEXT DEFAULT '',
  email_responsable TEXT DEFAULT '',
  tel_responsable TEXT DEFAULT '',
  participation_due NUMERIC NOT NULL DEFAULT 0,
  autorisation_parentale BOOLEAN NOT NULL DEFAULT false,
  fiche_sanitaire BOOLEAN NOT NULL DEFAULT false,
  assurance_rc BOOLEAN NOT NULL DEFAULT false,
  passeport BOOLEAN NOT NULL DEFAULT false,
  date_inscription DATE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Encaissements / Paiements
CREATE TABLE public.voyage_paiements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.voyage_participants(id) ON DELETE CASCADE,
  voyage_id UUID NOT NULL REFERENCES public.voyages(id) ON DELETE CASCADE,
  date_paiement DATE NOT NULL DEFAULT now(),
  montant NUMERIC NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'cheque',
  reference TEXT DEFAULT '',
  encaisse BOOLEAN NOT NULL DEFAULT false,
  fonds_social BOOLEAN NOT NULL DEFAULT false,
  observations TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alertes marchés publics (log des alertes)
CREATE TABLE public.voyage_marches_alertes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  exercice INTEGER NOT NULL,
  categorie TEXT NOT NULL,
  montant_cumule_ht NUMERIC NOT NULL DEFAULT 0,
  seuil_atteint TEXT NOT NULL,
  procedure_requise TEXT NOT NULL,
  notifie BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voyages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voyage_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voyage_paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voyage_marches_alertes ENABLE ROW LEVEL SECURITY;

-- RLS: voyages — via establishment link
CREATE POLICY "Users can view voyages of their establishments" ON public.voyages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyages.establishment_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert voyages" ON public.voyages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyages.establishment_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update voyages" ON public.voyages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyages.establishment_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete voyages" ON public.voyages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyages.establishment_id) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS: participants — via voyage
CREATE POLICY "Users can manage participants" ON public.voyage_participants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_participants.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS: paiements — via voyage
CREATE POLICY "Users can manage paiements" ON public.voyage_paiements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM voyages v JOIN user_establishments ue ON ue.establishment_id = v.establishment_id WHERE v.id = voyage_paiements.voyage_id AND ue.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS: alertes marchés
CREATE POLICY "Users can view marches alertes" ON public.voyage_marches_alertes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_marches_alertes.establishment_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert marches alertes" ON public.voyage_marches_alertes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = voyage_marches_alertes.establishment_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_voyages_establishment ON public.voyages(establishment_id);
CREATE INDEX idx_voyages_statut ON public.voyages(statut);
CREATE INDEX idx_voyage_participants_voyage ON public.voyage_participants(voyage_id);
CREATE INDEX idx_voyage_paiements_voyage ON public.voyage_paiements(voyage_id);
CREATE INDEX idx_voyage_paiements_participant ON public.voyage_paiements(participant_id);
CREATE INDEX idx_voyage_marches_alertes_establishment ON public.voyage_marches_alertes(establishment_id, exercice);

-- Trigger updated_at
CREATE TRIGGER update_voyages_updated_at BEFORE UPDATE ON public.voyages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
