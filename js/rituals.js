/**
 * PrincessCycle - Self-Care Ritual Engine (v2.0.0)
 * Phase-aware daily ritual definitions, completion tracking, streak math,
 * and a 7-day consistency series. Pure logic — no DOM, no storage.
 *
 * Rituals follow the same store-raw / render-escape contract as every other
 * module: completion state lives on dailyEntries[date].rituals as
 * { [ritualId]: true }. Each ritual knows how to launch its host feature
 * (breathing pacer, check-in drawer, hydration, etc.) via a provided launcher.
 */

import { PHASES } from './cycle.js';

// Each ritual: id, icon, title, blurb, which phases show it, optional `action`
// id handled by the controller (deep-links into existing features).
export const RITUAL_LIBRARY = {
  hydrate: {
    id: 'hydrate',
    icon: '💧',
    title: 'Drink a glass of water',
    blurb: 'Soft sip for fresh skin & gentle cramp relief.',
    phases: [PHASES.MENSTRUATION, PHASES.FOLLICULAR, PHASES.OVULATION, PHASES.LUTEAL],
    action: 'hydrate'
  },
  breathe: {
    id: 'breathe',
    icon: '🌬️',
    title: '1-minute fairy breathing',
    blurb: 'Box breaths to calm the nervous system.',
    phases: [PHASES.MENSTRUATION, PHASES.FOLLICULAR, PHASES.OVULATION, PHASES.LUTEAL],
    action: 'breathe'
  },
  checkin: {
    id: 'checkin',
    icon: '📝',
    title: "Today's check-in",
    blurb: 'Log your vibe, energy, sleep & how you feel.',
    phases: [PHASES.MENSTRUATION, PHASES.FOLLICULAR, PHASES.OVULATION, PHASES.LUTEAL],
    action: 'checkin'
  },
  affirm: {
    id: 'affirm',
    icon: '💜',
    title: 'Read your daily affirmation',
    blurb: 'A little reminder that you are doing wonderful.',
    phases: [PHASES.MENSTRUATION, PHASES.FOLLICULAR, PHASES.OVULATION, PHASES.LUTEAL],
    action: 'affirm'
  },
  rest: {
    id: 'rest',
    icon: '🌙',
    title: 'Honor rest & a cozy wind-down',
    blurb: 'Pahinga muna — gentle stretch or early sleep.',
    phases: [PHASES.MENSTRUATION, PHASES.LUTEAL]
  },
  move: {
    id: 'move',
    icon: '✨',
    title: 'Move your body joyfully',
    blurb: 'Dance, walk, or a fun workout while energy is high.',
    phases: [PHASES.FOLLICULAR, PHASES.OVULATION]
  },
  nourish: {
    id: 'nourish',
    icon: '🍲',
    title: 'Nourish with phase comfort food',
    blurb: 'Warm sinigang or a phase-friendly treat.',
    phases: [PHASES.MENSTRUATION, PHASES.LUTEAL]
  },
  crystal: {
    id: 'crystal',
    icon: '🔮',
    title: 'Hold your fairy crystal & set an intention',
    blurb: 'A tiny mindful pause with today’s lucky charm.',
    phases: [PHASES.MENSTRUATION, PHASES.FOLLICULAR, PHASES.OVULATION, PHASES.LUTEAL]
  }
};

export const RitualEngine = {
  /**
   * Rituals to show for a given phase (preserves library declaration order).
   * @param {string} phaseKey one of PHASES.*
   * @returns {Array} ordered array of ritual definition objects
   */
  getRitualsForPhase(phaseKey) {
    const list = Object.values(RITUAL_LIBRARY).filter(r => r.phases.includes(phaseKey));
    // Always show the four anchor rituals first for a stable rhythm.
    const anchor = ['checkin', 'hydrate', 'breathe', 'affirm'];
    list.sort((a, b) => {
      const ia = anchor.indexOf(a.id);
      const ib = anchor.indexOf(b.id);
      const ra = ia === -1 ? 99 : ia;
      const rb = ib === -1 ? 99 : ib;
      return ra - rb;
    });
    return list;
  },

  /**
   * Which ritual ids are completed for a given date's entry.
   * @param {object|undefined} entry dailyEntries[date]
   * @returns {object} map { [ritualId]: true }
   */
  getCompletedForEntry(entry) {
    return (entry && entry.rituals && typeof entry.rituals === 'object') ? entry.rituals : {};
  },

  /** Number of completed rituals in an entry. */
  countCompleted(entry, ritualIds = []) {
    const done = this.getCompletedForEntry(entry);
    const ids = ritualIds.length ? ritualIds : Object.keys(done);
    return ids.filter(id => done[id]).length;
  },

  /** Did the user complete at least one ritual that day? (streaks count days with effort) */
  isDayCompleted(entry) {
    const done = this.getCompletedForEntry(entry);
    return Object.values(done).some(Boolean);
  },

  /**
   * Current streak (consecutive days up to & including today with >=1 ritual done).
   * @param {object} dailyEntries map keyed by YYYY-MM-DD
   * @param {string} todayStr
   * @param {function} addDaysFn CycleEngine.addDays
   * @returns {number}
   */
  computeStreak(dailyEntries, todayStr, addDaysFn) {
    let streak = 0;
    let cursor = todayStr;
    // Look back up to ~120 days; stop at first gap.
    for (let i = 0; i < 120; i++) {
      const entry = dailyEntries[cursor];
      if (this.isDayCompleted(entry)) {
        streak += 1;
        cursor = addDaysFn(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  },

  /**
   * Longest streak across all history.
   * @param {object} dailyEntries
   * @param {function} addDaysFn
   * @returns {number}
   */
  computeLongestStreak(dailyEntries, addDaysFn) {
    const dates = Object.keys(dailyEntries)
      .filter(d => this.isDayCompleted(dailyEntries[d]))
      .sort(); // ISO strings sort chronologically
    if (dates.length === 0) return 0;

    let longest = 1;
    let run = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = addDaysFn(dates[i - 1], 1);
      if (prev === dates[i]) {
        run += 1;
      } else {
        run = 1;
      }
      if (run > longest) longest = run;
    }
    return longest;
  },

  /**
   * Last 7 days of completion ratios for the canvas sparkline/heat.
   * @param {object} dailyEntries
   * @param {string} todayStr
   * @param {function} addDaysFn
   * @param {Array} todaysRitualIds the ritual ids active today (for denominator)
   * @returns {Array<{date, done, total, ratio}>} oldest -> newest
   */
  getConsistencySeries(dailyEntries, todayStr, addDaysFn, todaysRitualIds = []) {
    const series = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDaysFn(todayStr, -i);
      const entry = dailyEntries[date];
      const done = this.countCompleted(entry, todaysRitualIds);
      const total = todaysRitualIds.length || this.countCompleted(entry);
      series.push({
        date,
        done,
        total: Math.max(total, done, 1),
        ratio: total > 0 ? done / total : 0
      });
    }
    return series;
  },

  /** Human phase label helper for empty-state copy. */
  getPhaseTitle(phaseKey) {
    const map = {
      [PHASES.MENSTRUATION]: 'Menstruation',
      [PHASES.FOLLICULAR]: 'Follicular',
      [PHASES.OVULATION]: 'Ovulation',
      [PHASES.LUTEAL]: 'Luteal'
    };
    return map[phaseKey] || 'Cycle';
  }
};
