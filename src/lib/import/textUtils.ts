// ═══════════════════════════════════════════════════════════════
// Utilitaires de texte — encodage, nombres FR, dates FR
// ═══════════════════════════════════════════════════════════════

/**
 * Détecte l'encodage d'un buffer (UTF-8 / Windows-1252).
 * Heuristique : présence de BOM UTF-8 ou caractères UTF-8 valides.
 * Retourne 'utf-8' par défaut.
 */
export function detectEncoding(buffer: ArrayBuffer | Uint8Array): 'utf-8' | 'windows-1252' {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // BOM UTF-8 explicite
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  // Tentative décode UTF-8 strict
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(bytes);
    return 'utf-8';
  } catch {
    return 'windows-1252';
  }
}

/**
 * Décode un buffer en texte selon l'encodage détecté.
 */
export function decodeBuffer(buffer: ArrayBuffer | Uint8Array): string {
  const encoding = detectEncoding(buffer);
  const decoder = new TextDecoder(encoding);
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return decoder.decode(bytes);
}

/**
 * Parse un nombre au format français : virgule décimale, espaces
 * insécables ou normaux comme séparateurs de milliers, parenthèses
 * pour négatifs, suffixes "€" tolérés.
 * Retourne NaN si non parseable.
 */
export function parseFrenchNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return NaN;
  if (typeof value === 'number') return value;

  let s = String(value).trim();
  if (!s) return NaN;

  // Parenthèses = négatif comptable
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  // Retirer symboles monétaires et espaces (insécable U+00A0, fine U+202F)
  s = s.replace(/[€$£]/g, '').replace(/[\s\u00a0\u202f]/g, '');

  // Cas "1,234.56" (anglo) vs "1.234,56" (FR)
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    // FR : virgule = décimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // anglo avec milliers
    s = s.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

/**
 * Parse une date au format français (JJ/MM/AAAA) ou ISO (AAAA-MM-JJ),
 * avec séparateurs / - . tolérés. Retourne null si non parseable.
 */
export function parseFrenchDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const s = String(value).trim();
  if (!s) return null;

  // ISO : AAAA-MM-JJ
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // FR : JJ/MM/AAAA  (ou JJ-MM-AAAA, JJ.MM.AAAA)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let yy = Number(m[3]);
    if (yy < 100) yy += yy < 50 ? 2000 : 1900;
    const d = new Date(yy, Number(m[2]) - 1, Number(m[1]));
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // Numérique Excel (jours depuis 1900-01-01, faux bug compris)
  const num = Number(s);
  if (Number.isFinite(num) && num > 25569 && num < 60000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    return Number.isFinite(d.getTime()) ? d : null;
  }

  return null;
}

/**
 * Calcule le hash SHA-256 d'un fichier (hex). Utilisé pour
 * l'idempotence et le versioning.
 */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = data instanceof ArrayBuffer ? data : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Valide un INE (Identifiant National Élève) :
 * 11 caractères alphanumériques.
 */
export function isValidINE(value: string): boolean {
  return /^[0-9A-Z]{11}$/i.test(String(value ?? '').trim());
}

/**
 * Valide un UAI (Unité Administrative Immatriculée) :
 * 7 chiffres + 1 lettre.
 */
export function isValidUAI(value: string): boolean {
  return /^[0-9]{7}[A-Z]$/i.test(String(value ?? '').trim());
}