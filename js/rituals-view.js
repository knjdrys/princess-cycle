/**
 * PrincessCycle - Self-Care Sanctuary View (v2.0.0)
 * Renders the phase-aware daily ritual checklist, completion streak, and a
 * 7-day consistency canvas. Deep-links into existing features (breathing
 * pacer, check-in drawer, hydration, affirmation) via injected handlers.
 */

import { CycleEngine, PHASE_META, PHASES } from './cycle.js';
import { UI } from './ui.js';
import { RitualEngine, RITUAL_LIBRARY } from './rituals.js';
import { fairySparkles } from './sparkles.js';
import { soundFx } from './audio.js';

export class RitualsController {
  /**
   * @param {object} stateStore
   * @param {object} deps deep-link handlers: { openCheckin, openBreathe, openAffirmation, logWaterGlass }
   */
  constructor(stateStore, deps = {}) {
    this.store = stateStore;
    this.deps = deps;
    this.mountEl = null;
    // CycleEngine.addDays is a static method that references `this`; bind it
    // once so it can be passed as a plain callback (streak/series math).
    this.addDays = CycleEngine.addDays.bind(CycleEngine);
  }

  render(containerElement) {
    if (!containerElement) return;
    this.mountEl = containerElement;

    const state = this.store.getState();
    const user = state.user;
    const todayStr = this.store.formatDate(new Date());

    const metrics = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const info = CycleEngine.getCycleDayAndPhase(todayStr, user?.lastPeriodStart, metrics.avgCycleLength, metrics.avgPeriodLength);
    const meta = PHASE_META[info.phase] || PHASE_META[PHASES.FOLLICULAR];
    const rituals = RitualEngine.getRitualsForPhase(info.phase);
    const ritualIds = rituals.map(r => r.id);

    const entry = state.dailyEntries[todayStr] || {};
    const done = RitualEngine.getCompletedForEntry(entry);
    const completedCount = RitualEngine.countCompleted(entry, ritualIds);
    const total = rituals.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    containerElement.innerHTML = `
      <div class="rituals-container">
        <!-- Streak Metric Cards -->
        <div class="insights-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-xl);">
          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Today</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: var(--color-primary); margin: 4px 0;">${completedCount}<span style="font-size: 0.875rem; font-weight: 400; color: var(--text-secondary);">/${total}</span></div>
            <div class="tag-estimated">Rituals done</div>
          </div>
          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">🔥 Current Streak</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: var(--phase-ovulation-text, #C084FC); margin: 4px 0;">${RitualEngine.computeStreak(state.dailyEntries, todayStr, this.addDays)} <span style="font-size: 0.875rem; font-weight: 400;">days</span></div>
            <div class="tag-logged">Consecutive care</div>
          </div>
          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">🌟 Best Streak</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 4px 0;">${RitualEngine.computeLongestStreak(state.dailyEntries, this.addDays)} <span style="font-size: 0.875rem; font-weight: 400;">days</span></div>
            <div class="tag-estimated">All-time</div>
          </div>
        </div>

        <!-- 7-Day Consistency -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <div>
              <h3 class="card-title">7-Day Self-Care Rhythm</h3>
              <p class="card-subtitle">How gently you've been showing up for yourself</p>
            </div>
            <span class="badge badge-subtle">Consistency</span>
          </div>
          <div style="position: relative; width: 100%; height: 150px;">
            <canvas id="ritual-consistency-chart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>

        <!-- Phase-aware Ritual Checklist -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Today's Self-Care Rituals</h3>
              <p class="card-subtitle">Curated for your <strong style="color: var(${meta.colorVar});">${meta.title}</strong> phase ✨</p>
            </div>
            <span class="badge ${meta.badgeClass}">${meta.title}</span>
          </div>

          <div class="ritual-progress" style="margin-bottom: var(--space-md);">
            <div class="ritual-progress-track">
              <div class="ritual-progress-fill" id="ritual-progress-fill" style="transform: scaleX(${pct / 100});"></div>
            </div>
            <div class="ritual-progress-label" id="ritual-progress-label">${pct}% complete. ${completedCount} of ${total} rituals</div>
          </div>

          <div class="ritual-list" id="ritual-list">
            ${rituals.map(r => `
              <div class="ritual-row ${done[r.id] ? 'done' : ''}" data-ritual="${r.id}">
                <button class="ritual-check ${done[r.id] ? 'checked' : ''}" data-ritual="${r.id}" role="checkbox" aria-checked="${done[r.id] ? 'true' : 'false'}" aria-label="Mark '${UI.esc(r.title)}' complete">
                  ${done[r.id] ? '✓' : ''}
                </button>
                <div class="ritual-body">
                  <div class="ritual-title">${r.icon} ${UI.esc(r.title)}</div>
                  <div class="ritual-blurb">${UI.esc(r.blurb)}</div>
                </div>
                ${r.action ? `<button class="btn btn-secondary btn-sm ritual-action" data-action="${r.action}">Open →</button>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="ritual-complete-banner" id="ritual-complete-banner" style="display: ${completedCount === total && total > 0 ? 'block' : 'none'};">
            🌸 All rituals done, Princess! You cared for yourself beautifully today.
          </div>
        </div>
      </div>
    `;

    // Wire ritual checkboxes
    containerElement.querySelectorAll('.ritual-check').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-ritual');
        this.toggleRitual(id);
        if (this.mountEl) fairySparkles.burst(e.clientX || 0, e.clientY || 0, 8);
      });
    });

    // Wire deep-link action buttons
    containerElement.querySelectorAll('.ritual-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        this.runAction(action);
      });
    });

    this.scheduleDrawConsistency(state, todayStr, ritualIds);
  }

  toggleRitual(ritualId) {
    const todayStr = this.store.formatDate(new Date());
    const state = this.store.getState();
    const entry = state.dailyEntries[todayStr] || {};
    const done = RitualEngine.getCompletedForEntry(entry);
    const nextDone = { ...done, [ritualId]: !done[ritualId] };

    this.store.setDailyEntry(todayStr, { ...entry, rituals: nextDone });

    // Update local DOM for instant feedback (no full re-render / scroll jump)
    const row = this.mountEl && this.mountEl.querySelector(`.ritual-row[data-ritual="${ritualId}"]`);
    const check = row && row.querySelector('.ritual-check');
    const nowChecked = Boolean(nextDone[ritualId]);
    if (row) row.classList.toggle('done', nowChecked);
    if (check) {
      check.classList.toggle('checked', nowChecked);
      check.setAttribute('aria-checked', nowChecked ? 'true' : 'false');
      check.textContent = nowChecked ? '✓' : '';
    }
    if (nowChecked) soundFx.playChime('sparkle');

    // Refresh progress + streak + canvas from authoritative state
    this.refreshProgress();
    this.refreshStreakCards();
    this.refreshConsistency();
  }

  runAction(action) {
    const d = this.deps || {};
    if (action === 'breathe' && typeof d.openBreathe === 'function') d.openBreathe();
    else if (action === 'checkin' && typeof d.openCheckin === 'function') d.openCheckin(this.store.formatDate(new Date()));
    else if (action === 'affirm' && typeof d.openAffirmation === 'function') d.openAffirmation();
    else if (action === 'hydrate' && typeof d.logWaterGlass === 'function') d.logWaterGlass();
  }

  refreshProgress() {
    if (!this.mountEl) return;
    const state = this.store.getState();
    const user = state.user;
    const todayStr = this.store.formatDate(new Date());
    const metrics = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const info = CycleEngine.getCycleDayAndPhase(todayStr, user?.lastPeriodStart, metrics.avgCycleLength, metrics.avgPeriodLength);
    const ritualIds = RitualEngine.getRitualsForPhase(info.phase).map(r => r.id);
    const entry = state.dailyEntries[todayStr] || {};
    const completedCount = RitualEngine.countCompleted(entry, ritualIds);
    const total = ritualIds.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const fill = this.mountEl.querySelector('#ritual-progress-fill');
    const label = this.mountEl.querySelector('#ritual-progress-label');
    const banner = this.mountEl.querySelector('#ritual-complete-banner');
    if (fill) fill.style.transform = `scaleX(${pct / 100})`;
    if (label) label.textContent = `${pct}% complete. ${completedCount} of ${total} rituals`;
    if (banner) banner.style.display = (completedCount === total && total > 0) ? 'block' : 'none';
  }

  refreshStreakCards() {
    if (!this.mountEl) return;
    const state = this.store.getState();
    const todayStr = this.store.formatDate(new Date());
    const cards = this.mountEl.querySelectorAll('.rituals-container .card.text-center');
    if (cards.length >= 3) {
      const todayEntry = state.dailyEntries[todayStr] || {};
      const metrics = CycleEngine.getEffectiveCycleMetrics(state.user, state.cycles);
      const info = CycleEngine.getCycleDayAndPhase(todayStr, state.user?.lastPeriodStart, metrics.avgCycleLength, metrics.avgPeriodLength);
      const ritualIds = RitualEngine.getRitualsForPhase(info.phase).map(r => r.id);
      cards[0].querySelector('div:nth-child(2)').innerHTML = `${RitualEngine.countCompleted(todayEntry, ritualIds)}<span style="font-size: 0.875rem; font-weight: 400; color: var(--text-secondary);">/${ritualIds.length}</span>`;
      cards[1].querySelector('div:nth-child(2)').innerHTML = `${RitualEngine.computeStreak(state.dailyEntries, todayStr, this.addDays)} <span style="font-size: 0.875rem; font-weight: 400;">days</span>`;
      cards[2].querySelector('div:nth-child(2)').innerHTML = `${RitualEngine.computeLongestStreak(state.dailyEntries, this.addDays)} <span style="font-size: 0.875rem; font-weight: 400;">days</span>`;
    }
  }

  refreshConsistency() {
    if (!this.mountEl) return;
    const state = this.store.getState();
    const todayStr = this.store.formatDate(new Date());
    const user = state.user;
    const metrics = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const info = CycleEngine.getCycleDayAndPhase(todayStr, user?.lastPeriodStart, metrics.avgCycleLength, metrics.avgPeriodLength);
    const ritualIds = RitualEngine.getRitualsForPhase(info.phase).map(r => r.id);
    this.drawConsistencyChart(state.dailyEntries, todayStr, ritualIds);
  }

  scheduleDrawConsistency(state, todayStr, ritualIds) {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.drawConsistencyChart(state.dailyEntries, todayStr, ritualIds));
    } else {
      this.drawConsistencyChart(state.dailyEntries, todayStr, ritualIds);
    }
  }

  drawConsistencyChart(dailyEntries = {}, todayStr, ritualIds = []) {
    const canvas = this.mountEl && this.mountEl.querySelector('#ritual-consistency-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 16, right: 12, bottom: 22, left: 12 };
    ctx.clearRect(0, 0, width, height);

    const series = RitualEngine.getConsistencySeries(dailyEntries, todayStr, this.addDays, ritualIds);
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const gap = chartW / series.length;
    const barW = Math.min(26, gap * 0.55);

    const cs = getComputedStyle(document.documentElement);
    const borderSubtle = cs.getPropertyValue('--border-subtle').trim() || 'rgba(167,139,250,0.2)';
    const textTertiary = cs.getPropertyValue('--text-tertiary').trim() || '#8F7CA8';
    const textSecondary = cs.getPropertyValue('--text-secondary').trim() || '#C8B8E2';
    const primary = cs.getPropertyValue('--color-primary').trim() || '#7C3AED';

    // Baseline
    ctx.strokeStyle = borderSubtle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    ctx.lineTo(width - padding.right, padding.top + chartH);
    ctx.stroke();

    const allZero = series.every(s => s.ratio === 0);
    if (allZero) {
      ctx.fillStyle = textSecondary;
      ctx.font = '13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Complete a ritual to start your 7-day rhythm ✨', width / 2, height / 2);
      return;
    }

    series.forEach((s, idx) => {
      const x = padding.left + (idx * gap) + (gap - barW) / 2;
      const barH = Math.max(6, s.ratio * chartH);
      const y = padding.top + chartH - barH;

      // Color by that day's phase if we can infer it; otherwise primary.
      const dayMeta = this.phaseColorForDate(s.date);
      ctx.fillStyle = dayMeta || primary;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Ratio label
      ctx.fillStyle = s.ratio >= 1 ? primary : textSecondary;
      ctx.font = 'bold 10px Nunito, sans-serif';
      ctx.textAlign = 'center';
      if (s.ratio > 0) ctx.fillText(`${Math.round(s.ratio * 100)}%`, x + barW / 2, y - 5);

      // Day label
      ctx.fillStyle = textTertiary;
      ctx.font = '10px Nunito, sans-serif';
      const d = new Date(s.date + 'T12:00:00');
      const lbl = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
      ctx.fillText(lbl, x + barW / 2, height - 7);
    });
  }

  phaseColorForDate(dateStr) {
    try {
      const state = this.store.getState();
      const user = state.user;
      const metrics = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
      const info = CycleEngine.getCycleDayAndPhase(dateStr, user?.lastPeriodStart, metrics.avgCycleLength, metrics.avgPeriodLength);
      const meta = PHASE_META[info.phase];
      if (meta && meta.colorVar) {
        return getComputedStyle(document.documentElement).getPropertyValue(meta.colorVar).trim();
      }
    } catch (_) {}
    return null;
  }
}
