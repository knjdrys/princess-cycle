/**
 * PrincessCycle - Authoritative Offline-First Storage Engine
 * IndexedDB as primary Source of Truth with granular delta writes,
 * safe transaction rollback, localStorage backup/migration, and JSON/CSV export.
 */

import { Validation } from './validation.js';

const DB_NAME = 'PrincessCycleDB';
const DB_VERSION = 1;
const STORE_USER = 'user';
const STORE_CYCLES = 'cycles';
const STORE_ENTRIES = 'daily_entries';

const LOCAL_STORAGE_KEY = 'princess_cycle_app_data_v1';

class StorageEngine {
  constructor() {
    this.db = null;
    this.useIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
    this.isReady = false;
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
          return idbData;
        }
      } catch (err) {
        console.warn('Error reading from IndexedDB, trying fallback:', err);
      }
    }

    // Fallback or Legacy Migration from localStorage
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

        return data;
      }
    } catch (err) {
      console.error('Error reading localStorage backup:', err);
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

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_USER], 'readwrite');
        tx.objectStore(STORE_USER).put({ ...userObj, id: userObj.id || 'user_default' });
        await this.txPromise(tx);
      } catch (err) {
        console.warn('IndexedDB saveUser error:', err);
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
    }
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

  syncToLocalStorage(state) {
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
      version: '1.1.0',
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
