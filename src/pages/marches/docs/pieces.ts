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
    { label: "Objet du marché", value: m.objet || "—" },
    { label: "Type", value: TYPE_MARCHE_LABELS[m.type_marche as keyof typeof TYPE_MARCHE_LABELS] || m.type_marche || "—" },
    { label: "Procédure", value: PROCEDURE_LABELS[m.procedure as keyof typeof PROCEDURE_LABELS] || m.procedure || "—" },
    { label: "Montant estimé HT", value: fmtEur(Number(m.montant_estime_ht || 0)) },
    { label: "Date prévisionnelle", value: fmtDate(m.date_notification_prev) },
  ]);
}

export async function generateFicheBesoin(ctx: DocContext): Promise<Blob> {
  const body = [
    ...titleBlock(ctx, "Fiche d'expression du besoin", "Préalable obligatoire — CCP art. L2111-1"),
    H1("1. Identification du besoin"),
    commonInfo(ctx),
    spacer(),
    H1("2. Justification du besoin"),
    P(ctx.marche.justification_besoin || "À compléter — décrire le besoin fonctionnel et les objectifs poursuivis."),
    H1("3. Caractéristiques techniques"),
    P(ctx.marche.caracteristiques_techniques || "À compléter."),
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
    P(ctx.marche.objet || "—"),
    H1("Article 2 — Procédure"),
    P(PROCEDURE_LABELS[ctx.marche.procedure as keyof typeof PROCEDURE_LABELS] || ctx.marche.procedure || "—"),
    H1("Article 3 — Conditions de remise des offres"),
    P("Les offres sont remises par voie dématérialisée sur la plateforme acheteur."),
    H1("Article 4 — Critères de jugement"),
    P(ctx.marche.criteres_jugement || "Prix 60 % — Valeur technique 40 %"),
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
    P(ctx.marche.duree_execution || "À compléter"),
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
    P(ctx.marche.objet || "—"),
    H1("2. Spécifications techniques"),
    P(ctx.marche.caracteristiques_techniques || "À compléter."),
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
    P(`Le candidat s'engage à exécuter les prestations objet du marché pour un montant HT de : ${fmtEur(Number(ctx.marche.montant_attribue_ht || ctx.marche.montant_estime_ht || 0))}`),
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
    P(ctx.marche.criteres_jugement || "—"),
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
    P(`Article 1 : Le marché « ${ctx.marche.objet} » est attribué à : ${ctx.fournisseurAttributaire?.raison_sociale || "__________"}`),
    P(`Article 2 : Pour un montant HT de ${fmtEur(Number(ctx.marche.montant_attribue_ht || ctx.marche.montant_estime_ht || 0))}.`),
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
    P(`Objet : Notification du marché « ${ctx.marche.objet} »`, { bold: true }),
    spacer(),
    P("Madame, Monsieur,"),
    P(`J'ai l'honneur de vous notifier que votre offre a été retenue pour l'exécution du marché susvisé, pour un montant HT de ${fmtEur(Number(ctx.marche.montant_attribue_ht || 0))}.`),
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
    P(`Suite à l'examen des offres reçues pour le marché « ${ctx.marche.objet} », j'ai le regret de vous informer que votre offre n'a pas été retenue.`),
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
    P(ctx.marche.justification_choix || "À compléter — comparaison de prestations équivalentes."),
    H1("3. Justification du prix"),
    P("Le prix obtenu est jugé cohérent avec le marché par référence à __________________."),
    H1("4. Respect du principe de non-discrimination"),
    P("L'établissement veille à diversifier ses fournisseurs et à éviter toute relation exclusive prohibée."),
    ...signatureBlock(ctx.branding, "ordonnateur"),
  ];
  return buildDocxBuffer(ctx, body);
}
