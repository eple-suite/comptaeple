
## Phase 1 : Structure bi-onglet + 13 sections Ordonnateur

### Étape 1 — Restructuration navigation (`CompteFinancier.tsx`)
- Remplacer la barre de navigation plate par **2 onglets principaux** : `📋 Rapport Ordonnateur` / `📊 Rapport Agent Comptable`
- Chaque onglet affiche une **sous-navigation numérotée** (S1-S13 pour Ordo, A-J pour AC)
- L'onglet AC conserve les sections existantes (pas de refonte pour l'instant)
- Conserver les onglets utilitaires hors rapport : Accueil, Imports, Journal, Contrôles, Analyse IA

### Étape 2 — 13 composants Ordonnateur (`src/components/cofieple/ordo/`)
Chaque section = 1 fichier composant avec :
- KPI cards (données calculées depuis le store)
- Graphiques Recharts (`isAnimationActive={false}`)
- Zone de commentaire persistée (`usePersistedText`)
- Formulaire de saisie manuelle pour les données extra-comptables

| Section | Composant | Source données |
|---------|-----------|---------------|
| S1 Présentation | `OrdoS1Presentation.tsx` | Saisie manuelle + store etab |
| S2 Tableau de bord | `OrdoS2TableauBord.tsx` | Résultats calculés |
| S3 Exec Fonctionnement | `OrdoS3ExecFonctionnement.tsx` | SDE importé |
| S4 Exec Recettes | `OrdoS4ExecRecettes.tsx` | SDR importé |
| S5 Pilotage | `OrdoS5Pilotage.tsx` | Résultats + pluriannuel |
| S6 SRH | `OrdoS6SRH.tsx` | Balance + saisie |
| S7 Vie Élève | `OrdoS7VieEleve.tsx` | Saisie manuelle |
| S8 Viabilisation | `OrdoS8Viabilisation.tsx` | Saisie manuelle |
| S9 Activités Péda | `OrdoS9ActivitesPeda.tsx` | SDE importé |
| S10 Créances | `OrdoS10Creances.tsx` | Balance importée |
| S11 Résultat | `OrdoS11Resultat.tsx` | Résultats calculés |
| S12 Perspectives | `OrdoS12Perspectives.tsx` | Saisie manuelle |
| S13 Signatures | `OrdoS13Signatures.tsx` | Saisie manuelle |

### Étape 3 — Formules M9-6 (`calcsBudgetaires.ts`)
- DRFN, SIG, seuil rentabilité SRH, EBE/IBE par service
- Rotation stocks, taux de vétusté, solvabilité

### Étape 4 — Persistance
- Clés de commentaires : `rapport_ordo_s{N}_{champ}_{UAI}_{exercice}`
- Données saisies manuellement stockées via `usePersistedState`

### Fichiers modifiés
- `src/pages/CompteFinancier.tsx` (restructuration nav)
- `src/components/cofieple/ordo/*.tsx` (13 nouveaux fichiers)
- `src/utils/calcsBudgetaires.ts` (nouvelles formules)

### Ce qui ne change PAS (Phase 2 ultérieure)
- Les 10 sections Agent Comptable (conservent l'existant)
- La refonte de RapportImpression.tsx
- Les graphiques avancés AC (radar, point mort SRH)
