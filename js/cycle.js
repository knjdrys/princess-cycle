/**
 * PrincessCycle - Menstrual Cycle Calculation Engine & Biological Reference
 * Pure mathematical & biological estimation model.
 * 
 * Strict separation of Logged vs Estimated metrics.
 * Non-diagnostic, customizable, and adaptive.
 */

export const PHASES = {
  MENSTRUATION: 'menstruation',
  FOLLICULAR: 'follicular',
  OVULATION: 'ovulation',
  LUTEAL: 'luteal'
};

export const TRACKING_MODES = {
  STANDARD: 'standard',
  TTC: 'ttc',         // Trying to conceive / conception planning
  IRREGULAR: 'irregular' // Irregular / variable cycle support
};

export const CERVICAL_FLUID_TYPES = [
  { id: 'Dry', label: 'Dry / None', desc: 'Typical directly after menstruation.' },
  { id: 'Sticky', label: 'Sticky', desc: 'Thick or tacky, early follicular days.' },
  { id: 'Creamy', label: 'Creamy', desc: 'Lotion-like consistency, mid-follicular.' },
  { id: 'Eggwhite', label: 'Egg-white / Watery', desc: 'Clear, stretchy, lubricative fluid around ovulation.' },
  { id: 'StickyLuteal', label: 'Sticky / Tapering', desc: 'Quickly transitions back to dry or tacky post-ovulation.' }
];

export const SEED_CYCLING_GUIDE = {
  follicular: {
    title: 'Phase 1 Seeds (Days 1–14)',
    seeds: '1–2 tbsp Raw Pumpkin Seeds + Ground Flaxseeds daily',
    benefits: 'Rich in zinc and lignans to support healthy estrogen production and natural metabolism.'
  },
  luteal: {
    title: 'Phase 2 Seeds (Days 15–28)',
    seeds: '1–2 tbsp Raw Sunflower Seeds + Sesame Seeds daily',
    benefits: 'Rich in selenium and vitamin E to support healthy progesterone production during the luteal window.'
  }
};

export const PHASE_GROCERY_LISTS = {
  [PHASES.MENSTRUATION]: [
    '🍲 Mainit na Sinigang or Nilaga (Electrolytes & hydration)',
    '🥣 Arroz Caldo / Lugaw with ginger & egg (Warm digestion)',
    '🍫 Champorado with milk or Tablea dark chocolate',
    '🥬 Dahon ng Malunggay & Kangkong (Iron & magnesium)',
    '☕ Mainit na Salabat (Ginger tea) with honey & calamansi',
    '🫘 Ginisang Monggo (Folate & plant protein)'
  ],
  [PHASES.FOLLICULAR]: [
    '🍠 Ensaladang Talbos ng Kamote with calamansi',
    '🎃 Ginataang Kalabasa & Sitaw (Healthy fats & fiber)',
    '🌱 Raw pumpkin & flaxseeds for seed cycling',
    '🥭 Fresh Philippine Mangga, Papaya & Calamansi',
    '🐟 Fresh Bangus, Tilapia, or Tofu / Tokwa',
    '🍵 Iced Matcha or Green Tea with honey'
  ],
  [PHASES.OVULATION]: [
    '🥥 Fresh Buko Juice / Coconut water (Natural electrolytes)',
    '🍉 Sweet Pakwan (Watermelon) & Fresh Strawberries',
    '🥗 Ensalada with kamatis, pipino & itlog na maalat',
    '🐟 Inihaw na Isda / Salmon with calamansi dip',
    '🥑 Avocado shake with fresh milk & chia seeds',
    '🥜 Kasoy (Cashews) & raw roasted almonds'
  ],
  [PHASES.LUTEAL]: [
    '🍠 Nilagang Kamote (Slow-burning complex carbs for cravings)',
    '🍌 Nilagang Saging na Saba (Vitamin B6 for PMS balance)',
    '🌻 Sunflower & sesame seeds for luteal seed cycling',
    '🥣 Ginisang Monggo with Dahon ng Ampalaya & Malunggay',
    '☕ Warm Chamomile or Peppermint tea (Anti-bloating)',
    '🧋 Lower-sugar Boba Milk Tea or Soy Taho (Comfort treat)'
  ]
};

export const PHASE_META = {
  [PHASES.MENSTRUATION]: {
    id: PHASES.MENSTRUATION,
    title: 'Menstruation',
    subtitle: 'The first phase of your cycle — time for rest, comfort food, and gentle care.',
    colorVar: '--phase-menstruation',
    colorBg: 'var(--phase-menstruation-bg)',
    colorText: 'var(--phase-menstruation-text)',
    badgeClass: 'badge-menstruation',
    hormoneSummary: 'Both estrogen and progesterone are at baseline. Your body is naturally renewing.',
    possibleExperiences: [
      'Cramps (Puson tension)', 'Fatigue (Pagod)', 'Lower backache', 'Bloating', 'Marupok / Emotional', 'Antukin'
    ],
    gentleTip: 'Pahinga muna, gurl. Warm drinks like Salabat or hot soup will soothe cramps. Bed rest is 100% productive.',
    nutrition: 'Mainit na Sinigang, Arroz Caldo with ginger, dark tsokolate champorado, and iron-rich dahon ng malunggay.',
    movement: 'Slow stretching, gentle bed yoga, or pure rest with a warm compress / hot water bottle.',
    mindset: 'Embrace soft moments. Valid ang emotions mo — okay lang umiyak over K-drama or just sleep early.'
  },
  [PHASES.FOLLICULAR]: {
    id: PHASES.FOLLICULAR,
    title: 'Follicular Phase',
    subtitle: 'Estrogen is rising! Rising energy, clear glowing skin, and fresh creative vibes.',
    colorVar: '--phase-follicular',
    colorBg: 'var(--phase-follicular-bg)',
    colorText: 'var(--phase-follicular-text)',
    badgeClass: 'badge-follicular',
    hormoneSummary: 'FSH stimulates follicle growth; estrogen rises steadily, giving you a natural glow and energy boost.',
    possibleExperiences: [
      'Glow & fresh feeling', 'Rising energy', 'Masayahin / Jolly', 'Creative spark', 'Sociable & kilig'
    ],
    gentleTip: 'Ang ganda ng energy mo today! Perfect window for planning dates, artistic projects, study sessions, and fun outings.',
    nutrition: 'Ensaladang talbos ng kamote with calamansi, ginataang kalabasa, tofu, fresh mangga, and pumpkin/flax seeds.',
    movement: 'Dance workouts, brisk walks with friends, cardio, or trying that new gym routine.',
    mindset: 'Curious, inspired, and motivated. Your brain is extra sharp — take on new goals and express yourself!'
  },
  [PHASES.OVULATION]: {
    id: PHASES.OVULATION,
    title: 'Estimated Ovulation Window',
    subtitle: 'Peak confidence and radiance! An egg is released around this time.',
    colorVar: '--phase-ovulation',
    colorBg: 'var(--phase-ovulation-bg)',
    colorText: 'var(--phase-ovulation-text)',
    badgeClass: 'badge-ovulation',
    hormoneSummary: 'Estrogen peaks, triggering an LH surge and optimal fertility. Energy and charisma are at their highest.',
    possibleExperiences: [
      'Peak confidence', 'Vibrant skin', 'Kilig & flirty vibes', 'Mild mid-cycle twinge (Mittelschmerz)', 'High appetite'
    ],
    gentleTip: 'Main character energy! You are glowing and captivating. Stay hydrated under the Philippine sun.',
    nutrition: 'Fresh Buko juice, cold sweet pakwan, inihaw na salmon/bangus with calamansi, and colorful fruit ensalada.',
    movement: 'High energy workouts, dancing, sports, and outdoor fun with loved ones.',
    mindset: 'Magnetic, charismatic, and emotionally connected. Speak your mind and celebrate your magic!'
  },
  [PHASES.LUTEAL]: {
    id: PHASES.LUTEAL,
    title: 'Luteal Phase',
    subtitle: 'Progesterone takes over. Time to wind down, honor cravings, and protect your peace.',
    colorVar: '--phase-luteal',
    colorBg: 'var(--phase-luteal-bg)',
    colorText: 'var(--phase-luteal-text)',
    badgeClass: 'badge-luteal',
    hormoneSummary: 'Progesterone rises to support the body, then tapers. May trigger PMS symptoms and snack cravings.',
    possibleExperiences: [
      'Sweet & savory cravings 🧋🍫', 'Maldita / Spicy mood', 'Breast tenderness', 'Bloating', 'Sabaw / Lutang moments'
    ],
    gentleTip: 'Protect your peace, Princess. Mag-milk tea ka or nilagang kamote, at wag magpa-stress sa toxic na tao.',
    nutrition: 'Nilagang kamote, saging na saba (B6 for PMS), ginisang monggo with ampalaya, and warm soothing tea.',
    movement: 'Pilates, gentle walking, light stretching, and cozy home workouts.',
    mindset: 'Nesting, journaling, cozying up in aircon/fan, and enjoying solitude with favorite snacks.'
  }
};

export class CycleEngine {
  static parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  static formatLocalDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return null;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static diffInDays(dateStrA, dateStrB) {
    const d1 = this.parseLocalDate(dateStrA);
    const d2 = this.parseLocalDate(dateStrB);
    if (!d1 || !d2) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
  }

  static addDays(dateStr, days) {
    const d = this.parseLocalDate(dateStr);
    if (!d) return null;
    d.setDate(d.getDate() + days);
    return this.formatLocalDate(d);
  }

  static getEffectiveCycleMetrics(user, cycles = []) {
    const defaultCycle = user?.typicalCycleLength || 28;
    const defaultPeriod = user?.typicalPeriodLength || 5;

    const completedCycles = (cycles || []).filter(c => c.cycleLength && c.cycleLength >= 18 && c.cycleLength <= 60);

    if (completedCycles.length === 0) {
      return {
        avgCycleLength: defaultCycle,
        avgPeriodLength: defaultPeriod,
        isCustomHistory: false,
        totalCyclesLogged: 0,
        confidenceMargin: 2
      };
    }

    const totalCycleDays = completedCycles.reduce((sum, c) => sum + c.cycleLength, 0);
    const totalPeriodDays = completedCycles.reduce((sum, c) => sum + (c.periodLength || defaultPeriod), 0);

    const avgCycle = Math.round(totalCycleDays / completedCycles.length);
    const avgPeriod = Math.round(totalPeriodDays / completedCycles.length);

    // Standard deviation for confidence margin
    const variance = completedCycles.reduce((s, c) => s + Math.pow(c.cycleLength - avgCycle, 2), 0) / completedCycles.length;
    const stdDev = Math.sqrt(variance);

    return {
      avgCycleLength: Math.max(18, Math.min(60, avgCycle)),
      avgPeriodLength: Math.max(1, Math.min(15, avgPeriod)),
      isCustomHistory: true,
      totalCyclesLogged: completedCycles.length,
      confidenceMargin: Math.max(1, Math.round(stdDev || 1.5))
    };
  }

  static getPhaseBoundaries(cycleLength, periodLength) {
    const cLen = Math.max(18, cycleLength);
    const pLen = Math.max(1, Math.min(periodLength, cLen - 10));

    const ovulationDay = Math.max(pLen + 3, cLen - 14);
    const follicularStart = pLen + 1;
    const ovulationWindowStart = Math.max(follicularStart, ovulationDay - 4);
    const follicularEnd = Math.max(pLen, ovulationWindowStart - 1);
    const ovulationWindowEnd = Math.min(cLen - 1, ovulationDay + 1);
    const lutealStart = ovulationWindowEnd + 1;
    const lutealEnd = cLen;

    return {
      menstruation: { startDay: 1, endDay: pLen },
      follicular: { startDay: follicularStart, endDay: follicularEnd },
      ovulation: { startDay: ovulationWindowStart, endDay: ovulationWindowEnd, peakDay: ovulationDay },
      luteal: { startDay: lutealStart, endDay: lutealEnd }
    };
  }

  static getCycleDayAndPhase(targetDateStr, lastPeriodStartStr, cycleLength = 28, periodLength = 5) {
    if (!lastPeriodStartStr || !targetDateStr) {
      return {
        cycleDay: 1,
        totalCycleLength: cycleLength,
        phase: PHASES.FOLLICULAR,
        isEstimated: true,
        daysUntilNextPeriod: cycleLength,
        nextPeriodDate: null,
        boundaries: this.getPhaseBoundaries(cycleLength, periodLength)
      };
    }

    const dayDiff = this.diffInDays(lastPeriodStartStr, targetDateStr);
    const cycleDay = dayDiff + 1;
    const boundaries = this.getPhaseBoundaries(cycleLength, periodLength);

    let phase = PHASES.LUTEAL;
    if (cycleDay <= boundaries.menstruation.endDay) {
      phase = PHASES.MENSTRUATION;
    } else if (cycleDay <= boundaries.follicular.endDay) {
      phase = PHASES.FOLLICULAR;
    } else if (cycleDay <= boundaries.ovulation.endDay) {
      phase = PHASES.OVULATION;
    } else {
      phase = PHASES.LUTEAL;
    }

    const nextPeriodDate = this.addDays(lastPeriodStartStr, cycleLength);
    const daysUntilNextPeriod = this.diffInDays(targetDateStr, nextPeriodDate);

    return {
      cycleDay: Math.max(1, cycleDay),
      totalCycleLength: cycleLength,
      phase,
      isEstimated: cycleDay > periodLength,
      daysUntilNextPeriod,
      nextPeriodDate,
      boundaries
    };
  }

  static getHormoneLevels(cycleDay, cycleLength = 28) {
    const cLen = Math.max(18, cycleLength);
    const day = Math.max(1, Math.min(cycleDay, cLen));
    const ovDay = cLen - 14;

    let estrogen = 0.15;
    if (day <= 5) {
      estrogen = 0.15 + (day / 5) * 0.1;
    } else if (day < ovDay) {
      const progress = (day - 5) / (ovDay - 5);
      estrogen = 0.25 + Math.sin(progress * (Math.PI / 2)) * 0.7;
    } else if (day <= ovDay + 2) {
      estrogen = 0.65;
    } else {
      const lutealProgress = (day - (ovDay + 2)) / (cLen - (ovDay + 2));
      estrogen = 0.35 + Math.sin(lutealProgress * Math.PI) * 0.35;
    }

    let progesterone = 0.05;
    if (day > ovDay) {
      const lutealProgress = (day - ovDay) / (cLen - ovDay);
      progesterone = 0.1 + Math.sin(lutealProgress * Math.PI) * 0.85;
    }

    let lh = 0.1;
    if (Math.abs(day - (ovDay - 1)) <= 1) {
      lh = 0.92;
    } else if (Math.abs(day - ovDay) <= 2) {
      lh = 0.45;
    }

    let fsh = 0.2;
    if (day <= 4) {
      fsh = 0.45;
    } else if (Math.abs(day - (ovDay - 1)) <= 1) {
      fsh = 0.6;
    }

    // Basal Body Temperature (BBT in Celsius)
    let bbt = 36.3;
    if (day > ovDay) {
      bbt = 36.65 + (Math.sin(((day - ovDay) / (cLen - ovDay)) * Math.PI) * 0.15);
    }

    return {
      estrogen: Math.min(1, Math.max(0.05, Number(estrogen.toFixed(2)))),
      progesterone: Math.min(1, Math.max(0.05, Number(progesterone.toFixed(2)))),
      lh: Math.min(1, Math.max(0.05, Number(lh.toFixed(2)))),
      fsh: Math.min(1, Math.max(0.05, Number(fsh.toFixed(2)))),
      bbtCelsius: Number(bbt.toFixed(2)),
      bbtFahrenheit: Number(((bbt * 9/5) + 32).toFixed(2))
    };
  }

  static calculateAnalytics(cycles = [], dailyEntries = {}) {
    const validCycles = (cycles || []).filter(c => c.cycleLength && c.cycleLength >= 18);
    const entriesList = Object.values(dailyEntries || {});

    const avgCycle = validCycles.length > 0
      ? Math.round(validCycles.reduce((s, c) => s + c.cycleLength, 0) / validCycles.length)
      : 28;

    const avgPeriod = validCycles.length > 0
      ? Math.round(validCycles.reduce((s, c) => s + (c.periodLength || 5), 0) / validCycles.length)
      : 5;

    let regularityText = 'Predictable';
    let stdDev = 0;
    if (validCycles.length >= 2) {
      const variance = validCycles.reduce((s, c) => s + Math.pow(c.cycleLength - avgCycle, 2), 0) / validCycles.length;
      stdDev = Math.sqrt(variance);
      if (stdDev <= 1.5) regularityText = 'Highly Consistent';
      else if (stdDev <= 3.5) regularityText = 'Normal Variability';
      else regularityText = 'Variable';
    } else {
      regularityText = 'Awaiting more logs';
    }

    const moodCounts = {};
    let totalEnergySum = 0;
    let energyCount = 0;
    const symptomCounts = {};
    let totalSleepHours = 0;
    let sleepCount = 0;

    entriesList.forEach(entry => {
      if (Array.isArray(entry.mood)) {
        entry.mood.forEach(m => {
          moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
      }
      if (entry.energy) {
        totalEnergySum += Number(entry.energy);
        energyCount++;
      }
      if (entry.sleepHours) {
        totalSleepHours += Number(entry.sleepHours);
        sleepCount++;
      }
      if (Array.isArray(entry.symptoms)) {
        entry.symptoms.forEach(s => {
          if (s !== 'None') {
            symptomCounts[s] = (symptomCounts[s] || 0) + 1;
          }
        });
      }
    });

    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Calm';
    const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None logged';
    const avgEnergy = energyCount > 0 ? (totalEnergySum / energyCount).toFixed(1) : '3.8';
    const avgSleep = sleepCount > 0 ? (totalSleepHours / sleepCount).toFixed(1) : '7.8';

    return {
      totalCycles: validCycles.length,
      avgCycleLength: avgCycle,
      avgPeriodLength: avgPeriod,
      regularity: regularityText,
      stdDev: stdDev.toFixed(1),
      topMood,
      topSymptom,
      avgEnergy,
      avgSleep,
      moodCounts,
      symptomCounts,
      cycleHistory: validCycles.slice(-8).map(c => ({
        startDate: c.startDate,
        endDate: c.endDate,
        cycleLength: c.cycleLength,
        periodLength: c.periodLength || 5
      }))
    };
  }

  static generateSmartObservations(analytics, currentPhase) {
    const observations = [];

    if (analytics.totalCycles >= 2) {
      if (Number(analytics.stdDev) <= 2.0) {
        observations.push({
          icon: 'calendar',
          text: 'Your recent cycle lengths have been very steady and predictable.'
        });
      } else {
        observations.push({
          icon: 'sparkles',
          text: 'Cycle length variation is natural and commonly influenced by rest, travel, and everyday stress.'
        });
      }
    } else {
      observations.push({
        icon: 'calendar',
        text: 'Logging your period starts over 2–3 cycles helps make estimated timelines more personalized.'
      });
    }

    if (analytics.topMood && analytics.topMood !== 'Calm') {
      observations.push({
        icon: 'heart',
        text: `Your most frequently logged feeling recently has been "${analytics.topMood}".`
      });
    }

    if (currentPhase === PHASES.FOLLICULAR || currentPhase === PHASES.OVULATION) {
      observations.push({
        icon: 'zap',
        text: 'Many people notice higher energy and increased social motivation during these cycle days.'
      });
    } else if (currentPhase === PHASES.LUTEAL) {
      observations.push({
        icon: 'moon',
        text: 'Your pattern suggests restful pacing, hydration, and gentle routines may feel especially supportive right now.'
      });
    }

    return observations;
  }

  /**
   * Detect unlogged gap days between the last logged entry (or lastPeriodStart) and today.
   * Perfect for users who don't check in every single day!
   */
  static detectLoggingGaps(dailyEntries = {}, lastPeriodStart, todayStr) {
    if (!lastPeriodStart || !todayStr) return { hasGap: false, gapDates: [], missedCount: 0 };

    const loggedDates = Object.keys(dailyEntries).filter(d => {
      const e = dailyEntries[d];
      return e && (
        (e.mood && e.mood.length > 0) ||
        (e.symptoms && e.symptoms.length > 0 && !e.symptoms.includes('None')) ||
        (e.flow && e.flow !== 'None') ||
        e.energy || e.sleepHours || e.notes
      );
    }).sort();

    // Check recent gap window (up to last 14 days)
    const gapDates = [];
    const maxLookbackDays = 14;
    for (let i = 1; i <= maxLookbackDays; i++) {
      const checkDate = this.addDays(todayStr, -i);
      if (!checkDate) break;
      if (this.diffInDays(lastPeriodStart, checkDate) < 0) break; // Don't check before period start

      if (!dailyEntries[checkDate]) {
        gapDates.unshift(checkDate);
      }
    }

    const lastActiveDate = loggedDates.length > 0 ? loggedDates[loggedDates.length - 1] : lastPeriodStart;
    const daysSinceLastLog = this.diffInDays(lastActiveDate, todayStr);

    return {
      hasGap: gapDates.length > 0 && daysSinceLastLog >= 2,
      gapDates,
      missedCount: gapDates.length,
      lastActiveDate,
      daysSinceLastLog
    };
  }

  /**
   * Generates a biologically estimated entry for an unlogged date based on where it falls in the cycle.
   */
  static generatePredictedEntryForDate(dateStr, lastPeriodStart, avgCycleLength = 28, avgPeriodLength = 5) {
    const cycleInfo = this.getCycleDayAndPhase(dateStr, lastPeriodStart, avgCycleLength, avgPeriodLength);
    const phase = cycleInfo.phase;

    let mood = ['Calm'];
    let energy = 3;
    let symptoms = ['None'];
    let flow = 'None';
    let cravings = [];

    if (phase === PHASES.MENSTRUATION) {
      mood = ['Marupok / Soft', 'Tired / Antukin'];
      energy = 2;
      flow = cycleInfo.cycleDay <= 2 ? 'Medium' : 'Light';
      symptoms = ['Cramps (Puson)', 'Pagod'];
      cravings = ['Mainit na Sinigang', 'Tsokolate'];
    } else if (phase === PHASES.FOLLICULAR) {
      mood = ['✨ Sunkissed & Jolly', '🎨 Creative Vibe'];
      energy = 4;
      cravings = ['Fresh Mangga / Fruit', 'Iced Matcha'];
    } else if (phase === PHASES.OVULATION) {
      mood = ['🥰 Kilig & In Love', '✨ Confident'];
      energy = 5;
      cravings = ['Fresh Buko Juice', 'Pakwan'];
    } else if (phase === PHASES.LUTEAL) {
      mood = ['😾 Spicy / Maldita Mode', '🧸 Cozy / Bahay Lang'];
      energy = 3;
      symptoms = ['Mild bloating', 'Sweet cravings'];
      cravings = ['🧋 Boba Milk Tea', 'Fries'];
    }

    return {
      date: dateStr,
      mood,
      energy,
      sleepHours: 8.0,
      sleepQuality: 'Good',
      symptoms,
      flow,
      cravings,
      isAutoEstimated: true,
      notes: `Auto-predicted based on Cycle Day ${cycleInfo.cycleDay} (${PHASE_META[phase]?.title || 'Cycle'}).`
    };
  }
}

