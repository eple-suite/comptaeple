Module Voyages Scolaires refonte VoyagePro 2026 — fusion code Claude + existant

## Architecture
- `types.ts`: enrichi avec TransportType, TypeVoyage, codeActiviteGFC, calculerPointMort()
- `VoyageCard.tsx`: carte visuelle avec gradient, compte à rebours J-X, progress collecte, point mort
- `VoyageCreationWizard.tsx`: assistant 4 étapes (Infos → Destination → Participants → Budget)
- `VoyageBudgetWidget.tsx`: barres empilées dépenses, recettes vs dépenses, point mort
- `VoyageDocumentsChecklist.tsx`: progress par type de document (autorisation, sanitaire, assurance, ID)
- `ProgressRing.tsx`: composant réutilisable (src/components/)
- Vue toggle grille/liste sur le tableau de bord

## Fonctionnalités clés
- Point mort = nb élèves minimum pour équilibre financier
- Collecte globale familles avec ProgressRing
- Alertes impayés avec compteur
- Couverture budgétaire par voyage
- Export PDF synthèse + impression
- Marchés publics: cumul annuel par catégorie avec seuils CCP

## Types ajoutés
- Voyage.transportType?: 'bus' | 'avion' | 'train' | 'bateau' | 'mixte'
- Voyage.typeVoyage?: 'pedagogique' | 'linguistique' | 'sportif' | 'culturel' | 'ski' | 'erasmus'
- Voyage.intitule?, Voyage.codeActiviteGFC?, Voyage.dateValidationCA?
