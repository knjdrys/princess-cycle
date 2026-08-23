/**
 * PrincessCycle - Guided Breathing & Cramp Relief Pacer
 * Soothing visual respiration pacer with audio cues for menstrual discomfort and anxiety relief
 */

import { soundFx } from './audio.js';

export class RelaxationPacer {
  constructor() {
    this.timer = null;
    this.phaseIndex = 0;
    this.secondsLeft = 4;
    this.cyclesCompleted = 0;
    this.isRunning = false;
    this.pattern = [
      { name: 'Inhale', duration: 4, audio: 'breath-in' },
      { name: 'Hold', duration: 4, audio: null },
      { name: 'Exhale', duration: 4, audio: 'breath-out' },
      { name: 'Rest', duration: 4, audio: null }
    ];
  }

  showModal() {
    let backdrop = document.getElementById('relaxation-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'relaxation-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-container text-center" style="max-width: 440px; padding: var(--space-xl) var(--space-lg);">
        <div class="flex justify-between items-center" style="margin-bottom: var(--space-md);">
          <span class="badge badge-luteal">Cramp & Anxiety Relief</span>
          <button class="btn btn-ghost btn-icon-only" id="close-pacer-btn" aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Guided Breathing</h3>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-xl);">
          Box breathing helps downregulate the nervous system, easing pelvic tension and emotional stress.
        </p>

        <!-- Visual Breathing Sphere -->
        <div class="breathing-circle-container" style="position: relative; width: 180px; height: 180px; margin: 0 auto var(--space-xl); display: flex; align-items: center; justify-content: center;">
          <div id="breathing-glow-ring" class="breathing-ring" style="position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%); transform: scale(0.85); transition: transform 4s ease-in-out, opacity 4s ease-in-out; opacity: 0.6;"></div>
          <div id="breathing-orb" style="position: relative; width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--phase-follicular), var(--color-primary)); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #FFFFFF; box-shadow: var(--shadow-lg); transition: transform 4s ease-in-out;">
            <div id="pacer-action-label" style="font-size: 1.1rem; font-weight: 700; line-height: 1;">Ready</div>
            <div id="pacer-seconds-label" style="font-size: 0.8125rem; opacity: 0.9; margin-top: 2px;">--</div>
          </div>
        </div>

        <div style="font-size: 0.8125rem; color: var(--text-tertiary); margin-bottom: var(--space-lg);">
          Cycles Completed: <strong id="pacer-cycles-count" style="color: var(--text-primary);">0</strong>
        </div>

        <div class="flex gap-sm justify-center">
          <button class="btn btn-primary btn-md" id="btn-toggle-pacer">Start Breathing</button>
          <button class="btn btn-secondary btn-md" id="btn-reset-pacer">Reset</button>
        </div>
      </div>
    `;

    backdrop.classList.add('active');

    const closeModal = () => {
      this.stop();
      backdrop.classList.remove('active');
      if (this.pacerEscapeHandler) {
        document.removeEventListener('keydown', this.pacerEscapeHandler);
        this.pacerEscapeHandler = null;
      }
      if (this.pacerBackdropHandler) {
        backdrop.removeEventListener('click', this.pacerBackdropHandler);
        this.pacerBackdropHandler = null;
      }
    };

    // Escape closes the pacer (accessibility: keyboard users can always exit)
    this.pacerEscapeHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', this.pacerEscapeHandler);

    // Backdrop click closes (only when clicking the overlay itself)
    this.pacerBackdropHandler = (e) => {
      if (e.target === backdrop) closeModal();
    };
    backdrop.addEventListener('click', this.pacerBackdropHandler);

    backdrop.querySelector('#close-pacer-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#btn-toggle-pacer').addEventListener('click', () => {
      if (this.isRunning) {
        this.pause();
      } else {
        this.start();
      }
    });

    backdrop.querySelector('#btn-reset-pacer').addEventListener('click', () => {
      this.reset();
    });

    // Auto-start: opening the pacer means "guide me now".
    this.reset();
    this.start();
  }

  start() {
    // Guard against stacked intervals when reopening the modal
    if (this.timer) clearInterval(this.timer);
    this.isRunning = true;
    const toggleBtn = document.getElementById('btn-toggle-pacer');
    if (toggleBtn) toggleBtn.textContent = 'Pause';
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.timer);
    const toggleBtn = document.getElementById('btn-toggle-pacer');
    if (toggleBtn) toggleBtn.textContent = 'Resume';
  }

  reset() {
    this.pause();
    this.phaseIndex = 0;
    this.secondsLeft = 4;
    this.cyclesCompleted = 0;
    this.updateDOM('Ready', '--', 0.85);
    const countEl = document.getElementById('pacer-cycles-count');
    if (countEl) countEl.textContent = '0';
    const toggleBtn = document.getElementById('btn-toggle-pacer');
    if (toggleBtn) toggleBtn.textContent = 'Start Breathing';
  }

  stop() {
    this.pause();
  }

  tick() {
    const currentPhase = this.pattern[this.phaseIndex];
    const actionLabel = currentPhase.name;

    if (this.secondsLeft === currentPhase.duration) {
      if (currentPhase.audio) {
        soundFx.playChime(currentPhase.audio);
      }
    }

    const isExpand = currentPhase.name === 'Inhale' || currentPhase.name === 'Hold';
    const scale = isExpand ? 1.25 : 0.85;

    this.updateDOM(actionLabel, `${this.secondsLeft}s`, scale);

    this.secondsLeft--;
    if (this.secondsLeft < 1) {
      this.phaseIndex = (this.phaseIndex + 1) % this.pattern.length;
      if (this.phaseIndex === 0) {
        this.cyclesCompleted++;
        const countEl = document.getElementById('pacer-cycles-count');
        if (countEl) countEl.textContent = String(this.cyclesCompleted);
      }
      this.secondsLeft = this.pattern[this.phaseIndex].duration;
    }
  }

  updateDOM(actionText, secondsText, scale) {
    const actionEl = document.getElementById('pacer-action-label');
    const secondsEl = document.getElementById('pacer-seconds-label');
    const orb = document.getElementById('breathing-orb');
    const ring = document.getElementById('breathing-glow-ring');

    if (actionEl) actionEl.textContent = actionText;
    if (secondsEl) secondsEl.textContent = secondsText;
    if (orb) orb.style.transform = `scale(${scale})`;
    if (ring) ring.style.transform = `scale(${scale * 1.2})`;
  }
}

export const relaxationPacer = new RelaxationPacer();
