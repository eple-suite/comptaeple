import { usePersistedText } from '@/hooks/usePersistedState';
import { Card, CardContent } from '@/components/ui/card';
import { useOrdoData } from './useOrdoData';
import { CommentaireBox, SectionTitre } from './OrdoCommentaireBox';
import { KPICard, EmptyState } from '../SharedComponents';
import { formatEur } from '@/lib/cofieple_calculations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, PieChart, Pie } from 'recharts';

export function OrdoS6SRH() {
  const { etab, R, safe, pKey, ind } = useOrdoData();
  const [commentaire, setCommentaire, status, lastSaved] = usePersistedText(`${pKey}_com_srh`, '');

  if (!R) return <EmptyState msg="Données requises pour le SRH." />;

  const domaines = R.domaines ?? {};
  const srhDomaine = Object.values(domaines).find(d => d.code === '5');
  const srhRecettes = srhDomaine?.produitsReel ?? 0;
  const srhDepenses = srhDomaine?.chargesReel ?? 0;
  const srhSolde = srhRecettes - srhDepenses;
  const hasSRHData = !!srhDomaine || (ind && ind.nb_repas_servis > 0);

  if (!hasSRHData) return (
    <Card><CardContent className="p-6">
      <SectionTitre numero="S6" title="Service de restauration et hébergement (SRH)" />
      <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        ℹ️ Aucune donnée SRH détectée. Si l'établissement dispose d'un SRH, renseignez les indicateurs dans l'onglet <strong>Indicateurs</strong>.
      </div>
    </CardContent></Card>
  );

  const srhChartData = [
    { name: 'Charges', value: srhDepenses, fill: 'hsl(38,92%,50%)' },
    { name: 'Produits', value: srhRecettes, fill: 'hsl(160,45%,45%)' },
    { name: 'Solde', value: srhSolde, fill: srhSolde >= 0 ? 'hsl(160,45%,45%)' : 'hsl(0,72%,55%)' },
  ];

  // Ventilation charges SRH approximative
  const denrees = R.chargesNature?.['60'] ?? 0;
  const farpi = srhDepenses * 0.11; // approx FARPI
  const fcsh = srhDepenses * 0.0125; // approx FCSH
  const autresSRH = Math.max(0, srhDepenses - denrees - farpi - fcsh);
  const ventilCharges = [
    { name: 'Denrées', value: denrees, fill: 'hsl(38,92%,50%)' },
    { name: 'FARPI (11%)', value: farpi, fill: 'hsl(215,70%,50%)' },
    { name: 'FCSH (1,25%)', value: fcsh, fill: 'hsl(280,50%,50%)' },
    { name: 'Autres', value: autresSRH, fill: 'hsl(var(--muted))' },
  ].filter(d => d.value > 10);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionTitre numero="S6" title="Service de restauration et hébergement (SRH)" />

        {/* KPI SRH */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ind && ind.nb_repas_servis > 0 && (
            <KPICard label="Repas servis / an" value={ind.nb_repas_servis.toLocaleString('fr-FR')} color="blue" icon="🍽️" />
          )}
          {ind?.taux_occupation_internat && (
            <KPICard label="Taux occupation" value={`${ind.taux_occupation_internat.toFixed(1)} %`} color={ind.taux_occupation_internat >= 80 ? 'green' : 'amber'} icon="🏠" />
          )}
          {ind?.cout_denrees_repas && ind.cout_denrees_repas > 0 && (
            <KPICard label="Coût moyen / repas" value={`${ind.cout_denrees_repas.toFixed(2)} €`} color="amber" icon="🥘" />
          )}
          <KPICard label="Résultat SRH" value={formatEur(srhSolde)} color={srhSolde >= 0 ? 'green' : 'red'} icon={srhSolde >= 0 ? '✅' : '⚠️'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2">📊 Exécution SRH</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={srhChartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar isAnimationActive={false} dataKey="value" radius={[3, 3, 0, 0]}>
                  {srhChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {ventilCharges.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">🥧 Ventilation charges SRH</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie isAnimationActive={false} data={ventilCharges} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={9}>
                    {ventilCharges.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatEur(v), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted/10 rounded p-3">
          💡 <strong>Pour le CA :</strong> Le SRH doit être équilibré. Un excédent est affecté aux réserves SRH (c/106870). Un déficit chronique nécessite une révision des tarifs.
        </div>

        <CommentaireBox label="Analyse du service restauration" value={commentaire} onChange={setCommentaire} status={status} lastSaved={lastSaved} />
      </CardContent>
    </Card>
  );
}
