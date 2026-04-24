-- Trigger BEFORE UPDATE : refuse toute modification de contenu si statut verrouillé
CREATE OR REPLACE FUNCTION public.vs_enquetes_lock_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Suppression : bloquée si statut soumise/validée (admin uniquement)
  IF TG_OP = 'DELETE' THEN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);
    IF OLD.statut IN ('soumise', 'validee') AND NOT is_admin THEN
      RAISE EXCEPTION 'Enquête verrouillée (statut %): suppression interdite. Contactez un administrateur.', OLD.statut
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE : si l'ancien statut est verrouillé, on n'autorise que la transition de statut
  -- (validation/rejet par admin) + commentaires_rectorat + dates de validation.
  IF TG_OP = 'UPDATE' AND OLD.statut IN ('soumise', 'validee') THEN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);

    -- Détecte si des champs métier ont changé
    IF (NEW.donnees IS DISTINCT FROM OLD.donnees)
       OR (NEW.annee_scolaire IS DISTINCT FROM OLD.annee_scolaire)
       OR (NEW.periode IS DISTINCT FROM OLD.periode)
       OR (NEW.establishment_id IS DISTINCT FROM OLD.establishment_id)
    THEN
      RAISE EXCEPTION 'Enquête verrouillée (statut %): modification du contenu interdite. Demandez une réouverture à un administrateur.', OLD.statut
        USING ERRCODE = 'check_violation';
    END IF;

    -- Changement de statut : seul un admin peut valider/rejeter une enquête soumise
    IF NEW.statut IS DISTINCT FROM OLD.statut AND NOT is_admin THEN
      RAISE EXCEPTION 'Enquête verrouillée (statut %): seul un administrateur peut changer le statut.', OLD.statut
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vs_enquetes_lock_update ON public.vs_enquetes_rectorat;
CREATE TRIGGER vs_enquetes_lock_update
BEFORE UPDATE ON public.vs_enquetes_rectorat
FOR EACH ROW EXECUTE FUNCTION public.vs_enquetes_lock_check();

DROP TRIGGER IF EXISTS vs_enquetes_lock_delete ON public.vs_enquetes_rectorat;
CREATE TRIGGER vs_enquetes_lock_delete
BEFORE DELETE ON public.vs_enquetes_rectorat
FOR EACH ROW EXECUTE FUNCTION public.vs_enquetes_lock_check();

-- Contrainte de cohérence : statut limité à un ensemble fixe
ALTER TABLE public.vs_enquetes_rectorat
DROP CONSTRAINT IF EXISTS vs_enquetes_statut_valide;
ALTER TABLE public.vs_enquetes_rectorat
ADD CONSTRAINT vs_enquetes_statut_valide
CHECK (statut IN ('brouillon', 'soumise', 'validee', 'rejetee'));