/**
 * PrincessCycle - Centralized DOM Selector Dictionary
 * Provides clean, stable element references and selector queries.
 */

export const DOM = {
  // Application Root & Headers
  appRoot: () => document.querySelector('.app-root'),
  mobileHeader: () => document.getElementById('mobile-header'),
  desktopSidebar: () => document.getElementById('desktop-sidebar'),
  mainContent: () => document.getElementById('main-content'),

  // Views
  views: {
    home: () => document.getElementById('view-home'),
    calendar: () => document.getElementById('view-calendar'),
    insights: () => document.getElementById('view-insights'),
    history: () => document.getElementById('view-history'),
    sharing: () => document.getElementById('view-sharing'),
    settings: () => document.getElementById('view-settings'),
  },

  // Mount Points
  mounts: {
    calendar: () => document.getElementById('calendar-mount-point'),
    insights: () => document.getElementById('insights-mount-point'),
    history: () => document.getElementById('history-mount-point'),
    sharing: () => document.getElementById('sharing-mount-point'),
  },

  // Navigation Items
  nav: {
    links: () => document.querySelectorAll('[data-view]'),
    bottomNav: () => document.getElementById('bottom-nav'),
    fabLog: () => document.getElementById('btn-fab-log'),
    headerSettings: () => document.getElementById('header-settings-btn'),
  },

  // Home Dashboard
  home: {
    greetingTitle: () => document.getElementById('greeting-title'),
    greetingSubtitle: () => document.getElementById('greeting-subtitle'),
    periodToggleBtn: () => document.getElementById('btn-period-today-toggle'),
    quickLogHeroBtn: () => document.getElementById('btn-quick-log-hero'),
    dialContainer: () => document.getElementById('hero-dial-container'),
    phaseBadge: () => document.getElementById('hero-phase-badge'),
    phaseTag: () => document.getElementById('hero-phase-tag'),
    nextPeriodText: () => document.getElementById('hero-next-period-text'),
    quickMoodChips: () => document.querySelectorAll('#quick-mood-chips .chip'),
    quickMoodContainer: () => document.getElementById('quick-mood-chips'),
    openFullLogBtn: () => document.getElementById('btn-open-full-log'),
    waterDropletsContainer: () => document.getElementById('water-droplets-container'),
    waterProgressText: () => document.getElementById('water-progress-text'),
    crystalIcon: () => document.getElementById('daily-crystal-icon'),
    crystalName: () => document.getElementById('daily-crystal-name'),
    crystalDesc: () => document.getElementById('daily-crystal-desc'),
    smartWakeBanner: () => document.getElementById('smart-wake-banner'),
    wakeTimeText: () => document.getElementById('detected-wake-time-text'),
    confirmWakeBtn: () => document.getElementById('btn-confirm-wake-time'),
    dismissWakeBtn: () => document.getElementById('btn-dismiss-wake-banner'),
    missedDaysBanner: () => document.getElementById('missed-days-catchup-banner'),
    missedDaysText: () => document.getElementById('missed-days-text'),
    autofillMissedBtn: () => document.getElementById('btn-autofill-missed-days'),
    dismissCatchupBtn: () => document.getElementById('btn-dismiss-catchup'),
  },

  // Daily Check-In Drawer
  checkin: {
    backdrop: () => document.getElementById('checkin-sheet-backdrop'),
    titleDate: () => document.getElementById('checkin-sheet-date'),
    closeBtn: () => document.getElementById('btn-close-checkin'),
    cancelBtn: () => document.getElementById('btn-cancel-checkin'),
    saveBtn: () => document.getElementById('btn-save-checkin'),
    bedtimeInput: () => document.getElementById('sheet-bedtime'),
    wakeTimeInput: () => document.getElementById('sheet-waketime'),
    sleepCalcPill: () => document.getElementById('sheet-sleep-calc-pill'),
    moodChips: () => document.querySelectorAll('#sheet-mood-chips .chip'),
    cravingsChips: () => document.querySelectorAll('#sheet-cravings-chips .chip'),
    energyBtns: () => document.querySelectorAll('#sheet-energy-scale .energy-btn'),
    flowBtns: () => document.querySelectorAll('#sheet-flow-selector .flow-btn'),
    fluidChips: () => document.querySelectorAll('#sheet-fluid-selector .chip'),
    symptomChips: () => document.querySelectorAll('#sheet-symptoms-chips .chip'),
    qualityChips: () => document.querySelectorAll('#sheet-sleep-quality .chip'),
    bbtInput: () => document.getElementById('sheet-bbt'),
    notesInput: () => document.getElementById('sheet-notes'),
  },

  // Settings & Data Management
  settings: {
    nameInput: () => document.getElementById('setting-name'),
    cycleLengthInput: () => document.getElementById('setting-cycle-length'),
    periodLengthInput: () => document.getElementById('setting-period-length'),
    lastPeriodInput: () => document.getElementById('setting-last-period'),
    saveBtn: () => document.getElementById('btn-save-settings'),
    themeBtns: () => document.querySelectorAll('#theme-selector-group button'),
    soundToggle: () => document.getElementById('setting-sound-toggle'),
    notificationsToggle: () => document.getElementById('setting-notifications-toggle'),
    notificationsHint: () => document.getElementById('notifications-permission-hint'),
    ambientSoundBtns: () => document.querySelectorAll('#ambient-sound-group button'),
    exportJsonBtn: () => document.getElementById('btn-export-json'),
    exportCsvBtn: () => document.getElementById('btn-export-csv'),
    importFileInput: () => document.getElementById('import-json-file'),
    loadDemoBtn: () => document.getElementById('btn-load-demo-data'),
    wipeDataBtn: () => document.getElementById('btn-wipe-data'),
  },

  // Onboarding Wizard
  onboarding: {
    backdrop: () => document.getElementById('onboarding-modal-backdrop'),
    container: () => document.getElementById('onboarding-container'),
  },

  // Modals & Floating Kits
  spicy: {
    backdrop: () => document.getElementById('spicy-modal-backdrop'),
    headerBtn: () => document.getElementById('header-spicy-btn'),
    sidebarBtn: () => document.getElementById('sidebar-spicy-btn'),
    closeBtn: () => document.getElementById('close-spicy-btn'),
    refreshBtn: () => document.getElementById('btn-spicy-refresh-tip'),
    tipBox: () => document.getElementById('spicy-tip-box'),
  },

  relaxation: {
    backdrop: () => document.getElementById('relaxation-modal-backdrop'),
    headerBtn: () => document.getElementById('header-pacer-btn'),
    sidebarBtn: () => document.getElementById('sidebar-pacer-btn'),
    closeBtn: () => document.getElementById('close-pacer-btn'),
    instruction: () => document.getElementById('pacer-instruction'),
    sphere: () => document.getElementById('pacer-sphere'),
  }
};
