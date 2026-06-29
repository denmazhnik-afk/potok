// ==================== SLEEP PAGE ====================
let sleepViewOffset = 0;

function buildSleepPage() {
  // Показываем 14 дней
  const days = [];
  for (let i = 6 - sleepViewOffset; i >= 6 - sleepViewOffset - 13; i--) {
    const d = new Date(ACT_Y, ACT_M, ACT_D - i);
    const y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
    const sl = getSleep(y, m, dd);
    const dur = calcDuration(sl.bed, sl.wake);
    const isToday = y === ACT_Y && m === ACT_M && dd === ACT_D;
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const wd = WEEKDAYS_SHORT[dayIdx];
    
    // Используем правильный падеж для месяца
    const mName = typeof MONTHS_GEN !== 'undefined' ? MONTHS_GEN[m] : MONTHS_SHORT[m];
    
    days.push({ y, m, d: dd, sl, dur, isToday, wd, dateStr: `${dd}.${m + 1}`, dateFull: `${dd} ${mName}` });
  }

  // Данные для графика
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
    
    const hasData = day.sl.bed || day.sl.wake || quality > 0;

    daysHTML += `
      <div class="sleep-day-card ${day.isToday ? 'is-today' : ''}">
        <div class="sleep-day-header">
          <div class="sleep-day-date">
            ${day.isToday ? '📍 ' : ''}${day.dateFull}
            <span class="sleep-day-wd">${day.wd}</span>
          </div>
          <div style="display:flex; align-items:center; gap: 12px;">
            <div class="sleep-day-dur">${durStr}</div>
            ${hasData ? `<button onclick="clearSleepForDay(${day.y},${day.m},${day.d})" style="background:none; border:none; color:var(--red, #ef4444); font-size:16px; padding:0; cursor:pointer;" title="Сбросить">✕</button>` : ''}
          </div>
        </div>
        <div class="sleep-day-fields">
          <label class="sleep-day-field">
            <span class="sleep-day-label">${ICONS.moon} Лёг</span>
            <input type="time" class="sleep-day-input" value="${day.sl.bed || ''}"
              onblur="saveSleepForDay(${day.y},${day.m},${day.d},'bed',this.value)">
          </label>
          <label class="sleep-day-field">
            <span class="sleep-day-label">${ICONS.sun} Встал</span>
            <input type="time" class="sleep-day-input" value="${day.sl.wake || ''}"
              onblur="saveSleepForDay(${day.y},${day.m},${day.d},'wake',this.value)">
          </label>
        </div>
        <div class="sleep-day-quality">
          <div class="mood-picker" style="margin:0;gap:2px;flex-wrap:wrap">
            ${Array.from({length: 10}, (_, i) => i + 1).map(n => {
              const isActive = n === quality;
              // ✦ Правильные цвета: 1-2 красный, 3-5 оранжевый, 6-8 синий, 9-10 зеленый ✦
              const color = n <= 2 ? 'var(--red)' : n <= 5 ? 'var(--yellow)' : n <= 8 ? 'var(--blue)' : 'var(--green)';
              
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

  // Статистика
  const filled = days.filter(d => d.dur > 0);
  const avgDur = filled.length > 0 ? Math.round(filled.reduce((s, d) => s + d.dur, 0) / filled.length) : 0;
  const avgQuality = filled.filter(d => d.sl.quality > 0);
  const avgQ = avgQuality.length > 0 ? Math.round(avgQuality.reduce((s, d) => s + d.sl.quality, 0) / avgQuality.length * 10) / 10 : 0;

  // Цвет для среднего качества в шапке
  let avgQColor = 'inherit';
  if (avgQ > 0) {
    avgQColor = avgQ <= 2 ? 'var(--red)' : avgQ <= 5 ? 'var(--yellow)' : avgQ <= 8 ? 'var(--blue)' : 'var(--green)';
  }

  return `
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">${ICONS.moon} Трекер сна</h2>
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
          <div class="sleep-stat-num" style="color:${avgQColor}">${avgQ > 0 ? avgQ + '/10' : '—'}</div>
          <div class="sleep-stat-lbl">Качество</div>
        </div>
        <div class="sleep-stat">
          <div class="sleep-stat-num">${filled.length}</div>
          <div class="sleep-stat-lbl">Записей</div>
        </div>
      </div>
    </div>

    <div class="sleep-nav">
      <button class="btn-secondary" onclick="sleepNav(-7)">← 7 дн.</button>
      <button class="btn-secondary" onclick="sleepNav('today')">Сегодня</button>
      <button class="btn-secondary" onclick="sleepNav(7)">7 дн. →</button>
    </div>

    <div class="sleep-days-list">
      ${daysHTML}
    </div>
  `;
}

function sleepNav(offset) {
  if (offset === 'today') {
    sleepViewOffset = 0; 
  } else {
    sleepViewOffset += offset;
  }
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

function clearSleepForDay(y, m, d) {
  if (confirm('Сбросить данные сна за этот день?')) {
    saveSleep(y, m, d, { bed: '', wake: '', quality: 0 });
    render();
  }
}