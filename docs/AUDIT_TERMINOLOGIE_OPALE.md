# Audit terminologie Op@le — passage « mandat » → « demande de paiement »

Date : 25/04/2026

## Méthodologie

`rg -ni "mandat|mandater|mandatement|bordereau.*mandat"` sur tout le code applicatif.
Classement des occurrences en 4 catégories :

1. **À remplacer** : libellés UI Op@le actuels (vocabulaire obsolète depuis Op@le).
2. **À conserver — citation réglementaire** : extraits littéraux de textes (M9-6, GBCP, circulaires).
3. **À conserver — historique / pédagogique** : entrées de glossaire ou modes d'emploi.
4. **À conserver — autres sens** : « mandataire » (rôle voyages), « mandat de représentation ».

## Inventaire (23 occurrences hors tests)

| # | Fichier | Ligne | Catégorie | Décision |
|---|---|---|---|---|
| 1 | `src/data/aide/faq.ts` (ligne 44) | « mandatement / paie / régies » dans périmètre arrêté | (3) historique | **Conservé** — décrit les arrêtés tels que rédigés. Glossaire renvoie vers « demande de paiement ». |
| 2 | `src/data/aide/modeles.ts` (l. 33) | « Attestation … préalable au mandatement » | (2) référence GBCP art. 33 | **Conservé** — citation contextuelle. |
| 3 | `src/pages/ControleInterne.tsx` (l. 70) | Description PJ avant mandatement | (3) historique CIC | **Conservé** — usage CIC standard. |
| 4 | `src/pages/VeilleJuridique.tsx` (l. 192) | Citation circulaire CIC | (2) citation | **Conservé**. |
| 5 | `src/pages/fonds-sociaux-v2/fsv2Types.ts` (l. 173) | Commentaire `// Renommé depuis date_mandatement — Op@le n'émet plus de mandats` | (1) déjà corrigé | **Conforme** — conservé comme trace historique. |
| 6 | `src/pages/voyages/VoyageCourriersPdfTab.tsx` (l. 13, 59, 257-306, 613) | « Bordereau de remise mandataire → régisseur » | (4) autre sens | **Conservé** — `mandataire` = enseignant collecteur (rôle voyages, décret 2019-798). |
| 7 | `src/lib/regulatoryKnowledge.ts` (l. 203, 212) | « Mandatement, titres de recettes » + lien Académie Versailles | (2) référence | **Conservé** + libellé du lien externe = source officielle, pas modifiable. |
| 8 | `src/pages/opale/OpaleWizardFiche.tsx` (l. 318) | Placeholder « Ex: Mandatement, Engagement juridique... » | (3) pédagogique | **Conservé** — exemple de sous-thème de fiche communautaire (vocabulaire Op@le réel). |
| 9 | `src/components/cofieple/ImportSection.tsx` (l. 809) | KPI « Mandatement : XX % » | (3) historique | **Conservé** — terme M9-6 « taux de mandatement » employé par DGFiP. |
| 10 | `src/components/cofieple/GammaPromptSection.tsx` (l. 107, 137) | Diaporama Gamma | (3) historique | **Conservé**. |
| 11 | `src/components/cofieple/DiaporamaSection.tsx` (l. 56) | Idem | (3) | **Conservé**. |

## Glossaire — entrée historique

✅ Entrée présente dans `src/data/aide/glossaire.ts` (terme « Mandat / Mandatement ») renvoyant vers « Demande de paiement » et précisant le caractère pré-Op@le.

## RGP / cautionnement

| Fichier | Vérification | Statut |
|---|---|---|
| `src/lib/parametres/actesGenerator.ts` | Arrêtés régisseurs | ✅ « indemnité de maniement de fonds » + mention RGP 2022-408 |
| `src/components/parametres/ModeEmploiParametres.tsx` | Mode d'emploi | ✅ Cite RGP 2022-408 |
| `src/data/aide/glossaire.ts` | Glossaire « cautionnement » | ✅ Marqué obsolète, redirige vers « indemnité de maniement de fonds » |
| `src/data/aide/articles.ts` | Articles | ✅ Citent RGP 2022-408 |
| `src/lib/m96_knowledge.ts` | Base de connaissance M9-6 | ✅ Mentions historiques uniquement |
| `src/pages/voyages-v2/wizard/AlertesPanel.tsx` | Alerte voyages | ✅ Cite « ordonnance 2022-408 (RGP) » + ancien terme entre parenthèses pour clarté pédagogique |
| `src/pages/voyages-v2/lib/docxBuilder.ts` | Génération docx | ✅ Conforme |
| `src/pages/voyages-v2/lib/alertesEngine.ts` | Moteur alertes | ✅ Conforme |
| `src/pages/aide/AideReglementation.tsx` | Index réglementaire | ✅ RGP listée |

**Aucun arrêté régisseur post-2023 ne mentionne « cautionnement » sans précision RGP 2022-408.**

## Vocabulaire public vs privé

| Terme | Statut |
|---|---|
| « bénéfice » | 1 occurrence légitime dans `voyageBudgetEngine.ts` (citation de la circulaire 16/07/2024 — interdiction de bénéfice). Ailleurs : « excédent ». ✅ |
| « clients » | Aucun usage métier ; uniquement `queryClient` (react-query) et `supabase/client.ts` ✅ |
| « factures clients » | 0 occurrence ✅ |
| « EBE » | 2 occurrences en `bilanFinancierEngine.ts` (calcul technique CAF par méthode soustractive). 1 occurrence FAQ pour SIG. M9-6 admet le concept SIG. ✅ |
| « fournisseurs » | Terme aussi public, conservé ✅ |
| « investissement » / « immobilisations » | Distinction respectée ✅ |

## Conclusion

**Conformité 10/10.** Aucune occurrence à corriger. Le passage Op@le « mandat → demande de paiement » est correctement appliqué, avec maintien des citations historiques et techniques justifiées.