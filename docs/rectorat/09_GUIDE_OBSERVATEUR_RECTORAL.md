# Guide de l'observateur rectoral

> Académie de la Guadeloupe — Plateforme **comptaeple**
> Document généré le 2026-04-25 — Version 1.0 (présentation rectorat)

## Accès

1. Connexion via `https://comptaeple.lovable.app` (ou domaine académique)
2. Le rôle `observateur_rectoral` est attribué par un administrateur académique
3. Page d'accueil : **/rentree/vue-rectorat**

## Périmètre

- Lecture seule sur tous les EPLE de l'académie
- KPI consolidés (cockpit académique)
- Habilitations Op@le par EPLE (sphères ordo / comptable séparées GBCP art. 9)
- Entretiens (vue agrégée, sans détail nominatif sauf consentement)

## Traçabilité

Chaque accès est journalisé dans `vue_rectorat_logs` (horodatage, EPLE consulté, type d'écran). Logs consultables par le DPD académique sur demande.

## Limites

- Pas de modification des données
- Pas d'accès aux pièces justificatives nominatives sans demande formelle
- Pas d'accès aux fiches AIDE Op@le marquées `visibilite=privee`
