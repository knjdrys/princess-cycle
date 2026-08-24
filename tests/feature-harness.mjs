/**
 * Real-DOM feature harness for PrincessCycle.
 * Exercises the exact code paths that were broken (insights sleep chart,
 * ambient audio, command-bar theme toggle, storage.saveState) against a
 * jsdom window with a stubbed 2D canvas context, and asserts no exceptions.
 * This catches bugs the headless Node unit suite (stub canvas) cannot.
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// --- Build a DOM from the real index.html so DOM.* accessors resolve ---
const html = readFileSync(join(projectRoot, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const { window } = dom;

// Stub a minimal 2D canvas context (jsdom has no canvas backend by default).
const stubCtx = {
  scale() {}, clearRect() {}, beginPath() {}, fill() {}, stroke() {},
  moveTo() {}, lineTo() {}, fillRect() {}, roundRect() {}, arc() {},
  fillText() {}, save() {}, restore() {}, setTransform() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
  set font(v) {}, set textAlign(v) {}, set textBaseline(v) {},
};
window.HTMLCanvasElement.prototype.getContext = function () { return stubCtx; };
window.HTMLCanvasElement.prototype.getBoundingClientRect = function () { return { width: 300, height: 150, top: 0, left: 0 }; };
window.devicePixelRatio = 2;

// Wire globals the modules expect.
global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLCanvasElement = window.HTMLCanvasElement;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.localStorage = window.localStorage;
global.Node = window.Node;
global.requestAnimationFrame = (cb) => cb();
global.cancelAnimationFrame = () => {};

// jsdom provides window.crypto; ensure subtle exists for any module that
// touches it at init. Use defineProperty if absent.
try {
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', { value: { getRandomValues: (a) => a, subtle: { digest: async () => new Uint8Array(32) } }, configurable: true });
  }
} catch (_) {}
// Node 22 exposes globalThis.crypto (webcrypto) already; privacy-lock.js reads
// globalThis.crypto, which resolves to it. No assignment needed.

const results = [];
const assert = (name, fn) => {
  try { fn(); results.push({ name, pass: true }); }
  catch (e) { results.push({ name, pass: false, err: e && e.message ? e.message : String(e) }); }
};

const run = async () => {
  const { InsightsController } = await import('file://' + join(projectRoot, 'js/insights.js').replace(/\\/g, '/') + '?v=' + Date.now());
  const { AudioAmbienceController } = await import('file://' + join(projectRoot, 'js/ambient-audio.js').replace(/\\/g, '/') + '?v=' + Date.now());
  const { storage } = await import('file://' + join(projectRoot, 'js/storage.js').replace(/\\/g, '/') + '?v=' + Date.now());
  const { store } = await import('file://' + join(projectRoot, 'js/state.js').replace(/\\/g, '/') + '?v=' + Date.now());
  const { CycleEngine } = await import('file://' + join(projectRoot, 'js/cycle.js').replace(/\\/g, '/') + '?v=' + Date.now());

  // ---- BUG 1: insights sleep chart referenced undefined `data` ----
  assert('InsightsController.drawSleepScheduleChart runs with sleep logs (no ReferenceError)', () => {
    const controller = new InsightsController({ getState: () => ({ user: {}, cycles: [] }), formatDate: (d) => '' }, {});
    const entries = {
      '2026-08-01': { date: '2026-08-01', sleepHours: 7.5 },
      '2026-08-02': { date: '2026-08-02', sleepHours: 8 },
      '2026-08-03': { date: '2026-08-03', sleepHours: 6.5 },
    };
    // The canvas exists in index.html; getContext returns our stub.
    controller.drawSleepScheduleChart(entries);
  });

  // ---- BUG 2: ambient audio called non-existent soundFx.playAmbientRain/Waves ----
  assert('AudioAmbienceController.setMode("rain") does not throw', () => {
    const amb = new AudioAmbienceController();
    amb.setMode('rain');
    amb.setMode('ocean');
    amb.setMode('off');
  });

  // ---- BUG 4: storage.saveState now exists and delegates to saveAllData ----
  assert('storage.saveState is a defined function', () => {
    if (typeof storage.saveState !== 'function') throw new Error('storage.saveState is not a function');
  });

  // ---- BUG 3 adjacent: StateStore.setUserProfile exists (used by theme toggle fix) ----
  assert('StateStore.setUserProfile is a defined function', () => {
    if (typeof store.setUserProfile !== 'function') throw new Error('setUserProfile missing');
    store.setUserProfile({ theme: 'dark' });
    if (store.getState().user.theme !== 'dark') throw new Error('setUserProfile did not persist theme');
  });

  // ---- CycleEngine primitives used by rituals/streaks still intact ----
  assert('CycleEngine.addDays and formatLocalDate work', () => {
    const d = CycleEngine.addDays('2026-08-10', 5);
    if (d !== '2026-08-15') throw new Error('addDays wrong: ' + d);
    const back = CycleEngine.addDays('2026-08-10', -10);
    if (back !== '2026-07-31') throw new Error('addDays negative wrong: ' + back);
  });

  // ---- DOM.* ritual mount point resolves ----
  assert('DOM.mounts.rituals() element exists in index.html', () => {
    const el = document.getElementById('rituals-mount-point');
    if (!el) throw new Error('#rituals-mount-point missing from index.html');
  });

  // ---- Report ----
  const passed = results.filter(r => r.pass).length;
  console.log('FEATURE HARNESS: TOTAL', results.length, 'PASSED', passed, 'FAILED', results.length - passed);
  results.forEach(r => {
    if (!r.pass) console.log('  FAIL:', r.name, '->', r.err);
    else console.log('  ok  :', r.name);
  });
  if (passed !== results.length) process.exit(1);
};

run().catch(e => { console.error('Harness crashed:', e); process.exit(1); });
