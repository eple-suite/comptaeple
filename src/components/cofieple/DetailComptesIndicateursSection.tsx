// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — Détail des comptes par indicateur M9-6
// Pour chaque indicateur (BFR, DRFN, CAF, TMcap, TMnr) : liste des
// comptes inclus / exclus, montants agrégés et formule appliquée.
// Source : règles codifiées dans src/lib/cofieple_m96engine.ts
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCofiepleStore } from '@/store/useCofiepleStore';
import { formatEur } from '@/lib/cofieple_calculations';
import type { LigneBalance, LigneSDE, LigneSDR } from '@/lib/cofieple_types';
import {
  Calculator, CheckCircle2, XCircle, Filter, Search, Database, Info, LayoutGrid,
} from 'lucide-react';

// ── Règles (miroir exact de cofieple_m96engine.ts) ────────────────────
const COMPTES_TRESORERIE_REGEX = /^(511|512|514|515|516|517|518|531|532|533|534|535|536|537|538|539)/;
const COMPTES_ORDRE_CL6_REGEX = /^(675|676|681|686|687)/;
const CHARGES_NON_DEC_REGEX = /^(68|675)/;
const PRODUITS_NON_ENC_REGEX = /^(78|775|776|777)/;
const TMCAP_REGEX = /^(4081|4084|4086|4088|4286|4386|4486|4686)/;
const TMNR_REGEX = /^(411|416|418)/;

type Source = 'balance' | 'sde' | 'sdr';
type Inclusion = 'inclus' | 'exclu';

interface CompteRow {
  source: Source;
  compte: string;
  intitule: string;
  inclusion: Inclusion;
  montantLabel: string;       // ex: "Solde débiteur"
  montant: number;
  signe: 1 | -1;              // contribution à l'indicateur (+/−)
  raison?: string;
}

interface IndicateurBlock {
  id: string;
  titre: string;
  ref: string;                 // référence M9-6
  formule: string;
  resultat: number;
  unite: 'euro' | 'pct';
  regles: string[];
  rows: CompteRow[];
}

function uniqBalance(bal: LigneBalance[]): LigneBalance[] {
  return bal.filter(b => !b.isAggregate);
}

function buildBfr(bal: LigneBalance[]): IndicateurBlock {
  const rows: CompteRow[] = [];
  const detail = uniqBalance(bal);

  let solDbtCl3 = 0, solDbtCl4 = 0, solDbtCl5HorsTreso = 0;
  let solCrdCl4 = 0, solCrdCl5HorsTreso = 0;
  let exclusTreso = 0;

  for (const b of detail) {
    const c = b.compte;
    const cls = c.charAt(0);
    if (cls === '3' && b.solDbt > 0) {
      solDbtCl3 += b.solDbt;
      rows.push({ source: 'balance', compte: c, intitule: b.intituleReduit, inclusion: 'inclus', montantLabel: 'Solde débiteur', montant: b.solDbt, signe: 1, raison: 'Stocks (actif circulant)' });
    } else if (cls === '4') {
      if (b.solDbt > 0) {
        solDbtCl4 += b.solDbt;
        rows.push({ source: 'balance', compte: c, intitule: b.intituleReduit, inclusion: 'inclus', montantLabel: 'Solde débiteur', montant: b.solDbt, signe: 1, raison: 'Créances (actif circulant)' });
      }
      if (b.solCrd > 0) {
        solCrdCl4 += b.solCrd;
        rows.push({ source: 'balance', compte: c, intitule: b.intituleReduit, inclusion: 'inclus', montantLabel: 'Solde créditeur', montant: b.solCrd, signe: -1, raison: 'Dettes d\'exploitation (passif circulant)' });
      }
    } else if (cls === '5') {
      const isTreso = COMPTES_TRESORERIE_REGEX.test(c);
      if (isTreso) {
        const m = (b.solDbt || 0) + (b.solCrd || 0);
        if (m > 0) {
          exclusTreso += m;
          rows.push({ source: 'balance', compte: c, intitule: b.intituleReduit, inclusion: 'exclu', montantLabel: 'Solde', montant: m, signe: 1, raison: 'Compte de trésorerie — exclu du BFR' });
        }
      } else {
        if (b.solDbt > 0) {
          solDbtCl5HorsTreso += b.solDbt;
          rows.push({ source: 'balance', compte: c, intitule: b.intituleReduit, inclusion: 'inclus', montantLabel: 'Solde débiteur', montant: b.solDbt, signe: 1, raison: 'Classe 5 hors trésorerie (ex. 585 virements internes)' });
        }
        if (b.solCrd > 0) {
          solCrdCl5HorsTreso += b.solCrd;
          rows.push({ source: 'balance', compte: c, intitule: b.intituleReduit, inclusion: 'inclus', montantLabel: 'Solde créditeur', montant: b.solCrd, signe: -1, raison: 'Classe 5 hors trésorerie' });
        }
      }
    }
  }

  const bfr = solDbtCl3 + solDbtCl4 + solDbtCl5HorsTreso - solCrdCl4 - solCrdCl5HorsTreso;

  return {
    id: 'bfr',
    titre: 'BFR — Besoin en Fonds de Roulement',
    ref: 'M9-6 § II.4 / Pièce 14 Op@le',
    formule: 'BFR = Σ(Cl.3 dbt) + Σ(Cl.4 dbt) + Σ(Cl.5 dbt hors trésorerie) − Σ(Cl.4 crd) − Σ(Cl.5 crd hors trésorerie)',
    resultat: bfr,
    unite: 'euro',
    regles: [
      'INCLUS : tous les comptes de classes 3 et 4, et les classes 5 HORS trésorerie (notamment 585x « Virements internes »).',
      'EXCLUS : comptes de trésorerie 511, 512, 514, 515, 516, 517, 518, 531-539.',
      `Montant trésorerie exclu : ${formatEur(exclusTreso)} (compté dans la TN, pas dans le BFR).`,
    ],
    rows,
  };
}

function buildDrfn(bal: LigneBalance[]): IndicateurBlock {
  const rows: CompteRow[] = [];
  let drfn = 0;

  for (const b of uniqBalance(bal)) {
    if (b.compte.charAt(0) !== '6') continue;
    const flux = (b.dbt || 0) - (b.crd || 0);
    if (COMPTES_ORDRE_CL6_REGEX.test(b.compte)) {
      rows.push({
        source: 'balance', compte: b.compte, intitule: b.intituleReduit,
        inclusion: 'exclu', montantLabel: 'Mvts dbt − crd', montant: flux, signe: 1,
        raison: 'Opération d\'ordre (675 VNC, 676, 681 dot. amort, 686/687 dot. provisions)',
      });
    } else {
      drfn += flux;
      rows.push({
        source: 'balance', compte: b.compte, intitule: b.intituleReduit,
        inclusion: 'inclus', montantLabel: 'Mvts dbt − crd', montant: flux, signe: 1,
        raison: 'Charge réellement décaissable (classe 6 hors comptes d\'ordre)',
      });
    }
  }

  return {
    id: 'drfn',
    titre: 'DRFN — Dépenses Réelles de Fonctionnement Nettes',
    ref: 'M9-6 § IV.2 — base 360 jours',
    formule: 'DRFN = Σ (mvts débit − mvts crédit) sur classe 6 HORS comptes d\'ordre 675/676/681/686/687',
    resultat: drfn,
    unite: 'euro',
    regles: [
      'INCLUS : intégralité de la classe 6 (charges effectivement décaissables sur l\'exercice).',
      'EXCLUS : 675 (VNC cessions), 676, 681 (dot. amortissements), 686/687 (dot. provisions) — opérations d\'ordre sans décaissement.',
      'Source : mouvements (débit − crédit) sur la balance certifiée — neutralise les opérations d\'ordre déjà soustraites au crédit.',
    ],
    rows,
  };
}

function buildCaf(bal: LigneBalance[]): IndicateurBlock {
  const rows: CompteRow[] = [];
  let chargesNonDec = 0;
  let produitsNonEnc = 0;
  let resultatComptableEstime = 0;

  for (const b of uniqBalance(bal)) {
    const c = b.compte;
    const cls = c.charAt(0);
    // Estimation résultat comptable = Σ(crd Cl.7) − Σ(dbt Cl.6)
    if (cls === '6') resultatComptableEstime -= (b.dbt - b.crd);
    if (cls === '7') resultatComptableEstime += (b.crd - b.dbt);

    if (CHARGES_NON_DEC_REGEX.test(c)) {
      const m = (b.dbt - b.crd);
      chargesNonDec += m;
      rows.push({
        source: 'balance', compte: c, intitule: b.intituleReduit,
        inclusion: 'inclus', montantLabel: 'Mvts dbt − crd', montant: m, signe: 1,
        raison: 'Charge non décaissable (dotations 68 / VNC 675) — ajoutée au résultat comptable',
      });
    } else if (PRODUITS_NON_ENC_REGEX.test(c)) {
      const m = (b.crd - b.dbt);
      produitsNonEnc += m;
      rows.push({
        source: 'balance', compte: c, intitule: b.intituleReduit,
        inclusion: 'inclus', montantLabel: 'Mvts crd − dbt', montant: m, signe: -1,
        raison: 'Produit non encaissable (reprises 78, produits cession 775/776/777) — soustrait',
      });
    }
  }

  const caf = resultatComptableEstime + chargesNonDec - produitsNonEnc;

  return {
    id: 'caf',
    titre: 'CAF / IAF — Capacité d\'Auto-Financement',
    ref: 'M9-6 § IV.3 — méthode additive comptable',
    formule: 'CAF = Résultat comptable + Charges non décaissables − Produits non encaissables',
    resultat: caf,
    unite: 'euro',
    regles: [
      `Résultat comptable estimé depuis la balance : ${formatEur(resultatComptableEstime)} (Σcrd Cl.7 − Σdbt Cl.6).`,
      'Charges non décaissables AJOUTÉES : comptes 68 (dotations amort./prov.) et 675 (VNC sur cessions).',
      'Produits non encaissables SOUSTRAITS : 78 (reprises), 775 (produits cessions), 776, 777.',
      'Méthode "balance stricte" — seule source certifiée. La méthode budgétaire pure (SDE/SDR) reste consultable dans le sélecteur du tableau de bord.',
    ],
    rows,
  };
}

function buildTmcap(bal: LigneBalance[]): IndicateurBlock {
  const rows: CompteRow[] = [];
  let chargesAPayer = 0;
  let dbtCl6 = 0;

  for (const b of uniqBalance(bal)) {
    const c = b.compte;
    if (TMCAP_REGEX.test(c) && b.solCrd > 0) {
      chargesAPayer += b.solCrd;
      rows.push({
        source: 'balance', compte: c, intitule: b.intituleReduit,
        inclusion: 'inclus', montantLabel: 'Solde créditeur', montant: b.solCrd, signe: 1,
        raison: 'Charge à payer rattachée à l\'exercice (numérateur)',
      });
    } else if (c.startsWith('40') || c.startsWith('42') || c.startsWith('43') || c.startsWith('44') || c.startsWith('46')) {
      // Comptes "voisins" non retenus en M9-6 strict
      if (b.solCrd > 0 && (c.startsWith('401') || c.startsWith('421') || c.startsWith('441') || c.startsWith('443'))) {
        rows.push({
          source: 'balance', compte: c, intitule: b.intituleReduit,
          inclusion: 'exclu', montantLabel: 'Solde créditeur', montant: b.solCrd, signe: 1,
          raison: 'Dette ordinaire (fournisseur 401, paie 421, État 441, collectivité 443) — non comptée comme charge à payer M9-6',
        });
      }
    }
    if (c.charAt(0) === '6') {
      dbtCl6 += (b.dbt || 0);
    }
  }

  // Ligne dénominateur (informative)
  rows.push({
    source: 'balance', compte: '6 (dénom.)', intitule: 'Total mvts débit classe 6',
    inclusion: 'inclus', montantLabel: 'Σ mvts dbt Cl.6', montant: dbtCl6, signe: 1,
    raison: 'Dénominateur — charges constatées de l\'exercice',
  });

  const tmcap = dbtCl6 > 0 ? (chargesAPayer / dbtCl6) * 100 : 0;

  return {
    id: 'tmcap',
    titre: 'TMcap — Taux moyen de Charges À Payer',
    ref: 'M9-6 § V — Indicateurs de rattachement',
    formule: 'TMcap = (Σ soldes crd des comptes 4081/4084/4086/4088/4286/4386/4486/4686) / (Σ mvts dbt Cl.6) × 100',
    resultat: tmcap,
    unite: 'pct',
    regles: [
      'INCLUS au numérateur (charges à payer strictes M9-6) : 4081, 4084, 4086, 4088, 4286, 4386, 4486, 4686.',
      'EXCLUS : fournisseurs 401, rémunérations dues 421, État 441, collectivités 443, autres 463/467 — ce ne sont pas des charges à payer comptables.',
      'Dénominateur : total des mouvements DÉBIT de la classe 6 (charges effectivement constatées sur l\'exercice).',
    ],
    rows,
  };
}

function buildTmnr(bal: LigneBalance[]): IndicateurBlock {
  const rows: CompteRow[] = [];
  let creances = 0;
  let crdCl7 = 0;

  for (const b of uniqBalance(bal)) {
    const c = b.compte;
    if (TMNR_REGEX.test(c) && b.solDbt > 0) {
      creances += b.solDbt;
      rows.push({
        source: 'balance', compte: c, intitule: b.intituleReduit,
        inclusion: 'inclus', montantLabel: 'Solde débiteur', montant: b.solDbt, signe: 1,
        raison: 'Créance client/famille (411, 416, 418) — numérateur',
      });
    } else if ((c.startsWith('441') || c.startsWith('443') || c.startsWith('463') || c.startsWith('467') || c.startsWith('401')) && b.solDbt > 0) {
      rows.push({
        source: 'balance', compte: c, intitule: b.intituleReduit,
        inclusion: 'exclu', montantLabel: 'Solde débiteur', montant: b.solDbt, signe: 1,
        raison: 'Créance hors périmètre (État 441, collectivité 443, autres 463/467, fournisseur 401) — exclue du TMnr',
      });
    }
    if (c.charAt(0) === '7') crdCl7 += (b.crd || 0);
  }

  rows.push({
    source: 'balance', compte: '7 (dénom.)', intitule: 'Total mvts crédit classe 7',
    inclusion: 'inclus', montantLabel: 'Σ mvts crd Cl.7', montant: crdCl7, signe: 1,
    raison: 'Dénominateur — produits constatés de l\'exercice',
  });

  const tmnr = crdCl7 > 0 ? (creances / crdCl7) * 100 : 0;

  return {
    id: 'tmnr',
    titre: 'TMnr — Taux moyen de Non-Recouvrement',
    ref: 'M9-6 § V — Indicateurs de recouvrement',
    formule: 'TMnr = (Σ soldes dbt 411 + 416 + 418) / (Σ mvts crd Cl.7) × 100',
    resultat: tmnr,
    unite: 'pct',
    regles: [
      'INCLUS au numérateur : créances clients/familles 411, 416 (clients douteux), 418 (factures à établir).',
      'EXCLUS : 401 (fournisseurs), 441 (État), 443 (collectivités), 463/467 (autres) — pas des créances client.',
      'Dénominateur : total des mouvements CRÉDIT de la classe 7 (produits constatés).',
    ],
    rows,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Composant
// ═══════════════════════════════════════════════════════════════════
export function DetailComptesIndicateursSection() {
  const balance = useCofiepleStore(s => s.balance);
  const sde = useCofiepleStore(s => s.sde);
  const sdr = useCofiepleStore(s => s.sdr);
  const activeBudget = useCofiepleStore(s => s.activeBudget);

  const bal: LigneBalance[] = balance[activeBudget] || [];
  const sdeRows: LigneSDE[] = sde[activeBudget] || [];
  const sdrRows: LigneSDR[] = sdr[activeBudget] || [];

  const [filter, setFilter] = useState<'tous' | 'inclus' | 'exclus'>('tous');
  const [search, setSearch] = useState('');

  // Sélecteur d'indicateur unique (persisté dans localStorage).
  // 'tous' affiche tous les blocs empilés ; sinon n'affiche que le bloc choisi.
  type IndicId = 'tous' | 'bfr' | 'drfn' | 'caf' | 'tmcap' | 'tmnr';
  const STORAGE_KEY = 'cofieple_detail_comptes_indicateur';
  const [selectedIndic, setSelectedIndic] = useState<IndicId>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && ['tous', 'bfr', 'drfn', 'caf', 'tmcap', 'tmnr'].includes(v)) return v as IndicId;
    } catch { /* noop */ }
    return 'bfr';
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, selectedIndic); } catch { /* noop */ }
  }, [selectedIndic]);

  const blocks = useMemo<IndicateurBlock[]>(() => {
    if (bal.length === 0) return [];
    return [
      buildBfr(bal),
      buildDrfn(bal),
      buildCaf(bal),
      buildTmcap(bal),
      buildTmnr(bal),
    ];
  }, [bal]);

  if (bal.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          <Database className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Aucune balance importée pour ce périmètre.
          <br />
          Importez la balance générale (ECBU) pour visualiser le détail des comptes par indicateur.
        </CardContent>
      </Card>
    );
  }

  const filterRows = (rows: CompteRow[]) => {
    return rows.filter(r => {
      if (filter === 'inclus' && r.inclusion !== 'inclus') return false;
      if (filter === 'exclus' && r.inclusion !== 'exclu') return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.compte.toLowerCase().includes(s) && !r.intitule.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  };

  const INDIC_OPTIONS: { id: IndicId; label: string; sub?: string }[] = [
    { id: 'tous',  label: 'Tous',     sub: '5 indicateurs' },
    { id: 'bfr',   label: 'BFR',      sub: 'Besoin Fonds Roul.' },
    { id: 'drfn',  label: 'DRFN',     sub: 'Dép. réelles fonct.' },
    { id: 'caf',   label: 'CAF/IAF',  sub: 'Autofinancement' },
    { id: 'tmcap', label: 'TMcap',    sub: 'Charges à payer' },
    { id: 'tmnr',  label: 'TMnr',     sub: 'Non-recouvrement' },
  ];

  const visibleBlocks = selectedIndic === 'tous'
    ? blocks
    : blocks.filter(b => b.id === selectedIndic);

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Détail des comptes par indicateur M9-6
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            Pour chaque indicateur réglementaire, cette vue détaille la liste exhaustive des comptes
            <strong className="text-foreground"> inclus</strong> et <strong className="text-foreground">exclus</strong> du calcul,
            les montants agrégés utilisés (numérateur / dénominateur) et la formule M9-6 appliquée.
          </p>
          <p>
            Source : balance certifiée du périmètre <Badge variant="outline" className="text-[10px] mx-1">{activeBudget}</Badge>
            ({bal.filter(b => !b.isAggregate).length} comptes de détail · {sdeRows.length} lignes SDE · {sdrRows.length} lignes SDR).
          </p>
        </CardContent>
      </Card>

      {/* Sélecteur d'indicateur (pilules) ─────────────────────── */}
      <Card className="border-primary/20">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Indicateur affiché
            </span>
            {selectedIndic !== 'tous' && (
              <Badge variant="outline" className="text-[10px] ml-auto">
                Vue dédiée — un seul indicateur
              </Badge>
            )}
          </div>
          <div
            role="tablist"
            aria-label="Sélecteur d'indicateur M9-6"
            className="flex flex-wrap gap-1.5"
          >
            {INDIC_OPTIONS.map(opt => {
              const active = selectedIndic === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedIndic(opt.id)}
                  className={`flex flex-col items-start px-3 py-1.5 rounded-md border text-left transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted/60 border-border text-foreground'
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">{opt.label}</span>
                  {opt.sub && (
                    <span className={`text-[10px] leading-tight ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {opt.sub}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtres globaux */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtrer</span>
          </div>
          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
            {(['tous', 'inclus', 'exclus'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'tous' ? 'Tous' : f === 'inclus' ? 'Inclus uniquement' : 'Exclus uniquement'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un compte ou un libellé…"
              className="h-8 pl-7 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloc(s) indicateur(s) — selon sélecteur */}
      <div className="space-y-6">
        {visibleBlocks.map(block => {
          const visibleRows = filterRows(block.rows);
          const inclus = block.rows.filter(r => r.inclusion === 'inclus').length;
          const exclus = block.rows.filter(r => r.inclusion === 'exclu').length;
          const totalSigne = block.rows
            .filter(r => r.inclusion === 'inclus')
            .reduce((s, r) => s + r.montant * r.signe, 0);

          return (
            <div key={block.id} className="space-y-3">
              {/* Bloc résumé */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{block.titre}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{block.ref}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-md border border-border bg-muted/30">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Résultat indicateur</div>
                      <div className="text-lg font-mono font-bold text-primary mt-1">
                        {block.unite === 'pct' ? `${block.resultat.toFixed(2)} %` : formatEur(block.resultat)}
                      </div>
                    </div>
                    <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Comptes inclus
                      </div>
                      <div className="text-lg font-mono font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                        {inclus}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Σ contributions signées : <span className="font-mono">{formatEur(totalSigne)}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-destructive" /> Comptes exclus
                      </div>
                      <div className="text-lg font-mono font-bold mt-1 text-destructive">{exclus}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Listés ci-dessous avec motif</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Formule appliquée
                    </div>
                    <code className="text-xs font-mono text-foreground">{block.formule}</code>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Règles</div>
                    <ul className="text-xs space-y-1 list-disc list-inside text-foreground">
                      {block.regles.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Table de détail */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Détail des comptes ({visibleRows.length} / {block.rows.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[480px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-[110px]">Compte</TableHead>
                          <TableHead>Intitulé</TableHead>
                          <TableHead className="w-[110px]">Statut</TableHead>
                          <TableHead className="w-[140px]">Type montant</TableHead>
                          <TableHead className="w-[140px] text-right">Montant</TableHead>
                          <TableHead className="w-[60px] text-center">Signe</TableHead>
                          <TableHead>Raison</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                              Aucun compte ne correspond aux filtres.
                            </TableCell>
                          </TableRow>
                        ) : visibleRows.map((r, i) => (
                          <TableRow key={`${r.compte}-${i}`} className={r.inclusion === 'exclu' ? 'opacity-70' : ''}>
                            <TableCell className="font-mono text-xs">{r.compte}</TableCell>
                            <TableCell className="text-xs">{r.intitule}</TableCell>
                            <TableCell>
                              {r.inclusion === 'inclus' ? (
                                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 text-[10px]">Inclus</Badge>
                              ) : (
                                <Badge variant="outline" className="text-destructive border-destructive/40 text-[10px]">Exclu</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground">{r.montantLabel}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{formatEur(r.montant)}</TableCell>
                            <TableCell className="text-center text-xs font-bold">{r.signe > 0 ? '+' : '−'}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground">{r.raison}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DetailComptesIndicateursSection;