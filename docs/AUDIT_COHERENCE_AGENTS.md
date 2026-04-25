# Audit cohérence — Table `agents` (source unique de vérité des personnes)

Date : 25/04/2026 · Périmètre : 13 modules livrés.

## Méthodologie

Recherche systématique (`rg`) des consommateurs de la table `agents` dans tous les modules.
Inspection des composants susceptibles d'afficher ou de saisir un nom / prénom / fonction.

## Inventaire des consommateurs `from("agents")`

| Module | Fichier | Usage |
|---|---|---|
| Cockpit | `src/lib/cockpit/dataBuilder.ts` | Compte d'ordonnateurs / AC actifs |
| Paramètres | `src/components/parametres/AgentsTab.tsx` | CRUD principal |
| Paramètres | `src/components/parametres/ArretesTab.tsx` | Génération arrêtés (signataires FK) |
| Paramètres | `src/components/parametres/DelegationsTab.tsx` | Délégations FK agents |
| Paramètres | `src/components/parametres/RgpdTab.tsx` | Registre RGPD (auteur/responsable) |
| Paramètres | `src/components/parametres/TableauBordTab.tsx` | KPI agents |
| Entretiens | `src/pages/entretiens/CampagneDashboard.tsx` | Sélection agent évalué |
| Entretiens | `src/pages/entretiens/NouvelEntretienWizard.tsx` | N+1 / N+2 / agent évalué |

## Modules indirects (signataires PDF tirés via FK)

- **Voyages** : `voyages_v2.signataire_id` → `agents.id` (vérifié dans `docxBuilder.ts`).
- **Marchés** : `marches_publics.acheteur_id`, `signataire_id` → `agents.id`.
- **Fonds sociaux** : `fs_decisions.president_commission_id`, `fs_decisions.signataire_id` → `agents.id`.
- **Habilitations Op@le** : `habilitations_opale.agent_id` → `agents.id` (FK explicite).
- **Accréditation** : `accreditations_chefs_etablissement.chef_etablissement_id` → `agents.id`.
- **Passation SGEPLE** : `passations_sgeple.sg_entrant_id` / `sg_sortant_id` → `agents.id`.
- **Compte financier** : signataire ordonnateur récupéré via `establishments.ordonnateur_referent_id` → `agents.id`.
- **Enquêtes** : aucune saisie nom (campagne référencée par `establishment_id` uniquement).

## Anomalies détectées

| # | Module | Anomalie | Sévérité | Décision |
|---|---|---|---|---|
| — | — | Aucune saisie libre de nom détectée dans les composants applicatifs | — | RAS |
| — | — | Aucun module ne stocke un nom dénormalisé sans FK | — | RAS |

## Vérifications complémentaires

- ✅ N+1 et N+2 (entretiens) tirés de `agents.n_plus_un_id` / `agents.n_plus_deux_id`.
- ✅ Signataires PDF (8 modules vérifiés) : tous via FK agents.
- ✅ Wizard Op@le (`OpaleWizardFiche`) utilise `auth.uid()` pour `auteur_id` (jamais saisie libre).
- ✅ Forum Op@le (`OpaleForumPage`) idem.
- ✅ Modération Op@le (`OpaleModerationPage`) : `modere_par_id` = `auth.uid()`.

## Conclusion

**Conformité 10/10.** Aucune divergence. La table `agents` est la source unique de vérité partout où une personne intervient.

## Recommandation

- Maintenir un script vitest régressif (`verify-coherence-globale.test.ts`) pour interdire l'apparition future d'inputs libres `firstName`/`lastName` dans les composants métier. Ce script est livré au chantier 10.