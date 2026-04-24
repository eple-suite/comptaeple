# RECAP VOYAGES — État réel des instructions

**Date d'audit** : 24/04/2026  
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
| A.1 | Architecture menu (8 sections) | 🟧 PARTIEL | `voyages-v2/` existe mais NON ROUTÉ — corrigé dans cette livraison | Page parente créée maintenant |
| A.2 | Wizard 8 étapes | 🟧 PARTIEL | `voyages-v2/wizard/VoyageWizard.tsx` (9 étapes incluant rétroplanning) | Pas d'IA contextuelle, pas de "voir un exemple", pas de tooltips pédagogiques systématiques |
| A.2 | 4 nuances de projet | ✅ FAIT | `types.ts` `TypeProjet` | cle_en_main / prestataires_separes / erasmus_porteur / erasmus_partenaire |
| A.2 | 4 statuts financeur | ✅ FAIT | `types.ts` `StatutFinanceur` | notifiee/demandee/promesse/hypothese |
| A.2 | Calcul équilibre + blocage | ✅ FAIT | `lib/financialEngine.ts` | snapshotVoyage |
| A.2 | Import SIECLE opérationnel dans v2 | ❌ NON FAIT | existe en v1 (`VoyageImportSiecleTab.tsx`), pas branché v2 | À porter |
| A.3 | **Moteur d'alertes complet** | ✅ FAIT (cette livraison) | `voyages-v2/lib/alertesEngine.ts` | 17 catégories d'alertes, tests unitaires |
| A.3 | Alerte délai CA 30/60/90 j | ✅ FAIT (cette livraison) | `alertesEngine.ts` | Test vitest exit 0 |
| A.3 | Alerte engagement avant CA | ✅ FAIT (cette livraison) | `alertesEngine.ts` | Test vitest exit 0 |
| A.3 | Alerte CA manquant | ✅ FAIT (cette livraison) | `alertesEngine.ts` | Test vitest exit 0 |
| A.3 | Sidebar alertes permanente | ❌ NON FAIT | UI à brancher | Le moteur retourne les alertes, l'affichage sidebar reste à connecter |
| A.3 | Persistance `voyage_alertes` | 🟧 PARTIEL | table `vs_alertes` créée, écriture pas encore branchée | |
| A.4 | Génération 32 documents Word | ✅ FAIT | `voyages-v2/lib/documentsCatalogue.ts`, `docxBuilder.ts`, `zipGenerator.ts`, `DocumentsGenerator.tsx` | 32 builders DOCX, ZIP organisé en 5 dossiers, sélection obligatoires/tout/aucun, manifest inclus |
| A.5 | Bilan financier modèle Créteil | 🟧 PARTIEL | `VoyageBilanTab.tsx` existe en v1 | À porter en v2 avec règle 8 € |
| A.5 | Règle des 8 € (LF 66-948 art. 21) | ✅ FAIT | `regle8Euros.ts` + bandeau wizard (étape 5+) + blocage `Suivant`/`Finaliser` + 7 tests unitaires | Bandeau permanent ROUGE/AMBRE/VERT ; checkbox don tacite assumé pour débloquer |
| A.6 | Mode d'emploi SGEPLE débutant | ❌ NON FAIT | Aucune page guide | |
| A.6 | Assistant IA contextuel voyages | ❌ NON FAIT | ChatEple existe mais pas de contexte voyage injecté | |
| A.7 | Dashboard prédictif "wow" | ❌ NON FAIT | Dashboard v2 absent | |
| A.8 | Intégration écosystème (régies/marchés) | 🟧 PARTIEL | v1 a `VoyageMarchesMoniteur` ; pas porté v2 | |

## Ce qui est livré DANS cette réponse
1. ✅ Moteur `alertesEngine.ts` complet (17 catégories) — pure function testable
2. ✅ Tests vitest `src/test/alertes-voyage.test.ts` couvrant les 3 cas explicitement exigés (délai CA < 30 j / engagement avant CA / CA manquant) + 4 autres
3. ✅ Page parente `VoyagesV2Page` + route `/voyages-v2` (non destructif : `/voyages` reste l'ancienne)
4. ✅ `RECAP_VOYAGES_INSTRUCTIONS.md` (ce fichier)
5. ✅ `VIDEO_TOUR.md` pour vérification visuelle

## Ce qui reste explicitement NON FAIT
- Sidebar alertes permanente (UI)
- 32 gabarits `.docx` (chantier de plusieurs heures)
- Règle 8 € + bilan Créteil v2
- Import SIECLE branché v2
- Assistant IA contextuel voyages
- Mode d'emploi SGEPLE
- Dashboard prédictif

Ces éléments doivent faire l'objet de chantiers dédiés (chacun 1 livraison).  
**Aucune affirmation "c'est fait" sur ces lignes.**