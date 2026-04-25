# Audit — Plateforme d'import (auto-évaluation 5 dimensions)

| Dimension | Note /5 | Justification |
|-----------|---------|---------------|
| **Robustesse** | 4 | Parsing factorisé, scoring d'onglet généralisé, `repairSheetRange` réutilisé partout, hash SHA-256 pour idempotence, archivage best-effort (l'insertion historique réussit même si l'upload échoue). À renforcer : traitement async pour fichiers > 5 Mo (file d'attente différée). |
| **Conformité réglementaire** | 5 | M9-6 (cohérence balance/SDE/SDR), GBCP 2012-1246 (séparation ordonnateur/comptable preservée — pas de mutation côté front), RGPD (art. 6.1.e, mention bloquante SIECLE, durée conservation explicite, RLS par EPLE), conservation 10 ans via bucket privé. |
| **Ergonomie** | 4 | Drop multi-fichiers, détection auto + override manuel par sélecteur, aperçu pré-import avec totaux, validation croisée temps réel, onglet historique séparé. À améliorer : sélection période manuelle + bandeau de comparaison N/N-1 visuel. |
| **Maintenabilité** | 5 | Tout passe par `src/lib/import/` (single source of truth), parsers isolés par type, composants UI atomiques (`DropZoneMulti`, `CrossValidationPanel`, etc.), 6 scripts de recette en CI, types TS stricts, aucun `any` non encapsulé. |
| **Sécurité** | 4 | RLS strictes (`user_has_establishment_access`), trigger `SECURITY DEFINER` avec `search_path` figé, bucket privé avec policy de download conditionnée à l'EPLE, hash de fichier. À ajouter : chiffrement applicatif des champs téléphone/adresse responsables SIECLE (actuellement protégés par RLS uniquement). |

**Score global : 22/25 (88 %)**

## Hors périmètre de cette itération (par contrainte de temps)

- Mode « Lot groupement » multi-EPLE avec mapping UAI → EPLE automatique (la détection UAI est déjà en place, il reste à câbler l'orchestration UI)
- Traitement asynchrone via Edge Function pour fichiers > 5 Mo (le parsing synchrone tient < 5 Mo)
- Anonymisation programmée des élèves sortis depuis > 1 an (table prête, job à planifier via `pg_cron`)
- Comparaison binaire de 2 versions archivées (les 2 fichiers sont consultables séparément)

## Dépendances

- Réutilise `selectOpaleBalanceSheet`, `selectOpaleSdeSdrSheet`, `parseSdeRows`, `parseSdrRows` (existants)
- Étend `cofieple_import_logs` (audit COFIEPLE) avec `imports_historique` (versioning transverse)