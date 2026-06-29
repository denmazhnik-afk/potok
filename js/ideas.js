// ==================== IDEAS PAGE ====================
function buildIdeasPage() {
  const ideas = getIdeas();

  let cardsHTML = '';
  if (ideas.length === 0) {
    cardsHTML = '<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px 0">Нет проектов. Создайте первый!</div>';
  } else {
    ideas.forEach(p => {
      const total = p.tasks.length;
      const done = p.tasks.filter(t => t.done).length;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      cardsHTML += `
        <div class="idea-card" onclick="openIdeaDetail('${esc(p.id)}')">
          <div class="idea-emoji">${ICONS[p.emoji] || ICONS.folder}</div>
          <div class="idea-name">${esc(p.name)}</div>
          <div class="idea-stats">${done}/${total} задач</div>
          <div class="idea-bar">
            <div class="idea-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    });
  }

  return `
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin-right:8px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> Проекты</h2>
      <button class="btn-primary" onclick="startAddIdea()">+ Проект</button>
    </div>
    <div class="ideas-grid">
      ${cardsHTML}
    </div>
  `;
}

// ==================== IDEA DETAIL ====================
function buildIdeaDetail() {
  const idea = getIdeaById(viewData.id);
  if (!idea) {
    return `
      <div class="page-header">
        <button class="back-btn" onclick="openIdeas()">← Назад</button>
        <h2 class="page-heading">Проект не найден</h2>
      </div>
    `;
  }

  // Emoji picker (hidden by default)
  const emojiPickerHTML = buildEmojiPicker(idea.id);

  let activeTasksHTML = '';
  let doneTasksHTML = '';

  idea.tasks.forEach((t, i) => {
    const isUrgent = t.urgent && !t.done;
    const urgentCls = isUrgent ? 'urgent-row' : '';
    const urgentBtn = isUrgent ? 'active' : '';

    // Собираем нижний ряд (Молния + Календарь)
    let bottomItems = '';
    if (!t.done) {
      bottomItems += `<button class="task-urgent-btn ${urgentBtn}" onclick="toggleIdeaTaskUrgent('${esc(idea.id)}',${i})" title="Срочно">${ICONS.lightning}</button>`;
    }
    
    if (t.scheduledDate) {
      // Если дата есть — показываем красную плашку (и делаем её кликабельной!)
      bottomItems += `<span class="task-deadline-badge ${t.done ? 'done' : ''}" style="cursor:pointer;" onclick="setIdeaTaskDate('${esc(idea.id)}',${i})" title="Изменить дату">${ICONS.calendar} ${formatDateDisplay(t.scheduledDate)}</span>`;
    } else if (!t.done) {
      // Если даты нет — показываем серую кнопку календаря рядом с молнией
      bottomItems += `<button class="task-urgent-btn" onclick="setIdeaTaskDate('${esc(idea.id)}',${i})" title="Добавить дату">${ICONS.calendar}</button>`;
    }

    let footerHTML = bottomItems ? `<div class="task-bottom-row">${bottomItems}</div>` : '';

    // Обрати внимание: мы НАВСЕГДА удалили <button class="ibtn"> из верхней строки!
    const itemHTML = `
      <div class="task-item ${t.done ? 'done-row' : ''} ${urgentCls}"
        draggable="true" data-idx="${i}" data-flip-id="idea-${esc(idea.id)}-${i}"
        ondragstart="ideaDragStart(event,'${esc(idea.id)}',${i})"
        ondragover="ideaDragOver(event)"
        ondrop="ideaDrop(event,'${esc(idea.id)}',${i})"
        ondragend="ideaDragEnd(event)">
        <span class="task-drag" title="Перетащить">⋮⋮</span>
        <div class="task-cb ${t.done ? 'checked' : ''}" onclick="toggleIdeaTask('${esc(idea.id)}',${i})"></div>
        <span class="task-name ${t.done ? 'struck' : ''}">${esc(t.text)}</span>
        <button class="task-del" onclick="deleteIdeaTask('${esc(idea.id)}',${i})">×</button>
        ${footerHTML}
      </div>
    `;
    if (t.done) doneTasksHTML += itemHTML;
    else activeTasksHTML += itemHTML;
  });

  const doneCount = idea.tasks.filter(t => t.done).length;
  const isExpanded = uiState.ideaDoneExpanded === idea.id;

  let tasksHTML = '';
  if (idea.tasks.length === 0) {
    tasksHTML = '<div class="empty-state">Нет задач. Добавьте первую!</div>';
  } else {
    tasksHTML = activeTasksHTML;
    if (doneCount > 0) {
      tasksHTML += `
        <div class="done-toggle" onclick="toggleIdeaDone('${esc(idea.id)}')">
          <span class="done-toggle-icon">${isExpanded ? '▾' : '▸'}</span>
          <span>✓ Выполненные (${doneCount})</span>
        </div>
        <div class="done-collapsed ${isExpanded ? 'open' : ''}">
          ${doneTasksHTML}
        </div>
      `;
    }
  }
  let goalsHTML = '';
  const projectGoals = idea.goals || [];
  projectGoals.forEach(g => {
    let mText = '';
    if (g.month) {
      const [gy, gm] = g.month.split('-').map(Number);
      mText = `<span class="badge badge-blue" style="margin-left:8px;font-size:10px">${MONTHS_SHORT[gm]} ${gy}</span>`;
    }
    goalsHTML += `
      <div class="task-item ${g.done ? 'done-row' : ''}" style="margin-bottom:6px">
        <div class="task-cb ${g.done ? 'checked' : ''}" onclick="toggleIdeaGoal('${esc(idea.id)}', '${g.id}')"></div>
        <span class="task-name ${g.done ? 'struck' : ''}">${esc(g.text)} ${mText}</span>
        <button class="task-del" style="opacity:1" onclick="deleteIdeaGoal('${esc(idea.id)}', '${g.id}')">×</button>
      </div>
    `;
  });
  if (!goalsHTML) goalsHTML = '<div class="empty-state" style="padding:6px 0">Нет глобальных целей</div>';

  window._newGoalMonthVal = '';

  const goalsSection = `
    <div class="section-card">
      <div class="section-eyebrow">${ICONS.target} Цели проекта</div>
      <div style="margin-bottom:12px">${goalsHTML}</div>
      <div class="add-row">
        <input class="add-input" id="ideaGoalInp" placeholder="Новая цель...">
        <button class="date-pick-btn" id="ideaGoalMonthBtn" onclick="openGoalMonthPicker()" style="flex:0 0 100px; padding:0; justify-content:center; align-items:center; display:flex;">
           Без месяца
        </button>
        <button class="btn-primary" onclick="addIdeaGoal('${esc(idea.id)}')">+</button>
      </div>
    </div>
  `;	
  const notesHTML = buildNoteBlock('ideaNotes-' + idea.id, 'Заметки', idea.notes || '');

  return `
    <div class="page-header">
      <button class="back-btn" onclick="openIdeas()">← Назад</button>
      <h2 class="page-heading">${ICONS[idea.emoji] || ICONS.folder} ${esc(idea.name)}</h2>
      <button class="btn-secondary" onclick="deleteIdea('${esc(idea.id)}')">${ICONS.trash}</button>
    </div>

    <div class="section-card">
      <div class="idea-emoji-row">
        <div class="idea-big-emoji" id="ideaEmojiBtn" onclick="toggleEmojiPicker()">${ICONS[idea.emoji] || ICONS.folder}</div>
        <div class="idea-emoji-label">Нажмите, чтобы сменить эмодзи</div>
      </div>
      ${emojiPickerHTML}
    </div>

    ${goalsSection}

    <div class="section-card">
      <div class="section-eyebrow">${ICONS.task} Задачи</div>
      <div class="idea-tasks-list">
        ${tasksHTML}
      </div>
      <div class="add-row idea-add-row">
        <input class="add-input" id="ideaTaskInp" placeholder="Новая задача...">
        <button type="button" class="date-pick-btn ${uiState.ideaAddDate ? 'has-date' : ''}" onclick="openIdeaAddDatePicker()">
          ${ICONS.calendar} ${uiState.ideaAddDate ? formatDateDisplay(uiState.ideaAddDate) : 'Дата'}
        </button>
        <button class="btn-primary" onclick="addIdeaTask('${esc(idea.id)}')">+</button>
      </div>
    </div>

    <div class="section-card">${notesHTML}</div>
  `;
}

// ==================== EMOJI PICKER ====================
const PROJECT_ICONS_LIST = ['folder', 'rocket', 'code', 'briefcase', 'book', 'camera', 'video', 'monitor', 'music', 'heart', 'activity', 'globe', 'tool', 'megaphone', 'shopping', 'star', 'coffee', 'cpu', 'users', 'pen'];

function buildEmojiPicker(ideaId) {
  let html = `<div class="emoji-picker" id="emojiPicker" style="display: none; flex-wrap: wrap; gap: 8px; margin-top: 16px;">`;
  PROJECT_ICONS_LIST.forEach(key => {
    html += `<div class="emoji-option" style="cursor:pointer; display:inline-flex; padding:8px; border-radius:8px; transition:0.2s; color: var(--text-primary);" 
      onclick="changeIdeaEmoji('${esc(ideaId)}', '${key}')" title="${key}">
      ${ICONS[key]}
    </div>`;
  });
  html += '</div>';
  return html;
}

function toggleEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  if (picker) {
    picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
  }
}

function changeIdeaEmoji(id, emoji) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.emoji = emoji;
    saveIdeas(ideas);
  }
  render();
}

// ==================== IDEA HANDLERS ====================
let _ideaIdCounter = 0;

function startAddIdea() {
  const name = prompt('Название проекта:');
  if (!name || !name.trim()) return;

  const ideas = getIdeas();
  const emojis = ['📁','🎯','🚀','💡','🛠️','📚','🎨','🎮','🎵','⚡'];
  ideas.push({
    id: 'idea_' + Date.now() + '_' + (++_ideaIdCounter),
    name: name.trim(),
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    tasks: [],
    notes: ''
  });
  saveIdeas(ideas);
  render();
}

function deleteIdea(id) {
  if (!confirm('Удалить проект?')) return;
  const ideas = getIdeas().filter(p => p.id !== id);
  saveIdeas(ideas);
  openIdeas();
}

function sortIdeaTasks(tasks) {
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return 0;
  });
}

function addIdeaTask(id) {
  const inp = document.getElementById('ideaTaskInp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const date = uiState.ideaAddDate || null;

  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.tasks.push({
      id: generateIdeaTaskId(),
      text, done: false,
      scheduledDate: date
    });
    sortIdeaTasks(idea.tasks);
    saveIdeas(ideas);
    uiState.ideaAddDate = null;
    
    // ✦ Принудительно стираем текст
    if (typeof _draftInputs !== 'undefined') _draftInputs['ideaTaskInp'] = '';
    if (inp) inp.value = '';
    
    render();
  }
}

function openIdeaAddDatePicker() {
  openDatePicker({
    date: uiState.ideaAddDate || null,
    title: 'Дата новой задачи',
    onSave: (date) => {
      uiState.ideaAddDate = date;
      render();
    },
    onClear: () => {
      uiState.ideaAddDate = null;
      render();
    }
  });
}

function toggleIdeaTask(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (!idea || !idea.tasks[idx]) return;
  
  const wasDone = idea.tasks[idx].done;
  idea.tasks[idx].done = !wasDone;
  
  // Выдаем +10 XP, если задача только что была выполнена
  if (!wasDone) {
    addXP(10, 'Задача проекта', `idea-task-${id}-${idx}`);
  }
  
  saveIdeas(ideas);
  render();
}

function toggleIdeaTaskUrgent(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea && idea.tasks[idx]) {
    idea.tasks[idx].urgent = !idea.tasks[idx].urgent;
    sortIdeaTasks(idea.tasks);
    saveIdeas(ideas);
    render();
  }
}

function deleteIdeaTask(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.tasks.splice(idx, 1);
    saveIdeas(ideas);
    render();
  }
}

function setIdeaTaskDate(ideaId, taskIdx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea || !idea.tasks[taskIdx]) return;
  const task = idea.tasks[taskIdx];

  openDatePicker({
    date: task.scheduledDate || null,
    title: task.text,
    onSave: (date) => {
      const list = getIdeas();
      const proj = list.find(p => p.id === ideaId);
      if (proj && proj.tasks[taskIdx]) {
        proj.tasks[taskIdx].scheduledDate = date;
        delete proj.tasks[taskIdx].scheduledTime;
        saveIdeas(list);
        render();
      }
    },
    onClear: () => {
      const list = getIdeas();
      const proj = list.find(p => p.id === ideaId);
      if (proj && proj.tasks[taskIdx]) {
        proj.tasks[taskIdx].scheduledDate = null;
        delete proj.tasks[taskIdx].scheduledTime;
        saveIdeas(list);
        render();
      }
    }
  });
}

// ==================== IDEA DONE TOGGLE ====================
function toggleIdeaDone(id) {
  if (uiState.ideaDoneExpanded === id) uiState.ideaDoneExpanded = null;
  else uiState.ideaDoneExpanded = id;
  render();
}

// ==================== IDEA DRAG & DROP ====================
let _ideaDragIdx = null;
let _ideaDragId = null;

function ideaDragStart(e, id, idx) {
  _ideaDragIdx = idx;
  _ideaDragId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.4';
}

function ideaDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function ideaDrop(e, id, targetIdx) {
  e.preventDefault();
  if (_ideaDragIdx === null || _ideaDragIdx === targetIdx || _ideaDragId !== id) return;
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (!idea) return;
  const [item] = idea.tasks.splice(_ideaDragIdx, 1);
  const insertAt = _ideaDragIdx < targetIdx ? targetIdx - 1 : targetIdx;
  idea.tasks.splice(insertAt, 0, item);
  saveIdeas(ideas);
  _ideaDragIdx = null;
  _ideaDragId = null;
  render();
}

function ideaDragEnd(e) {
  _ideaDragIdx = null;
  _ideaDragId = null;
}
// ==================== PROJECT GOALS LOGIC ====================
function addIdeaGoal(ideaId) {
  const inp = document.getElementById('ideaGoalInp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;

  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea) return;
  if (!idea.goals) idea.goals = [];

  // Берем месяц из глобальной переменной модалки
  const monthVal = window._newGoalMonthVal || ''; 
  const goalId = 'ig_' + Date.now();

  idea.goals.push({ id: goalId, text, done: false, month: monthVal });
  saveIdeas(ideas);

  // Добавляем цель в выбранный месяц
  if (monthVal) {
    const [y, m] = monthVal.split('-').map(Number);
    const md = getMonthData(y, m);
    md.goals.push({
      text: `[${idea.emoji || '📁'} ${idea.name}] ${text}`,
      done: false,
      ideaGoalId: goalId,
      ideaId: ideaId
    });
    saveMonthData(y, m, md);
  }
  
  window._newGoalMonthVal = ''; // Сбрасываем после добавления
  render();
}

function toggleIdeaGoal(ideaId, goalId) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea || !idea.goals) return;
  const goal = idea.goals.find(g => g.id === goalId);
  if (!goal) return;

  const wasDone = goal.done;
  goal.done = !wasDone;

  // Выдаем +15 XP за достижение цели проекта
  if (!wasDone) {
    addXP(15, 'Цель проекта', `idea-goal-${ideaId}-${goalId}`);
  }

  saveIdeas(ideas);

  // Синхронизируем статус с месяцем (без повторного начисления XP)
  if (goal.month) {
    const [y, m] = goal.month.split('-').map(Number);
    const md = getMonthData(y, m);
    const mg = md.goals.find(g => g.ideaGoalId === goalId);
    if (mg) {
      mg.done = goal.done;
      saveMonthData(y, m, md);
    }
  }
  render();
}

function deleteIdeaGoal(ideaId, goalId) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea || !idea.goals) return;
  
  const idx = idea.goals.findIndex(g => g.id === goalId);
  if (idx === -1) return;
  
  const goal = idea.goals[idx];
  idea.goals.splice(idx, 1);
  saveIdeas(ideas);

  // Удаляем из месяца
  if (goal.month) {
    const [y, m] = goal.month.split('-').map(Number);
    const md = getMonthData(y, m);
    md.goals = md.goals.filter(g => g.ideaGoalId !== goalId);
    saveMonthData(y, m, md);
  }
  render();
}
// ==================== PROJECT GOAL MONTH PICKER ====================
let _goalMonthPickerYear = ACT_Y;

function openGoalMonthPicker() {
  _goalMonthPickerYear = ACT_Y;
  if (window._newGoalMonthVal) {
    _goalMonthPickerYear = parseInt(window._newGoalMonthVal.split('-')[0]);
  }
  renderGoalMonthPicker();
}

function renderGoalMonthPicker() {
  let modal = document.getElementById('goalMonthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'goalMonthModal';
    modal.className = 'date-modal-overlay';
    modal.style.zIndex = '10000';
    modal.onclick = (e) => { if(e.target === modal) closeGoalMonthPicker(); };
    document.body.appendChild(modal);
  }

  let monthsHTML = '';
  MONTHS_SHORT.forEach((mName, idx) => {
    const val = `${_goalMonthPickerYear}-${idx}`;
    const isSelected = window._newGoalMonthVal === val;
    monthsHTML += `
      <button class="dp-day ${isSelected ? 'selected' : ''}" 
              style="aspect-ratio: auto; height: 42px; border-radius: 10px; font-size: 14px; display:flex; align-items:center; justify-content:center;"
              onclick="selectGoalMonth('${val}')">
        ${mName}
      </button>
    `;
  });

  modal.innerHTML = `
    <div class="date-modal" style="max-width: 320px; padding: 24px;">
      <div class="date-modal-title" style="text-align: center; margin-bottom: 16px; font-size: 16px;">Выберите месяц для цели</div>
      
      <div class="dp-nav" style="margin-bottom: 20px; justify-content: center; gap: 24px;">
        <button class="dp-nav-btn" onclick="changeGoalPickerYear(-1)">←</button>
        <div class="dp-month-label" style="min-width: 60px; text-align: center; font-size: 18px;">${_goalMonthPickerYear}</div>
        <button class="dp-nav-btn" onclick="changeGoalPickerYear(1)">→</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px;">
        ${monthsHTML}
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="date-modal-btn cancel" style="flex: 1;" onclick="selectGoalMonth('')">Сбросить</button>
        <button class="date-modal-btn remove" style="flex: 1;" onclick="closeGoalMonthPicker()">Закрыть</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function changeGoalPickerYear(dir) {
  _goalMonthPickerYear += dir;
  renderGoalMonthPicker();
}

function selectGoalMonth(val) {
  window._newGoalMonthVal = val;
  closeGoalMonthPicker();
  
  // Обновляем кнопку без перезагрузки всей страницы, чтобы не стереть введенный текст
  const btn = document.getElementById('ideaGoalMonthBtn');
  if (btn) {
    if (val) {
      const [gy, gm] = val.split('-').map(Number);
      btn.textContent = `${MONTHS_SHORT[gm]} ${gy}`;
      btn.classList.add('has-date');
    } else {
      btn.textContent = 'Без месяца';
      btn.classList.remove('has-date');
    }
  }
}

function closeGoalMonthPicker() {
  const modal = document.getElementById('goalMonthModal');
  if (modal) modal.style.display = 'none';
}
