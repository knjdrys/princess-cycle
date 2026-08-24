# PrincessCycle 🌸✨

<div align="center">

![PrincessCycle Logo](./assets/fairy-icon.jpg)

### **Your dreamy lilac sanctuary — know your cycle, love your days 💜**

[![PWA Ready](https://img.shields.io/badge/PWA-Installable-C084FC.svg?style=flat-square)](./manifest.json)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20On--Device-9061F9.svg?style=flat-square)](#-privacy--data-ownership-pledge)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Vanilla%20ES6%2B)-A78BFA.svg?style=flat-square)](#-architecture--technology-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-F472B6.svg?style=flat-square)](./LICENSE)
[![Tests Passing](https://img.shields.io/badge/Tests-84%2B%20Assertions-brightgreen.svg?style=flat-square)](./tests/runner.html)

*A privacy-first, offline-ready menstrual cycle, sleep schedule & personal wellness Progressive Web App (PWA). Built with pure Vanilla JavaScript (ES6+), zero cloud dependencies, and a 💜 dreamy kawaii lilac design tailored for the modern princess.*

[✨ Features](#-key-highlights) • [📐 Architecture](#-architecture--technology-stack) • [🛡️ Privacy](#-privacy--data-ownership-pledge) • [🚀 Get Started](#-getting-started--running-locally) • [🧪 Tests](./tests/runner.html)

</div>

---

## 📖 Product Overview & Story

**PrincessCycle** was designed to solve a fundamental problem with modern wellness applications: personal health data should belong exclusively to the person experiencing the cycle, without cloud tracking, intrusive ads, or commercial data mining.

Built from the ground up as an installable **Progressive Web App (PWA)**, PrincessCycle operates 100% offline on the user's device. The latest version features a **full kawaii redesign** — lilac purple gradients, Comfortaa + Nunito rounded typography, floating petal animations, sparkle click effects, and a dreamy glass-morphism UI that feels like it was made with love for an artistic, jolly princess who deserves something truly beautiful.

### ✨ Key Highlights
- **💜 100% On-Device & Privacy-First**: Zero cloud dependencies, zero analytics trackers, zero third-party telemetry.
- **🇵🇭 Filipino Wellness Cuisine & Cravings**: Phase-tailored Pinay comfort foods (Mainit na Sinigang, Arroz Caldo / Lugaw, Champorado, Salabat, Buko Juice, Talbos ng Kamote, Saging na Saba, Boba Milk Tea).
- **🔮 Predictive Catch-Up Engine for Missed Days**: Continuous calendar day calculations prevent broken streaks; 1-tap smart assistant estimates and auto-fills missing check-in vibes.
- **💧 Daily Hydration & Fairy Lucky Crystal**: Interactive 8-glass water tracker for cramp relief & radiant skin, paired with daily lucky crystals and colors (Amethyst, Rose Quartz, Moonstone, Citrine).
- **🌙 Smart Sleep Schedule Tracker**: Auto-detects your first phone touch of the day as wake time, one-tap "Goodnight" bedtime log, calculates crossover sleep duration, and charts your sleep trends.
- **📊 Adaptive Biological Cycle Engine**: Dynamically calculates cycle day, 4 biological phases, estimated ovulation window, and next period countdown using moving historical averages.
- **📈 Dynamic Hormone & BBT Visualizer**: Real-time canvas estimation of Estrogen, Progesterone, LH surge, FSH curves, and Basal Body Temperature (BBT in °C/°F) syncing seamlessly with dark/light themes.
- **🌬️ Guided Breathing & Cramp Relief Pacer**: Box breathing resonator (4-4-4-4) with expanding visual sphere and gentle harmonic audio cues.
- **🎵 Generative Ambient Relaxation Audio**: Pure Web Audio API synthesis — Gentle Rain, Soft Waves, and Pink Noise without external audio files.
- **🌸 Self-Care Sanctuary & Ritual Streaks**: A new phase-aware daily ritual checklist that turns the app's wellness tools into one gentle routine — check in, breathe, hydrate, affirm, rest, move, nourish, hold your crystal — with current/best streak tracking and a 7-day consistency chart. One tap deep-links into each host feature.
- **✨ Kawaii Aesthetic & Real Fairy Princess Identity**: Iridescent wings avatar, lilac glass-morphism cards, sparkle click bursts, floating ambient orbs, and rounded typography.
- **💌 Taglish Affirmations & Spicy Mode Rescue Kit**: Relatable comfort tips (*"Ganda mo today, Princess!"*, *"Valid ang feelings mo"*, FoodPanda/Milk tea suggestions).
- **🩺 Clinical Doctor's Summary Report**: One-click exportable/printable summary formatted for medical consultations.
- **🔒 Privacy PIN Lock & Screen Protector**: 4-digit security PIN lock and auto-blur shield when switching tabs or apps.
- **👫 Opt-in Partner Mode with QR Code Pairing**: Granular consent-first sharing.
- **📲 Installable PWA**: Offline caching via Service Worker and Web App Manifest.

---

## 📐 Architecture & Technology Stack

PrincessCycle uses **zero bloated frameworks**, proving that clean, modular JavaScript and modern CSS can deliver exceptional performance, accessibility, and maintainability.

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   (index.html, CSS Custom Properties, Modular Views)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    State & Controller                  │
│   (app.js, state.js, ui.js, calendar.js, sleep.js)     │
└─────────────┬─────────────────────────────┬────────────┘
              │                             │
┌─────────────▼──────────────┐ ┌────────────▼────────────┐
│    Cycle Calculation       │ │    Privacy & Storage    │
│    (cycle.js, insights.js) │ │    (storage.js, PWA)    │
│  • 4-Phase Boundaries      │ │  • IndexedDB / Local    │
│  • Moving Averages         │ │  • JSON / CSV Export    │
│  • Predictive Gap Engine   │ │  • Service Worker Cache │
│  • Hormone Curves & BBT    │ │  • Procedural Synthesis │
└────────────────────────────┘ └─────────────────────────┘
```

### Tech Stack Breakdown
| Layer | Technology | Rationale |
|---|---|---|
| **Structure** | Semantic HTML5 | High accessibility (WCAG AA/AAA), keyboard navigability, screen-reader friendly |
| **Styling** | Vanilla CSS3 (Custom Properties) | Full design system tokenization, dark theme support, responsive fluid scaling |
| **Logic** | Vanilla JavaScript (ES6+ Modules) | Modular, readable, lightning-fast execution with zero build-step overhead |
| **Persistence** | IndexedDB + LocalStorage | Dual-layer offline-first persistence with structured import/export |
| **Data Viz** | Native HTML5 Canvas | Zero-dependency high-DPI retina charts for hormone curves, cycle history, and moods |
| **Audio** | Web Audio API | Zero-asset soothing synthesized chimes and generative ambient soundscapes |
| **PWA** | Service Worker + Manifest | Instant offline loading, standalone app installation on iOS & Android |

---

## 🌸 The 4 Cycle Phases & Hormonal Context

PrincessCycle structures the menstrual cycle into four biologically grounded, non-diagnostic phases:

| Phase | Visual Identity | Biological Context | Typical Trackable Signals |
|---|---|---|---|
| **1. Menstruation** | Deep Rose (`#F472B6`) | Uterine lining shedding; estrogen & progesterone baseline low | Cramps (Puson), fatigue (Pagod), backache, reflective mood, flow volume |
| **2. Follicular** | Soft Lilac (`#A78BFA`) | Estrogen rises steadily; FSH stimulates egg maturation | Rising energy, mental clarity, creative spark, kilig & fresh confidence |
| **3. Ovulation** | Sunbeam Gold (`#FBBF24`) | Estrogen peaks; LH surge triggers egg release | Peak stamina, sunkissed glow, fertile cervical fluid |
| **4. Luteal** | Twilight Blue (`#818CF8`) | Progesterone peaks then declines | Pinay cravings, breast tenderness, sleepy/antukin mood, marupok thoughts |

---

## 🛠️ Project Structure

```
princess-cycle/
├── .github/
│   ├── workflows/test.yml      # GitHub Actions CI automated testing workflow
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── index.html                  # Application shell & semantic view containers
├── manifest.json               # PWA configuration manifest
├── sw.js                       # Service Worker for offline asset caching
├── assets/
│   └── fairy-icon.jpg          # Real fairy princess avatar & favicon
├── css/
│   ├── reset.css               # Modern box-sizing and CSS reset
│   ├── variables.css           # Design tokens, color system & dark mode
│   ├── base.css                # Typography, focus states, accessibility
│   ├── layout.css              # Header, sidebar & mobile bottom nav
│   ├── components.css          # Dial, chips, buttons, sheets & forms
│   ├── responsive.css          # Universal breakpoints (320px, 375px, 768px, 1024px+)
│   └── cute.css                # Kawaii tokens, dark mode fixes, ambient floating orbs
├── js/
│   ├── app.js                  # Application coordinator & routing
│   ├── state.js                # Reactive state store with event pub/sub
│   ├── storage.js              # IndexedDB & LocalStorage persistence layer
│   ├── cycle.js                # Cycle engine, gap predictor & Filipino nutrition
│   ├── validation.js           # Form validation, bounds & XSS sanitizer
│   ├── ui.js                   # UI rendering, multi-segment dial & toasts
│   ├── calendar.js             # Monthly interactive calendar & day inspector
│   ├── insights.js             # High-DPI canvas charts & clinical report
│   ├── history.js              # Historical cycle timeline, search & logger
│   ├── sleep.js                # Sleep tracking engine & morning wake detector
│   ├── sharing.js              # Privacy-first partner sharing simulator & QR
│   ├── affirmations.js         # Taglish affirmations & Spicy Mode rescue kit
│   ├── notifications.js        # Gentle reminder scheduler & web alerts
│   ├── audio.js                # Web Audio API ambient soundscape synthesizer
│   ├── relaxation.js           # Guided breathing & cramp relief pacer
│   ├── privacy-lock.js         # 4-digit PIN lock & screen shield
│   ├── rituals.js               # Self-Care Ritual engine (phase-aware defs, streaks)
│   ├── rituals-view.js          # Self-Care Sanctuary view (checklist, canvas, deep-links)
│   └── demo-data.js            # Realistic Philippine demo data generator
├── tests/
│   ├── runner.html             # Visual browser test runner
│   └── cycle-engine.test.js    # Unit test suite (45+ assertions)
├── CONTRIBUTING.md             # Developer guidelines
├── CHANGELOG.md                # Release logs
├── LICENSE                     # MIT License
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started & Running Locally

PrincessCycle has **no external dependencies or build tools required**. Any static web server can serve the application.

### Option 1: Using Python
```bash
# Navigate to the project directory
cd princess-cycle

# Start a local static server
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Using Node.js (`npx serve`)
```bash
npx serve .
```

### Option 3: GitHub Pages Deployment (Zero Setup)
1. Push this repository to your GitHub account.
2. Go to **Repository Settings → Pages**.
3. Under **Build and deployment**, select `Deploy from a branch` and choose `main` / `root`.
4. Your application will be live immediately at `https://<your-username>.github.io/<repo-name>/`.

---

## 🧪 Running Automated Tests

To execute the automated unit test suite:
1. Start your local server as shown above.
2. Navigate to `http://localhost:8000/tests/runner.html`.
3. The test suite will automatically execute all 40+ assertions and report verification status.

---

## 🔒 Privacy & Data Ownership Pledge

1. **Zero Tracking**: No Google Analytics, no Facebook Pixels, no third-party scripts.
2. **On-Device Storage**: Your health information is stored directly in your browser's IndexedDB / LocalStorage.
3. **Data Portability**: Complete backup export as JSON or CSV at any time.
4. **Permanent Deletion**: "Delete All Data" immediately wipes all local storage without trace.

---

## 📜 Medical Responsibility Disclaimer

PrincessCycle is designed solely for personal wellness awareness and cycle understanding. It does **not** diagnose medical conditions and must **never** be used as contraception or fertility control. Always consult a qualified physician or healthcare provider for medical questions.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
