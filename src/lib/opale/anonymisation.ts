// Détection automatique d'éléments sensibles dans un texte avant publication.
// Regex strictes — NE PAS modifier sans test (verify-opale-rgpd).

export interface DetectionSensible {
  type: "uai" | "siret" | "ine" | "email" | "telephone" | "iban";
  match: string;
  index: number;
}

const RE_UAI = /\b(\d{7}[A-Z])\b/g;
const RE_SIRET = /\b(\d{14})\b/g;
const RE_INE = /\b([0-9A-Z]{10}[A-Z])\b/g;
const RE_EMAIL = /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const RE_TEL = /\b(0[1-9](?:[\s.-]?\d{2}){4})\b/g;
const RE_IBAN = /\b(FR\d{2}\s?(?:\d{4}\s?){5}(?:\d{2}|\w{2})\d{1,3})\b/gi;

export function detecterElementsSensibles(texte: string): DetectionSensible[] {
  if (!texte) return [];
  const out: DetectionSensible[] = [];
  const push = (type: DetectionSensible["type"], r: RegExp) => {
    let m: RegExpExecArray | null;
    const reg = new RegExp(r.source, r.flags);
    while ((m = reg.exec(texte))) {
      out.push({ type, match: m[1] ?? m[0], index: m.index });
    }
  };
  push("uai", RE_UAI);
  push("siret", RE_SIRET);
  push("ine", RE_INE);
  push("email", RE_EMAIL);
  push("telephone", RE_TEL);
  push("iban", RE_IBAN);
  return out;
}

export function contientElementsSensibles(texte: string): boolean {
  return detecterElementsSensibles(texte).length > 0;
}

export const LABELS_SENSIBLES: Record<DetectionSensible["type"], string> = {
  uai: "code UAI d'établissement",
  siret: "numéro SIRET",
  ine: "numéro INE d'élève",
  email: "adresse email",
  telephone: "numéro de téléphone",
  iban: "IBAN",
};