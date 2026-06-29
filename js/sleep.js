// ==================== SLEEP PAGE ====================
let sleepViewOffset = 0;
window.editingSleepKey = null;

function buildSleepPage() {
  const days = [];
  for (let i = 6 - sleepViewOffset; i >= 6 - sleepViewOffset - 13; i--) {
    const d = new Date(ACT_Y, ACT_M, ACT_D - i);
    const y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
    const sl = getSleep(y, m, dd);
    const dur = calcDuration(sl.bed, sl.wake);
    const isToday = y === ACT_Y && m === ACT_M && dd === ACT_D;
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const wd = WEEKDAYS_SHORT[dayIdx];
    const mName = typeof MONTHS_GEN !== 'undefined' ? MONTHS_GEN[m] : MONTHS_RU[m];
    
    const hasData = !!(sl.bed || sl.wake || sl.quality > 0);

    days.push({ y, m, d: dd, sl, dur, isToday, wd, hasData, dateStr: `${dd}.${m + 1}`, dateFull: `${dd} ${mName}` });
  }

  const chartData = days.slice().reverse().map(day => ({
    date: day.dateStr,
    mins: day.dur,
    quality: day.sl.quality
  }));
  window.sleepChartData = chartData;

  let daysHTML = '';
  days.forEach(day => {
    // Показываем только заполненные дни и Сегодня
    if (!day.hasData && !day.isToday) return;

    const durStr = day.dur > 0 ? formatDuration(day.dur) : '—';
    const quality = day.sl.quality || 0;
    const dayKey = `${day.y}-${day.m}-${day.d}`;
    const isEditing = window.editingSleepKey === dayKey;

    // Умные цвета качества
    let qColor = 'var(--text-tertiary)';
    if (quality >= 9) qColor = '#10B981'; // Зеленый
    else if (quality >= 6) qColor = '#3B82F6'; // Синий
    else if (quality >= 3) qColor = '#F59E0B'; // Оранжевый
    else if (quality >= 1) qColor = '#EF4444'; // Красный

    if (isEditing) {
      daysHTML += `
        <div class="sleep-day-card" style="border: 1px solid rgba(255,255,255,0.15); background: var(--surface);">
          <div class="sleep-day-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-weight:700; font-size:15px; display:flex; align-items:center; gap:6px;">
              ${day.isToday ? '<div style="width:8px; height:8px; background:var(--blue); border-radius:2px;"></div>' : ''}
              ${day.dateFull}, <span style="color:var(--text-tertiary); font-weight:500;">${day.wd}</span>
            </div>
            <button onclick="window.editingSleepKey=null; render()" style="background:var(--blue); color:#fff; border:none; border-radius:6px; padding:4px 10px; font-size:12px; font-weight:700; cursor:pointer;">Готово</button>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:16px;">
            <label style="flex:1; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding:10px; border-radius:10px;">
              <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center; gap:4px; margin-bottom:6px;">${ICONS.moon} Лёг</span>
              <input type="time" class="sleep-day-input" style="width:100%; background:none; border:none; color:#fff; font-size:16px; font-weight:700; outline:none;" value="${day.sl.bed || ''}" onblur="saveSleepForDay(${day.y},${day.m},${day.d},'bed',this.value)">
            </label>
            <label style="flex:1; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding:10px; border-radius:10px;">
              <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center; gap:4px; margin-bottom:6px;">${ICONS.sun} Встал</span>
              <input type="time" class="sleep-day-input" style="width:100%; background:none; border:none; color:#fff; font-size:16px; font-weight:700; outline:none;" value="${day.sl.wake || ''}" onblur="saveSleepForDay(${day.y},${day.m},${day.d},'wake',this.value)">
            </label>
          </div>

          <div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Качество сна</div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:space-between;">
              ${Array.from({length: 10}, (_, i) => i + 1).map(n => {
                const isActive = n === quality;
                let c = '#EF4444'; if(n>=3) c='#F59E0B'; if(n>=6) c='#3B82F6'; if(n>=9) c='#10B981';
                // Квадратики вместо кружочков!
                return `<button class="mood-btn ${isActive ? 'active' : ''}" style="--mood-color: ${c}; width:calc(10% - 4px); height:32px; border-radius:6px; padding:0; display:flex; justify-content:center; align-items:center;"
                  onclick="saveSleepForDay(${day.y},${day.m},${day.d},'quality',${n})">
                  <span class="mood-num" style="font-size:13px; font-weight:700;">${n}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      daysHTML += `
        <div class="sleep-day-card">
          <div class="sleep-day-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-weight:700; font-size:15px; display:flex; align-items:center; gap:6px;">
              ${day.isToday ? '<div style="width:8px; height:8px; background:var(--blue); border-radius:2px;"></div>' : ''}
              ${day.dateFull}, <span style="color:var(--text-tertiary); font-weight:500;">${day.wd}</span>
            </div>
            ${day.hasData ? `<button onclick="clearSleepForDay(${day.y},${day.m},${day.d})" style="background:none; border:none; color:#52525b; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; width:24px; height:24px;" title="Очистить">×</button>` : ''}
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03); padding:12px 16px; border-radius:12px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--blue); display:flex;">${ICONS.moon}</span>
              <span style="font-size:16px; font-weight:800; color:#fff;">${day.sl.bed || '--:--'}</span>
            </div>
            <div style="flex:1; height:1px; border-bottom: 1px dashed rgba(255,255,255,0.15); margin:0 16px;"></div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px; font-weight:800; color:#fff;">${day.sl.wake || '--:--'}</span>
              <span style="color:var(--yellow); display:flex;">${ICONS.sun}</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px; color:var(--text-tertiary); font-size:13px; font-weight:600;">
              ${ICONS.refresh} ${durStr}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="padding:4px 10px; border-radius:6px; background:rgba(255,255,255,0.05); color:${qColor}; font-size:12px; font-weight:700;">
                Качество: ${quality > 0 ? quality + '/10' : '—'}
              </div>
              <button onclick="window.editingSleepKey='${dayKey}'; render();" style="background:rgba(255,255,255,0.05); border:none; border-radius:6px; color:var(--text-tertiary); cursor:pointer; width:28px; height:28px; display:flex; justify-content:center; align-items:center; transition:0.2s;">
                ${ICONS.edit}
              </button>
            </div>
          </div>
        </div>
      `;
    }
  });

  const filled = days.filter(d => d.dur > 0);
  const avgDur = filled.length > 0 ? Math.round(filled.reduce((s, d) => s + d.dur, 0) / filled.length) : 0;
  const avgQuality = filled.filter(d => d.sl.quality > 0);
  const avgQ = avgQuality.length > 0 ? Math.round(avgQuality.reduce((s, d) => s + d.sl.quality, 0) / avgQuality.length * 10) / 10 : 0;

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
          <div class="sleep-stat-num" style="color:${avgQ >= 9 ? '#10B981' : avgQ >= 6 ? '#3B82F6' : avgQ >= 3 ? '#F59E0B' : avgQ >= 1 ? '#EF4444' : 'inherit'}">${avgQ > 0 ? avgQ + '/10' : '—'}</div>
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

    <div class="sleep-days-list" style="margin-top:16px;">
      ${daysHTML || '<div class="empty-state" style="padding: 20px 0;">Нет записей в этом периоде</div>'}
    </div>
  `;
}

function sleepNav(offset) {
  if (offset === 'today') sleepViewOffset = 0;
  else sleepViewOffset += offset;
  render();
}

function saveSleepForDay(y, m, d, field, value) {
  const sl = getSleep(y, m, d);
  if (field === 'quality') sl.quality = value;
  else sl[field] = value;
  saveSleep(y, m, d, sl);
  render();
}

function clearSleepForDay(y, m, d) {
  if (confirm('Сбросить данные сна за этот день?')) {
    saveSleep(y, m, d, { bed: '', wake: '', quality: 0 });
    window.editingSleepKey = null;
    render();
  }
}