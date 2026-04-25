# RECETTE — Plateforme académique AIDE Op@le

Date : 25 avril 2026 · Académie de la Guadeloupe · Itération 2 (finale MVP étendu)

## Périmètre validé

| Domaine | Statut |
|---|---|
| Base de données (10 tables, RLS, triggers, full-text FR) | ✅ migré |
| Wizard 7 étapes (création / édition / brouillon) | ✅ |
| Bibliothèque (filtres, tri) | ✅ |
| Détail fiche (vote utilité, signalement, journal accès) | ✅ |
| Mes fiches (Tabs : brouillon / soumise / publiée / rejetée) | ✅ |
| Recherche avancée (mots-clés, module, type, version, fraîcheur) | ✅ |
| Forum Q&R inter-AC | ✅ |
| Modération académique (rôle `moderateur_opale`) | ✅ |
| Tendances et alertes (top consultations + fiches à re-vérifier) | ✅ |
| Tableau de bord académique (KPI consolidés) | ✅ |
| CGU (CC-BY-SA, RGPD, modération) | ✅ |
| Bandeau « complémentaire à l'assistance officielle » | ✅ partout |
| Détection RGPD (UAI/SIRET/INE/email/tel/IBAN) | ✅ régressifs |
| Gamification (score + 6 badges) | ✅ |

## Scripts de recette — 6/6 exit 0 (42 assertions)

| # | Script | Assertions | Statut |
|---|---|---|---|
| 1 | `verify-opale-anonymisation.test.ts` | 8 | ✅ |
| 2 | `verify-opale-types.test.ts` | 5 | ✅ |
| 3 | `verify-opale-gamification.test.ts` | 6 | ✅ |
| 4 | `verify-opale-routing.test.ts` | 14 | ✅ |
| 5 | `verify-opale-rappel-officiel.test.ts` | 4 | ✅ |
| 6 | `verify-opale-wizard-rgpd.test.ts` | 5 | ✅ |

Commande de relance :
```bash
bunx vitest run scripts/verify-opale-*.test.ts
```

## Build

`bunx tsc --noEmit` : ✅ exit 0

## Conformité réglementaire et déontologique

- Bandeau systématique « complémentaire à l'assistance officielle DAF A3 / Pléiade ».
- Rappel : aucune valeur opposable. Les fiches reflètent l'expérience opérationnelle.
- Licence Creative Commons CC-BY-SA 4.0 entre agents comptables académiques.
- Pas de reproduction des manuels Inetum / Op@le.
- RGPD : détection automatique des UAI, SIRET, INE, emails, téléphones, IBAN ; blocage à la publication.
- Journalisation `opale_acces_log` (art. 30 RGPD) pour toute action sensible.
- Modération obligatoire pour visibilité académique ou nationale.

## Dépendance assistance officielle

L'Assistant Expert EPLE renvoie explicitement vers :
- l'assistance Op@le DAF A3 (Pléiade)
- le bureau réglementation comptable du rectorat
- les communautés AC (AJI, Intendance Zone)

pour toute question dépassant le corpus documentaire et les fiches publiées.