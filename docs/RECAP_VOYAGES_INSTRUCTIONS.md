# RECAP VOYAGES — État réel des instructions

**Date d'audit** : 24/04/2026 — révision n°2  
**Méthode** : inspection directe du code livré (pas d'auto-déclaration).

## Légende
- ✅ FAIT — code livré, testable
- 🟧 PARTIEL — squelette présent, mais incomplet ou non branché à l'UI
- ❌ NON FAIT — absent ou non opérationnel

## Instructions précédentes

| # | Instruction | Statut | Fichier(s) | Notes |
|---|---|---|---|---|
| A.0 | Suppression des Templates | ✅ FAIT | `src/pages/Voyages.tsx`, `VoyageTemplatesTab.tsx` supprimé | Onglet templates retiré |
| A.1 | Tables Supabase `vs_*` (9 tables) | ✅ FAIT | migration `20260424200430_*.sql` | RLS + triggers updated_at |
| A.1 | Architecture menu (8 sections) | ✅ FAIT (rev. 2) | `AppSidebar.tsx` | Sidebar pointe désormais sur `/voyages-v2` (badge HOT). V1 reléguée à "Voyages (ancien)". |
| A.2 | Wizard 8 étapes | 🟧 PARTIEL | `voyages-v2/wizard/VoyageWizard.tsx` (9 étapes incluant rétroplanning) | Pas d'IA contextuelle, pas de "voir un exemple", pas de tooltips pédagogiques systématiques |
| A.2 | 4 nuances de projet | ✅ FAIT | `types.ts` `TypeProjet` | cle_en_main / prestataires_separes / erasmus_porteur / erasmus_partenaire |
| A.2 | 4 statuts financeur | ✅ FAIT | `types.ts` `StatutFinanceur` | notifiee/demandee/promesse/hypothese |
| A.2 | Calcul équilibre + blocage | ✅ FAIT | `lib/financialEngine.ts` | snapshotVoyage |
| A.2 | Import SIECLE opérationnel dans v2 | ❌ NON FAIT | existe en v1 (`VoyageImportSiecleTab.tsx`), pas branché v2 | À porter |
| A.3 | **Moteur d'alertes complet** | ✅ FAIT (cette livraison) | `voyages-v2/lib/alertesEngine.ts` | 17 catégories d'alertes, tests unitaires |
| A.3 | Alerte délai CA 30/60/90 j | ✅ FAIT (cette livraison) | `alertesEngine.ts` | Test vitest exit 0 |
| A.3 | Alerte engagement avant CA | ✅ FAIT (cette livraison) | `alertesEngine.ts` | Test vitest exit 0 |
| A.3 | Alerte CA manquant | ✅ FAIT (cette livraison) | `alertesEngine.ts` | Test vitest exit 0 |
| A.3 | Sidebar alertes permanente | ✅ FAIT (rev. 2) | `SidebarAlertes.tsx` + `VoyagesV2Page.tsx` | Colonne droite collante 320px. Compteurs critique/vigilance/info, recharge auto à chaque save wizard. |
| A.3 | Persistance `vs_alertes` | ✅ FAIT (rev. 2) | `lib/alertesPersistence.ts` + branchement `VoyageWizard.persistAndAdvance` | Sync best-effort à chaque sauvegarde : insert nouvelles, marque obsolètes `resolue=true`. |
| A.4 | Génération 32 documents Word | ✅ FAIT | `documentsCatalogue.ts`, `docxBuilder.ts`, `zipGenerator.ts`, `DocumentsGenerator.tsx`, `DocumentsGeneratorReal.tsx`, `lib/contextLoader.ts` | 32 builders DOCX, ZIP en 5 dossiers, manifest. **Branché voyages réels** : sélecteur de voyage enregistré, chargement parallèle vs_voyages/recettes/depenses/participants, mapping vers `DocxBuildContext`, fallback démo conservé. Refresh auto après save wizard. |
| A.5 | Bilan financier modèle Créteil | 🟧 PARTIEL | `VoyageBilanTab.tsx` existe en v1 | À porter en v2 avec règle 8 € |
| A.5 | Règle des 8 € (LF 66-948 art. 21) | ✅ FAIT | `regle8Euros.ts` + bandeau wizard (étape 5+) + blocage `Suivant`/`Finaliser` + 7 tests unitaires | Bandeau permanent ROUGE/AMBRE/VERT ; checkbox don tacite assumé pour débloquer |
| A.5 | Deux votes CA distincts (R.421-20) | ✅ FAIT (rev. 2) | migration `date_ca_principe` + `date_ca_budget` + Step7 refondue + `AlertesPanel` | Vote n°1 (principe) + vote n°2 (budget) dans deux cartes distinctes ; alerte délai départ↔vote budget visible directement dans Step7. |
| A.5 | Logs admin règle 8 € | ✅ FAIT | `voyageLogs.ts` + `Regle8History.tsx` + `Regle8LogsAdmin` (`/admin/logs/regle-8`) | Filtres UAI + type d'action, export CSV |
| A.6 | Mode d'emploi SGEPLE débutant | ❌ NON FAIT | Aucune page guide | |
| A.6 | Assistant IA contextuel voyages | ❌ NON FAIT | ChatEple existe mais pas de contexte voyage injecté | |
| A.7 | Dashboard prédictif "wow" | ❌ NON FAIT | Dashboard v2 absent | |
| A.8 | Intégration écosystème (régies/marchés) | 🟧 PARTIEL | v1 a `VoyageMarchesMoniteur` ; pas porté v2 | |
| A.9 | Module enquêtes rectorat (industrialisation) | ❌ NON FAIT | Exigence n°2 du brief, pas démarré | |

## Révision n°2 — corrections suite audit "tous menus"

| # | Écart constaté | Action |
|---|---|---|
| 1 | **Sidebar pointait sur `/voyages` (v1, mock en mémoire)** — le rectorat aurait vu l'ancienne version | Sidebar redirigée vers `/voyages-v2` avec badge HOT ; v1 conservée sous "Voyages (ancien)" |
| 2 | **Sidebar alertes permanente absente** | `SidebarAlertes` + colonne droite collante de la page Voyages v2 |
| 3 | **`vs_alertes` jamais alimentée** | `alertesPersistence.syncVoyageAlertes` branché dans `VoyageWizard.persistAndAdvance` |

## Reste explicitement NON FAIT (chantiers à chiffrer)
- Module enquêtes rectorat (exigence n°2 du brief — non démarré)
- Bilan financier modèle Créteil v2
- Import SIECLE branché v2
- Assistant IA contextuel voyages
- Mode d'emploi SGEPLE
- Dashboard prédictif
- Intégration régies / marchés v2

**Aucune affirmation "c'est fait" sur ces lignes.**