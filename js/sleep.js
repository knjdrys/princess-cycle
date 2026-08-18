/**
 * PrincessCycle - Sleep Schedule & Smart Wake Auto-Detection Engine
 * Tracks exact bedtime, wake time, sleep duration across midnight, disruptions, and sleep rhythm
 */

export class SleepScheduleEngine {
  constructor(stateStore) {
    this.store = stateStore;
    this.storageKey = 'princess_cycle_last_activity_time';
  }

  // Calculate duration in minutes between bedtime (e.g. "23:30") and wake time (e.g. "07:15")
  static calculateSleepDuration(bedtimeStr, wakeTimeStr) {
    if (!bedtimeStr || !wakeTimeStr) return null;

    const [bedH, bedM] = bedtimeStr.split(':').map(Number);
    const [wakeH, wakeM] = wakeTimeStr.split(':').map(Number);

    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;

    // If wake time is earlier than bedtime, it crossed midnight (e.g. 23:00 to 07:00)
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const diffMinutes = wakeMinutes - bedMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return {
      totalMinutes: diffMinutes,
      hours: Number((diffMinutes / 60).toFixed(1)),
      formatted: `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim()
    };
  }

  // Detect and suggest morning wake time on first app open of the day
  checkMorningWakeDetection(onDetectedCallback) {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = this.store.formatDate(now);

    // Consider morning wake detection between 4:00 AM and 12:00 PM
    if (currentHour >= 4 && currentHour <= 12) {
      const state = this.store.getState();
      const todayEntry = state.dailyEntries[todayStr] || {};

      // If wake time is not logged yet for today
      if (!todayEntry.wakeTime) {
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const detectedTimeStr = `${hh}:${mm}`;

        if (onDetectedCallback) {
          onDetectedCallback(detectedTimeStr, todayStr);
        }
      }
    }

    // Record last activity timestamp
    try {
      localStorage.setItem(this.storageKey, now.toISOString());
    } catch (e) {}
  }

  // Record bedtime right now (e.g. when tapping "Goodnight" before sleep)
  recordBedtimeNow() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    const todayStr = this.store.formatDate(now);
    const state = this.store.getState();
    const todayEntry = state.dailyEntries[todayStr] || {};

    this.store.setDailyEntry(todayStr, {
      ...todayEntry,
      bedtime: timeStr
    });

    return timeStr;
  }

  // Confirm detected wake time
  confirmWakeTimeNow(timeStr, dateStr) {
    const state = this.store.getState();
    const targetDate = dateStr || this.store.formatDate(new Date());
    const existingEntry = state.dailyEntries[targetDate] || {};

    const bedtime = existingEntry.bedtime || '23:00';
    const duration = SleepScheduleEngine.calculateSleepDuration(bedtime, timeStr);

    this.store.setDailyEntry(targetDate, {
      ...existingEntry,
      wakeTime: timeStr,
      bedtime: existingEntry.bedtime || bedtime,
      sleepHours: duration ? duration.hours : 8
    });
  }
}
