// Navigation latérale COFI ORDO — 4 sections repliables (A,B,C,D)
import { useState } from 'react';
import { ChevronDown, ChevronRight, LayoutGrid, FileText, BookOpen } from 'lucide-react';
import { ORDO_SECTIONS, getFichesBySection } from './catalog';
import { cn } from '@/lib/utils';

export type OrdoViewMode = 'mosaique' | 'fiche' | 'narration';

interface Props {
  view: OrdoViewMode;
  onChangeView: (v: OrdoViewMode) => void;
  activeFicheId: string;
  onSelect: (id: string) => void;
}

export function OrdoNavigation({ view, onChangeView, activeFicheId, onSelect }: Props) {
  const initialOpen = ORDO_SECTIONS.reduce((acc, s) => {
    acc[s.key] = getFichesBySection(s.key).some(f => f.id === activeFicheId) || s.key === 'A';
    return acc;
  }, {} as Record<string, boolean>);
  const [open, setOpen] = useState(initialOpen);

  const modes: { key: OrdoViewMode; label: string; icon: any }[] = [
    { key: 'mosaique', label: 'Mosaïque', icon: LayoutGrid },
    { key: 'fiche',    label: 'Fiches',   icon: FileText },
    { key: 'narration', label: 'Narration', icon: BookOpen },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-card border border-border rounded-xl p-3 space-y-2 no-print">
      <div className="px-2 pb-2 mb-1 border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">COFI ORDO</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Compte Financier · Sphère Ordonnateur · M9-6</p>
      </div>

      {/* Sélecteur de mode */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted/40">
        {modes.map(m => {
          const Icon = m.icon;
          const active = view === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onChangeView(m.key)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-md text-[10px] font-bold transition',
                active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {view === 'fiche' && (
        <div className="space-y-1">
          {ORDO_SECTIONS.map(section => {
            const fiches = getFichesBySection(section.key);
            const isOpen = open[section.key];
            const sectionActive = fiches.some(f => f.id === activeFicheId);
            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => setOpen(o => ({ ...o, [section.key]: !o[section.key] }))}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-xs font-bold transition',
                    sectionActive ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted/50'
                  )}
                >
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <span className="flex-1">{section.label}</span>
                  <span className="text-[10px] text-muted-foreground">{fiches.length}</span>
                </button>
                {isOpen && (
                  <ul className="mt-1 mb-2 ml-3 pl-3 border-l border-border space-y-0.5">
                    <li className="text-[10px] text-muted-foreground italic px-2 py-1">{section.subtitle}</li>
                    {fiches.map(f => {
                      const active = f.id === activeFicheId;
                      return (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(f.id)}
                            className={cn(
                              'w-full text-left text-xs px-2 py-1.5 rounded transition flex items-center gap-2',
                              active ? 'bg-primary text-primary-foreground font-semibold'
                                     : 'text-foreground hover:bg-muted/50'
                            )}
                          >
                            <span className={cn(
                              'font-mono text-[10px] px-1.5 py-0.5 rounded',
                              active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                            )}>{f.numero}</span>
                            <span className="flex-1 truncate">{f.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view !== 'fiche' && (
        <div className="text-[11px] text-muted-foreground italic px-2 py-3 leading-relaxed">
          {view === 'mosaique'
            ? "Vue d'ensemble interactive : cliquez sur une carte pour ouvrir la fiche correspondante."
            : "Mode rédacteur : un éditeur par section, avec assistance IA en marge pour fluidifier la prose."}
        </div>
      )}
    </aside>
  );
}