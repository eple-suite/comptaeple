// ═══════════════════════════════════════════════════════════════════
// IndexedDB Storage adapter for Zustand persist
// Replaces localStorage to handle large datasets (CSV imports)
// localStorage limit: ~5-10MB — IndexedDB: hundreds of MB
// ═══════════════════════════════════════════════════════════════════

const DB_NAME = 'cockpit_eple_db';
const STORE_NAME = 'zustand_store';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB set failed:', e);
  }
}

async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB remove failed:', e);
  }
}

/** Zustand-compatible async storage backed by IndexedDB */
export const idbStorage = {
  getItem: idbGet,
  setItem: idbSet,
  removeItem: idbRemove,
};

/**
 * Migrate existing localStorage data to IndexedDB (one-time).
 * Call this early in the app lifecycle.
 */
export async function migrateLocalStorageToIDB(keys: string[]): Promise<void> {
  for (const key of keys) {
    const lsVal = localStorage.getItem(key);
    if (lsVal) {
      const idbVal = await idbGet(key);
      if (!idbVal) {
        await idbSet(key, lsVal);
        console.info(`[IDB Migration] Migrated "${key}" from localStorage to IndexedDB`);
      }
      // Keep localStorage copy for now as fallback; will be cleaned up next session
    }
  }
}
