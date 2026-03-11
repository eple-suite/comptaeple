Module Voyages Scolaires refonte VoyagePro 2026 — fusion code Claude + existant

## Architecture
- `types.ts`: enrichi avec TransportType, TypeVoyage, codeActiviteGFC, calculerPointMort()
- `VoyageCard.tsx`: carte visuelle avec gradient, compte à rebours J-X, progress collecte, point mort
- `VoyageCreationWizard.tsx`: assistant 4 étapes (Infos → Destination → Participants → Budget)
- `VoyageBudgetWidget.tsx`: barres empilées dépenses, recettes vs dépenses, point mort
- `VoyageDocumentsChecklist.tsx`: progress par type de document (autorisation, sanitaire, assurance, ID)
- `VoyageMarchesMoniteur.tsx`: moniteur marchés publics avec alertes seuils CCP + préconisations
- `ProgressRing.tsx`: composant réutilisable (src/components/)
- Vue toggle grille/liste sur le tableau de bord
- Hook `useVoyages.ts`: CRUD Supabase avec persistence

## Tables Supabase
- `voyages`: table principale avec ventilation dépenses, version_statut (brouillon/validé), regie_avances
- `voyage_participants`: élèves avec documents requis
- `voyage_paiements`: encaissements avec fonds_social flag
- `voyage_marches_alertes`: log des alertes marchés publics par exercice
- RLS via user_establishments link

## Marchés Publics (CCP)
- Seuils: 40k€ (3 devis), 90k€ (MAPA), 221k€ (appel d'offres UE)
- Préconisations: allotissement, négociation, groupement commandes, accord-cadre
- Cumul annuel automatique par nature de prestation

## Types ajoutés
- Voyage.transportType?: 'bus' | 'avion' | 'train' | 'bateau' | 'mixte'
- Voyage.typeVoyage?: 'pedagogique' | 'linguistique' | 'sportif' | 'culturel' | 'ski' | 'erasmus'
- Voyage.intitule?, Voyage.codeActiviteGFC?, Voyage.dateValidationCA?
- Voyage.regie_avances (régie d'avances pour frais sur place)
