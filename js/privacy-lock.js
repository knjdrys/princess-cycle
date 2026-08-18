/**
 * PrincessCycle - Privacy PIN Lock & Screen Protector
 * Optional 4-digit on-device passcode and auto-blur privacy shield
 */

export class PrivacyLock {
  constructor(stateStore) {
    this.store = stateStore;
    this.isLocked = false;
  }

  init() {
    const user = this.store.getState().user;
    if (user?.pinLockEnabled && user?.pinCode) {
      this.lockApp();
    }

    // Auto-blur shield when tab loses visibility if enabled
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.store.getState().user?.autoPrivacyShield) {
        document.body.classList.add('privacy-shield-active');
      } else {
        document.body.classList.remove('privacy-shield-active');
      }
    });
  }

  lockApp() {
    this.isLocked = true;
    let overlay = document.getElementById('pin-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pin-lock-overlay';
      overlay.className = 'pin-lock-backdrop';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-container text-center" style="max-width: 360px; padding: var(--space-xl);">
        <img src="./assets/fairy-icon.jpg" alt="PrincessCycle" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-card); margin: 0 auto var(--space-md);" />
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">PrincessCycle Locked</h3>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-lg);">
          Enter your 4-digit security PIN to access your logs.
        </p>

        <div class="flex justify-center gap-xs" style="margin-bottom: var(--space-lg);" id="pin-dots-container">
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
        </div>

        <div class="pin-numpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 240px; margin: 0 auto;">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
            <button class="btn btn-secondary pin-num-btn" data-val="${n}" style="height: 52px; font-size: 1.25rem; font-weight: 600;">${n}</button>
          `).join('')}
          <button class="btn btn-ghost pin-clear-btn" style="height: 52px; font-size: 0.875rem;">Clear</button>
          <button class="btn btn-secondary pin-num-btn" data-val="0" style="height: 52px; font-size: 1.25rem; font-weight: 600;">0</button>
          <button class="btn btn-ghost pin-delete-btn" style="height: 52px; font-size: 0.875rem;">⌫</button>
        </div>
      </div>
    `;

    overlay.classList.add('active');
    this.wirePinEvents(overlay);
  }

  wirePinEvents(overlay) {
    let enteredPin = '';
    const correctPin = this.store.getState().user?.pinCode || '1234';
    const dots = overlay.querySelectorAll('.pin-dot');

    const updateDots = () => {
      dots.forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < enteredPin.length);
      });
    };

    overlay.querySelectorAll('.pin-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (enteredPin.length < 4) {
          enteredPin += btn.getAttribute('data-val');
          updateDots();

          if (enteredPin.length === 4) {
            setTimeout(() => {
              if (enteredPin === correctPin) {
                overlay.classList.remove('active');
                this.isLocked = false;
              } else {
                alert('Incorrect PIN. Please try again.');
                enteredPin = '';
                updateDots();
              }
            }, 120);
          }
        }
      });
    });

    overlay.querySelector('.pin-clear-btn').addEventListener('click', () => {
      enteredPin = '';
      updateDots();
    });

    overlay.querySelector('.pin-delete-btn').addEventListener('click', () => {
      if (enteredPin.length > 0) {
        enteredPin = enteredPin.slice(0, -1);
        updateDots();
      }
    });
  }
}
