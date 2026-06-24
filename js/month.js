// ==================== PLAN PAGE ====================
function buildPlanPage() {
  let html = `
  <div class="page-header">
    <button class="back-btn" onclick="goHome()">← Назад</button>
    <h2 class="page-heading">Планировщик</h2>
  </div>
  <div class="months-grid" id="monthsGrid">`;

  YEARS.forEach(y => {
    for (let m = 0; m < 12; m++) {
      const dim = getDays(y, m);
      const isCur = y === ACT_Y && m === ACT_M;
      const isPast = y < ACT_Y || (y === ACT_Y && m < ACT_M);
      const md = getMonthData(y, m);
      const totalG = md.goals.length;
      const doneG = md.goals.filter(g => g.done).length;
      const pct = totalG > 0 ? doneG/totalG*100 : 0;
      const daysLeft = isCur ? dim - ACT_D : (isPast ? 0 : dim);

      html += `<div class="month-card ${isCur?'is-current':''} ${isPast?'is-past':''}" ${isCur?'id="currentMonthCard"':''} onclick="openMonthDetail(${y},${m})">
        <div class="mc-year">${y}</div>
        <div class="mc-name ${isCur?'is-current-name':''}">${isCur ? '● ' : ''}${MONTHS_RU[m]}</div>
        <div class="mc-days">${dim} дн.${isCur?' · ещё ' + daysLeft : ''}</div>
        <div class="mc-bar"><div class="mc-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }
  });

  html += '</div>';
  return html;
}

// ==================== MONTH DETAIL ====================
function buildMonthDetail() {
  const {y, m} = viewData;
  const md = getMonthData(y, m);
  const dim = getDays(y, m);
  const isCur = y === ACT_Y && m === ACT_M;
  const daysLeft = isCur ? dim - ACT_D : 0;

  let goalsHTML = '<div class="goals-list">';
  md.goals.forEach((g, i) => {
    if (uiState.editingGoal === i) {
      goalsHTML += `<div class="goal-item">
        <div class="goal-circle ${g.done ? 'filled' : ''}">${g.done ? '✓' : ''}</div>
        <input class="goal-edit-input" id="goalEditInp" value="${esc(g.text)}" autofocus>
        <div class="inline-btns">
          <button class="confirm-sm" onclick="saveGoalEdit(${i})">✓</button>
          <button class="cancel-sm" onclick="cancelGoalEdit()">✕</button>
        </div>
      </div>`;
    } else {
      goalsHTML += `<div class="goal-item">
        <div class="goal-circle ${g.done ? 'filled' : ''}" onclick="toggleGoal(${i})">${g.done ? '✓' : ''}</div>
        <span class="goal-text ${g.done ? 'struck' : ''}">${esc(g.text) || '<em style="color:var(--text-tertiary)">Без названия</em>'}</span>
        <div class="inline-btns">
          <button class="ibtn" onclick="startEditGoal(${i})">✏️</button>
          <button class="ibtn" onclick="deleteGoal(${i})">🗑️</button>
        </div>
      </div>`;
    }
  });
  goalsHTML += '</div>';

  if (uiState.addingGoal) {
    goalsHTML += `<div class="add-row">
      <input class="add-input" id="newGoalInp" placeholder="Новая цель..." autofocus>
      <button class="btn-primary" onclick="confirmAddGoal()">Добавить</button>
      <button class="btn-secondary" onclick="cancelAddGoal()">✕</button>
    </div>`;
  } else {
    goalsHTML += `<button class="btn-secondary" style="width:100%;margin-top:10px" onclick="startAddGoal()">+ Добавить цель</button>`;
  }

  const notesHTML = buildNoteBlock('monthNotes', 'Заметки', md.notes || '');

  let daysHTML = '';
  for (let d = 1; d <= dim; d++) {
    const dd = getDayData(y, m, d);
    const total = dd.tasks.length;
    const done = dd.tasks.filter(t => t.done).length;
    const pct = total > 0 ? Math.round(done/total*100) : 0;
    const isToday = isCur && d === ACT_D;
    const wd = WEEKDAYS_FULL[new Date(y, m, d).getDay()];

    let tasksHTML = '';
    dd.tasks.forEach((t, ti) => {
      const hasDeadline = t.deadline && !t.done;
      const isUrgent = t.urgent && !t.done;
      const dlBadge = t.deadline ? `<span class="task-deadline-badge ${t.done ? 'done' : ''}">${t.deadline}</span>` : '';
      const urgentCls = isUrgent ? 'urgent-row' : '';
      const urgentBtn = isUrgent ? 'active' : '';
      tasksHTML += `<li class="task-item ${t.done?'done-row':''} ${hasDeadline?'deadline-row':''} ${urgentCls}"
        draggable="true" data-idx="${ti}" data-flip-id="mt-${d}-${flipKey(t.text)}"
        ondragstart="monthDragStart(event,${d},${ti})" ondragover="monthDragOver(event)"
        ondrop="monthDrop(event,${d},${ti})" ondragend="monthDragEnd(event)">
        <span class="task-drag" title="Перетащить">⋮⋮</span>
        <div class="task-cb ${t.done?'checked':''}" onclick="toggleMonthTask(${d},${ti})"></div>
        <span class="task-name ${t.done?'struck':''}">${esc(t.text)}</span>
        ${dlBadge}
        <button class="task-urgent-btn ${urgentBtn}" onclick="toggleMonthTaskUrgent(${d},${ti})" title="Срочно">⚡</button>
        <button class="task-del" onclick="deleteMonthTask(${d},${ti})">×</button>
      </li>`;
    });
    if (!tasksHTML) tasksHTML = `<li class="empty-state" style="padding:6px 0">Нет задач</li>`;

    const addKey = `month-${d}`;
    let addRow = '';
    if (uiState.addingTask[addKey]) {
      addRow = `<div class="add-row">
        <input class="add-input" id="mTaskIn-${d}" placeholder="Новая задача..." autofocus>
        <input class="add-input deadline-input" id="mDlIn-${d}" type="date" title="Дедлайн (необязательно)">
        <button class="btn-primary" onclick="confirmMonthTask(${d})">+</button>
        <button class="btn-secondary" onclick="cancelMonthTask(${d})">✕</button>
      </div>`;
    } else {
      addRow = `<button class="btn-secondary" style="margin-top:8px;font-size:12px;padding:6px 12px" onclick="startMonthTask(${d})">+ Задача</button>`;
    }

    const notesSM = buildNoteBlock('mDay-'+d+'-sum', 'Итоги', dd.summary||'') + buildNoteBlock('mDay-'+d+'-tht', 'Мысли', dd.thoughts||'');

    daysHTML += `<div class="day-card ${isToday?'today':''}" id="dc-${d}">
      <div>
        <div class="day-date">
          ${d} ${MONTHS_SHORT[m]}<span class="day-weekday-tag">, ${wd}</span>
          ${dd.mood > 0 ? `<span class="day-mood-badge" style="color:${getMoodColor(dd.mood)}">${getMoodEmoji(dd.mood)} ${dd.mood}/10</span>` : ''}
        </div>
        <ul class="task-list">${tasksHTML}</ul>
        ${addRow}
        <div class="day-note-grid" style="margin-top:10px">${notesSM}</div>
      </div>
      ${buildRing(pct, 60, pct===100?'#6BE3A4':pct>60?'#60A5FA':'rgba(255,255,255,0.2)', `${done}/${total}`)}
    </div>`;
  }

  const cal = buildCalSidebar(y, m);

  return `
  <div class="page-header">
    <button class="back-btn" onclick="openPlan()">← Назад</button>
    <h2 class="page-heading">${MONTHS_RU[m]} ${y}</h2>
    ${isCur ? `<div class="days-left-tag">⏳ Ещё ${daysLeft} дн.</div>` : ''}
  </div>

  ${isCur ? `<button class="today-jump-btn" onclick="scrollToDay(${ACT_D})">📍 Перейти к сегодня</button>` : ''}

  <div class="month-detail-layout">
    <div>
      <div class="section-card">
        <div class="section-eyebrow">🎯 Цели на месяц</div>
        ${goalsHTML}
      </div>
      <div class="section-card">${notesHTML}</div>
      <div class="section-card">
        <div class="section-eyebrow">📆 Дни</div>
        ${daysHTML}
      </div>
    </div>
    ${cal}
  </div>`;
}

// ==================== MONTH TASKS ====================
function toggleMonthTask(d, ti) {
  const {y, m} = viewData;
  const dd = getDayData(y, m, d);
  dd.tasks[ti].done = !dd.tasks[ti].done;
  sortTasks(dd.tasks);
  saveDayData(y, m, d, dd);
  render();
}

function toggleMonthTaskUrgent(d, ti) {
  const {y, m} = viewData;
  const dd = getDayData(y, m, d);
  if (dd.tasks[ti]) {
    dd.tasks[ti].urgent = !dd.tasks[ti].urgent;
    sortTasks(dd.tasks);
    saveDayData(y, m, d, dd);
    render();
  }
}

function deleteMonthTask(d, ti) {
  const {y, m} = viewData;
  const dd = getDayData(y, m, d);
  dd.tasks.splice(ti, 1);
  saveDayData(y, m, d, dd);
  render();
}

function startMonthTask(d) {
  uiState.addingTask[`month-${d}`] = true; render();
}

function cancelMonthTask(d) {
  delete uiState.addingTask[`month-${d}`]; render();
}

function confirmMonthTask(d) {
  const inp = document.getElementById(`mTaskIn-${d}`);
  const dlInp = document.getElementById(`mDlIn-${d}`);
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const task = { text, done: false };
  if (dlInp && dlInp.value) task.deadline = dlInp.value;
  const {y, m} = viewData;
  const dd = getDayData(y, m, d);
  dd.tasks.push(task);
  sortTasks(dd.tasks);
  saveDayData(y, m, d, dd);
  delete uiState.addingTask[`month-${d}`];
  render();
}

// ==================== MONTH DRAG & DROP ====================
let _monthDragDay = null;
let _monthDragIdx = null;

function monthDragStart(e, day, idx) {
  _monthDragDay = day;
  _monthDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.4';
}

function monthDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function monthDrop(e, day, targetIdx) {
  e.preventDefault();
  if (_monthDragDay !== day || _monthDragIdx === null || _monthDragIdx === targetIdx) return;
  const { y, m } = viewData;
  const dd = getDayData(y, m, day);
  const [item] = dd.tasks.splice(_monthDragIdx, 1);
  dd.tasks.splice(targetIdx, 0, item);
  saveDayData(y, m, day, dd);
  _monthDragDay = null;
  _monthDragIdx = null;
  render();
}

function monthDragEnd(e) {
  _monthDragDay = null;
  _monthDragIdx = null;
  e.target.style.opacity = '';
}

// ==================== GOALS ====================
function startAddGoal() { uiState.addingGoal = true; render(); }
function cancelAddGoal() { uiState.addingGoal = false; render(); }

function confirmAddGoal() {
  const inp = document.getElementById('newGoalInp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const {y, m} = viewData;
  const md = getMonthData(y, m);
  md.goals.push({ text, done: false });
  saveMonthData(y, m, md);
  uiState.addingGoal = false;
  render();
}

function toggleGoal(i) {
  const {y, m} = viewData;
  const md = getMonthData(y, m);
  md.goals[i].done = !md.goals[i].done;
  saveMonthData(y, m, md);
  render();
}

function startEditGoal(i) { uiState.editingGoal = i; render(); }
function cancelGoalEdit() { uiState.editingGoal = -1; render(); }

function saveGoalEdit(i) {
  const inp = document.getElementById('goalEditInp');
  if (inp) {
    const {y, m} = viewData;
    const md = getMonthData(y, m);
    md.goals[i].text = inp.value.trim();
    saveMonthData(y, m, md);
  }
  uiState.editingGoal = -1;
  render();
}

function deleteGoal(i) {
  const {y, m} = viewData;
  const md = getMonthData(y, m);
  md.goals.splice(i, 1);
  saveMonthData(y, m, md);
  render();
}
