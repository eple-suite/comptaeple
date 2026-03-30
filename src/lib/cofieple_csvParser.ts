// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Parseur CSV Op@le + Validation M9-6
// ═══════════════════════════════════════════════════════════════════

import type { LigneSDE, LigneSDR, LigneBalance, UAIRecord, Etablissement } from './cofieple_types';
import { enrichParsedSdeRow, enrichParsedSdrRow } from './opaleExecutionHierarchy';
import { NOMENCLATURE_M96 } from './m96nomenclature';

// ── Cache des préfixes M9-6 autorisés ────────────────────────────────
const _m96Prefixes = new Set(NOMENCLATURE_M96.map(c => c.numero));

/** Normalise un numéro de compte Op@le : supprime le préfixe "C/" et les espaces */
export function normalizeCompte(raw: string): string {
  return raw.replace(/^C\//i, '').replace(/\s.*/g, '').trim();
}

/** Vérifie qu'un numéro de compte correspond à un préfixe M9-6 autorisé */
export function isCompteM96Valide(compte: string): boolean {
  if (!compte || compte.length < 2) return false;
  // Check prefixes from 2 to 6 chars
  for (let len = Math.min(compte.length, 6); len >= 2; len--) {
    if (_m96Prefixes.has(compte.substring(0, len))) return true;
  }
  return false;
}

/** Valide les lignes importées et retourne les comptes non reconnus */
export function validerComptesImportes(lignes: { compte: string }[]): string[] {
  const invalides = new Set<string>();
  for (const l of lignes) {
    if (l.compte && !isCompteM96Valide(l.compte)) invalides.add(l.compte);
  }
  return Array.from(invalides).sort();
}

// ── Utilitaires ──────────────────────────────────────────────────────
function toNum(v: unknown): number {
  if (v == null || v === '') return 0;
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  return parseFloat(s) || 0;
}
function toStr(v: unknown): string {
  return String(v ?? '').trim();
}
function detectDelimiter(text: string): string {
  const semicolons = (text.substring(0, 2000).match(/;/g) || []).length;
  const commas = (text.substring(0, 2000).match(/,/g) || []).length;
  const tabs = (text.substring(0, 2000).match(/\t/g) || []).length;
  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function parseCSV(text: string): Record<string, string>[] {
  const sep = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(sep).map(h => h.replace(/^["']|["']$/g, '').trim());
  return lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.replace(/^["']|["']$/g, '').trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  }).filter(r => Object.values(r).some(v => v !== ''));
}

// ── Parseur SDE (Situation des dépenses) ─────────────────────────────
// Format Op@le : RNE, exercice, service, domaine, activités, compte,
//               budget, engagé, réalisé, en cours, disponible, EXT
export function parseSDE(text: string): LigneSDE[] {
  const rows = parseCSV(text);
  return rows.map(r => {
    const compte = normalizeCompte(toStr(r['compte'] || r['Compte'] || '')).substring(0, 6);
    const base: LigneSDE = {
      rne: toStr(r['RNE'] || r['rne'] || ''),
      exercice: Math.round(toNum(r['exercice'] || r['Exercice'])) || new Date().getFullYear(),
      service: toStr(r['service'] || r['Service'] || ''),
      domaine: toStr(r['domaine'] || r['Domaine'] || ''),
      activite: toStr(r['activités'] || r['activite'] || r['Activité'] || ''),
      compte,
      budget: toNum(r['budget'] || r['Budget'] || r['BUDGET'] || r['Prévisions'] || r['previsions'] || r['prévisions'] || r['Crédits ouverts'] || r['credits ouverts'] || r['Credits ouverts'] || r['Dotation'] || r['dotation'] || r['Crédits votés'] || r['Crédits initiaux'] || r['BI'] || r['Montant budgétisé'] || r['Montant budgetisé'] || r['Montant budgetise'] || r['montant budgétisé'] || r['montant budgetisé'] || r['montant budgetise']),
      engage: toNum(r['engagé'] || r['engage'] || r['Engagé'] || r['Engage'] || r['ENGAGE']),
      realise: toNum(r['réalisé'] || r['realise'] || r['Réalisé'] || r['Realise'] || r['REALISE'] || r['mandaté'] || r['Mandaté'] || r['mandate'] || r['Mandate'] || r['MANDATE'] || r['liquidé'] || r['Liquidé'] || r['Montant net des dépenses'] || r['Montant net des depenses'] || r['montant net des dépenses'] || r['montant net des depenses'] || r['Dépenses nettes'] || r['depenses nettes']),
      encours: toNum(r['en cours'] || r['encours'] || r['En cours'] || '0'),
      disponible: toNum(r['disponible'] || r['Disponible'] || '0'),
      ext: toStr(r['EXT'] || r['ext'] || ''),
    };
    return enrichParsedSdeRow(base, r);
  }).filter(r => r.service !== '' || r.compte !== '');
}

// ── Parseur SDR (Situation des recettes) ─────────────────────────────
// Format Op@le : RNE, exercice, service, domaine, activités, compte,
//               budget, engagé, aor, réalisé, en cours, +values/-values, EXTOURNE
export function parseSDR(text: string): LigneSDR[] {
  const rows = parseCSV(text);
  return rows.map(r => {
    const compte = normalizeCompte(toStr(r['compte'] || r['Compte'] || '')).substring(0, 6);
    const base: LigneSDR = {
      rne: toStr(r['RNE'] || r['rne'] || ''),
      exercice: Math.round(toNum(r['exercice'] || r['Exercice'])) || new Date().getFullYear(),
      service: toStr(r['service'] || r['Service'] || ''),
      domaine: toStr(r['domaine'] || r['Domaine'] || ''),
      activite: toStr(r['activités'] || r['activite'] || r['Activité'] || ''),
      compte,
      budget: toNum(r['budget'] || r['Budget'] || r['BUDGET'] || r['Prévisions'] || r['previsions'] || r['prévisions'] || r['Crédits ouverts'] || r['credits ouverts'] || r['Dotation'] || r['dotation'] || r['Crédits votés'] || r['Crédits initiaux'] || r['BI'] || r['Montant budgétisé'] || r['Montant budgetisé'] || r['Montant budgetise'] || r['montant budgétisé'] || r['montant budgetisé'] || r['montant budgetise']),
      engage: toNum(r['engagé'] || r['engage'] || r['Engagé'] || r['Engage'] || r['ENGAGE']),
      aor: toNum(r['aor'] || r['AOR'] || r['émis'] || r['Émis'] || r['emis'] || r['Emis'] || r['Montant émis'] || r['Montant emis'] || r['montant émis'] || r['montant emis'] || '0'),
      realise: toNum(r['réalisé'] || r['realise'] || r['Réalisé'] || r['Realise'] || r['REALISE'] || r['aor'] || r['AOR'] || r['émis'] || r['Émis'] || r['emis'] || r['Emis'] || r['titré'] || r['Titré'] || r['Montant net des recettes'] || r['Montant net des recettes'] || r['montant net des recettes'] || r['montant net des recettes'] || r['Recettes nettes'] || r['recettes nettes'] || '0'),
      encours: toNum(r['en cours'] || r['encours'] || '0'),
      plusValues: toNum(r['+values/-values'] || r['plusValues'] || '0'),
      extourne: toStr(r['EXTOURNE'] || r['extourne'] || 'N'),
    };
    return enrichParsedSdrRow(base, r);
  }).filter(r => r.service !== '' || r.compte !== '');
}

// ── Parseur Balance Op@le (IMPORT BAL) ───────────────────────────────
// Format Op@le IMPORT BAL : Compte, Intitulé réduit du compte,
// Compte et intitulé, Type, Montant débit antérieur, Montant crédit antérieur,
// Montant débit, Montant crédit, Solde débit, Solde crédit,
// Poste, Intitulé réduit du poste, Classe de compte, Sous-classe, ...
export function parseBalance(text: string): LigneBalance[] {
  const rows = parseCSV(text);
  return rows
    .filter(r => {
      const raw = toStr(r['Compte'] || r['compte'] || '');
      const compte = normalizeCompte(raw);
      return compte && /^\d/.test(compte) && compte.length >= 3;
    })
    .map(r => {
      const compte = normalizeCompte(toStr(r['Compte'] || r['compte'] || '')).replace(/[^0-9]/g, '').substring(0, 9);
      const classe = compte.charAt(0);
      return {
        compte,
        intituleReduit: toStr(r['Intitulé réduit du compte'] || r['intitule'] || r['Libellé'] || compte),
        type: toStr(r['Type'] || ''),
        antDbt: toNum(r['Montant débit antérieur'] || r['antDbt'] || '0'),
        antCrd: toNum(r['Montant crédit antérieur'] || r['antCrd'] || '0'),
        dbt: toNum(r['Montant débit'] || r['dbt'] || '0'),
        crd: toNum(r['Montant crédit'] || r['crd'] || '0'),
        solDbt: toNum(r['Solde débit'] || r['solDbt'] || '0'),
        solCrd: toNum(r['Solde crédit'] || r['solCrd'] || '0'),
        poste: toStr(r['Poste'] || r['poste'] || ''),
        classe,
        ssClasse: compte.substring(0, 2),
        ssSsClasse: compte.substring(0, 3),
        etablissement: toStr(r['Etablissement'] || r['etablissement'] || ''),
      };
    })
    .filter(r => r.compte !== '');
}

// ── Détection budget annexe dans la balance ───────────────────────────
// Op@le exporte la balance avec les ruptures identifiant les BA
// Rupture 1-4 peuvent contenir "GRETA", "CFA", etc.
export function detecterBudgetsAnnexes(bal: LigneBalance[]): string[] {
  const codes = new Set<string>();
  bal.forEach(b => {
    if (b.budgetScope === 'annexe' && b.codeAnnexe) codes.add(b.codeAnnexe);
  });
  return Array.from(codes);
}

// ── Détection automatique du type de budget à partir de la balance ────
// Logique M9-6 :
// - Budget principal : présence du compte 515100 (dépôt au Trésor) avec solde > 0
// - Budget annexe : absence de 515100 ET présence du 185000 (liaison) en solde débiteur
// - Sous-type : 706700 (GRETA), 706500 (CFA), 706600 (SRH)
export type BudgetTypeDetected = 'PRINCIPAL' | 'ANNEXE_GRETA' | 'ANNEXE_CFA' | 'ANNEXE_SRH' | 'ANNEXE_AUTRE';

export interface BudgetTypeDetection {
  type: BudgetTypeDetected;
  hasTresor: boolean;
  hasCompte185: boolean;
  compte185Solde: number;
  isAnnexe: boolean;
  confidence: 'high' | 'medium' | 'low';
  details: string;
}

export function detectBudgetType(bal: LigneBalance[]): BudgetTypeDetection {
  // Comptes clés (Op@le = 6 chiffres)
  const c515100 = bal.find(l => l.compte.startsWith('515100'));
  const c185000 = bal.find(l => l.compte.startsWith('185000') || l.compte.startsWith('18500'));
  const c706700 = bal.find(l => l.compte.startsWith('706700')); // GRETA formation continue
  const c706500 = bal.find(l => l.compte.startsWith('706500')); // CFA apprentissage
  const c706600 = bal.find(l => l.compte.startsWith('706600')); // SRH restauration/hébergement

  const hasTresor = !!(c515100 && (c515100.solDbt > 0 || c515100.solCrd > 0));
  const has185Debiteur = !!(c185000 && c185000.solDbt > 0);
  const isAnnexe = !hasTresor && has185Debiteur;

  let type: BudgetTypeDetected = 'PRINCIPAL';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let details = '';

  if (isAnnexe) {
    if (c706700 && c706700.solCrd > 0) {
      type = 'ANNEXE_GRETA';
      details = `C/185000 débiteur (${c185000!.solDbt.toFixed(2)} €), C/706700 créditeur → GRETA`;
    } else if (c706500 && c706500.solCrd > 0) {
      type = 'ANNEXE_CFA';
      details = `C/185000 débiteur (${c185000!.solDbt.toFixed(2)} €), C/706500 créditeur → CFA`;
    } else if (c706600 && c706600.solCrd > 0) {
      type = 'ANNEXE_SRH';
      details = `C/185000 débiteur (${c185000!.solDbt.toFixed(2)} €), C/706600 créditeur → SRH`;
    } else {
      type = 'ANNEXE_AUTRE';
      confidence = 'medium';
      details = `C/185000 débiteur (${c185000!.solDbt.toFixed(2)} €), sous-type non identifié`;
    }
  } else if (hasTresor) {
    details = `C/515100 présent avec solde → Budget principal`;
  } else {
    // Ni trésor ni 185 débiteur — probablement principal sans trésorerie significative
    confidence = 'low';
    details = `Ni C/515100 ni C/185000 débiteur détectés — classé principal par défaut`;
  }

  return {
    type,
    hasTresor,
    hasCompte185: !!c185000,
    compte185Solde: c185000 ? (c185000.solDbt - c185000.solCrd) : 0,
    isAnnexe,
    confidence,
    details,
  };
}

// ── Séparation BP/BA dans la balance ─────────────────────────────────
// Dans Op@le, la balance peut être exportée avec une rupture identifiant le BA
// On cherche des mots-clés dans les colonnes rupture
export function separerBalanceBPBA(raw: Record<string, string>[]): LigneBalance[] {
  return raw.map(r => {
    const compte = toStr(r['Compte'] || r['compte'] || '').replace(/[^0-9]/g, '').substring(0, 9);
    if (!compte || !/^\d/.test(compte)) return null;

    // Détection BA via colonnes rupture Op@le
    const rup1 = toStr(r['Rupture 1'] || r['Libellé rupture 1'] || '').toUpperCase();
    const rup2 = toStr(r['Rupture 2'] || r['Libellé rupture 2'] || '').toUpperCase();
    const rup3 = toStr(r['Rupture 3'] || r['Libellé rupture 3'] || '').toUpperCase();
    const rup4 = toStr(r['Rupture 4'] || r['Libellé rupture 4'] || '').toUpperCase();
    const allRup = [rup1, rup2, rup3, rup4].join(' ');

    let budgetScope: LigneBalance['budgetScope'] = 'principal';
    let codeAnnexe: string | undefined = undefined;

    const keywords = ['GRETA', 'CFA', 'SRH', 'RESTAUR', 'HEBERGEM', 'INTERNAT', 'ANNEXE'];
    for (const kw of keywords) {
      if (allRup.includes(kw)) {
        budgetScope = 'annexe';
        codeAnnexe = kw === 'RESTAUR' || kw === 'HEBERGEM' ? 'SRH' : kw;
        break;
      }
    }

    return {
      compte,
      intituleReduit: toStr(r['Intitulé réduit du compte'] || r['intitule'] || compte),
      type: toStr(r['Type'] || ''),
      antDbt: toNum(r['Montant débit antérieur'] || '0'),
      antCrd: toNum(r['Montant crédit antérieur'] || '0'),
      dbt: toNum(r['Montant débit'] || '0'),
      crd: toNum(r['Montant crédit'] || '0'),
      solDbt: toNum(r['Solde débit'] || '0'),
      solCrd: toNum(r['Solde crédit'] || '0'),
      poste: toStr(r['Poste'] || ''),
      classe: compte.charAt(0),
      ssClasse: compte.substring(0, 2),
      ssSsClasse: compte.substring(0, 3),
      etablissement: toStr(r['Etablissement'] || ''),
      budgetScope,
      codeAnnexe,
    };
  }).filter(Boolean) as LigneBalance[];
}

// ── lookupUAI — DEPRECATED ───────────────────────────────────────────
// L'identification d'établissement utilise désormais le menu Établissements
// (EstablishmentContext) au lieu d'appeler l'API externe.
// Cette fonction est conservée uniquement pour compatibilité ascendante.
export async function lookupUAI(_uai: string): Promise<null> {
  console.warn('lookupUAI est déprécié. Utilisez le sélecteur d\'établissement.');
  return null;
}

// ── Formateur monétaire ──────────────────────────────────────────────
export function fmtEur(n: number | null | undefined, dec = 2): string {
  if (n == null || isNaN(n)) return '—';
  const raw = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    style: 'currency',
    currency: 'EUR',
  }).format(n);
  // Replace narrow non-breaking space (U+202F) and non-breaking space (U+00A0)
  // with regular space — fixes "/" rendering in jsPDF Helvetica
  return raw.replace(/[\u202F\u00A0]/g, ' ');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: 'percent',
  }).format(n).replace(/[\u202F\u00A0]/g, ' ');
}

export function fmtNum(n: number | null | undefined, dec = 2): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n).replace(/[\u202F\u00A0]/g, ' ');
}
