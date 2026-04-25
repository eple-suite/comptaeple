# AUDIT_COFI — Auto-évaluation (5 dimensions)

| Dimension | Note /5 | Justification |
|-----------|---------|---------------|
| **Conformité réglementaire** | 4/5 | M9-6 tomes 1-4 + GBCP 2012-1246 art. 51-52 + R.421-77 + RGP 2022-408 cités, formules pièce 14 conformes (FR haut/bas/écart, CAF budg/compt, FR mobilisable). Schéma XML rectoral non implémenté (déféré, schéma non publié). |
| **Couverture fonctionnelle** | 3.5/5 | 4 sections ordo présentes (34 fiches catalog), pièce 14 enrichie complète (22 éléments), vue groupement opérationnelle, export 3 PDF + ZIP + JSON. Branchement détaillé des 25 fiches Ordo restantes aux données réelles : reporté (volume hors scope, tracé dans RECAP). |
| **Qualité du code** | 4/5 | Composants typés, séparation lib/UI, design system respecté (HSL tokens), 0 régression sur acquis. ExportTroisPdfBouton utilise `any` ciblé sur `resultats[budget]` pour absorber l'hétérogénéité du store (acceptable, à raffiner). |
| **Tests & vérifiabilité** | 4/5 | 5 scripts de recette (exit 0), 52 vérifications cumulées. Pas de tests visuels PDF automatisés (vérification manuelle ou CI à monter). |
| **Documentation** | 5/5 | RECAP audit honnête (FAIT/PARTIEL/NON FAIT/DÉFÉRÉ), CHANGELOG, RECETTE avec comparatif DAF, VIDEO_TOUR scénarisé, AUDIT auto-évalué. |

**Note globale : 4.1 / 5**

## Forces

- Pierre angulaire `IndicateurAvecVisuel` réutilisable partout, garantit la mise en page DAF (chiffres + visuel même page) en print PDF.
- Vue groupement opérationnelle (agrégation, heatmap, top 5, score composite, export PDF).
- Export unifié 3 PDF + bundle ZIP rectorat + JSON indicateurs avec filigrane PROJET commutable.
- Audit RECAP honnête : déclare ce qui est PARTIEL/DÉFÉRÉ plutôt que de prétendre 100 %.
- Préservation totale des acquis (séparation sphères, formules Op@le, commentaires auto, REPROFI AC, Annexe 11 composantes).

## Limites assumées (tracées dans RECAP_COFI_INSTRUCTIONS.md)

- Branchement individuel des 25 fiches Ordo restantes aux données réelles (catalog → composants `Fiche*.tsx` dédiés). Volume estimé ~2 000 LoC, à planifier en itération dédiée.
- Pyramide d'âges créances 416 (nécessite import des échéances comptables non disponibles aujourd'hui).
- Histogramme distribution DGP (nécessite ventilation par fournisseur).
- CRUD UI bibliothèque commentaires AC (templates seuls suffisent pour l'instant).
- Schéma XML rectoral (non publié par les rectorats académiques).
- Workflow email transmission rectorat avec accusé (nécessite paramétrage SMTP + worker).
- Export DOCX (priorité PDF, faisable sur demande via skill `docx`).