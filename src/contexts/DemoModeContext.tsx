// ════════════════════════════════════════════════════════════════
// Mode démonstration global — pour présentations (rectorat, etc.)
// Données fictives en mémoire, AUCUNE écriture en base.
// ════════════════════════════════════════════════════════════════
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "comptaeple_v1_demo_mode";

interface DemoModeContextValue {
  isDemoMode: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDemoMode) localStorage.setItem(STORAGE_KEY, "1");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [isDemoMode]);

  const enable = useCallback(() => setIsDemoMode(true), []);
  const disable = useCallback(() => setIsDemoMode(false), []);
  const toggle = useCallback(() => setIsDemoMode((v) => !v), []);

  const value = useMemo(
    () => ({ isDemoMode, enable, disable, toggle }),
    [isDemoMode, enable, disable, toggle],
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    // Fallback "off" pour permettre l'utilisation hors provider (tests, etc.)
    return {
      isDemoMode: false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}