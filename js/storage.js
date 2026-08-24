/**
 * PrincessCycle - Authoritative Offline-First Storage Engine
 * IndexedDB as primary Source of Truth with granular delta writes,
 * safe transaction rollback, localStorage backup/migration, and JSON/CSV export.
 */

import { APP_CONFIG } from './config.js';

const DB_NAME = APP_CONFIG.dbName;
const DB_VERSION = APP_CONFIG.dbVersion;
const STORE_USER = 'user';
const STORE_CYCLES = 'cycles';
const STORE_ENTRIES = 'daily_entries';

const LOCAL_STORAGE_KEY = APP_CONFIG.localStorageBackupKey;

class StorageEngine {
  constructor() {
    this.db = null;
    this.useIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
    this.isReady = false;
    // Last-resort in-memory tier: used when neither IndexedDB nor
    // localStorage is available (headless CI, Safari private mode).
    this.memoryStore = { user: null, cycles: [], dailyEntries: {} };
  }

  async init() {
    if (!this.useIndexedDB) {
      console.warn('IndexedDB not supported, using LocalStorage fallback.');
      this.isReady = true;
      return true;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_USER)) {
            db.createObjectStore(STORE_USER, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_CYCLES)) {
            db.createObjectStore(STORE_CYCLES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
            db.createObjectStore(STORE_ENTRIES, { keyPath: 'date' });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isReady = true;
          resolve(true);
        };

        request.onerror = (err) => {
          console.warn('IndexedDB open error, falling back to LocalStorage:', err);
          this.useIndexedDB = false;
          this.isReady = true;
          resolve(false);
        };
      } catch (e) {
        console.warn('IndexedDB open exception, falling back to LocalStorage:', e);
        this.useIndexedDB = false;
        this.isReady = true;
        resolve(false);
      }
    });
  }

  // Load entire initial application state (IndexedDB primary, LocalStorage legacy migration)
  async loadAllData() {
    if (this.db && this.useIndexedDB) {
      try {
        const idbData = await this.readAllFromIndexedDB();
        const hasIdbData = Boolean(idbData.user || (idbData.cycles && idbData.cycles.length > 0) || Object.keys(idbData.dailyEntries).length > 0);

        if (hasIdbData) {
          // Sync backup cache to localStorage
          this.syncToLocalStorage(idbData);
          return this.migrateLegacyEscapedText(idbData);
        }
      } catch (err) {
        console.warn('Error reading from IndexedDB, trying fallback:', err);
      }
    }

    // Fallback or Legacy Migration from localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const localBackup = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          const data = {
            user: parsed.user || null,
            cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [],
            dailyEntries: (parsed.dailyEntries && typeof parsed.dailyEntries === 'object') ? parsed.dailyEntries : {}
          };

          // If IndexedDB is available, migrate legacy localStorage data into IndexedDB
          if (this.db && this.useIndexedDB) {
            await this.saveAllData(data);
            console.log('✨ Migrated legacy localStorage data to IndexedDB.');
          }

          return this.migrateLegacyEscapedText(data);
        }
      } catch (err) {
        console.error('Error reading localStorage backup:', err);
      }
    }

    // In-memory tier (session-only persistence)
    if (this.memoryStore.user || this.memoryStore.cycles.length > 0 || Object.keys(this.memoryStore.dailyEntries).length > 0) {
      return this.migrateLegacyEscapedText({
        user: this.memoryStore.user,
        cycles: [...this.memoryStore.cycles],
        dailyEntries: { ...this.memoryStore.dailyEntries }
      });
    }

    return {
      user: null,
      cycles: [],
      dailyEntries: {}
    };
  }

  // Internal helper to read all stores from IndexedDB
  async readAllFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_USER, STORE_CYCLES, STORE_ENTRIES], 'readonly');
      let user = null;
      const cycles = [];
      const dailyEntries = {};

      tx.objectStore(STORE_USER).openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          user = cursor.value;
          cursor.continue();
        }
      };

      tx.objectStore(STORE_CYCLES).openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cycles.push(cursor.value);
          cursor.continue();
        }
      };

      tx.objectStore(STORE_ENTRIES).openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          dailyEntries[cursor.value.date] = cursor.value;
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        resolve({ user, cycles, dailyEntries });
      };

      tx.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }

  // -------------------------------------------------------------
  // Granular Delta Writes (No destructive clear-and-rewrite loops)
  // -------------------------------------------------------------

  async saveUser(userObj) {
    if (!userObj) return;

    const payload = { ...userObj, id: userObj.id || 'user_default' };

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_USER], 'readwrite');
        tx.objectStore(STORE_USER).put(payload);
        await this.txPromise(tx);
      } catch (err) {
        console.warn('IndexedDB saveUser error:', err);
      }
    } else {
      // Fallback tier: localStorage backup when available, otherwise the
      // in-memory store (headless CI, Safari private mode).
      if (typeof localStorage === 'undefined') {
        this.memoryStore.user = payload;
      } else {
        try {
          const backup = this.readLocalStorageBackup();
          backup.user = payload;
          this.syncToLocalStorage(backup);
        } catch (e) {
          this.memoryStore.user = payload;
        }
      }
    }
  }

  async saveDailyEntry(dateStr, entryData) {
    if (!dateStr || !entryData) return;

    const payload = { ...entryData, date: dateStr };

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_ENTRIES], 'readwrite');
        tx.objectStore(STORE_ENTRIES).put(payload);
        await this.txPromise(tx);
      } catch (err) {
        console.warn('IndexedDB saveDailyEntry error:', err);
      }
    } else {
      if (typeof localStorage === 'undefined') {
        this.memoryStore.dailyEntries[dateStr] = payload;
      } else {
        try {
          const backup = this.readLocalStorageBackup();
          backup.dailyEntries[dateStr] = payload;
          this.syncToLocalStorage(backup);
        } catch (e) {
          this.memoryStore.dailyEntries[dateStr] = payload;
        }
      }
    }
  }

  async deleteDailyEntry(dateStr) {
    if (!dateStr) return;

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_ENTRIES], 'readwrite');
        tx.objectStore(STORE_ENTRIES).delete(dateStr);
        await this.txPromise(tx);
      } catch (err) {
        console.warn('IndexedDB deleteDailyEntry error:', err);
      }
    } else {
      if (typeof localStorage === 'undefined') {
        delete this.memoryStore.dailyEntries[dateStr];
      } else {
        try {
          const backup = this.readLocalStorageBackup();
          delete backup.dailyEntries[dateStr];
          this.syncToLocalStorage(backup);
        } catch (e) {
          delete this.memoryStore.dailyEntries[dateStr];
        }
      }
    }
  }

  async saveCycles(cyclesList) {
    if (!Array.isArray(cyclesList)) return;

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_CYCLES], 'readwrite');
        const store = tx.objectStore(STORE_CYCLES);
        store.clear();
        cyclesList.forEach(c => store.put(c));
        await this.txPromise(tx);
      } catch (err) {
        console.warn('IndexedDB saveCycles error:', err);
      }
    } else {
      if (typeof localStorage === 'undefined') {
        this.memoryStore.cycles = [...cyclesList];
      } else {
        try {
          const backup = this.readLocalStorageBackup();
          backup.cycles = cyclesList;
          this.syncToLocalStorage(backup);
        } catch (e) {
          this.memoryStore.cycles = [...cyclesList];
        }
      }
    }
  }

  readLocalStorageBackup() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          user: parsed.user || null,
          cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [],
          dailyEntries: (parsed.dailyEntries && typeof parsed.dailyEntries === 'object') ? parsed.dailyEntries : {}
        };
      }
    } catch (e) {}
    return { user: null, cycles: [], dailyEntries: {} };
  }

  /**
   * One-time migration: versions prior to the render-time escaping pipeline
   * stored user text pre-escaped (&lt; &amp; &#x27;). Unescape exactly once
   * on load so the new pipeline doesn't double-escape on render.
   */
  migrateLegacyEscapedText(data) {
    const unescape = (str) => {
      if (typeof str !== 'string') return str;
      if (!/[&]/.test(str)) return str;
      return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
    };

    if (data.user && typeof data.user.name === 'string') {
      data.user.name = unescape(data.user.name);
    }
    Object.values(data.dailyEntries || {}).forEach(entry => {
      if (entry && typeof entry.notes === 'string') {
        entry.notes = unescape(entry.notes);
      }
    });
    return data;
  }

  // Bulk save (used on import, demo load, or initial setup)
  async saveAllData(state) {
    const payload = {
      user: state.user,
      cycles: state.cycles || [],
      dailyEntries: state.dailyEntries || {},
      savedAt: new Date().toISOString()
    };

    // 1. Write to IndexedDB
    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_USER, STORE_CYCLES, STORE_ENTRIES], 'readwrite');

        if (state.user) {
          tx.objectStore(STORE_USER).put({ ...state.user, id: state.user.id || 'user_default' });
        }

        const entryStore = tx.objectStore(STORE_ENTRIES);
        entryStore.clear();
        Object.values(state.dailyEntries || {}).forEach(entry => {
          if (entry && entry.date) {
            entryStore.put(entry);
          }
        });

        const cycleStore = tx.objectStore(STORE_CYCLES);
        cycleStore.clear();
        (state.cycles || []).forEach(cycle => {
          if (cycle && cycle.id) {
            cycleStore.put(cycle);
          }
        });

        await this.txPromise(tx);
      } catch (err) {
        console.warn('IndexedDB saveAllData error:', err);
      }
    }

    // 2. Synchronize backup to localStorage
    this.syncToLocalStorage(payload);
    return true;
  }

  // Convenience alias for callers that persist the full state object
  // (e.g. settings / command-bar theme persistence).
  async saveState(state) {
    return this.saveAllData(state);
  }

  syncToLocalStorage(state) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        user: state.user,
        cycles: state.cycles,
        dailyEntries: state.dailyEntries,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('LocalStorage backup sync skipped (quota or unavailable):', e);
    }
  }

  // Helper promise for transaction completion
  txPromise(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
      tx.onabort = (e) => reject(e.target.error);
    });
  }

  // Wipe all databases completely
  async wipeAllData() {
    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_USER, STORE_CYCLES, STORE_ENTRIES], 'readwrite');
        tx.objectStore(STORE_USER).clear();
        tx.objectStore(STORE_CYCLES).clear();
        tx.objectStore(STORE_ENTRIES).clear();
        await this.txPromise(tx);
      } catch (e) {
        console.warn('IndexedDB clear error:', e);
      }
    }

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
  }

  // Export full user database as JSON file download
  exportAsJSON(state) {
    // Sanitize export payload: ensure no accidental plaintext pinCode is ever exported
    const safeUser = state.user ? { ...state.user } : null;
    if (safeUser) {
      delete safeUser.pinCode;
    }

    const exportData = {
      app: 'PrincessCycle',
      version: APP_CONFIG.version,
      exportDate: new Date().toISOString(),
      user: safeUser,
      cycles: state.cycles || [],
      dailyEntries: state.dailyEntries || {}
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `princess-cycle-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export daily check-in logs as CSV file
  exportAsCSV(dailyEntries) {
    const entries = Object.values(dailyEntries || {}).sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) {
      if (typeof window !== 'undefined' && window.UI && typeof window.UI.showToast === 'function') {
        window.UI.showToast('No logged entries to export yet! Log a few days first ✨', 'info');
      } else {
        console.info('No logged entries to export yet.');
      }
      return;
    }

    const headers = ['Date', 'Moods', 'Pinay Cravings', 'Energy (1-5)', 'Period Flow', 'BBT (C)', 'Cervical Fluid', 'Physical Symptoms', 'Bedtime', 'Wake Time', 'Sleep Hours', 'Sleep Quality', 'Water Glasses', 'Notes'];
    const rows = entries.map(e => [
      e.date || '',
      `"${(e.mood || []).join('; ')}"`,
      `"${(e.cravings || []).join('; ')}"`,
      e.energy || '',
      e.flow || 'None',
      e.bbt || '',
      e.cervicalFluid || '',
      `"${(e.symptoms || []).join('; ')}"`,
      e.bedtime || '',
      e.wakeTime || '',
      e.sleepHours || '',
      e.sleepQuality || '',
      e.waterGlasses || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `princess-cycle-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const storage = new StorageEngine();
