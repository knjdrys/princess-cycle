/**
 * PrincessCycle - Dreamy Lilac UI Component & Interaction Engine
 * Multi-Segment SVG Cycle Dial, Focus Trap Manager, Accessible Toasts & Themes
 */

import { PHASE_META, PHASES, CycleEngine } from './cycle.js';

export class FocusTrap {
  static trap(containerEl, onEscapeCallback) {
    if (!containerEl) return { release: () => {} };

    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const previousActiveElement = document.activeElement;

    const getFocusables = () => Array.from(containerEl.querySelectorAll(focusableSelector));

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (typeof onEscapeCallback === 'function') {
          e.preventDefault();
          onEscapeCallback();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusables();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !containerEl.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !containerEl.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    containerEl.addEventListener('keydown', handleKeyDown);

    // Initial focus on the first focusable control
    setTimeout(() => {
      const focusables = getFocusables();
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }, 50);

    return {
      release: () => {
        containerEl.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
          previousActiveElement.focus();
        }
      }
    };
  }
}

export const UI = {
  /**
   * Escape untrusted text for safe interpolation into innerHTML templates.
   * THE canonical escaper: all view templates must route user-derived
   * strings through this at render time. Data is stored raw.
   */
  esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // SVG Icon Map
  icons: {
    crown: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    insights: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  },

  // Dynamic Whimsical & Sweet Greeting
  getGreeting(name = 'Princess') {
    const hour = new Date().getHours();
    let prefix = 'Good morning, sweetest';
    let icon = '✨';
    if (hour >= 12 && hour < 17) {
      prefix = 'Good afternoon, lovely';
      icon = '🌸';
    } else if (hour >= 17 && hour < 22) {
      prefix = 'Good evening, cozy';
      icon = '💜';
    } else if (hour >= 22 || hour < 5) {
      prefix = 'Sweet dreams, magical';
      icon = '🌙';
    }
    return `${prefix} ${name} ${icon}`;
  },

  // Multi-Segment SVG Cycle Dial in Dreamy Lilac & Pastel Glow
  renderCycleDial(cycleDay, totalCycleLength, phaseKey) {
    const radius = 95;
    const circumference = 2 * Math.PI * radius;
    const cLen = Math.max(18, totalCycleLength);
    const safeDay = Math.max(1, Math.min(cycleDay, cLen));
    const boundaries = CycleEngine.getPhaseBoundaries(cLen, 5);

    const calcArc = (startDay, endDay) => {
      const span = (endDay - startDay + 1);
      const strokeLen = (span / cLen) * circumference;
      const startOffset = ((startDay - 1) / cLen) * circumference;
      return { strokeLen, startOffset };
    };

    const mensesArc = calcArc(boundaries.menstruation.startDay, boundaries.menstruation.endDay);
    const follArc = calcArc(boundaries.follicular.startDay, boundaries.follicular.endDay);
    const ovArc = calcArc(boundaries.ovulation.startDay, boundaries.ovulation.endDay);
    const lutealArc = calcArc(boundaries.luteal.startDay, boundaries.luteal.endDay);

    const dayAngle = ((safeDay - 1) / cLen) * 360 - 90;
    const angleRad = (dayAngle * Math.PI) / 180;
    const orbX = 110 + radius * Math.cos(angleRad);
    const orbY = 110 + radius * Math.sin(angleRad);

    const phase = PHASE_META[phaseKey] || PHASE_META[PHASES.FOLLICULAR];

    return `
      <div class="cycle-dial-wrapper" role="img" aria-label="Cycle Day ${cycleDay} of ${cLen}, ${phase.title}">
        <svg class="cycle-dial-svg" viewBox="0 0 220 220" aria-hidden="true">
          <circle class="cycle-dial-track" cx="110" cy="110" r="${radius}" />

          <!-- Segment 1: Menstruation (Blossom Rose) -->
          <circle cx="110" cy="110" r="${radius}" fill="none" stroke="var(--phase-menstruation)" stroke-width="14"
            stroke-dasharray="${mensesArc.strokeLen - 4} ${circumference}"
            stroke-dashoffset="-${mensesArc.startOffset}"
            stroke-linecap="round"
            opacity="0.9" />

          <!-- Segment 2: Follicular (Radiant Lilac) -->
          <circle cx="110" cy="110" r="${radius}" fill="none" stroke="var(--phase-follicular)" stroke-width="14"
            stroke-dasharray="${follArc.strokeLen - 4} ${circumference}"
            stroke-dashoffset="-${follArc.startOffset}"
            stroke-linecap="round"
            opacity="0.9" />

          <!-- Segment 3: Ovulation (Sunbeam Gold) -->
          <circle cx="110" cy="110" r="${radius}" fill="none" stroke="var(--phase-ovulation)" stroke-width="14"
            stroke-dasharray="${ovArc.strokeLen - 4} ${circumference}"
            stroke-dashoffset="-${ovArc.startOffset}"
            stroke-linecap="round"
            opacity="0.95" />

          <!-- Segment 4: Luteal (Dreamy Twilight Periwinkle) -->
          <circle cx="110" cy="110" r="${radius}" fill="none" stroke="var(--phase-luteal)" stroke-width="14"
            stroke-dasharray="${lutealArc.strokeLen - 4} ${circumference}"
            stroke-dashoffset="-${lutealArc.startOffset}"
            stroke-linecap="round"
            opacity="0.9" />
        </svg>

        <!-- Current Day Stardust Beacon Orb -->
        <div class="beacon-orb" style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; border: 4px solid var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.18); left: ${orbX}px; top: ${orbY}px; transform: translate(-50%, -50%); z-index: 5;" aria-hidden="true"></div>

        <div class="cycle-dial-content">
          <div class="cycle-dial-total" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600;">Cycle Day</div>
          <div class="cycle-dial-day-number" style="font-family: var(--font-family-display); font-size: 2.8rem; color: var(--color-primary);">${cycleDay}</div>
          <div class="cycle-dial-total" style="color: var(--text-tertiary); font-size: 0.8125rem;">of ~${cLen} days</div>
          <div class="cycle-dial-phase-title" style="color: var(${phase.colorVar}); font-weight: 700; margin-top: 4px;">${phase.title}</div>
        </div>
      </div>
    `;
  },

  // Accessible Toast Notification Trigger
  showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  // Apply Theme Preference
  applyTheme(theme) {
    const root = document.documentElement;
    // Explicit named themes: rose/mint/peach/sky/lemon/cocoa (light) and their
    // -dark variants. 'light'/'dark' are explicit palette modes; 'system' follows OS.
    const namedThemes = ['rose','mint','peach','sky','lemon','cocoa',
      'rose-dark','mint-dark','peach-dark','sky-dark','lemon-dark','cocoa-dark'];
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (namedThemes.includes(theme)) {
      root.setAttribute('data-theme', theme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }
};
