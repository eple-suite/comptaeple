-- ═══════════════════════════════════════════════════════════════
-- Vues d'agrégation Enquête DGESCO Fonds Sociaux
-- L'année civile d'exercice = année de début de l'année scolaire
-- (ex : "2025-2026" -> 2025). Les vues s'appuient sur fs_decisions
-- et fs_eleves dont les RLS sont déjà définies.
-- ═══════════════════════════════════════════════════════════════

-- Vue Q7 : agrégation par voie + type_fonds
CREATE OR REPLACE VIEW public.v_enquete_q7 AS
SELECT
  d.establishment_id,
  d.annee_scolaire,
  (split_part(d.annee_scolaire, '-', 1))::int AS annee,
  e.voie,
  d.type_fonds,
  COUNT(DISTINCT d.eleve_id) AS beneficiaires,
  COUNT(DISTINCT CASE WHEN e.statut_boursier THEN d.eleve_id END) AS boursiers,
  SUM(d.montant) AS depenses,
  SUM(CASE WHEN e.statut_boursier THEN d.montant ELSE 0 END) AS depenses_boursiers
FROM public.fs_decisions d
JOIN public.fs_eleves e ON e.id = d.eleve_id
WHERE d.statut IN ('decide', 'mandate', 'paye')
GROUP BY d.establishment_id, d.annee_scolaire, e.voie, d.type_fonds;

-- Vue Q8 : bénéficiaires uniques par voie (FS+FSC = 1 fois)
CREATE OR REPLACE VIEW public.v_enquete_q8 AS
SELECT
  d.establishment_id,
  d.annee_scolaire,
  (split_part(d.annee_scolaire, '-', 1))::int AS annee,
  e.voie,
  COUNT(DISTINCT d.eleve_id) AS beneficiaires_uniques,
  COUNT(DISTINCT CASE WHEN e.statut_boursier THEN d.eleve_id END) AS boursiers_uniques
FROM public.fs_decisions d
JOIN public.fs_eleves e ON e.id = d.eleve_id
WHERE d.statut IN ('decide', 'mandate', 'paye')
  AND e.voie IN ('GT', 'PRO')
GROUP BY d.establishment_id, d.annee_scolaire, e.voie;

-- Vue Q10 : nature d'aide × modalité de versement
CREATE OR REPLACE VIEW public.v_enquete_q10 AS
SELECT
  d.establishment_id,
  d.annee_scolaire,
  (split_part(d.annee_scolaire, '-', 1))::int AS annee,
  d.nature_aide,
  COUNT(DISTINCT CASE WHEN d.modalite_versement = 'aide_directe' THEN d.eleve_id END) AS beneficiaires_aide_directe,
  COUNT(DISTINCT CASE WHEN d.modalite_versement = 'organisme_tiers' THEN d.eleve_id END) AS beneficiaires_via_tiers,
  SUM(CASE WHEN d.modalite_versement = 'aide_directe' THEN d.montant ELSE 0 END) AS montant_aide_directe,
  SUM(CASE WHEN d.modalite_versement = 'organisme_tiers' THEN d.montant ELSE 0 END) AS montant_via_tiers
FROM public.fs_decisions d
JOIN public.fs_eleves e ON e.id = d.eleve_id
WHERE d.statut IN ('decide', 'mandate', 'paye')
  AND e.voie IN ('GT', 'PRO')
GROUP BY d.establishment_id, d.annee_scolaire, d.nature_aide;

-- Vue Q11 : 1er degré
CREATE OR REPLACE VIEW public.v_enquete_q11 AS
SELECT
  d.establishment_id,
  d.annee_scolaire,
  (split_part(d.annee_scolaire, '-', 1))::int AS annee,
  d.type_fonds,
  COUNT(DISTINCT d.eleve_id) AS beneficiaires,
  COUNT(DISTINCT CASE WHEN e.statut_boursier THEN d.eleve_id END) AS boursiers,
  SUM(d.montant) AS depenses,
  SUM(CASE WHEN e.statut_boursier THEN d.montant ELSE 0 END) AS depenses_boursiers
FROM public.fs_decisions d
JOIN public.fs_eleves e ON e.id = d.eleve_id
WHERE d.statut IN ('decide', 'mandate', 'paye')
  AND e.voie = '1er_degre'
GROUP BY d.establishment_id, d.annee_scolaire, d.type_fonds;

-- Vue Q15 : modalités d'attribution (commission vs urgence)
CREATE OR REPLACE VIEW public.v_enquete_q15 AS
SELECT
  d.establishment_id,
  d.annee_scolaire,
  (split_part(d.annee_scolaire, '-', 1))::int AS annee,
  COUNT(*) FILTER (WHERE d.modalite_attribution = 'commission') AS nb_commission,
  COUNT(*) FILTER (WHERE d.modalite_attribution = 'urgence') AS nb_urgence,
  COUNT(*) AS total_decisions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE d.modalite_attribution = 'urgence')::numeric
        / NULLIF(COUNT(*), 0), 2) AS pourcentage_urgence
FROM public.fs_decisions d
WHERE d.statut IN ('decide', 'mandate', 'paye')
GROUP BY d.establishment_id, d.annee_scolaire;