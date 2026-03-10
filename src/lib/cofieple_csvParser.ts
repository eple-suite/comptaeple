// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Parseur CSV Op@le + Lookup UAI
// ═══════════════════════════════════════════════════════════════════

import type { LigneSDE, LigneSDR, LigneBalance, UAIRecord, Etablissement } from './cofieple_types';

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
    const compte = toStr(r['compte'] || r['Compte'] || '').replace(/\s.*/, '').substring(0, 6);
    return {
      rne: toStr(r['RNE'] || r['rne'] || ''),
      exercice: Math.round(toNum(r['exercice'] || r['Exercice'])) || new Date().getFullYear(),
      service: toStr(r['service'] || r['Service'] || ''),
      domaine: toStr(r['domaine'] || r['Domaine'] || ''),
      activite: toStr(r['activités'] || r['activite'] || r['Activité'] || ''),
      compte,
      budget: toNum(r['budget'] || r['Budget'] || r['BUDGET']),
      engage: toNum(r['engagé'] || r['engage'] || r['Engagé']),
      realise: toNum(r['réalisé'] || r['realise'] || r['Réalisé']),
      encours: toNum(r['en cours'] || r['encours'] || '0'),
      disponible: toNum(r['disponible'] || r['Disponible'] || '0'),
      ext: toStr(r['EXT'] || r['ext'] || ''),
    };
  }).filter(r => r.service !== '' || r.compte !== '');
}

// ── Parseur SDR (Situation des recettes) ─────────────────────────────
// Format Op@le : RNE, exercice, service, domaine, activités, compte,
//               budget, engagé, aor, réalisé, en cours, +values/-values, EXTOURNE
export function parseSDR(text: string): LigneSDR[] {
  const rows = parseCSV(text);
  return rows.map(r => {
    const compte = toStr(r['compte'] || r['Compte'] || '').replace(/\s.*/, '').substring(0, 6);
    return {
      rne: toStr(r['RNE'] || r['rne'] || ''),
      exercice: Math.round(toNum(r['exercice'] || r['Exercice'])) || new Date().getFullYear(),
      service: toStr(r['service'] || r['Service'] || ''),
      domaine: toStr(r['domaine'] || r['Domaine'] || ''),
      activite: toStr(r['activités'] || r['activite'] || r['Activité'] || ''),
      compte,
      budget: toNum(r['budget'] || r['Budget']),
      engage: toNum(r['engagé'] || r['engage'] || r['Engagé']),
      aor: toNum(r['aor'] || r['AOR'] || '0'),
      realise: toNum(r['réalisé'] || r['realise'] || r['Réalisé'] || r['aor'] || '0'),
      encours: toNum(r['en cours'] || r['encours'] || '0'),
      plusValues: toNum(r['+values/-values'] || r['plusValues'] || '0'),
      extourne: toStr(r['EXTOURNE'] || r['extourne'] || 'N'),
    };
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
      const compte = toStr(r['Compte'] || r['compte'] || '');
      return compte && /^\d/.test(compte) && compte.length >= 3;
    })
    .map(r => {
      const compte = toStr(r['Compte'] || r['compte'] || '').replace(/[^0-9]/g, '').substring(0, 9);
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

// ── Lookup UAI (API Éducation nationale) ──────────────────────────────
// API : https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/
//        fr-en-annuaire-education/records?where=identifiant_de_l_uai="{uai}"
export async function lookupUAI(uai: string): Promise<Partial<Etablissement> | null> {
  const uaiClean = uai.trim().toUpperCase();
  if (!/^[0-9]{7}[A-Z]$/.test(uaiClean)) {
    throw new Error(`Format UAI invalide : "${uai}". Le format attendu est 7 chiffres suivis d'une lettre (ex: 9710746J).`);
  }

  const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=identifiant_de_l_etablissement%3D%22${uaiClean}%22&limit=1`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Erreur API Éducation nationale : ${resp.status}`);

  const data = await resp.json();
  if (!data.results || data.results.length === 0) return null;

  const rec: UAIRecord = data.results[0];

  const typeMap: Record<string, Etablissement['type']> = {
    'Lycée': 'lycee', 'Lycée professionnel': 'lycee_pro',
    'Lycée général': 'lycee', 'Lycée technologique': 'legt',
    'LEGT': 'legt', 'Collège': 'college', 'EREA': 'erea',
  };
  const type = typeMap[rec.libelle_nature] || 'autre';

  return {
    uai: uaiClean,
    nom: rec.nom_etablissement || '',
    type,
    adresse: [rec.adresse_1, rec.adresse_2].filter(Boolean).join(', '),
    codePostal: rec.code_postal || '',
    commune: rec.nom_commune || '',
    academie: `Académie de ${rec.libelle_academie || ''}`,
    region: `Région académique ${rec.libelle_region || rec.libelle_region_academique || ''}`,
    departement: rec.libelle_departement || rec.nom_departement || '',
    telephone: rec.telephone || '',
  };
}

// ── Formateur monétaire ──────────────────────────────────────────────
export function fmtEur(n: number | null | undefined, dec = 2): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: 'percent',
  }).format(n);
}

export function fmtNum(n: number | null | undefined, dec = 2): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);
}
