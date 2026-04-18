/**
 * Moteur de détection des lignes Service de Restauration & Hébergement (SRH)
 * dans un fichier Op@le SDE / SDR / Balance importé.
 *
 * Conforme M9-6 Tome 2 (instruction codificatrice EPLE) :
 *  - Charges éligibles "crédit nourriture" : comptes 6011* (denrées alimentaires)
 *  - Recettes éligibles : 7066* (DP), 7067* (internes), 7068* (commensaux/hôtes)
 *  - Stock denrées : compte 31* (variation 6031, stock final 31)
 *
 * Référence formule : Crédit nourriture = (Recettes éligibles + Stock denrées initial)
 *                                       − Charges denrées réalisées
 */

import * as XLSX from 'xlsx';
import {
  buildRowsFromSheetMatrix,
  normalizeRowsForOpaleImport,
  normalizeColumnName,
} from '@/lib/opaleImportUtils';

export interface LigneSrhDetectee {
  compte: string;
  libelle: string;
  type: 'charge_denree' | 'recette_dp' | 'recette_interne' | 'recette_commensal' | 'stock_denree';
  budget: number;     // Budget ouvert / prévision
  realise: number;    // Réalisé / mandaté ou recouvré
  reste: number;      // Disponible (budget − réalisé) si pertinent
  feuille: string;    // Nom de l'onglet d'origine
}

export interface BilanSrhImport {
  success: boolean;
  errors: string[];
  warnings: string[];

  // Lignes brutes détectées (pour audit/affichage)
  lignes: LigneSrhDetectee[];

  // Agrégats financiers
  chargesDenreesBudget: number;
  chargesDenreesRealise: number;

  recettesDpBudget: number;
  recettesDpRealise: number;
  recettesInternesBudget: number;
  recettesInternesRealise: number;
  recettesCommensauxBudget: number;
  recettesCommensauxRealise: number;

  recettesEligiblesBudget: number;
  recettesEligiblesRealise: number;

  stockDenreesDetecte: number; // Solde compte 31 si trouvé en balance

  feuillesAnalysees: string[];
  exerciceDetecte: number | null;
  uaiDetecte: string | null;
}

// ─── Règles de matching (préfixes M9-6) ─────────────────────────────────────
const PREFIXES: Record<LigneSrhDetectee['type'], string[]> = {
  charge_denree: ['6011', '60111', '60112', '60113', '601'], // 601* avec priorité 6011
  recette_dp: ['7066', '70661', '70662'],
  recette_interne: ['7067', '70671', '70672'],
  recette_commensal: ['7068', '70681', '70682'],
  stock_denree: ['31', '311', '312'],
};

function classerCompte(compte: string): LigneSrhDetectee['type'] | null {
  const c = String(compte).replace(/\s/g, '').trim();
  if (!c) return null;

  if (c.startsWith('6011')) return 'charge_denree';
  if (c.startsWith('7066')) return 'recette_dp';
  if (c.startsWith('7067')) return 'recette_interne';
  if (c.startsWith('7068')) return 'recette_commensal';
  if (/^31\d?/.test(c)) return 'stock_denree';

  // Fallback large 601* uniquement si libellé denrée
  if (c.startsWith('601')) return 'charge_denree';

  return null;
}

function trouverColonne(headers: string[], candidats: string[]): number {
  const norm = headers.map(normalizeColumnName);
  for (const cand of candidats) {
    const target = normalizeColumnName(cand);
    const idx = norm.findIndex(h => h === target);
    if (idx !== -1) return idx;
  }
  for (const cand of candidats) {
    const target = normalizeColumnName(cand);
    const idx = norm.findIndex(h => h.includes(target));
    if (idx !== -1) return idx;
  }
  return -1;
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (v == null) return 0;
  const s = String(v)
    .replace(/[\s\u00A0€]/g, '')
    .replace(/\((.*)\)/, '-$1')
    .replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

/**
 * Analyse complète d'un fichier Excel Op@le.
 * Détecte automatiquement les onglets utiles (SDE / SDR / Balance) et extrait
 * les lignes SRH en agrégeant par grand poste.
 */
export async function analyserFichierSrh(file: File): Promise<BilanSrhImport> {
  const result: BilanSrhImport = {
    success: false,
    errors: [],
    warnings: [],
    lignes: [],
    chargesDenreesBudget: 0,
    chargesDenreesRealise: 0,
    recettesDpBudget: 0,
    recettesDpRealise: 0,
    recettesInternesBudget: 0,
    recettesInternesRealise: 0,
    recettesCommensauxBudget: 0,
    recettesCommensauxRealise: 0,
    recettesEligiblesBudget: 0,
    recettesEligiblesRealise: 0,
    stockDenreesDetecte: 0,
    feuillesAnalysees: [],
    exerciceDetecte: null,
    uaiDetecte: null,
  };

  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: false, raw: false });

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;

      const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(ws, {
        header: 1,
        defval: '',
        raw: false,
      });

      const rows = normalizeRowsForOpaleImport(buildRowsFromSheetMatrix(matrix));
      if (!rows.length) continue;

      const headers = Object.keys(rows[0] ?? {});
      const idxCompte = trouverColonne(headers, ['compte', 'compte general', 'numero compte', 'n compte', 'code', 'imputation']);
      const idxLibelle = trouverColonne(headers, ['libelle', 'libelle compte', 'designation', 'intitule']);
      const idxBudget = trouverColonne(headers, ['budget', 'prevision', 'credits ouverts', 'ouverture', 'voté']);
      const idxRealise = trouverColonne(headers, ['realise', 'mandate', 'recouvre', 'execute', 'realise n']);
      const idxSolde = trouverColonne(headers, ['solde', 'solde debiteur', 'solde crediteur', 'solde n']);

      if (idxCompte === -1) continue; // pas une feuille comptable
      result.feuillesAnalysees.push(sheetName);

      let detectedInThisSheet = 0;
      for (const row of rows) {
        const valsArr = headers.map(h => row[h]);
        const compte = String(valsArr[idxCompte] ?? '').trim();
        if (!compte) continue;

        const type = classerCompte(compte);
        if (!type) continue;

        const libelle = idxLibelle !== -1 ? String(valsArr[idxLibelle] ?? '').trim() : '';
        const budget = idxBudget !== -1 ? toNum(valsArr[idxBudget]) : 0;
        let realise = idxRealise !== -1 ? toNum(valsArr[idxRealise]) : 0;

        // Pour les comptes de stock (31), on lit le solde plutôt que le réalisé
        if (type === 'stock_denree' && idxSolde !== -1) {
          realise = toNum(valsArr[idxSolde]);
        }

        const reste = budget - Math.abs(realise);

        result.lignes.push({
          compte,
          libelle,
          type,
          budget,
          realise: Math.abs(realise),
          reste,
          feuille: sheetName,
        });
        detectedInThisSheet++;
      }

      if (detectedInThisSheet === 0) {
        result.warnings.push(`Aucune ligne SRH détectée dans l'onglet « ${sheetName} ».`);
      }
    }

    if (result.lignes.length === 0) {
      result.errors.push(
        "Aucune ligne SRH (comptes 6011* ou 7066/7067/7068*) n'a été trouvée dans ce fichier. " +
        "Vérifiez qu'il s'agit bien d'un export Op@le SDE/SDR ou Balance comportant les comptes du service de restauration."
      );
      return result;
    }

    // Agrégation par type
    for (const l of result.lignes) {
      switch (l.type) {
        case 'charge_denree':
          result.chargesDenreesBudget += l.budget;
          result.chargesDenreesRealise += l.realise;
          break;
        case 'recette_dp':
          result.recettesDpBudget += l.budget;
          result.recettesDpRealise += l.realise;
          break;
        case 'recette_interne':
          result.recettesInternesBudget += l.budget;
          result.recettesInternesRealise += l.realise;
          break;
        case 'recette_commensal':
          result.recettesCommensauxBudget += l.budget;
          result.recettesCommensauxRealise += l.realise;
          break;
        case 'stock_denree':
          result.stockDenreesDetecte += l.realise;
          break;
      }
    }

    result.recettesEligiblesBudget =
      result.recettesDpBudget + result.recettesInternesBudget + result.recettesCommensauxBudget;
    result.recettesEligiblesRealise =
      result.recettesDpRealise + result.recettesInternesRealise + result.recettesCommensauxRealise;

    result.success = true;
    return result;
  } catch (e) {
    result.errors.push(`Erreur de lecture du fichier : ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }
}

/**
 * Calcule le crédit nourriture restant et la projection à la date du jour.
 * Formule M9-6 :
 *   Crédit disponible = (Recettes éligibles réalisées + Stock denrées initial)
 *                     − Charges denrées réalisées
 */
export interface CalculCreditNourriture {
  recettesEligibles: number;
  chargesDenrees: number;
  stockInitial: number;
  creditDisponible: number;
  coutMoyenJour: number;          // charges / jours écoulés
  projectionChargesRestantes: number; // coutMoyenJour × jours restants
  soldeProjeteFin: number;        // creditDisponible − projection
  statut: 'excedent' | 'equilibre' | 'tension' | 'deficit';
  alertes: string[];
}

export function calculerCreditNourriture(params: {
  recettesEligibles: number;
  chargesDenrees: number;
  stockInitial: number;
  joursEcoules: number;
  joursRestants: number;
}): CalculCreditNourriture {
  const { recettesEligibles, chargesDenrees, stockInitial, joursEcoules, joursRestants } = params;

  const creditDisponible = recettesEligibles + stockInitial - chargesDenrees;
  const coutMoyenJour = joursEcoules > 0 ? chargesDenrees / joursEcoules : 0;
  const projectionChargesRestantes = coutMoyenJour * joursRestants;
  const soldeProjeteFin = creditDisponible - projectionChargesRestantes;

  let statut: CalculCreditNourriture['statut'];
  const tauxCouverture = projectionChargesRestantes > 0
    ? creditDisponible / projectionChargesRestantes
    : creditDisponible > 0 ? Infinity : 0;

  if (tauxCouverture >= 1.20) statut = 'excedent';
  else if (tauxCouverture >= 1.00) statut = 'equilibre';
  else if (tauxCouverture >= 0.85) statut = 'tension';
  else statut = 'deficit';

  const alertes: string[] = [];
  if (statut === 'deficit') {
    alertes.push(`⛔ Le crédit nourriture est insuffisant : il manque ${(Math.abs(soldeProjeteFin)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} pour terminer l'année scolaire au rythme actuel.`);
  } else if (statut === 'tension') {
    alertes.push(`⚠️ Tension prévisionnelle : le crédit ne couvre que ${(tauxCouverture * 100).toFixed(0)}% des dépenses restantes estimées. Surveiller les commandes.`);
  } else if (statut === 'excedent') {
    alertes.push(`✅ Marge confortable : ${(soldeProjeteFin).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} d'excédent prévu en fin d'année.`);
  }

  if (stockInitial === 0) {
    alertes.push("ℹ️ Aucun stock initial de denrées renseigné. Saisissez le solde du compte 31 au 1er septembre pour affiner le calcul.");
  }
  if (joursEcoules === 0) {
    alertes.push("ℹ️ Aucun jour de service écoulé : le coût/jour ne peut pas être calculé. Les chiffres affichés sont uniquement comptables.");
  }

  return {
    recettesEligibles,
    chargesDenrees,
    stockInitial,
    creditDisponible,
    coutMoyenJour,
    projectionChargesRestantes,
    soldeProjeteFin,
    statut,
    alertes,
  };
}
