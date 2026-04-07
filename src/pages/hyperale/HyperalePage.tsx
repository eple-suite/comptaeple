import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Home, BarChart3, CalendarDays, Settings, Bot,
} from 'lucide-react';
import HyperaleAccueil from './HyperaleAccueil';
import HyperaleAnalyse from './HyperaleAnalyse';
import HyperaleJournal from './HyperaleJournal';
import HyperaleParametres from './HyperaleParametres';
import HyperaleAssistant from './HyperaleAssistant';

const NAV_ITEMS = [
  { path: '/hyperale', label: 'Accueil', icon: Home, end: true },
  { path: '/hyperale/analyse', label: 'Analyse', icon: BarChart3 },
  { path: '/hyperale/journal', label: 'Journal', icon: CalendarDays },
  { path: '/hyperale/parametres', label: 'Paramètres', icon: Settings },
  { path: '/hyperale/assistant', label: 'Assistant IA', icon: Bot },
];

export default function HyperalePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="space-y-0">
      {/* Module header */}
      <div className="bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/20 rounded-xl mb-4">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-2xl font-black text-primary-foreground shadow-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-wide">HYPER@LE</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">Analyse Financière Augmentée · EPLE</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path, item.end);
          return (
            <Button
              key={item.path}
              variant={active ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                'gap-1.5 text-xs font-semibold shrink-0 transition-all',
                active && 'shadow-md'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="pt-2">
        <Routes>
          <Route index element={<HyperaleAccueil />} />
          <Route path="analyse" element={<HyperaleAnalyse />} />
          <Route path="journal" element={<HyperaleJournal />} />
          <Route path="parametres" element={<HyperaleParametres />} />
          <Route path="assistant" element={<HyperaleAssistant />} />
        </Routes>
      </div>
    </div>
  );
}
