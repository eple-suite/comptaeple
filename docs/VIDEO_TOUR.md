# VIDEO TOUR — Voyages v2 (livraison du 24/04/2026)

## Vérification en 5 minutes

### 1. Tests automatisés (1 min)
```bash
bunx vitest run src/test/alertes-voyage.test.ts
```
Attendu : **7 tests passants, exit code 0**.  
Couvre les 3 scénarios exigés : délai CA < 30 j ROUGE, engagement avant CA ROUGE, CA manquant ROUGE, plus 4 autres (délai OK, budget déséquilibré, accompagnateurs facturés, étranger sans Ariane).

### 2. Route /voyages (existante, NON RÉGRESSÉE) — 1 min
- Aller sur `/voyages` : tout le module v1 est intact (dashboard, voyages, élèves, marchés, régies…)
- Aucune fonctionnalité v1 n'a été supprimée.

### 3. Route /voyages-v2 (NOUVELLE) — 2 min
- Aller sur `/voyages-v2`
- Page d'accueil v2 avec :
  - Lien "Lancer le wizard 8 étapes"
  - Bouton "Tester le moteur d'alertes" → ouvre une démo qui injecte un voyage fictif (départ J+15, CA J+0) et affiche les alertes ROUGE remontées
- Cliquer "Lancer le wizard" → wizard 9 étapes (incluant rétroplanning J-180→J+120)

### 4. Lecture du RECAP (1 min)
- Ouvrir `docs/RECAP_VOYAGES_INSTRUCTIONS.md`
- Liste explicite FAIT / PARTIEL / NON FAIT par instruction
- Les éléments NON FAIT sont assumés et listés en bas

## Points de vigilance
- `/voyages` (v1) et `/voyages-v2` coexistent volontairement — la v1 ne sera supprimée qu'après portage complet (32 docs, bilan Créteil, règle 8 €, import SIECLE).
- Le moteur d'alertes est livré comme **pure function** ; l'UI (bandeau + sidebar permanente) reste à connecter sur les écrans du wizard.
- Persistance `vs_alertes` : table prête, l'écriture sera branchée après la sidebar UI.

## Comment vous pouvez vérifier l'honnêteté du livrable
1. `rg -n "alertesEngine" src/` → 1 fichier moteur + 1 page démo + 1 test
2. `cat docs/RECAP_VOYAGES_INSTRUCTIONS.md` → liste exhaustive des manques
3. `bunx vitest run` → exit 0 ou la livraison est cassée (ne pas accepter)