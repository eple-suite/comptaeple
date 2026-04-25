import { useEffect, useRef, useState } from "react";
import { store } from "@/store/persistentStore";

/* ═══════════════════════════════════════════════════════════════════════════
 *  usePersistedText — utilisé partout dans le module Cofieple/Ordo
 *  Signature : [value, setValue, status, lastSaved]
 *  Persistance via le store applicatif (localStorage avec préfixe versionné)
 * ═══════════════════════════════════════════════════════════════════════════ */

export type SaveStatus = "saving" | "saved";

export function usePersistedText(
  key: string,
  defaultValue: string,
): [string, (v: string) => void, SaveStatus, Date | null] {
  const [value, setValueState] = useState<string>(() => store.get<string>(key, defaultValue));
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(() => store.getLastSaved(key));
  const timer = useRef<number | null>(null);

  const setValue = (v: string) => {
    setValueState(v);
    setStatus("saving");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        store.set(key, v);
        setStatus("saved");
        setLastSaved(new Date());
      } catch (e) {
        console.error(`[usePersistedText] échec sauvegarde "${key}"`, e);
        setStatus("saved");
      }
    }, 400);
  };

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return [value, setValue, status, lastSaved];
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Helpers Cofieple — détection / purge des données persistées
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Indique si l'utilisateur a au moins une donnée persistée (commentaires, narrations…). */
export function hasCofieplePersistedData(): boolean {
  try {
    return store.getAllKeys().length > 0;
  } catch {
    return false;
  }
}

/** Purge totale des données persistées de l'application. À utiliser via un bouton de réinitialisation. */
export function clearAllCofiepleData(): void {
  try {
    store.getAllKeys().forEach((k) => store.delete(k));
  } catch (e) {
    console.error("[clearAllCofiepleData] échec", e);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  usePersistedState — hook générique URL + storage (filtres, vues…)
 *  Priorité de lecture : URL > storage > defaultValue
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface UsePersistedStateOptions {
  /** Si fourni, l'état est synchronisé avec ce paramètre dans l'URL (replaceState). */
  urlParam?: string;
  /** localStorage (défaut), sessionStorage ou désactivé. */
  storage?: "local" | "session" | "none";
  /** Préfixe appliqué à la clé storage pour éviter les collisions inter-modules. */
  storagePrefix?: string;
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistedStateOptions = {},
): [T, (v: T | ((prev: T) => T)) => void] {
  const { urlParam, storage = "local", storagePrefix = "ui_filter_" } = options;
  const fullKey = storagePrefix + key;

  const read = (): T => {
    if (typeof window === "undefined") return defaultValue;
    if (urlParam) {
      const u = new URL(window.location.href);
      const raw = u.searchParams.get(urlParam);
      if (raw !== null) {
        try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
      }
    }
    if (storage !== "none") {
      const s = storage === "local" ? window.localStorage : window.sessionStorage;
      const raw = s.getItem(fullKey);
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
    if (storage !== "none") {
      const s = storage === "local" ? window.localStorage : window.sessionStorage;
      try { s.setItem(fullKey, JSON.stringify(value)); } catch { /* quota */ }
    }
    if (urlParam) {
      const u = new URL(window.location.href);
      const isDefault = JSON.stringify(value) === JSON.stringify(defaultValue);
      if (isDefault) u.searchParams.delete(urlParam);
      else u.searchParams.set(urlParam, typeof value === "string" ? (value as unknown as string) : JSON.stringify(value));
      if (!isFirst.current) window.history.replaceState({}, "", u.toString());
    }
    isFirst.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return [value, setValue];
}
