-- Articles pédagogiques (guides par module)
CREATE TABLE public.aide_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  niveau TEXT NOT NULL CHECK (niveau IN ('debutant', 'confirme', 'expert', 'transverse')),
  titre TEXT NOT NULL,
  resume TEXT,
  contenu_md TEXT NOT NULL,
  references_legales JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  ordre INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0',
  source_canonique BOOLEAN NOT NULL DEFAULT true,
  date_maj TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aide_articles_module ON public.aide_articles(module);
CREATE INDEX idx_aide_articles_niveau ON public.aide_articles(niveau);
CREATE INDEX idx_aide_articles_tags ON public.aide_articles USING GIN(tags);

ALTER TABLE public.aide_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aide articles lisibles par tous les authentifiés"
  ON public.aide_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Aide articles modifiables par admin"
  ON public.aide_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Glossaire
CREATE TABLE public.aide_glossaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terme TEXT NOT NULL UNIQUE,
  acronyme TEXT,
  definition TEXT NOT NULL,
  references_legales JSONB NOT NULL DEFAULT '[]'::jsonb,
  voir_aussi TEXT[] NOT NULL DEFAULT '{}',
  modules TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aide_glossaire_terme ON public.aide_glossaire(terme);

ALTER TABLE public.aide_glossaire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Glossaire lisible par tous les authentifiés"
  ON public.aide_glossaire FOR SELECT TO authenticated USING (true);
CREATE POLICY "Glossaire modifiable par admin"
  ON public.aide_glossaire FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Modèles
CREATE TABLE public.aide_modeles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  module TEXT NOT NULL,
  type_doc TEXT NOT NULL,
  destinataire TEXT,
  fichier_url TEXT,
  description TEXT,
  references_legales JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aide_modeles_module ON public.aide_modeles(module);
CREATE INDEX idx_aide_modeles_type ON public.aide_modeles(type_doc);

ALTER TABLE public.aide_modeles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modèles lisibles par tous les authentifiés"
  ON public.aide_modeles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modèles modifiables par admin"
  ON public.aide_modeles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- FAQ
CREATE TABLE public.aide_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  reponse TEXT NOT NULL,
  module TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  frequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aide_faq_module ON public.aide_faq(module);
CREATE INDEX idx_aide_faq_tags ON public.aide_faq USING GIN(tags);

ALTER TABLE public.aide_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQ lisible par tous les authentifiés"
  ON public.aide_faq FOR SELECT TO authenticated USING (true);
CREATE POLICY "FAQ modifiable par admin"
  ON public.aide_faq FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Suivi onboarding
CREATE TABLE public.aide_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parcours TEXT NOT NULL CHECK (parcours IN ('sg', 'ac', 'ordonnateur')),
  etape_courante INTEGER NOT NULL DEFAULT 0,
  etapes_completes INTEGER[] NOT NULL DEFAULT '{}',
  termine BOOLEAN NOT NULL DEFAULT false,
  date_debut TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_fin TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, parcours)
);

ALTER TABLE public.aide_onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Onboarding personnel : lecture"
  ON public.aide_onboarding_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Onboarding personnel : insert"
  ON public.aide_onboarding_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Onboarding personnel : update"
  ON public.aide_onboarding_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_aide_articles_updated
  BEFORE UPDATE ON public.aide_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_aide_glossaire_updated
  BEFORE UPDATE ON public.aide_glossaire
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_aide_onboarding_updated
  BEFORE UPDATE ON public.aide_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();