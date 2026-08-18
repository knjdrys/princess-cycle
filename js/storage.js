/**
 * PrincessCycle - Offline-First Local Storage Engine
 * IndexedDB persistence with LocalStorage fallback, JSON/CSV export, and safe import
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
    this.useIndexedDB = 'indexedDB' in window;
  }

  async init() {
    if (!this.useIndexedDB) {
      console.warn('IndexedDB not supported, falling back to LocalStorage.');
      return;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

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
          resolve(true);
        };

        request.onerror = (err) => {
          console.warn('IndexedDB init error, fallback to LocalStorage:', err);
          this.useIndexedDB = false;
          resolve(false);
        };
      } catch (e) {
        console.warn('IndexedDB exception, using LocalStorage fallback:', e);
        this.useIndexedDB = false;
        resolve(false);
      }
    });
  }

  // Load entire initial application state
  async loadAllData() {
    // Try LocalStorage first or fallback
    try {
      const localBackup = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localBackup) {
        const parsed = JSON.parse(localBackup);
        return {
          user: parsed.user || null,
          cycles: parsed.cycles || [],
          dailyEntries: parsed.dailyEntries || {}
        };
      }
    } catch (err) {
      console.error('Error reading localStorage backup:', err);
    }

    // Default blank structure
    return {
      user: null,
      cycles: [],
      dailyEntries: {}
    };
  }

  // Save complete state to storage
  async saveAllData(state) {
    const payload = {
      user: state.user,
      cycles: state.cycles,
      dailyEntries: state.dailyEntries,
      savedAt: new Date().toISOString()
    };

    // Always mirror to localStorage for redundancy and instant sync
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage quota or write error:', e);
    }

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_USER, STORE_CYCLES, STORE_ENTRIES], 'readwrite');
        
        // Save user
        if (state.user) {
          tx.objectStore(STORE_USER).put(state.user);
        }

        // Save daily entries
        const entryStore = tx.objectStore(STORE_ENTRIES);
        entryStore.clear();
        Object.values(state.dailyEntries).forEach(entry => {
          entryStore.put(entry);
        });

        // Save cycles
        const cycleStore = tx.objectStore(STORE_CYCLES);
        cycleStore.clear();
        state.cycles.forEach(cycle => {
          cycleStore.put(cycle);
        });

        return new Promise((resolve) => {
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        });
      } catch (err) {
        console.warn('IndexedDB write error:', err);
      }
    }
    return true;
  }

  // Export full user database as JSON file download
  exportAsJSON(state) {
    const exportData = {
      app: 'PrincessCycle',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user: state.user,
      cycles: state.cycles,
      dailyEntries: state.dailyEntries
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
  exportAsCSV(state) {
    const entries = Object.values(state.dailyEntries).sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length === 0) {
      throw new Error('No logged entries available to export.');
    }

    const headers = ['Date', 'Moods', 'Energy', 'SleepHours', 'SleepQuality', 'Symptoms', 'Flow', 'Cravings', 'Notes'];
    const rows = entries.map(e => [
      e.date || '',
      (e.mood || []).join('; '),
      e.energy || '',
      e.sleepHours || '',
      e.sleepQuality || '',
      (e.symptoms || []).join('; '),
      e.flow || '',
      (e.cravings || []).join('; '),
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

  // Import JSON backup
  async importFromJSON(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Selected file is not valid JSON.');
    }

    const validation = Validation.validateImportPayload(parsed);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return parsed;
  }

  // Complete Data Deletion
  async wipeAllData() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}

    if (this.db && this.useIndexedDB) {
      try {
        const tx = this.db.transaction([STORE_USER, STORE_CYCLES, STORE_ENTRIES], 'readwrite');
        tx.objectStore(STORE_USER).clear();
        tx.objectStore(STORE_CYCLES).clear();
        tx.objectStore(STORE_ENTRIES).clear();
        await new Promise(res => {
          tx.oncomplete = res;
          tx.onerror = res;
        });
      } catch (err) {
        console.warn('Error clearing IndexedDB stores:', err);
      }
    }
  }
}

export const storage = new StorageEngine();
