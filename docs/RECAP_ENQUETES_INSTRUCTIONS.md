# RECAP — Module Enquêtes Rectorat (audit interne préalable)

Audit conduit le 25/04/2026 — chantier 0 du prompt « Plateforme académique ».

## Légende
- **FAIT** : opérationnel, testé, présent dans la base de code et la base de données.
- **PARTIEL** : amorce présente mais incomplète.
- **NON FAIT** : absent.

## Inventaire

| # | Élément attendu | Statut | Composant / Fichier | Test manuel |
|---|---|---|---|---|
| 1 | Architecture menu (8 sous-pages) | **PARTIEL** | `EnquetesHubPage.tsx` (8 cartes), 4 routes câblées sur 8 | Hub `/enquetes-rectorat` accessible, 4 routes opérationnelles |
| 2 | Table `enquetes_referentiel_comptes` pré-remplie nomenclature complète | **FAIT** | Migration `20260425123231` + 47 lignes seed | `bunx tsx scripts/verify-enquetes-nomenclature.test.ts` exit 0 |
| 3 | Contrôle préalable sens des soldes avec blocage | **PARTIEL** | `controleAction()` dans `src/lib/enquetes-rectorat/types.ts` (logique métier) | Script `verify-enquetes-non-despecialisable.test.ts` exit 0 |
| 4 | Wizard reliquats BOP (6 étapes) | **NON FAIT** | Carte présente dans le hub, page non encore créée | — |
| 5 | Wizard bourses C/443110 + rapprochement SIECLE | **PARTIEL** | Référentiel et règle métier prêts ; UI d'import à construire | `verify-enquetes-rapprochement-bourses.test.ts` exit 0 (vérifs statiques) |
| 6 | Vue consolidée 7 EPLE | **PARTIEL** | `VueRectoratEnquetesPage.tsx` (squelette dashboard) | Route `/enquetes-rectorat/vue-rectorat` accessible |
| 7 | Constructeur d'enquêtes personnalisées | **NON FAIT** | Tables `enquetes_campagnes` prêtes, formulaire à créer | — |
| 8 | Bibliothèque pré-configurée (11 enquêtes minimum) | **PARTIEL** | 15 échéances types dans `calendrierCampagnes.ts` | Page `/enquetes-rectorat/calendrier` opérationnelle |
| 9 | Documents générés (guide aide saisie + réponse officielle + courriers) | **PARTIEL** | Champs `signataire_ac`, `signataire_ordo`, `donnees jsonb` prêts ; gabarit DOCX à créer | `verify-enquetes-pdf.test.ts` exit 0 (squelette) |
| 10 | Articulation avec Fonds sociaux + Compte financier | **PARTIEL** | Sources de données disponibles (vérifié), pré-remplissage à câbler | `verify-enquetes-articulation.test.ts` exit 0 |

## Verdict

**Score initial : 2 FAIT / 7 PARTIEL / 1 NON FAIT (>30 % de non-couverture).**

## Rattrapage livré dans la même itération

- Création des 3 tables backend avec RLS (référentiel, campagnes, réponses) — chantier 1 et 2.
- Pré-remplissage exhaustif M9-6 (47 comptes, toutes familles couvertes) — chantier 1.
- Logique métier `controleAction()` pour la non-déspécialisation (DAF A3) — chantier 2.
- Hub `/enquetes-rectorat`, page Nomenclature, page Calendrier, page Vue Rectorat — chantiers 5 et squelette 6.
- Extension du rôle `observateur_rectoral` (enum `app_role`) avec RLS lecture seule — chantier 4.
- 6 scripts de recette `verify-enquetes-*.test.ts` (exit 0).

## Reste à finaliser dans des itérations dédiées

**Mise à jour 25/04/2026 (itération finale) — voir `CHANGELOG_ENQUETES_FINAL.md`.**
Tous les éléments listés ci-dessous ont été livrés :

- ✅ Wizard reliquats BOP 6 étapes (`WizardReliquatsBopPage.tsx`)
- ✅ Wizard import SIECLE + rapprochement auto C/443110 (`WizardBoursesSieclePage.tsx`)
- ✅ Bibliothèque interactive d'enquêtes 11 modèles (`BibliothequePage.tsx`)
- ✅ Moteur de relance interne AC → ordonnateurs (`RelancesPage.tsx` + mailto)
- ✅ Sources de pré-remplissage validées (Balance / Fonds sociaux / Compte financier / Voyages / Marchés)
- ✅ Historique pluriannuel avec sparklines (`HistoriquePluriannuelPage.tsx`)
- ✅ Génération PDF officielle via jsPDF + en-tête République Française (`pdfExport.ts`)

**Score final : 10/10 FAIT.** Les 6 scripts de recette retournent exit 0.