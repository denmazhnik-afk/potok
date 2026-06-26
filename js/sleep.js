// ==================== SLEEP PAGE ====================
let sleepViewOffset = 0;

function buildSleepPage() {
  // Show 14 days centered around today + offset
  const days = [];
  for (let i = 6 - sleepViewOffset; i >= 6 - sleepViewOffset - 13; i--) {
    const d = new Date(ACT_Y, ACT_M, ACT_D - i);
    const y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
    const sl = getSleep(y, m, dd);
    const dur = calcDuration(sl.bed, sl.wake);
    const isToday = y === ACT_Y && m === ACT_M && dd === ACT_D;
    const wd = WEEKDAYS_SHORT[d.getDay()];
    days.push({ y, m, d: dd, sl, dur, isToday, wd, dateStr: `${dd}.${m + 1}` });
  }

  // Chart data
  const chartData = days.slice().reverse().map(day => ({
    date: day.dateStr,
    mins: day.dur,
    quality: day.sl.quality
  }));

  let daysHTML = '';
  days.forEach(day => {
    const durStr = day.dur > 0 ? formatDuration(day.dur) : '—';
    const quality = day.sl.quality || 0;
    const dayKey = `${day.y}-${day.m}-${day.d}`;

    daysHTML += `
      <div class="sleep-day-card ${day.isToday ? 'is-today' : ''}">
        <div class="sleep-day-header">
          <div class="sleep-day-date">
            ${day.isToday ? '📍 ' : ''}${day.d} ${MONTHS_SHORT[day.m]}
            <span class="sleep-day-wd">${day.wd}</span>
          </div>
          <div class="sleep-day-dur">${durStr}</div>
        </div>
        <div class="sleep-day-fields">
          <label class="sleep-day-field">
            <span class="sleep-day-label">🌙 Лёг</span>
            <input type="time" class="sleep-day-input" value="${day.sl.bed || ''}"
              onblur="saveSleepForDay(${day.y},${day.m},${day.d},'bed',this.value)">
          </label>
          <label class="sleep-day-field">
            <span class="sleep-day-label">☀️ Встал</span>
            <input type="time" class="sleep-day-input" value="${day.sl.wake || ''}"
              onblur="saveSleepForDay(${day.y},${day.m},${day.d},'wake',this.value)">
          </label>
        </div>
        <div class="sleep-day-quality">
          <div class="mood-picker" style="margin:0;gap:2px;flex-wrap:wrap">
            ${Array.from({length: 10}, (_, i) => i + 1).map(n => {
              const isActive = n === quality;
              const color = n <= 3 ? 'var(--red)' : n <= 5 ? 'var(--yellow)' : n <= 7 ? 'var(--blue)' : 'var(--green)';
              return `<button class="mood-btn ${isActive ? 'active' : ''}" style="--mood-color: ${color};width:30px;height:30px"
                onclick="saveSleepForDay(${day.y},${day.m},${day.d},'quality',${n})"
                title="${n}">
                <span class="mood-num" style="font-size:11px">${n}</span>
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  });

  // Stats
  const filled = days.filter(d => d.dur > 0);
  const avgDur = filled.length > 0 ? Math.round(filled.reduce((s, d) => s + d.dur, 0) / filled.length) : 0;
  const avgQuality = filled.filter(d => d.sl.quality > 0);
  const avgQ = avgQuality.length > 0 ? Math.round(avgQuality.reduce((s, d) => s + d.sl.quality, 0) / avgQuality.length * 10) / 10 : 0;

  return `
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">😴 Трекер сна</h2>
    </div>

    <div class="section-card" style="margin-bottom:16px">
      <div class="sleep-chart-wrap">
        <canvas class="sleep-chart" id="sleepPageChart" width="600" height="180"></canvas>
      </div>
      <div class="sleep-stats">
        <div class="sleep-stat">
          <div class="sleep-stat-num">${avgDur > 0 ? formatDuration(avgDur) : '—'}</div>
          <div class="sleep-stat-lbl">Среднее</div>
        </div>
        <div class="sleep-stat">
          <div class="sleep-stat-num">${avgQ > 0 ? avgQ + '/10' : '—'}</div>
          <div class="sleep-stat-lbl">Качество</div>
        </div>
        <div class="sleep-stat">
          <div class="sleep-stat-num">${filled.length}</div>
          <div class="sleep-stat-lbl">Записей</div>
        </div>
      </div>
    </div>

    <div class="sleep-nav">
      <button class="btn-secondary" onclick="sleepNav(7)">← 7 дн.</button>
      <button class="btn-secondary" onclick="sleepNav(0)">Сегодня</button>
      <button class="btn-secondary" onclick="sleepNav(-7)">7 дн. →</button>
    </div>

    <div class="sleep-days-list">
      ${daysHTML}
    </div>
  `;
}

function sleepNav(offset) {
  sleepViewOffset = offset;
  render();
}

function saveSleepForDay(y, m, d, field, value) {
  const sl = getSleep(y, m, d);
  if (field === 'quality') {
    sl.quality = value;
  } else {
    sl[field] = value;
  }
  saveSleep(y, m, d, sl);
  render();
}
