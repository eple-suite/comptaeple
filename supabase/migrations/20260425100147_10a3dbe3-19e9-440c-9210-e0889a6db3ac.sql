
-- ════════════════════════════════════════════════════════════════
-- 1) Reseed mp_seuils_ccp avec valeurs officielles CCP 2026
-- ════════════════════════════════════════════════════════════════
DELETE FROM public.mp_seuils_ccp;

INSERT INTO public.mp_seuils_ccp
  (date_debut, date_fin, type_marche, seuil_dispense, seuil_mapa_publicite, seuil_formalisee, seuil_petits_lots, seuil_profil_acheteur, base_legale, commentaire)
VALUES
  ('2026-01-01','2026-03-31','fournitures_services',
     40000, 90000, 215000, 80000, 40000,
     'R2122-8 CCP (version antérieure au décret 2025-1386) ; seuil européen JOUE 01/01/2026 = 215 000 € HT pour autres pouvoirs adjudicateurs',
     'EPLE = autre pouvoir adjudicateur. Dispense maintenue à 40 000 € HT jusqu''au 31/03/2026.'),
  ('2026-01-01','2026-03-31','travaux',
     100000, 90000, 5382000, 1000000, 40000,
     'R2122-8 CCP — pérennisation décret 2025-1386 art. 2 ; seuil européen JOUE 01/01/2026 = 5 382 000 € HT travaux',
     'Dispense travaux 100 000 € HT pérennisée par le décret du 29/12/2025.'),
  ('2026-01-01',NULL,'fournitures_services_etat',
     40000, 90000, 143000, 80000, 40000,
     'R2124-1 CCP ; seuil européen JOUE 01/01/2026 = 143 000 € HT État central',
     'Référence pour information — non applicable aux EPLE.'),
  ('2026-04-01','2027-12-31','fournitures_services',
     60000, 90000, 215000, 80000, 40000,
     'R2122-8 CCP modifié par décret 2025-1386 du 29/12/2025 (entrée en vigueur 01/04/2026) ; seuil européen JOUE 01/01/2026 maintenu à 215 000 € HT',
     'Dispense rehaussée à 60 000 € HT — applicable à compter du 01/04/2026.'),
  ('2026-04-01','2027-12-31','travaux',
     100000, 90000, 5382000, 1000000, 40000,
     'R2122-8 CCP modifié par décret 2025-1386 ; seuil européen JOUE travaux 5 382 000 € HT',
     'Dispense travaux 100 000 € HT inchangée.'),
  ('2028-01-01',NULL,'fournitures_services',
     60000, 90000, 221000, 80000, 40000,
     'R2122-8 CCP ; seuil européen JOUE prévisionnel 01/01/2028 = 221 000 € HT',
     'Bascule biennale JOUE — seuils à actualiser dès parution règlement délégué.'),
  ('2028-01-01',NULL,'travaux',
     100000, 90000, 5538000, 1000000, 40000,
     'R2122-8 CCP ; seuil européen JOUE prévisionnel 01/01/2028 = 5 538 000 € HT travaux',
     'Bascule biennale JOUE — à actualiser.');

-- ════════════════════════════════════════════════════════════════
-- 2) Extension mp_marches_bdc existante
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.mp_marches_bdc
  ADD COLUMN IF NOT EXISTS objet text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_livraison_prevue date,
  ADD COLUMN IF NOT EXISTS date_reception date,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'mp_bdc_updated_at') THEN
    CREATE TRIGGER mp_bdc_updated_at BEFORE UPDATE ON public.mp_marches_bdc
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 3) Avenants
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mp_marches_avenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  objet text NOT NULL DEFAULT '',
  motif text NOT NULL DEFAULT '',
  montant_ht numeric NOT NULL DEFAULT 0,
  pct_initial numeric NOT NULL DEFAULT 0,
  date_signature date,
  date_effet date,
  statut text NOT NULL DEFAULT 'projet' CHECK (statut IN ('projet','signe','notifie','annule')),
  observations text NOT NULL DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_avenants_marche ON public.mp_marches_avenants(marche_id);
ALTER TABLE public.mp_marches_avenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MP avenants view" ON public.mp_marches_avenants;
CREATE POLICY "MP avenants view" ON public.mp_marches_avenants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_avenants.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DROP POLICY IF EXISTS "MP avenants manage" ON public.mp_marches_avenants;
CREATE POLICY "MP avenants manage" ON public.mp_marches_avenants FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_avenants.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_avenants.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'mp_avenants_updated_at') THEN
    CREATE TRIGGER mp_avenants_updated_at BEFORE UPDATE ON public.mp_marches_avenants
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 4) Reconductions
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mp_marches_reconductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  type text NOT NULL DEFAULT 'tacite' CHECK (type IN ('tacite','expresse')),
  duree_mois integer NOT NULL DEFAULT 12,
  date_effet date NOT NULL,
  date_decision date,
  decision text NOT NULL DEFAULT 'en_attente' CHECK (decision IN ('en_attente','reconduit','non_reconduit')),
  observations text NOT NULL DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_reconductions_marche ON public.mp_marches_reconductions(marche_id);
ALTER TABLE public.mp_marches_reconductions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MP reconductions view" ON public.mp_marches_reconductions;
CREATE POLICY "MP reconductions view" ON public.mp_marches_reconductions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_reconductions.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DROP POLICY IF EXISTS "MP reconductions manage" ON public.mp_marches_reconductions;
CREATE POLICY "MP reconductions manage" ON public.mp_marches_reconductions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_reconductions.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_reconductions.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'mp_reconductions_updated_at') THEN
    CREATE TRIGGER mp_reconductions_updated_at BEFORE UPDATE ON public.mp_marches_reconductions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 5) Sous-traitants (DC4)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mp_marches_sous_traitants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.mp_marches(id) ON DELETE CASCADE,
  raison_sociale text NOT NULL,
  siret text,
  prestations text NOT NULL DEFAULT '',
  montant_ht numeric NOT NULL DEFAULT 0,
  paiement_direct boolean NOT NULL DEFAULT true,
  rang integer NOT NULL DEFAULT 1,
  date_acceptation date,
  statut text NOT NULL DEFAULT 'projet' CHECK (statut IN ('projet','accepte','refuse','resilie')),
  observations text NOT NULL DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_sous_traitants_marche ON public.mp_marches_sous_traitants(marche_id);
ALTER TABLE public.mp_marches_sous_traitants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MP sous-traitants view" ON public.mp_marches_sous_traitants;
CREATE POLICY "MP sous-traitants view" ON public.mp_marches_sous_traitants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_sous_traitants.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DROP POLICY IF EXISTS "MP sous-traitants manage" ON public.mp_marches_sous_traitants;
CREATE POLICY "MP sous-traitants manage" ON public.mp_marches_sous_traitants FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_sous_traitants.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_marches m JOIN user_establishments ue ON ue.establishment_id = m.establishment_id
          WHERE m.id = mp_marches_sous_traitants.marche_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'mp_sous_traitants_updated_at') THEN
    CREATE TRIGGER mp_sous_traitants_updated_at BEFORE UPDATE ON public.mp_marches_sous_traitants
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 6) Groupements de commandes
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mp_groupements_commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordonnateur_establishment_id uuid NOT NULL,
  libelle text NOT NULL,
  perimetre_familles jsonb NOT NULL DEFAULT '[]'::jsonb,
  modalites_repartition text NOT NULL DEFAULT '',
  date_constitution date NOT NULL DEFAULT CURRENT_DATE,
  date_dissolution date,
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('projet','actif','dissous')),
  marche_id uuid REFERENCES public.mp_marches(id) ON DELETE SET NULL,
  observations text NOT NULL DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_groupements_coord ON public.mp_groupements_commandes(coordonnateur_establishment_id);
ALTER TABLE public.mp_groupements_commandes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.mp_groupements_membres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groupement_id uuid NOT NULL REFERENCES public.mp_groupements_commandes(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL,
  quote_part_pct numeric NOT NULL DEFAULT 0,
  montant_engage numeric NOT NULL DEFAULT 0,
  observations text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(groupement_id, establishment_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_groupements_membres_grp ON public.mp_groupements_membres(groupement_id);
ALTER TABLE public.mp_groupements_membres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MP groupements view" ON public.mp_groupements_commandes;
CREATE POLICY "MP groupements view" ON public.mp_groupements_commandes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_groupements_commandes.coordonnateur_establishment_id)
  OR EXISTS (SELECT 1 FROM mp_groupements_membres mb JOIN user_establishments ue
             ON ue.establishment_id = mb.establishment_id
             WHERE mb.groupement_id = mp_groupements_commandes.id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DROP POLICY IF EXISTS "MP groupements manage" ON public.mp_groupements_commandes;
CREATE POLICY "MP groupements manage" ON public.mp_groupements_commandes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_groupements_commandes.coordonnateur_establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_groupements_commandes.coordonnateur_establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'mp_groupements_updated_at') THEN
    CREATE TRIGGER mp_groupements_updated_at BEFORE UPDATE ON public.mp_groupements_commandes
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DROP POLICY IF EXISTS "MP groupements membres view" ON public.mp_groupements_membres;
CREATE POLICY "MP groupements membres view" ON public.mp_groupements_membres FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_groupements_membres.establishment_id)
  OR EXISTS (SELECT 1 FROM mp_groupements_commandes g JOIN user_establishments ue
             ON ue.establishment_id = g.coordonnateur_establishment_id
             WHERE g.id = mp_groupements_membres.groupement_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
DROP POLICY IF EXISTS "MP groupements membres manage" ON public.mp_groupements_membres;
CREATE POLICY "MP groupements membres manage" ON public.mp_groupements_membres FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM mp_groupements_commandes g JOIN user_establishments ue
          ON ue.establishment_id = g.coordonnateur_establishment_id
          WHERE g.id = mp_groupements_membres.groupement_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM mp_groupements_commandes g JOIN user_establishments ue
          ON ue.establishment_id = g.coordonnateur_establishment_id
          WHERE g.id = mp_groupements_membres.groupement_id AND ue.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ════════════════════════════════════════════════════════════════
-- 7) Archivage long terme
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mp_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid REFERENCES public.mp_marches(id) ON DELETE SET NULL,
  establishment_id uuid NOT NULL,
  reference text NOT NULL,
  libelle text NOT NULL,
  type_marche text NOT NULL,
  montant_ht numeric NOT NULL DEFAULT 0,
  date_notification date,
  duree_conservation_ans integer NOT NULL DEFAULT 10,
  date_destruction_prevue date,
  hash_sha256 text NOT NULL DEFAULT '',
  storage_path text NOT NULL DEFAULT '',
  manifeste jsonb NOT NULL DEFAULT '{}'::jsonb,
  full_text tsvector,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_archives_etab ON public.mp_archives(establishment_id);
CREATE INDEX IF NOT EXISTS idx_mp_archives_full ON public.mp_archives USING GIN(full_text);

ALTER TABLE public.mp_archives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MP archives view" ON public.mp_archives;
CREATE POLICY "MP archives view" ON public.mp_archives FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_archives.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
DROP POLICY IF EXISTS "MP archives manage" ON public.mp_archives;
CREATE POLICY "MP archives manage" ON public.mp_archives FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_archives.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = auth.uid()
          AND ue.establishment_id = mp_archives.establishment_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);
