// ═══════════════════════════════════════════════════════════════
// Validation croisée inter-fichiers
// Σ classe 6 vs SDE, Σ classe 7 vs SDR, tiers vs balance, etc.
// ═══════════════════════════════════════════════════════════════

export interface CrossCheckResult {
  id: string;
  label: string;
  expected: number;
  actual: number;
  ecart: number;
  ok: boolean;
  tolerance: number;
  hint?: string;
}

export interface BalanceTotals {
  classe6: number; // dépenses
  classe7: number; // recettes
  c411: number;    // créances familles
  c443110: number; // bourses dues
}

export interface SdeTotals {
  mandatsEmis: number;
}

export interface SdrTotals {
  ordresEmis: number;
}

export interface EtatTiersTotals {
  totalFamilles: number;
}

export interface BoursesTotals {
  totalDu: number;
}

const TOLERANCE = 0.01;

function check(
  id: string,
  label: string,
  expected: number,
  actual: number,
  hint?: string,
  tolerance = TOLERANCE,
): CrossCheckResult {
  const ecart = Math.abs(expected - actual);
  return {
    id,
    label,
    expected,
    actual,
    ecart,
    ok: ecart <= tolerance,
    tolerance,
    hint,
  };
}

export function runCrossChecks(input: {
  balance?: BalanceTotals;
  sde?: SdeTotals;
  sdr?: SdrTotals;
  tiers?: EtatTiersTotals;
  bourses?: BoursesTotals;
}): CrossCheckResult[] {
  const results: CrossCheckResult[] = [];

  if (input.balance && input.sde) {
    results.push(
      check(
        'balance_sde',
        'Σ Classe 6 (balance) ≈ Σ Mandats émis (SDE)',
        input.balance.classe6,
        input.sde.mandatsEmis,
        'Un écart > 0,01 € traduit généralement un export Op@le partiel ou des mandats en attente d\'intégration.',
      ),
    );
  }

  if (input.balance && input.sdr) {
    results.push(
      check(
        'balance_sdr',
        'Σ Classe 7 (balance) ≈ Σ Ordres émis (SDR)',
        input.balance.classe7,
        input.sdr.ordresEmis,
        'Vérifier que la SDR couvre la même période que la balance.',
      ),
    );
  }

  if (input.balance && input.tiers) {
    results.push(
      check(
        'balance_tiers',
        'Σ C/411X (balance) ≈ Σ Soldes familles (état tiers)',
        input.balance.c411,
        input.tiers.totalFamilles,
        'Un écart peut signaler un compte tiers non rapproché ou un encaissement en attente.',
      ),
    );
  }

  if (input.balance && input.bourses) {
    results.push(
      check(
        'balance_bourses',
        'Σ C/443110 (balance) ≈ Σ Bourses dues (SIECLE)',
        input.balance.c443110,
        input.bourses.totalDu,
        'Un écart traduit un défaut de notification ou un encaissement non rapproché.',
      ),
    );
  }

  return results;
}

/**
 * Résume les résultats : nombre OK, nombre KO, écart total cumulé.
 */
export function summarizeChecks(results: CrossCheckResult[]): {
  total: number;
  ok: number;
  ko: number;
  ecartTotal: number;
} {
  return {
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    ko: results.filter((r) => !r.ok).length,
    ecartTotal: results.reduce((s, r) => s + r.ecart, 0),
  };
}