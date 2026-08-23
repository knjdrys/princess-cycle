# PrincessCycle — Rebuild Review Notes (v1.1.0)

## Verification status (all confirmed by execution, not assumption)
- Test suite: **66/66 assertions passing** (`node --input-type=module -e "..."` against `tests/cycle-engine.test.js`)
- All 28 JS modules + `sw.js` pass `node --check`
- Service worker manifest verified **complete** against the actual `js/` directory (automated diff — zero missing assets)
- No unescaped user-text interpolation remains in calendar/sharing/history/insights templates (grep-verified: every `${entry.notes}`, `${user.name...}`, cycle-data interpolation routes through `UI.esc()`)
- CI workflow now awaits async tests and exits non-zero on failure (exit semantics verified locally)
- Unused-import sweep run across all modules (3 dead imports found & removed during review)

## Defects fixed across the rebuild (13 identified in audit → all addressed)
1. SW cached ~21 of 40+ assets (offline PWA was broken) → complete manifest, versioned cache, safe install
2. Engine rollover missing (Day 29 counted forever) → continuous rollover, anchor advances whole cycles
3. Overdue periods silently rolled into phantom next cycle → `getCycleOverview().isOverdue/daysLate`, surfaced as "X days late" in UI
4. Stored-XSS vector via import path → canonical render-time escaper `UI.esc()` applied to every template; store raw; one-time migration for legacy escaped text
5. History search lost focus after 1 keystroke → list-only re-render
6. Router double-mounted every navigation → idempotency guard
7. Unclamped user metrics leaked into phase math → `clampCycleLength/clampPeriodLength`
8. Test/code API drift → canonical names + back-compat aliases; hormone scale corrected to 0–100% (LH surge = 100)
9. Fabricated chart data presented as real → honest canvas empty states
10. Notifications feature dead (no UI, no permission flow) → settings card + full permission lifecycle
11. "Encrypted backup" false claim → honest copy
12. Duplicate sparkle systems (inline script + sparkles.js) → inline removed
13. Version chaos (v1.0.0/v1.1.0 scattered) → `js/config.js` single source of truth

## Bugs found & fixed during self-review
- TDZ crash in insights empty states (`textSecondary` referenced before declaration) — would have thrown exactly when charts had no data. Fixed with locally resolved themed color.
- Dead imports left behind after sanitizer removal (checkin/onboarding/storage) — swept clean.
- Storage constants now derive from `APP_CONFIG`.

## Known remaining work (intentional, polish-tier)
- CSS consolidation: merge cute.css override layer (~136 !important), convert ~96 inline styles to utility classes, success-green contrast fix.
- README badges/docs update to v1.1.0 reality.
- One manual click-through of onboarding → check-in → save → reload persistence (unit-covered but worth a human pass).
- Changes are uncommitted on top of `7ffd4e9` — recommend a commit checkpoint.

## Engineering decision record
- Kept zero-dependency vanilla ES modules (correct for offline-first privacy PWA).
- Lateness is presentation-layer, not engine math (keeps predictions stable per product promise).
- Escaping at render time, never at store time (single escaping contract, CSV-safe).
- In-memory storage tier = graceful degradation for Safari private mode + headless CI.
