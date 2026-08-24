/**
 * PrincessCycle - Insights & Analytics Engine
 * Zero-dependency retina canvas charts: Hormone Curves, Sleep Schedule Rhythm, Cycle History, Moods & Clinical Report
 */

import { CycleEngine, PHASES, PHASE_META, SEED_CYCLING_GUIDE, PHASE_GROCERY_LISTS } from './cycle.js';
import { UI } from './ui.js';

export class InsightsController {
  constructor(stateStore) {
    this.store = stateStore;
  }

  render(containerElement) {
    if (!containerElement) return;

    const state = this.store.getState();
    const user = state.user;
    const analytics = CycleEngine.calculateAnalytics(state.cycles, state.dailyEntries);
    const { avgCycleLength, avgPeriodLength, confidenceMargin } = CycleEngine.getEffectiveCycleMetrics(user, state.cycles);
    const todayStr = this.store.formatDate(new Date());
    const cycleInfo = CycleEngine.getCycleDayAndPhase(todayStr, user?.lastPeriodStart, avgCycleLength, avgPeriodLength);
    const observations = CycleEngine.generateSmartObservations(analytics, cycleInfo.phase);

    const isFollicularSeed = cycleInfo.cycleDay <= (avgCycleLength - 14);
    const seedGuide = isFollicularSeed ? SEED_CYCLING_GUIDE.follicular : SEED_CYCLING_GUIDE.luteal;
    const groceryItems = PHASE_GROCERY_LISTS[cycleInfo.phase] || PHASE_GROCERY_LISTS[PHASES.FOLLICULAR];

    const html = `
      <div class="insights-container">
        <!-- Top Metrics Cards Grid -->
        <div class="insights-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-xl);">
          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Avg Cycle</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 4px 0;">${analytics.avgCycleLength} <span style="font-size: 0.875rem; font-weight: 400;">days</span></div>
            <div class="tag-estimated">Based on history</div>
          </div>

          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Avg Period</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: var(--phase-menstruation-text); margin: 4px 0;">${analytics.avgPeriodLength} <span style="font-size: 0.875rem; font-weight: 400;">days</span></div>
            <div class="tag-estimated">Bleeding duration</div>
          </div>

          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Avg Sleep</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 4px 0;">${analytics.avgSleep} <span style="font-size: 0.875rem; font-weight: 400;">hrs</span></div>
            <div class="tag-logged">Logged schedule</div>
          </div>

          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Top Feeling</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin: 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${UI.esc(analytics.topMood)}">${UI.esc(analytics.topMood)}</div>
            <div class="tag-logged">Most logged</div>
          </div>

          <div class="card text-center" style="padding: var(--space-md);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Consistency</div>
            <div style="font-size: 1.15rem; font-weight: 600; color: var(--color-success); margin: 8px 0;">${analytics.regularity}</div>
            <div class="tag-estimated">Window: ±${confidenceMargin} days</div>
          </div>
        </div>

        <!-- Smart Observations Card -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <div>
              <h3 class="card-title">Cycle & Sleep Observations</h3>
              <p class="card-subtitle">Non-diagnostic personal reflections based on your logs</p>
            </div>
            <span class="badge badge-subtle">Awareness</span>
          </div>
          <div class="flex flex-col gap-sm">
            ${observations.map(obs => `
              <div class="flex items-center gap-md" style="padding: var(--space-sm); background: var(--bg-surface-subtle); border-radius: var(--radius-md);">
                <div style="color: var(--color-primary); flex-shrink: 0; font-size: 1.1rem;">✦</div>
                <p style="font-size: 0.875rem; margin: 0; color: var(--text-primary);">${obs.text}</p>
              </div>
            `).join('')}
          </div>
          <div class="flex justify-between items-center" style="margin-top: 14px; flex-wrap: wrap; gap: 8px;">
            <p class="form-hint" style="font-size: 0.75rem; color: var(--text-tertiary); margin: 0;">
              * Pattern reflections are mathematical estimates and not medical diagnoses.
            </p>
            <button class="btn btn-secondary btn-sm" id="btn-open-doctor-summary">📄 Doctor's Summary Report</button>
          </div>
        </div>

        <!-- Sleep Schedule & Rhythm Chart -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <div>
              <h3 class="card-title">Sleep Schedule Rhythm</h3>
              <p class="card-subtitle">Bedtime & wake-up consistency across recent days</p>
            </div>
            <span class="badge badge-luteal">🌙 Sleep Rhythm</span>
          </div>
          <div style="position: relative; width: 100%; height: 210px;">
            <canvas id="sleep-schedule-chart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>

        <!-- Hormone Curve Visualizer Chart -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <div>
              <h3 class="card-title">Estimated Hormone Rhythm</h3>
              <p class="card-subtitle">General physiological curves across your ${avgCycleLength}-day cycle (Currently Day ${cycleInfo.cycleDay})</p>
            </div>
            <span class="badge badge-follicular">Educational</span>
          </div>
          <div style="position: relative; width: 100%; height: 230px;">
            <canvas id="hormone-curve-chart" style="width: 100%; height: 100%;"></canvas>
          </div>
          <div class="flex justify-center gap-lg" style="margin-top: 12px; flex-wrap: wrap; font-size: 0.75rem;">
            <span class="flex items-center gap-xs" style="color: #E08E74;"><span style="display:inline-block; width:12px; height:3px; background:#E08E74; border-radius:2px;"></span> Estrogen</span>
            <span class="flex items-center gap-xs" style="color: #8978A5;"><span style="display:inline-block; width:12px; height:3px; background:#8978A5; border-radius:2px;"></span> Progesterone</span>
            <span class="flex items-center gap-xs" style="color: #CCA065;"><span style="display:inline-block; width:12px; height:3px; background:#CCA065; border-radius:2px;"></span> LH (Surge)</span>
            <span class="flex items-center gap-xs" style="color: #5B84A8;"><span style="display:inline-block; width:12px; height:3px; background:#5B84A8; border-radius:2px;"></span> FSH</span>
          </div>
        </div>

        <!-- Seed Cycling & Grocery Shopping Pair Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-xl);">
          <!-- Seed Cycling Widget -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Seed Cycling Protocol</h3>
                <p class="card-subtitle">Gentle nutritional hormone harmony</p>
              </div>
              <span class="badge badge-subtle">${seedGuide.title.split(' ')[0]}</span>
            </div>
            <div style="background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">🌱 Recommended Seeds:</div>
              <div style="font-size: 0.8125rem; color: var(--color-primary); font-weight: 500;">${seedGuide.seeds}</div>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); margin: 0;">${seedGuide.benefits}</p>
          </div>

          <!-- Phase Grocery Checklist -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Phase Grocery List</h3>
                <p class="card-subtitle">Nourishing staples for your ${PHASE_META[cycleInfo.phase]?.title || 'Cycle'}</p>
              </div>
            </div>
            <div class="flex flex-col gap-xs">
              ${groceryItems.map(item => `
                <label class="flex items-center gap-xs" style="font-size: 0.8125rem; color: var(--text-primary); cursor: pointer; padding: 3px 0;">
                  <input type="checkbox" style="accent-color: var(--color-primary);" />
                  <span>${item}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- History & Mood Charts Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-xl);">
          <!-- Chart 1: Cycle Length History -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Cycle Length History</h3>
                <p class="card-subtitle">Consecutive cycle durations</p>
              </div>
            </div>
            <div style="position: relative; width: 100%; height: 210px;">
              <canvas id="cycle-length-chart" style="width: 100%; height: 100%;"></canvas>
            </div>
          </div>

          <!-- Chart 2: Mood & Symptom Breakdown -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Frequent Experiences</h3>
                <p class="card-subtitle">Most logged emotions and physical sensations</p>
              </div>
            </div>
            <div style="position: relative; width: 100%; height: 210px;">
              <canvas id="mood-breakdown-chart" style="width: 100%; height: 100%;"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    containerElement.innerHTML = html;

    const docReportBtn = containerElement.querySelector('#btn-open-doctor-summary');
    if (docReportBtn) {
      docReportBtn.addEventListener('click', () => {
        this.showDoctorSummaryModal(state, analytics);
      });
    }

    // Schedule all canvas drawing in requestAnimationFrame for high-DPI crisp rendering
    this.scheduleDrawAllCharts(state, cycleInfo, avgCycleLength, analytics);

    // Attach ResizeObserver with debouncing
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (typeof ResizeObserver !== 'undefined') {
      let resizeTimeout = null;
      this.resizeObserver = new ResizeObserver(() => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.scheduleDrawAllCharts(state, cycleInfo, avgCycleLength, analytics);
        }, 120);
      });
      this.resizeObserver.observe(containerElement);
    }
  }

  scheduleDrawAllCharts(state, cycleInfo, avgCycleLength, analytics) {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        this.drawSleepScheduleChart(state.dailyEntries);
        this.drawHormoneChart(cycleInfo.cycleDay, avgCycleLength);
        this.drawCycleLengthChart(analytics.cycleHistory);
        this.drawMoodBreakdownChart(analytics.moodCounts, analytics.symptomCounts);
      });
    } else {
      this.drawSleepScheduleChart(state.dailyEntries);
      this.drawHormoneChart(cycleInfo.cycleDay, avgCycleLength);
      this.drawCycleLengthChart(analytics.cycleHistory);
      this.drawMoodBreakdownChart(analytics.moodCounts, analytics.symptomCounts);
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // Draw Sleep Schedule Canvas Chart (Bedtime to Wake time bars)
  drawSleepScheduleChart(dailyEntries = {}) {
    const canvas = document.getElementById('sleep-schedule-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };

    ctx.clearRect(0, 0, width, height);

    const entries = Object.values(dailyEntries || {})
      .filter(e => e && e.sleepHours)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(-7);

    // Honest empty state: never fabricate sleep numbers.
    if (entries.length === 0) {
      const cs = getComputedStyle(document.documentElement);
      ctx.fillStyle = cs.getPropertyValue('--text-secondary').trim() || '#8F7CA8';
      ctx.font = '13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No sleep logs yet — save a check-in with bedtime & wake time to see your rhythm.', width / 2, height / 2);
      return;
    }

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const gap = chartW / entries.length;
    const barW = Math.min(28, gap * 0.55);

    const computedStyle = getComputedStyle(document.documentElement);
    const borderSubtle = computedStyle.getPropertyValue('--border-subtle').trim() || 'rgba(167, 139, 250, 0.2)';
    const textTertiary = computedStyle.getPropertyValue('--text-tertiary').trim() || '#8F7CA8';
    const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#C8B8E2';
    const textPrimary = computedStyle.getPropertyValue('--text-primary').trim() || '#F5EEFF';
    const sleepColor = computedStyle.getPropertyValue('--phase-luteal').trim() || '#818CF8';

    // Baseline grid lines (e.g. 6h, 8h, 10h)
    ctx.strokeStyle = borderSubtle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    [6, 8, 10].forEach(hrs => {
      const y = padding.top + chartH - ((hrs - 4) / 8) * chartH;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);

      ctx.fillStyle = textTertiary;
      ctx.font = '10px Nunito, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${hrs}h`, padding.left - 6, y + 3);
    });
    ctx.stroke();

    data.forEach((item, idx) => {
      const x = padding.left + (idx * gap) + (gap - barW) / 2;
      const hrs = item.sleepHours || 8;
      const barH = Math.max(8, ((hrs - 4) / 8) * chartH);
      const y = padding.top + chartH - barH;

      ctx.fillStyle = sleepColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Top label (Hours)
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 10px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${hrs}h`, x + barW / 2, y - 5);

      // Date label below
      ctx.fillStyle = textSecondary;
      ctx.font = '10px Nunito, sans-serif';
      const label = item.date ? item.date.slice(5) : `D${idx + 1}`;
      ctx.fillText(label, x + barW / 2, height - 8);
    });
  }

  // Draw Hormone Curve Canvas
  drawHormoneChart(currentDay, cycleLength = 28) {
    const canvas = document.getElementById('hormone-curve-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 30 };

    ctx.clearRect(0, 0, width, height);

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const ovDay = cycleLength - 14;
    const periodEnd = 5;

    // Menstruation band
    const mensesW = (periodEnd / cycleLength) * chartW;
    ctx.fillStyle = 'rgba(244, 114, 182, 0.12)';
    ctx.fillRect(padding.left, padding.top, mensesW, chartH);

    // Ovulation band
    const ovStartW = ((ovDay - 3) / cycleLength) * chartW;
    const ovSpanW = (4 / cycleLength) * chartW;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.fillRect(padding.left + ovStartW, padding.top, ovSpanW, chartH);

    const points = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const day = 1 + (i / steps) * (cycleLength - 1);
      const levels = CycleEngine.getHormoneLevels(day, cycleLength);
      const x = padding.left + (i / steps) * chartW;
      points.push({ x, day, levels });
    }

    const drawCurve = (color, propKey, lineWidth = 2.5) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      points.forEach((p, index) => {
        // Normalized 0–1 values (percent / 100)
        const val = p.levels[propKey];
        const y = padding.top + chartH - (val * chartH * 0.85);
        if (index === 0) ctx.moveTo(p.x, y);
        else ctx.lineTo(p.x, y);
      });
      ctx.stroke();
    };

    drawCurve('#818CF8', 'fshNorm', 2.0);
    drawCurve('#FBBF24', 'lhNorm', 2.0);
    drawCurve('#C084FC', 'progesteroneNorm', 3.0);
    drawCurve('#EC4899', 'estrogenNorm', 3.0);

    const safeDay = Math.max(1, Math.min(currentDay, cycleLength));
    const currentX = padding.left + ((safeDay - 1) / (cycleLength - 1)) * chartW;

    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--color-primary').trim() || '#7C3AED';
    const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#C8B8E2';

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, padding.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(currentX, padding.top + 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textSecondary;
    ctx.font = '10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    [1, periodEnd, ovDay, cycleLength].forEach(day => {
      const x = padding.left + ((day - 1) / (cycleLength - 1)) * chartW;
      ctx.fillText(`Day ${day}`, x, height - 8);
    });
  }

  // Draw Cycle History Bar Chart
  drawCycleLengthChart(history = []) {
    const canvas = document.getElementById('cycle-length-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 35, left: 35 };

    ctx.clearRect(0, 0, width, height);

    const data = history.length > 0 ? history : [];

    // Honest empty state: never fabricate cycle history.
    if (data.length === 0) {
      const cs = getComputedStyle(document.documentElement);
      ctx.fillStyle = cs.getPropertyValue('--text-secondary').trim() || '#8F7CA8';
      ctx.font = '13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Log two period starts (Home → 🩸 Period Started) to see your history here.', width / 2, height / 2);
      return;
    }

    const maxVal = Math.max(35, ...data.map(d => d.cycleLength + 2));
    const minVal = 20;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barWidth = Math.min(36, chartW / (data.length * 1.8));
    const gap = chartW / data.length;

    const computedStyle = getComputedStyle(document.documentElement);
    const borderSubtle = computedStyle.getPropertyValue('--border-subtle').trim() || 'rgba(167, 139, 250, 0.2)';
    const textTertiary = computedStyle.getPropertyValue('--text-tertiary').trim() || '#8F7CA8';
    const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#C8B8E2';
    const textPrimary = computedStyle.getPropertyValue('--text-primary').trim() || '#F5EEFF';
    const primaryColor = computedStyle.getPropertyValue('--color-primary').trim() || '#7C3AED';

    ctx.strokeStyle = borderSubtle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    [24, 28, 32].forEach(level => {
      const y = padding.top + chartH - ((level - minVal) / (maxVal - minVal)) * chartH;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);

      ctx.fillStyle = textTertiary;
      ctx.font = '10px Nunito, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${level}d`, padding.left - 6, y + 3);
    });
    ctx.stroke();

    data.forEach((item, index) => {
      const x = padding.left + (index * gap) + (gap - barWidth) / 2;
      const barH = ((item.cycleLength - minVal) / (maxVal - minVal)) * chartH;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.cycleLength}d`, x + barWidth / 2, y - 6);

      ctx.fillStyle = textSecondary;
      ctx.font = '10px Nunito, sans-serif';
      const label = item.startDate ? item.startDate.slice(5) : `C${index + 1}`;
      ctx.fillText(label, x + barWidth / 2, height - 10);
    });
  }

  // Draw Mood & Symptom Breakdown
  drawMoodBreakdownChart(moodCounts = {}, symptomCounts = {}) {
    const canvas = document.getElementById('mood-breakdown-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 30, bottom: 20, left: 80 };

    ctx.clearRect(0, 0, width, height);

    const items = [
      ...Object.entries(moodCounts).map(([k, v]) => ({ label: k, count: v, type: 'mood' })),
      ...Object.entries(symptomCounts).map(([k, v]) => ({ label: k, count: v, type: 'symptom' }))
    ].sort((a, b) => b.count - a.count).slice(0, 4);

    if (items.length === 0) {
      const cs = getComputedStyle(document.documentElement);
      ctx.fillStyle = cs.getPropertyValue('--text-secondary').trim() || '#8F7CA8';
      ctx.font = '13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No mood or symptom logs yet — your daily check-ins will paint this chart.', width / 2, height / 2);
      return;
    }

    const maxCount = Math.max(1, ...items.map(i => i.count));
    const chartW = width - padding.left - padding.right;
    const barH = 18;
    const rowH = (height - padding.top - padding.bottom) / items.length;

    const computedStyle = getComputedStyle(document.documentElement);
    const textColor = computedStyle.getPropertyValue('--text-primary').trim() || '#F5EEFF';
    const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#C8B8E2';
    const moodBarColor = '#EC4899';
    const symptomBarColor = '#C084FC';

    items.forEach((item, index) => {
      const y = padding.top + (index * rowH) + (rowH - barH) / 2;
      const barLen = Math.max(12, (item.count / maxCount) * chartW);

      ctx.fillStyle = textSecondary;
      ctx.font = '11px Nunito, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.label, padding.left - 10, y + 13);

      ctx.fillStyle = item.type === 'mood' ? moodBarColor : symptomBarColor;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, barLen, barH, [0, 6, 6, 0]);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.count}x`, padding.left + barLen + 8, y + 13);
    });
  }

  // Doctor's Printable Summary Modal
  showDoctorSummaryModal(state, analytics) {
    let modalBackdrop = document.getElementById('doctor-report-backdrop');
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'doctor-report-backdrop';
      modalBackdrop.className = 'modal-backdrop';
      document.body.appendChild(modalBackdrop);
    }

    const user = state.user;
    const cycles = state.cycles || [];
    const todayStr = this.store.formatDate(new Date());
    const esc = UI.esc;

    modalBackdrop.innerHTML = `
      <div class="modal-container" style="max-width: 600px; max-height: 90vh;">
        <div class="sheet-header">
          <div>
            <h3 class="card-title">Clinical Cycle & Sleep Summary</h3>
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">Exportable / Printable for Healthcare Provider</span>
          </div>
          <button class="btn btn-ghost btn-icon-only" id="close-doctor-modal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="sheet-body" id="doctor-printable-area" style="font-size: 0.875rem;">
          <div style="border-bottom: 2px solid var(--border-medium); padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Menstrual Cycle & Sleep Tracking Record</h2>
            <div class="flex justify-between" style="font-size: 0.8125rem; color: var(--text-secondary);">
              <span>Patient/User: <strong>${esc(user.name || 'Princess')}</strong></span>
              <span>Generated: ${esc(todayStr)}</span>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 8px;">Key Cycle & Sleep Metrics</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-md);">
              <div>Average Cycle Length: <strong>${analytics.avgCycleLength} days</strong></div>
              <div>Average Bleeding Duration: <strong>${analytics.avgPeriodLength} days</strong></div>
              <div>Cycle Regularity: <strong>${esc(analytics.regularity)} (±${analytics.stdDev}d)</strong></div>
              <div>Average Logged Sleep: <strong>${analytics.avgSleep} hrs/night</strong></div>
              <div>Completed Cycles Logged: <strong>${analytics.totalCycles}</strong></div>
              <div>Most Logged Physical Symptom: <strong>${esc(analytics.topSymptom)}</strong></div>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 8px;">Recent Cycle History</h4>
            <table style="width: 100%; font-size: 0.8125rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); text-align: left;">
              <thead>
                <tr style="background: var(--bg-surface-subtle); border-bottom: 1px solid var(--border-subtle);">
                  <th style="padding: 6px 10px;">Start Date</th>
                  <th style="padding: 6px 10px;">Cycle Days</th>
                  <th style="padding: 6px 10px;">Flow Days</th>
                </tr>
              </thead>
              <tbody>
                ${cycles.slice(0, 6).map(c => `
                  <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 6px 10px;">${esc(c.startDate)}</td>
                    <td style="padding: 6px 10px;">${c.cycleLength || '--'} days</td>
                    <td style="padding: 6px 10px;">${c.periodLength || 5} days</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="background: var(--bg-surface-subtle); padding: 10px; border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.4;">
            <strong>Note:</strong> PrincessCycle is an observational self-tracking tool. Data is self-reported by the user on-device. Cycle calculations are mathematical estimates.
          </div>
        </div>

        <div class="sheet-footer flex justify-between gap-sm">
          <button class="btn btn-secondary btn-block" id="btn-close-doc-report">Close</button>
          <button class="btn btn-primary btn-block" id="btn-print-doc-report">🖨️ Print / Save as PDF</button>
        </div>
      </div>
    `;

    modalBackdrop.classList.add('active');

    const closeModal = () => modalBackdrop.classList.remove('active');
    modalBackdrop.querySelector('#close-doctor-modal').addEventListener('click', closeModal);
    modalBackdrop.querySelector('#btn-close-doc-report').addEventListener('click', closeModal);

    modalBackdrop.querySelector('#btn-print-doc-report').addEventListener('click', () => {
      window.print();
    });
  }
}
