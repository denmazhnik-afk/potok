// ==================== DAY PAGE ====================
function buildDayPage() {
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  const allTasks = getDayTasksWithIdeas(ACT_Y, ACT_M, ACT_D);
  window._currentDayTasks = allTasks;
  const total = allTasks.length;
  const done = allTasks.filter(t => t.done).length;
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  const water = getWater();

  const items = buildTickerItems(allTasks);

  let tasksHTML = '';
  allTasks.forEach((t, i) => {
    const hasDeadline = t.deadline && !t.done;
    const isUrgent = t.urgent && !t.done;
    const dlBadge = t.deadline ? `<span class="task-deadline-badge ${t.done ? 'done' : ''}">${ICONS.calendar} ${formatDateDisplay(t.deadline)}</span>` : '';
    const urgentCls = isUrgent ? 'urgent-row' : '';
    const urgentBtn = isUrgent ? 'active' : '';
    const ideaTag = t.fromIdea ? `<span class="idea-tag" title="Из проекта" style="display:inline-flex; align-items:center; margin-right:4px;">${ICONS[t.ideaEmoji] || ICONS.folder}</span>` : '';
    
    // Блок с молнией и датой (только если задача не выполнена)
    let footerHTML = '';
    if (!t.done) {
      footerHTML = `<div class="task-bottom-row">
        <button class="task-urgent-btn ${urgentBtn}" onclick="toggleDayTaskUrgent(${i})" title="Срочно">${ICONS.lightning}</button>
        ${dlBadge}
      </div>`;
    }

    tasksHTML += `<li class="task-item ${t.done ? 'done-row' : ''} ${hasDeadline ? 'deadline-row' : ''} ${urgentCls}"
      draggable="true" data-idx="${i}" data-flip-id="dt-${flipKey(t.text)}"
      ondragstart="dayDragStart(event,${i})" ondragover="dayDragOver(event)"
      ondrop="dayDrop(event,${i})" ondragend="dayDragEnd(event)">
      <span class="task-drag" title="Перетащить">⋮⋮</span>
      <div class="task-cb ${t.done ? 'checked' : ''}" onclick="toggleDayTask(${i})"></div>
      <span class="task-name ${t.done ? 'struck' : ''}">${ideaTag}${esc(t.text)}</span>
      <button class="task-del" onclick="deleteDayTask(${i})" title="${t.fromIdea ? 'Убрать из дня' : 'Удалить'}">×</button>
      ${footerHTML}
    </li>`;
  });
  if (!tasksHTML) tasksHTML = `<li class="empty-state">Нет задач — добавьте первую</li>`;

  // Пикер настроения
  const currentMood = td.mood || 0;
  const moodLabels = ['','Ужасно','Плохо','Так себе','Хорошо','Супер'];
  let moodHTML = '';
  for (let i = 1; i <= 5; i++) {
    const isActive = i === currentMood;
    const moodColor = getMoodColor(i);
    moodHTML += `<button class="mood-btn ${isActive ? 'active' : ''}"
      style="--mood-color: ${moodColor}"
      onclick="setMood(${ACT_Y},${ACT_M},${ACT_D},${i}); render();"
      title="${moodLabels[i]}">
      <span class="mood-num">${i}</span>
      <span class="mood-emoji">${getMoodEmoji(i)}</span>
    </button>`;
  }

  const addRow = uiState.addingTask['today']
    ? `<div class="add-row">
        <input class="add-input" id="dayTaskInput" placeholder="Новая задача..." autofocus>
        <input class="add-input deadline-input" id="dayDeadlineInput" type="date" title="Дедлайн (необязательно)">
        <button class="btn-primary" onclick="confirmDayTask()">+</button>
        <button class="btn-secondary" onclick="cancelDayTask()">✕</button>
      </div>`
    : `<div class="add-row">
        <input class="add-input" id="dayTaskInput" placeholder="Новая задача...">
        <button class="btn-primary" onclick="quickAddDayTask()">+ Добавить</button>
      </div>`;

  let pushBtn = '';
  if (allTasks.some(t => !t.done)) {
    pushBtn = `<button class="btn-push" onclick="pushTomorrow()">↪ Перенести невыполненное на завтра</button>`;
  }

  const sumHTML = buildNoteBlock('daySummary', 'Итоги дня', td.summary || '');
  const thoughtHTML = buildNoteBlock('dayThoughts', 'Мысли', td.thoughts || '');

  const calHTML = buildCalSidebar(ACT_Y, ACT_M);

  return `
  <div class="page-header">
    <button class="back-btn" onclick="goHome()">← Назад</button>
    <h2 class="page-heading">Сегодня — ${ACT_D} ${MONTHS_GEN[ACT_M]}</h2>
    <div class="days-left-tag">Ещё ${getDays(ACT_Y, ACT_M) - ACT_D} дн.</div>
  </div>

  <div class="ticker-wrap">
    <div class="goal-ticker" id="dayTicker">
      <div class="ticker-led-dot"></div>
      <div class="ticker-label">ЗАДАЧИ</div>
      <div class="ticker-stage" id="tickerStage">
        <div class="ticker-row">
          <span class="ticker-status" data-status="pending">○</span>
          <span class="ticker-text">Загрузка...</span>
        </div>
      </div>
      <div class="ticker-meta" id="tickerMeta">${done}/${total}</div>
    </div>
  </div>

  <div class="day-view-layout">
    <div class="day-view-main">
      <div class="section-card">
        <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
          ${buildRing(pct, 80, pct===100?'#6BE3A4':pct>60?'#60A5FA':'#F2C063', `${done}/${total}`)}
          ${buildRing(Math.round(water.cups/6*100), 80, '#60A5FA', `${water.cups*500}мл`)}
          <div style="flex:1">
            <div class="section-eyebrow">${ICONS.waterFull} Вода (цель 3 л / 6 стаканов)</div>
            <div class="water-day">
              <div class="water-cups-large">
                ${Array.from({length:6}, (_,i) =>
                  `<button class="cup-btn ${i < water.cups ? 'filled' : ''}" onclick="toggleWaterCup(${i})">${i < water.cups ? ICONS.waterFull : ICONS.waterEmpty}</button>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-eyebrow">${ICONS.task} Задачи на день</div>
        <ul class="task-list">${tasksHTML}</ul>
        ${addRow}
        ${pushBtn}
      </div>

      <div class="day-note-grid">
        <div class="section-card" style="margin-bottom:0">
          <div class="section-eyebrow">${ICONS.smile} Настроение</div>
          <div class="mood-picker">
            ${moodHTML}
          </div>
          ${currentMood > 0 ? `<div class="mood-label" style="color:${getMoodColor(currentMood)}">${currentMood}/5 — ${moodLabels[currentMood]}</div>` : '<div class="mood-label" style="color:var(--text-tertiary)">Оцени своё настроение</div>'}
        </div>
        <div class="section-card" style="margin-bottom:0">${sumHTML}</div>
      </div>

      <div style="margin-bottom:14px">${thoughtHTML}</div>
    </div>

    ${calHTML}
  </div>`;
}

function buildNoteBlock(id, title, text) {
  if (uiState.editingNote === id) {
    return `<div>
      <div class="section-eyebrow">${title}</div>
      <textarea class="note-textarea" id="noteTA-${id}">${esc(text)}</textarea>
      <div class="note-actions">
        <button class="confirm-sm" onclick="saveNote('${id}')">Сохранить</button>
        <button class="cancel-sm" onclick="cancelNote()">Отмена</button>
      </div>
    </div>`;
  }
  const empty = !text.trim();
  return `<div>
    <div class="section-eyebrow">${title}</div>
    <div class="note-content ${empty ? 'empty' : ''}" onclick="editNote('${id}')">${empty ? 'Нажмите, чтобы написать...' : esc(text)}</div>
  </div>`;
}

function buildCalSidebar(y, m) {
  const calDays = getCalendarDays(y, m);
  const isThisMonth = (y === ACT_Y && m === ACT_M);
  let html = `<div class="cal-sidebar">
    <div class="cal-header" style="color:#ff3b30">${MONTHS_SHORT[m]}</div>
    <div class="cal-weekdays">${WEEKDAYS_SHORT.map(w => `<div class="cal-wd">${w}</div>`).join('')}</div>
    <div class="cal-days">`;
  calDays.forEach(d => {
    if (!d) { html += '<div></div>'; return; }
    const dd = getDayData(y, m, d);
    const hasTasks = dd.tasks.length > 0;
    const hasDeadline = getDayDeadlineCount(y, m, d) > 0;
    const isToday = isThisMonth && d === ACT_D;
    html += `<div class="cal-day ${isToday?'is-today':''} ${hasTasks?'has-tasks':''} ${hasDeadline?'has-deadline':''}" onclick="scrollToDay(${d})">${d}</div>`;
  });
  html += '</div></div>';
  return html;
}

// ==================== TICKER ====================
let tickerItems = [], tickerIdx = 0, tickerTimer = null;

function buildTickerItems(tasks) {
  if (tasks.length === 0) return [{ status:'empty', text:'Нет задач — добавьте первую.' }];
  if (tasks.every(t => t.done)) return [{ status:'done', text:'✓ Все задачи выполнены — отличный день!' }];
  return tasks.filter(t => !t.done).map(t => ({ status:'pending', text:t.text }));
}

function startTicker() {
  if (tickerTimer) clearInterval(tickerTimer);
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  tickerItems = buildTickerItems(td.tasks);
  tickerIdx = 0;
  tickerTick(true);
  tickerTimer = setInterval(() => tickerTick(false), 5000);
}

function tickerTick(first) {
  const stage = document.getElementById('tickerStage');
  const meta = document.getElementById('tickerMeta');
  if (!stage) { clearInterval(tickerTimer); return; }

  const item = tickerItems[tickerIdx % tickerItems.length];
  tickerIdx++;

  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  const done = td.tasks.filter(t => t.done).length;
  const total = td.tasks.length;
  if (meta) meta.textContent = `${done}/${total}`;

  const statusGlyph = item.status === 'done' ? '✓' : item.status === 'pending' ? '○' : '·';

  const newRow = document.createElement('div');
  newRow.className = 'ticker-row';
  newRow.innerHTML = `<span class="ticker-status" data-status="${item.status}">${statusGlyph}</span><span class="ticker-text">${esc(item.text)}</span>`;

  const oldRow = stage.querySelector('.ticker-row');

  if (!first && oldRow) {
    oldRow.classList.add('is-leaving');
    newRow.classList.add('is-entering');
    stage.appendChild(newRow);
    setTimeout(() => { if (oldRow.parentNode) oldRow.remove(); }, 460);
  } else {
    stage.innerHTML = '';
    stage.appendChild(newRow);
  }
}

// ==================== NOTES ====================
function editNote(id) { uiState.editingNote = id; render(); }
function cancelNote() { uiState.editingNote = null; render(); }

function saveNote(id) {
  const ta = document.getElementById('noteTA-' + id);
  const text = ta ? ta.value : '';

  if (id === 'monthNotes') {
    const {y, m} = viewData;
    const md = getMonthData(y, m);
    md.notes = text;
    saveMonthData(y, m, md);
  } else if (id === 'daySummary') {
    const td = getDayData(ACT_Y, ACT_M, ACT_D);
    td.summary = text;
    saveDayData(ACT_Y, ACT_M, ACT_D, td);
  } else if (id === 'dayThoughts') {
    const td = getDayData(ACT_Y, ACT_M, ACT_D);
    td.thoughts = text;
    saveDayData(ACT_Y, ACT_M, ACT_D, td);
  } else if (id.startsWith('mDay-')) {
    const parts = id.split('-');
    const d = parseInt(parts[1]);
    const field = parts[2] === 'sum' ? 'summary' : 'thoughts';
    const {y, m} = viewData;
    const dd = getDayData(y, m, d);
    dd[field] = text;
    saveDayData(y, m, d, dd);
  } else if (id.startsWith('ideaNotes-')) {
    const ideaId = id.replace('ideaNotes-', '');
    const ideas = getIdeas();
    const idea = ideas.find(p => p.id === ideaId);
    if (idea) {
      idea.notes = text;
      saveIdeas(ideas);
    }
  }

  uiState.editingNote = null;
  render();
}

// ==================== DRAG & DROP (Day) ====================
let _dayDragIdx = null;

function dayDragStart(e, idx) {
  _dayDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.4';
}

function dayDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function dayDrop(e, targetIdx) {
  e.preventDefault();
  if (_dayDragIdx === null || _dayDragIdx === targetIdx) return;
  const td = getDayData(ACT_Y, ACT_M, ACT_D);
  const item = td.tasks.splice(_dayDragIdx, 1)[0];
  td.tasks.splice(targetIdx, 0, item);
  saveDayData(ACT_Y, ACT_M, ACT_D, td);
  _dayDragIdx = null;
  render();
}

function dayDragEnd(e) {
  _dayDragIdx = null;
}

