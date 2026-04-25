# RECETTE — Voyages scolaires

## Scénario 1 — Clé en main + règle 8 €
1. Wizard → étape 1 : libellé "Madrid 3e" / cle_en_main
2. Étape 3 : 30 élèves, départ J+90
3. Étapes 4-5 : recettes 3000 € + dépenses 3000 €
4. Étape 7 : CA J+0, vote autorisation → bandeau règle 8 € prévisionnelle = ✅
5. Bilan post-voyage : recettes 3420 €, dépenses 3000 € → reliquat 14 €/famille
   → cas `excedent_remboursement` → 30 courriers + 30 mandats (cf. P2 test S1)

## Scénario 2 — Erasmus+ porteur
1. Wizard étape 2 : `erasmus_porteur` → champs convention/cofi affichés
2. Recette `erasmus` notifiée 5000 € + part familles 0 €
3. Bandeau règle 8 € : reste à charge négatif → conforme
4. Documents générés incluent convention prestataire

## Scénario 3 — Alerte délai CA
1. Voyage avec date_depart = J+15, date_ca_autorisation = aujourd'hui
2. Sidebar alertes affiche 🔴 ROUGE BLOQUANT « L'acte du CA … pris seulement 15 jours avant le départ »
3. Remontée vers `alertes_transverses` (cockpit) avec dedup_key `voyage:{id}:delai_ca`
4. cf. test P1 cas 1

## Captures avant/après (P1-P5)
- P1 : avant = pas d'alerte délai / après = 4 zones colorées + sync cockpit
- P2 : avant = règle 8 € prévisionnelle seule / après = 3 cas bilan + courriers/mandats/coupons/silence
- P3 : avant = parser SIECLE non branché UI / après = `StepImportSiecle.tsx` opérationnel
- P4 : avant = pas de page Bilan modèle Créteil / après = `/voyages-v2/bilan/:id` 6 parties
- P5 : wizard 9 étapes confirmé (8 + récap)
