window.currentPlanYear = window.currentPlanYear || ACT_Y;

function setPlanYear(y) {
  window.currentPlanYear = parseInt(y);
  render();
}

// ==================== PLAN PAGE ====================
function buildPlanPage() {
  window.currentPlanYear = window.currentPlanYear || ACT_Y;
  
  let html = `
  <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; align-items:center; gap:12px;">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">Планировщик</h2>
    </div>
    <select onchange="setPlanYear(this.value)" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:6px 12px; font-size:14px; font-weight:600; cursor:pointer; outline:none; -webkit-appearance:none; text-align:center;">
      ${YEARS.map(y => `<option value="${y}" style="color:#000;" ${y === window.currentPlanYear ? 'selected' : ''}>${y} год</option>`).join('')}
    </select>
  </div>
  <div class="months-grid" id="monthsGrid">`;

  // Теперь мы не перебираем YEARS, а берем только выбранный год
  const y = window.currentPlanYear;
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
      <div class="mc-top">
        <div class="mc-name ${isCur?'is-current-name':''}">${isCur ? '● ' : ''}${MONTHS_RU[m]}</div>
        <div class="mc-year">${y}</div>
      </div>
      <div class="mc-goals">${totalG > 0 ? ICONS.target + ' ' + totalG + ' ' + (totalG === 1 ? 'цель' : totalG < 5 ? 'цели' : 'целей') : '—'}</div>
      <div class="mc-bar"><div class="mc-bar-fill" style="width:${pct}%"></div></div>
      <div class="mc-bottom">
        <div class="mc-pct">${totalG > 0 ? Math.round(pct) + '%' : ''}</div>
        <div class="mc-days">${dim} дн.${isCur ? ' · осталось ' + daysLeft : ''}</div>
      </div>
    </div>`;
  }

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
      goalsHTML += `<div class="goal-item" draggable="true" data-idx="${i}" data-flip-id="goal-${flipKey(g.text)}"
        ondragstart="goalDragStart(event,${i})" ondragover="goalDragOver(event)"
        ondrop="goalDrop(event,${i})" ondragend="goalDragEnd(event)">
        <span class="task-drag goal-drag" title="Перетащить">⋮⋮</span>
        <div class="goal-circle ${g.done ? 'filled' : ''}" onclick="toggleGoal(${i})">${g.done ? '✓' : ''}</div>
        <span class="goal-text ${g.done ? 'struck' : ''}">${esc(g.text) || '<em style="color:var(--text-tertiary)">Без названия</em>'}</span>
        <div class="inline-btns">
          <button class="ibtn" onclick="startEditGoal(${i})">${ICONS.edit}</button>
          <button class="ibtn" onclick="deleteGoal(${i})">${ICONS.trash}</button>
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
    const dayAllTasks = getDayTasksWithIdeas(y, m, d);
    const total = dayAllTasks.length;
    const done = dayAllTasks.filter(t => t.done).length;
    const pct = total > 0 ? Math.round(done/total*100) : 0;
    const isToday = isCur && d === ACT_D;
    const wd = WEEKDAYS_FULL[new Date(y, m, d).getDay()];

    let tasksHTML = '';
    dayAllTasks.forEach((t, ti) => {
      const hasDeadline = t.deadline && !t.done;
      const isUrgent = t.urgent && !t.done;
      const urgentCls = isUrgent ? 'urgent-row' : '';
      const urgentBtn = isUrgent ? 'active' : '';
      const ideaTag = t.fromIdea ? `<span class="idea-tag" title="Из проекта" style="display:inline-flex; align-items:center; margin-right:4px;">${ICONS[t.ideaEmoji] || ICONS.folder}</span>` : '';
      const realIdx = t.fromIdea ? -1 : dd.tasks.findIndex(x => x.text === t.text);
      const dragAttrs = realIdx >= 0
        ? ` draggable="true" data-real-idx="${realIdx}" ondragstart="monthDragStart(event,${d},${realIdx})" ondragover="monthDragOver(event)" ondrop="monthDrop(event,${d},${realIdx})" ondragend="monthDragEnd(event)"`
        : '';
      const dragHandle = realIdx >= 0
        ? `<span class="task-drag" title="Перетащить">⋮⋮</span>`
        : '';

      let bottomItems = '';
      if (!t.done) {
        bottomItems += `<button class="task-urgent-btn ${urgentBtn}" onclick="toggleMonthTaskUrgent(${d},${ti})" title="Срочно">${ICONS.lightning}</button>`;
      }
      if (t.deadline) {
        bottomItems += `<span class="task-deadline-badge ${t.done ? 'done' : ''}">${ICONS.calendar} ${formatDateDisplay(t.deadline)}</span>`;
      }
      let footerHTML = bottomItems ? `<div class="task-bottom-row">${bottomItems}</div>` : '';

      tasksHTML += `<li class="task-item ${t.done ? 'done-row' : ''} ${hasDeadline ? 'deadline-row' : ''} ${urgentCls}"${dragAttrs}
        data-flip-id="mt-${d}-${flipKey(t.text)}">
        ${dragHandle}
        <div class="task-cb ${t.done ? 'checked' : ''}" onclick="toggleMonthTask(${d},${ti})"></div>
        <span class="task-name ${t.done ? 'struck' : ''}">${ideaTag}${esc(t.text)}</span>
        <button class="task-del" onclick="deleteMonthTask(${d},${ti})" title="${t.fromIdea ? 'Убрать из дня' : 'Удалить'}">×</button>
        ${footerHTML}
      </li>`;
    });
    if (!tasksHTML) tasksHTML = `<li class="empty-state" style="padding:6px 0">Нет задач</li>`;

    const addKey = `month-${d}`;
    let addRow = '';
    if (uiState.addingTask[addKey]) {
      addRow = `<div class="add-row">
        <input class="add-input" id="mTaskIn-${d}" placeholder="Новая задача..." autofocus>
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
          ${d} ${MONTHS_GEN[m]}<span class="day-weekday-tag">, ${wd}</span>
          ${dd.mood > 0 ? `<span class="day-mood-badge" style="color:${getMoodColor(dd.mood)}">${getMoodEmoji(dd.mood)} ${dd.mood}/5</span>` : ''}
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
    ${isCur ? `<div class="days-left-tag">${ICONS.hourglass} Ещё ${daysLeft} дн.</div>` : ''}
  </div>

  ${isCur ? `<button class="today-jump-btn" onclick="scrollToDay(${ACT_D})">${ICONS.pin} Перейти к сегодня</button>` : ''}

  <div class="month-detail-layout">
    <div>
      <div class="section-card">
        <div class="section-eyebrow">${ICONS.target} Цели на месяц</div>
        ${goalsHTML}
      </div>
      <div class="section-card">${notesHTML}</div>
      <div class="section-card">
        <div class="section-eyebrow">${ICONS.calendar} Дни</div>
        ${daysHTML}
      </div>
    </div>
    ${cal}
  </div>`;
}

// ==================== MONTH TASKS ====================
function toggleMonthTask(d, ti) {
  const {y, m} = viewData;
  const allTasks = getDayTasksWithIdeas(y, m, d);
  const t = allTasks[ti];
  if (!t) return;

  if (t.fromIdea && t.ideaId && t.ideaTaskId) {
    toggleTaskDone(y, m, d, ti, true, t.ideaTaskId, t.ideaId);
  } else {
    const dd = getDayData(y, m, d);
    const realIdx = dd.tasks.findIndex(x => x.text === t.text);
    if (realIdx >= 0) toggleTaskDone(y, m, d, realIdx, false, null, null);
  }
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
  const allTasks = getDayTasksWithIdeas(y, m, d);
  const t = allTasks[ti];
  if (!t) return;

  if (t.fromIdea && t.ideaId) {
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
    const dd = getDayData(y, m, d);
    const realIdx = dd.tasks.findIndex(x => x.text === t.text);
    if (realIdx >= 0) {
      dd.tasks.splice(realIdx, 1);
      saveDayData(y, m, d, dd);
    }
  }
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
  
  const {y, m} = viewData;
  const dd = getDayData(y, m, d);
  dd.tasks.push(task);
  sortTasks(dd.tasks);
  saveDayData(y, m, d, dd);
  delete uiState.addingTask[`month-${d}`];
  
  // ✦ Принудительно стираем текст
  if (typeof _draftInputs !== 'undefined') _draftInputs[`mTaskIn-${d}`] = '';
  if (inp) inp.value = '';
  
  render();
}

// ==================== MONTH DRAG & DROP ====================
let _monthDragDay = null;
let _monthDragIdx = null;

function monthDragStart(e, day, idx) {
  _monthDragDay = day;
  _monthDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  const row = e.target.closest('.task-item');
  if (row) row.style.opacity = '0.4';
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
  const insertAt = _monthDragIdx < targetIdx ? targetIdx - 1 : targetIdx;
  dd.tasks.splice(insertAt, 0, item);
  saveDayData(y, m, day, dd);
  _monthDragDay = null;
  _monthDragIdx = null;
  render();
}

function monthDragEnd(e) {
  _monthDragDay = null;
  _monthDragIdx = null;
  const row = e.target.closest('.task-item');
  if (row) row.style.opacity = '';
}

// ==================== GOAL DRAG & DROP ====================
let _goalDragIdx = null;

function goalDragStart(e, idx) {
  _goalDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  const row = e.target.closest('.goal-item');
  if (row) row.style.opacity = '0.4';
}

function goalDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function goalDrop(e, targetIdx) {
  e.preventDefault();
  if (_goalDragIdx === null || _goalDragIdx === targetIdx) return;
  const { y, m } = viewData;
  const md = getMonthData(y, m);
  const [item] = md.goals.splice(_goalDragIdx, 1);
  const insertAt = _goalDragIdx < targetIdx ? targetIdx - 1 : targetIdx;
  md.goals.splice(insertAt, 0, item);
  saveMonthData(y, m, md);
  _goalDragIdx = null;
  render();
}

function goalDragEnd(e) {
  _goalDragIdx = null;
  const row = e.target.closest('.goal-item');
  if (row) row.style.opacity = '';
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
  
  // ✦ Принудительно стираем текст
  if (typeof _draftInputs !== 'undefined') _draftInputs['newGoalInp'] = '';
  if (inp) inp.value = '';
  
  render();
}

function toggleGoal(i) {
  const {y, m} = viewData;
  const md = getMonthData(y, m);
  const goal = md.goals[i];
  if (!goal) return;

  const wasDone = goal.done;
  goal.done = !wasDone;

  // Выдаем +15 XP за достижение цели месяца
  if (!wasDone) {
    addXP(15, 'Цель месяца', `month-goal-${y}-${m}-${i}`);
  }

  saveMonthData(y, m, md);

  // Обратная синхронизация с проектом (без повторного начисления XP)
  if (goal.ideaGoalId && goal.ideaId) {
    const ideas = getIdeas();
    const idea = ideas.find(p => p.id === goal.ideaId);
    if (idea && idea.goals) {
      const pGoal = idea.goals.find(g => g.id === goal.ideaGoalId);
      if (pGoal) {
        pGoal.done = goal.done;
        saveIdeas(ideas);
      }
    }
  }
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
  const goal = md.goals[i];

  // Удаляем цель и из проекта тоже
  if (goal.ideaGoalId && goal.ideaId) {
    const ideas = getIdeas();
    const idea = ideas.find(p => p.id === goal.ideaId);
    if (idea && idea.goals) {
      const gIdx = idea.goals.findIndex(g => g.id === goal.ideaGoalId);
      if (gIdx !== -1) {
        idea.goals.splice(gIdx, 1);
        saveIdeas(ideas);
      }
    }
  }

  md.goals.splice(i, 1);
  saveMonthData(y, m, md);
  render();
}
