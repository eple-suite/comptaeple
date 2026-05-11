import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home, BarChart3, CalendarDays, Settings, Bot, FileSpreadsheet, Zap, Trophy, BookOpen,
} from 'lucide-react';
import HyperaleAccueil from './HyperaleAccueil';
import HyperaleAnalyse from './HyperaleAnalyse';
import HyperaleJournal from './HyperaleJournal';
import HyperaleParametres from './HyperaleParametres';
import HyperaleAssistant from './HyperaleAssistant';
import HyperaleImport from './HyperaleImport';
import HyperaleVsIdeale from './HyperaleVsIdeale';
import HyperaleModeEmploi from './HyperaleModeEmploi';

const NAV_ITEMS = [
  { path: '/hyperale', label: 'Accueil', icon: Home, end: true },
  { path: '/hyperale/analyse', label: 'Analyse', icon: BarChart3 },
  { path: '/hyperale/journal', label: 'Journal', icon: CalendarDays },
  { path: '/hyperale/import', label: 'Import Op@le', icon: FileSpreadsheet },
  { path: '/hyperale/parametres', label: 'Paramètres', icon: Settings },
  { path: '/hyperale/assistant', label: 'Assistant IA', icon: Bot },
  { path: '/hyperale/vs-ideale', label: 'vs Ide@le', icon: Trophy },
  { path: '/hyperale/mode-emploi', label: 'Mode d\'emploi', icon: BookOpen },
];

export default function HyperalePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="space-y-4">
      {/* Module brand strip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-r from-primary/8 via-card to-secondary/5"
      >
        <div className="absolute inset-0 bg-grid opacity-[0.1] pointer-events-none" />
        <div className="relative px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold tracking-tight text-foreground leading-none">HYPER@LE</h1>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mt-0.5">Analyse financière augmentée</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
            Module premium
          </span>
        </div>
      </motion.div>

      {/* Premium tab navigation */}
      <nav className="relative flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item.path, item.end);
          const Icon = item.icon;
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all',
                active
                  ? 'bg-card border border-border/60 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
              {item.label}
              {active && (
                <motion.span
                  layoutId="hyperale-tab-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full gradient-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Animated content area */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
        className="pt-1"
      >
        <Routes>
          <Route index element={<HyperaleAccueil />} />
          <Route path="analyse" element={<HyperaleAnalyse />} />
          <Route path="journal" element={<HyperaleJournal />} />
          <Route path="import" element={<HyperaleImport />} />
          <Route path="parametres" element={<HyperaleParametres />} />
          <Route path="assistant" element={<HyperaleAssistant />} />
          <Route path="vs-ideale" element={<HyperaleVsIdeale />} />
          <Route path="mode-emploi" element={<HyperaleModeEmploi />} />
        </Routes>
      </motion.div>
    </div>
  );
}
