# VIDEO TOUR — Module Enquêtes Rectorat

Description écran par écran d'un parcours type AC de groupement.

## Plan 1 — Hub Enquêtes Rectorat (`/enquetes-rectorat`)
- En-tête institutionnel avec icône `ClipboardList`, titre « Enquêtes Rectorat ».
- Sous-titre rappelant les références réglementaires : M9-6 tome 3, note DAF A3, circulaire MENE1704160C 17/02/2017.
- Grille de 8 cartes (responsive 1/2/3 colonnes selon viewport) : Nomenclature M9-6, Calendrier des campagnes, Bibliothèque d'enquêtes, Wizard reliquats BOP, Rapprochement bourses SIECLE, Vue rectorat consultant, Suivi & relances internes, Historique pluriannuel.
- Au survol d'une carte : ombre, bord primaire, indication visuelle de cliquabilité.

## Plan 2 — Nomenclature M9-6 (`/enquetes-rectorat/nomenclature`)
- Bandeau rouge en haut listant les comptes NON DÉSPÉCIALISABLES (DAF A3).
- Champ de recherche actif sur compte / libellé / programme BOP.
- Tableau regroupé par 10 familles : 4411X, 44191X, 443110, 4412X, 44192X, 4413X, 44193X, 4416X, 4417X, 44181X.
- Pour chaque ligne : compte (mono), libellé, BOP (avec sous-programme en gris dessous), badge sens normal, icône `ShieldCheck` verte ou badge « NON » avec verrou rouge, référence réglementaire.
- Les lignes non-déspécialisables ont un fond rouge léger.
- Les comptes critiques (443110, 441914, 44114) affichent en plus une icône triangle d'alerte.

## Plan 3 — Calendrier des campagnes (`/enquetes-rectorat/calendrier`)
- Bandeau bleu en haut décrivant les alertes automatiques J-30 / J-15 / J-7 / J.
- Grille 1 ou 2 colonnes selon viewport, regroupée par mois (mars → décembre).
- Pour chaque mois : icône horloge, nom du mois, liste des échéances.
- Chaque échéance : intitulé, badge type, description, référence réglementaire en italique.

## Plan 4 — Vue Rectorat (`/enquetes-rectorat/vue-rectorat`)
- En-tête avec icône `Eye`, mention « Consultation académique en lecture seule. Rôle observateur_rectoral. Toute consultation est tracée. ».
- Boutons en haut à droite : « Export consolidé PDF », « Export Excel ».
- Pour chaque campagne : carte avec intitulé + badge type, ratio EPLE conformes / total, échéance.
- Liste des EPLE par campagne avec statut (badge), boutons « Détails » et « Demander complément ».

## Plan 5 — Sidebar & navigation
- Entrée « Enquêtes Rectorat » dans le groupe Pilotage AC, icône `ClipboardList`, badge « hot ».
- Le groupe contient désormais : Veille juridique, Contrôle interne, Exécution budgétaire, Marchés publics, Habilitations Op@le, Enquêtes Rectorat.