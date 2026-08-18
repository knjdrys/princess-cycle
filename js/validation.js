/**
 * PrincessCycle - Validation & Security Sanitizer
 * Input sanitization, date checks, bounds enforcement, and JSON import schema validation
 */

export const Validation = {
  // Validate YYYY-MM-DD date format and calendar existence
  isValidDateString(dateStr) {
    if (typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  },

  // Validate cycle length within physiologically plausible ranges
  isValidCycleLength(length) {
    const num = Number(length);
    return Number.isInteger(num) && num >= 18 && num <= 60;
  },

  // Validate period length within plausible bounds
  isValidPeriodLength(length, cycleLength = 28) {
    const num = Number(length);
    return Number.isInteger(num) && num >= 1 && num <= Math.min(15, cycleLength - 5);
  },

  // Sanitize user text to prevent XSS injection
  sanitizeText(text) {
    if (!text) return '';
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Validate energy score
  isValidEnergy(val) {
    if (val === null || val === undefined || val === '') return true;
    const num = Number(val);
    return Number.isInteger(num) && num >= 1 && num <= 5;
  },

  // Validate sleep hours
  isValidSleepHours(val) {
    if (val === null || val === undefined || val === '') return true;
    const num = Number(val);
    return !isNaN(num) && num >= 0 && num <= 24;
  },

  // Validate imported JSON payload structure
  validateImportPayload(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid file format: JSON root must be an object.' };
    }

    if (!data.version || !data.exportDate) {
      return { valid: false, error: 'Missing PrincessCycle metadata header.' };
    }

    if (!data.user || typeof data.user !== 'object') {
      return { valid: false, error: 'Missing or invalid user profile block.' };
    }

    if (data.user.typicalCycleLength && !this.isValidCycleLength(data.user.typicalCycleLength)) {
      return { valid: false, error: 'Invalid typical cycle length in profile.' };
    }

    if (data.dailyEntries && typeof data.dailyEntries !== 'object') {
      return { valid: false, error: 'dailyEntries must be an object keyed by date.' };
    }

    if (data.cycles && !Array.isArray(data.cycles)) {
      return { valid: false, error: 'cycles must be an array.' };
    }

    return { valid: true, data };
  }
};
