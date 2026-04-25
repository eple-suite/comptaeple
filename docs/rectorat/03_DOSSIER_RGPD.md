# Dossier RGPD complet

> Académie de la Guadeloupe — Plateforme **comptaeple**
> Document généré le 2026-04-25 — Version 1.0 (présentation rectorat)

## 1. Responsable de traitement

Rectorat de l'académie de la Guadeloupe — Délégué à la protection des données académique.

## 2. Registre Art. 30

Voir `src/lib/parametres/rgpd.ts` (constante `REGISTRE_TRAITEMENTS`) et l'onglet **Paramètres > RGPD** de l'application. 7 traitements recensés :

1. Gestion des agents BIATSS
2. Entretiens professionnels (REFERENS / RIFSEEP)
3. Fonds sociaux (familles bénéficiaires)
4. Voyages scolaires (élèves participants)
5. SATD (débiteurs)
6. AIDE Op@le (auteurs / consultations)
7. Vue rectorat (logs d'accès)

## 3. Mentions Art. 13/14

Mention standardisée affichée à chaque collecte (cf. `MENTION_INFORMATION_AGENT`).

## 4. Droits Art. 15 (accès)

Génération automatique d'un rapport HTML des données détenues sur un agent : **Paramètres > RGPD > Demande d'accès**.

## 5. Anonymisation

Le module AIDE Op@le détecte automatiquement les motifs sensibles : UAI, SIRET, INE, IBAN, NIR, e-mail nominatif, n° de téléphone (cf. `src/lib/opale/anonymisation.ts`). Publication bloquée si motif détecté.

## 6. Conservation

| Donnée | Durée | Référence |
|---|---|---|
| Comptabilité | 10 ans | LPF L.102 B |
| RH agents actifs | Carrière + 5 ans | Délibération CNIL |
| Élèves voyages | 1 an après voyage | Code Éduc. |
| Logs RGPD | 3 ans | Délibération CNIL |

## 7. Sous-traitants

- Hébergement : Lovable Cloud (UE)
- IA : Lovable AI Gateway (Google Gemini, OpenAI GPT) — pas de données nominatives transmises sans pseudonymisation préalable.
