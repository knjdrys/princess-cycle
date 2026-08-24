/**
 * PrincessCycle - Client-Side View Router
 * Handles navigation state, hash-based URL routing, active view mounting & nav highlight synchronisation.
 */

import { DOM } from './dom.js';

export class Router {
  constructor(stateStore, routeHandlers = {}) {
    this.store = stateStore;
    this.handlers = routeHandlers; // e.g. { home: fn, calendar: fn, insights: fn, history: fn, sharing: fn, settings: fn }
    this.currentView = null;       // Single source of truth — prevents double mounts
    this.isInitialized = false;
  }

  init() {
    // 1. Wire hash change listener (browser back/forward, manual URL edits)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace(/^#\/?/, '') || 'home';
      this.navigateTo(hash, false);
    });

    // 2. Wire navigation clicks with event delegation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-view]');
      if (!link) return;

      e.preventDefault();
      const viewName = link.getAttribute('data-view');
      this.navigateTo(viewName, true);
    });

    this.isInitialized = true;

    // 3. Initial route resolution
    const initialRoute = window.location.hash.replace(/^#\/?/, '') || this.store.getState().currentView || 'home';
    this.navigateTo(initialRoute, false);
  }

  navigateTo(viewName, updateHash = true) {
    const validViews = ['home', 'calendar', 'insights', 'history', 'sharing', 'rituals', 'settings'];
    const targetView = validViews.includes(viewName) ? viewName : 'home';

    if (updateHash && window.location.hash.replace(/^#\/?/, '') !== targetView) {
      // Setting location.hash triggers hashchange → which calls
      // navigateTo(targetView, false) again. The currentView guard below
      // makes that second call a no-op instead of a duplicate mount.
      window.location.hash = targetView;
      return;
    }

    // Idempotency guard: skip if we are already showing this view.
    // renderCurrentView() calls navigateTo(current) to force-refresh;
    // that path passes updateHash=false and must still re-mount.
    const isRefresh = !updateHash && targetView === this.currentView;
    if (this.currentView === targetView && !isRefresh) {
      return;
    }

    this.currentView = targetView;

    // Update State
    this.store.setCurrentView(targetView);

    // Update Active View Sections in DOM
    Object.entries(DOM.views).forEach(([name, getEl]) => {
      const el = getEl();
      if (el) {
        el.classList.toggle('active', name === targetView);
      }
    });

    // Update Active Navigation Links in Sidebar and Bottom Bar
    document.querySelectorAll('[data-view]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === targetView);
    });

    // Scroll to top of main viewport smoothly
    const mainEl = DOM.mainContent();
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Execute mount handler for the target view if registered
    if (typeof this.handlers[targetView] === 'function') {
      try {
        this.handlers[targetView]();
      } catch (err) {
        console.error(`Error mounting view "${targetView}":`, err);
      }
    }
  }
}
