// ==================== SLEEP PAGE ====================
window.sleepViewOffset = window.sleepViewOffset || 0;
window.editingQualityKey = window.editingQualityKey || null;
window._manualSleepDate = window._manualSleepDate || null;

function buildSleepPage() {
  const days = [];
  let i = 0 - window.sleepViewOffset;
  let found = 0;
  let attempts = 0;

  // Ищем 14 дней
  while (found < 14 && attempts < 150) {
    const d = new Date(ACT_Y, ACT_M, ACT_D - i);
    const y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
    const sl = getSleep(y, m, dd);
    
    const hasData = !!(sl.bed || sl.wake || sl.quality > 0);
    const isToday = y === ACT_Y && m === ACT_M && dd === ACT_D;
    const isManual = window._manualSleepDate === `${y}-${m}-${dd}`;

    if (hasData || isToday || isManual) {
      const dur = calcDuration(sl.bed, sl.wake);
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const wd = WEEKDAYS_SHORT[dayIdx];
      const mName = typeof MONTHS_GEN !== 'undefined' ? MONTHS_GEN[m] : MONTHS_SHORT[m];
      
      days.push({ y, m, d: dd, sl, dur, isToday, wd, dateStr: `${dd}.${m + 1}`, dateFull: `${dd} ${mName}`, hasData });
      found++;
    }
    i++;
    attempts++;
  }

  // ✦ РАЗВОРАЧИВАЕМ МАССИВ: теперь даты идут строго сверху вниз (хронологически) ✦
  days.reverse();

  // Данные для графика (уже в правильном порядке)
  const chartData = days.map(day => ({
    date: day.dateStr,
    mins: day.dur,
    quality: day.sl.quality
  }));
  window.sleepChartData = chartData;

  // Красивая иконка часов вместо стрелочек обновления
  const clockIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

  let daysHTML = '';
  days.forEach(day => {
    const durStr = day.dur > 0 ? formatDuration(day.dur) : '—';
    const quality = day.sl.quality || 0;
    const dayKey = `${day.y}-${day.m}-${day.d}`;
    const isQualOpen = window.editingQualityKey === dayKey;
    
    // Умные цвета качества
    let qColor = 'var(--text-tertiary)';
    let qBg = 'rgba(255,255,255,0.05)';
    if (quality > 0) {
      if (quality <= 2) { qColor = 'var(--red)'; qBg = 'rgba(239,68,68,0.15)'; }
      else if (quality <= 5) { qColor = 'var(--yellow)'; qBg = 'rgba(245,158,11,0.15)'; }
      else if (quality <= 8) { qColor = 'var(--blue)'; qBg = 'rgba(59,130,246,0.15)'; }
      else { qColor = 'var(--green)'; qBg = 'rgba(16,185,129,0.15)'; }
    }

    daysHTML += `
      <div class="sleep-day-card" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:12px;">
        
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:800; font-size:15px; display:flex; align-items:center; gap:8px;">
            ${day.isToday ? '<div style="width:8px; height:8px; background:var(--green); border-radius:50%; box-shadow:0 0 8px var(--green);" title="Сегодня"></div>' : ''}
            ${day.dateFull}, <span style="color:var(--text-tertiary); font-weight:600;">${day.wd}</span>
          </div>
          ${day.hasData ? `<button onclick="clearSleepForDay(${day.y},${day.m},${day.d})" style="background:none; border:none; color:#636366; font-size:20px; padding:0 4px; cursor:pointer;" title="Очистить день">×</button>` : ''}
        </div>

        <div style="display:flex; gap:8px;">
          <label style="flex:1; background:rgba(0,0,0,0.25); padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.02);">
            <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center; gap:4px; margin-bottom:4px; font-weight:600;">${ICONS.moon} Лёг</span>
            <input type="time" style="width:100%; background:none; border:none; color:#fff; font-size:16px; font-weight:800; outline:none;" value="${day.sl.bed || ''}" onblur="saveSleepForDay(${day.y},${day.m},${day.d},'bed',this.value)">
          </label>
          <label style="flex:1; background:rgba(0,0,0,0.25); padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.02);">
            <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center; gap:4px; margin-bottom:4px; font-weight:600;">${ICONS.sun} Встал</span>
            <input type="time" style="width:100%; background:none; border:none; color:#fff; font-size:16px; font-weight:800; outline:none;" value="${day.sl.wake || ''}" onblur="saveSleepForDay(${day.y},${day.m},${day.d},'wake',this.value)">
          </label>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <div style="color:var(--text-tertiary); font-size:14px; font-weight:700; display:flex; align-items:center; gap:6px;">
            ${clockIcon} ${durStr}
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-tertiary); font-weight:700;">
            Качество: 
            <button onclick="toggleQuality('${dayKey}')" style="background:${qBg}; color:${qColor}; border:none; padding:4px 14px; border-radius:8px; font-size:14px; font-weight:800; cursor:pointer; transition:0.2s;">
              ${quality > 0 ? quality : '—'}
            </button>
          </div>
        </div>
        
        ${isQualOpen ? `
          <div style="margin-top:8px; padding-top:16px; border-top:1px dashed rgba(255,255,255,0.1); display:flex; gap:6px; justify-content:space-between;">
            ${Array.from({length:10}, (_,i)=>i+1).map(n => {
              const color = n <= 2 ? 'var(--red)' : n <= 5 ? 'var(--yellow)' : n <= 8 ? 'var(--blue)' : 'var(--green)';
              const active = n === quality;
              return `<button onclick="saveSleepForDay(${day.y},${day.m},${day.d},'quality',${n}); toggleQuality(null);" style="flex:1; height:36px; border-radius:8px; border:none; background:${active ? color : 'rgba(255,255,255,0.05)'}; color:${active ? '#000' : color}; font-weight:800; font-size:14px; cursor:pointer; transition:0.2s;">${n}</button>`;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  const filled = days.filter(d => d.dur > 0);
  const avgDur = filled.length > 0 ? Math.round(filled.reduce((s, d) => s + d.dur, 0) / filled.length) : 0;
  const avgQuality = filled.filter(d => d.sl.quality > 0);
  const avgQ = avgQuality.length > 0 ? Math.round(avgQuality.reduce((s, d) => s + d.sl.quality, 0) / avgQuality.length * 10) / 10 : 0;

  let avgQColor = 'inherit';
  if (avgQ > 0) avgQColor = avgQ <= 2 ? 'var(--red)' : avgQ <= 5 ? 'var(--yellow)' : avgQ <= 8 ? 'var(--blue)' : 'var(--green)';

  return `
    <style>
      .sleep-days-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
      @media(min-width: 768px) { .sleep-days-grid { grid-template-columns: 1fr 1fr; } }
    </style>
    
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="back-btn" onclick="goHome()">← Назад</button>
        <h2 class="page-heading">${ICONS.moon} Сон</h2>
      </div>
    </div>

    <div class="section-card" style="margin-bottom:20px">
      <div class="sleep-chart-wrap">
        <canvas class="sleep-chart" id="sleepPageChart" width="600" height="180"></canvas>
      </div>
      <div class="sleep-stats">
        <div class="sleep-stat">
          <div class="sleep-stat-num">${avgDur > 0 ? formatDuration(avgDur) : '—'}</div>
          <div class="sleep-stat-lbl">Среднее</div>
        </div>
        <div class="sleep-stat">
          <div class="sleep-stat-num" style="color:${avgQColor}">${avgQ > 0 ? avgQ + '/10' : '—'}</div>
          <div class="sleep-stat-lbl">Качество</div>
        </div>
        <div class="sleep-stat">
          <div class="sleep-stat-num">${filled.length}</div>
          <div class="sleep-stat-lbl">Записей</div>
        </div>
      </div>
    </div>

    <div class="sleep-nav" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; gap:8px;">
        <button class="btn-secondary" onclick="sleepNav(-7)">← 7 дн.</button>
        <button class="btn-secondary" onclick="sleepNav('today')">Сегодня</button>
        <button class="btn-secondary" onclick="sleepNav(7)">7 дн. →</button>
      </div>
      <label class="btn-primary" style="position:relative; display:inline-flex; align-items:center; padding:8px 16px; cursor:pointer; font-size:13px; font-weight:700; margin:0; border-radius:8px;">
        + Добавить
        <input type="date" onchange="addManualSleep(this.value)" style="opacity:0; position:absolute; width:100%; height:100%; left:0; top:0; cursor:pointer;">
      </label>
    </div>

    <div class="sleep-days-grid" style="margin-top:20px;">
      ${daysHTML || '<div class="empty-state" style="grid-column: 1 / -1; padding: 40px 0;">Нет записей</div>'}
    </div>
  `;
}

// Функции-помощники
function sleepNav(offset) {
  if (offset === 'today') window.sleepViewOffset = 0;
  else window.sleepViewOffset += offset;
  render();
}

function saveSleepForDay(y, m, d, field, value) {
  const sl = getSleep(y, m, d);
  sl[field] = value;
  saveSleep(y, m, d, sl);
  render();
}

function clearSleepForDay(y, m, d) {
  if (confirm('Сбросить данные сна за этот день?')) {
    saveSleep(y, m, d, { bed: '', wake: '', quality: 0 });
    if (window.editingQualityKey === `${y}-${m}-${d}`) window.editingQualityKey = null;
    render();
  }
}

function toggleQuality(key) {
  window.editingQualityKey = window.editingQualityKey === key ? null : key;
  render();
}

function addManualSleep(val) {
  if (!val) return;
  const [y, m, d] = val.split('-');
  window._manualSleepDate = `${parseInt(y)}-${parseInt(m)-1}-${parseInt(d)}`;
  render();
}