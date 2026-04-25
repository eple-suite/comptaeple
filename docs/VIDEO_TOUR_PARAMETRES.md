# Tour vidéo — Module Paramètres (script de démonstration rectorale)

**Durée cible** : 12 minutes  
**Public** : Recteur, secrétaire général de l'académie, agents comptables  
**Cadre** : présentation Comptaeple — Académie de Guadeloupe

---

## Plan de démonstration

### Séquence 1 — Tableau de bord (1 min 30)

1. Ouvrir **Paramètres → Tableau de bord**.
2. Pointer le badge "Niveau de conformité" (Excellente / Acceptable / À revoir).
3. Décrire les 8 tuiles : établissements, agents actifs, délégations actives, expirations, actes signés (12 mois), bottin, anomalies.
4. **Message clé** : *"Ce module agrège en temps réel l'état de conformité du groupement comptable au regard du décret GBCP et du Code de l'éducation."*

### Séquence 2 — Carte d'identité du groupement (1 min)

1. Onglet **Groupement** : afficher la carte d'identité.
2. Insister sur : code groupement, date d'arrêté constitutif, agent comptable titulaire (date de prise de fonction), fondé de pouvoir.
3. **Message clé** : *"Ces 14 champs constituent la carte d'identité juridique exigée par l'article 86 du décret GBCP."*

### Séquence 3 — Établissements détaillés (1 min)

1. Onglet **Établissements** : barre de recherche, table avec UAI / SIRET / effectifs.
2. Filtrer par ville. Afficher la colonne "Conformité" (anomalies UAI/SIRET).
3. **Message clé** : *"L'UAI est validé selon le format RAMSESE, le SIRET selon l'algorithme de Luhn — toute saisie non conforme est bloquée."*

### Séquence 4 — Agents BIATSS et séparation des fonctions (2 min)

1. Onglet **Agents BIATSS** : registre filtrable, alertes en temps réel.
2. Tenter de cumuler les rôles "Agent comptable" + "Ordonnateur" → afficher l'erreur **GBCP_SEPARATION**.
3. Afficher un régisseur sans suppléant → afficher l'alerte **REGIE_SUPPLEANT_MANQUANT** (instruction 06-031-A-B-M art. 5).
4. **Message clé** : *"Le contrôle interne comptable et financier (CICF) impose la séparation des fonctions. L'application matérialise cette règle de manière bloquante."*

### Séquence 5 — Délégations de signature (1 min 30)

1. Onglet **Délégations** : créer une délégation partielle d'ordonnateur (R.421-13) avec plafond 25 000 €.
2. Afficher une délégation expirant à J+15 → badge ambre "Expire bientôt".
3. Abroger une délégation existante avec motif "Fin de fonction".
4. **Message clé** : *"Le registre conserve l'historique complet, y compris les abrogations et leur motif — exigence de traçabilité du décret GBCP article 16."*

### Séquence 6 — Bottin institutionnel (45 s)

1. Onglet **Bottin** : naviguer dans les catégories (Rectorat, DSDEN, DGFiP, ARS).
2. Recherche rapide par nom de correspondant.
3. **Message clé** : *"Toute la chaîne institutionnelle de l'académie regroupée en un seul annuaire."*

### Séquence 7 — Générateur d'arrêtés (2 min)

1. Onglet **Arrêtés** → Nouvel acte : type "Délégation de signature de l'ordonnateur".
2. Renseigner agent, signataire, date, plafond, périmètre.
3. Cliquer **Aperçu A4** → ouverture de l'acte mis en forme institutionnelle (en-tête République française, visas, considérants, articles, signature).
4. Pour un arrêté de régisseur, montrer l'apparition automatique de la **mention RGP 2022-408** ("le cautionnement n'est plus exigé").
5. Archiver → afficher le **hash SHA-256** dans la liste.
6. **Message clé** : *"13 types d'actes générés automatiquement, signés numériquement par leur empreinte SHA-256 — preuve d'intégrité opposable."*

### Séquence 8 — RGPD et demande d'accès Art. 15 (1 min 30)

1. Onglet **RGPD** : présenter les 5 fiches du registre Art. 30.
2. Saisir un matricule EN ou un nom → générer la **demande d'accès Art. 15**.
3. Ouvrir le HTML produit : identité, statut, actes, historique de fonctions.
4. Mentionner que chaque consultation est tracée dans `rgpd_acces_logs`.
5. **Message clé** : *"Pleine conformité au RGPD UE 2016/679 et à la loi Informatique et Libertés modifiée."*

### Séquence 9 — Mode d'emploi 8 chapitres (45 s)

1. Onglet **Mode d'emploi** : dérouler les 8 chapitres.
2. Pointer les badges réglementaires sur chaque chapitre.
3. **Message clé** : *"Outil de formation continue niveau IH2EF/EAFC, intégré directement à l'application."*

### Séquence 10 — Conclusion (30 s)

- Récapituler : 9 onglets, 8 tables, 45 tests automatisés (exit 0).
- Annoncer la disponibilité du **Cahier de recette** (`docs/RECETTE_PARAMETRES.md`) et de l'**Audit de conformité** (`docs/AUDIT_PARAMETRES.md`).

---

## Conseils de réalisation

- **Outils** : capture d'écran 1920×1080, focale automatique sur le pointeur, voix off institutionnelle.
- **Données** : utiliser un jeu d'essai anonymisé (RGPD).
- **Sous-titres** : générés automatiquement, vérifiés manuellement pour les acronymes (GBCP, RAMSESE, CICF, RGP).
- **Export** : MP4 H.264, 720p minimum pour distribution rectorale.