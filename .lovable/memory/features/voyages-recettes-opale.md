Module Recettes Voyages Op@le — Conformité M9-6 et architecture analytique

## Architecture
- `VoyageRecettesTab.tsx`: module complet avec 3 sous-onglets (Saisie Ordonnateur, Écritures comptables, Dashboard par domaine)
- Plan comptable classe 7 structuré: familles (706700, 706880), public (741xxx, 744xxx, 747xxx), privé (754xxx, 748xxx, 758xxx)
- Code Activité 9 caractères avec validation prefix: 0=dons/TA, 1=État, 2=Collectivité
- Génération automatique des écritures: Débit 411xxx/44xxxx — Crédit 7xxxxx
- Marqueurs analytiques: Service AP / Domaine / Activité

## Workflow
- Étape 1 (Ordonnateur): saisie tiers, compte, montant, domaine, code activité
- Étape 2 (Comptable): validation = prise en charge → écriture générée
- Dashboard: comparaison émis vs encaissé par domaine, taux de recouvrement

## Validation
- Zod schema pour inputs
- Blocage si code activité invalide pour le type de compte sélectionné
- Subvention État → prefix 1, Collectivité → prefix 2, Don/TA → prefix 0
