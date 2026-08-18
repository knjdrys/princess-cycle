/**
 * PrincessCycle - State Management & Pub/Sub Event Bus
 * Lightweight, reactive, predictable state container
 */

class StateStore {
  constructor() {
    this.subscribers = new Map();
    this.state = {
      user: {
        id: 'user_default',
        name: 'Princess',
        typicalCycleLength: 28,
        typicalPeriodLength: 5,
        lastPeriodStart: null,
        trackedCategories: ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
        onboardingComplete: false,
        theme: 'system', // 'system' | 'light' | 'dark'
        partnerSharing: {
          enabled: false,
          sharePhase: true,
          sharePeriodEstimate: true,
          shareMood: true,
          shareSymptoms: false,
          shareNotes: false,
          partnerName: 'Partner'
        },
        notifications: {
          enabled: false,
          periodReminderDaysBefore: 2,
          dailyCheckInPrompt: false,
          dailyCheckInTime: '20:00'
        }
      },
      // Array of logged cycle records: { id, startDate, endDate, cycleLength, periodLength, isEstimated }
      cycles: [],
      // Map/Object of daily entries keyed by 'YYYY-MM-DD': { date, mood[], energy, sleepHours, sleepQuality, symptoms[], flow, cravings[], notes }
      dailyEntries: {},
      // Active UI state
      currentView: 'home',
      selectedDate: this.formatDate(new Date()),
      viewingMonth: new Date().getMonth(),
      viewingYear: new Date().getFullYear(),
      isLoading: true
    };
  }

  // Format Date to YYYY-MM-DD local string safely
  formatDate(dateObj) {
    const d = new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getState() {
    return this.state;
  }

  // Subscribe to changes on specific keys or all state
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => {
        try {
          cb(data, this.state);
        } catch (err) {
          console.error(`Error in subscriber for event "${event}":`, err);
        }
      });
    }
    // Also emit to global wildcard
    if (event !== '*' && this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(cb => {
        try {
          cb({ event, data }, this.state);
        } catch (err) {
          console.error('Error in global subscriber:', err);
        }
      });
    }
  }

  // Pure state updater
  setState(updater) {
    const prevState = { ...this.state };
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.emit('stateChanged', { prevState, currentState: this.state });
  }

  // User Actions
  setUserProfile(userPatch) {
    this.setState(s => ({
      ...s,
      user: { ...s.user, ...userPatch }
    }));
    this.emit('userUpdated', this.state.user);
  }

  setDailyEntry(dateStr, entryData) {
    this.setState(s => {
      const updatedEntries = {
        ...s.dailyEntries,
        [dateStr]: {
          ...(s.dailyEntries[dateStr] || {}),
          ...entryData,
          date: dateStr,
          updatedAt: new Date().toISOString()
        }
      };
      return { ...s, dailyEntries: updatedEntries };
    });
    this.emit('dailyEntrySaved', { date: dateStr, entry: this.state.dailyEntries[dateStr] });
  }

  deleteDailyEntry(dateStr) {
    this.setState(s => {
      const updatedEntries = { ...s.dailyEntries };
      delete updatedEntries[dateStr];
      return { ...s, dailyEntries: updatedEntries };
    });
    this.emit('dailyEntryDeleted', { date: dateStr });
  }

  setCycles(cyclesList) {
    this.setState(s => ({ ...s, cycles: [...cyclesList] }));
    this.emit('cyclesUpdated', this.state.cycles);
  }

  setCurrentView(viewName) {
    this.setState(s => ({ ...s, currentView: viewName }));
    this.emit('viewChanged', viewName);
  }

  setSelectedDate(dateStr) {
    this.setState(s => ({ ...s, selectedDate: dateStr }));
    this.emit('dateSelected', dateStr);
  }

  setCalendarMonth(month, year) {
    this.setState(s => ({ ...s, viewingMonth: month, viewingYear: year }));
    this.emit('calendarMonthChanged', { month, year });
  }
}

// Singleton state instance
export const store = new StateStore();
