// Page de garde tricolore style magazine institutionnel
// Format A4 paysage — destinée au print/PDF
interface MagazineCoverProps {
  etabNom: string;
  exercice: number;
  uai: string;
  commune?: string;
  academie?: string;
  resultatComptable?: number;
  fdr?: number;
  treso?: number;
  signataireOrdo?: string;
  signataireAC?: string;
}

const fmtEur = (n?: number) =>
  n === undefined ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function MagazineCoverPDF({
  etabNom, exercice, uai, commune, academie,
  resultatComptable, fdr, treso, signataireOrdo, signataireAC,
}: MagazineCoverProps) {
  return (
    <div className="page-de-garde-magazine relative w-full" style={{ aspectRatio: '297/210', pageBreakAfter: 'always' }}>
      {/* Bandeau tricolore en tête */}
      <div className="absolute top-0 inset-x-0 flex h-3">
        <div className="flex-1" style={{ background: '#002395' }} />
        <div className="flex-1" style={{ background: 'white' }} />
        <div className="flex-1" style={{ background: '#ED2939' }} />
      </div>

      {/* Bandeau tricolore en pied */}
      <div className="absolute bottom-0 inset-x-0 flex h-3">
        <div className="flex-1" style={{ background: '#002395' }} />
        <div className="flex-1" style={{ background: 'white' }} />
        <div className="flex-1" style={{ background: '#ED2939' }} />
      </div>

      {/* Filets décoratifs verticaux */}
      <div className="absolute left-12 top-12 bottom-12 w-px bg-gray-300" />
      <div className="absolute right-12 top-12 bottom-12 w-px bg-gray-300" />

      <div className="relative h-full px-20 py-16 flex flex-col justify-between">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gray-500 font-bold mb-2">
              République Française · Éducation Nationale
            </div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gray-700 font-semibold">
              {academie ? `Académie de ${academie}` : 'Académie'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gray-500">Exercice</div>
            <div className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{exercice}</div>
          </div>
        </div>

        {/* Bloc titre central */}
        <div className="text-center space-y-6">
          <div className="text-xs tracking-[0.5em] uppercase text-gray-500 font-bold">
            Compte Financier
          </div>

          <div className="space-y-3">
            <h1
              className="text-6xl font-light text-gray-900 leading-tight"
              style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
            >
              {etabNom}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span className="font-mono tracking-wider">RNE {uai}</span>
              {commune && <><span className="text-gray-300">·</span><span>{commune}</span></>}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-4">
            <div className="h-px w-16 bg-gray-400" />
            <div className="text-[10px] tracking-[0.4em] uppercase text-gray-500">
              Rapport intégral · Ordonnateur & Agent Comptable
            </div>
            <div className="h-px w-16 bg-gray-400" />
          </div>
        </div>

        {/* KPI résumé */}
        <div className="grid grid-cols-3 gap-8 pt-6 border-t border-gray-200">
          {[
            { label: 'Résultat de l\'exercice', value: fmtEur(resultatComptable), color: (resultatComptable ?? 0) >= 0 ? '#0a7a3b' : '#c8102e' },
            { label: 'Fonds de roulement', value: fmtEur(fdr), color: '#002395' },
            { label: 'Trésorerie', value: fmtEur(treso), color: '#0a7a3b' },
          ].map((kpi) => (
            <div key={kpi.label} className="text-center">
              <div className="text-[9px] tracking-[0.3em] uppercase text-gray-500 font-bold mb-2">
                {kpi.label}
              </div>
              <div
                className="text-2xl font-light tabular-nums"
                style={{ color: kpi.color, fontFamily: 'Georgia, serif' }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Pied — signataires */}
        <div className="grid grid-cols-2 gap-12 text-xs text-gray-600">
          <div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-gray-500 font-bold mb-1">Ordonnateur</div>
            <div className="font-semibold text-gray-800">{signataireOrdo || '—'}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-[0.3em] uppercase text-gray-500 font-bold mb-1">Agent Comptable</div>
            <div className="font-semibold text-gray-800">{signataireAC || '—'}</div>
          </div>
        </div>

        {/* Mention légale */}
        <div className="absolute bottom-8 inset-x-0 text-center text-[9px] text-gray-400 tracking-wider">
          Conforme M9-6 2026 · Décret 2012-1246 · Code de l'Éducation · Édité le {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
}
