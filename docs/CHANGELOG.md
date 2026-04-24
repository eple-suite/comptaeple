# CHANGELOG — Module Voyages scolaires (refonte)

Conformité visée : Circulaire MENE2407159C du 16-7-2024 (BO n° 30), Code de
l'éducation art. R.421-20, M9-6, GBCP 2012-1246, CCP 2026 (décrets 2025-1386
et 2025-1383), Loi de finances 66-948 art. 21, Règlement UE 2021/817
(Erasmus+), ordonnance RGP 2022-408.

## Lot 1 — livré (chantiers 0, 1, 1bis)

### Chantier 0 — Suppression propre des « Templates »
- **Supprimé** : `src/pages/voyages/VoyageTemplatesTab.tsx` (composant + imports).
- **Modifié** : `src/pages/Voyages.tsx`
  - retrait de l'import `VoyageTemplatesTab`
  - retrait du `<TabsTrigger value="templates">`
  - retrait du `<TabsContent value="templates">` complet
- **Conservé volontairement** : la table Supabase `voyage_templates` (legacy)
  n'est plus lue ; aucune route applicative n'y fait référence. Drop différé
  (réversibilité préservée le temps de la présentation rectorat).
- **Vérification** : `rg "VoyageTemplatesTab|/voyages/templates" src/` →
  aucune occurrence applicative restante.

### Chantier 1 — Schéma DB voyages
9 nouvelles tables (préfixe `vs_`), RLS systématique alignée sur le pattern
`user_establishments` + `has_role(...,'admin')` :

| Table | Rôle |
|---|---|
| `vs_voyages` | Voyage principal (libellé, destination, dates, type projet, budget, gouvernance CA, Erasmus+, wizard step) |
| `vs_recettes` | Recettes par voyage avec **statut financeur** (notifiée/demandée/promesse/hypothèse) et imputation M9-6 |
| `vs_depenses` | Dépenses par poste, dont flag `est_accompagnateur` pour faire respecter la règle d'or |
| `vs_participants` | Élèves inscrits, données SIECLE (INE, classe, bourse, paiements, quittance) |
| `vs_accompagnateurs` | Encadrants, fonction, prise en charge financière |
| `vs_documents_generes` | Bibliothèque PDF/Word produits |
| `vs_bilans` | Bilan financier modèle Créteil + reliquat / famille |
| `vs_jalons` | Rétroplanning (J-180 → J+120) |
| `vs_alertes` | Journal des alertes de conformité |

- Index : `establishment_id`, `statut`, `(date_depart,date_retour)`, `voyage_id`, `ine`.
- Triggers `updated_at` sur `vs_voyages`, `vs_participants`, `vs_bilans`.
- Cascades `ON DELETE CASCADE` depuis `vs_voyages` vers les tables filles.

### Chantier 1 bis — Architecture menu Voyages
- **Aucune régression** : route `/voyages` conservée pointant sur le module
  legacy. Le futur module v2 vivra sur `/voyages/v2/*` et sera basculé en
  primaire au lot suivant.
- **Créé** : arborescence `src/pages/voyages-v2/{components,lib,hooks,wizard,docs}`.
- **Créé** : `src/pages/voyages-v2/types.ts` — modèle TypeScript complet
  miroir de la DB + libellés FR + **table d'imputation M9-6** par nature de
  recette/poste de dépense (référentiel partagé pour wizard, bilan, génération
  documentaire).

## Lots restants (chantiers 2 → 8) — à livrer

| # | Intitulé | Statut |
|---|---|---|
| 2 | Wizard nouveau voyage (8 étapes, branchement par type) | À faire |
| 3 | Moteur d'alertes contextuelles | À faire |
| 4 | Génération 32 documents docx + ZIP arborescent | À faire |
| 5 | Bilan financier modèle Créteil + règle des 8 € (LF 66-948) | À faire |
| 6 | Mode d'emploi intégré + assistant IA Lovable AI | À faire |
| 7 | Dashboard, prédictif, comparateur devis, mode démo rectorat | À faire |
| 8 | Intégration écosystème (Marchés/Compte fi/Balance) + bascule v1→v2 | À faire |

## Points de vigilance

- **Table `voyage_templates` legacy** : à dropper après confirmation que rien
  ne la référence (le hook `useVoyageTemplates` n'existe plus).
- **Bascule menu** : le label sidebar « Voyages scolaires » pointe encore sur
  `/voyages` (legacy). Au lot suivant : ajouter une entrée v2 puis basculer
  par défaut, sans casser les liens existants depuis CommandPalette / Dashboard.
- **Onglet Modèles vide** : un commentaire JSX le signale dans `Voyages.tsx`
  pour éviter toute confusion lors d'un retour rapide sur l'ancien menu.
- **Type Erasmus+ partenaire** : aucun titre de recette à émettre côté EPLE,
  seulement des dépenses puis refacturation — à enforcer dans le wizard étape 2.
- **Règle accompagnateurs** : prévoir blocage à l'étape 3 du wizard si une
  ligne de dépense `poste='accompagnateurs'` n'est pas couverte par une
  recette explicite hors `nature='famille'`.
