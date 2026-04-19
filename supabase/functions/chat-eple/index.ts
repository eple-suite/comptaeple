import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withExpertPersona } from "../_shared/expertEPLEPersona.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function verifyAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Token invalide" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// CORPUS COMPLET — Toutes les sources injectées dans le prompt
// ═══════════════════════════════════════════════════════════════

const KNOWLEDGE_CORPUS = `
═══════════════════════════════════════════════════════════════
SOURCE 1 — INSTRUCTION CODIFICATRICE M9-6 (19 janvier 2026)
═══════════════════════════════════════════════════════════════

TOME 1 — ACTEURS ET ENVIRONNEMENT

Conseil d'administration :
- Autorité délibérante — adopte budget, DBM, compte financier, tarifs, ANV
- Textes : L421-4, R421-20, R421-25, R421-69 Code de l'éducation
- Composition tripartite : administration + personnels + usagers (24 ou 30 membres)
- Quorum : majorité des membres en exercice ; 2e convocation sous 5-8 jours sans quorum
- Attributions : budget, DBM, compte financier, tarifs, ANV, conventions, voyages scolaires, transactions, dons et legs

Chef d'établissement :
- Ordonnateur des recettes et des dépenses (R421-9)
- Prépare et exécute délibérations du CA
- Transmet les actes (Dem'Act)
- Ordonnance recettes et dépenses
- Peut réquisitionner le comptable en cas de suspension de paiement (R421-70)
- Peut déléguer sa signature à l'adjoint, au gestionnaire, au directeur SEGPA (R421-12)

Adjoint gestionnaire :
- Gestion matérielle, financière et administrative sous autorité du chef d'établissement
- Bons de commande, contrôle réception, service fait
- Préparation ordonnancement recettes/dépenses
- Situation mensuelle recettes/dépenses
- Comptabilité matières et stocks, inventaire général des immobilisations
- Mise en œuvre plan maîtrise risques financiers

Agent comptable :
- Comptable public — responsable trésorerie, comptabilité générale, contrôle interne
- Textes : R421-62 à R421-65 Code éducation, Art. 18 décret GBCP 2012-1246
- Nomination par le recteur, catégorie A, prestation de serment obligatoire
- Fonctions : prise en charge et recouvrement des recettes, paiement des dépenses après contrôles, garde des fonds et valeurs, conservation pièces justificatives, tenue comptabilité du poste, contrôle comptabilité matière, pilotage CIC au sein du groupement
- Contrôles payeur : qualité ordonnateur, disponibilité crédits, exacte imputation, validité de la créance (pièces justificatives, service fait, prescription)
- En cas d'anomalie, l'AC signale à l'ordonnateur avant suspension

Régisseurs :
- Mandataires du comptable pour encaissement/paiement limités
- Textes : Décret 2019-798, Décret 2020-922, Arrêté 13 août 2020
- Nommés par l'ordonnateur avec agrément de l'agent comptable

Contrôles :
- Transmission aux autorités de contrôle (préfet, collectivité, rectorat) sous 15 jours, contrôle légalité 30 jours
- Contrôles externes : IGESR, DRFiP/DDFiP, CRC, Cour des comptes
- RGP (remplace RPP depuis 2023) : ordonnateurs et comptables justiciables, amendes par Cour des comptes

TOME 2 — BUDGET ET EXÉCUTION

Principes budgétaires :
- Annualité (1er janvier au 31 décembre)
- Unité (budget unique, principal + annexes)
- Universalité (non-contraction, non-affectation sauf ressources conditionnées)
- Spécialité (crédits par service et domaine)
- Sincérité, Équilibre (fonctionnement + opérations en capital)

Structure du budget :
- Sections : Fonctionnement et Opérations en capital (investissement)
- Services : général + spéciaux (SRH, bourses, enseignement technique, budgets annexes GRETA...)
- Nomenclature : fonctionnement par domaine/activité (classes 6-7), investissement (classes 1-2)

Exécution des recettes :
- Phases : liquidation des droits, émission titre de recettes, prise en charge par l'AC, recouvrement
- Prescription assiette : 4 ans
- Moyens encaissement : espèces, chèques bancaires, virement, prélèvement SEPA (ICS), carte bancaire, PayFiP, chèques vacances, tickets restaurant, carte services
- Recouvrement amiable : avis des sommes à payer, relances
- Recouvrement contentieux : SATD (titre exécutoire obligatoire), commissaire de justice, saisie rémunérations, saisie comptes bancaires
- Transaction : accord amiable (art. 2044 Code civil) — vote CA
- ANV : admission en non-valeur — vote CA (ou ordonnateur si seuil délégué)
- Remise gracieuse : différente de l'ANV — décision de l'ordonnateur

Exécution des dépenses :
- Phases : engagement (juridique + budgétaire), liquidation (service fait + pièces justificatives), ordonnancement (mandatement), paiement par l'agent comptable
- Engagement : du 1er janvier au 31 décembre
- Service fait : certification obligatoire avant paiement (sauf dérogations réglementaires)
- Ordonnancement : N (1er janv – 31 déc), N+1 (période d'inventaire)
- Mandatement d'office : par le préfet en cas de carence de l'ordonnateur
- Contrôles AC : qualité ordonnateur, disponibilité crédits, exacte imputation, validité créance
- Suspension : l'AC peut suspendre, l'ordonnateur peut réquisitionner
- Délai global paiement : 30 jours (marchés publics) — intérêts moratoires si dépassement
- Moyens paiement : virement (obligatoire au-delà de certains seuils), prélèvement, chèque, espèces, carte bancaire, carte d'achat

Passifs et actifs :
- Passifs : provisions (compte 15), dettes (comptes 40, 42, 43, 44, 46), CAP, PCA
- Immobilisations incorporelles (20), corporelles (21), en cours (23), financières (26, 27)
- Amortissements fonds propres : dotation 6811 / amortissement 28
- Amortissements financement externe : reprise 1049/1349 parallèle au 28
- Stocks : comptes 31-33, évaluation à l'entrée, inventaire, dépréciation 39

Opérations spécifiques :
- Unité de caisse : tous les fonds sur compte Trésor (5151)
- Placements : VMP compte 50
- Voyages scolaires : gestion budgétaire Section 2.5.2
- Objets confectionnés : matière d'œuvre, prestations, stocks
- Valeurs inactives : compte 86 (tickets, carnets, bons)
- Période d'inventaire (janvier N+1) : CAP (408x, 428x, 438x, 448x, 468x), PAR (418x, 428x, 448x, 468x), CCA (486), PCA (487), amortissements, dépréciations (29, 39, 49, 59), provisions (15), variation stocks (603)

TOME 3 — CADRE COMPTABLE

Principes comptables :
- Régularité, sincérité, image fidèle, permanence des méthodes, continuité d'exploitation
- Spécialisation des exercices, non-compensation, prudence, intangibilité du bilan d'ouverture

Plan comptable M9-6 — Comptes clés par classe :
Classe 1 (Capitaux) : 10 financements/réserves, 101 État, 104 financements rattachés, 106 réserves (1064 SRH, 1068 excédents capitalisés), 11 report à nouveau, 12 résultat, 13 financement tiers (131 État, 132 collectivités, 134 autres), 15 provisions (151 risques, 157 gros entretien, 158 CET), 16 emprunts (165 dépôts reçus), 18 liaison (185 opérations trésorerie)
Classe 2 (Immobilisations) : 20 incorporelles (205 logiciels), 21 corporelles (211-218), 23 en cours, 26 participations, 27 autres financières (271/272 titres, 275 dépôts versés, 276 créances), 28 amortissements, 29 dépréciations
Classe 3 (Stocks) : 31 matières premières, 32 approvisionnements, 33 en-cours, 39 dépréciations
Classe 4 (Tiers) : 40 fournisseurs (401, 404, 408, 409), 41 clients/familles (411, 4112 DP, 4113 internes, 4122 voyages, 416 douteux, 419 créditeurs), 42 personnel (421, 425, 427, 428, 429), 43 organismes sociaux, 44 État/collectivités (441 subventions, 4411 État, 4412 collectivités, 441220 DGF, 44311 bourses crédit répartir, 44312 bourses part familles, 4432 primes État, 4438 fonds sociaux, 442 PAS, 445 TVA, 448 CAP/PAR), 46 débiteurs/créditeurs divers (461 déficits RGP, 462 cessions, 463 titres recouvrer, 466 mandats payer, 467 divers, 468100 produits répartir bourses), 47 transitoires (471 recettes classer, 472 dépenses avant ordonnancement), 48 régularisation (486 CCA, 487 PCA), 49 dépréciations tiers (491)
Classe 5 (Financiers) : 50 VMP (506, 507, 508), 51 banques (511 valeurs encaissement, 5113 chèques vacances, 5115 CB, 5116 prélèvements, 5117 effets impayés, 5151 Trésor), 53 caisse (531), 54 régies (543 dépenses, 545 recettes, 548 avances menues dépenses), 58 virements internes, 59 dépréciations
Classe 6 (Charges) : 60 achats/variation stocks, 61 services extérieurs, 62 autres services, 63 impôts/taxes, 64 personnel, 65 autres charges (654 pertes créances, 656 VNC, 657 subventions, 6571 fonds sociaux aides, 6583 annulation titres ant., 6584 déficits RGP), 66 charges financières (627 frais bancaires), 68 dotations
Classe 7 (Produits) : 70 ventes (706 hébergement/restauration, 70622 DP élèves, 70623 internat, 707 marchandises, 708 autres), 71 production stockée, 72 production immobilisée, 74 subventions exploitation (741 fonctionnement, 7411 État, 74121 Région, 74122 Département, 7413 communes, 744 autres, 747 publiques, 748 privées), 75 autres produits (751 redevances, 756 cessions, 758 divers), 76 produits financiers, 777 quote-part subv invest virée CdR, 78 reprises
Classe 8 : 80 engagements hors bilan, 86 valeurs inactives, 89 bilan

TOME 4 — COMPTE FINANCIER

- Document de synthèse annuel retraçant toutes les opérations budgétaires et comptables
- Préparation : arrêté des comptes bilan + charges/produits, balance définitive après régularisations
- Contenu : compte de résultat (cl.6/cl.7), bilan (actif cl.2-5 / passif cl.1,4,5), balance générale, développement charges/produits par service, tableau concordance budgétaire
- Compte rendu de gestion : rapport de l'agent comptable
- Annexe : 11 sections (faits caractéristiques, principes comptables, notes actif/stocks/créances/dettes/financements/provisions/charges/produits, engagements hors bilan)
- Vote CA avant le 30 juin N+1, transmission tutelle, conservation/archivage

Indicateurs financiers :
- Résultat = Classe 7 − Classe 6 (compte 12), affectation par CA → 1068 ou 11
- CAF = Résultat + Dotations (68) − Reprises (78) − Produits cessions (756) + VNC (656) − Quote-part financement (1049/1349)
- CAF positive = autofinancement ; IAF = insuffisance
- FRNG = Ressources stables − Emplois stables = Classe 1+2 solde ; ou = Actif circulant (3+4+5) − Dettes CT
- BFR = Créances + Stocks − Dettes exploitation
- Trésorerie nette = FRNG − BFR = Disponibilités − Dettes fin CT = 50 + 51 + 53 + 54 − 16 CT − 519
- Jours d'autonomie = (FDR / Charges annuelles fonctionnement) × 365 — seuil 30 jours minimum

Planches comptables (26 planches) :
1. Dépenses — schéma écritures
2. Recettes — schéma écritures
3. Affectation résultat N+1
4. Biens acquis financement externe
5. Biens acquis fonds propres
6. Charges à payer / Immobilisations à payer
7. Produits à recevoir
8. Charges et produits constatés d'avance
9. Dépenses avant ordonnancement / Encaissements
10. Provisions et dépréciations
11. Opérations pour compte de tiers
12. Régie de recettes
12bis. Régie d'avances
13. Évolution des stocks
14. Avances et acomptes
15. Valeurs inactives
16. Comptes de liaison budgets annexes
17. Encaissements CB et commissions bancaires
18. Comptabilisation des financements
19. Production immobilisée
20. Paye à façon (AED)
21. Paye
22. RRR obtenues
23. RRR accordées
24. Engagements hors bilan — Crédit-bail
25. Responsabilité des gestionnaires publics (RGP)
26. Différences de conversion devises

TERMINOLOGIE OP@LE (OBLIGATOIRE) :
- Op@le remplace GFC et COFI depuis 2024-2025
- Demande de paiement = anciennement "mandat" — document ordonnançant la DÉPENSE (budgétaire uniquement)
- Demande de versement = document ordonnançant une opération comptable non budgétaire (à l'initiative de l'ordonnateur ou de l'AC)
- Demande de comptabilisation = écriture comptable passée par l'agent comptable (opération technique)
- Encaissement sans opération = recettes encaissées directement sans titre préalable (ex: intérêts)
- Titre de recette = ordre de recette émis par l'ordonnateur
- Service fait = certification de la réalisation de la prestation avant paiement
- Services AP : ALO, AED, VIE, ENS

DISTINCTION CRITIQUE ÉTAT / COLLECTIVITÉ :
Comptes État (rectorat, DRFIP) : 4411, 44311, 44312, 4432, 4438, 468100, 7411, 131
Comptes Collectivité (Région/Département) : 4412, 441220, 74121, 74122, 7413, 132
⚠️ Ne JAMAIS imputer une recette collectivité sur un compte État et inversement.
⚠️ DGF (441220) EXCLUSIVEMENT réservée à la collectivité de rattachement.
⚠️ Subventions investissement : État → 131, Collectivité → 132

SOLDES NORMAUX ET ANOMALIES :
Classe 1 : CRÉDITEUR (sauf 119 débiteur)
Classe 2 : DÉBITEUR (sauf 28 amortissements créditeur)
Classe 3 : DÉBITEUR
Classe 4 : VARIABLE (401 créditeur, 4112/4113 débiteur, 416 débiteur, 421 créditeur, 4411 variable, 4412 variable)
Classe 5 : DÉBITEUR (jamais négatif ! 515 créditeur = découvert interdit, 531 créditeur = caisse négative impossible)
Classe 6 : DÉBITEUR
Classe 7 : CRÉDITEUR

CIRCUIT DES BOURSES NATIONALES :
1. Avance État : D 515 / C 44311
2. Répartition : D 44311 / C 468100
3. Imputation familles : D 468100 / C 4112/4113
4. Excédent remboursement : D 44312 / C 515
Contrôles : 44311 doit tendre vers zéro fin exercice ; 468100 apuré après répartition ; 44311 débiteur = ANOMALIE CRITIQUE

OPÉRATIONS TECHNIQUES SUR RELEVÉ DFT :
- Rejet de bourse DFT : opération technique de l'AC (demande de comptabilisation), PAS une demande de paiement. Écriture : D 4411 / C 5151 (subdivision bourses).
- Chèque impayé famille : D 5117 / C 5151 puis reconstitution créance D 4112 / C 5117. Frais bancaires : D 627 / C 5151.
- Rejet de virement : D compte tiers concerné / C 5151 — l'AC passe une demande de comptabilisation.
- Avis de crédit (intérêts, remboursements) : encaissement sans opération ou demande de comptabilisation selon nature.

═══════════════════════════════════════════════════════════════
SOURCE 2 — DÉCRET GBCP n° 2012-1246 du 7 novembre 2012
═══════════════════════════════════════════════════════════════

Cadre budgétaire (art. 7-9) :
- Art. 7 : Le budget prévoit et autorise les recettes et dépenses
- Art. 8 : L'exécution relève exclusivement des ordonnateurs et comptables publics
- Art. 9 : Fonctions d'ordonnateur et de comptable incompatibles. Conjoints des ordonnateurs ne peuvent être comptables.

Ordonnateurs (art. 10-12) :
- Art. 10 : Prescrivent l'exécution des recettes et dépenses, peuvent déléguer, s'accréditer auprès des comptables
- Art. 11 : Constatent droits/obligations, liquident recettes, émettent ordres de recouvrer, engagent/liquident/ordonnancent dépenses
- Art. 12 : Responsabilité à raison de l'exercice de leurs attributions

Comptables publics (art. 13-22) :
- Art. 13 : Agents de droit public, charge exclusive de manier les fonds et tenir les comptes
- Art. 14 : Un seul comptable par poste, prestation de serment à première installation
- Art. 16 : Désignation de mandataires (régisseurs)
- Art. 17 : Responsabilité personnelle et pécuniaire (art. 60 loi 23/02/1963)
- Art. 18 : Attributions exclusives : 1° comptabilité générale, 2° comptabilité budgétaire, 3° valeurs inactives, 4° prise en charge ordres recouvrer/payer, 5° recouvrement, 6° encaissement, 7° paiement, 8° oppositions paiement, 9° garde fonds, 10° maniement fonds, 11° conservation pièces
- Art. 19 contrôles recettes : régularité autorisation percevoir, mise en recouvrement, régularité réductions/annulations
- Art. 19 contrôles dépenses : qualité ordonnateur, exacte imputation, disponibilité crédits, validité dette, caractère libératoire
- Art. 20 : Contrôle validité dette : 1° service fait, 2° exactitude liquidation, 3° contrôles préalables, 4° visa contrôleur budgétaire, 5° pièces justificatives, 6° prescription/déchéance
- Art. 21 : Reddition des comptes à la clôture
- Art. 22 : Régisseurs pour compte des comptables

Opérations recettes (art. 23-28) :
- Art. 24 : Recettes liquidées avant recouvrement, montant intégral sans contraction
- Art. 25 : Règlement par tout moyen prévu par le code monétaire et financier
- Art. 28 : L'ordre de recouvrer a force exécutoire (art. L.252 A LPF), permet exécution forcée

Opérations dépenses (art. 29-42) :
- Art. 29 : Engagement, liquidation, ordonnancement, paiement
- Art. 30 : L'engagement est l'acte juridique créant l'obligation, dans les limites de l'autorisation budgétaire
- Art. 31 : Liquidation = vérifier réalité dette + arrêter montant (service fait + montant)
- Art. 32 : Ordonnancement = ordre de payer donné au comptable
- Art. 33 : Paiement = acte libératoire, pas avant échéance/exécution du service/décision d'attribution
- Art. 38 : Suspension/réquisition : le comptable suspend si irrégularités, ordonnateur peut requérir par écrit
- Art. 42 : Contrôle hiérarchisé (CHD) et contrôle allégé en partenariat (CAP)

Opérations trésorerie (art. 43-48) :
- Art. 43 : Mouvements numéraire, valeurs mobilisables, comptes de dépôts
- Art. 47 : Obligation de dépôt des fonds au Trésor
- Art. 48 : Caisse unique, un ou plusieurs comptes de disponibilités

Comptabilités (art. 53-60) :
- Art. 55 : Comptabilité générale + comptabilité budgétaire + comptabilité analytique possible
- Art. 56 : Comptabilité générale = ensemble des mouvements patrimoine, fondée sur constatation des droits et obligations
- Art. 57 : Qualité des comptes : conformité, permanence, exhaustivité, évaluation séparée, image fidèle
- Art. 58 : Comptabilité budgétaire = consommation autorisations et enregistrement recettes
- Art. 60 : Comptabilisation valeurs inactives

Organismes — Agent comptable (art. 188-191) :
- Art. 188 : L'AC peut exercer des fonctions de chef des services financiers et effectuer par dérogation à l'art. 9 des tâches relevant de l'ordonnateur
- Art. 190 : Régisseurs nommés par ordonnateur avec agrément AC. L'AC assiste avec voix consultative aux séances de l'organe délibérant
- Art. 191 : L'AC s'assure du respect des principes comptables et de la qualité du CIC

Organismes — Recettes (art. 192-193) :
- Art. 192 : L'ordre de recouvrer est adressé par l'ordonnateur ou l'AC. Recouvrement amiable puis contentieux. L'exécution forcée peut être suspendue sur ordre écrit de l'ordonnateur.
- Art. 193 : Sur délibération CA après avis AC : 1° remise gracieuse, 2° remise intérêts moratoires, 3° ANV (irrécouvrables), 4° rabais/remises/ristournes

Organismes — Dépenses (art. 194-195) :
- Art. 194 : L'ordonnateur seul procède à l'engagement
- Art. 195 : Réquisition : l'AC défère à la réquisition SAUF : 1° indisponibilité crédits, 2° absence service fait, 3° non libératoire, 4° défaut visa contrôleur, 5° manque de fonds

Compte financier (art. 211-214) :
- Art. 211 : États budgétaires + tableau équilibre + états financiers (bilan, CdR, annexe) + balance valeurs inactives
- Art. 212 : Établi par AC, visé par ordonnateur, soumis au CA avant 2 mois après clôture, accompagné du rapport de gestion
- Art. 213 : Soumis à approbation tutelle (1 mois pour décision)
- Art. 214 : Transmission au juge des comptes dans les 2 mois

CIC/CIB (art. 215-219) :
- Art. 215 : Dispositif de CIB et CIC dans chaque organisme
- Art. 216 : Audit interne, programme d'audit par organe délibérant
- Art. 219 : Contrôle AC par DGFIP, vérifications IGF

Champ d'application (art. 1, 4) :
- Art. 1 : Applicable aux EPLE
- Art. 4 : Les Titres II-III ne s'appliquent PAS aux EPLE → Titre Ier + Code de l'éducation

═══════════════════════════════════════════════════════════════
SOURCE 3 — CODE DE L'ÉDUCATION (version 16/03/2026)
═══════════════════════════════════════════════════════════════

Partie législative :
- L421-1 : EPLE = établissements publics à caractère administratif
- L421-2 : Collèges, lycées, EREA, écoles régionales
- L421-3 : Autonomie pédagogique/éducative/administrative. Budget en 2 sections, voté/exécuté en équilibre réel
- L421-4 : Le CA règle les affaires de l'établissement. Composition tripartite (24 ou 30 membres)
- L421-5 : Actes exécutoires sous 15 jours après transmission. Déféré tribunal administratif possible.
- L421-7 : Gestion restauration et hébergement confiée à l'EPLE
- L421-10 : Groupements de service ou comptable
- L421-11 : Adjoint gestionnaire membre équipe de direction
- L421-14 : Agent comptable nommé par le recteur, placé sous autorité administrative du chef d'étab.
- L421-16 : Mutualisation des moyens par convention

Partie réglementaire :
- R421-1 : EPLE = personnes morales de droit public, autonomie administrative et financière
- R421-4 : Contrôle de légalité (préfet) et contrôle budgétaire
- R421-8 : Le chef d'étab dirige l'EPLE et représente l'État
- R421-9 : Le chef d'étab est ordonnateur. Il prépare les travaux du CA, exécute ses délibérations, prescrit l'exécution des recettes, engage et ordonnance les dépenses.
- R421-10 : Compétent en passation de marchés et conventions
- R421-12 : Peut déléguer signature
- R421-14 à R421-16 : Composition du CA (24 membres collèges, 30 lycées)
- R421-20 : CA adopte projet d'établissement, règlement intérieur, budget, compte financier, rapport de fonctionnement
- R421-21 : CA donne accord sur conventions, contrats, adhésion à un groupement
- R421-25 : CA se réunit min. 3 fois/an à l'initiative du chef d'étab.
- R421-37/R421-41 : Commission permanente — instruit questions pour le CA
- R421-54/R421-55/R421-56 : Transmission actes aux autorités. Budget transmis sous 5 jours. Exécutoire sous 30 jours.
- R421-57 : Budget = section fonctionnement + section opérations en capital
- R421-58 : Budget voté avant le 30 novembre N-1
- R421-59 : Budget par service : général + spéciaux
- R421-60 : Services spéciaux : SRH, bourses, enseignement technique, GRETA, CFA
- R421-61 : Les DBM peuvent être adoptées en cours d'exercice
- R421-62 : L'AC nommé par le recteur parmi les catégorie A. Responsable de l'établissement siège et des rattachés (groupement comptable). Qualité de comptable public.
- R421-63 : L'AC a la charge de la comptabilité générale, recouvrement et paiement, garde des fonds
- R421-64 : L'AC responsable de la tenue comptabilité de l'établissement et des rattachés
- R421-65 : L'AC vérifie les écritures des subordonnés dans les rattachés
- R421-66 : Le chef d'étab seul compétent pour constater les droits de l'EPLE
- R421-67 : Le comptable procède au recouvrement, peut engager des poursuites
- R421-68 : Les dépenses engagées dans la limite des crédits ouverts
- R421-69 : L'AC vérifie la régularité des mandats et y donne suite
- R421-70 : Suspension de paiement par l'AC → réquisition possible (sauf art. 195 GBCP)
- R421-77 : Compte financier voté par CA avant le 30 juin N+1
- R421-78 : Contenu du CF : CdR, bilan, balance, développement par service, annexes

Groupements comptables : R421-62 — un AC commun à plusieurs EPLE, pilote le CIC de tous les établissements
Groupements de services : L421-10 — mutualisation de certaines fonctions
GRETA : budgets annexes de l'EPLE support
EPLEI : EPLE avec sections internationales

═══════════════════════════════════════════════════════════════
SOURCE 4 — CODE DE LA COMMANDE PUBLIQUE (version 16/03/2026)
═══════════════════════════════════════════════════════════════

Seuils 2026 (Décret n°2025-1386 du 29/12/2025) :
Fournitures et services :
- Dispense < 40 000 € HT (60 000 € HT à compter du 01/04/2026) — R2122-8 CCP
- Publicité BOAMP/JAL à partir de 90 000 € HT — R2131-12 CCP
- Procédure formalisée à partir de 216 000 € HT (seuil européen 2026-2027) — R2124-1 CCP
Travaux :
- Dispense < 100 000 € HT — R2122-8 CCP
- Procédure formalisée > 5 404 000 € HT — R2124-1 CCP

Principes : égalité de traitement (L3), liberté d'accès, transparence, définition des besoins (L2111-1), allotissement (L2113-10)

Procédures :
- Sans publicité ni mise en concurrence (R2122-1 à R2122-11) : montant < seuil dispense, urgence impérieuse, fournisseur unique, prestations similaires
- MAPA (R2123-1 à R2123-7) : modalités libres (R2123-4), publicité adaptée, BOAMP obligatoire > 90k€ HT
- Formalisée (R2124-1 à R2124-6) : appel d'offres, procédure avec négociation, dialogue compétitif — rare en EPLE

Computation seuils (R2121-1 à R2121-9) :
- Valeur totale HT y compris options et reconductions
- Par catégorie homogène sur la durée du marché
- Interdiction de scinder un besoin
- Les "3 devis" ne sont PAS une obligation légale mais une bonne pratique recommandée

Exécution marchés :
- Avance obligatoire ≥ 20% pour marchés > 50 000 € HT et PME (L2191-2, R2191-3 à R2191-19)
- Délai paiement 30 jours (L2192-10 à L2192-15) — intérêts moratoires + indemnité forfaitaire 40 €
- Sous-traitance : acceptation et agrément par l'EPLE, paiement direct > 600 € TTC (L2193-11)
- Modification marchés en cours (L2194-1 à L2194-3)

EPLE spécifiquement :
- Pouvoirs adjudicateurs (L1211-1)
- CA autorise le chef d'étab à signer les marchés (R421-20 Code éducation)
- CA peut déléguer passation MAPA sous un seuil
- Groupements de commandes possibles (L2113-6 à L2113-8)
- Centrales d'achat (UGAP, régionales) dispensent de mise en concurrence

Contentieux : référé précontractuel (L551-1 CJA), référé contractuel (L551-13), recours tiers Tarn-et-Garonne (2 mois)

═══════════════════════════════════════════════════════════════
SOURCE 5 — OUTILS ET PRATIQUES PROFESSIONNELLES
═══════════════════════════════════════════════════════════════

OUTILS AC :
- REPROFI : profils financiers comparatifs (5 exercices, indicateurs, comparaison moyenne académique/nationale, alertes)
- Mobilisco : suivi mobilité des AC et FDP, passations de service
- ESSATEDÉ : suivi SATD/recouvrement forcé (créances impayées, prescription 4 ans, émission SATD via PEPS)
- EFFESCO : effectifs scolaires/restauration (coût denrées, crédit nourriture A2, prix de revient)
- Op@le : progiciel comptable EPLE (budget, comptabilité, paye, régies, inventaire, recouvrement, reporting). Tutoriels disponibles sur IH2EF, académies, Intendance Zone, Espace EPLE.

FONCTIONNALITÉS OP@LE :
- Budget : saisie DBM, virements, prélèvements sur FDR
- Comptabilité : mandatement (= demande de paiement), titres de recettes, rapprochement bancaire
- Paye : conventions, vacations, indemnités
- Régies : suivi des régisseurs, plafonds, PV de vérification
- Inventaire : immobilisations, amortissements
- Recouvrement : lettres de relance, SATD (via PEPS depuis 2026)
- Reporting : balance, grand livre, compte financier

ENQUÊTES RECTORALES (calendrier type) :
- EFA (février-mars) : données financières pour REPROFI
- Créances impayées (trimestriel) : créances > 3 mois, diligences, ANV
- Rapport CIC (janvier) : taux contrôle, anomalies, plan d'action
- Enquête SRH (octobre et mars) : effectifs, coûts, tarifs
- Remontée régies (janvier) : état régies, PV, incidents
- Enquête marchés publics (mars) : marchés > 40k€
- Bilan bourses (juillet et décembre) : bénéficiaires, montants, soldes

RÈGLES DE VALIDATION COMPTABLE :
- V01 : Équilibre balance (total débits = total crédits)
- V02 : Résultat cohérent (compte 12 = classe 7 − classe 6)
- V03 : Trésorerie = FDR − BFR
- V04 : Rapprochement bancaire (515 = relevé Trésor ± opérations rapprochement)
- V05/V06 : Caisse ≥ 0, Trésor ≥ 0 (découvert interdit EPLE)
- V07 : Circuit bourses 44311/468100 (doit tendre vers zéro)
- V08 : Amortissements ≤ Valeur brute immobilisations
- V09 : Distinction État/Collectivité
- V10 : Concordance ordonnateur/comptable
- V11 : FDR ≥ 30 jours fonctionnement
- V12 : Taux recouvrement ≥ 95%

RESSOURCES COMMUNAUTAIRES :
- IH2EF : https://www.ih2ef.gouv.fr/les-ressources
- Espac'EPLE : https://espaceple.org
- IntendanceZone : https://www.intendancezone.net
- gestionnaire03.fr
- M@gistère, MF²

═══════════════════════════════════════════════════════════════
SOURCE 6 — TEXTES DE RÉFÉRENCE COMPLÉMENTAIRES
═══════════════════════════════════════════════════════════════

- M9-6 du 19 janvier 2026 (remplace version précédente)
- Décret GBCP n° 2012-1246 du 7 novembre 2012
- Code de l'éducation : L421 et R421
- Code de la commande publique, seuils 2026 : Décret n°2025-1386 du 29/12/2025
- Régies : Décret n° 2019-798, Décret n° 2020-922, Arrêté 13 août 2020
- Voyages scolaires : Circulaire du 16 juillet 2024 + Guide Eduscol décembre 2025
- RGP : Ordonnance n° 2022-408 du 23 mars 2022
- CGCT, CG3P, Code des juridictions financières

═══════════════════════════════════════════════════════════════
SOURCE 7 — CATALOGUE COMPLET DES TUTORIELS OP@LE (73 modes opératoires)
Plateforme Tribu MF² — Espace public utilisateurs Op@le
URL : https://tribu.phm.education.gouv.fr/tribu/espace/04yBrn/salle/d4QJrX/dossier/workspace_espace-public-utilisateurs-op-le_documents
═══════════════════════════════════════════════════════════════

DOSSIER 00 — INTRODUCTION À OP@LE
- MOP_00_01 : Présentation générale Op@le (interface, navigation, rôles)
- MOP_00_02 : Connexion et authentification Op@le
- MOP_00_03 : Tableau de bord Op@le — indicateurs et alertes
- MOP_00_04 : Gestion des habilitations et profils utilisateurs
- MOP_00_05 : Paramétrage de l'établissement dans Op@le

DOSSIER 01 — BUDGET
- INT_01_01_01 : Saisie du budget initial (BI)
- INT_01_01_02 : Saisie d'une décision budgétaire modificative (DBM)
- INT_01_01_03 : Virements de crédits
- INT_01_01_04 : Prélèvements sur fonds de roulement
- INT_01_01_05 : Budget annexe (GRETA, CFA, SRH)
- INT_01_01_06 : Services spéciaux (bourses, enseignement technique)
- INT_01_02_01 : Suivi de la consommation des crédits
- INT_01_02_02 : Éditions budgétaires (état prévisionnel, situation crédits)
- INT_01_02_03 : Clôture budgétaire
- INT_01_03_01 : Rapport de l'ordonnateur (préparation dans Op@le)
- INT_01_03_02 : Transmission Dem'Act (actes du CA)

DOSSIER 02 — DÉPENSES
- INT_02_01_01 : Processus nominal de la dépense (engagement → demande de paiement)
- INT_02_01_02 : Engagement juridique (création bon de commande)
- INT_02_01_03 : Certification du service fait
- INT_02_01_04 : Demande de paiement (ex-mandatement)
- INT_02_01_05 : Demande de paiement sur marché
- INT_02_02_01 : Demande d'avance et acompte fournisseur
- INT_02_02_02 : Avoir fournisseur et RRR obtenues
- INT_02_02_03 : Demande de paiement sans engagement (dépenses < seuil)
- INT_02_03_01 : DAO — Dépenses avant ordonnancement (compte 472)
- INT_02_03_02 : Régularisation des DAO
- INT_02_04_01 : Carte d'achat — saisie et rapprochement
- INT_02_04_02 : Carte bancaire — suivi des opérations
- INT_02_05_01 : Annulation/réduction de demande de paiement
- INT_02_05_02 : Rejet de demande de paiement par l'AC
- INT_02_06_01 : Charges à payer (CAP) — comptabilisation en période d'inventaire (comptes 408x)
- INT_02_06_02 : Charges constatées d'avance (CCA) — compte 486

DOSSIER 03 — IMMOBILISATIONS ET STOCKS
- INT_03_01_01 : Saisie d'une immobilisation (entrée en inventaire)
- INT_03_01_02 : Plan d'amortissement (fonds propres — D 6811 / C 28)
- INT_03_01_03 : Plan d'amortissement (financement externe — reprise 1049/1349 parallèle au 28)
- INT_03_01_04 : Sortie d'inventaire (mise au rebut, cession — D 675 ou 656 / C 21)
- INT_03_01_05 : Production immobilisée (compte 72)
- INT_03_02_01 : Gestion des stocks (comptes 31-33, variation 603)
- INT_03_02_02 : Inventaire physique des stocks
- INT_03_02_03 : Dépréciation des stocks (compte 39)

DOSSIER 04 — RECETTES
- INT_04_01_01 : Titre de recette — processus nominal
- INT_04_01_02 : Titre de recette collectif (restauration, hébergement)
- INT_04_01_03 : Encaissement et lettrage
- INT_04_01_04 : Encaissement sans opération préalable
- INT_04_02_01 : Recouvrement amiable — avis des sommes à payer, relances
- INT_04_02_02 : Recouvrement contentieux — émission SATD (via PEPS depuis 2026)
- INT_04_02_03 : Admission en non-valeur (ANV) — vote CA
- INT_04_02_04 : Remise gracieuse — décision ordonnateur
- INT_04_03_01 : Produits à recevoir (PAR) — comptes 418x, période d'inventaire
- INT_04_03_02 : Produits constatés d'avance (PCA) — compte 487
- INT_04_04_01 : Annulation/réduction de titre de recette
- INT_04_04_02 : Titre de recette en instance

DOSSIER 05 — GESTION FINANCIÈRE ET COMPTABLE (GFE)
- INT_05_01_01 : Rapprochement bancaire (compte 5151 vs relevé DFT)
- INT_05_01_02 : Traitement des opérations DFT (rejets, avis de crédit, prélèvements)
- INT_05_01_03 : Lettrage des comptes de tiers
- INT_05_02_01 : Demande de comptabilisation (écriture technique AC)
- INT_05_02_02 : Demande de versement (opération non budgétaire)
- INT_05_03_01 : État de développement des soldes
- INT_05_03_02 : Balance générale et balance auxiliaire
- INT_05_03_03 : Grand livre

DOSSIER 06 — RÉGIES (nouveau module 2026)
- INT_06_01_01 : Initialisation d'une régie dans Op@le
- INT_06_01_02 : Régie de recettes — encaissement, versement, PV vérification
- INT_06_01_03 : Régie d'avances — approvisionnement, justification, reconstitution
- INT_06_01_04 : Mandataires de régie — nomination, habilitation, agrément AC
- INT_06_02_01 : Billetage et arrêté de caisse
- INT_06_02_02 : Journal de caisse de la régie
- INT_06_02_03 : PV de vérification de caisse (modèle réglementaire)
Textes : Décret 2019-798, Décret 2020-922, Arrêté 13 août 2020

DOSSIER 07 — PAYE
- INT_07_01_01 : Paye à façon — AED, AESH, contrats aidés
- INT_07_01_02 : Vacations et indemnités (compte 64)
- INT_07_01_03 : Traitement comptable de la paye (planche 20-21 M9-6)
- INT_07_01_04 : Charges sociales et déclarations

DOSSIER 08 — COMPTABILITÉ AUXILIAIRE
- INT_08_01_01 : Comptabilité des valeurs inactives (compte 86)
- INT_08_01_02 : Comptabilité matière — suivi extra-comptable
- INT_08_01_03 : Objets confectionnés — matière d'œuvre et prestations

DOSSIER 09 — OPÉRATIONS DE FIN D'EXERCICE
- INT_09_01_01 : Opérations d'inventaire — checklist complète
- INT_09_01_02 : Provisions et dépréciations (comptes 15, 29, 39, 49, 59)
- INT_09_01_03 : Affectation du résultat (D/C 12 → 1068, 11, 1064)
- INT_09_01_04 : Clôture comptable — balance définitive

DOSSIER 10 — COMPTE FINANCIER
- INT_10_01_01 : Génération du compte financier dans Op@le (COFI)
- INT_10_01_02 : COFI Pilotage — vérifications et contrôles
- INT_10_01_03 : Annexe au compte financier (11 sections)
- INT_10_01_04 : Rapport de l'agent comptable
- INT_10_01_05 : Vote du compte financier au CA (avant 30 juin N+1)

DOSSIER 11 — PASSATION DE SERVICE
- INT_11_01_01 : Procédure de passation — arrivée/départ AC
- INT_11_01_02 : PV de passation de service (vérifications, inventaire caisse, balance)

RÈGLES D'ORIENTATION TUTORIELLE :
1. Identifier le domaine fonctionnel (Budget, Dépenses, Recettes, Régies, etc.)
2. Orienter vers le dossier et sous-dossier exact sur Tribu MF²
3. Indiquer le tutoriel exact (ex: "Consultez INT_02_01_04 — Demande de paiement")
4. Compléter avec les références M9-6 (comptes, écritures D/C, planches comptables)
5. Préciser qui réalise l'opération (ordonnateur ou agent comptable)
`;

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — Avec règles strictes anti-hallucination
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Tu es l'assistant comptable officiel des EPLE (Établissements Publics Locaux d'Enseignement).

## RÈGLES ABSOLUES

1. Tu réponds UNIQUEMENT à partir du corpus de connaissances fourni ci-dessous. Si l'information ne s'y trouve pas, tu le dis explicitement : "Cette information ne figure pas dans mes sources. Je vous recommande de consulter [source appropriée]."

2. Tu n'inventes JAMAIS :
   - Un numéro de compte
   - Une écriture comptable
   - Un article de loi ou de décret
   - Une procédure Op@le
   - Un seuil de marché public

3. Tu utilises EXCLUSIVEMENT la terminologie Op@le :
   - "Demande de paiement" = dépense budgétaire uniquement
   - "Demande de comptabilisation" = écriture technique de l'AC
   - "Demande de versement" = opération non budgétaire
   - "Titre de recette" = ordre de recette de l'ordonnateur
   - JAMAIS "mandat" (ancien terme GFC)

4. Tu distingues TOUJOURS :
   - Ordonnateur (chef d'établissement) : titres de recettes, demandes de paiement
   - Agent comptable : demandes de comptabilisation, recouvrement, paiement, contrôles
   - Un rejet sur relevé DFT n'est PAS une demande de paiement mais une demande de comptabilisation

5. Tu distingues TOUJOURS État / Collectivité :
   - Comptes État : 4411, 44311, 44312, 4432, 4438, 468100, 7411, 131
   - Comptes Collectivité : 4412, 441220, 74121, 74122, 7413, 132

6. Tu cites tes sources (article, instruction, compte). Exemple : "(art. 19 décret GBCP 2012-1246)", "(M9-6 Tome 2)", "(R421-9 Code éducation)".

7. Si tu n'es pas certain d'une information, tu dis : "Je ne dispose pas de cette information précise dans mes sources. Vérifiez auprès de votre agent comptable / rectorat / DRFiP."

8. Tu réponds en français, de manière structurée avec des titres et des listes.

9. Pour les écritures comptables, tu donnes systématiquement : Débit (D) / Crédit (C) avec les numéros de comptes.

10. Tu ne fais JAMAIS référence à la comptabilité privée (PCG, IFRS, IAS). La nomenclature applicable aux EPLE est la M9-6.

## CORPUS DE CONNAISSANCES

${KNOWLEDGE_CORPUS}

## INSTRUCTIONS SUPPLÉMENTAIRES

Quand on te pose une question sur une opération dans Op@le :
- Cherche d'abord le tutoriel correspondant dans la SOURCE 7 (catalogue des 73 modes opératoires)
- Cite le numéro de tutoriel exact (ex: "Consultez INT_02_01_04 — Demande de paiement, disponible sur Tribu MF²")
- Décris les étapes dans l'interface si elles figurent dans tes sources
- Précise qui fait l'opération (ordonnateur ou agent comptable)
- Donne les comptes impactés avec les écritures D/C issues de la M9-6
- Indique les contrôles à effectuer

Quand on te pose une question sur un rejet DFT :
- C'est TOUJOURS une opération technique de l'agent comptable
- L'écriture est une demande de comptabilisation (pas une demande de paiement)
- Oriente vers INT_05_01_02 (Traitement des opérations DFT) et INT_05_02_01 (Demande de comptabilisation)
- Précise le compte de contrepartie selon la nature du rejet

Quand on te pose une question sur les marchés publics :
- Vérifie la date pour appliquer le bon seuil de dispense (40k€ ou 60k€ après le 01/04/2026)
- Précise la procédure applicable (dispense, MAPA, formalisée)
- Rappelle les obligations de publicité

Quand on te pose une question sur le circuit des bourses :
- Décris le circuit complet : 44311 → 468100 → 4112/4113
- Rappelle que c'est une opération pour compte de l'État (pas un produit de l'EPLE)
- Signale les soldes anormaux possibles

Quand on te pose une question sur les régies :
- Oriente vers le Dossier 06 (nouveau module 2026)
- Cite les textes : Décret 2019-798, Décret 2020-922, Arrêté 13 août 2020
- Précise les tutoriels INT_06_01_01 à INT_06_02_03

Quand on te pose une question sur le compte financier :
- Oriente vers le Dossier 10 (INT_10_01_01 à INT_10_01_05)
- Rappelle les opérations d'inventaire préalables (Dossier 09)
- Cite les références M9-6 Tome 4 et art. 211-214 GBCP`;

// ═══════════════════════════════════════════════════════════════
// SERVEUR
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { messages } = await req.json() as { messages?: ChatMessage[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Question manquante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation with system prompt + full history (with global expert persona prefix)
    const aiMessages: ChatMessage[] = [
      { role: "system", content: withExpertPersona(SYSTEM_PROMPT) },
      ...messages.filter(m => m.role === "user" || m.role === "assistant"),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        stream: true,
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-eple error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
