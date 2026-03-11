Module Recettes Voyages Op@le — Conformité M9-6 et architecture analytique

## Architecture
- `VoyageRecettesTab.tsx`: module complet avec 3 sous-onglets (Saisie Ordonnateur, Écritures comptables, Dashboard par domaine)
- Plan comptable classe 7 structuré: familles (706700, 706880), public (741xxx, 744xxx, 747xxx), privé (754xxx, 748xxx, 758xxx)
- Code Activité 9 caractères avec validation prefix: 0=dons/TA, 1=État, 2=Collectivité
- Génération automatique des écritures: Débit → Crédit avec mapping précis
- Marqueurs analytiques: Service AP / Domaine / Activité

## Mapping Comptable M9-6 (JSON)
### Recettes (code_7 → code_4 débit)
- 706700 → 411100 (Familles — Créances sur élèves)
- 74xxxx État → 441100 (État — Subventions à recevoir)
- 744xxx Collectivités → 441900 (Collectivités — Subventions à recevoir)
- 754110 FSE/AS → 467100 (Autres comptes débiteurs)
- 754000/748100/758000 → 467100 (Débiteurs divers)

### Dépenses
- Acompte → 409100 (Fournisseurs avances) — ctrl: check_delib_CA
- Solde → 401100 (Dettes fournisseurs) — comptes classe 6: 604, 624

## Logic M9-6
- auto_balance: recettes_totales == depenses_totales
- zero_profit: participation_familles <= cout_reel_voyage
- seuil_public: 40 000 € HT

## Workflow
- Étape 1 (Ordonnateur): saisie tiers, compte, montant, domaine, code activité
- Étape 2 (Comptable): validation = prise en charge → écriture générée
- Dashboard: comparaison émis vs encaissé par domaine, taux de recouvrement

## Validation
- Zod schema pour inputs
- Blocage si code activité invalide pour le type de compte sélectionné
- Subvention État → prefix 1, Collectivité → prefix 2, Don/TA → prefix 0
