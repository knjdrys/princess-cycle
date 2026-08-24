# Changelog

All notable changes to the **PrincessCycle** project will be documented in this file.

## [2.0.0] - 2026-08-24

This release introduces a brand-new, fully on-device **Self-Care Sanctuary** and fixes a stale
Service Worker cache-version mismatch that was quietly serving outdated code.

### Added
- **Self-Care Sanctuary 🌸 (new view)**: A phase-aware daily ritual checklist that turns the app's
  existing wellness tools into one gentle, actionable routine. Each phase surfaces a tailored set of
  rituals (check-in, hydrate, breathe, affirm, rest, move, nourish, crystal).
- **Completion tracking & streaks**: Per-day ritual completion stored on `dailyEntries[date].rituals`,
  with a current streak, all-time best streak, and a 7-day consistency canvas (zero-dependency, theme-aware).
- **One-tap deep links**: Each ritual with an action opens its host feature directly — the breathing
  pacer, the daily check-in drawer, the home affirmation, or logs a glass of water — no extra navigation.
- **RitualEngine** (`js/rituals.js`): pure logic for phase→ritual selection, completion, streak and
  consistency math, plus `RitualsController` (`js/rituals-view.js`) for rendering.
- **Navigation**: Sidebar **and** mobile bottom-nav entry for Self-Care Sanctuary; router `validViews`
  extended with `rituals`; DOM registry gains `views.rituals` and `mounts.rituals`.
- **Test coverage**: +18 assertions (Group 18) covering phase-aware ritual selection, completion
  helpers, streak math (consecutive + longest), and the 7-day consistency series. Full suite now 84/84.
- **Version cohesion**: `config.js`, `index.html` labels, and `sw.js` `CACHE_VERSION` all aligned to `2.0.0`.

### Fixed
- **Service Worker version drift**: `sw.js` shipped `CACHE_VERSION = v1.2.1` while the app reported
  `v1.1.0`. Bumped to `v2.0.0` and registered the two new modules so offline installs stay correct.

## [1.1.0] - 2026-08-18

### Added
- **Core Cycle Engine**: Mathematical estimation model supporting 4 biological phases (Menstruation, Follicular, Ovulation, Luteal) and moving historical averages.
- **Onboarding Flow**: 7-step guided questionnaire with validation, privacy pledge, and customizable tracking categories.
- **Home Dashboard**: Dynamic contextual greetings, animated SVG cycle progress dial, 1-tap emotion logger, and phase guide card.
- **Interactive Calendar**: Full monthly view with phase overlays, bleeding indicators, log markers, and day inspection drawer.
- **Daily Check-In Drawer**: Multi-select emotions, energy slider (1-5), sleep tracker, flow volume selector, physical sensations, and sanitized notes.
- **Analytics & Custom Canvas Charts**: Lightweight zero-dependency charts for cycle length history and mood distribution.
- **Cycle History**: Chronological past cycle log with period duration insights and manual past cycle logging.
- **Partner Sharing Mode**: Opt-in granular sharing simulator with supportive non-surveillance copy and instant disable toggle.
- **Privacy & Storage Engine**: 100% on-device IndexedDB storage with LocalStorage fallback, JSON/CSV export, and validated JSON import.
- **Progressive Web App**: Web App Manifest, Service Worker (`sw.js`) with stale-while-revalidate offline caching, and responsive design for 320px–1200px+ viewports.
- **Test Suite**: Automated in-browser test runner covering 30+ assertions across cycle math, phase boundaries, and input sanitization.
