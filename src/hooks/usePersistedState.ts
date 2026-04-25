import { useEffect, useRef, useState } from "react";

/**
 * État synchronisé avec l'URL (search params) et le localStorage.
 * Priorité de lecture initiale : URL > localStorage > defaultValue.
 * Sérialisation JSON ; si parse échoue → defaultValue.
 *
 * Utilisé pour rendre les filtres "ré-ouvrables" : on retombe sur le même
 * écran après refresh/partage de lien, mais on peut aussi reset via Réinitialiser.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: { urlParam?: string; storage?: "local" | "session" | "none" } = {},
): [T, (v: T | ((prev: T) => T)) => void] {
  const { urlParam, storage = "local" } = options;

  const read = (): T => {
    if (typeof window === "undefined") return defaultValue;
    // 1. URL
    if (urlParam) {
      const u = new URL(window.location.href);
      const raw = u.searchParams.get(urlParam);
      if (raw !== null) {
        try { return JSON.parse(raw) as T; } catch { /* fall through */ }
        // valeurs scalaires non-JSON (ex. "all", "SG") : on accepte la string brute si T est string
        return raw as unknown as T;
      }
    }
    // 2. storage
    if (storage !== "none") {
      const store = storage === "local" ? window.localStorage : window.sessionStorage;
      const raw = store.getItem(key);
      if (raw !== null) {
        try { return JSON.parse(raw) as T; } catch { /* ignore */ }
      }
    }
    return defaultValue;
  };

  const [value, setValue] = useState<T>(read);
  const isFirst = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // storage
    if (storage !== "none") {
      const store = storage === "local" ? window.localStorage : window.sessionStorage;
      try { store.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
    }
    // URL — on ne touche pas l'URL au tout premier render pour éviter de polluer
    // l'historique si la valeur est le défaut. On le fait dès la 1re modification.
    if (urlParam) {
      const u = new URL(window.location.href);
      const isDefault = JSON.stringify(value) === JSON.stringify(defaultValue);
      if (isDefault) {
        u.searchParams.delete(urlParam);
      } else {
        const serial = typeof value === "string" ? value : JSON.stringify(value);
        u.searchParams.set(urlParam, serial);
      }
      // pas d'historique : replaceState
      if (!isFirst.current) {
        window.history.replaceState({}, "", u.toString());
      }
    }
    isFirst.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return [value, setValue];
}
