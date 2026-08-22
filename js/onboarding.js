/**
 * PrincessCycle - Guided Onboarding Controller
 * 7-Step state machine for new user setup, typical cycle metrics & first period registration.
 */

import { DOM } from './dom.js';
import { Validation } from './validation.js';
import { storage } from './storage.js';
import { soundFx } from './audio.js';
import { UI } from './ui.js';

export class OnboardingController {
  constructor(stateStore, onCompleteCallback) {
    this.store = stateStore;
    this.onComplete = onCompleteCallback;
    this.currentStep = 1;
    this.totalSteps = 7;
    this.onboardState = {
      name: 'Princess',
      lastPeriodStart: this.store.formatDate(new Date()),
      typicalCycleLength: 28,
      typicalPeriodLength: 5,
      trackedCategories: ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
      partnerSharing: false
    };
  }

  start() {
    const backdrop = DOM.onboarding.backdrop();
    if (!backdrop) return;

    this.currentStep = 1;
    this.onboardState.lastPeriodStart = this.store.formatDate(new Date());
    backdrop.classList.add('active');
    this.renderStep();
  }

  close() {
    const backdrop = DOM.onboarding.backdrop();
    if (backdrop) backdrop.classList.remove('active');
  }

  renderStep() {
    const container = DOM.onboarding.container();
    if (!container) return;

    let stepHtml = '';

    if (this.currentStep === 1) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">Welcome</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 1 of 7 ✨</span>
        </div>
        <div class="sheet-body text-center" style="padding: var(--space-xl) var(--space-lg);">
          <img src="./assets/fairy-icon.jpg" alt="PrincessCycle" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-card); margin: 0 auto var(--space-md);" />
          <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-xs); font-family: var(--font-family-display);">PrincessCycle 🌸</h2>
          <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.6;">
            Your dreamy, private sanctuary to understand your rhythm, nurture your feelings, and sleep peacefully in lovely lilac.
          </p>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-primary btn-block" id="btn-onboard-next">Enter Your Sanctuary ✨</button>
        </div>
      `;
    } else if (this.currentStep === 2) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">Most Recent Period</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 2 of 7</span>
        </div>
        <div class="sheet-body">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
            When did the first day of your most recent period begin?
          </p>
          <div class="form-group">
            <label class="form-label" for="onboard-period-start">First Day of Period 🌸</label>
            <input type="date" class="form-control" id="onboard-period-start" value="${this.onboardState.lastPeriodStart}" max="${this.store.formatDate(new Date())}" required />
            <p class="form-hint">You can change or adjust this date anytime.</p>
          </div>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
          <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
        </div>
      `;
    } else if (this.currentStep === 3) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">Cycle Length</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 3 of 7</span>
        </div>
        <div class="sheet-body">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
            How long is your typical cycle? (From the start of one period to the start of the next).
          </p>
          <div class="form-group">
            <label class="form-label" for="onboard-cycle-length">Cycle Length: <strong id="val-cycle-len" style="color: var(--color-primary);">${this.onboardState.typicalCycleLength}</strong> days</label>
            <input type="range" class="form-control" id="onboard-cycle-length" min="21" max="45" value="${this.onboardState.typicalCycleLength}" style="padding: 0;" />
            <p class="form-hint">Default is 28 days. Cycles naturally vary from person to person.</p>
          </div>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
          <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
        </div>
      `;
    } else if (this.currentStep === 4) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">Period Length</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 4 of 7</span>
        </div>
        <div class="sheet-body">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
            How many days does your bleeding typically last?
          </p>
          <div class="form-group">
            <label class="form-label" for="onboard-period-length">Bleeding Days: <strong id="val-period-len" style="color: var(--color-primary);">${this.onboardState.typicalPeriodLength}</strong> days</label>
            <input type="range" class="form-control" id="onboard-period-length" min="2" max="10" value="${this.onboardState.typicalPeriodLength}" style="padding: 0;" />
            <p class="form-hint">Typically 4 to 6 days.</p>
          </div>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
          <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
        </div>
      `;
    } else if (this.currentStep === 5) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">Personalize Your Sanctuary</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 5 of 7</span>
        </div>
        <div class="sheet-body">
          <div class="form-group">
            <label class="form-label" for="onboard-name">Your Royal Name / Nickname</label>
            <input type="text" class="form-control" id="onboard-name" value="${this.onboardState.name}" placeholder="Princess" required />
          </div>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
          <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
        </div>
      `;
    } else if (this.currentStep === 6) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">What would you like to track?</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 6 of 7</span>
        </div>
        <div class="sheet-body">
          <div class="chip-group" id="onboard-categories">
            <button class="chip active" data-cat="mood">✨ Emotions & Moods</button>
            <button class="chip active" data-cat="sleep">🌙 Sleep Schedule</button>
            <button class="chip active" data-cat="cravings">🧋 Pinay Cravings</button>
            <button class="chip active" data-cat="symptoms">🩹 Physical Sensations</button>
            <button class="chip active" data-cat="energy">⚡ Energy Levels</button>
            <button class="chip active" data-cat="flow">🩸 Flow & Period</button>
            <button class="chip active" data-cat="notes">💜 Secret Thoughts</button>
          </div>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
          <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
        </div>
      `;
    } else if (this.currentStep === 7) {
      stepHtml = `
        <div class="sheet-header">
          <h3 class="card-title">100% Private on Your Device</h3>
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 7 of 7 🔒</span>
        </div>
        <div class="sheet-body text-center">
          <div style="font-size: 2.5rem; margin-bottom: var(--space-sm);">🛡️</div>
          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: var(--space-xs);">Your Data Belongs Only to You</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--space-md);">
            PrincessCycle never connects to remote tracking databases or advertisers. Everything stays safe right here in your browser.
          </p>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
          <button class="btn btn-primary btn-block" id="btn-onboard-finish">Start Tracking 🌸</button>
        </div>
      `;
    }

    container.innerHTML = stepHtml;
    this.wireStepEvents(container);
  }

  wireStepEvents(container) {
    const nextBtn = container.querySelector('#btn-onboard-next');
    const backBtn = container.querySelector('#btn-onboard-back');
    const finishBtn = container.querySelector('#btn-onboard-finish');

    const cycleRange = container.querySelector('#onboard-cycle-length');
    if (cycleRange) {
      cycleRange.addEventListener('input', (e) => {
        this.onboardState.typicalCycleLength = Number(e.target.value);
        const label = container.querySelector('#val-cycle-len');
        if (label) label.textContent = e.target.value;
      });
    }

    const periodRange = container.querySelector('#onboard-period-length');
    if (periodRange) {
      periodRange.addEventListener('input', (e) => {
        this.onboardState.typicalPeriodLength = Number(e.target.value);
        const label = container.querySelector('#val-period-len');
        if (label) label.textContent = e.target.value;
      });
    }

    const nameInput = container.querySelector('#onboard-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.onboardState.name = e.target.value || 'Princess';
      });
    }

    const catChips = container.querySelectorAll('#onboard-categories .chip');
    catChips.forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.currentStep > 1) {
          this.currentStep--;
          soundFx.playChime('tap');
          this.renderStep();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentStep === 2) {
          const dateInput = container.querySelector('#onboard-period-start');
          if (dateInput && dateInput.value) {
            this.onboardState.lastPeriodStart = dateInput.value;
          }
        }

        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
          soundFx.playChime('tap');
          this.renderStep();
        }
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener('click', async () => {
        const activeCats = Array.from(container.querySelectorAll('#onboard-categories .chip.active'))
          .map(c => c.getAttribute('data-cat'));

        this.store.setUserProfile({
          name: this.onboardState.name || 'Princess',
          lastPeriodStart: this.onboardState.lastPeriodStart,
          typicalCycleLength: this.onboardState.typicalCycleLength,
          typicalPeriodLength: this.onboardState.typicalPeriodLength,
          trackedCategories: activeCats.length > 0 ? activeCats : ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
          onboardingComplete: true
        });

        // Initialize Day 1 daily log
        const startDay = this.onboardState.lastPeriodStart;
        const currentEntry = this.store.getState().dailyEntries[startDay] || {};
        this.store.setDailyEntry(startDay, {
          ...currentEntry,
          flow: 'Medium',
          symptoms: ['Cramps (Puson)'],
          mood: ['Marupok / Emotional 🥺']
        });

        await storage.saveAllData(this.store.getState());
        soundFx.playChime('sparkle');
        this.close();
        UI.showToast('Welcome to your private sanctuary, Princess! 🌸', 'success', 3500);

        if (typeof this.onComplete === 'function') {
          this.onComplete();
        }
      });
    }
  }
}
