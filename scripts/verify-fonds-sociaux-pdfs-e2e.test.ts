#!/usr/bin/env bun
/**
 * Recette E2E : génération réelle des 4 nouveaux gabarits PDF Fonds sociaux
 * avec un jeu de données réaliste, puis vérifications de non-régression :
 *   - signature PDF (%PDF-1.x ... %%EOF)
 *   - taille raisonnable (> 1 KB, < 500 KB)
 *   - chaînes attendues présentes dans le contenu (extraction texte brut)
 *   - structure (nb pages, métadonnées)
 */
import { writeFileSync, mkdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  generateBordereauDpPdf,
  generateCourrierComplementPdf,
  generateCourrierRefusPdf,
  generateConvocationCommissionPdf,
  type PdfContext,
} from "../src/lib/fs-pdf/decisionPdf";
import type {
  FsDecision, FsEleve, FsCommission, FsCommissionConvocation,
} from "../src/pages/fonds-sociaux-v2/fsv2Types";

const OUT = "/tmp/fs-pdfs-e2e";
mkdirSync(OUT, { recursive: true });

// ─── Jeu de données réaliste (Lycée Charles Coëffin, Académie Guadeloupe) ──
const ctx: PdfContext = {
  etablissementNom: "Lycée Polyvalent Charles Coëffin",
  etablissementAdresse: "Route de Baie-Mahault",
  etablissementCp: "97122",
  etablissementVille: "Baie-Mahault",
  uai: "9710789C",
  signataireOrdonnateur: "Mme Marie-Christine BERNARD",
  signataireAgentComptable: "M. Jean-Luc MOREAU",
  ville: "Baie-Mahault",
  tribunalAdministratif: "Tribunal administratif de Basse-Terre",
  numeroDeliberationCa: "CA-2025-018",
  dateDeliberationCa: "2025-10-14",
  dateAvisCommission: "2026-04-22",
};

const eleves: FsEleve[] = [
  {
    id: "e1", establishment_id: "etab1", ine: "0712345678A",
    nom: "DUPONT", prenom: "Léa", date_naissance: "2009-03-12",
    classe: "1ère G3", niveau: "1ère", voie: "GT", filiere: "Générale",
    statut_boursier: true, echelon_bourse: 4,
    demi_pensionnaire: true, interne: false,
    responsables_legaux: [{
      nom: "DUPONT", prenom: "Sophie", lien: "mère",
      adresse: "12 rue des Flamboyants\n97122 Baie-Mahault",
      email: "s.dupont@example.fr", telephone: "0690 12 34 56",
    }],
    annee_scolaire: "2025-2026", actif: true,
  },
  {
    id: "e2", establishment_id: "etab1", ine: "0712345679B",
    nom: "MARTIN", prenom: "Kevin", date_naissance: "2008-09-04",
    classe: "Tle Pro MELEC", niveau: "Tle", voie: "PRO", filiere: "MELEC",
    statut_boursier: true, echelon_bourse: 6,
    demi_pensionnaire: true, interne: false,
    responsables_legaux: [{
      nom: "MARTIN", prenom: "Patrick", lien: "père",
      adresse: "Résidence Les Alizés, Bât. C\n97110 Pointe-à-Pitre",
    }],
    annee_scolaire: "2025-2026", actif: true,
  },
  {
    id: "e3", establishment_id: "etab1", ine: "0712345680C",
    nom: "JEAN-BAPTISTE", prenom: "Yannick", date_naissance: "2010-01-22",
    classe: "2nde GT4", niveau: "2nde", voie: "GT", filiere: null,
    statut_boursier: false, echelon_bourse: null,
    demi_pensionnaire: true, interne: false,
    responsables_legaux: [{
      nom: "JEAN-BAPTISTE", prenom: "Émilie", lien: "mère",
      adresse: "8 chemin des Hibiscus\n97180 Sainte-Anne",
    }],
    annee_scolaire: "2025-2026", actif: true,
  },
];

const decisions: FsDecision[] = [
  {
    id: "d1", establishment_id: "etab1",
    numero_decision: "FSC-2025-042",
    eleve_id: "e1", annee_scolaire: "2025-2026",
    type_fonds: "FSC", nature_aide: "restauration",
    modalite_attribution: "commission", commission_id: "c1",
    modalite_versement: "aide_directe",
    organisme_tiers_nom: null, organisme_tiers_siret: null,
    montant: 285.50,
    code_activite_opale: "16FSC", compte_imputation_opale: "6571",
    date_decision: "2026-04-22",
    motif: "Aide cantine T3 — situation familiale fragilisée (perte d'emploi du conjoint)",
    pieces_justificatives_urls: [],
    decision_chef_etablissement_pdf_url: null,
    notification_famille_pdf_url: null,
    piece_comptable_pdf_url: null,
    statut: "decide",
    date_demande_paiement: null, numero_demande_paiement: null,
    extinction_creance_dp: true, compte_creance_famille: "411200",
  },
  {
    id: "d2", establishment_id: "etab1",
    numero_decision: "FSL-2025-019",
    eleve_id: "e2", annee_scolaire: "2025-2026",
    type_fonds: "FSL", nature_aide: "fournitures_scolaires_materiel",
    modalite_attribution: "commission", commission_id: "c1",
    modalite_versement: "aide_directe",
    organisme_tiers_nom: null, organisme_tiers_siret: null,
    montant: 180.00,
    code_activite_opale: "16FSL", compte_imputation_opale: "6571",
    date_decision: "2026-04-22",
    motif: "Achat outillage individuel CAP/Bac Pro non pris en charge",
    pieces_justificatives_urls: [],
    decision_chef_etablissement_pdf_url: null,
    notification_famille_pdf_url: null,
    piece_comptable_pdf_url: null,
    statut: "decide",
    date_demande_paiement: null, numero_demande_paiement: null,
  },
  {
    id: "d3", establishment_id: "etab1",
    numero_decision: "FSL-2025-020",
    eleve_id: "e3", annee_scolaire: "2025-2026",
    type_fonds: "FSL", nature_aide: "sorties_voyages_periscolaire",
    modalite_attribution: "commission", commission_id: "c1",
    modalite_versement: "aide_directe",
    organisme_tiers_nom: null, organisme_tiers_siret: null,
    montant: 95.00,
    code_activite_opale: "16FSL", compte_imputation_opale: "6571",
    date_decision: "2026-04-22",
    motif: "Participation sortie pédagogique Saint-Claude",
    pieces_justificatives_urls: [],
    decision_chef_etablissement_pdf_url: null,
    notification_famille_pdf_url: null,
    piece_comptable_pdf_url: null,
    statut: "decide",
    date_demande_paiement: null, numero_demande_paiement: null,
  },
];

const commission: FsCommission = {
  id: "c1", establishment_id: "etab1",
  date_commission: "2026-04-22", type: "ordinaire",
  annee_scolaire: "2025-2026",
  membres_presents: [],
  dossiers_examines_count: 12,
  proces_verbal_url: null,
  observations: "",
};

const convocation: FsCommissionConvocation = {
  id: "cv1", establishment_id: "etab1", commission_id: "c1",
  date_envoi: "2026-04-08",
  membres_convoques: [
    { nom: "BERNARD", prenom: "Marie-Christine", qualite: "Proviseure (Présidente)", email: "proviseur@coeffin.fr" },
    { nom: "MOREAU", prenom: "Jean-Luc", qualite: "Agent comptable", email: "ac@coeffin.fr" },
    { nom: "VALMY", prenom: "Sandrine", qualite: "Conseillère principale d'éducation", email: "cpe@coeffin.fr" },
    { nom: "ALEXANDRE", prenom: "Roger", qualite: "Assistante sociale" },
    { nom: "PIERRE", prenom: "Liliane", qualite: "Représentante des parents (FCPE)" },
    { nom: "GERMAIN", prenom: "Mathéo", qualite: "Représentant des élèves" },
  ],
  ordre_du_jour:
    "1. Adoption du PV de la commission du 24 février 2026.\n" +
    "2. Examen de 12 demandes individuelles d'aide (FSL : 8 dossiers / FSC : 4 dossiers).\n" +
    "3. Point sur l'enveloppe restante BOP 230 et redéploiement éventuel.\n" +
    "4. Préparation du bilan annuel à présenter au CA de juin.\n" +
    "5. Questions diverses.",
  pdf_url: null,
};

// ─── Génération ──────────────────────────────────────────────────────
type PdfCheck = {
  filename: string;
  blob: Blob;
  mustContain: string[];
  minSize: number;
  maxSize: number;
};

const lot = decisions.map((d, i) => ({ decision: d, eleve: eleves[i] }));

const targets: PdfCheck[] = [
  {
    filename: "01-bordereau-dp.pdf",
    blob: generateBordereauDpPdf(lot, ctx, "BORD-FS-2026-007"),
    mustContain: [
      "BORDEREAU DE DEMANDES DE PAIEMENT",
      "BORD-FS-2026-007",
      "FSC-2025-042",
      "DUPONT",
      "TOTAL",
      "Charles", // établissement
    ],
    minSize: 2000, maxSize: 200_000,
  },
  {
    filename: "02-courrier-complement.pdf",
    blob: generateCourrierComplementPdf(
      decisions[0], eleves[0], ctx,
      [
        "Avis d'imposition 2024 sur revenus 2023 du foyer fiscal",
        "Justificatif de domicile de moins de 3 mois",
        "Attestation Pôle emploi du conjoint",
        "RIB du compte sur lequel l'aide doit être versée",
      ],
      21,
    ),
    mustContain: [
      "DEMANDE DE COMPLÉMENT DE PIÈCES",
      "Léa",
      "FSC-2025-042",
      "21 jours",
      "Avis d'imposition",
      "RIB",
    ],
    minSize: 2000, maxSize: 200_000,
  },
  {
    filename: "03-courrier-refus.pdf",
    blob: generateCourrierRefusPdf(
      decisions[2], eleves[2], ctx,
      "Le dossier ne remplit pas les critères de ressources fixés par la délibération CA n° CA-2025-018 du 14 octobre 2025 (quotient familial supérieur au plafond). " +
      "La famille pourra représenter une demande lors de la prochaine commission si sa situation évolue.",
    ),
    mustContain: [
      "DÉCISION DE REFUS",
      "JEAN-BAPTISTE",
      "Yannick",
      "FSL-2025-020",
      "Voies et délais de recours",
      "Basse-Terre",
      "deux mois",
    ],
    minSize: 2000, maxSize: 200_000,
  },
  {
    filename: "04-convocation-commission.pdf",
    blob: generateConvocationCommissionPdf(commission, convocation, ctx),
    mustContain: [
      "CONVOCATION",
      "COMMISSION FONDS SOCIAUX",
      "BERNARD",
      "Agent comptable",
      "Ordre du jour",
      "12 demandes",
    ],
    minSize: 2000, maxSize: 200_000,
  },
];

// ─── Vérifications ────────────────────────────────────────────────────
const errors: string[] = [];
const report: Array<{ file: string; size: number; pages: number; checks: number }> = [];

for (const t of targets) {
  const buf = Buffer.from(await t.blob.arrayBuffer());
  const path = join(OUT, t.filename);
  writeFileSync(path, buf);
  const sz = statSync(path).size;

  // 1) signature
  const head = buf.slice(0, 5).toString("ascii");
  if (!head.startsWith("%PDF-")) errors.push(`${t.filename} : signature PDF invalide (${head})`);

  // 2) EOF
  const tail = buf.slice(-1024).toString("ascii");
  if (!tail.includes("%%EOF")) errors.push(`${t.filename} : %%EOF manquant`);

  // 3) taille
  if (sz < t.minSize) errors.push(`${t.filename} : trop petit (${sz} < ${t.minSize})`);
  if (sz > t.maxSize) errors.push(`${t.filename} : trop gros (${sz} > ${t.maxSize})`);

  // 4) nb pages (compte « /Type /Page » hors /Pages)
  const all = buf.toString("latin1");
  const pageCount = (all.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pageCount < 1) errors.push(`${t.filename} : 0 page détectée`);

  // 5) chaînes obligatoires — extraction simplifiée des littéraux (...) Tj
  const literals: string[] = [];
  const re = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(all)) !== null) {
    literals.push(m[1].replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))));
  }
  const flat = literals.join(" | ");
  let okChecks = 0;
  for (const needle of t.mustContain) {
    // Comparaison insensible à la casse, sur les littéraux extraits
    if (flat.toLowerCase().includes(needle.toLowerCase())) {
      okChecks++;
    } else {
      errors.push(`${t.filename} : chaîne attendue absente → "${needle}"`);
    }
  }

  report.push({ file: t.filename, size: sz, pages: pageCount, checks: okChecks });
}

// ─── Rapport ──────────────────────────────────────────────────────────
console.log("┌─────────────────────────────────────────────────────────────────┐");
console.log("│  Recette E2E — 4 gabarits PDF Fonds sociaux                     │");
console.log("└─────────────────────────────────────────────────────────────────┘");
console.log(`Sortie : ${OUT}\n`);
for (const r of report) {
  const expected = targets.find(t => t.filename === r.file)!.mustContain.length;
  console.log(
    `  ${r.file.padEnd(30)} ${String(r.size).padStart(6)} octets · ` +
    `${r.pages} page(s) · ${r.checks}/${expected} chaînes`,
  );
}

if (errors.length > 0) {
  console.error("\n❌ Recette E2E PDFs FS — KO");
  errors.forEach(e => console.error("  -", e));
  process.exit(1);
}

console.log("\n✅ Recette E2E PDFs FS — OK");
console.log("   • 4 PDFs générés avec données réalistes (Lycée Charles Coëffin)");
console.log("   • Signatures %PDF-/%%EOF valides");
console.log("   • Toutes les chaînes critiques présentes");
console.log("   • Tailles dans la fourchette attendue");
process.exit(0);