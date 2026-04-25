# Changelog — Mode d'emploi (formation académique IH2EF / EAFC)

## Livraison du 25 avril 2026

### Vision
Refonte du Mode d'emploi en **outil de formation académique** consolidé, accessible depuis tous les modules sans dupliquer les contenus déjà rédigés. Niveau IH2EF / EAFC, pour présentation au rectorat de la Guadeloupe.

### Conformité réglementaire
- **Instruction M9-6** (DGFiP — 19 janvier 2026, 4 tomes + 26 planches)
- **Décret GBCP 2012-1246** (art. 4 pour EPLE, art. 14+ pour comptables publics)
- **Code de l'éducation** R.421-1 à R.421-79 (consolidé 14/03/2026)
- **Ordonnance 2022-408** (RGP — mention obligatoire dans tous les actes)
- **Code de la commande publique** + décret 2025-1386 (seuils 2026)
- **RGPD UE 2016/679** (art. 15, 30, 33)
- **Décret 2010-888** + circulaire MENH1310955C (entretiens professionnels)
- **Circulaire MENE2407159C 16/07/2024** (voyages scolaires)

### Architecture

#### Base pédagogique (`src/data/aide/`)
- **12 modules** : cockpit, paramètres, import, balance, compte-financier, marchés, voyages, fonds-sociaux, enquêtes, entretiens, calendrier, transverse
- **72 articles** structurés (6 fiches par module : vue d'ensemble, cadre réglementaire, pas-à-pas, confirmé, expert, pièges)
- **65 entrées de glossaire** institutionnel (acronymes, termes financiers, références juridiques)
- **157 questions FAQ** consolidées
- **86 modèles** (actes, courriers, conventions, PV, tableaux)

#### Backend (Lovable Cloud)
Migration `20260425074645_e8f01b4b…sql` :
- Tables : `aide_articles`, `aide_glossaire`, `aide_modeles`, `aide_faq`, `aide_onboarding_progress`
- RLS activée pour chaque table (lecture publique, écriture admin)

#### Logique applicative (`src/lib/aide/`)
- **`search.ts`** — moteur de recherche unifié transverse (4 types : article / glossaire / FAQ / modèle), scoring pondéré, tri par pertinence, filtre par module et limite paramétrable
- **`markdown.tsx`** — renderer markdown léger sans dépendance (titres, gras, italiques, code, listes, tables, blockquotes, hr)
- **`pdfExport.ts`** — 3 exports PDF institutionnels (article unique, guide module complet avec sommaire + glossaire ciblé, glossaire global)

#### Routes & Pages (`src/pages/aide/`)
| Route | Composant | Rôle |
|-------|-----------|------|
| `/aide` | `AideAccueil` | Hero + recherche + accès aux 12 modules + parcours d'onboarding + ressources |
| `/aide/article/:slug` | `AideArticle` | Lecture d'une fiche avec breadcrumb, badge niveau, références, articles liés |
| `/aide/module/:moduleId` | `AideModule` | Sommaire des 6 fiches d'un module + export guide PDF |
| `/aide/glossaire` | `AideGlossaire` | Recherche + filtre alphabétique + filtre module + export PDF |
| `/aide/faq` | `AideFAQ` | Accordéon par module avec recherche transverse |
| `/aide/modeles` | `AideModeles` | Catalogue filtrable des 86 modèles |
| `/aide/onboarding/:profilId` | `AideOnboarding` | Parcours guidés SG / AC / Ordonnateur avec progression persistée |
| `/aide/reglementation` | `AideReglementation` | Index des 10 sources réglementaires majeures avec liens officiels |

#### Intégration sidebar
Ajout du groupe « Ressources » avec entrée « Mode d'emploi » (badge NEW).

### Parcours d'onboarding
- **Secrétaire général** — 8 étapes (45 min)
- **Agent comptable** — 10 étapes (60 min)
- **Ordonnateur / chef d'établissement** — 6 étapes (30 min)

Chaque étape est cochable, persistée en localStorage par profil, avec lien direct vers l'écran cible.

### Tests de recette (3 scripts — tous exit 0)

```
$ node scripts/verify-aide-completude.mjs
18 OK / 0 KO  (12 modules, 72 articles, 65 glossaire, 157 FAQ, 86 modèles, 6 références)

$ node scripts/verify-aide-recherche.mjs
14 OK / 0 KO  (4 types de hits, scoring, tri, filtre module, limite, helpers)

$ node scripts/verify-aide-pdf.mjs
11 OK / 0 KO  (3 exports PDF, charte commune, sommaire, mentions M9-6/GBCP)
```

### Préservation de l'existant
Aucune régression : les contenus pédagogiques déjà présents dans chaque module (ex. `MarcheModeEmploi.tsx`, `MarcheBibliotheque.tsx`) restent intacts. Le Mode d'emploi unifié les **complète et les indexe** sans les remplacer.

### Validation
- `bunx tsc --noEmit` : exit 0
- 3 scripts de recette : exit 0
- Pas de doublon de slug, pas d'incompatibilité de types