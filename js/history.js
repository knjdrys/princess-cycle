/**
 * PrincessCycle - Cycle History Controller
 * Expandable past cycles, filter by symptoms/moods, and past period logger
 */

import { Validation } from './validation.js';
import { FocusTrap, UI } from './ui.js';
export class HistoryController {
  constructor(stateStore, onSaveNewCycle, onDeleteCycle) {
    this.store = stateStore;
    this.onSaveNewCycle = onSaveNewCycle;
    this.onDeleteCycle = onDeleteCycle;
    this.searchQuery = '';
    this.focusTrapHandle = null;
  }

  render(containerElement) {
    if (!containerElement) return;

    const state = this.store.getState();
    let cycles = state.cycles || [];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      cycles = cycles.filter(c => 
        (c.startDate && c.startDate.includes(q)) ||
        (c.endDate && c.endDate.includes(q)) ||
        (c.cycleLength && String(c.cycleLength).includes(q))
      );
    }

    let cyclesHtml = '';

    if (cycles.length === 0) {
      cyclesHtml = `
        <div class="empty-state card">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h4 class="empty-state-title">${this.searchQuery ? 'No matching cycles found' : 'No Previous Cycles Recorded'}</h4>
          <p class="empty-state-desc">${this.searchQuery ? 'Try a different year, month, or cycle length.' : 'Your logged cycle history will appear here as you record periods over time.'}</p>
          <button class="btn btn-secondary btn-sm" id="btn-add-past-cycle">+ Log Past Period</button>
        </div>
      `;
    } else {
      const esc = UI.esc;
      cyclesHtml = `
        <div class="flex justify-between items-center" style="margin-bottom: var(--space-md);">
          <h3 class="card-title">Completed Cycles (${cycles.length})</h3>
          <button class="btn btn-secondary btn-sm" id="btn-add-past-cycle">+ Log Past Period</button>
        </div>

        <div style="margin-bottom: var(--space-md);">
          <input type="text" class="form-control" id="history-search-input" placeholder="🔍 Search cycles by year, month, or length..." value="${esc(this.searchQuery)}" aria-label="Search past cycles" />
        </div>

        <div id="history-cycles-list" class="flex flex-col gap-md">
          ${cycles.map((c, i) => `
            <div class="card cycle-history-item" data-cycle-id="${esc(c.id || String(i))}">
              <div class="flex justify-between items-center">
                <div>
                  <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">
                    ${esc(c.startDate)} <span style="font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 400;">to</span> ${esc(c.endDate || 'Next Period')}
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 2px;">
                    ${c.periodLength || 5} days period flow
                  </div>
                </div>
                <div class="flex items-center gap-md">
                  <div class="text-center">
                    <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-primary);">${c.cycleLength || '--'}</div>
                    <div style="font-size: 0.6875rem; color: var(--text-tertiary); text-transform: uppercase;">days</div>
                  </div>
                  <button class="btn btn-ghost btn-icon-only btn-delete-cycle" data-cycle-id="${esc(c.id)}" aria-label="Delete cycle starting ${esc(c.startDate)}" style="color: var(--text-tertiary);">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    containerElement.innerHTML = `
      <div class="history-view-container">
        ${cyclesHtml}
      </div>
    `;

    this.attachEvents(containerElement);
  }

  attachEvents(container) {
    const addBtn = container.querySelector('#btn-add-past-cycle');
    const searchInput = container.querySelector('#history-search-input');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddPastCycleModal();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        // Update ONLY the cycle list region so the search input keeps focus
        // between keystrokes (full re-render used to destroy it after 1 char).
        const listMount = container.querySelector('#history-cycles-list');
        if (!listMount) {
          // Search field not yet rendered alongside a list (empty state) —
          // a full render is safe here because there is no input to lose.
          this.render(container);
          return;
        }

        const state = this.store.getState();
        let cycles = state.cycles || [];
        const q = this.searchQuery.trim().toLowerCase();
        if (q) {
          cycles = cycles.filter(c =>
            (c.startDate && c.startDate.includes(q)) ||
            (c.endDate && c.endDate.includes(q)) ||
            (c.cycleLength && String(c.cycleLength).includes(q))
          );
        }

        const esc = UI.esc;
        if (cycles.length === 0) {
          listMount.innerHTML = `
            <div class="card text-center" style="padding: var(--space-xl);">
              <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--space-md);">
                No cycles match "${esc(this.searchQuery)}". Try a different year, month, or length.
              </p>
            </div>
          `;
        } else {
          listMount.innerHTML = cycles.map((c, i) => `
            <div class="card cycle-history-item" data-cycle-id="${esc(c.id || String(i))}">
              <div class="flex justify-between items-center">
                <div>
                  <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">
                    ${esc(c.startDate)} <span style="font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 400;">to</span> ${esc(c.endDate || 'Next Period')}
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 2px;">
                    ${c.periodLength || 5} days period flow
                  </div>
                </div>
                <div class="flex items-center gap-md">
                  <div class="text-center">
                    <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-primary);">${c.cycleLength || '--'}</div>
                    <div style="font-size: 0.6875rem; color: var(--text-tertiary); text-transform: uppercase;">days</div>
                  </div>
                  <button class="btn btn-ghost btn-icon-only btn-delete-cycle" data-cycle-id="${esc(c.id)}" aria-label="Delete cycle starting ${esc(c.startDate)}" style="color: var(--text-tertiary);">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('');
        }
      });
    }

    // Event delegation for delete buttons
    container.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-cycle');
      if (deleteBtn) {
        e.stopPropagation();
        const cycleId = deleteBtn.getAttribute('data-cycle-id');
        this.showDeleteConfirmation(cycleId);
      }
    });
  }

  showDeleteConfirmation(cycleId) {
    let dialogOverlay = document.getElementById('history-delete-dialog');
    if (!dialogOverlay) {
      dialogOverlay = document.createElement('div');
      dialogOverlay.id = 'history-delete-dialog';
      dialogOverlay.className = 'pin-lock-backdrop';
      dialogOverlay.setAttribute('role', 'alertdialog');
      dialogOverlay.setAttribute('aria-modal', 'true');
      dialogOverlay.setAttribute('aria-label', 'Delete Cycle Confirmation');
      document.body.appendChild(dialogOverlay);
    }

    dialogOverlay.innerHTML = `
      <div class="modal-container text-center" style="max-width: 360px; padding: var(--space-xl);">
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">Delete Cycle Record?</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-lg);">
          Are you sure you want to delete this past cycle from your records?
        </p>
        <div class="flex gap-sm justify-center">
          <button class="btn btn-secondary btn-sm" id="btn-cancel-delete-cycle">Cancel</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-delete-cycle">Delete Record</button>
        </div>
      </div>
    `;

    dialogOverlay.classList.add('active');

    const trap = FocusTrap.trap(dialogOverlay, () => closeDialog());

    const closeDialog = () => {
      dialogOverlay.classList.remove('active');
      trap.release();
    };

    const cancelBtn = dialogOverlay.querySelector('#btn-cancel-delete-cycle');
    const confirmBtn = dialogOverlay.querySelector('#btn-confirm-delete-cycle');

    if (cancelBtn) cancelBtn.onclick = closeDialog;
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        closeDialog();
        if (this.onDeleteCycle) {
          this.onDeleteCycle(cycleId);
        }
      };
    }
  }

  showAddPastCycleModal() {
    let modalBackdrop = document.getElementById('history-modal-backdrop');
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'history-modal-backdrop';
      modalBackdrop.className = 'modal-backdrop';
      modalBackdrop.setAttribute('role', 'dialog');
      modalBackdrop.setAttribute('aria-modal', 'true');
      modalBackdrop.setAttribute('aria-label', 'Log Past Period');
      document.body.appendChild(modalBackdrop);
    }

    const todayStr = this.store.formatDate(new Date());

    modalBackdrop.innerHTML = `
      <div class="modal-container">
        <div class="sheet-header">
          <h3 class="card-title">Log Past Period</h3>
          <button class="btn btn-ghost btn-icon-only" id="close-history-modal" aria-label="Close modal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="sheet-body">
          <form id="past-cycle-form">
            <div class="form-group">
              <label class="form-label" for="past-start-date">First Day of Period</label>
              <input type="date" class="form-control" id="past-start-date" max="${todayStr}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="past-cycle-len">Cycle Length (Days)</label>
              <input type="number" class="form-control" id="past-cycle-len" min="18" max="60" value="28" required />
              <p class="form-hint">Days from the start of this period to the start of the next.</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="past-period-len">Period Bleeding Length (Days)</label>
              <input type="number" class="form-control" id="past-period-len" min="1" max="15" value="5" required />
            </div>
          </form>
        </div>
        <div class="sheet-footer flex justify-between gap-sm">
          <button type="button" class="btn btn-secondary btn-block" id="cancel-history-modal">Cancel</button>
          <button type="button" class="btn btn-primary btn-block" id="submit-history-modal">Save Past Cycle</button>
        </div>
      </div>
    `;

    modalBackdrop.classList.add('active');

    const trap = FocusTrap.trap(modalBackdrop, () => closeModal());

    const closeModal = () => {
      modalBackdrop.classList.remove('active');
      trap.release();
    };

    modalBackdrop.querySelector('#close-history-modal').addEventListener('click', closeModal);
    modalBackdrop.querySelector('#cancel-history-modal').addEventListener('click', closeModal);

    modalBackdrop.querySelector('#submit-history-modal').addEventListener('click', () => {
      const startDate = modalBackdrop.querySelector('#past-start-date').value;
      const cycleLength = Number(modalBackdrop.querySelector('#past-cycle-len').value);
      const periodLength = Number(modalBackdrop.querySelector('#past-period-len').value);

      if (!Validation.isValidDateString(startDate)) {
        UI.showToast('Please select a valid past date.', 'warning');
        return;
      }
      if (!Validation.isValidCycleLength(cycleLength)) {
        UI.showToast('Cycle length must be between 18 and 60 days.', 'warning');
        return;
      }
      if (!Validation.isValidPeriodLength(periodLength, cycleLength)) {
        UI.showToast('Period length must be between 1 and 15 days.', 'warning');
        return;
      }

      if (this.onSaveNewCycle) {
        this.onSaveNewCycle({
          id: 'cycle_' + Date.now(),
          startDate,
          cycleLength,
          periodLength,
          createdAt: new Date().toISOString()
        });
      }

      closeModal();
    });
  }
}
