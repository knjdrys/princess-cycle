/**
 * PrincessCycle - Daily Check-In Drawer Controller
 * Handles check-in sheet lifecycle, sleep schedule calculations, chip selections, form serialization & saving.
 */

import { DOM } from './dom.js';
import { SleepScheduleEngine } from './sleep.js';
import { Validation } from './validation.js';
import { soundFx } from './audio.js';
import { UI } from './ui.js';

export class CheckinController {
  constructor(stateStore, onSavedCallback) {
    this.store = stateStore;
    this.onSaved = onSavedCallback;
    this.activeLogDate = this.store.formatDate(new Date());
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

    // Chips & Selector Event Delegation
    DOM.checkin.moodChips().forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    DOM.checkin.cravingsChips().forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    DOM.checkin.energyBtns().forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.checkin.energyBtns().forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    DOM.checkin.flowBtns().forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.checkin.flowBtns().forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    DOM.checkin.fluidChips().forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.checkin.fluidChips().forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    const symptomChips = DOM.checkin.symptomChips();
    symptomChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-symptom');
        if (val === 'None') {
          symptomChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        } else {
          const noneChip = Array.from(symptomChips).find(c => c.getAttribute('data-symptom') === 'None');
          if (noneChip) noneChip.classList.remove('active');
          chip.classList.toggle('active');
        }
      });
    });

    DOM.checkin.qualityChips().forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.checkin.qualityChips().forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
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
      chip.classList.toggle('active', currentMoods.includes(chip.getAttribute('data-mood')));
    });

    // Hydrate Cravings
    const currentCravings = entry.cravings || [];
    DOM.checkin.cravingsChips().forEach(chip => {
      chip.classList.toggle('active', currentCravings.includes(chip.getAttribute('data-craving')));
    });

    // Hydrate Energy
    const currentEnergy = entry.energy || 3;
    DOM.checkin.energyBtns().forEach(btn => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-energy')) === currentEnergy);
    });

    // Hydrate Flow
    const currentFlow = entry.flow || 'None';
    DOM.checkin.flowBtns().forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-flow') === currentFlow);
    });

    // Hydrate BBT
    const bbtInput = DOM.checkin.bbtInput();
    if (bbtInput) bbtInput.value = entry.bbt || '';

    // Hydrate Cervical Fluid
    const currentFluid = entry.cervicalFluid || 'Dry';
    DOM.checkin.fluidChips().forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-fluid') === currentFluid);
    });

    // Hydrate Symptoms
    const currentSymptoms = entry.symptoms || [];
    DOM.checkin.symptomChips().forEach(chip => {
      chip.classList.toggle('active', currentSymptoms.includes(chip.getAttribute('data-symptom')));
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
      chip.classList.toggle('active', chip.getAttribute('data-quality') === currentQuality);
    });

    // Hydrate Notes
    const notesInput = DOM.checkin.notesInput();
    if (notesInput) notesInput.value = entry.notes || '';

    if (backdrop) backdrop.classList.add('active');
  }

  closeCheckin() {
    const backdrop = DOM.checkin.backdrop();
    if (backdrop) backdrop.classList.remove('active');
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
