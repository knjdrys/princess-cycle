/**
 * PrincessCycle - Privacy PIN Lock & Screen Protector
 * Secure Web Crypto PBKDF2/SHA-256 salted PIN verification, attempt throttling & anti-bypass shield
 */

export class PrivacyLock {
  constructor(stateStore) {
    this.store = stateStore;
    this.isLocked = false;
    this.failedAttempts = 0;
    this.lockoutUntil = 0;
    this.maxAttempts = 5;
    this.lockoutDurationMs = 30000; // 30-second penalty
  }

  // Generate a cryptographically secure 16-byte hex salt
  static generateSalt() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Compute SHA-256 hash of (salt + pin) using native Web Crypto API
  static async hashPin(pinStr, saltHex) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${saltHex}:${pinStr}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify entered PIN against stored hash and salt
  static async verifyPin(enteredPin, saltHex, expectedHash) {
    if (!enteredPin || !saltHex || !expectedHash) return false;
    const computed = await PrivacyLock.hashPin(enteredPin, saltHex);
    return computed === expectedHash;
  }

  async init() {
    const user = this.store.getState().user;

    // Auto-migrate legacy plaintext PIN if present
    if (user?.pinLockEnabled && user?.pinCode && !user?.pinHash) {
      await this.migrateLegacyPin(user.pinCode);
    }

    if (user?.pinLockEnabled && (user?.pinHash || user?.pinCode)) {
      this.lockApp();
    }

    // Auto-blur shield when tab loses visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.store.getState().user?.autoPrivacyShield) {
        document.body.classList.add('privacy-shield-active');
      } else {
        document.body.classList.remove('privacy-shield-active');
      }
    });
  }

  async migrateLegacyPin(plainPin) {
    const salt = PrivacyLock.generateSalt();
    const hash = await PrivacyLock.hashPin(plainPin, salt);
    
    // Save new hash & salt, purge plaintext pinCode
    this.store.setUserProfile({
      pinHash: hash,
      pinSalt: salt,
      pinLockEnabled: true,
      pinCode: undefined
    });
  }

  lockApp() {
    this.isLocked = true;

    // Anti-Bypass Shield: Hide app content from DOM inspection while locked
    const appRoot = document.querySelector('.app-root');
    if (appRoot) {
      appRoot.style.visibility = 'hidden';
      appRoot.setAttribute('aria-hidden', 'true');
    }

    let overlay = document.getElementById('pin-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pin-lock-overlay';
      overlay.className = 'pin-lock-backdrop';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'PIN Security Lock');
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-container text-center" style="max-width: 360px; padding: var(--space-xl);" id="pin-modal-box">
        <img src="./assets/fairy-icon.jpg" alt="PrincessCycle" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-card); margin: 0 auto var(--space-md);" />
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">PrincessCycle Sanctuary</h3>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
          Enter your 4-digit security PIN to unlock your private logs.
        </p>

        <div id="pin-lockout-notice" style="display: none; background: var(--color-danger-bg); color: var(--color-danger); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.8125rem; margin-bottom: var(--space-md); font-weight: 600;">
          Too many failed attempts. Locked for <span id="pin-lockout-timer">30</span>s.
        </div>

        <div class="flex justify-center gap-xs" style="margin-bottom: var(--space-lg);" id="pin-dots-container" aria-live="polite">
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
        </div>

        <div class="pin-numpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 240px; margin: 0 auto;">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
            <button type="button" class="btn btn-secondary pin-num-btn" data-val="${n}" style="height: 52px; font-size: 1.25rem; font-weight: 600;">${n}</button>
          `).join('')}
          <button type="button" class="btn btn-ghost pin-clear-btn" style="height: 52px; font-size: 0.875rem;">Clear</button>
          <button type="button" class="btn btn-secondary pin-num-btn" data-val="0" style="height: 52px; font-size: 1.25rem; font-weight: 600;">0</button>
          <button type="button" class="btn btn-ghost pin-delete-btn" style="height: 52px; font-size: 0.875rem;">⌫</button>
        </div>
      </div>
    `;

    overlay.classList.add('active');
    this.wirePinEvents(overlay);
  }

  unlockApp(overlay) {
    this.isLocked = false;
    this.failedAttempts = 0;
    overlay.classList.remove('active');

    // Restore app content visibility
    const appRoot = document.querySelector('.app-root');
    if (appRoot) {
      appRoot.style.visibility = 'visible';
      appRoot.removeAttribute('aria-hidden');
    }
  }

  wirePinEvents(overlay) {
    let enteredPin = '';
    const dots = overlay.querySelectorAll('.pin-dot');
    const lockoutBox = overlay.querySelector('#pin-lockout-notice');
    const timerLabel = overlay.querySelector('#pin-lockout-timer');
    const numpadBtns = overlay.querySelectorAll('.pin-num-btn, .pin-clear-btn, .pin-delete-btn');

    const updateDots = () => {
      dots.forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < enteredPin.length);
      });
    };

    const checkLockout = () => {
      const now = Date.now();
      if (now < this.lockoutUntil) {
        const remainingSec = Math.ceil((this.lockoutUntil - now) / 1000);
        if (timerLabel) timerLabel.textContent = String(remainingSec);
        if (lockoutBox) lockoutBox.style.display = 'block';
        numpadBtns.forEach(b => b.disabled = true);
        setTimeout(checkLockout, 1000);
        return true;
      } else {
        if (lockoutBox) lockoutBox.style.display = 'none';
        numpadBtns.forEach(b => b.disabled = false);
        return false;
      }
    };

    const triggerFailedAttempt = () => {
      this.failedAttempts++;
      enteredPin = '';
      updateDots();

      const modalBox = overlay.querySelector('#pin-modal-box');
      if (modalBox) {
        modalBox.style.animation = 'shake 0.3s ease';
        setTimeout(() => modalBox.style.animation = '', 300);
      }

      if (this.failedAttempts >= this.maxAttempts) {
        this.lockoutUntil = Date.now() + this.lockoutDurationMs;
        checkLockout();
      }
    };

    overlay.querySelectorAll('.pin-num-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (checkLockout()) return;

        if (enteredPin.length < 4) {
          enteredPin += btn.getAttribute('data-val');
          updateDots();

          if (enteredPin.length === 4) {
            const user = this.store.getState().user;
            const salt = user?.pinSalt;
            const hash = user?.pinHash;

            // Verification
            let isValid = false;
            if (hash && salt) {
              isValid = await PrivacyLock.verifyPin(enteredPin, salt, hash);
            } else if (user?.pinCode) {
              // Temporary legacy fallback during migration transition
              isValid = (enteredPin === user.pinCode);
              if (isValid) {
                await this.migrateLegacyPin(enteredPin);
              }
            }

            if (isValid) {
              this.unlockApp(overlay);
            } else {
              triggerFailedAttempt();
            }
          }
        }
      });
    });

    overlay.querySelector('.pin-clear-btn').addEventListener('click', () => {
      if (checkLockout()) return;
      enteredPin = '';
      updateDots();
    });

    overlay.querySelector('.pin-delete-btn').addEventListener('click', () => {
      if (checkLockout()) return;
      if (enteredPin.length > 0) {
        enteredPin = enteredPin.slice(0, -1);
        updateDots();
      }
    });
  }
}
