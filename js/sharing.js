/**
 * PrincessCycle - Privacy-First Partner Sharing Controller
 * Opt-in granular sharing, supportive non-surveillance partner preview & QR code simulator
 */

import { CycleEngine, PHASE_META, PHASES } from './cycle.js';

export class SharingController {
  constructor(stateStore, onUpdateSettings) {
    this.store = stateStore;
    this.onUpdateSettings = onUpdateSettings;
  }

  render(containerElement) {
    if (!containerElement) return;

    const state = this.store.getState();
    const user = state.user;
    const sharing = user?.partnerSharing || {
      enabled: false,
      sharePhase: true,
      sharePeriodEstimate: true,
      shareMood: true,
      shareSymptoms: false,
      shareNotes: false,
      partnerName: 'Partner'
    };

    const isEnabled = sharing.enabled;

    const html = `
      <div class="sharing-container">
        <!-- Master Sharing Card -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <div>
              <h3 class="card-title">Partner Sharing</h3>
              <p class="card-subtitle">Optionally share selected cycle awareness with someone you trust</p>
            </div>
            <label class="switch-label">
              <input type="checkbox" class="switch-input" id="partner-master-toggle" ${isEnabled ? 'checked' : ''}>
              <div class="switch-track"><div class="switch-thumb"></div></div>
            </label>
          </div>

          <div class="flex items-center gap-xs" style="font-size: 0.75rem; color: var(--color-success); margin-bottom: var(--space-md);">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>100% Opt-in. Disabled by default. Zero external trackers.</span>
          </div>

          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg);">
            You have total control over what is visible. Sharing is designed to foster empathy and understanding, not surveillance.
          </p>

          <!-- Granular Permissions (Only active if master toggle is on) -->
          <div id="sharing-permissions-block" style="${isEnabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
            <h4 style="font-size: 0.9375rem; font-weight: 600; margin-bottom: var(--space-sm);">Choose what to share:</h4>
            
            <div class="flex flex-col gap-sm">
              <label class="flex items-center justify-between" style="cursor: pointer; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Current Cycle Phase</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Displays phase name and gentle tip</div>
                </div>
                <input type="checkbox" class="share-perm" data-perm="sharePhase" ${sharing.sharePhase ? 'checked' : ''}>
              </label>

              <label class="flex items-center justify-between" style="cursor: pointer; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Estimated Next Period Date</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Countdown in days (e.g. ~14 days)</div>
                </div>
                <input type="checkbox" class="share-perm" data-perm="sharePeriodEstimate" ${sharing.sharePeriodEstimate ? 'checked' : ''}>
              </label>

              <label class="flex items-center justify-between" style="cursor: pointer; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Today's Mood & Feelings</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Logged emotions for empathy</div>
                </div>
                <input type="checkbox" class="share-perm" data-perm="shareMood" ${sharing.shareMood ? 'checked' : ''}>
              </label>

              <label class="flex items-center justify-between" style="cursor: pointer; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">General Physical Symptoms</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Sensations like cramps or fatigue</div>
                </div>
                <input type="checkbox" class="share-perm" data-perm="shareSymptoms" ${sharing.shareSymptoms ? 'checked' : ''}>
              </label>

              <label class="flex items-center justify-between" style="cursor: pointer; padding: 6px 0;">
                <div>
                  <div style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Personal Daily Notes</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Reflections you explicitly share</div>
                </div>
                <input type="checkbox" class="share-perm" data-perm="shareNotes" ${sharing.shareNotes ? 'checked' : ''}>
              </label>
            </div>
          </div>
        </div>

        <!-- Supportive Partner View Simulator -->
        <div class="card" style="border: 1px dashed var(--border-medium); background: var(--bg-surface-subtle); margin-bottom: var(--space-xl);">
          <div class="card-header">
            <div>
              <h3 class="card-title">Live Partner View Preview</h3>
              <p class="card-subtitle">Here is exactly what your partner sees on their screen</p>
            </div>
            <span class="badge badge-subtle">Preview</span>
          </div>

          <div id="partner-view-content">
            ${this.renderPartnerViewHtml(state, sharing)}
          </div>
        </div>

        <!-- Simulated Share Link & QR Code Card -->
        <div class="card" style="${isEnabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
          <div class="card-header">
            <div>
              <h3 class="card-title">Direct Partner Connection</h3>
              <p class="card-subtitle">Share securely with a zero-cloud simulated passphrase</p>
            </div>
          </div>

          <div class="flex items-center gap-md" style="flex-wrap: wrap;">
            <div style="background: #FFFFFF; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <!-- Clean SVG QR Code Mock -->
              <svg viewBox="0 0 100 100" width="100" height="100" style="display: block;">
                <rect width="100" height="100" fill="#FFFFFF"/>
                <rect x="10" y="10" width="25" height="25" fill="#2B2627"/>
                <rect x="15" y="15" width="15" height="15" fill="#FFFFFF"/>
                <rect x="18" y="18" width="9" height="9" fill="#2B2627"/>

                <rect x="65" y="10" width="25" height="25" fill="#2B2627"/>
                <rect x="70" y="15" width="15" height="15" fill="#FFFFFF"/>
                <rect x="73" y="18" width="9" height="9" fill="#2B2627"/>

                <rect x="10" y="65" width="25" height="25" fill="#2B2627"/>
                <rect x="15" y="70" width="15" height="15" fill="#FFFFFF"/>
                <rect x="18" y="73" width="9" height="9" fill="#2B2627"/>

                <rect x="42" y="12" width="6" height="18" fill="#C86D7C"/>
                <rect x="42" y="40" width="18" height="18" fill="#2B2627"/>
                <rect x="68" y="45" width="20" height="8" fill="#2B2627"/>
                <rect x="45" y="70" width="15" height="15" fill="#C86D7C"/>
                <rect x="70" y="70" width="18" height="18" fill="#2B2627"/>
              </svg>
            </div>

            <div style="flex: 1; min-width: 200px;">
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Private Partner Token</div>
              <div style="font-family: monospace; font-size: 0.8125rem; background: var(--bg-surface-subtle); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 8px;">
                PC-PAIR-${(user.id || 'DEMO').slice(0, 6).toUpperCase()}-PASS
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-copy-share-token">Copy Connection Token</button>
            </div>
          </div>
        </div>
      </div>
    `;

    containerElement.innerHTML = html;
    this.attachEvents(containerElement);
  }

  renderPartnerViewHtml(state, sharing) {
    if (!sharing.enabled) {
      return `
        <div class="text-center" style="padding: var(--space-lg) 0;">
          <p style="color: var(--text-tertiary); font-size: 0.875rem;">Partner sharing is currently turned off. No information is being shared.</p>
        </div>
      `;
    }

    const user = state.user;
    const lastPeriod = user?.lastPeriodStart;
    const todayStr = this.store.formatDate(new Date());
    const { avgCycleLength, avgPeriodLength } = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const cycleInfo = CycleEngine.getCycleDayAndPhase(todayStr, lastPeriod, avgCycleLength, avgPeriodLength);
    const phaseMeta = PHASE_META[cycleInfo.phase] || PHASE_META[PHASES.FOLLICULAR];

    const todayEntry = state.dailyEntries[todayStr] || {};

    return `
      <div style="background: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--space-lg); border: 1px solid var(--border-subtle);">
        <div class="flex justify-between items-center" style="margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-xs);">
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase;">Shared with you</span>
          <span style="font-size: 0.75rem; color: var(--text-tertiary);">Updated today</span>
        </div>

        <div style="margin-bottom: var(--space-md);">
          <h4 style="font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
            ${sharing.sharePhase ? `${user.name || 'Princess'} is in her ${phaseMeta.title}` : `${user.name || 'Princess'}'s Cycle Overview`}
          </h4>
          ${sharing.sharePhase ? `<p style="font-size: 0.8125rem; color: var(--text-secondary);">${phaseMeta.gentleTip}</p>` : ''}
        </div>

        <div class="flex flex-col gap-xs" style="font-size: 0.875rem; color: var(--text-primary);">
          ${sharing.sharePeriodEstimate && cycleInfo.daysUntilNextPeriod !== null ? `
            <div class="flex justify-between" style="padding: 4px 0;">
              <span style="color: var(--text-secondary);">Next estimated period:</span>
              <span style="font-weight: 600;">In ~${cycleInfo.daysUntilNextPeriod} days</span>
            </div>
          ` : ''}

          ${sharing.shareMood && todayEntry.mood && todayEntry.mood.length > 0 ? `
            <div class="flex justify-between" style="padding: 4px 0;">
              <span style="color: var(--text-secondary);">Feeling today:</span>
              <span style="font-weight: 500;">${todayEntry.mood.join(', ')}</span>
            </div>
          ` : ''}

          ${sharing.shareSymptoms && todayEntry.symptoms && todayEntry.symptoms.length > 0 ? `
            <div class="flex justify-between" style="padding: 4px 0;">
              <span style="color: var(--text-secondary);">Physical sensations:</span>
              <span style="font-weight: 500;">${todayEntry.symptoms.join(', ')}</span>
            </div>
          ` : ''}

          ${sharing.shareNotes && todayEntry.notes ? `
            <div style="margin-top: 8px; padding: 8px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); font-size: 0.8125rem;">
              "${todayEntry.notes}"
            </div>
          ` : ''}
        </div>

        <div style="margin-top: var(--space-md); text-align: center; font-size: 0.6875rem; color: var(--text-tertiary);">
          🔒 ${user.name || 'Princess'} controls what you can see at all times.
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    const masterToggle = container.querySelector('#partner-master-toggle');
    const permCheckboxes = container.querySelectorAll('.share-perm');
    const copyTokenBtn = container.querySelector('#btn-copy-share-token');

    if (masterToggle) {
      masterToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const currentSharing = this.store.getState().user.partnerSharing || {};
        const updated = {
          ...currentSharing,
          enabled: isChecked
        };
        this.updateSharingState(updated);
      });
    }

    permCheckboxes.forEach(chk => {
      chk.addEventListener('change', (e) => {
        const permKey = chk.getAttribute('data-perm');
        const isChecked = e.target.checked;
        const currentSharing = this.store.getState().user.partnerSharing || {};
        const updated = {
          ...currentSharing,
          [permKey]: isChecked
        };
        this.updateSharingState(updated);
      });
    });

    if (copyTokenBtn) {
      copyTokenBtn.addEventListener('click', () => {
        const user = this.store.getState().user;
        const token = `PC-PAIR-${(user.id || 'DEMO').slice(0, 6).toUpperCase()}-PASS`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(token);
        }
        alert('Pairing token copied: ' + token);
      });
    }
  }

  updateSharingState(newSharing) {
    if (this.onUpdateSettings) {
      this.onUpdateSettings({ partnerSharing: newSharing });
    }
  }
}
