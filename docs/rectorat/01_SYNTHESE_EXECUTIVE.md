# Synthèse exécutive — comptaeple

> Académie de la Guadeloupe — Plateforme **comptaeple**
> Document généré le 2026-04-25 — Version 1.0 (présentation rectorat)

## 1. Objet

comptaeple est une plateforme académique mutualisée d'assistance à la fonction d'agent comptable d'EPLE, déployée pour l'académie de la Guadeloupe. Elle agrège **13 modules métier** couvrant l'ensemble du cycle comptable, budgétaire, RH et de gouvernance.

## 2. Périmètre fonctionnel

| Module | Finalité | Référentiel |
|---|---|---|
| Cockpit | Vue consolidée groupement | M9-6 / RCBC |
| Compte financier | COFI ordo + comptable | REPROFI 4.6 |
| Balance | Import + anomalies M9-6 | M9-6 |
| Voyages scolaires | Workflow réglementaire | Circ. 2011-117 / RGP |
| Fonds sociaux | Décision chef d'étab + PDF | Code Éduc. L.531-2 |
| Marchés | Seuils, pièces, RAR, saucissonnage | CCP / Décret 2025 |
| Régies | Création / contrôle / SATD | RGP 2022-408 |
| Entretiens pro | RH BIATSS REFERENS / RIFSEEP | Décret 2010-888 |
| Rentrée | Passation, accréditation, habilitations | GBCP art. 9 |
| Enquêtes | Bourses, non-déspécialisable | Circ. annuelles |
| AIDE Op@le | Capitalisation académique | Charte interne |
| Assistant Expert | RAG corpus encadré | — |
| Liens utiles | 47 liens institutionnels | — |

## 3. Engagements clés

- **Conformité RGPD** (registre Art. 30, mentions Art. 13/14, accès Art. 15)
- **Sécurité** : RLS Postgres + rôles (admin, observateur_rectoral, moderateur_opale)
- **Mutualisation** : la plateforme AIDE Op@le permet le partage normé entre AC
- **Complémentarité** : ne se substitue **pas** à l'assistance Pléiade ni au bureau réglementation comptable du rectorat.

## 4. Indicateurs de livraison

- 13 modules livrés et recettés
- 50+ scripts de recette automatisés (vitest + node)
- 13 documents livrables produits
- 0 régression bloquante détectée
