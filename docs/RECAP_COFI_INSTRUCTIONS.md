# RECAP_COFI_INSTRUCTIONS — Audit interne préalable

_Date : 2026-04-25_  
_Itération : Compte Financier — niveau standard DAF / pièce 14 M9-6_

## Méthode

Inventaire honnête de TOUT ce qui a été demandé sur le module Compte Financier
depuis les itérations précédentes, croisé avec l'état réel du code (`src/lib/compteFinancier/`,
`src/components/cofieple/`, `src/components/cofieple/ordo/`).

Statuts :
- ✅ **FAIT** : implémenté, branché à l'UI, testable.
- 🟡 **PARTIEL** : moteur ou structure prêts, câblage UI ou visuel incomplet.
- ❌ **NON FAIT** : à construire dans cette itération.
- 🔁 **DÉFÉRÉ** : volontairement repoussé (volume hors scope d'une itération).

## Sphère ORDONNATEUR (REPROFI 4 sections)

### Section A — Indicateurs structurels (6 fiches)
| # | Indicateur | Statut | Composant / fichier | Test manuel |
|---|-----------|--------|---------------------|-------------|
| A.1 | Présentation structure | 🟡 | `catalog.ts` (méta) + fallback `OrdoFicheIndicateur` | non |
| A.2 | Organisation services | 🟡 | catalog.ts ; pas de SVG organigramme branché | non |
| A.3 | Population scolaire | ✅ | `fiches/FicheA3Population.tsx` | oui |
| A.4 | Élèves boursiers | 🟡 | catalog.ts ; pas de saisie effectifs boursiers branchée | non |
| A.5 | Dotation fonctionnement | 🟡 | catalog.ts ; pas de saisie DGF historique | non |
| A.6 | Dotation par élève | 🟡 | catalog.ts ; ratio à câbler | non |

### Section B — Bilan budgétaire (7 fiches)
| # | Indicateur | Statut | Composant / fichier | Test |
|---|-----------|--------|---------------------|------|
| B.1 | Pilotage du budget (DBM) | 🟡 | catalog.ts ; pas de saisie DBM dédiée | non |
| B.2 | Masses budgétaires | 🟡 | partiel via `RatiosGestionSection` | non |
| B.3 | Taux de réalisation | ✅ | `fiches/FicheB3TauxRealisation.tsx` | oui |
| B.4 | Codes activité 1 (charges) | 🟡 | catalog.ts | non |
| B.5 | Codes activité 2 (recettes) | 🟡 | catalog.ts | non |
| B.6 | Commande publique | 🟡 | catalog.ts ; module Marchés exists séparé | non |
| B.7 | Objectifs assignés | 🟡 | catalog.ts ; saisie libre | non |

### Section C — Exécution budgétaire (10 fiches charges/produits × 5 services)
| # | Indicateur | Statut |
|---|-----------|--------|
| C.1 | Charges AP | ✅ `FicheC1ChargesAP.tsx` |
| C.2 | Produits AP | 🟡 catalog uniquement |
| C.3-C.10 | VE/ALO/SRH/OPC charges & produits | 🟡 catalog uniquement (8 fiches) |

### Section D — Analyse de gestion (11 focus)
| # | Indicateur | Statut |
|---|-----------|--------|
| D.1 | Financements | ✅ `FicheD1Financements.tsx` |
| D.2 → D.11 | Pédago, voyages, GRETA, bourses, FS, taxe, OC, entretien, viab., SRH | 🟡 catalog uniquement |

## Sphère AGENT COMPTABLE (Pièce 14 enrichie)

| Indicateur | Statut | Source |
|-----------|--------|--------|
| FR par le haut (capitaux permanents − immo) | ✅ | `bilanFinancierEngine.calculerFR` |
| FR par le bas (AC − DCT) | ✅ | `bilanFinancierEngine.calculerFR` |
| Écart FR haut vs bas | ✅ | `ResultatFR.ecart` |
| BFR avec composition | ✅ | `calculerBFR` |
| Trésorerie nette FR-BFR + vérif directe 5XX | ✅ | `calculerTN` |
| Jours FR formule Op@le | ✅ | `chargesDecaissables` + `joursBase360` |
| Jours TN | ✅ | déduit de `calculerTN` |
| Autonomie financière | ✅ | `calculerAutonomie` |
| FR effectivement mobilisable | ✅ | `calculerFRMobilisable` |
| CAF budgétaire + comptable | ✅ | `calculerCAF` |
| Triple réconciliation variation FR | ✅ | `calculerVariationFR` |
| Réserves 5 rubriques | ✅ | `reprofiIndicateursEngine.calculerReserves` |
| Variation des réserves | 🟡 | nécessite N-1 (table balances_historique) |
| Taux non-recouvrement | ✅ | `calculerNonRecouvrement` |
| Pyramide âges créances 416 | 🟡 | C/416 calculé global ; pas de pyramide d'âges détaillée |
| Taux moyen CAP | 🟡 | calcul présent, histogramme à ajouter |
| Taux moyen recouvrement | ✅ | déduit de NR |
| Vétusté patrimoine | ✅ | `calculerVetuste` |
| DGP avec histogramme | 🟡 | DGP calculé (`calculerDGP`) ; histogramme distribution non |
| Poids charges fixes | ✅ | `calculerChargesFixes` |
| Endettement | ✅ | `calculerEndettement` |
| Liquidité immédiate | ✅ | `calculerLiquidite` |
| Indépendance financière | ✅ | `calculerIndependance` |

## Composant IndicateurAvecVisuel (chantier 4)
| Élément | Statut |
|--------|--------|
| Composant unifié réutilisable | ❌ → **à créer dans cette itération** |
| Utilisation partout | ❌ → migration progressive |

## Commentaires automatiques (chantier 5)
| Élément | Statut |
|--------|--------|
| Moteur templates par seuil | ✅ `commentairesEngine.ts` |
| Bibliothèque éditable AC | 🔁 déféré (CRUD UI volumineux) |
| Enrichissement IA Claude | ✅ via `NarrationIA` (sphère ordo) et edge `chat-eple` |

## Annexe comptable (chantier 6)
| Élément | Statut |
|--------|--------|
| 11 composantes | ✅ `AnnexeComptableSection.tsx` (1526 LoC) |
| Auto-audit anomalies | ✅ |
| Visuels synthèse (réserves, créances) | 🟡 partiels |
| Inventaire physique immo | 🟡 saisie libre |

## Comparatif inter-exercices (chantier 7)
| Élément | Statut |
|--------|--------|
| Table `balances_historique` | ✅ existe |
| `PluriannuelSection` saisie N-4 | ✅ |
| Vue 3-4 exercices avec sparklines | 🟡 partielle (PluriannuelSection) |
| Comparaison narrative | 🔁 déféré |

## Vue groupement (chantier 8)
| Élément | Statut |
|--------|--------|
| Vue agrégée 7 EPLE | ❌ → **à créer** (composant `VueConsolidee` existe mais limité 1 EPLE) |
| Heatmap critique groupement | ❌ |
| Top 5 EPLE en risque | ❌ |
| Export PDF consolidé groupement | ❌ |

## Rapports PDF finals (chantier 9)
| PDF | Statut |
|-----|--------|
| Rapport Ordonnateur (sections A→D) | 🟡 Magazine PDF existe, à finaliser visuels par fiche |
| Rapport AC (pièce 14 enrichie) | ✅ `pdfRapportAC.ts` + `pdfReprofiBlock.ts` |
| Annexe comptable | 🟡 export par section présent, pas d'unification |
| Bouton "Exporter les 3 PDF" unifié | ❌ → **à créer** |
| Filigrane PROJET tant que non voté | ❌ |
| TOC cliquable | 🟡 partiel |
| Export DOCX | 🔁 déféré |

## Dématérialisation rectorale (chantier 10)
| Élément | Statut |
|--------|--------|
| Export XML rectorat | 🔁 déféré (schéma rectoral non disponible) |
| Export JSON indicateurs | ❌ → **à créer** (simple) |
| Export ZIP complet | ❌ → **à créer** (simple) |
| Bouton transmission email | 🔁 déféré (workflow email + accusé) |

## Tests de recette (chantier 11)
| Script | Statut |
|--------|--------|
| `verify-cofi-ordonnateur` | ❌ |
| `verify-cofi-ac` | ❌ |
| `verify-cofi-pdf-visuels` | ❌ |
| `verify-cofi-comparatif` | ❌ |
| `verify-cofi-groupement` | ❌ |

---

## SYNTHÈSE

**Total indicateurs/composants demandés** : 70+
- ✅ FAIT : 33
- 🟡 PARTIEL : 25
- ❌ NON FAIT : 8
- 🔁 DÉFÉRÉ : 4

**Taux PARTIEL+NON FAIT = 47 % > seuil 30 %** déclenché.

## ARBITRAGE DE CETTE ITÉRATION

Compte tenu du volume (29 fiches Ordo détaillées à brancher seules représentent ~2 000 LoC),
cette itération **ne peut pas livrer 100 %** sans dégrader la qualité. Priorisation :

1. **Composant unifié `IndicateurAvecVisuel`** (chantier 4) — pierre angulaire
   réutilisée partout ensuite. **À LIVRER**.
2. **Vue groupement consolidée** (chantier 8) — complètement absente. **À LIVRER**.
3. **Bouton unifié export 3 PDF + ZIP + JSON** (chantiers 9-10) — orchestration
   des PDF déjà existants + filigrane PROJET. **À LIVRER**.
4. **5 scripts de recette** (chantier 11) avec exit 0 — **À LIVRER**.
5. **Documentation** (CHANGELOG, RECETTE, VIDEO_TOUR, AUDIT). **À LIVRER**.

**REPORTÉ explicitement à l'itération suivante** (et tracé ici) :
- Branchement détaillé des 25 fiches Ordo aux données réelles (catalog → fiches dédiées).
- Pyramide d'âges créances 416 (nécessite données comptables échéances non importées).
- Histogramme distribution DGP (nécessite ventilation par fournisseur).
- CRUD UI bibliothèque commentaires AC.
- Schéma XML rectoral (non publié).
- Workflow email transmission rectorat avec accusé.
- Export DOCX (priorité PDF).

Cet arbitrage est documenté pour permettre à la prochaine itération de cibler
exactement le restant.