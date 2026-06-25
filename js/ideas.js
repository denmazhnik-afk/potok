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
          <div class="idea-emoji">${p.emoji || '📁'}</div>
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
      <h2 class="page-heading">💡 База идей</h2>
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
    const dateBadge = t.scheduledDate ? `<span class="task-deadline-badge ${t.done ? 'done' : ''}">${t.scheduledDate}${t.scheduledTime ? ' ' + t.scheduledTime : ''}</span>` : '';
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
        ${dateBadge}
        ${t.done ? '' : `<button class="task-urgent-btn ${urgentBtn}" onclick="toggleIdeaTaskUrgent('${esc(idea.id)}',${i})" title="Срочно">⚡</button>`}
        <button class="ibtn" onclick="setIdeaTaskDate('${esc(idea.id)}',${i})" title="Дата">📅</button>
        <button class="task-del" onclick="deleteIdeaTask('${esc(idea.id)}',${i})">×</button>
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

  const notesHTML = buildNoteBlock('ideaNotes-' + idea.id, 'Заметки', idea.notes || '');

  return `
    <div class="page-header">
      <button class="back-btn" onclick="openIdeas()">← Назад</button>
      <h2 class="page-heading">${idea.emoji || '📁'} ${esc(idea.name)}</h2>
      <button class="btn-secondary" onclick="deleteIdea('${esc(idea.id)}')">🗑️</button>
    </div>

    <div class="section-card">
      <div class="idea-emoji-row">
        <div class="idea-big-emoji" id="ideaEmojiBtn" onclick="toggleEmojiPicker()">${idea.emoji || '📁'}</div>
        <div class="idea-emoji-label">Нажмите, чтобы сменить эмодзи</div>
      </div>
      ${emojiPickerHTML}
    </div>

    <div class="section-card">
      <div class="section-eyebrow">📋 Задачи</div>
      <div class="idea-tasks-list">
        ${tasksHTML}
      </div>
      <div class="add-row">
        <input class="add-input" id="ideaTaskInp" placeholder="Новая задача..." autofocus>
        <input class="add-input deadline-input" id="ideaTaskDateInp" type="date" title="Дата (необязательно)">
        <input class="add-input deadline-input" id="ideaTaskTimeInp" type="time" title="Время (необязательно)">
        <button class="btn-primary" onclick="addIdeaTask('${esc(idea.id)}')">+</button>
      </div>
    </div>

    <div class="section-card">${notesHTML}</div>
  `;
}

// ==================== EMOJI PICKER ====================
const IDEA_EMOJIS = [
  '📁','🎯','🚀','💡','🛠️','📚','🎨','🎮','🎵','⚡',
  '🔥','💻','📱','🌐','🏠','✈️','🏋️','🧘','📷','🎬',
  '🌱','🍎','☕','🎸','✏️','📊','🔮','🎁','🪐','👾',
  '🤖','🧪','🧪','🫧','💎','🏆','🎪','🌍','🐾','❤️',
  '🧠','🦋','🌊','🌙','☀️','🍕','🥑','🦊','🐙','🦾'
];

function buildEmojiPicker(ideaId) {
  let html = `<div class="emoji-picker" id="emojiPicker">`;
  IDEA_EMOJIS.forEach(e => {
    html += `<button class="emoji-option" onclick="changeIdeaEmoji('${esc(ideaId)}','${e}')">${e}</button>`;
  });
  html += '</div>';
  return html;
}

function toggleEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  if (picker) picker.classList.toggle('open');
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
  const dateInp = document.getElementById('ideaTaskDateInp');
  const timeInp = document.getElementById('ideaTaskTimeInp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const date = dateInp ? dateInp.value : '';
  const time = timeInp ? timeInp.value : '';

  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.tasks.push({
      id: generateIdeaTaskId(),
      text, done: false,
      scheduledDate: date || null,
      scheduledTime: time || null
    });
    sortIdeaTasks(idea.tasks);
    saveIdeas(ideas);
    render();
  }
}

function toggleIdeaTask(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (!idea || !idea.tasks[idx]) return;
  idea.tasks[idx].done = !idea.tasks[idx].done;
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

  // Remove old modal if exists
  const old = document.getElementById('dateModal');
  if (old) old.remove();

  // Parse existing date and time
  let dateVal = task.scheduledDate || '';
  let timeVal = task.scheduledTime || '';

  const modal = document.createElement('div');
  modal.id = 'dateModal';
  modal.className = 'date-modal-overlay';
  modal.innerHTML = `
    <div class="date-modal">
      <div class="date-modal-title">${esc(task.text)}</div>
      <div class="date-modal-row">
        <div class="date-modal-field">
          <label class="date-modal-label">Дата</label>
          <input class="date-modal-input" id="dateModalInput" type="date" value="${dateVal}">
        </div>
        <div class="date-modal-field">
          <label class="date-modal-label">Время</label>
          <input class="date-modal-input" id="dateModalTime" type="time" value="${timeVal}">
        </div>
      </div>
      <div class="date-modal-actions">
        <button class="date-modal-btn save" onclick="confirmSetIdeaTaskDate('${esc(ideaId)}',${taskIdx})">✓ Сохранить</button>
        <button class="date-modal-btn remove" onclick="clearIdeaTaskDate('${esc(ideaId)}',${taskIdx})">✕ Убрать</button>
        <button class="date-modal-btn cancel" onclick="cancelSetIdeaTaskDate()">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) cancelSetIdeaTaskDate(); });
}

function confirmSetIdeaTaskDate(ideaId, taskIdx) {
  const dateInp = document.getElementById('dateModalInput');
  const timeInp = document.getElementById('dateModalTime');
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (idea && idea.tasks[taskIdx]) {
    idea.tasks[taskIdx].scheduledDate = (dateInp && dateInp.value) || null;
    idea.tasks[taskIdx].scheduledTime = (timeInp && timeInp.value) || null;
    saveIdeas(ideas);
  }
  const modal = document.getElementById('dateModal');
  if (modal) modal.remove();
  render();
}

function clearIdeaTaskDate(ideaId, taskIdx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (idea && idea.tasks[taskIdx]) {
    idea.tasks[taskIdx].scheduledDate = null;
    idea.tasks[taskIdx].scheduledTime = null;
    saveIdeas(ideas);
  }
  const modal = document.getElementById('dateModal');
  if (modal) modal.remove();
  render();
}

function cancelSetIdeaTaskDate() {
  const modal = document.getElementById('dateModal');
  if (modal) modal.remove();
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
