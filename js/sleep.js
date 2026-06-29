// ==================== SLEEP PAGE ====================
let sleepViewOffset = 0;
window.editingSleepKey = null;

function buildSleepPage() {
  // Захватываем 14 дней для построения графика, смещенные на наш отступ (sleepViewOffset)
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

  // Данные для графика (чтобы он снова работал как раньше)
  const chartData = days.slice().reverse().map(day => ({
    date: day.dateStr,
    mins: day.dur,
    quality: day.sl.quality
  }));
  window.sleepChartData = chartData; // Экспортируем для отрисовки

  let daysHTML = '';
  days.forEach(day => {
    // ✦ ЛОГИКА: Показываем карточку ТОЛЬКО если в ней есть данные, либо если это Сегодня ✦
    if (!day.hasData && !day.isToday) return;

    const durStr = day.dur > 0 ? formatDuration(day.dur) : '—';
    const quality = day.sl.quality || 0;
    const dayKey = `${day.y}-${day.m}-${day.d}`;
    const isEditing = window.editingSleepKey === dayKey;

    // Умные цвета для качества сна
    let qColor = '#636366';
    if (quality >= 9) qColor = '#10B981'; // Зеленый
    else if (quality >= 6) qColor = '#3B82F6'; // Синий
    else if (quality >= 3) qColor = '#F59E0B'; // Оранжевый
    else if (quality >= 1) qColor = '#EF4444'; // Красный

    if (isEditing) {
      daysHTML += `
        <div class="sleep-card editing">
          <div class="sleep-header">
            <span>${day.isToday ? '✦ ' : ''}${day.dateFull}, ${day.wd}</span>
            <button class="sleep-del" style="color:var(--green); font-size:14px;" onclick="window.editingSleepKey=null; render()">✓ Готово</button>
          </div>
          <div style="display:flex; gap:12px; margin-bottom:12px;">
            <label style="flex:1; background:rgba(255,255,255,0.05); padding:8px; border-radius:8px;">
              <span style="font-size:11px; color:var(--text-tertiary); display:block; margin-bottom:4px;">🌙 Лёг</span>
              <input type="time" class="sleep-day-input" value="${day.sl.bed || ''}" onblur="saveSleepForDay(${day.y},${day.m},${day.d},'bed',this.value)">
            </label>
            <label style="flex:1; background:rgba(255,255,255,0.05); padding:8px; border-radius:8px;">
              <span style="font-size:11px; color:var(--text-tertiary); display:block; margin-bottom:4px;">☀️ Встал</span>
              <input type="time" class="sleep-day-input" value="${day.sl.wake || ''}" onblur="saveSleepForDay(${day.y},${day.m},${day.d},'wake',this.value)">
            </label>
          </div>
          <div>
            <div class="mood-picker" style="margin:0;gap:4px;flex-wrap:wrap;justify-content:center">
              ${Array.from({length: 10}, (_, i) => i + 1).map(n => {
                const isActive = n === quality;
                let c = '#EF4444'; if(n>=3) c='#F59E0B'; if(n>=6) c='#3B82F6'; if(n>=9) c='#10B981';
                return `<button class="mood-btn ${isActive ? 'active' : ''}" style="--mood-color: ${c};width:28px;height:28px;padding:0"
                  onclick="saveSleepForDay(${day.y},${day.m},${day.d},'quality',${n})">
                  <span class="mood-num" style="font-size:12px">${n}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      daysHTML += `
        <div class="sleep-card">
          <div class="sleep-header">
            <span>${day.isToday ? '✦ ' : ''}${day.dateFull}, ${day.wd}</span>
            ${day.hasData ? `<button class="sleep-del" onclick="clearSleepForDay(${day.y},${day.m},${day.d})" title="Очистить">✕</button>` : ''}
          </div>
          <div class="sleep-times">
            <span>🌙 ${day.sl.bed || '--:--'}</span>
            <span class="sleep-arrow">————></span>
            <span>${day.sl.wake || '--:--'} ☀️</span>
          </div>
          <div class="sleep-footer">
            <span class="sleep-dur" style="color:#a1a1aa;">⏱ ${durStr}</span>
            <div class="sleep-qual" style="color: ${qColor}">
              Качество: ${quality > 0 ? quality + '/10' : '—'}
              <button class="sleep-edit-btn" onclick="window.editingSleepKey='${dayKey}'; render();" title="Редактировать">✏️</button>
            </div>
          </div>
        </div>
      `;
    }
  });

  // Подсчет статистики для старой шапки
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

    <div class="sleep-days-list">
      ${daysHTML || '<div class="empty-state" style="padding: 20px 0;">Нет записей в этом периоде</div>'}
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
  if (field === 'quality') sl.quality = value;
  else sl[field] = value;
  saveSleep(y, m, d, sl);
  render();
}

function clearSleepForDay(y, m, d) {
  if (confirm('Сбросить данные сна за этот день?')) {
    saveSleep(y, m, d, { bed: '', wake: '', quality: 0 });
    window.editingSleepKey = null; // Закрываем режим редактирования
    render();
  }
}