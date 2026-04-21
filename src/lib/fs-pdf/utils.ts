// ═══════════════════════════════════════════════════════════════
// Utilitaires partagés PDFs Fonds Sociaux
// ═══════════════════════════════════════════════════════════════

export function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Conversion d'un montant en euros vers une chaîne en lettres (français). */
export function montantEnLettres(montant: number): string {
  const entier = Math.floor(montant);
  const cents = Math.round((montant - entier) * 100);
  const partEntiere = nombreEnLettres(entier);
  const lettre = `${partEntiere} euro${entier > 1 ? "s" : ""}`;
  if (cents > 0) return `${lettre} et ${nombreEnLettres(cents)} centime${cents > 1 ? "s" : ""}`;
  return lettre;
}

function nombreEnLettres(n: number): string {
  if (n === 0) return "zéro";
  if (n < 0) return "moins " + nombreEnLettres(-n);

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  if (n < 20) return units[n];
  if (n < 100) {
    const t = Math.floor(n / 10), u = n % 10;
    if (t === 7 || t === 9) {
      const base = tens[t];
      const reste = 10 + u;
      return base + (t === 7 && u === 1 ? " et " : "-") + units[reste];
    }
    if (u === 0) return tens[t] + (t === 8 ? "s" : "");
    if (u === 1 && t !== 8) return tens[t] + " et un";
    return tens[t] + "-" + units[u];
  }
  if (n < 1000) {
    const c = Math.floor(n / 100), r = n % 100;
    const cent = c === 1 ? "cent" : units[c] + " cent" + (r === 0 && c > 1 ? "s" : "");
    return r === 0 ? cent : cent + " " + nombreEnLettres(r);
  }
  if (n < 1_000_000) {
    const m = Math.floor(n / 1000), r = n % 1000;
    const mille = m === 1 ? "mille" : nombreEnLettres(m) + " mille";
    return r === 0 ? mille : mille + " " + nombreEnLettres(r);
  }
  const m = Math.floor(n / 1_000_000), r = n % 1_000_000;
  const mil = nombreEnLettres(m) + " million" + (m > 1 ? "s" : "");
  return r === 0 ? mil : mil + " " + nombreEnLettres(r);
}