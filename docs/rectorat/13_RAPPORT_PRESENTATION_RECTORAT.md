# RAPPORT DE PRÉSENTATION AU RECTORAT DE LA GUADELOUPE

> Académie de la Guadeloupe — Plateforme **comptaeple**
> Document généré le 2026-04-25 — Version 1.0 (présentation rectorat)

## Préambule

Le présent rapport synthétise la livraison de la plateforme **comptaeple**, outil académique mutualisé d'aide à la fonction d'agent comptable d'EPLE, et constitue la pièce maîtresse de la présentation au rectorat de la Guadeloupe.

## I. Contexte et finalité

[Voir 01_SYNTHESE_EXECUTIVE.md]

La plateforme s'inscrit en **complémentarité** des dispositifs nationaux (Op@le, assistance DAF A3 Pléiade) et académiques (bureau réglementation comptable). Elle ne s'y substitue jamais.

## II. Périmètre fonctionnel livré (13 modules)

[Voir 01_SYNTHESE_EXECUTIVE.md §2]

## III. Conformité réglementaire

[Voir 08_ANNEXE_REGLEMENTAIRE.md]

Chaque module cite explicitement les textes applicables. L'audit `AUDIT_REFERENCES_REGLEMENTAIRES.md` atteste de la cohérence transverse :

- SATD = loi 2017-1837 art. 73 (et non plus seule loi 1966)
- Régies = ordonnance 2022-408 (RGP) — terme « cautionnement » remplacé par « indemnité de maniement de fonds »
- Habilitations Op@le = séparation stricte des sphères GBCP art. 9
- Vocabulaire « mandat » → « demande de paiement » harmonisé sur Op@le

## IV. Conformité RGPD

[Voir 03_DOSSIER_RGPD.md]

- Registre Art. 30 implémenté en code (`src/lib/parametres/rgpd.ts`) et exposé dans l'UI (Paramètres > RGPD)
- Mentions Art. 13/14 standardisées
- Génération Art. 15 automatisée
- Anonymisation automatique des publications AIDE Op@le (UAI, SIRET, INE, IBAN, NIR, e-mail, téléphone)

## V. Sécurité

[Voir 04_DOSSIER_SECURITE.md]

- RLS Postgres activée sur 100 % des tables métier
- Rôles dans table dédiée `user_roles` + fonction `has_role()` SECURITY DEFINER
- Buckets storage privés à RLS stricte
- Vue rectorat en lecture seule intégralement tracée (`vue_rectorat_logs`)

## VI. Qualité logicielle

- 50+ scripts de recette automatisés (`docs/AUDIT_RECETTE.md`)
- 6 scripts de l'audit transverse final : **18 tests, 100 % verts** (cohérence globale, terminologie Op@le, références réglementaires, uniformité PDF, mode démo, vocabulaire transverse)
- TypeScript strict (`tsc --noEmit` exit 0)
- Audits dédiés : agents, établissements, nomenclature M9-6, terminologie, références, PDF

## VII. Mutualisation académique (AIDE Op@le)

Plateforme de capitalisation des connaissances Op@le entre AC :

- Wizard de création en 7 étapes (avec auto-évaluation RGPD obligatoire)
- Modération par rôle dédié `moderateur_opale`
- Forum Q&R inter-AC
- Tableau de bord académique
- Gamification (badges, scoring) pour stimuler les contributions
- Bannière `Rappel officiel` systématique : redirection vers Pléiade en cas de doute

## VIII. Vue rectorat

[Voir 09_GUIDE_OBSERVATEUR_RECTORAL.md]

Accès en lecture seule pour le rôle `observateur_rectoral`, traçabilité intégrale, périmètre académique consolidé.

## IX. Recommandations

1. Valider le **plan de formation** (11_PLAN_FORMATION.md)
2. Désigner les **observateurs rectoraux** et les **modérateurs AIDE Op@le**
3. Programmer un **audit pénétration externe** avant mise en production large
4. Adopter les **indicateurs de réussite** (12_INDICATEURS_REUSSITE.md)

## X. Roadmap

[Voir 06_ROADMAP.md]

## XI. Conclusion

La plateforme est livrée, recettée et documentée. Elle est prête pour une présentation officielle au rectorat de la Guadeloupe et pour un déploiement progressif sur les EPLE de l'académie, sous réserve des validations institutionnelles requises.

---

**Annexes** : 12 documents complémentaires (`docs/rectorat/01_*` à `docs/rectorat/12_*`).
