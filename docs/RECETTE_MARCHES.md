# RECETTE — Module Marchés publics (CCP 2026)

## Scénarios validés

| # | Scénario | Résultat attendu | Statut |
|---|---|---|---|
| 1 | Seuil FS au 15/02/2026 | Dispense = 40 000 € HT | ✓ |
| 2 | Seuil FS au 15/06/2026 | Dispense = 60 000 € HT (décret 2025-1386) | ✓ |
| 3 | Seuil travaux au 15/01/2026 | Dispense = 100 000 € HT, formalisée = 5 382 000 € HT | ✓ |
| 4 | 100 k FS au 15/06/2026 | Procédure = MAPA avec publicité | ✓ |
| 5 | 250 k FS au 15/06/2026 | Procédure = formalisée | ✓ |
| 6 | 3 commandes même fournisseur même famille en 6 mois | Alerte critique présomption saucissonnage | ✓ |
| 7 | Cumul famille ≥ 70 % seuil | Alerte orange/rouge | ✓ |
| 8 | Création marché sans clause env (< 30 car.) | Blocage `clause_environnementale = false` | ✓ |
| 9 | Plafond CA exigé > 1,5 × montant | Blocage `capacite_eco_conforme = false` | ✓ |
| 10 | Catalogue pièces | 15 générateurs présents (11 existants + 4 nouveaux) | ✓ |
| 11 | RAR | Interface `RarLigne` + signature `generateRAR(ctx, lignes, annee)` + références R2196-1, DAJ-REAP, 25 000 € HT | ✓ |

## Reproductibilité

```bash
for f in scripts/verify-marches-*.test.ts; do npx tsx "$f" || exit 1; done
```

Tous les scripts retournent **exit 0**.
