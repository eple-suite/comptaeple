// ═══════════════════════════════════════════════════════════════
// CARTOGRAPHIE DES SOLDES — Treemap hiérarchique premium
// Classe → Sous-classe (2 chiffres) → Compte (3+ chiffres)
// Palette par classe comptable M9-6 + filtres + tooltip riche + export PNG
// ═══════════════════════════════════════════════════════════════

import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Treemap, ResponsiveContainer, Tooltip as RTooltip } from 'recharts';
import { Download, Eye, EyeOff, Filter, Map } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';

// ─── Palette HSL par classe comptable (cahier des charges) ───────
const CLASSE_PALETTE: Record<string, { name: string; main: string; light: string; dark: string }> = {
  '1': { name: 'Capitaux',         main: 'hsl(248, 55%, 50%)', light: 'hsl(248, 60%, 70%)', dark: 'hsl(248, 60%, 35%)' }, // indigo/violet
  '2': { name: 'Immobilisations',  main: 'hsl(220, 70%, 30%)', light: 'hsl(220, 60%, 50%)', dark: 'hsl(220, 80%, 20%)' }, // bleu marine
  '3': { name: 'Stocks',           main: 'hsl(38, 92%, 50%)',  light: 'hsl(38, 95%, 65%)',  dark: 'hsl(35, 85%, 38%)'  }, // ambre
  '4': { name: 'Tiers',            main: 'hsl(330, 70%, 55%)', light: 'hsl(330, 75%, 70%)', dark: 'hsl(330, 70%, 40%)' }, // rose / magenta
  '5': { name: 'Financier',        main: 'hsl(160, 65%, 40%)', light: 'hsl(160, 60%, 55%)', dark: 'hsl(160, 70%, 28%)' }, // vert émeraude
  '6': { name: 'Charges',          main: 'hsl(8, 75%, 55%)',   light: 'hsl(8, 80%, 70%)',   dark: 'hsl(8, 70%, 42%)'   }, // rouge / corail
  '7': { name: 'Produits',         main: 'hsl(180, 65%, 42%)', light: 'hsl(180, 60%, 58%)', dark: 'hsl(180, 70%, 30%)' }, // turquoise
};

// ─── Détection du service à partir du compte (heuristique M9-6) ──
// Les services apparaissent dans le code analytique (CRB) — sur la balance pure
// on ne peut détecter que certains comptes typés (ex : 7067x = SRH, 6011x = AP, etc.)
// On fournit un filtre "Service" basé sur ces conventions.
function detectService(compte: string): string {
  if (!compte) return 'NC';
  const c = compte.replace(/\s/g, '');
  if (c.startsWith('7067') || c.startsWith('6011') || c.startsWith('6012')) return 'SRH';
  if (c.startsWith('706') || c.startsWith('708')) return 'VE';
  if (c.startsWith('60') || c.startsWith('61') || c.startsWith('615')) return 'ALO';
  if (c.startsWith('64')) return 'ALO';
  if (c.startsWith('74')) return 'AP';
  if (c.startsWith('65') || c.startsWith('658')) return 'OPC';
  return 'AP'; // défaut pour le service général
}

const SERVICES = ['AP', 'VE', 'ALO', 'SRH', 'OPC', 'NC'] as const;

// ─── Format français ─────────────────────────────────────────────
function fmtEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
  }).format(n || 0);
}
function fmtPct(n: number): string {
  if (!isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)} %`;
}

// ─── Types ───────────────────────────────────────────────────────
export interface CartoBalanceLigne {
  compte: string;
  intituleReduit?: string;
  solDbt?: number;
  solCrd?: number;
}

interface Props {
  balanceN: CartoBalanceLigne[];
  balanceN1?: CartoBalanceLigne[];
}

// ─── Construction de la hiérarchie ───────────────────────────────
interface LeafNode {
  name: string;       // "Compte 421 — Personnel"
  size: number;       // |solde|
  classe: string;
  sousClasse: string;
  compte3: string;
  compteFull: string;
  libelle: string;
  solDbt: number;
  solCrd: number;
  solde: number;      // solDbt - solCrd
  service: string;
  variationEur: number;
  variationPct: number;
  fill: string;
}

function buildHierarchy(
  N: CartoBalanceLigne[],
  N1: CartoBalanceLigne[],
  hiddenClasses: Set<string>,
  serviceFilter: 'all' | typeof SERVICES[number],
): { tree: any; leaves: LeafNode[]; totalsByClass: Record<string, number> } {
  // Index N-1 par compte
  const idxN1 = new Map<string, number>();
  for (const r of N1 || []) {
    const c = (r.compte || '').replace(/\s/g, '');
    if (!c) continue;
    const solde = (r.solDbt || 0) - (r.solCrd || 0);
    idxN1.set(c, (idxN1.get(c) || 0) + solde);
  }

  // Agrégation par compte 3 chiffres (niveau feuille du treemap)
  const agg = new Map<string, LeafNode>();

  for (const r of N) {
    const compte = (r.compte || '').replace(/\s/g, '');
    if (!compte || compte.length < 1) continue;
    const classe = compte[0];
    if (!CLASSE_PALETTE[classe]) continue;
    if (hiddenClasses.has(classe)) continue;

    const service = detectService(compte);
    if (serviceFilter !== 'all' && service !== serviceFilter) continue;

    const sousClasse = compte.length >= 2 ? compte.slice(0, 2) : classe;
    const compte3 = compte.length >= 3 ? compte.slice(0, 3) : sousClasse;

    const solDbt = r.solDbt || 0;
    const solCrd = r.solCrd || 0;
    const solde = solDbt - solCrd;

    const key = compte3;
    const existing = agg.get(key);
    if (existing) {
      existing.solDbt += solDbt;
      existing.solCrd += solCrd;
      existing.solde += solde;
      existing.size = Math.abs(existing.solde);
      // libellé : conserver le plus court / premier
      if (r.intituleReduit && existing.libelle.length > r.intituleReduit.length) {
        existing.libelle = r.intituleReduit;
      }
    } else {
      agg.set(key, {
        name: `${compte3} — ${r.intituleReduit || ''}`.trim(),
        size: Math.abs(solde),
        classe,
        sousClasse,
        compte3,
        compteFull: compte,
        libelle: r.intituleReduit || '',
        solDbt, solCrd, solde,
        service,
        variationEur: 0,
        variationPct: 0,
        fill: CLASSE_PALETTE[classe].main,
      });
    }
  }

  // Calcul variation N/N-1 (somme des comptes commençant par compte3)
  for (const leaf of agg.values()) {
    let solN1 = 0;
    for (const [k, v] of idxN1) {
      if (k.startsWith(leaf.compte3)) solN1 += v;
    }
    leaf.variationEur = leaf.solde - solN1;
    leaf.variationPct = solN1 !== 0 ? ((leaf.solde - solN1) / Math.abs(solN1)) * 100 : 0;
  }

  const leaves = Array.from(agg.values()).filter(l => l.size > 0);

  // Group by classe → sous-classe → compte
  const totalsByClass: Record<string, number> = {};
  const byClass = new Map<string, Map<string, LeafNode[]>>();
  for (const l of leaves) {
    if (!byClass.has(l.classe)) byClass.set(l.classe, new Map());
    const cMap = byClass.get(l.classe)!;
    if (!cMap.has(l.sousClasse)) cMap.set(l.sousClasse, []);
    cMap.get(l.sousClasse)!.push(l);
    totalsByClass[l.classe] = (totalsByClass[l.classe] || 0) + l.size;
  }

  const tree = {
    name: 'Balance',
    children: Array.from(byClass.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([classe, cMap]) => ({
        name: `Classe ${classe} — ${CLASSE_PALETTE[classe].name}`,
        classe,
        children: Array.from(cMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([sc, items]) => ({
            name: `${sc}xx`,
            classe,
            sousClasse: sc,
            children: items.map(it => ({
              name: it.name,
              size: it.size,
              ...it,
            })),
          })),
      })),
  };

  return { tree, leaves, totalsByClass };
}

// ─── Custom Treemap content (couleur par classe + dégradé sous-classe) ──
const CustomCell = (props: any) => {
  const { x, y, width, height, depth, classe, sousClasse, name, size } = props;
  if (depth === 0) return null;
  const palette = CLASSE_PALETTE[classe];
  if (!palette) return null;

  // Profondeur 1 = classe (juste un cadre), 2 = sous-classe, 3 = compte (feuille)
  let fill = palette.main;
  if (depth === 2) fill = palette.dark;
  if (depth === 3) {
    // Variation de luminosité par sous-classe pour distinguer
    const sc = parseInt(sousClasse || '0', 10);
    const lightShift = (sc % 5) * 4; // 0, 4, 8, 12, 16
    fill = palette.main.replace(/(\d+)%\)$/, (_, l) => `${Math.min(75, parseInt(l) + lightShift)}%)`);
  }

  const showLabel = width > 70 && height > 28;
  const showSize = width > 90 && height > 50 && depth === 3;

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        style={{
          fill,
          stroke: 'hsl(0, 0%, 100%)',
          strokeWidth: depth === 1 ? 3 : depth === 2 ? 2 : 1,
          strokeOpacity: 0.85,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
      />
      {showLabel && (
        <text
          x={x + 6} y={y + 16}
          fill="hsl(0, 0%, 100%)"
          fontSize={depth === 1 ? 13 : depth === 2 ? 11 : 10}
          fontWeight={depth === 1 ? 700 : depth === 2 ? 600 : 500}
          style={{ pointerEvents: 'none' }}
        >
          {name.length > Math.floor(width / 6) ? name.slice(0, Math.floor(width / 6) - 1) + '…' : name}
        </text>
      )}
      {showSize && (
        <text
          x={x + 6} y={y + 32}
          fill="hsl(0, 0%, 100%)"
          fontSize={10} fontWeight={400} opacity={0.92}
          style={{ pointerEvents: 'none' }}
        >
          {fmtEUR(size)}
        </text>
      )}
    </g>
  );
};

// ─── Tooltip riche ───────────────────────────────────────────────
const RichTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  if (!d || d.depth !== 3) return null;
  const palette = CLASSE_PALETTE[d.classe];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-xl text-xs min-w-[260px]">
      <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b">
        <span
          className="inline-block w-3 h-3 rounded-sm"
          style={{ background: palette?.main }}
        />
        <span className="font-semibold">Classe {d.classe} · {palette?.name}</span>
      </div>
      <div className="font-bold text-sm mb-1">{d.compteFull}</div>
      <div className="text-muted-foreground mb-2">{d.libelle || '—'}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-muted-foreground">Solde débiteur</span>
        <span className="font-mono text-right">{fmtEUR(d.solDbt)}</span>
        <span className="text-muted-foreground">Solde créditeur</span>
        <span className="font-mono text-right">{fmtEUR(d.solCrd)}</span>
        <span className="text-muted-foreground font-semibold">Solde net</span>
        <span className="font-mono font-semibold text-right">{fmtEUR(d.solde)}</span>
      </div>
      <div className="mt-2 pt-1.5 border-t grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-muted-foreground">Variation N/N-1</span>
        <span className={cn(
          'font-mono text-right font-semibold',
          d.variationEur > 0 ? 'text-emerald-600' : d.variationEur < 0 ? 'text-rose-600' : '',
        )}>{fmtEUR(d.variationEur)}</span>
        <span className="text-muted-foreground">Variation %</span>
        <span className={cn(
          'font-mono text-right font-semibold',
          d.variationEur > 0 ? 'text-emerald-600' : d.variationEur < 0 ? 'text-rose-600' : '',
        )}>{fmtPct(d.variationPct)}</span>
      </div>
      {d.service && d.service !== 'NC' && (
        <div className="mt-2 pt-1.5 border-t text-[10px] text-muted-foreground">
          Service estimé : <strong className="text-foreground">{d.service}</strong>
        </div>
      )}
    </div>
  );
};

// ─── Composant principal ─────────────────────────────────────────
export function CartographieSoldes({ balanceN, balanceN1 = [] }: Props) {
  const [hiddenClasses, setHiddenClasses] = useState<Set<string>>(new Set());
  const [serviceFilter, setServiceFilter] = useState<'all' | typeof SERVICES[number]>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const { tree, leaves, totalsByClass } = useMemo(
    () => buildHierarchy(balanceN, balanceN1, hiddenClasses, serviceFilter),
    [balanceN, balanceN1, hiddenClasses, serviceFilter],
  );

  const totalCarto = leaves.reduce((s, l) => s + l.size, 0);

  const toggleClass = (c: string) => {
    setHiddenClasses(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const exportPNG = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `cartographie_soldes_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error('Export PNG failed', e); }
  };

  if (leaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-5 w-5 text-primary" /> Cartographie des soldes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune donnée de balance disponible pour l'instant. Importez une balance pour visualiser la cartographie.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-5 w-5 text-primary" />
              Cartographie hiérarchique des soldes
              <Badge variant="outline" className="ml-1 text-[10px] font-mono">M9-6 · Treemap</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Classe → sous-classe → compte. Taille proportionnelle au |solde|. Total cartographié :{' '}
              <strong className="text-foreground">{fmtEUR(totalCarto)}</strong> · {leaves.length} comptes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filtre service */}
            <div className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <select
                className="bg-transparent outline-none cursor-pointer"
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value as any)}
              >
                <option value="all">Tous services</option>
                {SERVICES.map(s => <option key={s} value={s}>Service {s}</option>)}
              </select>
            </div>
            <Button size="sm" variant="outline" onClick={exportPNG}>
              <Download className="h-3.5 w-3.5 mr-1" /> PNG
            </Button>
          </div>
        </div>

        {/* Légende cliquable par classe */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(CLASSE_PALETTE).map(([c, p]) => {
            const isHidden = hiddenClasses.has(c);
            const total = totalsByClass[c] || 0;
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleClass(c)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all',
                  'hover:scale-105 hover:shadow-sm',
                  isHidden ? 'opacity-40 grayscale' : '',
                )}
                style={{ borderColor: p.main, background: `${p.main}15` }}
              >
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: p.main }}
                />
                <span className="font-semibold">Cl.{c}</span>
                <span className="text-muted-foreground">{p.name}</span>
                {total > 0 && !isHidden && (
                  <span className="font-mono text-[10px] text-foreground/70">{fmtEUR(total)}</span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="bg-background rounded-lg p-2">
          <ResponsiveContainer width="100%" height={520}>
            <Treemap
              data={tree.children}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(0, 0%, 100%)"
              content={<CustomCell />}
              animationDuration={400}
            >
              <RTooltip content={<RichTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Survolez un compte pour voir le détail (débit/crédit/solde, variation N/N-1).
          Cliquez sur la légende pour masquer/afficher une classe.
        </p>
      </CardContent>
    </Card>
  );
}
