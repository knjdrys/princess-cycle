/**
 * PrincessCycle - Client-Side View Router
 * Handles navigation state, hash-based URL routing, active view mounting & nav highlight synchronisation.
 */

import { DOM } from './dom.js';

export class Router {
  constructor(stateStore, routeHandlers = {}) {
    this.store = stateStore;
    this.handlers = routeHandlers; // e.g. { home: fn, calendar: fn, insights: fn, history: fn, sharing: fn, settings: fn }
  }

  init() {
    // 1. Wire hash change listener
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

    // 3. Initial route resolution
    const initialRoute = window.location.hash.replace(/^#\/?/, '') || this.store.getState().currentView || 'home';
    this.navigateTo(initialRoute, false);
  }

  navigateTo(viewName, updateHash = true) {
    const validViews = ['home', 'calendar', 'insights', 'history', 'sharing', 'settings'];
    const targetView = validViews.includes(viewName) ? viewName : 'home';

    if (updateHash && window.location.hash.replace(/^#\/?/, '') !== targetView) {
      window.location.hash = targetView;
    }

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
