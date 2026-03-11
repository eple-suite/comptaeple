Bibliothèque de modèles (templates) de voyages — Mars 2026

## Table
- `voyage_templates`: cloisonnée par establishment_id, RLS via user_establishments
- Champs: budget ventilé, imputation comptable (service_ap, domaine, code_activite_gfc, compte_classe7)
- Trigger updated_at

## Fonctionnalités
- Création manuelle ou depuis un voyage existant
- Suppression avec AlertDialog de confirmation
- Création d'un voyage depuis un template (copie indépendante)
- Les voyages créés ne sont pas liés au template (intégrité)

## Fichiers
- `src/pages/voyages/VoyageTemplatesTab.tsx`: composant complet
- Onglet "📁 Modèles" dans Voyages.tsx
