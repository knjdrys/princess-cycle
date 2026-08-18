/**
 * PrincessCycle - Realistic Fictional Demo Data Generator
 * Provides realistic cycle history and check-ins for portfolio showcase and testing
 */

import { CycleEngine } from './cycle.js';

export function generateDemoData() {
  const today = new Date();
  
  // Calculate relative past dates so the demo is always fresh relative to today
  const lastPeriodStart = CycleEngine.addDays(CycleEngine.formatLocalDate(today), -12); // Currently Day 13 (Approaching Ovulation)
  const cycle1Start = CycleEngine.addDays(lastPeriodStart, -29);
  const cycle2Start = CycleEngine.addDays(cycle1Start, -28);
  const cycle3Start = CycleEngine.addDays(cycle2Start, -30);
  const cycle4Start = CycleEngine.addDays(cycle3Start, -29);

  const cycles = [
    {
      id: 'cycle_demo_4',
      startDate: cycle4Start,
      endDate: cycle3Start,
      cycleLength: 29,
      periodLength: 5
    },
    {
      id: 'cycle_demo_3',
      startDate: cycle3Start,
      endDate: cycle2Start,
      cycleLength: 30,
      periodLength: 5
    },
    {
      id: 'cycle_demo_2',
      startDate: cycle2Start,
      endDate: cycle1Start,
      cycleLength: 28,
      periodLength: 4
    },
    {
      id: 'cycle_demo_1',
      startDate: cycle1Start,
      endDate: lastPeriodStart,
      cycleLength: 29,
      periodLength: 5
    }
  ];

  // Daily entries spanning the last 20 days
  const dailyEntries = {};
  
  // Logged period days (days 1 to 5 of current cycle)
  for (let d = 0; d < 5; d++) {
    const entryDate = CycleEngine.addDays(lastPeriodStart, d);
    dailyEntries[entryDate] = {
      date: entryDate,
      mood: d === 0 ? ['Marupok / Emotional 🥺', 'Antukin 😴'] : ['😾 Spicy / Maldita', 'Tired / Pagod'],
      energy: d === 0 ? 2 : 3,
      sleepHours: 8.5,
      sleepQuality: 'Good',
      symptoms: d <= 1 ? ['Cramps (Puson)', 'Lower back tenderness', 'Fatigue (Pagod)'] : ['Mild bloating'],
      flow: d === 0 ? 'Medium' : d === 1 ? 'Heavy' : d === 2 ? 'Medium' : 'Light',
      cravings: ['🍲 Mainit na Sinigang', '🍫 Champorado / Tsokolate'],
      notes: d === 0 ? 'Day 1 cramps. Mainit na sabaw ng Sinigang at mainit na Salabat na may honey helped a lot.' : 'Resting in blanket burrito mode. Mood is getting calmer.'
    };
  }

  // Follicular days (days 6 to 11)
  for (let d = 5; d < 11; d++) {
    const entryDate = CycleEngine.addDays(lastPeriodStart, d);
    dailyEntries[entryDate] = {
      date: entryDate,
      mood: d % 2 === 0 ? ['✨ Sunkissed & Jolly', '🎨 Creative Vibe'] : ['🥰 Kilig & In Love', '✨ Fresh & Confident'],
      energy: 4,
      sleepHours: 7.5,
      sleepQuality: 'Great',
      symptoms: ['None'],
      flow: 'None',
      cravings: ['🥭 Sweet Philippine Mango', '🥥 Fresh Buko Juice'],
      notes: 'Skin is super clear and glowing! Morning taho then did creative watercolor sketching.'
    };
  }

  // Today (Day 13 - approaching Ovulation)
  const todayStr = CycleEngine.formatLocalDate(today);
  dailyEntries[todayStr] = {
    date: todayStr,
    mood: ['✨ Sunkissed & Jolly', '🥰 Kilig & In Love', '🎨 Creative Vibe'],
    energy: 5,
    sleepHours: 8,
    sleepQuality: 'Great',
    symptoms: ['None'],
    flow: 'None',
    cravings: ['🧋 Boba Milk Tea', '🥭 Sweet Mango Shake'],
    notes: 'Feeling so confident and inspired today! Cafe study session and lots of creative ideas.'
  };

  const user = {
    id: 'user_portfolio_demo',
    name: 'Princess Danica',
    typicalCycleLength: 29,
    typicalPeriodLength: 5,
    lastPeriodStart: lastPeriodStart,
    trackedCategories: ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
    onboardingComplete: true,
    theme: 'system',
    partnerSharing: {
      enabled: true,
      sharePhase: true,
      sharePeriodEstimate: true,
      shareMood: true,
      shareSymptoms: true,
      shareNotes: false,
      partnerName: 'Partner'
    },
    notifications: {
      enabled: false,
      periodReminderDaysBefore: 2,
      dailyCheckInPrompt: false,
      dailyCheckInTime: '20:00'
    }
  };

  return { user, cycles, dailyEntries };
}
