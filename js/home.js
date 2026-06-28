// ==================== HOME ====================
function buildHome() {
  const allTasks = getDayTasksWithIdeas(ACT_Y, ACT_M, ACT_D);
  window._currentDayTasks = allTasks;
  const totalT = allTasks.length;
  const doneT = allTasks.filter(t => t.done).length;
  const water = getWater();
  const waterPct = Math.round((water.cups / 6) * 100);
  const taskPct = totalT > 0 ? Math.round(doneT/totalT*100) : 0;

  const md = getMonthData(ACT_Y, ACT_M);
  const totalG = md.goals.length;
  const doneG = md.goals.filter(g => g.done).length;

  const bal = getFinBalance();
  const inc = getFinIncome();
  const lastBal = bal.length > 0 ? bal[bal.length-1].amount : 0;
  const todayInc = inc.filter(e => e.date === activeDateStr()).reduce((s,e) => s + e.amount, 0);

  let dayTasksHTML = '';
  const preview = allTasks.slice(0, 3);
  if (preview.length === 0) {
    dayTasksHTML = `<div class="empty-state" style="padding:8px 0">Нет задач на сегодня</div>`;
  } else {
    preview.forEach((t, i) => {
      dayTasksHTML += `<div class="day-task-mini" onclick="toggleTodayTask(${i})" style="cursor:pointer"
        draggable="true" data-idx="${i}" data-flip-id="ht-${flipKey(t.text)}"
        ondragstart="homeDragStart(event,${i})" ondragover="homeDragOver(event)"
        ondrop="homeDrop(event,${i})" ondragend="homeDragEnd(event)">
        <span class="task-drag" title="Перетащить">⋮⋮</span>
        <div class="mini-check ${t.done ? 'done' : ''}">${t.done ? '✓' : ''}</div>
        <span class="mini-task-text ${t.done ? 'completed' : ''}">${t.fromIdea ? '<span style="opacity:0.5;font-size:10px">' + esc(t.ideaEmoji || '📁') + '</span> ' : ''}${esc(t.text)}</span>
      </div>`;
    });
    if (allTasks.length > 3) {
      dayTasksHTML += `<div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">+${allTasks.length-3} ещё</div>`;
    }
  }

  let monthMini = '';
  const nearMonths = [];
  YEARS.forEach(y => {
    for (let m = 0; m < 12; m++) {
      if (y > TODAY_Y || (y === TODAY_Y && m >= TODAY_M)) nearMonths.push([y, m]);
    }
  });
  nearMonths.slice(0, 3).forEach(([y, m]) => {
    const mmd = getMonthData(y, m);
    const segs = mmd.goals.slice(0, 5).map(g =>
      `<div class="month-mini-seg ${g.done ? 'done' : ''}"></div>`).join('');
    const isCur = y === TODAY_Y && m === TODAY_M;
    monthMini += `<div class="month-mini-item" onclick="event.stopPropagation();openMonthDetail(${y},${m})">
      <span class="month-mini-name ${isCur ? 'current' : ''}">${isCur ? '● ' : ''}${MONTHS_SHORT[m]} ${y}</span>
      <div class="month-mini-bar">${segs}</div>
    </div>`;
  });

  return `
  <div class="home-grid">
    <div class="panel panel-day">
      <div class="panel-inner">
        <div class="panel-eyebrow">Сегодня — ${WEEKDAYS_FULL[new Date(ACT_Y, ACT_M, ACT_D).getDay()]}, ${ACT_D} ${MONTHS_RU[ACT_M]}</div>

        ${(() => {
          const lvl = getLevel();
          const xpNow = getXPProgress();
          const barW = getLevelBarWidth();
          return `<div class="xp-bar-wrap">
            <div class="xp-bar-head">
              <span class="xp-level">Ур. ${lvl}</span>
              <span class="xp-label">${getXP()} XP</span>
            </div>
            <div class="xp-bar-track">
              <div class="xp-bar-fill" style="width:${barW}%"></div>
            </div>
            <div class="xp-bar-sub">${xpNow} / ${XP_PER_LEVEL} до след. уровня</div>
          </div>`;
        })()}

        <div class="day-top-row">
          <div class="panel-title">День</div>
          ${(() => {
            const s = getStreak();
            const abs = Math.abs(s);
            const active = s > 0;
            return `<div class="streak-badge ${active ? 'active' : 'pending'}">🔥 ${abs} дн.</div>`;
          })()}
        </div>

        <div class="rings-row">
          ${buildRing(taskPct, 70, '#6BE3A4', 'Задачи')}
          ${buildRing(waterPct, 70, '#60A5FA', 'Вода')}
        </div>

        <div class="water-cups">
          ${Array.from({length:6}, (_,i) =>
            `<div class="water-cup ${i < water.cups ? 'filled' : ''}" onclick="toggleWaterCup(${i})">
              ${i < water.cups ? '💧' : '○'}
            </div>`).join('')}
          <div class="water-info">${water.cups * 500} мл / 3000 мл</div>
        </div>

        <div class="day-tasks-col">
          <div class="section-eyebrow" style="margin-bottom:8px">✅ Задачи <span class="badge badge-green">${doneT}/${totalT}</span></div>
          ${dayTasksHTML}
        </div>

        <div class="day-bottom-row">
          <button class="btn-primary" style="width:100%" onclick="openDay()">Открыть день →</button>
        </div>
      </div>
    </div>

    <div class="panel panel-plan" onclick="openPlan()">
      <div class="panel-inner">
        <div class="panel-eyebrow">Планировщик</div>
        <div class="panel-title">Месяцы</div>
        <div class="panel-sub">Цели и задачи по дням</div>
        <div class="month-mini-list">${monthMini}</div>
        <div style="margin-top:12px;font-size:12px;color:var(--text-tertiary)">
          ${doneG}/${totalG} целей этого месяца
        </div>
        <div class="seg-bar-wrap">
          <div class="seg-bar">
            ${Array.from({length: Math.max(totalG,1)}, (_,i) =>
              `<div class="seg ${i < doneG ? 'done' : 'pending'}"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="panel-arrow">→</div>
    </div>

    <div class="panel panel-habits" onclick="openHabits()">
      <div class="panel-inner">
        <div class="panel-eyebrow">Трекер привычек</div>
        <div class="panel-title">Привычки</div>
        ${(() => {
          if (typeof getHabits !== 'function') return ''; // Защита для старого кэша
          const habs = getHabits();
          if (habs.length === 0) return `<div class="empty-state" style="padding:12px 0;font-size:13px">Нет привычек</div>`;
          const today = activeDateStr();
          const doneCount = habs.filter(h => h.history && h.history[today]).length;
          const pct = Math.round((doneCount / Math.max(habs.length, 1)) * 100);
          return `
            <div style="font-size: 24px; font-weight: 800; margin: 10px 0;">${doneCount} / ${habs.length}</div>
            <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 8px;">Выполнено сегодня</div>
            <div class="mc-bar"><div class="mc-bar-fill" style="width:${pct}%"></div></div>
          `;
        })()}
      </div>
      <div class="panel-arrow">→</div>
    </div>

    <div class="panel panel-sleep" onclick="openSleep()">
      <div class="panel-inner">
        <div class="panel-eyebrow">Трекер сна</div>
        <div class="panel-title">Сон</div>
        ${(() => {
          const sl = getSleep(ACT_Y, ACT_M, ACT_D);
          const dur = calcDuration(sl.bed, sl.wake);
          if (sl.bed && sl.wake) {
            return `
              <div class="sleep-mini">
                <div class="sleep-mini-stat">
                  <div class="sleep-mini-num">${formatDuration(dur)}</div>
                  <div class="sleep-mini-lbl">Сегодня</div>
                </div>
                <div class="sleep-mini-times">
                  <span>🌙 ${sl.bed}</span>
                  <span>☀️ ${sl.wake}</span>
                </div>
                <div class="sleep-mini-quality" style="color:${sl.quality >= 8 ? 'var(--green)' : sl.quality >= 5 ? 'var(--blue)' : 'var(--red)'}">Качество: ${sl.quality}/10</div>
              </div>
            `;
          } else {
            return `<div class="sleep-mini-empty">Сегодня ещё не заполнено</div>`;
          }
        })()}
      </div>
      <div class="panel-arrow">→</div>
    </div>

    <div class="panel panel-finance" onclick="openHabits()">
      <div class="panel-inner">
        <div class="panel-eyebrow">Трекер привычек</div>
        <div class="panel-title">Привычки</div>
        ${(() => {
          if (typeof getHabits !== 'function') return ''; // Защита для старого кэша
          const habs = getHabits();
          if (habs.length === 0) return `<div class="empty-state" style="padding:12px 0;font-size:13px">Нет привычек</div>`;
          const today = activeDateStr();
          const doneCount = habs.filter(h => h.history && h.history[today]).length;
          const pct = Math.round((doneCount / Math.max(habs.length, 1)) * 100);
          return `
            <div style="font-size: 24px; font-weight: 800; margin: 10px 0;">${doneCount} / ${habs.length}</div>
            <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 8px;">Выполнено сегодня</div>
            <div class="mc-bar"><div class="mc-bar-fill" style="width:${pct}%"></div></div>
          `;
        })()}
      </div>
      <div class="panel-arrow">→</div>
    </div>

    <div class="panel panel-deadlines" onclick="openFinance()">
      <div class="panel-inner">
        <div class="panel-eyebrow">Финансы</div>
        <div class="panel-title">Деньги</div>
        <div class="finance-mini">
          <div class="finance-stat">
            <div class="finance-num">${lastBal > 0 ? fmtRub(lastBal) : '—'}</div>
            <div class="finance-lbl">Баланс</div>
          </div>
          <div class="finance-stat">
            <div class="finance-num" style="color:var(--green)">${todayInc > 0 ? '+' + fmtRub(todayInc) : '—'}</div>
            <div class="finance-lbl">Сегодня</div>
          </div>
          <div class="sparkline-wrap">
            <canvas class="sparkline-canvas" id="homeSparkline" width="140" height="50"></canvas>
          </div>
        </div>
      </div>
      <div class="panel-arrow">→</div>
    </div>
  </div>`;
}

function buildRing(pct, size, color, label) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct/100) * circ;
  return `<div class="ring-wrap">
    <svg class="ring-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${sw}"/>
      <circle class="ring-fill" cx="${size/2}" cy="${size/2}" r="${r}"
        stroke="${color}" stroke-width="${sw}"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
      <text class="ring-text" x="${size/2}" y="${size/2}" dy="0.35em" transform="rotate(90 ${size/2} ${size/2})">${pct}%</text>
    </svg>
    <div class="ring-label">${label}</div>
  </div>`;
}

// ==================== TODAY TASKS ====================
function toggleTodayTask(i) {
  const allTasks = getDayTasksWithIdeas(ACT_Y, ACT_M, ACT_D);
  const t = allTasks[i];
  if (!t) return;
  const wasDone = t.done;

  if (t.fromIdea && t.ideaId && t.ideaTaskId) {
    toggleTaskDone(ACT_Y, ACT_M, ACT_D, i, true, t.ideaTaskId, t.ideaId);
  } else {
    const td = getDayData(ACT_Y, ACT_M, ACT_D);
    const realIdx = td.tasks.findIndex(x => x.text === t.text);
    if (realIdx >= 0) toggleTaskDone(ACT_Y, ACT_M, ACT_D, realIdx, false, null, null);
  }

  if (!wasDone) addXP(XP_PER_TASK, 'Задача', `task-done-${activeDateStr()}-${i}`);
  render();
}

function toggleDayTask(i) { toggleTodayTask(i); }

function toggleDayTaskUrgent(i) {
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  if (td.tasks[i]) {
    td.tasks[i].urgent = !td.tasks[i].urgent;
    sortTasks(td.tasks);
    saveDayData(ACT_Y, ACT_M, ACT_D, td);
    render();
  }
}

function deleteDayTask(i) {
  const allTasks = getDayTasksWithIdeas(ACT_Y, ACT_M, ACT_D);
  const t = allTasks[i];
  if (!t) return;

  if (t.fromIdea && t.ideaId) {
    // Clear scheduledDate from the idea task (don't delete from project)
    const ideas = getIdeas();
    const idea = ideas.find(p => p.id === t.ideaId);
    if (idea) {
      const task = idea.tasks.find(x => x.id === t.ideaTaskId);
      if (task) {
        task.scheduledDate = null;
        saveIdeas(ideas);
      }
    }
  } else {
    const td = getDayData(ACT_Y, ACT_M, ACT_D);
    const realIdx = td.tasks.findIndex(x => x.text === t.text);
    if (realIdx >= 0) {
      td.tasks.splice(realIdx, 1);
      saveDayData(ACT_Y, ACT_M, ACT_D, td);
    }
  }
  render();
}

function quickAddDayTask() {
  const inp = document.getElementById('dayTaskInput');
  const text = inp ? inp.value.trim() : '';
  if (!text) { uiState.addingTask['today'] = true; render(); return; }
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  td.tasks.push({ text, done: false });
  sortTasks(td.tasks);
  saveDayData(ACT_Y, ACT_M, ACT_D, td);
  
  // ✦ Принудительно стираем текст
  if (typeof _draftInputs !== 'undefined') _draftInputs['dayTaskInput'] = '';
  if (inp) inp.value = '';
  
  render();
}

function confirmDayTask() {
  const inp = document.getElementById('dayTaskInput');
  const dlInp = document.getElementById('dayDeadlineInput');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const task = { text, done: false };
  
  // ✦ Теперь дедлайн реально сохраняется!
  if (dlInp && dlInp.value) task.deadline = dlInp.value; 
  
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  td.tasks.push(task);
  sortTasks(td.tasks);
  saveDayData(ACT_Y, ACT_M, ACT_D, td);
  delete uiState.addingTask['today'];
  
  // ✦ Принудительно стираем текст
  if (typeof _draftInputs !== 'undefined') _draftInputs['dayTaskInput'] = '';
  if (inp) inp.value = '';
  
  render();
}

function cancelDayTask() {
  delete uiState.addingTask['today']; render();
}

function pushTomorrow() {
  if (!confirm('Перенести все невыполненные задачи на завтра?')) return;
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  const undone = td.tasks.filter(t => !t.done);

  const tom = new Date(ACT_Y, ACT_M, ACT_D + 1);
  const tyd = getDayData(tom.getFullYear(), tom.getMonth(), tom.getDate());
  const existing = new Set(tyd.tasks.map(t => t.text));
  undone.forEach(t => { if (!existing.has(t.text)) tyd.tasks.push({
    text: t.text, done: false,
    deadline: t.deadline, urgent: t.urgent,
    ideaId: t.ideaId, ideaTaskId: t.ideaTaskId
  }); });
  saveDayData(tom.getFullYear(), tom.getMonth(), tom.getDate(), tyd);

  td.tasks = td.tasks.filter(t => t.done);
  saveDayData(ACT_Y, ACT_M, ACT_D, td);
  render();
}

// ==================== HOME DRAG & DROP ====================
let _homeDragIdx = null;

function homeDragStart(e, idx) {
  _homeDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.4';
}

function homeDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function homeDrop(e, targetIdx) {
  e.preventDefault();
  if (_homeDragIdx === null || _homeDragIdx === targetIdx) return;
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  const item = td.tasks.splice(_homeDragIdx, 1)[0];
  td.tasks.splice(targetIdx, 0, item);
  saveDayData(ACT_Y, ACT_M, ACT_D, td);
  _homeDragIdx = null;
  render();
}

function homeDragEnd(e) {
  _homeDragIdx = null;
}

// ==================== WATER ====================
function toggleWaterCup(i) {
  const w = getWater();
  if (i < w.cups) w.cups = i;
  else w.cups = i + 1;
  w.cups = Math.min(w.cups, 6);
  if (w.cups >= 6) addXP(XP_PER_WATER_FULL, 'Вода 6/6', `water-full-${activeDateStr()}`);
  saveWater(w);
  render();
}
