/**
 * PrincessCycle - Interactive Monthly Calendar & Day Inspection Drawer
 * Visual phase indicators, period highlights, log markers, and rich day inspection
 */

import { CycleEngine, PHASES, PHASE_META } from './cycle.js';
import { UI } from './ui.js';

export class CalendarController {
  constructor(stateStore, onSelectDateCallback, onMarkPeriodStartCallback) {
    this.store = stateStore;
    this.onSelectDate = onSelectDateCallback;
    this.onMarkPeriodStart = onMarkPeriodStartCallback;
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  render(containerElement, viewingMonth, viewingYear) {
    if (!containerElement) return;

    const state = this.store.getState();
    const user = state.user;
    const { avgCycleLength, avgPeriodLength } = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const lastPeriodStart = user?.lastPeriodStart;
    const todayStr = this.store.formatDate(new Date());

    const firstDayIndex = new Date(viewingYear, viewingMonth, 1).getDay();
    const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();

    let gridHtml = `
      <div class="calendar-card card">
        <div class="calendar-nav">
          <button class="btn btn-ghost btn-icon-only" id="cal-prev-btn" aria-label="Previous Month">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="text-center flex items-center gap-xs">
            <h3 class="card-title" id="cal-month-title">${this.monthNames[viewingMonth]} ${viewingYear}</h3>
            <button class="btn btn-ghost btn-sm" id="cal-today-btn" style="font-size: 0.75rem; padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid var(--border-subtle);">Today</button>
          </div>
          <button class="btn btn-ghost btn-icon-only" id="cal-next-btn" aria-label="Next Month">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="calendar-grid">
          ${this.weekDays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
    `;

    for (let i = 0; i < firstDayIndex; i++) {
      gridHtml += `<div class="calendar-day empty" aria-hidden="true"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(viewingYear, viewingMonth, day);
      const dateStr = this.store.formatDate(currentDayDate);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === state.selectedDate;

      let phaseClass = '';
      let isPeriodDay = false;

      if (lastPeriodStart) {
        const cycleInfo = CycleEngine.getCycleDayAndPhase(dateStr, lastPeriodStart, avgCycleLength, avgPeriodLength);
        if (cycleInfo.phase === PHASES.MENSTRUATION) {
          phaseClass = 'phase-menstruation';
          isPeriodDay = true;
        } else if (cycleInfo.phase === PHASES.FOLLICULAR) {
          phaseClass = 'phase-follicular';
        } else if (cycleInfo.phase === PHASES.OVULATION) {
          phaseClass = 'phase-ovulation';
        } else if (cycleInfo.phase === PHASES.LUTEAL) {
          phaseClass = 'phase-luteal';
        }
      }

      const entry = state.dailyEntries[dateStr];
      const hasMood = entry && Array.isArray(entry.mood) && entry.mood.length > 0;
      const hasSymptoms = entry && Array.isArray(entry.symptoms) && entry.symptoms.length > 0 && !entry.symptoms.includes('None');
      const hasExplicitFlow = entry && entry.flow && entry.flow !== 'None';

      if (hasExplicitFlow) {
        isPeriodDay = true;
      }

      let dotMarkers = '';
      if (isPeriodDay || hasMood || hasSymptoms) {
        dotMarkers = `
          <div class="cal-dot-container">
            ${isPeriodDay ? '<span class="cal-dot cal-dot-period" title="Period"></span>' : ''}
            ${hasMood ? '<span class="cal-dot cal-dot-mood" title="Logged Mood"></span>' : ''}
            ${hasSymptoms ? '<span class="cal-dot cal-dot-symptom" title="Logged Symptoms"></span>' : ''}
          </div>
        `;
      }

      const classList = [
        'calendar-day',
        phaseClass,
        isToday ? 'today' : '',
        isSelected ? 'selected' : ''
      ].filter(Boolean).join(' ');

      gridHtml += `
        <button 
          class="${classList}" 
          data-date="${dateStr}"
          aria-label="${dateStr} ${phaseClass ? phaseClass.replace('phase-', '') : ''}"
        >
          <span>${day}</span>
          ${dotMarkers}
        </button>
      `;
    }

    gridHtml += `
        </div>

        <!-- Calendar Legend -->
        <div class="calendar-legend flex justify-center gap-md" style="margin-top: 16px; flex-wrap: wrap;">
          <span class="flex items-center gap-xs" style="font-size: 0.75rem; color: var(--text-secondary);">
            <span class="cal-dot" style="background-color: var(--phase-menstruation); width:8px; height:8px; border-radius:50%;"></span> Menstruation
          </span>
          <span class="flex items-center gap-xs" style="font-size: 0.75rem; color: var(--text-secondary);">
            <span class="cal-dot" style="background-color: var(--phase-follicular); width:8px; height:8px; border-radius:50%;"></span> Follicular
          </span>
          <span class="flex items-center gap-xs" style="font-size: 0.75rem; color: var(--text-secondary);">
            <span class="cal-dot" style="background-color: var(--phase-ovulation); width:8px; height:8px; border-radius:50%;"></span> Ovulation
          </span>
          <span class="flex items-center gap-xs" style="font-size: 0.75rem; color: var(--text-secondary);">
            <span class="cal-dot" style="background-color: var(--phase-luteal); width:8px; height:8px; border-radius:50%;"></span> Luteal
          </span>
        </div>
      </div>

      <!-- Selected Day Inspection Card below calendar -->
      <div id="calendar-day-detail-mount" style="margin-top: var(--space-lg);">
        ${this.renderDayDetailCard(state.selectedDate || todayStr)}
      </div>
    `;

    containerElement.innerHTML = gridHtml;
    this.attachEvents(containerElement, viewingMonth, viewingYear);
  }

  renderDayDetailCard(dateStr) {
    const state = this.store.getState();
    const user = state.user;
    const { avgCycleLength, avgPeriodLength } = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const lastPeriodStart = user?.lastPeriodStart;
    const cycleInfo = CycleEngine.getCycleDayAndPhase(dateStr, lastPeriodStart, avgCycleLength, avgPeriodLength);
    const phaseMeta = PHASE_META[cycleInfo.phase] || PHASE_META[PHASES.FOLLICULAR];

    const entry = state.dailyEntries[dateStr] || {};
    const hasEntry = Object.keys(entry).length > 0;
    const todayStr = this.store.formatDate(new Date());
    const esc = UI.esc;

    return `
      <div class="card" style="border-left: 4px solid var(${phaseMeta.colorVar});">
        <div class="card-header">
          <div>
            <h4 class="card-title">${esc(dateStr === todayStr ? `Today (${dateStr})` : dateStr)}</h4>
            <p class="card-subtitle">Cycle Day ${cycleInfo.cycleDay} • ${esc(phaseMeta.title)}</p>
          </div>
          <span class="badge ${phaseMeta.badgeClass}">${esc(phaseMeta.title)}</span>
        </div>

        <div class="flex flex-col gap-sm" style="font-size: 0.875rem;">
          <div class="flex justify-between items-center" style="padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-secondary);">Period Flow:</span>
            <strong>${entry.flow ? esc(entry.flow) : (cycleInfo.phase === PHASES.MENSTRUATION ? 'Estimated Flow' : 'None')}</strong>
          </div>

          <div class="flex justify-between items-center" style="padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-secondary);">Logged Feelings:</span>
            <strong>${(entry.mood && entry.mood.length > 0) ? esc(entry.mood.join(', ')) : 'None logged'}</strong>
          </div>

          ${(entry.cravings && entry.cravings.length > 0) ? `
          <div class="flex justify-between items-center" style="padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-secondary);">Pinay Cravings:</span>
            <strong style="color: var(--color-primary);">${esc(entry.cravings.join(', '))}</strong>
          </div>
          ` : ''}

          <div class="flex justify-between items-center" style="padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-secondary);">Physical Sensations:</span>
            <strong>${(entry.symptoms && entry.symptoms.length > 0) ? esc(entry.symptoms.join(', ')) : 'None logged'}</strong>
          </div>

          <div class="flex justify-between items-center" style="padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-secondary);">Energy & Sleep:</span>
            <strong>${entry.energy ? `${entry.energy}/5 Energy` : '--'} • ${entry.sleepHours ? `${entry.sleepHours} hrs sleep` : '--'}</strong>
          </div>

          ${entry.waterGlasses ? `
          <div class="flex justify-between items-center" style="padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
            <span style="color: var(--text-secondary);">Hydration:</span>
            <strong>💧 ${entry.waterGlasses} / 8 Glasses</strong>
          </div>
          ` : ''}

          ${entry.notes ? `
            <div style="background: var(--bg-surface-subtle); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.8125rem; margin-top: 4px;">
              "${esc(entry.notes)}"
            </div>
          ` : ''}
        </div>

        <div class="flex gap-sm" style="margin-top: var(--space-md);">
          <button class="btn btn-primary btn-sm btn-block" id="btn-inspect-log-day" data-date="${dateStr}">
            ${hasEntry ? '✏️ Edit Log for this Day' : '+ Log for this Day'}
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-inspect-mark-period" data-date="${dateStr}">
            🩸 Set as Period Start
          </button>
        </div>
      </div>
    `;
  }

  attachEvents(container, month, year) {
    // Clean Event Delegation on the container
    container.onclick = (e) => {
      // 1. Prev Month
      if (e.target.closest('#cal-prev-btn')) {
        let newMonth = month - 1;
        let newYear = year;
        if (newMonth < 0) {
          newMonth = 11;
          newYear -= 1;
        }
        this.store.setCalendarMonth(newMonth, newYear);
        return;
      }

      // 2. Next Month
      if (e.target.closest('#cal-next-btn')) {
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 11) {
          newMonth = 0;
          newYear += 1;
        }
        this.store.setCalendarMonth(newMonth, newYear);
        return;
      }

      // 3. Today Button
      if (e.target.closest('#cal-today-btn')) {
        const now = new Date();
        this.store.setCalendarMonth(now.getMonth(), now.getFullYear());
        this.store.setSelectedDate(this.store.formatDate(now));
        return;
      }

      // 4. Calendar Day Selection
      const dayBtn = e.target.closest('.calendar-day:not(.empty)');
      if (dayBtn) {
        const dateStr = dayBtn.getAttribute('data-date');
        if (dateStr) {
          this.store.setSelectedDate(dateStr);
          const detailMount = container.querySelector('#calendar-day-detail-mount');
          if (detailMount) {
            detailMount.innerHTML = this.renderDayDetailCard(dateStr);
          }
          container.querySelectorAll('.calendar-day').forEach(b => b.classList.remove('selected'));
          dayBtn.classList.add('selected');
        }
        return;
      }

      // 5. Inspect Log Day Action
      const logBtn = e.target.closest('#btn-inspect-log-day');
      if (logBtn) {
        const dateStr = logBtn.getAttribute('data-date') || this.store.getState().selectedDate;
        if (this.onSelectDate) this.onSelectDate(dateStr);
        return;
      }

      // 6. Inspect Mark Period Action
      const markPeriodBtn = e.target.closest('#btn-inspect-mark-period');
      if (markPeriodBtn) {
        const dateStr = markPeriodBtn.getAttribute('data-date') || this.store.getState().selectedDate;
        if (this.onMarkPeriodStart) this.onMarkPeriodStart(dateStr);
        return;
      }
    };
  }
}

