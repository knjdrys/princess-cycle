# Contributing to PrincessCycle

Thank you for your interest in contributing to **PrincessCycle**! We welcome contributions that improve code quality, accessibility, documentation, and privacy protections.

## Core Development Principles

1. **Privacy-First**: No third-party tracking, analytics SDKs, or cloud dependencies.
2. **Vanilla & Minimal**: Maintain zero build-step simplicity unless strictly justified.
3. **Accessibility**: All interactive elements must be accessible via keyboard, meet WCAG AA/AAA contrast, and support `prefers-reduced-motion`.
4. **Empathetic Language**: Always maintain non-diagnostic, supportive phrasing ("Estimated", "Your pattern suggests...").

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Ensure any new calculation logic is covered in `tests/cycle-engine.test.js`.
3. Verify that `tests/runner.html` passes with 100% success.
4. Test responsive layouts on 375px mobile viewports as well as desktop widths.
5. Submit a pull request describing the changes and motivation.
