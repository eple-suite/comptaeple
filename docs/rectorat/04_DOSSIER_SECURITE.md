# Dossier sécurité technique

> Académie de la Guadeloupe — Plateforme **comptaeple**
> Document généré le 2026-04-25 — Version 1.0 (présentation rectorat)

## 1. Authentification

- E-mail / mot de passe + Google OAuth
- Vérification e-mail obligatoire (pas d'auto-confirm)
- Pas de signups anonymes

## 2. Autorisation (RLS)

Rôles : `admin`, `observateur_rectoral`, `moderateur_opale`, utilisateur authentifié.
Stockage des rôles dans la table dédiée `user_roles` (jamais sur `profiles`).
Fonction `has_role(uuid, app_role)` SECURITY DEFINER.

## 3. Politiques RLS

Toutes les tables métier ont RLS activée. Les politiques restreignent l'accès aux établissements de rattachement de l'utilisateur (ou `admin` global).

## 4. Buckets storage

- `accreditation-pieces` : privé, RLS stricte (chef d'établissement uniquement)
- `fs-pieces` : privé, RLS chef d'établissement
- `opale-captures` : privé, RLS auteur + modérateurs

## 5. Edge Functions

Toutes les fonctions sensibles (assistant-expert, satd-assistant) appliquent une vérification de rôle côté serveur, jamais côté client.

## 6. Audit

- `rgpd_acces_logs` : exports Art. 15
- `opale_acces_log` : consultation des fiches
- `vue_rectorat_logs` : accès observateurs

## 7. Recommandations résiduelles

- Activer 2FA pour les comptes `admin` (à venir)
- Audit pénétration externe avant mise en production rectorat
