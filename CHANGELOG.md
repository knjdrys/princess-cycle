# Changelog

All notable changes to the **PrincessCycle** project will be documented in this file.

## [1.0.0] - 2026-08-18

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
