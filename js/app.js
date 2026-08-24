/**
 * PrincessCycle - Main Application Bootstrap & Orchestrator
 * Composes Storage, State, Router, Controllers, Modals, Ambient Audio & PWA Lifecycle.
 */

import { store } from './state.js';
import { storage } from './storage.js';
import { DOM } from './dom.js';
import { Router } from './router.js';
import { CheckinController } from './checkin.js';
import { SettingsController } from './settings.js';
import { OnboardingController } from './onboarding.js';
import { AudioAmbienceController } from './ambient-audio.js';
import { CalendarController } from './calendar.js';
import { InsightsController } from './insights.js';
import { HistoryController } from './history.js';
import { SharingController } from './sharing.js';
import { RitualsController } from './rituals-view.js';
import { PrivacyLock } from './privacy-lock.js';
import { SleepScheduleEngine } from './sleep.js';
import { CycleEngine, PHASE_META, PHASES } from './cycle.js';
import { AffirmationManager } from './affirmations.js';
import { Notifications } from './notifications.js';
import { soundFx } from './audio.js';
import { relaxationPacer } from './relaxation.js';
import { fairySparkles } from './sparkles.js';
import { UI } from './ui.js';

class PrincessCycleApp {
  constructor() {
    this.router = null;
    this.checkinCtrl = null;
    this.settingsCtrl = null;
    this.onboardingCtrl = null;
    this.ambientAudioCtrl = null;
    this.calendarCtrl = null;
    this.insightsCtrl = null;
    this.historyCtrl = null;
    this.sharingCtrl = null;
    this.privacyLock = null;
    this.ritualsCtrl = null;
    this.sleepEngine = null;
    this.activePhaseTab = 'follicular';
    this.dismissedCatchupSession = false;
  }

  async init() {
    console.log('🌸 Initializing PrincessCycle (Clean Modular Architecture)...');

    // 1. Initialize Authoritative Storage & Load Hydrated State
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

    // 2. Setup Sound & Privacy Lock
    const soundEnabled = store.getState().user?.soundEffectsEnabled !== false;
    soundFx.setSoundFxEnabled(soundEnabled);

    try {
      fairySparkles.init();
    } catch (e) {}

    this.privacyLock = new PrivacyLock(store);
    await this.privacyLock.init();

    this.sleepEngine = new SleepScheduleEngine(store);

    // 3. Initialize Feature Controllers
    this.checkinCtrl = new CheckinController(store, () => this.renderCurrentView());
    this.checkinCtrl.init();

    this.settingsCtrl = new SettingsController(store, () => this.onboardingCtrl.start());
    this.settingsCtrl.init();

    this.onboardingCtrl = new OnboardingController(store, () => this.renderCurrentView());

    this.ambientAudioCtrl = new AudioAmbienceController();
    this.ambientAudioCtrl.init();

    this.calendarCtrl = new CalendarController(
      store,
      (dateStr) => this.checkinCtrl.openCheckin(dateStr),
      async (dateStr) => this.handleMarkPeriodStart(dateStr)
    );

    this.insightsCtrl = new InsightsController(store);

    this.historyCtrl = new HistoryController(
      store,
      async (newCycle) => {
        const state = store.getState();
        const updatedCycles = [newCycle, ...(state.cycles || [])];
        store.setCycles(updatedCycles);
        soundFx.playChime('sparkle');
        UI.showToast('Past cycle memory saved! 🌸', 'success');
        this.historyCtrl.render(DOM.mounts.history());
      },
      async (cycleId) => {
        const state = store.getState();
        const updatedCycles = (state.cycles || []).filter(c => c.id !== cycleId);
        store.setCycles(updatedCycles);
        UI.showToast('Cycle record removed.', 'info');
        this.historyCtrl.render(DOM.mounts.history());
      }
    );

    this.sharingCtrl = new SharingController(store, async (patch) => {
      store.setUserProfile(patch);
      this.sharingCtrl.render(DOM.mounts.sharing());
      UI.showToast('Sharing settings updated ✨', 'info');
    });

    // Self-Care Sanctuary (v2.0.0) — deep-links into existing features
    this.ritualsCtrl = new RitualsController(store, {
      openCheckin: (dateStr) => this.checkinCtrl.openCheckin(dateStr),
      openBreathe: () => relaxationPacer.showModal(),
      openAffirmation: () => {
        const affCard = document.getElementById('daily-affirmation-card');
        if (affCard) affCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.router.navigateTo('home', true);
        setTimeout(() => {
          const affCardEl = document.getElementById('daily-affirmation-card');
          if (affCardEl) {
            soundFx.playChime('sparkle');
            fairySparkles.burst(affCardEl.getBoundingClientRect().left + 40, affCardEl.getBoundingClientRect().top + 20, 15);
            UI.showToast('You are doing wonderful, Princess 💜', 'info', 2000);
          }
        }, 350);
      },
      logWaterGlass: () => {
        const todayStr = store.formatDate(new Date());
        const state = store.getState();
        const entry = state.dailyEntries[todayStr] || {};
        const currentGlasses = entry.waterGlasses || 0;
        const next = currentGlasses >= 8 ? 8 : currentGlasses + 1;
        store.setDailyEntry(todayStr, { ...entry, waterGlasses: next });
        if (next === 8) UI.showToast('🎉 Hydration Goal Achieved! 💧', 'success', 3000);
        else UI.showToast(`Logged ${next} / 8 glasses of water 💧`, 'info', 1500);
        this.updateHydrationUI(next);
      }
    });

    // 4. Initialize Router with Route Handlers
    this.router = new Router(store, {
      home: () => this.renderHomeDashboard(),
      calendar: () => {
        const st = store.getState();
        this.calendarCtrl.render(DOM.mounts.calendar(), st.viewingMonth, st.viewingYear);
      },
      insights: () => this.insightsCtrl.render(DOM.mounts.insights()),
      history: () => this.historyCtrl.render(DOM.mounts.history()),
      sharing: () => this.sharingCtrl.render(DOM.mounts.sharing()),
      rituals: () => this.ritualsCtrl.render(DOM.mounts.rituals()),
      settings: () => this.settingsCtrl.render(),
    });
    this.router.init();

    // 5. Apply Theme
    const currentTheme = store.getState().user?.theme || 'system';
    UI.applyTheme(currentTheme);

    // 6. Wire Global UI & Home Dashboard Events
    this.wireHomeQuickLogs();
    this.wirePhaseTabs();
    this.wirePeriodTodayButton();
    this.wireSleepTrackingActions();
    this.wireRelaxationTriggers();
    this.wireHeaderSettingsButton();
    this.wireCommandBar();
    this.wireAffirmationsAndSpicyMode();
    this.wireHydrationAndCrystal();
    this.wirePWA();

    // 7. Check Morning Wake Detection
    this.sleepEngine.checkMorningWakeDetection((detectedTime, todayStr) => {
      const banner = DOM.home.smartWakeBanner();
      const timeLabel = DOM.home.wakeTimeText();
      if (banner && timeLabel) {
        timeLabel.textContent = `${detectedTime}`;
        banner.style.display = 'block';

        const confirmBtn = DOM.home.confirmWakeBtn();
        const dismissBtn = DOM.home.dismissWakeBtn();

        if (confirmBtn) {
          confirmBtn.onclick = () => {
            this.sleepEngine.confirmWakeTimeNow(detectedTime, todayStr);
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

    // 8. Check Onboarding Status
    const user = store.getState().user;
    if (!user.onboardingComplete || !user.lastPeriodStart) {
      this.onboardingCtrl.start();
    } else {
      this.renderCurrentView();
    }

    // 9. Subscribe to Granular Delta Storage Events
    store.subscribe('userUpdated', async (updatedUser) => {
      await storage.saveUser(updatedUser);
      storage.syncToLocalStorage(store.getState());
    });

    store.subscribe('dailyEntrySaved', async ({ date, entry }) => {
      await storage.saveDailyEntry(date, entry);
      storage.syncToLocalStorage(store.getState());
    });

    store.subscribe('dailyEntryDeleted', async ({ date }) => {
      await storage.deleteDailyEntry(date);
      storage.syncToLocalStorage(store.getState());
    });

    store.subscribe('cyclesUpdated', async (cycles) => {
      await storage.saveCycles(cycles);
      storage.syncToLocalStorage(store.getState());
    });

    store.subscribe('calendarMonthChanged', ({ month, year }) => {
      this.calendarCtrl.render(DOM.mounts.calendar(), month, year);
    });

    // Notifications check
    const overview = CycleEngine.getCycleOverview(user, store.getState().cycles);
    const reminder = Notifications.checkUpcomingPeriodReminder(overview);
    if (reminder && user.notifications?.enabled) {
      Notifications.sendGentleNotification(reminder.title, reminder.body);
    }
  }

  renderCurrentView() {
    const currentView = store.getState().currentView || 'home';
    this.router.navigateTo(currentView, false);
  }

  // Home Dashboard Rendering & State Sync
  renderHomeDashboard() {
    const state = store.getState();
    const user = state.user;
    const todayStr = store.formatDate(new Date());

    const greetingEl = DOM.home.greetingTitle();
    if (greetingEl) {
      greetingEl.textContent = UI.getGreeting(user.name || 'Princess');
    }

    const cycleInfo = CycleEngine.getCycleOverview(user, state.cycles, todayStr);
    const phaseMeta = PHASE_META[cycleInfo.phase] || PHASE_META[PHASES.FOLLICULAR];

    const dialContainer = DOM.home.dialContainer();
    if (dialContainer) {
      dialContainer.innerHTML = UI.renderCycleDial(cycleInfo.cycleDay, cycleInfo.totalCycleLength, cycleInfo.phase);
    }

    const phaseBadge = DOM.home.phaseBadge();
    if (phaseBadge) {
      phaseBadge.className = `badge ${phaseMeta.badgeClass}`;
      phaseBadge.textContent = phaseMeta.title;
    }

    const phaseTag = DOM.home.phaseTag();
    if (phaseTag) {
      phaseTag.className = cycleInfo.isEstimated ? 'tag-estimated' : 'tag-logged';
      phaseTag.textContent = cycleInfo.isEstimated ? 'Estimated' : 'Logged Period';
    }

    const nextPeriodEl = DOM.home.nextPeriodText();
    if (nextPeriodEl) {
      if (cycleInfo.daysUntilNextPeriod !== null) {
        if (cycleInfo.isOverdue) {
          nextPeriodEl.textContent = `${cycleInfo.daysLate} days late — log your period when it starts 🩸`;
        } else if (cycleInfo.daysUntilNextPeriod > 0) {
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

    DOM.home.quickMoodChips().forEach(chip => {
      const moodName = chip.getAttribute('data-mood');
      chip.classList.toggle('active', selectedMoods.includes(moodName));
    });

    this.updateHydrationUI(todayEntry.waterGlasses || 0);
    this.checkMissedDaysGap(state, cycleInfo);
  }

  checkMissedDaysGap(state, cycleInfo) {
    const banner = DOM.home.missedDaysBanner();
    if (!banner) return;

    if (this.dismissedCatchupSession) {
      banner.style.display = 'none';
      return;
    }

    const user = state.user;
    const todayStr = store.formatDate(new Date());
    const gapResult = CycleEngine.detectLoggingGaps(state.dailyEntries, user.lastPeriodStart, todayStr);
    if (gapResult.hasGap && gapResult.gapDates.length > 0) {
      const textEl = DOM.home.missedDaysText();
      if (textEl) {
        textEl.textContent = `You missed ${gapResult.missedCount} check-in ${gapResult.missedCount === 1 ? 'day' : 'days'}, but your rhythm is on track! Today is Cycle Day ${cycleInfo.cycleDay} (${PHASE_META[cycleInfo.phase]?.title || 'Cycle'}).`;
      }
      banner.style.display = 'block';

      const autofillBtn = DOM.home.autofillMissedBtn();
      const dismissBtn = DOM.home.dismissCatchupBtn();

      if (autofillBtn) {
        autofillBtn.onclick = () => {
          gapResult.gapDates.forEach(dateStr => {
            const pred = CycleEngine.generatePredictedEntryForDate(dateStr, user.lastPeriodStart, cycleInfo.avgCycleLength, cycleInfo.avgPeriodLength);
            store.setDailyEntry(dateStr, pred);
          });
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
    const btn = DOM.home.periodToggleBtn();
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

    soundFx.playChime('sparkle');
    UI.showToast(`Period started on ${dateStr}. Take extra gentle care today! 🌸`, 'success');
    this.renderCurrentView();
  }

  wireHomeQuickLogs() {
    const chipContainer = DOM.home.quickMoodContainer();
    if (!chipContainer) return;

    chipContainer.addEventListener('click', (e) => {
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

      soundFx.playChime('sparkle');
      UI.showToast(`Logged "${mood}" vibe ✨`, 'info', 1600);
    });
  }

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

    const iconEl = DOM.home.crystalIcon();
    const nameEl = DOM.home.crystalName();
    const descEl = DOM.home.crystalDesc();

    if (iconEl) iconEl.textContent = crystal.icon;
    if (nameEl) nameEl.textContent = crystal.name;
    if (descEl) descEl.textContent = crystal.desc;

    const dropletsContainer = DOM.home.waterDropletsContainer();
    if (!dropletsContainer) return;

    dropletsContainer.addEventListener('click', (e) => {
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
    const textEl = DOM.home.waterProgressText();
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

  wireSleepTrackingActions() {
    const handleGoodnight = () => {
      const bedtimeStr = this.sleepEngine.recordBedtimeNow();
      soundFx.playChime('breath-out');
      UI.showToast(`Bedtime logged at ${bedtimeStr}. Sweet dreams, beautiful artist 🌙`, 'info', 4000);
    };

    const headerGoodnightBtn = document.getElementById('header-goodnight-btn');
    const sidebarGoodnightBtn = document.getElementById('sidebar-goodnight-btn');

    if (headerGoodnightBtn) headerGoodnightBtn.addEventListener('click', handleGoodnight);
    if (sidebarGoodnightBtn) sidebarGoodnightBtn.addEventListener('click', handleGoodnight);
  }

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
    const headerSpicyBtn = DOM.spicy.headerBtn();
    const sidebarSpicyBtn = DOM.spicy.sidebarBtn();
    const spicyModal = DOM.spicy.backdrop();
    const closeSpicyBtn = DOM.spicy.closeBtn();
    const refreshSpicyBtn = DOM.spicy.refreshBtn();
    const spicyTipBox = DOM.spicy.tipBox();

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

  wireRelaxationTriggers() {
    const headerBtn = DOM.relaxation.headerBtn();
    const sidebarBtn = DOM.relaxation.sidebarBtn();

    const openRelaxation = () => {
      // showModal() builds the pacer modal, wires its controls, then
      // auto-starts breathing. Calling start() alone targeted DOM that
      // didn't exist yet — the button appeared completely dead.
      relaxationPacer.showModal();
    };

    if (headerBtn) headerBtn.addEventListener('click', openRelaxation);
    if (sidebarBtn) sidebarBtn.addEventListener('click', openRelaxation);
  }

  wireHeaderSettingsButton() {
    // The mobile-header gear was never wired to any handler — dead button.
    // Route it to the settings view like every other nav element.
    const settingsBtn = DOM.nav.headerSettings();
    if (!settingsBtn) return;

    settingsBtn.addEventListener('click', () => {
      soundFx.playChime('tap');
      this.router.navigateTo('settings', true);
    });
  }

  wireCommandBar() {
    const search = document.getElementById('global-search');
    if (search) {
      search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && search.value.trim()) {
          // Route to History filtered by the query (real, persisted behavior)
          this.router.navigateTo('history', true);
          const historySearch = document.getElementById('history-search');
          if (historySearch) {
            historySearch.value = search.value.trim();
            historySearch.dispatchEvent(new Event('input', { bubbles: true }));
          }
          search.value = '';
        }
      });
    }

    const themeToggle = document.getElementById('command-theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        UI.applyTheme(next);
        // Persist via the same path as the settings theme selector
        try {
          const user = store.getState().user || {};
          store.updateState({ user: { ...user, theme: next } });
          storage.saveState(store.getState());
        } catch (_) { /* storage best-effort */ }
      });
    }
  }

  wirePWA() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.warn('SW registration skipped:', err);
        });
      });
    }
  }
}

// Instantiate & Bootstrap on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new PrincessCycleApp();
  app.init().catch(err => console.error('Bootstrap Error:', err));
});
