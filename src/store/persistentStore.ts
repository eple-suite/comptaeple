// ⚠️ FICHIER CRITIQUE — NE JAMAIS SUPPRIMER NI RÉÉCRIRE
// Toute suppression = perte totale des données utilisateur

const APP_PREFIX = 'comptaeple_v1_';

export const store = {

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(APP_PREFIX + key, JSON.stringify({
        value,
        savedAt: new Date().toISOString(),
        version: 1
      }));
    } catch (e) {
      console.error(`[Store] Échec sauvegarde "${key}"`, e);
    }
  },

  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(APP_PREFIX + key);
      if (!raw) return defaultValue;
      const parsed = JSON.parse(raw);
      return parsed.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  delete(key: string): void {
    localStorage.removeItem(APP_PREFIX + key);
  },

  getAllKeys(): string[] {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(APP_PREFIX))
      .map(k => k.replace(APP_PREFIX, ''));
  },

  getLastSaved(key: string): Date | null {
    try {
      const raw = localStorage.getItem(APP_PREFIX + key);
      if (!raw) return null;
      return new Date(JSON.parse(raw).savedAt);
    } catch {
      return null;
    }
  },

  exportAll(): string {
    const data: Record<string, unknown> = {};
    this.getAllKeys().forEach(key => {
      data[key] = this.get(key, null);
    });
    return JSON.stringify(data, null, 2);
  },

  importAll(jsonString: string): void {
    const data = JSON.parse(jsonString);
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });
  },

  clearAll(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(APP_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};
