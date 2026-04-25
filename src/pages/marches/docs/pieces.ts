// ═══════════════════════════════════════════════════════════════
// Générateurs .docx pour les pièces de marché (CCP 2026)
// Chaque fonction renvoie un Blob prêt à être téléchargé.
// ═══════════════════════════════════════════════════════════════

import {
  buildDocxBuffer,
  titleBlock,
  H1,
  H2,
  P,
  bullet,
  spacer,
  infoTable,
  signatureBlock,
  fmtDate,
  fmtEur,
  type DocContext,
} from "./docxBuilder";
import { PROCEDURE_LABELS, TYPE_MARCHE_LABELS } from "../types";

function commonInfo(ctx: DocContext) {
  const m = ctx.marche;
  return infoTable([
    { label: "Référence interne", value: m.reference_interne || "—" },
    { label: "Objet du marché", value: m.libelle || m.description || "—" },
    { label: "Type", value: TYPE_MARCHE_LABELS[m.type_marche as keyof typeof TYPE_MARCHE_LABELS] || m.type_marche || "—" },
    { label: "Procédure", value: PROCEDURE_LABELS[m.procedure_calculee as keyof typeof PROCEDURE_LABELS] || m.procedure_calculee || "—" },
    { label: "Montant estimé HT", value: fmtEur(Number(m.montant_estime_ht || 0)) },
    { label: "Date prévisionnelle", value: fmtDate(m.date_notification_cible) },
  ]);
}

export async function generateFicheBesoin(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Fiche d'expression du besoin", "Préalable obligatoire — CCP art. L2111-1"),
    H1("1. Identification du besoin"),
    commonInfo(ctx),
    spacer(),
    H1("2. Justification du besoin"),
    P(ctx.marche.description || "À compléter — décrire le besoin fonctionnel et les objectifs poursuivis."),
    H1("3. Caractéristiques techniques"),
    P(ctx.marche.specifications || "À compléter."),
    H1("4. Estimation budgétaire"),
    P(`Montant estimé HT : ${fmtEur(Number(ctx.marche.montant_estime_ht || 0))}`),
    P(`Méthode d'estimation : ${ctx.marche.methode_estimation || "à préciser"}`),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateRC(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Règlement de la consultation", "RC — CCP art. R2132-1 et suivants"),
    H1("Article 1 — Objet de la consultation"),
    P(ctx.marche.libelle || ctx.marche.description || "—"),
    H1("Article 2 — Procédure"),
    P(PROCEDURE_LABELS[ctx.marche.procedure_calculee as keyof typeof PROCEDURE_LABELS] || ctx.marche.procedure_calculee || "—"),
    H1("Article 3 — Conditions de remise des offres"),
    P("Les offres sont remises par voie dématérialisée sur la plateforme acheteur."),
    H1("Article 4 — Critères de jugement"),
    P((ctx.marche.criteres || []).map((c) => `${c.libelle} (${c.ponderation}%)`).join(" — ") || "Prix 60 % — Valeur technique 40 %"),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateCCAP(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "CCAP", "Cahier des Clauses Administratives Particulières"),
    H1("Article 1 — Objet et pièces contractuelles"),
    commonInfo(ctx),
    H1("Article 2 — Durée d'exécution"),
    P(`${ctx.marche.duree_mois || 0} mois${ctx.marche.reconductions_nb ? ` reconductible ${ctx.marche.reconductions_nb} fois` : ""}`),
    H1("Article 3 — Prix et règlement"),
    P("Prix unitaires / forfaitaires selon BPU joint. Délai global de paiement : 30 jours (GBCP)."),
    H1("Article 4 — Pénalités"),
    P("Pénalités de retard : 1/3000ᵉ du montant HT par jour calendaire."),
    H1("Article 5 — Résiliation"),
    P("Conformément aux articles L2195-1 et suivants du CCP."),
    ...signatureBlock(ctx.branding, "double"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateCCTP(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "CCTP", "Cahier des Clauses Techniques Particulières"),
    H1("1. Présentation du besoin"),
    P(ctx.marche.libelle || ctx.marche.description || "—"),
    H1("2. Spécifications techniques"),
    P(ctx.marche.specifications || "À compléter."),
    H1("3. Modalités d'exécution"),
    P("Conditions de livraison, d'installation, de réception."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateAE(ctx: DocContext): Promise<Blob> {
  const att = ctx.fournisseurAttributaire;
  const body = [
    ...titleBlock(ctx, "Acte d'engagement", "DC3 — CCP art. R2143-3"),
    H1("A. Identification du pouvoir adjudicateur"),
    P(ctx.branding?.full_name || "—"),
    H1("B. Identification du candidat"),
    infoTable([
      { label: "Raison sociale", value: att?.raison_sociale || "__________________" },
      { label: "SIRET", value: att?.siret || "__________________" },
      { label: "Adresse", value: att?.adresse || "__________________" },
    ]),
    H1("C. Engagement du candidat"),
    P(`Le candidat s'engage à exécuter les prestations objet du marché pour un montant HT de : ${fmtEur(Number(ctx.marche.montant_realise || ctx.marche.montant_estime_ht || 0))}`),
    ...signatureBlock(ctx.branding, "double"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateRapportAnalyse(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Rapport d'analyse des offres", "RAO — CCP art. R2152-1"),
    H1("1. Rappel de la consultation"),
    commonInfo(ctx),
    H1("2. Offres reçues"),
    P("Tableau récapitulatif des candidats et montants."),
    H1("3. Application des critères"),
    P((ctx.marche.criteres || []).map((c) => `${c.libelle} (${c.ponderation}%)`).join(" — ") || "—"),
    H1("4. Classement et proposition d'attribution"),
    P(`Attributaire proposé : ${ctx.fournisseurAttributaire?.raison_sociale || "—"}`),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateDecisionAttribution(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Décision d'attribution", "Décision de l'ordonnateur"),
    H2("Vu le Code de la commande publique,"),
    H2("Vu la consultation lancée pour l'objet susvisé,"),
    H2("Vu le rapport d'analyse des offres,"),
    spacer(),
    H1("DÉCIDE"),
    P(`Article 1 : Le marché « ${ctx.marche.libelle || ctx.marche.description} » est attribué à : ${ctx.fournisseurAttributaire?.raison_sociale || "__________"}`),
    P(`Article 2 : Pour un montant HT de ${fmtEur(Number(ctx.marche.montant_realise || ctx.marche.montant_estime_ht || 0))}.`),
    P("Article 3 : La présente décision sera notifiée à l'attributaire et publiée le cas échéant."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateLettreNotification(ctx: DocContext): Promise<Blob> {
  const att = ctx.fournisseurAttributaire;
  const body = [
    ...titleBlock(ctx, "Notification du marché", "Lettre à l'attributaire"),
    P(att?.raison_sociale || "Madame, Monsieur,"),
    P(att?.adresse || ""),
    spacer(),
    P(`Objet : Notification du marché « ${ctx.marche.libelle || ctx.marche.description} »`, { bold: true }),
    spacer(),
    P("Madame, Monsieur,"),
    P(`J'ai l'honneur de vous notifier que votre offre a été retenue pour l'exécution du marché susvisé, pour un montant HT de ${fmtEur(Number(ctx.marche.montant_realise || ctx.marche.montant_estime_ht || 0))}.`),
    P("Vous voudrez bien accuser réception de la présente notification."),
    P("Je vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateLettreRejet(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Information aux candidats non retenus", "CCP art. R2181-1"),
    P("Madame, Monsieur,"),
    P(`Suite à l'examen des offres reçues pour le marché « ${ctx.marche.libelle || ctx.marche.description} », j'ai le regret de vous informer que votre offre n'a pas été retenue.`),
    P(`Le marché a été attribué à : ${ctx.fournisseurAttributaire?.raison_sociale || "—"}.`),
    P("Conformément à l'article R2181-1 du CCP, vous disposez d'un délai de 11 jours avant la signature pour exercer un recours."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generatePvReception(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Procès-verbal de réception", "Réception des prestations"),
    H1("1. Identification du marché"),
    commonInfo(ctx),
    H1("2. Constatation des prestations"),
    bullet("Conformité au CCTP : ☐ Oui  ☐ Non"),
    bullet("Quantités livrées conformes : ☐ Oui  ☐ Non"),
    bullet("Réserves éventuelles : __________________"),
    H1("3. Décision"),
    P("☐ Réception prononcée sans réserve"),
    P("☐ Réception prononcée avec réserves"),
    P("☐ Réception refusée"),
    ...signatureBlock(ctx.branding, "double"),
  ];
  return buildDocxBuffer(ctx, body);
}

export async function generateNoteTracabilite(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Note de traçabilité", "CCP art. R2122-8 — Achats < seuil de dispense"),
    H1("1. Identification de l'achat"),
    commonInfo(ctx),
    H1("2. Justification du choix de l'opérateur économique"),
    P(ctx.marche.description || "À compléter — comparaison de prestations équivalentes."),
    H1("3. Justification du prix"),
    P("Le prix obtenu est jugé cohérent avec le marché par référence à __________________."),
    H1("4. Respect du principe de non-discrimination"),
    P("L'établissement veille à diversifier ses fournisseurs et à éviter toute relation exclusive prohibée."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}

// ════════════════════════════════════════════════════════════════
// Pièces nouvelles — itération CCP 2026
// ════════════════════════════════════════════════════════════════

/** DUME — Document Unique de Marché Européen pré-rempli (formalisée). */
export async function generateDUME(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "DUME — Document Unique de Marché Européen", "Règlement (UE) 2016/7 ; CCP art. R2143-4"),
    H1("Partie I — Informations sur la procédure"),
    commonInfo(ctx),
    H1("Partie II — Informations sur l'opérateur économique"),
    P("À renseigner par l'opérateur : raison sociale, SIRET, représentant légal, adresse, code TVA, taille (PME/ETI/GE)."),
    H1("Partie III — Motifs d'exclusion"),
    bullet("A — Motifs liés à des condamnations pénales (art. L2141-1 à L2141-3 CCP)"),
    bullet("B — Motifs liés au paiement d'impôts ou de cotisations sociales (art. L2141-4)"),
    bullet("C — Motifs liés à l'insolvabilité, aux conflits d'intérêts ou à la faute professionnelle"),
    P("L'opérateur déclare ne pas se trouver dans l'un des cas d'exclusion ci-dessus."),
    H1("Partie IV — Critères de sélection"),
    bullet("A — Aptitude à exercer l'activité professionnelle (immatriculation registre du commerce)"),
    bullet("B — Capacité économique et financière (chiffre d'affaires, ratios)"),
    bullet("C — Capacités techniques et professionnelles (références, moyens humains et matériels)"),
    H1("Partie V — Réduction du nombre de candidats"),
    P("Sans objet pour la procédure ouverte."),
    H1("Partie VI — Déclarations finales"),
    P("Le soussigné déclare sur l'honneur l'exactitude des informations fournies, en pleine connaissance des sanctions prévues à l'article 441-1 du Code pénal."),
    ...signatureBlock(ctx.branding, "titulaire"),
  ];
  return buildDocxBuffer(ctx, body);
}

/** DC4 — Acte spécial de sous-traitance. */
export async function generateDC4(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "DC4 — Acte spécial de sous-traitance", "Loi n° 75-1334 du 31/12/1975 ; CCP art. L2193-1 et suivants"),
    H1("Article 1 — Marché support"),
    commonInfo(ctx),
    H1("Article 2 — Identification du sous-traitant"),
    infoTable([
      { label: "Raison sociale", value: "__________________" },
      { label: "SIRET", value: "__________________" },
      { label: "Adresse", value: "__________________" },
      { label: "Représentant légal", value: "__________________" },
    ]),
    H1("Article 3 — Nature et étendue des prestations sous-traitées"),
    P("Description précise des prestations confiées : __________________"),
    H1("Article 4 — Montant maximum HT des prestations sous-traitées"),
    P("Montant : __________________ € HT"),
    H1("Article 5 — Modalités de paiement"),
    P("☐ Paiement direct (obligatoire si prestations > 600 € TTC, art. L2193-10 CCP)"),
    P("☐ Paiement par le titulaire"),
    H1("Article 6 — Capacités du sous-traitant"),
    P("Pièces justificatives jointes (KBIS, attestations URSSAF / fiscales, références)."),
    H1("Article 7 — Conditions de paiement"),
    P("Délai global : 30 jours (GBCP). Compte bancaire : __________________"),
    ...signatureBlock(ctx.branding, "double"),
  ];
  return buildDocxBuffer(ctx, body);
}

/** Convention constitutive de groupement de commandes. */
export async function generateConventionGroupement(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Convention constitutive de groupement de commandes", "CCP art. L2113-6 à L2113-8"),
    H1("Article 1 — Membres du groupement"),
    P("Les EPLE soussignés, représentés par leur ordonnateur respectif, constituent un groupement de commandes."),
    P("(Annexer la liste des établissements membres et leur représentant.)"),
    H1("Article 2 — Objet et périmètre"),
    P(ctx.marche.libelle || ctx.marche.description || "Mutualisation des achats relatifs à la famille concernée."),
    H1("Article 3 — Désignation du coordonnateur"),
    P("Le coordonnateur est désigné parmi les membres. Il est chargé de la passation et de la signature du marché pour le compte de l'ensemble du groupement."),
    H1("Article 4 — Mission du coordonnateur"),
    bullet("Recensement des besoins"),
    bullet("Élaboration et publication du dossier de consultation"),
    bullet("Analyse des offres et attribution"),
    bullet("Notification du marché"),
    bullet("Suivi de l'exécution dans la limite définie à l'article 5"),
    H1("Article 5 — Exécution par chaque membre"),
    P("Chaque membre exécute le marché pour ses propres besoins, signe les bons de commande et règle directement le titulaire."),
    H1("Article 6 — Modalités de répartition financière"),
    P("La répartition est calculée selon la quote-part définie en annexe."),
    H1("Article 7 — Durée et fin du groupement"),
    P("La présente convention prend fin à l'expiration du marché ou par dissolution prononcée à l'unanimité des membres."),
    H1("Article 8 — Litiges"),
    P("Compétence du tribunal administratif territorialement compétent."),
    ...signatureBlock(ctx.branding, "double"),
  ];
  return buildDocxBuffer(ctx, body);
}

/** RAR — Rapport Annuel d'activité commande publique (DAJ). */
export interface RarLigne {
  reference: string;
  objet: string;
  type: "fournitures" | "services" | "travaux";
  procedure: string;
  attributaire: string;
  siret: string;
  montant_ht: number;
  date_notification: string | null;
  duree_mois: number;
}
export async function generateRAR(ctx: DocContext, lignes: RarLigne[], annee: number): Promise<Blob> {
  const total = lignes.reduce((s, l) => s + (l.montant_ht || 0), 0);
  const body = [
    ...titleBlock(ctx, `RAR ${annee} — Recensement annuel commande publique`, "CCP art. R2196-1 ; spécification DAJ-REAP"),
    H1("1. Périmètre"),
    P(`Marchés notifiés sur l'exercice ${annee} d'un montant supérieur à 25 000 € HT — y compris bons de commande sur accord-cadre.`),
    H1("2. Synthèse"),
    infoTable([
      { label: "Nombre de marchés recensés", value: String(lignes.length) },
      { label: "Montant total HT", value: fmtEur(total) },
      { label: "Année de référence", value: String(annee) },
    ]),
    H1("3. Liste des marchés"),
    ...(lignes.length === 0
      ? [P("Aucun marché supérieur à 25 000 € HT pour l'exercice considéré.")]
      : lignes.flatMap((l) => [
          H2(`${l.reference} — ${l.objet}`),
          P(`Type : ${l.type} • Procédure : ${l.procedure} • Durée : ${l.duree_mois} mois`),
          P(`Titulaire : ${l.attributaire} (SIRET ${l.siret || "—"})`),
          P(`Montant HT : ${fmtEur(l.montant_ht)} • Notifié le ${fmtDate(l.date_notification)}`),
          spacer(60),
        ])),
    H1("4. Modalités de transmission"),
    P("Le présent recensement est transmis à la Direction des affaires juridiques (DAJ) dans le respect du calendrier annuel REAP."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}
