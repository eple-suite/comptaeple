# VIDEO_TOUR_COFI — Parcours utilisateur (3 min)

## Scène 1 (0:00–0:30) · Vue groupement
- Onglet « Groupement » dans Compte Financier
- KPIs cumulés (FDR, trésorerie, jours FDR moyen, EPLE en risque)
- Top 5 EPLE en risque (score composite 0–100, code couleur)
- Heatmap : chaque indicateur coloré selon les seuils M9-6
- Bouton « PDF consolidé » → A4 paysage prêt pour réunion AC

## Scène 2 (0:30–1:30) · Composant IndicateurAvecVisuel
- Mise en page imposée : numéro · titre · réf · statut couleur
- Colonne gauche : chiffres clés N/N-1, variation €/%, benchmark
- Colonne droite : visuel (bars, lines, donut, stacked) ou SVG custom
- Commentaire automatique éditable + commentaire manuel persisté
- `pageBreakInside: avoid` → visuel et chiffres restent sur la même page PDF

## Scène 3 (1:30–2:30) · Export Compte Financier
- Bouton « Export Compte Financier » avec badge PROJET visible
- Menu : 3 PDF individuels · les 3 d'un coup · ZIP rectorat · JSON
- Toggle « Filigrane PROJET » (utile tant que non voté en CA)
- En-tête institutionnel RF + MEN + Académie sur chaque page
- Bundle ZIP = 3 PDF + indicateurs JSON + MANIFEST.txt

## Scène 4 (2:30–3:00) · Audit & traçabilité
- `docs/RECAP_COFI_INSTRUCTIONS.md` : état FAIT/PARTIEL/NON FAIT honnête
- 5 scripts de recette automatiques (exit 0) pour CI
- Préservation totale des acquis : moteur bilanciel, REPROFI AC,
  Annexe 11 composantes, séparation stricte ordo/AC