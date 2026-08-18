/**
 * PrincessCycle - Notifications & Gentle Reminders Engine
 * Non-alarmist, respectful copy with Web Notifications API & in-app alerts
 */

export const Notifications = {
  // Request notification permission safely
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  },

  // Check if upcoming period notification is warranted
  checkUpcomingPeriodReminder(cycleInfo) {
    if (!cycleInfo || cycleInfo.daysUntilNextPeriod === null) return null;

    if (cycleInfo.daysUntilNextPeriod === 2 || cycleInfo.daysUntilNextPeriod === 1) {
      return {
        title: 'Gentle Cycle Reminder',
        body: `Based on your cycle length, your next period may approach in around ${cycleInfo.daysUntilNextPeriod} day${cycleInfo.daysUntilNextPeriod > 1 ? 's' : ''}. Take extra gentle care of yourself.`
      };
    }
    return null;
  },

  // Dispatch a gentle browser notification if enabled
  sendGentleNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: './assets/favicon.svg',
          badge: './assets/favicon.svg',
          tag: 'princess-cycle-reminder'
        });
      } catch (e) {
        console.warn('Notification creation error:', e);
      }
    }
  }
};
