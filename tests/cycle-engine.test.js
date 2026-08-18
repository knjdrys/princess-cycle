/**
 * PrincessCycle - Automated Unit Test Suite
 * Validates cycle calculations, phase transitions, boundary dates, moving averages, hormone curves, BBT, seed cycling, sleep schedule calculations, and security sanitization.
 */

import { CycleEngine, PHASES, SEED_CYCLING_GUIDE } from '../js/cycle.js';
import { SleepScheduleEngine } from '../js/sleep.js';
import { Validation } from '../js/validation.js';

export function runAllTests() {
  const results = [];

  function assert(testName, passed, details = '') {
    results.push({ testName, passed, details });
  }

  // --- Group 1: Date & Day Math ---
  try {
    const diff = CycleEngine.diffInDays('2026-08-01', '2026-08-15');
    assert('diffInDays calculates exact positive days', diff === 14, `Expected 14, got ${diff}`);

    const addedDate = CycleEngine.addDays('2026-08-01', 28);
    assert('addDays correctly computes future date', addedDate === '2026-08-29', `Expected 2026-08-29, got ${addedDate}`);

    const leapDate = CycleEngine.addDays('2024-02-28', 1);
    assert('addDays handles leap year Feb 29 correctly', leapDate === '2024-02-29', `Expected 2024-02-29, got ${leapDate}`);
  } catch (e) {
    assert('Date Math tests threw exception', false, e.message);
  }

  // --- Group 2: Phase Boundaries Calculation ---
  try {
    const b28 = CycleEngine.getPhaseBoundaries(28, 5);
    assert('Phase boundaries for 28-day cycle: Menstruation is Days 1-5', b28.menstruation.startDay === 1 && b28.menstruation.endDay === 5);
    assert('Phase boundaries for 28-day cycle: Ovulation peak is Day 14', b28.ovulation.peakDay === 14);
    assert('Phase boundaries for 28-day cycle: Luteal ends on Day 28', b28.luteal.endDay === 28);

    const b34 = CycleEngine.getPhaseBoundaries(34, 6);
    assert('Phase boundaries for 34-day cycle: Menstruation is Days 1-6', b34.menstruation.endDay === 6);
    assert('Phase boundaries for 34-day cycle: Ovulation peak is Day 20', b34.ovulation.peakDay === 20);
    assert('Phase boundaries for 34-day cycle: Luteal ends on Day 34', b34.luteal.endDay === 34);
  } catch (e) {
    assert('Phase Boundaries tests threw exception', false, e.message);
  }

  // --- Group 3: Cycle Day & Phase Resolution ---
  try {
    const lastPeriod = '2026-08-01';

    // Day 1: Period
    const day1 = CycleEngine.getCycleDayAndPhase('2026-08-01', lastPeriod, 28, 5);
    assert('Day 1 resolves to Menstruation phase', day1.cycleDay === 1 && day1.phase === PHASES.MENSTRUATION);

    // Day 8: Follicular
    const day8 = CycleEngine.getCycleDayAndPhase('2026-08-08', lastPeriod, 28, 5);
    assert('Day 8 resolves to Follicular phase', day8.cycleDay === 8 && day8.phase === PHASES.FOLLICULAR);

    // Day 14: Ovulation
    const day14 = CycleEngine.getCycleDayAndPhase('2026-08-14', lastPeriod, 28, 5);
    assert('Day 14 resolves to Ovulation phase', day14.cycleDay === 14 && day14.phase === PHASES.OVULATION);

    // Day 22: Luteal
    const day22 = CycleEngine.getCycleDayAndPhase('2026-08-22', lastPeriod, 28, 5);
    assert('Day 22 resolves to Luteal phase', day22.cycleDay === 22 && day22.phase === PHASES.LUTEAL);

    // Estimated next period date
    assert('Next period date is accurately projected 28 days out', day1.nextPeriodDate === '2026-08-29');
    assert('Days until next period on Day 1 is 28', day1.daysUntilNextPeriod === 28);
  } catch (e) {
    assert('Cycle Day & Phase tests threw exception', false, e.message);
  }

  // --- Group 4: Hormone & BBT Estimation Curves ---
  try {
    const day3Hormones = CycleEngine.getHormoneLevels(3, 28);
    assert('Day 3 (Menstruation): Progesterone is baseline low', day3Hormones.progesterone <= 0.15);
    assert('Day 3: BBT is in follicular baseline range (~36.3°C)', day3Hormones.bbtCelsius >= 36.1 && day3Hormones.bbtCelsius <= 36.5);

    const day13Hormones = CycleEngine.getHormoneLevels(13, 28);
    assert('Day 13 (Pre-ovulatory): LH Surge is elevated', day13Hormones.lh >= 0.85);

    const day21Hormones = CycleEngine.getHormoneLevels(21, 28);
    assert('Day 21 (Mid-Luteal): Progesterone peaks', day21Hormones.progesterone >= 0.70);
    assert('Day 21: BBT exhibits luteal thermal shift (> 36.6°C)', day21Hormones.bbtCelsius >= 36.6);
  } catch (e) {
    assert('Hormone & BBT tests threw exception', false, e.message);
  }

  // --- Group 5: Sleep Schedule Calculations ---
  try {
    // 23:00 to 07:00 (8h)
    const sleep8 = SleepScheduleEngine.calculateSleepDuration('23:00', '07:00');
    assert('Sleep duration 23:00 to 07:00 computes 8 hours', sleep8.hours === 8.0 && sleep8.formatted === '8h');

    // 22:30 to 06:45 (8h 15m)
    const sleep815 = SleepScheduleEngine.calculateSleepDuration('22:30', '06:45');
    assert('Sleep duration 22:30 to 06:45 computes 8h 15m', sleep815.totalMinutes === 495 && sleep815.formatted === '8h 15m');

    // Late bedtime crossing midnight: 01:15 to 09:30 (8h 15m)
    const lateSleep = SleepScheduleEngine.calculateSleepDuration('01:15', '09:30');
    assert('Sleep duration post-midnight 01:15 to 09:30 computes 8h 15m', lateSleep.hours === 8.3);
  } catch (e) {
    assert('Sleep Schedule tests threw exception', false, e.message);
  }

  // --- Group 6: Seed Cycling Protocol Verification ---
  try {
    assert('Seed cycling follicular protocol contains Pumpkin seeds', SEED_CYCLING_GUIDE.follicular.seeds.includes('Pumpkin'));
    assert('Seed cycling luteal protocol contains Sunflower seeds', SEED_CYCLING_GUIDE.luteal.seeds.includes('Sunflower'));
  } catch (e) {
    assert('Seed Cycling tests threw exception', false, e.message);
  }

  // --- Group 7: Moving Average Historical Cycle Calculation ---
  try {
    const user = { typicalCycleLength: 28, typicalPeriodLength: 5 };
    const cycles = [
      { id: '1', cycleLength: 30, periodLength: 5 },
      { id: '2', cycleLength: 32, periodLength: 6 },
      { id: '3', cycleLength: 31, periodLength: 4 }
    ];

    const metrics = CycleEngine.getEffectiveCycleMetrics(user, cycles);
    assert('Historical moving average adapts to 31 days', metrics.avgCycleLength === 31, `Expected 31, got ${metrics.avgCycleLength}`);
    assert('Historical period average adapts to 5 days', metrics.avgPeriodLength === 5);
    assert('Identified custom history properly', metrics.isCustomHistory === true);
    assert('Confidence margin calculated appropriately', metrics.confidenceMargin >= 1);
  } catch (e) {
    assert('Moving Average tests threw exception', false, e.message);
  }

  // --- Group 8: Validation & Security Sanitizer ---
  try {
    assert('Valid date 2026-08-18 passes validation', Validation.isValidDateString('2026-08-18') === true);
    assert('Invalid date 2026-02-30 fails validation', Validation.isValidDateString('2026-02-30') === false);
    assert('Malformed date string fails validation', Validation.isValidDateString('invalid-date') === false);

    assert('Cycle length of 28 is valid', Validation.isValidCycleLength(28) === true);
    assert('Cycle length of 10 is rejected (< 18)', Validation.isValidCycleLength(10) === false);
    assert('Cycle length of 90 is rejected (> 60)', Validation.isValidCycleLength(90) === false);

    assert('Period length of 5 is valid', Validation.isValidPeriodLength(5, 28) === true);
    assert('Period length of 25 is rejected', Validation.isValidPeriodLength(25, 28) === false);

    // XSS Sanitization
    const dirty = '<script>alert("xss")</script>';
    const clean = Validation.sanitizeText(dirty);
    assert('Sanitizer escapes script tags properly', clean.includes('&lt;script&gt;') && !clean.includes('<script>'));

    // Import Schema Validation
    const validPayload = {
      version: '1.0.0',
      exportDate: '2026-08-18',
      user: { typicalCycleLength: 28 },
      cycles: [],
      dailyEntries: {}
    };
    assert('Valid import payload passes schema check', Validation.validateImportPayload(validPayload).valid === true);

    const invalidPayload = { foo: 'bar' };
    assert('Corrupt import payload is rejected', Validation.validateImportPayload(invalidPayload).valid === false);
  } catch (e) {
    assert('Validation tests threw exception', false, e.message);
  }

  // --- Group 9: Predictive Gap Detection & Auto-Catchup ---
  try {
    const lastPeriod = '2026-08-01';
    const entries = {
      '2026-08-01': { mood: ['Tired'], energy: 2 }
    };
    // If today is 2026-08-05, days 02, 03, 04 are missed
    const gap = CycleEngine.detectLoggingGaps(entries, lastPeriod, '2026-08-05');
    assert('Gap detection finds unlogged days', gap.hasGap === true && gap.missedCount >= 3);
    assert('Gap detection records days since last log', gap.daysSinceLastLog === 4);

    const predicted = CycleEngine.generatePredictedEntryForDate('2026-08-03', lastPeriod, 28, 5);
    assert('Auto-prediction tags entry as isAutoEstimated', predicted.isAutoEstimated === true);
    assert('Auto-prediction yields appropriate phase flow and energy', predicted.energy >= 1 && predicted.flow !== undefined);
  } catch (e) {
    assert('Gap Detection tests threw exception', false, e.message);
  }

  return results;
}
