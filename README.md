# EPLE Suite

Plateforme de gestion comptable et financière des EPLE, GRETA et CFA, développée par l'agence comptable du groupement Coeffin (Guadeloupe).
Conforme à l'instruction budgétaire et comptable **M9-6**, au **GBCP** (décret 2012-1246) et au **règlement général sur la comptabilité publique (RGP, décret 2022-408)**.

---

## Stack technique

| Couche | Technologies |
| --- | --- |
| Build / langage | Vite 5 + React 18 + TypeScript 5 |
| UI | Tailwind CSS 3 + shadcn/ui (Radix UI), Lucide, Recharts, Framer Motion |
| État / données | TanStack Query, Zustand, React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Edge Functions Deno) |
| Hébergement | Vercel |

Volumétrie du dépôt : **166 pages** (`src/pages/`, 92 routes déclarées dans `App.tsx`), **185 composants**, **12 Edge Functions** Supabase et **69 migrations** SQL.

---

## Prérequis

- **Node.js ≥ 18** (ou **Bun**) et npm.
- Accès au projet **Supabase** (URL + clé publique).
- Un compte **Vercel** pour le déploiement.

---

## Installation & lancement local

Le projet utilise **npm** (présence d'un `package-lock.json` ; pas de `bun.lockb`).

```sh
npm install
npm run dev
```

Le serveur de développement démarre sur **http://localhost:8080** (port défini dans `vite.config.ts`).

---

## Variables d'environnement

Les variables sont préfixées `VITE_` (exposées au client par Vite). Renseignez-les dans un fichier `.env` à la racine — **ne jamais committer ce fichier**.

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (publishable / anon) Supabase |
| `VITE_SUPABASE_PROJECT_ID` | Référence du projet Supabase |

> Les variables `VITE_*` sont **publiques par nature** : n'y placez jamais de clé de service ou de secret.

**CORS des Edge Functions** — l'origine autorisée est pilotée par le secret Supabase `ALLOWED_ORIGIN` (voir `supabase/functions/_shared/cors.ts`). En production, définir `ALLOWED_ORIGIN = https://<domaine-prod>` ; la valeur par défaut `*` ne doit pas être conservée en production.

---

## Structure du projet

```
src/
├── pages/          # 166 pages (routes applicatives)
├── components/     # 185 composants
│   ├── ui/         #   primitives shadcn/ui
│   ├── auth/       #   authentification
│   ├── balance/    #   balance comptable
│   ├── cockpit/    #   cockpit décisionnel
│   ├── cofieple/   #   compte financier EPLE
│   ├── opale/      #   imports/exports Op@le
│   ├── hyperale/   #   analyse Op@le
│   ├── entretiens/ #   entretiens RH
│   ├── import/     #   imports de données
│   ├── rapport/    #   rapports
│   ├── dashboard/  #   tableaux de bord
│   ├── parametres/, settings/, demo/
├── contexts/       # AuthContext, EstablishmentContext, DemoModeContext
├── lib/            # moteurs métier M9-6, parsers Op@le, bases de connaissances (GBCP, code éducation…)
├── hooks/          # hooks React réutilisables
├── integrations/
│   └── supabase/   #   client.ts (créé via VITE_SUPABASE_*), types.ts générés
├── store/          # stores Zustand
├── data/, utils/, styles/, test/

supabase/
├── config.toml     # project_id
├── functions/      # 12 Edge Functions Deno (+ _shared)
└── migrations/     # 69 migrations SQL
```

---

## Supabase

- **Référence du projet** : `qbhxjazikziooyqwxcip`
- **Sécurité** : Row Level Security (RLS) active, modèle RBAC avec séparation stricte des sphères ordonnateur / agent comptable, conformément à la M9-6.

**Edge Functions** (`supabase/functions/`) :

| Fonction | Rôle |
| --- | --- |
| `analyze-balance` | Analyse de la balance comptable |
| `assistant-expert-eple` | Assistant expert (RAG ancré documentaire) |
| `chat-eple` | Assistant conversationnel EPLE |
| `entretiens-claude-rh` | Aide aux entretiens RH |
| `entretiens-repartir-texte` | Répartition de texte d'entretien |
| `fs-import-mapping` | Mapping d'import du compte financier |
| `generate-annexe` | Génération d'annexes |
| `generate-report` | Génération de rapports |
| `satd-assistant` | Assistant SATD |
| `validate-accounts` | Validation des comptes |
| `voyages-don-tacite-job` | Traitement des dons tacites (voyages) |

Le code CORS partagé se trouve dans `supabase/functions/_shared/cors.ts`.

---

## Scripts disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (port 8080) |
| `npm run build` | Build de production (`vite build`, sortie `dist/`) |
| `npm run build:dev` | Build en mode développement |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | Analyse ESLint |
| `npm test` | Tests (Vitest, run unique) |
| `npm run test:watch` | Tests en mode watch |
| `npm run recette:diagnostic` | Diagnostic financier de recette |
| `npm run verify:bilan` / `verify:commentaires` / `verify:sde-sdr` / `verify:balance` | Vérifications métier ciblées |
| `npm run ci:diagnostic` | Chaîne CI (diagnostic + vérifications bilan/commentaires) |
| `npm run report:ci` | Génération du rapport CI |

---

## Déploiement

Déploiement sur **Vercel** :

- Commande de build : `vite build` (`npm run build`)
- Répertoire de sortie : `dist/`
- En-têtes de sécurité définis dans **`vercel.json`** : Content-Security-Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`.

Penser à configurer les variables d'environnement `VITE_*` côté Vercel et le secret `ALLOWED_ORIGIN` côté Supabase.

---

## Conformité & données sensibles

- Traitement de données soumises au **RGPD** (données comptables, personnels, établissements).
- **Ne jamais committer** le fichier `.env`, de clé de service Supabase, ni de **données comptables réelles** (balances, exports Op@le, fichiers de paie, données nominatives).
- Les imports de données sensibles (paie, exports financiers) sont traités **côté client** lorsque la confidentialité l'exige.
- Respect des conventions de la chaîne financière et de la séparation ordonnateur / comptable.
