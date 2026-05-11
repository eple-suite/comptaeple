## Objectif

Permettre une démo crédible au rectorat en ajoutant un **Mode démonstration global** activable d'un clic, qui pré-remplit localement (sans aucune écriture en base) chacun des modules majeurs avec un scénario réaliste « EPLE globalement conforme + 2-3 points de vigilance ».

## Architecture

### 1. Contexte global `DemoModeContext`
Nouveau fichier `src/contexts/DemoModeContext.tsx` :
- État `isDemoMode: boolean` persisté dans `localStorage` (clé `comptaeple_v1_demo_mode`)
- Méthodes `enable()`, `disable()`, `toggle()`
- Provider monté dans `App.tsx` au-dessus de toutes les routes
- Hook `useDemoMode()` consommé dans chaque module

### 2. Bandeau permanent + bouton de bascule
- `src/components/demo/DemoModeBanner.tsx` : bandeau orange sticky en haut de l'app quand actif (« Mode démonstration — données fictives, aucune écriture en base. Désactiver »)
- `src/components/demo/DemoModeToggle.tsx` : bouton dans la sidebar, toujours visible, libellé contextuel (Activer / Désactiver)

### 3. Jeu de données fictif centralisé
Nouveau dossier `src/lib/demo/fixtures/` avec un fichier par module :
- `etablissement.ts` — Lycée fictif « Lycée Démonstration Rectorat » (UAI fictif)
- `cofi.ts` — COFI complet N et N-1 (équilibré, mais SRH avec marge négative → vigilance orange)
- `hyperale.ts` — Indicateurs FDR/BFR/Trésorerie réalistes (FDR jours = 92, OK ; mais DRFN > 90 j → vigilance)
- `balance.ts` — Balance avec 2-3 anomalies M9-6 mineures (compte 408 non soldé, écart 4011/40171)
- `satd.ts` — 3 SATD : 2 traités, 1 en cours avec délai dépassé (rouge)
- `marches.ts` — 4 marchés dont 1 approchant le seuil MAPA (orange)
- `entretiens.ts` — 8 fiches avec 2 en retard de validation
- `fonds_sociaux.ts` — 12 demandes, 1 dossier en attente d'avis CA
- `enquetes.ts` — Enquête rectorat partiellement remplie
- `voyages.ts` — Réutilise le `buildDemoDraft()` existant
- `index.ts` — Point d'entrée unique avec helper `getDemoFixtures()`

### 4. Intégration dans chaque module
Pour chaque page racine de module, ajouter un effet conditionnel :
```ts
const { isDemoMode } = useDemoMode();
const data = isDemoMode ? demoFixtures.cofi : realData;
```
Modules touchés (page principale uniquement, pour rester scopé) :
- Voyages (déjà existant — connecter au global)
- COFI / Compte financier (`useCofiepleStore`)
- HYPER@LE (`useHyperaleStore`)
- Balance / Import (état local)
- SATD
- Marchés publics
- Entretiens RH
- Fonds sociaux
- Enquêtes rectorat
- Veille juridique (rien à faire — déjà du contenu statique)

### 5. Page de présentation démo
Nouvelle route `/demo` (ou onglet sur le dashboard) :
- Vue d'ensemble du scénario (« Lycée Démo Rectorat — EPLE de 850 élèves »)
- Liste des points de vigilance à mettre en avant (le pitch)
- Bouton « Activer le mode démonstration »
- Liens directs vers chaque module pré-rempli

## Scénario fictif retenu

**Lycée Démonstration Rectorat** (UAI `0DEMO123`), 850 élèves, budget 2,4 M€

Globalement conforme, mais avec 3 points de vigilance pédagogiques :
1. **SRH** : marge négative de -8 k€ (à expliquer — sous-tarification cantine)
2. **DRFN** : 94 jours (au-dessus du seuil 90 j)
3. **Voyage Espagne** : départ J+15, CA J+0 (alerte rouge délai CA)
4. **SATD** : 1 procédure dépassée 60 j sans relance
5. **Marché transport** : cumul 12 mois 78 k€ (87% du seuil MAPA)

Permet de démontrer la **valeur ajoutée des moteurs d'alerte** sans inquiéter le rectorat (le reste est conforme).

## Garde-fous

- Aucun appel `supabase.from(...).insert/update/delete` quand `isDemoMode === true`
- Les fixtures sont en mémoire uniquement (chargées via React state ou stores Zustand temporairement)
- À la désactivation : retour automatique aux vraies données de l'établissement sélectionné
- Badge `Sparkles + Mode démonstration` visible dans **chaque** page d'un module quand le mode est actif

## Détails techniques

- Context API + `useSyncExternalStore` pour synchronisation localStorage
- Les stores Zustand existants (HYPER@LE, COFI) reçoivent un `loadDemoFixtures()` action
- Les hooks d'accès BD (`useVoyages`, `useCofiData`, etc.) court-circuitent React Query quand `isDemoMode` est vrai et retournent les fixtures
- Les mutations (insert/update) deviennent des no-op + toast « désactivé en mode démo »

## Livraison

| # | Fichier / dossier | Action |
|---|---|---|
| 1 | `src/contexts/DemoModeContext.tsx` | créé |
| 2 | `src/components/demo/DemoModeBanner.tsx` | créé |
| 3 | `src/components/demo/DemoModeToggle.tsx` | créé |
| 4 | `src/lib/demo/fixtures/*.ts` | 10 fichiers créés |
| 5 | `src/App.tsx` | provider + bandeau |
| 6 | `src/components/AppSidebar.tsx` | toggle visible |
| 7 | `src/pages/Demo.tsx` | page de pilotage de la démo |
| 8 | Pages module (×9) | branchement `useDemoMode()` |

Estimation : ~15 fichiers créés / modifiés. Aucune migration BD.
