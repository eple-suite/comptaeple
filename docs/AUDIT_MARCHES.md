# AUDIT — Module Marchés publics (5 dimensions)

| Dimension | Score | Constat |
|---|---|---|
| Conformité réglementaire (CCP 2026) | **4,5 / 5** | Seuils horodatés alignés décrets 2025-1386 et 2025-1383 ; clause env L2112-2 bloquante ; critère CA ≤ 1,5× appliqué ; bases légales référencées dans chaque pièce. Reste à intégrer le paramétrage UI des seuils dans `MarcheParametres`. |
| Robustesse technique | **4,5 / 5** | Migration idempotente (DROP IF EXISTS, ADD COLUMN IF NOT EXISTS, trigger guards). 5 scripts de recette exit 0. Aucun impact sur l'import existant. |
| Couverture fonctionnelle | **3,5 / 5** | Tables cycle de vie créées (avenants, BDC, reconductions, sous-traitants, groupements, archives). UI des onglets cycle de vie, page anti-saucissonnage dédiée et module groupements à brancher dans une prochaine itération. |
| Ergonomie utilisateur | **4 / 5** | Wizard 7 étapes lisible avec progress bar, bloquant explicite sur clause env et plafond CA, draft auto-sauvé. |
| Maintenabilité | **4,5 / 5** | Code factorisé dans `lib/` (seuils, saucissonnage, rétroplanning, presets) et `docs/` (docxBuilder + pieces). Pas de duplication, pas de régression sur l'existant. |

**Score global : 4,2 / 5**

## Reste à faire (hors itération courante)
- UI heatmap fournisseur × famille (page `/marches/anti-saucissonnage`).
- Onglets cycle de vie sur la fiche détail marché (avenants, BDC, reconductions, sous-traitants).
- Page `/marches/groupements` avec détection d'opportunités multi-EPLE.
- Page `/marches/rar` avec export Excel format DAJ-REAP.
- CRUD éditable des seuils dans `MarcheParametres.tsx`.
- Module archivage long terme avec recherche full-text et upload bucket.
