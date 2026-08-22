/**
 * PrincessCycle - Automated Unit Test Suite
 * Validates cycle calculations, phase transitions, boundary dates, moving averages,
 * hormone curves, BBT, seed cycling, sleep schedule calculations, gap predictions,
 * Web Crypto PIN salted hashing, and IndexedDB delta storage integrity.
 */

import { CycleEngine, PHASES, SEED_CYCLING_GUIDE } from '../js/cycle.js';
import { SleepScheduleEngine } from '../js/sleep.js';
import { Validation } from '../js/validation.js';
import { PrivacyLock } from '../js/privacy-lock.js';
import { storage } from '../js/storage.js';

export async function runAllTests() {
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

  // --- Group 2: Phase Calculations & Boundaries ---
  try {
    // 28-day cycle, 5-day period, starting on 2026-08-01
    const p1 = CycleEngine.getCycleDayAndPhase('2026-08-01', '2026-08-01', 28, 5);
    assert('Day 1 is Menstruation phase', p1.phase === PHASES.MENSTRUATION && p1.cycleDay === 1);

    const p5 = CycleEngine.getCycleDayAndPhase('2026-08-05', '2026-08-01', 28, 5);
    assert('Day 5 is Menstruation phase (last day)', p5.phase === PHASES.MENSTRUATION && p5.cycleDay === 5);

    const p6 = CycleEngine.getCycleDayAndPhase('2026-08-06', '2026-08-01', 28, 5);
    assert('Day 6 transitions to Follicular phase', p6.phase === PHASES.FOLLICULAR && p6.cycleDay === 6);

    const p14 = CycleEngine.getCycleDayAndPhase('2026-08-14', '2026-08-01', 28, 5);
    assert('Day 14 is Ovulation window', p14.phase === PHASES.OVULATION && p14.cycleDay === 14);

    const p20 = CycleEngine.getCycleDayAndPhase('2026-08-20', '2026-08-01', 28, 5);
    assert('Day 20 is Luteal phase', p20.phase === PHASES.LUTEAL && p20.cycleDay === 20);

    const p29 = CycleEngine.getCycleDayAndPhase('2026-08-29', '2026-08-01', 28, 5);
    assert('Day 29 rolls into new estimated cycle day 1', p29.cycleDay === 1 && p29.phase === PHASES.MENSTRUATION);
  } catch (e) {
    assert('Phase Calculation tests threw exception', false, e.message);
  }

  // --- Group 3: Dynamic Hormone Curve Math ---
  try {
    const h1 = CycleEngine.calculateHormoneLevels(1, 28);
    assert('Day 1 Estrogen is at baseline (~15%)', h1.estrogen >= 10 && h1.estrogen <= 20);
    assert('Day 1 Progesterone is baseline (~5%)', h1.progesterone >= 1 && h1.progesterone <= 10);

    const h14 = CycleEngine.calculateHormoneLevels(14, 28);
    assert('Day 14 Estrogen reaches peak (>= 90%)', h14.estrogen >= 90);
    assert('Day 14 LH surge reaches absolute peak (100%)', h14.lh === 100);

    const h21 = CycleEngine.calculateHormoneLevels(21, 28);
    assert('Day 21 Progesterone reaches luteal peak (>= 80%)', h21.progesterone >= 80);
  } catch (e) {
    assert('Hormone curve calculations threw exception', false, e.message);
  }

  // --- Group 4: Basal Body Temperature (BBT) Estimation ---
  try {
    const bbtFollicular = CycleEngine.estimateBasalBodyTemperature(7, 28);
    assert('Follicular BBT is in lower range (~36.35°C)', bbtFollicular.celsius >= 36.2 && bbtFollicular.celsius <= 36.5);

    const bbtLuteal = CycleEngine.estimateBasalBodyTemperature(22, 28);
    assert('Luteal BBT has biphasic thermal shift (>= 36.70°C)', bbtLuteal.celsius >= 36.65);
    assert('Fahrenheit conversion is mathematically consistent', Math.abs(bbtLuteal.fahrenheit - ((bbtLuteal.celsius * 9/5) + 32)) < 0.1);
  } catch (e) {
    assert('BBT estimation tests threw exception', false, e.message);
  }

  // --- Group 5: Sleep Schedule Duration Math ---
  try {
    const standardSleep = SleepScheduleEngine.calculateSleepDuration('23:00', '07:00');
    assert('Sleep duration 23:00 to 07:00 computes exactly 8.0 hours', standardSleep.hours === 8.0 && standardSleep.formatted === '8h 0m');

    const midnightCrossSleep = SleepScheduleEngine.calculateSleepDuration('22:30', '06:45');
    assert('Sleep duration cross-midnight 22:30 to 06:45 computes 8h 15m', midnightCrossSleep.hours === 8.3 && midnightCrossSleep.formatted === '8h 15m');

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

  // --- Group 10: Web Crypto Salted PIN Security ---
  try {
    const salt1 = PrivacyLock.generateSalt();
    const salt2 = PrivacyLock.generateSalt();
    assert('Cryptographic salt is 32 hex chars (16 bytes)', salt1.length === 32 && /^[a-f0-9]+$/i.test(salt1));
    assert('Consecutive salts are cryptographically unique', salt1 !== salt2);

    const testPin = '4321';
    const hash = await PrivacyLock.hashPin(testPin, salt1);
    assert('SHA-256 hash output is 64 hex chars (256-bit)', hash.length === 64 && /^[a-f0-9]+$/i.test(hash));

    const validVerification = await PrivacyLock.verifyPin(testPin, salt1, hash);
    assert('Web Crypto verifyPin succeeds on matching PIN', validVerification === true);

    const invalidVerification = await PrivacyLock.verifyPin('9999', salt1, hash);
    assert('Web Crypto verifyPin rejects wrong PIN', invalidVerification === false);

    // Import sanitizer purges plaintext PIN
    const legacyImport = {
      version: '1.0.0',
      exportDate: '2026-08-18',
      user: { typicalCycleLength: 28, pinCode: '1234' },
      cycles: [],
      dailyEntries: {}
    };
    Validation.validateImportPayload(legacyImport);
    assert('Import sanitizer purges plaintext pinCode', !('pinCode' in legacyImport.user));
  } catch (e) {
    assert('Web Crypto PIN security tests threw exception', false, e.message);
  }

  // --- Group 11: Authoritative Storage & Delta Integrity ---
  try {
    await storage.init();
    assert('Storage engine initializes successfully', storage.isReady === true);

    // Granular delta entry save without wiping database
    const testDate = '2026-08-15';
    const testEntry = { mood: ['Kilig & In Love'], energy: 5, waterGlasses: 8 };
    await storage.saveDailyEntry(testDate, testEntry);

    const loaded = await storage.loadAllData();
    assert('IndexedDB loads authoritative state', loaded !== null && typeof loaded === 'object');
    assert('Delta entry is persisted accurately', loaded.dailyEntries[testDate]?.energy === 5);
  } catch (e) {
    assert('Storage engine tests threw exception', false, e.message);
  }

  return results;
}
