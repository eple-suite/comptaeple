// ═══════════════════════════════════════════════════════════════
// Détection automatique du type de fichier importé
// ═══════════════════════════════════════════════════════════════

export type ImportFileType =
  | 'balance'
  | 'sde'
  | 'sdr'
  | 'grand_livre'
  | 'etat_tiers'
  | 'siecle_eleves'
  | 'siecle_bourses'
  | 'regies'
  | 'paie'
  | 'inconnu';

export interface DetectionResult {
  type: ImportFileType;
  confidence: number; // 0-1
  hint?: string;
}

const RULES: Array<{
  type: ImportFileType;
  filenamePatterns: RegExp[];
  contentKeywords: string[];
  weightFilename: number;
  weightContent: number;
}> = [
  {
    type: 'balance',
    filenamePatterns: [/balance/i, /\bbal\b/i],
    contentKeywords: ['solde débit', 'solde crédit', 'classe', 'compte général'],
    weightFilename: 0.4,
    weightContent: 0.6,
  },
  {
    type: 'sde',
    filenamePatterns: [/situation.*depense/i, /\bsde\b/i, /depense/i],
    contentKeywords: ['mandats émis', 'engagement juridique', 'engagement comptable', 'liquidation'],
    weightFilename: 0.3,
    weightContent: 0.7,
  },
  {
    type: 'sdr',
    filenamePatterns: [/situation.*recette/i, /\bsdr\b/i, /recette/i],
    contentKeywords: ['ordres émis', 'recettes notifiées', 'recettes encaissées', 'reste à recouvrer'],
    weightFilename: 0.3,
    weightContent: 0.7,
  },
  {
    type: 'grand_livre',
    filenamePatterns: [/grand.?livre/i, /\bgl\b/i, /ecritures/i],
    contentKeywords: ['journal', 'pièce', 'libellé', 'contrepartie', 'date écriture'],
    weightFilename: 0.4,
    weightContent: 0.6,
  },
  {
    type: 'etat_tiers',
    filenamePatterns: [/tiers/i, /balance.?aux/i],
    contentKeywords: ['code tiers', 'famille', 'fournisseur', 'solde tiers'],
    weightFilename: 0.5,
    weightContent: 0.5,
  },
  {
    type: 'siecle_eleves',
    filenamePatterns: [/siecle/i, /\bbee\b/i, /eleves?/i, /effectif/i],
    contentKeywords: ['ine', 'mef', 'classe', 'régime', 'responsable légal'],
    weightFilename: 0.4,
    weightContent: 0.6,
  },
  {
    type: 'siecle_bourses',
    filenamePatterns: [/bourse/i, /\bgfe\b/i],
    contentKeywords: ['échelon', 'montant trimestriel', 'boursier', 'ine'],
    weightFilename: 0.5,
    weightContent: 0.5,
  },
  {
    type: 'regies',
    filenamePatterns: [/regie/i, /caisse/i],
    contentKeywords: ['régisseur', 'encaissement régie', 'avance régie'],
    weightFilename: 0.5,
    weightContent: 0.5,
  },
  {
    type: 'paie',
    filenamePatterns: [/paie/i, /salaire/i, /\bcfa\b/i],
    contentKeywords: ['matricule', 'brut', 'net à payer', 'cotisation'],
    weightFilename: 0.4,
    weightContent: 0.6,
  },
];

/**
 * Détecte le type d'un fichier à partir de son nom et d'un échantillon
 * de son contenu (texte ou en-têtes concaténés).
 */
export function detectFileType(
  filename: string,
  contentSample = '',
): DetectionResult {
  const name = (filename || '').toLowerCase();
  const content = (contentSample || '').toLowerCase();

  let best: DetectionResult = { type: 'inconnu', confidence: 0 };

  for (const rule of RULES) {
    const filenameHits = rule.filenamePatterns.filter((p) => p.test(name)).length;
    const filenameScore = filenameHits > 0 ? Math.min(1, filenameHits / rule.filenamePatterns.length) : 0;

    const contentHits = rule.contentKeywords.filter((k) => content.includes(k.toLowerCase())).length;
    const contentScore = rule.contentKeywords.length > 0 ? contentHits / rule.contentKeywords.length : 0;

    const confidence = filenameScore * rule.weightFilename + contentScore * rule.weightContent;

    if (confidence > best.confidence) {
      best = {
        type: rule.type,
        confidence,
        hint:
          confidence > 0.5
            ? `Détecté via ${filenameHits > 0 ? 'nom de fichier' : ''}${filenameHits > 0 && contentHits > 0 ? ' + ' : ''}${contentHits > 0 ? 'en-têtes' : ''}`
            : undefined,
      };
    }
  }

  // Seuil de confiance minimal
  if (best.confidence < 0.3) return { type: 'inconnu', confidence: best.confidence };
  return best;
}

export const IMPORT_TYPE_LABELS: Record<ImportFileType, string> = {
  balance: 'Balance comptable',
  sde: 'Situation des dépenses',
  sdr: 'Situation des recettes',
  grand_livre: 'Grand livre',
  etat_tiers: 'État des tiers',
  siecle_eleves: 'SIECLE — Liste élèves',
  siecle_bourses: 'État des bourses',
  regies: 'État des régies',
  paie: 'Extraction paie',
  inconnu: 'Type inconnu',
};