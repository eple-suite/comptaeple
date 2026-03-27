---
name: REPROFI Report Structure
description: Structure du rapport financier REPROFI — modèle pour le rapport ordonnateur et AC, sections, formules CAF, indicateurs budgétaires
type: feature
---

## REPROFI 4.5 Structure

### Feuilles clés
- **BDDsde/BDDsdr**: Bases de données brutes SDE/SDR
- **sde/sde-1/sdr/sdr-1**: Données budgétaires N et N-1
- **bal/bal-1**: Balances comptables N et N-1
- **SYNT-exécution du budget**: Tableau par service (AP/VE/ALO/SRH/SBN/OPC + S.O 1-15)
  - Colonnes CHARGES: Domaines activés, Prévisions N, Charges N, Reliquats/Dépassements, Rappel N-1, Variation annuelle, Taux d'exécution
  - Colonnes PRODUITS: Comptes mouvementés, Prévisions N, Produits N, Plus-values/Moins-values, Rappel N-1, Variation annuelle, Taux d'exécution
  - RÉSULTAT BUDGÉTAIRE NET en bas
- **pilotage budgétaire**: Budget initial vs exécuté par service avec écarts absolus/relatifs + PRÉLÈVEMENTS SUR FDR
- **SYNT-bilan de santé financière**: 2 colonnes N-1 vs N avec écarts/évolution
  - INDICATEURS BUDGÉTAIRES: Produits exploitation, Charges exploitation, Résultat, Produits encaissables, Charges décaissables, CAF/IAF, CAF-Charges investissement, Variation FDR budg.
  - INDICATEURS FINANCIERS: FDR, BFR, Trésorerie, Jours FDR, Jours trésorerie, TMcap, TMnr, FDR mobilisable
- **C2-résultat-caf-var fdr**: Diagramme de transition Résultat → CAF → Variation FDR

### Formule CAF budgétaire (REPROFI standard)
- Charges décaissables = Total SDE − Charges OO SDE (cpt 68* + 675*)
- Produits encaissables = Total SDR − Produits OO SDR (cpt 78* + 775* + 776* + 777*)
- **CAF = Produits encaissables − Charges décaissables**
- Équivalent: CAF = Résultat budgétaire + Charges OO(SDE) − Produits OO(SDR)

### Jours FDR/Trésorerie
- Dénominateur = Charges de fonctionnement / 365 (hors investissement classe 2)
- Jours FDR = FDR comptable / charges quotidiennes fonctionnement
- Jours trésorerie = Trésorerie / charges quotidiennes fonctionnement

### TMcap / TMnr
- TMcap = Dettes fournisseurs (401+408) / Total SDE × 100
- TMnr = Créances Cl.4 / Total SDR × 100

### FDR mobilisable
- FDR mobilisable = FDR brut − Stocks (Cl.3) − Créances anciennes (416)

### IMPORTANT: Dashboard/Indicators doivent utiliser les données réelles du store cofieple (resultats[activeBudget]) et non les mockData
