/**
 * PrincessCycle - Main Application Coordinator & Router
 * Wires State, Storage, Calculations, Views, Modals, Sleep Schedule, Fairy Sparkles, Relaxation Audio & PWA Lifecycle
 */

import { store } from './state.js';
import { storage } from './storage.js';
import { Validation } from './validation.js';
import { CycleEngine, PHASE_META, PHASES } from './cycle.js';
import { SleepScheduleEngine } from './sleep.js';
import { fairySparkles } from './sparkles.js';
import { AffirmationManager } from './affirmations.js';
import { UI } from './ui.js';
import { CalendarController } from './calendar.js';
import { InsightsController } from './insights.js';
import { HistoryController } from './history.js';
import { SharingController } from './sharing.js';
import { Notifications } from './notifications.js';
import { soundFx } from './audio.js';
import { relaxationPacer } from './relaxation.js';
import { PrivacyLock } from './privacy-lock.js';
import { generateDemoData } from './demo-data.js';

class PrincessCycleApp {
  constructor() {
    this.calendarCtrl = null;
    this.insightsCtrl = null;
    this.historyCtrl = null;
    this.sharingCtrl = null;
    this.privacyLock = null;
    this.sleepEngine = null;
    this.activeLogDate = store.formatDate(new Date());
    this.activePhaseTab = 'follicular';
  }

  async init() {
    console.log('🌸 Initializing PrincessCycle (Lilac Dream Edition)...');

    // 1. Initialize Storage & Load Saved Data
    await storage.init();
    const savedData = await storage.loadAllData();

    if (savedData.user) {
      store.setState(s => ({
        ...s,
        user: { ...s.user, ...savedData.user },
        cycles: savedData.cycles || [],
        dailyEntries: savedData.dailyEntries || {},
        isLoading: false
      }));
    } else {
      store.setState(s => ({ ...s, isLoading: false }));
    }

    // 2. Setup Audio, Privacy Lock, Fairy Sparkles & Sleep Engine
    const soundEnabled = store.getState().user?.soundEffectsEnabled !== false;
    soundFx.setSoundFxEnabled(soundEnabled);

    try {
      fairySparkles.init();
    } catch (e) {}

    this.privacyLock = new PrivacyLock(store);
    this.privacyLock.init();

    this.sleepEngine = new SleepScheduleEngine(store);

    // 3. Setup Controllers
    this.calendarCtrl = new CalendarController(
      store,
      (dateStr) => this.openDailyCheckin(dateStr),
      async (dateStr) => this.handleMarkPeriodStart(dateStr)
    );

    this.insightsCtrl = new InsightsController(store);

    this.historyCtrl = new HistoryController(
      store,
      async (newCycle) => {
        const state = store.getState();
        const updatedCycles = [newCycle, ...(state.cycles || [])];
        store.setCycles(updatedCycles);
        await storage.saveAllData(store.getState());
        soundFx.playChime('sparkle');
        UI.showToast('Past cycle memory saved! 🌸', 'success');
        this.historyCtrl.render(document.getElementById('history-mount-point'));
      },
      async (cycleId) => {
        const state = store.getState();
        const updatedCycles = (state.cycles || []).filter(c => c.id !== cycleId);
        store.setCycles(updatedCycles);
        await storage.saveAllData(store.getState());
        UI.showToast('Cycle record removed.', 'info');
        this.historyCtrl.render(document.getElementById('history-mount-point'));
      }
    );

    this.sharingCtrl = new SharingController(store, async (patch) => {
      store.setUserProfile(patch);
      await storage.saveAllData(store.getState());
      this.sharingCtrl.render(document.getElementById('sharing-mount-point'));
      UI.showToast('Sharing settings updated ✨', 'info');
    });

    // 4. Apply Theme Preference
    const currentTheme = store.getState().user?.theme || 'system';
    UI.applyTheme(currentTheme);

    // 5. Wire Global Navigation & UI Events
    this.wireNavigation();
    this.wireHomeQuickLogs();
    this.wirePhaseTabs();
    this.wirePeriodTodayButton();
    this.wireSleepTrackingActions();
    this.wireRelaxationTriggers();
    this.wireAffirmationsAndSpicyMode();
    this.wireHydrationAndCrystal();
    this.wireCheckinSheet();
    this.wireSettingsEvents();
    this.wirePWA();

    // 6. Morning Smart Wake Detection Check
    this.sleepEngine.checkMorningWakeDetection((detectedTime, todayStr) => {
      const banner = document.getElementById('smart-wake-banner');
      const timeLabel = document.getElementById('detected-wake-time-text');
      if (banner && timeLabel) {
        timeLabel.textContent = `${detectedTime}`;
        banner.style.display = 'block';

        const confirmBtn = document.getElementById('btn-confirm-wake-time');
        const dismissBtn = document.getElementById('btn-dismiss-wake-banner');

        if (confirmBtn) {
          confirmBtn.onclick = async () => {
            this.sleepEngine.confirmWakeTimeNow(detectedTime, todayStr);
            await storage.saveAllData(store.getState());
            soundFx.playChime('sparkle');
            UI.showToast(`Wake time recorded: ${detectedTime} ☀️ Have the sweetest day!`, 'success');
            banner.style.display = 'none';
            this.renderCurrentView();
          };
        }

        if (dismissBtn) {
          dismissBtn.onclick = () => {
            banner.style.display = 'none';
          };
        }
      }
    });

    // 7. Check Onboarding Status
    const user = store.getState().user;
    if (!user.onboardingComplete || !user.lastPeriodStart) {
      this.startOnboardingFlow();
    } else {
      this.renderCurrentView();
    }

    store.subscribe('stateChanged', async () => {
      await storage.saveAllData(store.getState());
    });

    store.subscribe('calendarMonthChanged', ({ month, year }) => {
      this.calendarCtrl.render(document.getElementById('calendar-mount-point'), month, year);
    });

    const { avgCycleLength, avgPeriodLength } = CycleEngine.getEffectiveCycleMetrics(user, store.getState().cycles);
    const cycleInfo = CycleEngine.getCycleDayAndPhase(store.formatDate(new Date()), user.lastPeriodStart, avgCycleLength, avgPeriodLength);
    const reminder = Notifications.checkUpcomingPeriodReminder(cycleInfo);
    if (reminder && user.notifications?.enabled) {
      Notifications.sendGentleNotification(reminder.title, reminder.body);
    }
  }

  // Affirmations & Spicy Mode Comfort Kit
  wireAffirmationsAndSpicyMode() {
    const affCard = document.getElementById('daily-affirmation-card');
    const affQuote = document.getElementById('affirmation-quote');
    const affBadge = document.getElementById('affirmation-badge');
    const affTip = document.getElementById('affirmation-tip');

    const updateAffirmation = () => {
      const aff = AffirmationManager.getDailyAffirmation();
      if (affQuote) affQuote.textContent = `"${aff.quote}"`;
      if (affBadge) affBadge.textContent = aff.vibe;
      if (affTip) affTip.textContent = aff.tip;
    };
    updateAffirmation();

    if (affCard) {
      affCard.addEventListener('click', (e) => {
        soundFx.playChime('sparkle');
        fairySparkles.burst(e.clientX, e.clientY, 15);
        UI.showToast('You are doing wonderful, Princess 💜', 'info', 2000);
      });
    }

    // Spicy Mode Modal
    const headerSpicyBtn = document.getElementById('header-spicy-btn');
    const sidebarSpicyBtn = document.getElementById('sidebar-spicy-btn');
    const spicyModal = document.getElementById('spicy-modal-backdrop');
    const closeSpicyBtn = document.getElementById('close-spicy-btn');
    const refreshSpicyBtn = document.getElementById('btn-spicy-refresh-tip');
    const spicyTipBox = document.getElementById('spicy-tip-box');

    const openSpicyModal = () => {
      if (spicyTipBox) spicyTipBox.textContent = AffirmationManager.getRandomSpicyTip();
      if (spicyModal) spicyModal.classList.add('active');
      soundFx.playChime('tap');
    };

    const closeSpicyModal = () => {
      if (spicyModal) spicyModal.classList.remove('active');
    };

    if (headerSpicyBtn) headerSpicyBtn.addEventListener('click', openSpicyModal);
    if (sidebarSpicyBtn) sidebarSpicyBtn.addEventListener('click', openSpicyModal);
    if (closeSpicyBtn) closeSpicyBtn.addEventListener('click', closeSpicyModal);
    if (spicyModal) spicyModal.addEventListener('click', (e) => {
      if (e.target === spicyModal) closeSpicyModal();
    });

    if (refreshSpicyBtn) {
      refreshSpicyBtn.addEventListener('click', () => {
        if (spicyTipBox) spicyTipBox.textContent = AffirmationManager.getRandomSpicyTip();
        soundFx.playChime('sparkle');
      });
    }
  }

  // Daily Hydration Sanctuary & Lucky Crystal
  wireHydrationAndCrystal() {
    const crystals = [
      { name: 'Amethyst of Serenity 🔮', desc: 'Lucky Color: Lilac Lavender • Enhances calm, peace, intuition, and gentle cramp relief.', icon: '🔮' },
      { name: 'Rose Quartz of Self-Love 🌸', desc: 'Lucky Color: Pastel Rose • Radiates tenderness, emotional healing, and gentle self-compassion.', icon: '🌸' },
      { name: 'Moonstone of Intuition 🌙', desc: 'Lucky Color: Pearl Silver • Harmonizes with your body\'s natural lunar flow and deep dreams.', icon: '🌙' },
      { name: 'Sunlit Citrine of Joy ☀️', desc: 'Lucky Color: Golden Honey • Sparks sunny energy, infectious laughter, and creative confidence.', icon: '☀️' },
      { name: 'Aquamarine of Tranquility 🌊', desc: 'Lucky Color: Sky Pastel • Soothes spicy moments, cooling tension and bringing gentle clarity.', icon: '🌊' },
      { name: 'Opal of Creative Magic ✨', desc: 'Lucky Color: Iridescent Pink • Inspires artistic expression, journaling, and daydreaming.', icon: '✨' }
    ];

    const dayOfMonth = new Date().getDate();
    const crystal = crystals[dayOfMonth % crystals.length];

    const iconEl = document.getElementById('daily-crystal-icon');
    const nameEl = document.getElementById('daily-crystal-name');
    const descEl = document.getElementById('daily-crystal-desc');

    if (iconEl) iconEl.textContent = crystal.icon;
    if (nameEl) nameEl.textContent = crystal.name;
    if (descEl) descEl.textContent = crystal.desc;

    const dropletsContainer = document.getElementById('water-droplets-container');
    if (!dropletsContainer) return;

    dropletsContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('.water-glass-btn');
      if (!btn) return;

      const glassNum = Number(btn.getAttribute('data-glass'));
      const todayStr = store.formatDate(new Date());
      const state = store.getState();
      const entry = state.dailyEntries[todayStr] || {};
      const currentGlasses = entry.waterGlasses || 0;

      const newGlasses = currentGlasses === glassNum ? glassNum - 1 : glassNum;

      store.setDailyEntry(todayStr, {
        ...entry,
        waterGlasses: newGlasses
      });

      await storage.saveAllData(store.getState());
      soundFx.playChime('sparkle');

      if (newGlasses === 8) {
        fairySparkles.burst(e.clientX, e.clientY, 25);
        UI.showToast('🎉 Hydration Goal Achieved! 8 glasses of water logged! Glow on, Princess 💧', 'success', 3500);
      } else {
        UI.showToast(`Logged ${newGlasses} / 8 glasses of water 💧`, 'info', 1500);
      }

      this.updateHydrationUI(newGlasses);
    });
  }

  updateHydrationUI(glasses) {
    const textEl = document.getElementById('water-progress-text');
    if (textEl) {
      textEl.textContent = `${glasses} / 8 Glasses (${Math.round((glasses / 8) * 100)}%)`;
    }

    const buttons = document.querySelectorAll('.water-glass-btn');
    buttons.forEach(btn => {
      const g = Number(btn.getAttribute('data-glass'));
      if (g <= glasses) {
        btn.textContent = '💧';
        btn.classList.add('active');
        btn.style.filter = 'drop-shadow(0 2px 6px rgba(144, 97, 249, 0.5))';
      } else {
        btn.textContent = '🥛';
        btn.classList.remove('active');
        btn.style.filter = 'none';
      }
    });
  }

  // Sleep Bedtime Quick Action
  wireSleepTrackingActions() {
    const handleGoodnight = async () => {
      const bedtimeStr = this.sleepEngine.recordBedtimeNow();
      await storage.saveAllData(store.getState());
      soundFx.playChime('breath-out');
      UI.showToast(`Bedtime logged at ${bedtimeStr}. Sweet dreams, beautiful artist 🌙`, 'info', 4000);
    };

    const headerGoodnightBtn = document.getElementById('header-goodnight-btn');
    const sidebarGoodnightBtn = document.getElementById('sidebar-goodnight-btn');

    if (headerGoodnightBtn) headerGoodnightBtn.addEventListener('click', handleGoodnight);
    if (sidebarGoodnightBtn) sidebarGoodnightBtn.addEventListener('click', handleGoodnight);
  }

  // Navigation Routing Handler
  wireNavigation() {
    const navLinks = document.querySelectorAll('[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewTarget = link.getAttribute('data-view');
        this.navigateTo(viewTarget);
      });
    });

    const headerSettingsBtn = document.getElementById('header-settings-btn');
    if (headerSettingsBtn) {
      headerSettingsBtn.addEventListener('click', () => {
        this.navigateTo('settings');
      });
    }

    const fabLogBtn = document.getElementById('btn-fab-log');
    if (fabLogBtn) {
      fabLogBtn.addEventListener('click', () => {
        this.openDailyCheckin(store.formatDate(new Date()));
      });
    }

    const heroLogBtn = document.getElementById('btn-quick-log-hero');
    if (heroLogBtn) {
      heroLogBtn.addEventListener('click', () => {
        this.openDailyCheckin(store.formatDate(new Date()));
      });
    }

    const openFullLogBtn = document.getElementById('btn-open-full-log');
    if (openFullLogBtn) {
      openFullLogBtn.addEventListener('click', () => {
        this.openDailyCheckin(store.formatDate(new Date()));
      });
    }
  }

  // Relaxation / Breathing Pacer triggers
  wireRelaxationTriggers() {
    const headerPacerBtn = document.getElementById('header-pacer-btn');
    const sidebarPacerBtn = document.getElementById('sidebar-pacer-btn');

    if (headerPacerBtn) {
      headerPacerBtn.addEventListener('click', () => relaxationPacer.showModal());
    }
    if (sidebarPacerBtn) {
      sidebarPacerBtn.addEventListener('click', () => relaxationPacer.showModal());
    }
  }

  navigateTo(viewName) {
    store.setCurrentView(viewName);

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });
    document.querySelectorAll('.sidebar-link').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    const state = store.getState();
    const currentView = state.currentView;

    if (currentView === 'home') {
      this.renderHomeDashboard();
    } else if (currentView === 'calendar') {
      this.calendarCtrl.render(
        document.getElementById('calendar-mount-point'),
        state.viewingMonth,
        state.viewingYear
      );
    } else if (currentView === 'insights') {
      this.insightsCtrl.render(document.getElementById('insights-mount-point'));
    } else if (currentView === 'history') {
      this.historyCtrl.render(document.getElementById('history-mount-point'));
    } else if (currentView === 'sharing') {
      this.sharingCtrl.render(document.getElementById('sharing-mount-point'));
    } else if (currentView === 'settings') {
      this.renderSettingsView();
    }
  }

  renderHomeDashboard() {
    const state = store.getState();
    const user = state.user;
    const todayStr = store.formatDate(new Date());

    const greetingEl = document.getElementById('greeting-title');
    if (greetingEl) {
      greetingEl.textContent = UI.getGreeting(user.name || 'Princess');
    }

    const { avgCycleLength, avgPeriodLength } = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const cycleInfo = CycleEngine.getCycleDayAndPhase(todayStr, user.lastPeriodStart, avgCycleLength, avgPeriodLength);
    const phaseMeta = PHASE_META[cycleInfo.phase] || PHASE_META[PHASES.FOLLICULAR];

    const dialContainer = document.getElementById('hero-dial-container');
    if (dialContainer) {
      dialContainer.innerHTML = UI.renderCycleDial(cycleInfo.cycleDay, cycleInfo.totalCycleLength, cycleInfo.phase);
    }

    const phaseBadge = document.getElementById('hero-phase-badge');
    if (phaseBadge) {
      phaseBadge.className = `badge ${phaseMeta.badgeClass}`;
      phaseBadge.textContent = phaseMeta.title;
    }

    const phaseTag = document.getElementById('hero-phase-tag');
    if (phaseTag) {
      phaseTag.className = cycleInfo.isEstimated ? 'tag-estimated' : 'tag-logged';
      phaseTag.textContent = cycleInfo.isEstimated ? 'Estimated' : 'Logged Period';
    }

    const nextPeriodEl = document.getElementById('hero-next-period-text');
    if (nextPeriodEl) {
      if (cycleInfo.daysUntilNextPeriod !== null) {
        if (cycleInfo.daysUntilNextPeriod > 0) {
          nextPeriodEl.textContent = `Estimated in ${cycleInfo.daysUntilNextPeriod} days ✨`;
        } else if (cycleInfo.daysUntilNextPeriod === 0) {
          nextPeriodEl.textContent = `Estimated today 🌸`;
        } else {
          nextPeriodEl.textContent = `Expected ${Math.abs(cycleInfo.daysUntilNextPeriod)} days ago`;
        }
      } else {
        nextPeriodEl.textContent = 'Log period start to estimate';
      }
    }

    this.activePhaseTab = cycleInfo.phase;
    this.updatePhaseTabContent(this.activePhaseTab);

    const todayEntry = state.dailyEntries[todayStr] || {};
    const selectedMoods = todayEntry.mood || [];

    const chips = document.querySelectorAll('#quick-mood-chips .chip');
    chips.forEach(chip => {
      const moodName = chip.getAttribute('data-mood');
      chip.classList.toggle('active', selectedMoods.includes(moodName));
    });

    this.updateHydrationUI(todayEntry.waterGlasses || 0);

    this.checkMissedDaysGap(state, user, todayStr, avgCycleLength, avgPeriodLength);
  }

  checkMissedDaysGap(state, user, todayStr, avgCycleLength, avgPeriodLength) {
    const banner = document.getElementById('missed-days-catchup-banner');
    if (!banner) return;

    if (this.dismissedCatchupSession) {
      banner.style.display = 'none';
      return;
    }

    const gapResult = CycleEngine.detectLoggingGaps(state.dailyEntries, user.lastPeriodStart, todayStr);
    if (gapResult.hasGap && gapResult.gapDates.length > 0) {
      const cycleInfo = CycleEngine.getCycleDayAndPhase(todayStr, user.lastPeriodStart, avgCycleLength, avgPeriodLength);
      const textEl = document.getElementById('missed-days-text');
      if (textEl) {
        textEl.textContent = `You missed ${gapResult.missedCount} check-in ${gapResult.missedCount === 1 ? 'day' : 'days'}, but your rhythm is on track! Today is Cycle Day ${cycleInfo.cycleDay} (${PHASE_META[cycleInfo.phase]?.title || 'Cycle'}).`;
      }
      banner.style.display = 'block';

      const autofillBtn = document.getElementById('btn-autofill-missed-days');
      const dismissBtn = document.getElementById('btn-dismiss-catchup');

      if (autofillBtn) {
        autofillBtn.onclick = async () => {
          gapResult.gapDates.forEach(dateStr => {
            const pred = CycleEngine.generatePredictedEntryForDate(dateStr, user.lastPeriodStart, avgCycleLength, avgPeriodLength);
            store.setDailyEntry(dateStr, pred);
          });
          await storage.saveAllData(store.getState());
          soundFx.playChime('sparkle');
          UI.showToast(`✨ Auto-filled ${gapResult.missedCount} missed days with estimated vibes!`, 'success');
          banner.style.display = 'none';
          this.dismissedCatchupSession = true;
          this.renderCurrentView();
        };
      }

      if (dismissBtn) {
        dismissBtn.onclick = () => {
          banner.style.display = 'none';
          this.dismissedCatchupSession = true;
        };
      }
    } else {
      banner.style.display = 'none';
    }
  }

  wirePhaseTabs() {
    const tabsContainer = document.getElementById('phase-tabs-container');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.phase-tab-btn');
      if (!btn) return;

      const phaseKey = btn.getAttribute('data-phase');
      this.activePhaseTab = phaseKey;

      tabsContainer.querySelectorAll('.phase-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      this.updatePhaseTabContent(phaseKey);
      soundFx.playChime('tap');
    });
  }

  updatePhaseTabContent(phaseKey) {
    const meta = PHASE_META[phaseKey] || PHASE_META[PHASES.FOLLICULAR];

    const guideTitle = document.getElementById('phase-guide-title');
    const guideSubtitle = document.getElementById('phase-guide-subtitle');
    const guideBadge = document.getElementById('phase-guide-badge');
    const guideDesc = document.getElementById('phase-guide-description');
    const guideNutrition = document.getElementById('phase-guide-nutrition');
    const guideMovement = document.getElementById('phase-guide-movement');
    const guideMindset = document.getElementById('phase-guide-mindset');

    if (guideTitle) guideTitle.textContent = meta.title;
    if (guideSubtitle) guideSubtitle.textContent = meta.subtitle;
    if (guideBadge) {
      guideBadge.className = `badge ${meta.badgeClass}`;
      guideBadge.textContent = meta.title;
    }
    if (guideDesc) guideDesc.textContent = `${meta.hormoneSummary} Possible sensations: ${meta.possibleExperiences.join(', ')}.`;
    if (guideNutrition) guideNutrition.textContent = meta.nutrition;
    if (guideMovement) guideMovement.textContent = meta.movement;
    if (guideMindset) guideMindset.textContent = meta.mindset;

    const tabs = document.querySelectorAll('.phase-tab-btn');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-phase') === phaseKey);
    });
  }

  wirePeriodTodayButton() {
    const btn = document.getElementById('btn-period-today-toggle');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const todayStr = store.formatDate(new Date());
      await this.handleMarkPeriodStart(todayStr);
    });
  }

  async handleMarkPeriodStart(dateStr) {
    const state = store.getState();
    const user = state.user;
    const oldStart = user.lastPeriodStart;

    if (oldStart && oldStart !== dateStr) {
      const length = CycleEngine.diffInDays(oldStart, dateStr);
      if (length >= 18 && length <= 60) {
        const newCycle = {
          id: 'cycle_' + Date.now(),
          startDate: oldStart,
          endDate: dateStr,
          cycleLength: length,
          periodLength: user.typicalPeriodLength || 5,
          createdAt: new Date().toISOString()
        };
        store.setCycles([newCycle, ...(state.cycles || [])]);
      }
    }

    store.setUserProfile({ lastPeriodStart: dateStr });

    const existingEntry = state.dailyEntries[dateStr] || {};
    store.setDailyEntry(dateStr, {
      ...existingEntry,
      flow: 'Medium',
      symptoms: existingEntry.symptoms || ['Cramps']
    });

    await storage.saveAllData(store.getState());
    soundFx.playChime('sparkle');
    UI.showToast(`Period started on ${dateStr}. Take extra gentle care today! 🌸`, 'success');
    this.renderCurrentView();
  }

  wireHomeQuickLogs() {
    const chipContainer = document.getElementById('quick-mood-chips');
    if (!chipContainer) return;

    chipContainer.addEventListener('click', async (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      const mood = chip.getAttribute('data-mood');
      const todayStr = store.formatDate(new Date());
      const state = store.getState();
      const currentEntry = state.dailyEntries[todayStr] || {};
      const currentMoods = currentEntry.mood || [];

      let updatedMoods;
      if (currentMoods.includes(mood)) {
        updatedMoods = currentMoods.filter(m => m !== mood);
        chip.classList.remove('active');
      } else {
        updatedMoods = [...currentMoods, mood];
        chip.classList.add('active');
      }

      store.setDailyEntry(todayStr, {
        ...currentEntry,
        mood: updatedMoods
      });

      await storage.saveAllData(store.getState());
      soundFx.playChime('sparkle');
      UI.showToast(`Logged "${mood}" vibe ✨`, 'info', 1600);
    });
  }

  wireCheckinSheet() {
    const backdrop = document.getElementById('checkin-sheet-backdrop');
    const closeBtn = document.getElementById('btn-close-checkin');
    const cancelBtn = document.getElementById('btn-cancel-checkin');
    const saveBtn = document.getElementById('btn-save-checkin');

    const bedtimeInput = document.getElementById('sheet-bedtime');
    const wakeTimeInput = document.getElementById('sheet-waketime');
    const sleepPill = document.getElementById('sheet-sleep-calc-pill');

    const updateSleepPill = () => {
      if (bedtimeInput && wakeTimeInput && sleepPill) {
        const dur = SleepScheduleEngine.calculateSleepDuration(bedtimeInput.value, wakeTimeInput.value);
        if (dur) {
          sleepPill.textContent = dur.formatted;
        }
      }
    };

    if (bedtimeInput) bedtimeInput.addEventListener('change', updateSleepPill);
    if (wakeTimeInput) wakeTimeInput.addEventListener('change', updateSleepPill);

    const closeSheet = () => {
      backdrop.classList.remove('active');
    };

    closeBtn.addEventListener('click', closeSheet);
    cancelBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSheet();
    });

    const moodChips = document.querySelectorAll('#sheet-mood-chips .chip');
    moodChips.forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    const cravingChips = document.querySelectorAll('#sheet-cravings-chips .chip');
    cravingChips.forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    const energyBtns = document.querySelectorAll('#sheet-energy-scale .energy-btn');
    energyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        energyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const flowBtns = document.querySelectorAll('#sheet-flow-selector .flow-btn');
    flowBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        flowBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const fluidChips = document.querySelectorAll('#sheet-fluid-selector .chip');
    fluidChips.forEach(chip => {
      chip.addEventListener('click', () => {
        fluidChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    const symptomChips = document.querySelectorAll('#sheet-symptoms-chips .chip');
    symptomChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-symptom');
        if (val === 'None') {
          symptomChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        } else {
          const noneChip = Array.from(symptomChips).find(c => c.getAttribute('data-symptom') === 'None');
          if (noneChip) noneChip.classList.remove('active');
          chip.classList.toggle('active');
        }
      });
    });

    const qualityChips = document.querySelectorAll('#sheet-sleep-quality .chip');
    qualityChips.forEach(chip => {
      chip.addEventListener('click', () => {
        qualityChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    saveBtn.addEventListener('click', async () => {
      const selectedMoods = Array.from(document.querySelectorAll('#sheet-mood-chips .chip.active'))
        .map(c => c.getAttribute('data-mood'));

      const selectedCravings = Array.from(document.querySelectorAll('#sheet-cravings-chips .chip.active'))
        .map(c => c.getAttribute('data-craving'));

      const activeEnergyBtn = document.querySelector('#sheet-energy-scale .energy-btn.active');
      const energy = activeEnergyBtn ? Number(activeEnergyBtn.getAttribute('data-energy')) : 3;

      const activeFlowBtn = document.querySelector('#sheet-flow-selector .flow-btn.active');
      const flow = activeFlowBtn ? activeFlowBtn.getAttribute('data-flow') : 'None';

      const activeFluidChip = document.querySelector('#sheet-fluid-selector .chip.active');
      const cervicalFluid = activeFluidChip ? activeFluidChip.getAttribute('data-fluid') : 'Dry';

      const bbtVal = document.getElementById('sheet-bbt').value;
      const bbt = bbtVal ? Number(bbtVal) : null;

      const selectedSymptoms = Array.from(document.querySelectorAll('#sheet-symptoms-chips .chip.active'))
        .map(c => c.getAttribute('data-symptom'));

      const bedtime = bedtimeInput ? bedtimeInput.value : '23:00';
      const wakeTime = wakeTimeInput ? wakeTimeInput.value : '07:00';
      const sleepDur = SleepScheduleEngine.calculateSleepDuration(bedtime, wakeTime);
      const sleepHours = sleepDur ? sleepDur.hours : 8;

      const activeQualityChip = document.querySelector('#sheet-sleep-quality .chip.active');
      const sleepQuality = activeQualityChip ? activeQualityChip.getAttribute('data-quality') : 'Good';

      const rawNotes = document.getElementById('sheet-notes').value;
      const notes = Validation.sanitizeText(rawNotes);

      store.setDailyEntry(this.activeLogDate, {
        mood: selectedMoods,
        cravings: selectedCravings,
        energy,
        flow,
        bbt,
        cervicalFluid,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['None'],
        bedtime,
        wakeTime,
        sleepHours,
        sleepQuality,
        notes
      });

      await storage.saveAllData(store.getState());
      soundFx.playChime('sparkle');
      closeSheet();
      UI.showToast('Check-in saved in your private journal ✨', 'success');
      this.renderCurrentView();
    });
  }

  openDailyCheckin(dateStr) {
    this.activeLogDate = dateStr;
    const backdrop = document.getElementById('checkin-sheet-backdrop');
    const titleDate = document.getElementById('checkin-sheet-date');
    const todayStr = store.formatDate(new Date());

    if (titleDate) {
      titleDate.textContent = dateStr === todayStr ? 'Today 🌸' : dateStr;
    }

    const state = store.getState();
    const entry = state.dailyEntries[dateStr] || {};

    const currentMoods = entry.mood || [];
    document.querySelectorAll('#sheet-mood-chips .chip').forEach(chip => {
      chip.classList.toggle('active', currentMoods.includes(chip.getAttribute('data-mood')));
    });

    const currentCravings = entry.cravings || [];
    document.querySelectorAll('#sheet-cravings-chips .chip').forEach(chip => {
      chip.classList.toggle('active', currentCravings.includes(chip.getAttribute('data-craving')));
    });

    const currentEnergy = entry.energy || 3;
    document.querySelectorAll('#sheet-energy-scale .energy-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-energy')) === currentEnergy);
    });

    const currentFlow = entry.flow || 'None';
    document.querySelectorAll('#sheet-flow-selector .flow-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-flow') === currentFlow);
    });

    document.getElementById('sheet-bbt').value = entry.bbt || '';

    const currentFluid = entry.cervicalFluid || 'Dry';
    document.querySelectorAll('#sheet-fluid-selector .chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-fluid') === currentFluid);
    });

    const currentSymptoms = entry.symptoms || [];
    document.querySelectorAll('#sheet-symptoms-chips .chip').forEach(chip => {
      chip.classList.toggle('active', currentSymptoms.includes(chip.getAttribute('data-symptom')));
    });

    const bedtimeInput = document.getElementById('sheet-bedtime');
    const wakeTimeInput = document.getElementById('sheet-waketime');
    const sleepPill = document.getElementById('sheet-sleep-calc-pill');

    if (bedtimeInput) bedtimeInput.value = entry.bedtime || '23:00';
    if (wakeTimeInput) wakeTimeInput.value = entry.wakeTime || '07:00';

    const dur = SleepScheduleEngine.calculateSleepDuration(
      entry.bedtime || '23:00',
      entry.wakeTime || '07:00'
    );
    if (sleepPill && dur) {
      sleepPill.textContent = dur.formatted;
    }

    const currentQuality = entry.sleepQuality || 'Good';
    document.querySelectorAll('#sheet-sleep-quality .chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-quality') === currentQuality);
    });

    document.getElementById('sheet-notes').value = entry.notes || '';

    backdrop.classList.add('active');
  }

  wireSettingsEvents() {
    const themeButtons = document.querySelectorAll('#theme-selector-group button');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const themeVal = btn.getAttribute('data-theme-val');
        store.setUserProfile({ theme: themeVal });
        UI.applyTheme(themeVal);
        soundFx.playChime('sparkle');
        UI.showToast(`Theme set to ${themeVal} ✨`, 'info');
        this.renderCurrentView();
      });
    });

    // Ambient Sound Selector
    const ambientButtons = document.querySelectorAll('#ambient-sound-group button');
    ambientButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        ambientButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ambientType = btn.getAttribute('data-ambient');
        if (ambientType === 'off') {
          soundFx.stopAmbient();
          UI.showToast('Ambience muted.', 'info');
        } else {
          soundFx.startAmbient(ambientType);
          UI.showToast(`Playing ${ambientType === 'rain' ? 'Gentle Rain' : 'Soft Waves'} 🌧️`, 'info');
        }
      });
    });

    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.checked = store.getState().user?.soundEffectsEnabled !== false;
      soundToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        soundFx.setSoundFxEnabled(enabled);
        store.setUserProfile({ soundEffectsEnabled: enabled });
        if (enabled) soundFx.playChime('sparkle');
        UI.showToast(enabled ? 'Fairy chimes enabled ✨' : 'Chimes muted.', 'info');
      });
    }

    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', async () => {
        const name = document.getElementById('setting-name').value.trim() || 'Princess';
        const cycleLen = Number(document.getElementById('setting-cycle-length').value);
        const periodLen = Number(document.getElementById('setting-period-length').value);
        const lastPeriod = document.getElementById('setting-last-period').value;

        if (!Validation.isValidCycleLength(cycleLen)) {
          alert('Typical cycle length must be between 18 and 60 days.');
          return;
        }
        if (!Validation.isValidPeriodLength(periodLen, cycleLen)) {
          alert('Typical period length must be between 1 and 15 days.');
          return;
        }

        store.setUserProfile({
          name: Validation.sanitizeText(name),
          typicalCycleLength: cycleLen,
          typicalPeriodLength: periodLen,
          lastPeriodStart: lastPeriod
        });

        await storage.saveAllData(store.getState());
        soundFx.playChime('sparkle');
        UI.showToast('Preferences saved ✨', 'success');
        this.renderCurrentView();
      });
    }

    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        storage.exportAsJSON(store.getState());
        UI.showToast('JSON backup exported.', 'success');
      });
    }

    const exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        try {
          storage.exportAsCSV(store.getState());
          UI.showToast('CSV logs exported.', 'success');
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const importFileInput = document.getElementById('import-json-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const importedPayload = await storage.importFromJSON(event.target.result);
            store.setState(s => ({
              ...s,
              user: importedPayload.user,
              cycles: importedPayload.cycles || [],
              dailyEntries: importedPayload.dailyEntries || {}
            }));
            await storage.saveAllData(store.getState());
            soundFx.playChime('sparkle');
            UI.showToast('Backup restored successfully! ✨', 'success');
            this.renderCurrentView();
          } catch (err) {
            alert('Import Error: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    const loadDemoBtn = document.getElementById('btn-load-demo-data');
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', async () => {
        const confirmed = confirm('Load realistic fictional demo data? This will give you full beautiful charts!');
        if (confirmed) {
          const demo = generateDemoData();
          store.setState(s => ({
            ...s,
            user: demo.user,
            cycles: demo.cycles,
            dailyEntries: demo.dailyEntries
          }));
          await storage.saveAllData(store.getState());
          soundFx.playChime('sparkle');
          UI.showToast('Demo data loaded! Enjoy exploring 🌸', 'success');
          this.navigateTo('home');
        }
      });
    }

    const wipeDataBtn = document.getElementById('btn-wipe-data');
    if (wipeDataBtn) {
      wipeDataBtn.addEventListener('click', async () => {
        const confirmed1 = confirm('Delete all data permanently? This action cannot be undone.');
        if (confirmed1) {
          const confirmed2 = confirm('Please confirm once more: All cycle records, notes, and preferences will be permanently wiped from this device.');
          if (confirmed2) {
            await storage.wipeAllData();
            store.setState({
              user: {
                id: 'user_default',
                name: 'Princess',
                typicalCycleLength: 28,
                typicalPeriodLength: 5,
                lastPeriodStart: null,
                trackedCategories: ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
                onboardingComplete: false,
                theme: 'system',
                soundEffectsEnabled: true,
                partnerSharing: { enabled: false },
                notifications: { enabled: false }
              },
              cycles: [],
              dailyEntries: {},
              currentView: 'home',
              selectedDate: store.formatDate(new Date()),
              viewingMonth: new Date().getMonth(),
              viewingYear: new Date().getFullYear(),
              isLoading: false
            });
            UI.showToast('All local data wiped.', 'info');
            this.startOnboardingFlow();
          }
        }
      });
    }
  }

  renderSettingsView() {
    const user = store.getState().user;
    document.getElementById('setting-name').value = user.name || 'Princess';
    document.getElementById('setting-cycle-length').value = user.typicalCycleLength || 28;
    document.getElementById('setting-period-length').value = user.typicalPeriodLength || 5;
    document.getElementById('setting-last-period').value = user.lastPeriodStart || '';

    const theme = user.theme || 'system';
    document.querySelectorAll('#theme-selector-group button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });

    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.checked = user.soundEffectsEnabled !== false;
    }
  }

  // 7-Step Guided Onboarding Flow
  startOnboardingFlow() {
    const backdrop = document.getElementById('onboarding-modal-backdrop');
    const container = document.getElementById('onboarding-container');
    backdrop.classList.add('active');

    let currentStep = 1;
    const totalSteps = 7;
    const onboardState = {
      name: 'Princess',
      lastPeriodStart: store.formatDate(new Date()),
      typicalCycleLength: 28,
      typicalPeriodLength: 5,
      trackedCategories: ['mood', 'symptoms', 'energy', 'sleep', 'cravings', 'flow', 'notes'],
      partnerSharing: false
    };

    const renderStep = () => {
      let stepHtml = '';

      if (currentStep === 1) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">Welcome</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 1 of 7 ✨</span>
          </div>
          <div class="sheet-body text-center" style="padding: var(--space-xl) var(--space-lg);">
            <img src="./assets/favicon.svg" alt="PrincessCycle" style="width: 72px; height: 72px; margin: 0 auto var(--space-md);" />
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-xs); font-family: var(--font-family-display);">PrincessCycle 🌸</h2>
            <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.6;">
              Your dreamy, private sanctuary to understand your rhythm, nurture your feelings, and sleep peacefully in lovely lilac.
            </p>
          </div>
          <div class="sheet-footer">
            <button class="btn btn-primary btn-block" id="btn-onboard-next">Enter Your Sanctuary ✨</button>
          </div>
        `;
      } else if (currentStep === 2) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">Most Recent Period</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 2 of 7</span>
          </div>
          <div class="sheet-body">
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
              When did the first day of your most recent period begin?
            </p>
            <div class="form-group">
              <label class="form-label" for="onboard-period-start">First Day of Period 🌸</label>
              <input type="date" class="form-control" id="onboard-period-start" value="${onboardState.lastPeriodStart}" max="${store.formatDate(new Date())}" required />
              <p class="form-hint">You can change or adjust this date anytime.</p>
            </div>
          </div>
          <div class="sheet-footer flex justify-between gap-sm">
            <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
            <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
          </div>
        `;
      } else if (currentStep === 3) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">Cycle Length</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 3 of 7</span>
          </div>
          <div class="sheet-body">
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
              How long is your typical cycle? (From the start of one period to the start of the next).
            </p>
            <div class="form-group">
              <label class="form-label" for="onboard-cycle-length">Cycle Length: <strong id="val-cycle-len" style="color: var(--color-primary);">${onboardState.typicalCycleLength}</strong> days</label>
              <input type="range" class="form-control" id="onboard-cycle-length" min="21" max="45" value="${onboardState.typicalCycleLength}" style="padding: 0;" />
              <p class="form-hint">Default is 28 days. Cycles naturally vary from person to person.</p>
            </div>
          </div>
          <div class="sheet-footer flex justify-between gap-sm">
            <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
            <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
          </div>
        `;
      } else if (currentStep === 4) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">Period Bleeding Duration</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 4 of 7</span>
          </div>
          <div class="sheet-body">
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
              How many days does your period bleeding typically last?
            </p>
            <div class="form-group">
              <label class="form-label" for="onboard-period-len">Bleeding Days: <strong id="val-period-len" style="color: var(--color-primary);">${onboardState.typicalPeriodLength}</strong> days</label>
              <input type="range" class="form-control" id="onboard-period-len" min="2" max="10" value="${onboardState.typicalPeriodLength}" style="padding: 0;" />
              <p class="form-hint">Typical duration is 4–7 days.</p>
            </div>
          </div>
          <div class="sheet-footer flex justify-between gap-sm">
            <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
            <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
          </div>
        `;
      } else if (currentStep === 5) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">What would you like to track?</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 5 of 7</span>
          </div>
          <div class="sheet-body">
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
              Select the daily wellness signals you care about:
            </p>
            <div class="chip-group" id="onboard-interests">
              <button type="button" class="chip active" data-interest="mood">✨ Emotions & Mood</button>
              <button type="button" class="chip active" data-interest="symptoms">🩺 Physical Sensations</button>
              <button type="button" class="chip active" data-interest="sleep">🌙 Sleep Schedule & Wake Time</button>
              <button type="button" class="chip active" data-interest="energy">⚡ Energy Scale</button>
              <button type="button" class="chip active" data-interest="cravings">🍫 Food Cravings</button>
              <button type="button" class="chip active" data-interest="flow">🩸 Flow Level</button>
              <button type="button" class="chip active" data-interest="notes">📝 Personal Notes</button>
            </div>
          </div>
          <div class="sheet-footer flex justify-between gap-sm">
            <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
            <button class="btn btn-primary btn-block" id="btn-onboard-next">Next →</button>
          </div>
        `;
      } else if (currentStep === 6) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">Your Privacy Pledge 🔒</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 6 of 7</span>
          </div>
          <div class="sheet-body">
            <div class="flex items-center gap-sm" style="color: var(--color-primary); margin-bottom: var(--space-sm);">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <strong style="font-size: 1rem; color: var(--text-primary);">Your cycle data belongs only to you.</strong>
            </div>
            <p style="font-size: 0.84375rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--space-md);">
              All health logs, emotions, and sleep records are stored directly on this device. We do not transmit, monetize, or track your personal information. You can export or delete your records at any time with a single tap.
            </p>
          </div>
          <div class="sheet-footer flex justify-between gap-sm">
            <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
            <button class="btn btn-primary btn-block" id="btn-onboard-next">I Understand 💜</button>
          </div>
        `;
      } else if (currentStep === 7) {
        stepHtml = `
          <div class="sheet-header">
            <h3 class="card-title">Partner Sharing (Optional)</h3>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Step 7 of 7</span>
          </div>
          <div class="sheet-body">
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
              You can optionally share high-level cycle awareness with someone you trust. This is completely off by default.
            </p>
            <label class="switch-label" style="background: var(--bg-surface-subtle); padding: var(--space-md); border-radius: var(--radius-md);">
              <span style="font-size: 0.875rem; font-weight: 600;">Enable Partner Sharing Preview</span>
              <input type="checkbox" class="switch-input" id="onboard-partner-toggle" ${onboardState.partnerSharing ? 'checked' : ''}>
              <div class="switch-track"><div class="switch-thumb"></div></div>
            </label>
            <p class="form-hint" style="margin-top: var(--space-sm);">You can fine-tune or disable sharing at any time in Settings.</p>
          </div>
          <div class="sheet-footer flex justify-between gap-sm">
            <button class="btn btn-secondary btn-block" id="btn-onboard-back">Back</button>
            <button class="btn btn-primary btn-block" id="btn-onboard-finish">Enter PrincessCycle 🌸</button>
          </div>
        `;
      }

      container.innerHTML = stepHtml;
      attachStepEvents();
    };

    const attachStepEvents = () => {
      const nextBtn = container.querySelector('#btn-onboard-next');
      const backBtn = container.querySelector('#btn-onboard-back');
      const finishBtn = container.querySelector('#btn-onboard-finish');

      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (currentStep > 1) {
            currentStep--;
            renderStep();
          }
        });
      }

      if (currentStep === 2) {
        const dateInput = container.querySelector('#onboard-period-start');
        dateInput.addEventListener('change', (e) => {
          onboardState.lastPeriodStart = e.target.value;
        });
      } else if (currentStep === 3) {
        const cycleSlider = container.querySelector('#onboard-cycle-length');
        const cycleVal = container.querySelector('#val-cycle-len');
        cycleSlider.addEventListener('input', (e) => {
          onboardState.typicalCycleLength = Number(e.target.value);
          cycleVal.textContent = e.target.value;
        });
      } else if (currentStep === 4) {
        const periodSlider = container.querySelector('#onboard-period-len');
        const periodVal = container.querySelector('#val-period-len');
        periodSlider.addEventListener('input', (e) => {
          onboardState.typicalPeriodLength = Number(e.target.value);
          periodVal.textContent = e.target.value;
        });
      } else if (currentStep === 5) {
        const chips = container.querySelectorAll('#onboard-interests .chip');
        chips.forEach(c => {
          c.addEventListener('click', () => {
            c.classList.toggle('active');
          });
        });
      } else if (currentStep === 7) {
        const toggle = container.querySelector('#onboard-partner-toggle');
        toggle.addEventListener('change', (e) => {
          onboardState.partnerSharing = e.target.checked;
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentStep < totalSteps) {
            currentStep++;
            renderStep();
          }
        });
      }

      if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
          store.setUserProfile({
            lastPeriodStart: onboardState.lastPeriodStart,
            typicalCycleLength: onboardState.typicalCycleLength,
            typicalPeriodLength: onboardState.typicalPeriodLength,
            onboardingComplete: true,
            partnerSharing: {
              enabled: onboardState.partnerSharing,
              sharePhase: true,
              sharePeriodEstimate: true,
              shareMood: true,
              shareSymptoms: false,
              shareNotes: false,
              partnerName: 'Partner'
            }
          });

          await storage.saveAllData(store.getState());
          soundFx.playChime('sparkle');
          backdrop.classList.remove('active');
          UI.showToast('Welcome to your dreamy sanctuary, Princess! 🌸', 'success');
          this.navigateTo('home');
        });
      }
    };

    renderStep();
  }

  wirePWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(() => console.log('🌸 PWA Service Worker Registered.'))
          .catch(err => console.warn('Service worker registration failed:', err));
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PrincessCycleApp();
  app.init();
});
