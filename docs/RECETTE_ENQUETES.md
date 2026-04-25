# RECETTE — Module Enquêtes Rectorat

## Procédure

1. **Lancer les 6 scripts de recette**
   ```bash
   for s in verify-enquetes-nomenclature verify-enquetes-non-despecialisable \
            verify-enquetes-rapprochement-bourses verify-enquetes-vue-rectorat \
            verify-enquetes-articulation verify-enquetes-pdf; do
     bunx tsx scripts/$s.test.ts
   done
   ```
   Les 6 scripts doivent renvoyer exit 0.

2. **Recette manuelle UI**

| Test | Procédure | Résultat attendu |
|---|---|---|
| Hub | Aller sur `/enquetes-rectorat` | 8 cartes affichées, navigation fonctionnelle vers nomenclature/calendrier/vue-rectorat |
| Nomenclature | Aller sur `/enquetes-rectorat/nomenclature` | 47 comptes regroupés par 10 familles ; barre de recherche filtre en temps réel ; bandeau rouge « NON DÉSPÉCIALISABLES » visible ; lignes 443110, 44114, 441914 surlignées en rouge léger avec verrou |
| Filtre nomenclature | Saisir « 4413 » dans la recherche | Famille UE Erasmus+ filtrée |
| Calendrier | Aller sur `/enquetes-rectorat/calendrier` | 15 échéances réparties de mars à décembre, références réglementaires affichées |
| Vue rectorat | Connecté en `observateur_rectoral`, aller sur `/enquetes-rectorat/vue-rectorat` | Liste des campagnes ouvertes ; mention « Toute consultation est tracée » ; boutons Export PDF / Excel et « Demander complément » visibles |
| Sidebar | Vérifier la barre latérale | Entrée « Enquêtes Rectorat » dans Pilotage AC, badge « hot » |

3. **Recette RLS**

| Test | Procédure | Résultat attendu |
|---|---|---|
| Lecture référentiel | Tout utilisateur authentifié | Liste accessible |
| Modification référentiel | Utilisateur sans rôle admin | Échec RLS |
| Création campagne | Utilisateur AC | Succès si périmètre cohérent |
| Lecture campagnes | Utilisateur d'EPLE hors périmètre | Aucune campagne visible |
| Lecture vue rectorat | Rôle `observateur_rectoral` | Lecture seule sur toutes les réponses |
| Édition réponse soumise | Utilisateur EPLE | Bloqué (statut soumise/validée) |

## Rapprochement avec modèles rectoraux Guadeloupe

Les modèles officiels rectorat Guadeloupe (DPAE / DAFI) ne sont pas disponibles dans la base de connaissances de la plateforme à ce jour. Les sections du PDF officiel à produire (chantier 9) ont été cadrées d'après :
- M9-6 tome 3 (sens normal des soldes, comptes par famille).
- Note DAF A3 / DGESCO (règle de non-déspécialisation).
- Circulaire MENE1704160C du 17/02/2017 (bourses 2nd degré).
- Code éducation L.421-11 (rôle de l'EPLE et reddition des comptes).
- GBCP 2012-1246 (cadre comptable général).

Une fois les gabarits Guadeloupe transmis, les insérer dans `/public/templates/enquetes/` et adapter le générateur docxtemplater (chantier 9 — itération suivante).