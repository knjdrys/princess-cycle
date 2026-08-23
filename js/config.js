/**
 * PrincessCycle - Central Application Configuration
 * Single source of truth for version, storage keys and PWA constants.
 * Bump APP_VERSION together with CACHE_VERSION in sw.js on every release.
 */

export const APP_CONFIG = Object.freeze({
  name: 'PrincessCycle',
  version: '1.1.0',

  // Storage
  dbName: 'PrincessCycleDB',
  dbVersion: 1,
  localStorageBackupKey: 'princess_cycle_app_data_v1',

  // Cycle bounds (physiologically plausible, used by engine + validation)
  cycleLengthMin: 18,
  cycleLengthMax: 60,
  periodLengthMin: 1,
  periodLengthMax: 15,

  // Hydration goal
  waterGlassesGoal: 8,

  // Privacy PIN lockout policy
  pinMaxAttempts: 5,
  pinLockoutMs: 30_000
});
