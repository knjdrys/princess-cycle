/**
 * PrincessCycle - Daily Check-In Drawer Controller
 * Handles check-in sheet lifecycle, sleep schedule calculations, chip selections,
 * focus trapping, Escape key handling, and ARIA state management.
 */

import { DOM } from './dom.js';
import { SleepScheduleEngine } from './sleep.js';
import { Validation } from './validation.js';
import { soundFx } from './audio.js';
import { UI, FocusTrap } from './ui.js';

export class CheckinController {
  constructor(stateStore, onSavedCallback) {
    this.store = stateStore;
    this.onSaved = onSavedCallback;
    this.activeLogDate = this.store.formatDate(new Date());
    this.focusTrapHandle = null;
  }

  init() {
    const backdrop = DOM.checkin.backdrop();
    const closeBtn = DOM.checkin.closeBtn();
    const cancelBtn = DOM.checkin.cancelBtn();
    const saveBtn = DOM.checkin.saveBtn();
    const bedtimeInput = DOM.checkin.bedtimeInput();
    const wakeTimeInput = DOM.checkin.wakeTimeInput();
    const sleepPill = DOM.checkin.sleepCalcPill();

    if (!backdrop) return;

    // Bedtime / Wake Time Duration Calculator
    const updateSleepPill = () => {
      if (bedtimeInput && wakeTimeInput && sleepPill) {
        const dur = SleepScheduleEngine.calculateSleepDuration(bedtimeInput.value, wakeTimeInput.value);
        if (dur) {
          sleepPill.textContent = dur.formatted;
        }
      }
    };

    if (bedtimeInput) bedtimeInput.addEventListener('change', updateSleepPill);
    if (wakeTimeInput) wakeTimeInput.addEventListener('change', updateSleepPill);

    // Modal Close Triggers
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCheckin());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeCheckin());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeCheckin();
    });

    // Chips & Selector Event Handlers with ARIA-pressed
    DOM.checkin.moodChips().forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      });
    });

    DOM.checkin.cravingsChips().forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      });
    });

    DOM.checkin.energyBtns().forEach(btn => {
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
      btn.addEventListener('click', () => {
        DOM.checkin.energyBtns().forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      });
    });

    DOM.checkin.flowBtns().forEach(btn => {
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
      btn.addEventListener('click', () => {
        DOM.checkin.flowBtns().forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      });
    });

    DOM.checkin.fluidChips().forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      chip.addEventListener('click', () => {
        DOM.checkin.fluidChips().forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
      });
    });

    const symptomChips = DOM.checkin.symptomChips();
    symptomChips.forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-symptom');
        if (val === 'None') {
          symptomChips.forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-pressed', 'false');
          });
          chip.classList.add('active');
          chip.setAttribute('aria-pressed', 'true');
        } else {
          const noneChip = Array.from(symptomChips).find(c => c.getAttribute('data-symptom') === 'None');
          if (noneChip) {
            noneChip.classList.remove('active');
            noneChip.setAttribute('aria-pressed', 'false');
          }
          chip.classList.toggle('active');
          chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
        }
      });
    });

    DOM.checkin.qualityChips().forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
      chip.addEventListener('click', () => {
        DOM.checkin.qualityChips().forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
      });
    });

    // Save Action
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await this.handleSave();
      });
    }

    // FAB Button & Hero Quick Log Triggers
    const fab = DOM.nav.fabLog();
    const heroBtn = DOM.home.quickLogHeroBtn();
    const fullLogBtn = DOM.home.openFullLogBtn();

    if (fab) fab.addEventListener('click', () => this.openCheckin(this.store.formatDate(new Date())));
    if (heroBtn) heroBtn.addEventListener('click', () => this.openCheckin(this.store.formatDate(new Date())));
    if (fullLogBtn) fullLogBtn.addEventListener('click', () => this.openCheckin(this.store.formatDate(new Date())));
  }

  openCheckin(dateStr) {
    this.activeLogDate = dateStr;
    const backdrop = DOM.checkin.backdrop();
    const titleDate = DOM.checkin.titleDate();
    const todayStr = this.store.formatDate(new Date());

    if (titleDate) {
      titleDate.textContent = dateStr === todayStr ? 'Today 🌸' : dateStr;
    }

    const state = this.store.getState();
    const entry = state.dailyEntries[dateStr] || {};

    // Hydrate Moods
    const currentMoods = entry.mood || [];
    DOM.checkin.moodChips().forEach(chip => {
      const active = currentMoods.includes(chip.getAttribute('data-mood'));
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate Cravings
    const currentCravings = entry.cravings || [];
    DOM.checkin.cravingsChips().forEach(chip => {
      const active = currentCravings.includes(chip.getAttribute('data-craving'));
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate Energy
    const currentEnergy = entry.energy || 3;
    DOM.checkin.energyBtns().forEach(btn => {
      const active = Number(btn.getAttribute('data-energy')) === currentEnergy;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate Flow
    const currentFlow = entry.flow || 'None';
    DOM.checkin.flowBtns().forEach(btn => {
      const active = btn.getAttribute('data-flow') === currentFlow;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate BBT
    const bbtInput = DOM.checkin.bbtInput();
    if (bbtInput) bbtInput.value = entry.bbt || '';

    // Hydrate Cervical Fluid
    const currentFluid = entry.cervicalFluid || 'Dry';
    DOM.checkin.fluidChips().forEach(chip => {
      const active = chip.getAttribute('data-fluid') === currentFluid;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate Symptoms
    const currentSymptoms = entry.symptoms || [];
    DOM.checkin.symptomChips().forEach(chip => {
      const active = currentSymptoms.includes(chip.getAttribute('data-symptom'));
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate Sleep
    const bedtimeInput = DOM.checkin.bedtimeInput();
    const wakeTimeInput = DOM.checkin.wakeTimeInput();
    const sleepPill = DOM.checkin.sleepCalcPill();

    if (bedtimeInput) bedtimeInput.value = entry.bedtime || '23:00';
    if (wakeTimeInput) wakeTimeInput.value = entry.wakeTime || '07:00';

    const dur = SleepScheduleEngine.calculateSleepDuration(
      entry.bedtime || '23:00',
      entry.wakeTime || '07:00'
    );
    if (sleepPill && dur) {
      sleepPill.textContent = dur.formatted;
    }

    const currentQuality = entry.sleepQuality || 'Good';
    DOM.checkin.qualityChips().forEach(chip => {
      const active = chip.getAttribute('data-quality') === currentQuality;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Hydrate Notes
    const notesInput = DOM.checkin.notesInput();
    if (notesInput) notesInput.value = entry.notes || '';

    if (backdrop) {
      backdrop.classList.add('active');
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-label', 'Daily Check-In Drawer');
      // Trap keyboard focus & support Escape
      this.focusTrapHandle = FocusTrap.trap(backdrop, () => this.closeCheckin());
    }
  }

  closeCheckin() {
    const backdrop = DOM.checkin.backdrop();
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    if (this.focusTrapHandle) {
      this.focusTrapHandle.release();
      this.focusTrapHandle = null;
    }
  }

  async handleSave() {
    const selectedMoods = Array.from(document.querySelectorAll('#sheet-mood-chips .chip.active'))
      .map(c => c.getAttribute('data-mood'));

    const selectedCravings = Array.from(document.querySelectorAll('#sheet-cravings-chips .chip.active'))
      .map(c => c.getAttribute('data-craving'));

    const activeEnergyBtn = document.querySelector('#sheet-energy-scale .energy-btn.active');
    const energy = activeEnergyBtn ? Number(activeEnergyBtn.getAttribute('data-energy')) : 3;

    const activeFlowBtn = document.querySelector('#sheet-flow-selector .flow-btn.active');
    const flow = activeFlowBtn ? activeFlowBtn.getAttribute('data-flow') : 'None';

    const activeFluidChip = document.querySelector('#sheet-fluid-selector .chip.active');
    const cervicalFluid = activeFluidChip ? activeFluidChip.getAttribute('data-fluid') : 'Dry';

    const bbtInput = DOM.checkin.bbtInput();
    const bbt = bbtInput && bbtInput.value ? Number(bbtInput.value) : null;

    const selectedSymptoms = Array.from(document.querySelectorAll('#sheet-symptoms-chips .chip.active'))
      .map(c => c.getAttribute('data-symptom'));

    const bedtimeInput = DOM.checkin.bedtimeInput();
    const wakeTimeInput = DOM.checkin.wakeTimeInput();
    const bedtime = bedtimeInput ? bedtimeInput.value : '23:00';
    const wakeTime = wakeTimeInput ? wakeTimeInput.value : '07:00';
    const sleepDur = SleepScheduleEngine.calculateSleepDuration(bedtime, wakeTime);
    const sleepHours = sleepDur ? sleepDur.hours : 8;

    const activeQualityChip = document.querySelector('#sheet-sleep-quality .chip.active');
    const sleepQuality = activeQualityChip ? activeQualityChip.getAttribute('data-quality') : 'Good';

    const notesInput = DOM.checkin.notesInput();
    const notes = Validation.sanitizeText(notesInput ? notesInput.value : '');

    const existingEntry = this.store.getState().dailyEntries[this.activeLogDate] || {};

    this.store.setDailyEntry(this.activeLogDate, {
      ...existingEntry,
      mood: selectedMoods,
      cravings: selectedCravings,
      energy,
      flow,
      bbt,
      cervicalFluid,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['None'],
      bedtime,
      wakeTime,
      sleepHours,
      sleepQuality,
      notes
    });

    soundFx.playChime('sparkle');
    this.closeCheckin();
    UI.showToast('Check-in saved in your private journal ✨', 'success');

    if (typeof this.onSaved === 'function') {
      this.onSaved(this.activeLogDate);
    }
  }
}
