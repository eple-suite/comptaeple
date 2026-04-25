# AUDIT — Plateforme AIDE Op@le académique

Date : 25/04/2026 · Audit interne post-livraison

## Sécurité applicative

| Contrôle | Statut |
|---|---|
| RLS activée sur les 10 tables Op@le | ✅ |
| Helper `opale_user_can_view_fiche` (security definer) | ✅ |
| Rôles séparés `moderateur_opale` et `observateur_rectoral` | ✅ |
| Trigger `opale_recalc_utilite` (security definer, search_path public) | ✅ |
| Trigger `opale_incr_consultation` (security definer) | ✅ |
| Index full-text français + GIN sur tags | ✅ |
| Aucune écriture autorisée par utilisateurs anonymes | ✅ |

## Conformité RGPD

| Item | Statut |
|---|---|
| Détection automatique UAI/SIRET/INE/email/téléphone/IBAN | ✅ régressif (8 tests) |
| Blocage publication si donnée sensible | ✅ |
| Auto-évaluation 5 cases obligatoires avant publication | ✅ |
| Journalisation `opale_acces_log` (art. 30 RGPD) | ✅ |
| Mention obligatoire « complémentaire » dans bandeau permanent | ✅ |
| CGU explicites (licence CC-BY-SA, RGPD, modération) | ✅ |

## Conformité institutionnelle

- ✅ Renvoi explicite vers l'assistance officielle (DAF A3 / Pléiade / Inetum) dans le bandeau, les CGU, et le système prompt de l'Assistant Expert EPLE.
- ✅ Pas de reproduction des manuels Op@le.
- ✅ Versioning Op@le imposé sur chaque fiche.
- ✅ Modération préalable pour visibilité ≥ académique.

## Tests automatisés

- 6 scripts vitest : 42 assertions, exit 0.
- TypeScript : exit 0.

## Préservation de l'existant

- Module Entretiens Professionnels : intact.
- Module Habilitations Op@le (rentrée) : intact.
- Module Mode d'emploi (aide) : intact, enrichi d'un nouveau corpus académique.
- Sidebar : ajout d'une seule entrée « AIDE Op@le académique » dans Ressources.

## Risques résiduels et plan d'action

| Risque | Mitigation prévue |
|---|---|
| Volume futur de fiches non maîtrisé | Rotation modération + alertes périmétrie |
| Dépendance évolutions Op@le (versions Inetum) | Versioning obligatoire + statut « à vérifier » automatique |
| Données sensibles dans captures images | Charte explicite + responsabilité contributeur + signalement communautaire |
| Surcharge modérateurs | Priorisation par module + fiches déjà votées utiles |

## Recommandations

1. Lancer une campagne de formation 1h pour les agents comptables (parcours guidé).
2. Désigner 2 modérateurs académiques (référents Pléiade) pour la phase pilote.
3. Auditer le corpus tous les 6 mois (statut « à vérifier »).
4. Intégrer les fiches publiées dans le RAG de l'Assistant Expert (itération 3).