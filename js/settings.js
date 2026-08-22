/**
 * PrincessCycle - Settings & Data Sanctuary Controller
 * Handles user preferences, theme selection, sound toggles, JSON/CSV exports, backup imports & database wipes.
 */

import { DOM } from './dom.js';
import { Validation } from './validation.js';
import { storage } from './storage.js';
import { soundFx } from './audio.js';
import { UI } from './ui.js';
import { generateDemoData } from './demo-data.js';

export class SettingsController {
  constructor(stateStore, onDataResetCallback) {
    this.store = stateStore;
    this.onDataReset = onDataResetCallback;
  }

  init() {
    this.wirePreferences();
    this.wireThemeSelector();
    this.wireSoundToggle();
    this.wireBackupAndDataManagement();
  }

  render() {
    const user = this.store.getState().user;
    const nameEl = DOM.settings.nameInput();
    const cycleLenEl = DOM.settings.cycleLengthInput();
    const periodLenEl = DOM.settings.periodLengthInput();
    const lastPeriodEl = DOM.settings.lastPeriodInput();

    if (nameEl) nameEl.value = user.name || 'Princess';
    if (cycleLenEl) cycleLenEl.value = user.typicalCycleLength || 28;
    if (periodLenEl) periodLenEl.value = user.typicalPeriodLength || 5;
    if (lastPeriodEl) lastPeriodEl.value = user.lastPeriodStart || '';

    const theme = user.theme || 'system';
    DOM.settings.themeBtns().forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });

    const soundToggle = DOM.settings.soundToggle();
    if (soundToggle) {
      soundToggle.checked = user.soundEffectsEnabled !== false;
    }
  }

  wirePreferences() {
    const saveBtn = DOM.settings.saveBtn();
    if (!saveBtn) return;

    saveBtn.addEventListener('click', () => {
      const name = Validation.sanitizeText(DOM.settings.nameInput()?.value || 'Princess');
      const cycleLength = Number(DOM.settings.cycleLengthInput()?.value || 28);
      const periodLength = Number(DOM.settings.periodLengthInput()?.value || 5);
      const lastPeriod = DOM.settings.lastPeriodInput()?.value || null;

      if (!Validation.isValidCycleLength(cycleLength)) {
        UI.showToast('Please enter a typical cycle length between 18 and 60 days.', 'warning');
        return;
      }

      if (!Validation.isValidPeriodLength(periodLength, cycleLength)) {
        UI.showToast('Please enter a period length between 1 and 15 days.', 'warning');
        return;
      }

      this.store.setUserProfile({
        name,
        typicalCycleLength: cycleLength,
        typicalPeriodLength: periodLength,
        lastPeriodStart: lastPeriod
      });

      soundFx.playChime('sparkle');
      UI.showToast('Princess preferences saved ✨', 'success');
    });
  }

  wireThemeSelector() {
    DOM.settings.themeBtns().forEach(btn => {
      btn.addEventListener('click', () => {
        const themeVal = btn.getAttribute('data-theme-val');
        DOM.settings.themeBtns().forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.store.setUserProfile({ theme: themeVal });
        UI.applyTheme(themeVal);
        soundFx.playChime('tap');
      });
    });
  }

  wireSoundToggle() {
    const toggle = DOM.settings.soundToggle();
    if (!toggle) return;

    toggle.addEventListener('change', () => {
      const isEnabled = toggle.checked;
      this.store.setUserProfile({ soundEffectsEnabled: isEnabled });
      soundFx.setSoundFxEnabled(isEnabled);
      if (isEnabled) soundFx.playChime('sparkle');
    });
  }

  wireBackupAndDataManagement() {
    // Export JSON
    const exportJsonBtn = DOM.settings.exportJsonBtn();
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        storage.exportAsJSON(this.store.getState());
        soundFx.playChime('sparkle');
        UI.showToast('Encrypted JSON backup downloaded ✨', 'success');
      });
    }

    // Export CSV
    const exportCsvBtn = DOM.settings.exportCsvBtn();
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        storage.exportAsCSV(this.store.getState().dailyEntries);
        soundFx.playChime('sparkle');
      });
    }

    // Import JSON File
    const importInput = DOM.settings.importFileInput();
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const raw = JSON.parse(event.target.result);
            const validation = Validation.validateImportPayload(raw);

            if (!validation.valid) {
              UI.showToast(`Import Error: ${validation.error}`, 'danger', 4500);
              return;
            }

            const data = validation.data;
            this.store.setState({
              user: data.user,
              cycles: data.cycles || [],
              dailyEntries: data.dailyEntries || {},
              isLoading: false
            });

            await storage.saveAllData(this.store.getState());
            soundFx.playChime('sparkle');
            UI.showToast('✨ Princess backup successfully restored!', 'success', 3500);
            this.render();
          } catch (err) {
            UI.showToast('Corrupt or unreadable JSON backup file.', 'danger');
          }
        };
        reader.readAsText(file);
      });
    }

    // Load Demo Data
    const loadDemoBtn = DOM.settings.loadDemoBtn();
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', async () => {
        const confirmed = confirm('Load realistic Filipino demo data? This will populate sample logs, Pinay cravings, and full charts!');
        if (confirmed) {
          const demo = generateDemoData();
          this.store.setState({
            user: demo.user,
            cycles: demo.cycles,
            dailyEntries: demo.dailyEntries,
            isLoading: false
          });
          await storage.saveAllData(this.store.getState());
          soundFx.playChime('sparkle');
          UI.showToast('Demo data loaded! Enjoy exploring 🌸', 'success');
          this.render();
        }
      });
    }

    // Wipe All Data
    const wipeDataBtn = DOM.settings.wipeDataBtn();
    if (wipeDataBtn) {
      wipeDataBtn.addEventListener('click', async () => {
        const confirmed1 = confirm('Delete all data permanently? This action cannot be undone.');
        if (confirmed1) {
          const confirmed2 = confirm('Please confirm once more: All cycle records, notes, and preferences will be permanently wiped from this device.');
          if (confirmed2) {
            await storage.wipeAllData();
            this.store.setState({
              user: {
                id: 'user_default',
                name: 'Princess',
                typicalCycleLength: 28,
                typicalPeriodLength: 5,
                lastPeriodStart: null,
                trackedCategories: ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
                onboardingComplete: false,
                theme: 'system',
                soundEffectsEnabled: true,
                partnerSharing: { enabled: false },
                notifications: { enabled: false }
              },
              cycles: [],
              dailyEntries: {},
              currentView: 'home',
              selectedDate: this.store.formatDate(new Date()),
              viewingMonth: new Date().getMonth(),
              viewingYear: new Date().getFullYear(),
              isLoading: false
            });
            UI.showToast('All local data wiped.', 'info');
            if (typeof this.onDataReset === 'function') {
              this.onDataReset();
            }
          }
        }
      });
    }
  }
}
