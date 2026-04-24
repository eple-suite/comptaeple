// =====================================================================
// Adapter — convertit la balance interne COFIEPLE (lignes plates avec
// `compte`, `solDbt`, `solCrd`) vers le format `Balance` attendu par
// les moteurs `bilanFinancierEngine` et `reprofiIndicateursEngine`.
// =====================================================================

import type { Balance } from './bilanFinancierEngine';

export interface LigneBalanceCofieple {
  compte?: string;
  solDbt?: number;
  solCrd?: number;
}

/**
 * Convertit un tableau de lignes de balance COFIEPLE en `Balance` indexée par
 * numéro de compte. Les soldes sont sommés si plusieurs lignes partagent le
 * même numéro de compte (cas des sous-comptes éclatés à l'import).
 */
export function adapterBalanceVersEngine(rows: LigneBalanceCofieple[] | null | undefined): Balance {
  const out: Balance = {};
  if (!rows || !Array.isArray(rows)) return out;
  for (const r of rows) {
    const c = (r.compte || '').toString().trim();
    if (!c) continue;
    const cur = out[c] ?? { solde_deb: 0, solde_cred: 0 };
    cur.solde_deb += Number(r.solDbt) || 0;
    cur.solde_cred += Number(r.solCrd) || 0;
    out[c] = cur;
  }
  return out;
}