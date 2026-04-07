Le module HYPER@LE est désormais le point d'entrée unique pour l'analyse financière dans le Cockpit.

## Consolidation effectuée
- Les pages "Indicateurs M9-6" (/indicateurs) et "Fonds de roulement" (/fonds-roulement) sont supprimées de la navigation
- Les anciennes routes redirigent automatiquement vers /hyperale/analyse
- Le Dashboard ne contient plus de KPI financiers détaillés — un bandeau résumé avec CTA renvoie vers HYPER@LE
- Les fichiers Indicators.tsx et WorkingCapital.tsx sont conservés mais non routés (code de référence)

## Pages
1. Accueil : Sélecteur multi-établissements, KPIs (FDR, CAF, Trésorerie, Réserves), alertes intelligentes
2. Analyse Complète : Graphiques, explications pédagogiques, textes prêts à copier (annexe COFI, note CE, CA)
3. Data Journal : Journal chronologique manuel + détection IA d'anomalies
4. Paramétrages : Seuils personnalisables, mode Débutant/Expert
5. Assistant IA : Chatbot contextuel dédié

## Différenciation vs ChatEple global
- ChatEple = widget flottant généraliste (procédures, réglementation)
- HyperaleAssistant = assistant contextuel financier intégré dans le module
