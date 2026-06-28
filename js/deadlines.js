// ==================== HABITS PAGE ====================
function buildHabitsPage() {
  const habits = getHabits();
  const today = activeDateStr();

  let listHTML = '';
  if (habits.length === 0) {
    listHTML = '<div class="empty-state">Нет привычек. Добавьте первую!</div>';
  } else {
    habits.forEach(h => {
      const isDoneToday = h.history && h.history[today];

      // Генерируем 14 квадратиков для истории (2 ряда по 7)
      let squaresHTML = '';
      for (let i = 13; i >= 0; i--) {
        const d = new Date(ACT_Y, ACT_M, ACT_D - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const done = h.history && h.history[iso];
        squaresHTML += `<div class="habit-square ${done ? 'done' : ''}" title="${iso}"></div>`;
      }

      listHTML += `
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-name">${esc(h.name)}</div>
            <button class="habit-del-btn" onclick="deleteHabit(${h.id})">✕</button>
          </div>
          <div class="habit-grid-14">
            ${squaresHTML}
          </div>
          <button class="habit-mark-btn ${isDoneToday ? 'done' : ''}" onclick="toggleHabit(${h.id})">
            ${isDoneToday ? '✓ Выполнено (Отменить)' : 'Отметить'}
          </button>
        </div>
      `;
    });
  }

  return `
    <style>
      /* ✦ Делаем контейнер сеткой: 2 колонки на телефоне, больше на ПК */
      .habits-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr); 
        gap: 12px;
      }
      @media (min-width: 768px) {
        .habits-list { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
      }
      
      /* ✦ Уменьшаем отступы и размеры внутри карточки */
      .habit-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; }
      .habit-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; }
      .habit-name { font-size: 15px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; word-break: break-word; line-height: 1.2; }
      .habit-del-btn { background: none; border: none; color: var(--text-tertiary); font-size: 16px; padding: 0; cursor: pointer; line-height: 1; flex-shrink: 0; }
      
      /* ✦ Делаем квадратики и отступы между ними меньше */
      .habit-grid-14 { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 12px; }
      .habit-square { aspect-ratio: 1; background: rgba(255,255,255,0.05); border-radius: 4px; transition: 0.2s; }
      .habit-square.done { background: #6BE3A4; box-shadow: 0 0 8px rgba(107,227,164,0.3); }
      
      /* ✦ Компактная кнопка */
      .habit-mark-btn { margin-top: auto; width: 100%; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; background: #fff; color: #000; transition: 0.2s; }
      .habit-mark-btn.done { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
    </style>
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">🔄 Привычки</h2>
    </div>
    <div class="section-card" style="margin-bottom:16px">
      <div class="add-row">
        <input class="add-input" id="habitInput" placeholder="Новая привычка..." autofocus>
        <button class="btn-primary" onclick="addHabit()">+</button>
      </div>
    </div>
    <div class="habits-list">
      ${listHTML}
    </div>
  `;
}

function addHabit() {
  const inp = document.getElementById('habitInput');
  const name = inp ? inp.value.trim() : '';
  if (!name) return;
  const habits = getHabits();
  habits.push({ id: Date.now(), name: name, history: {} });
  saveHabits(habits);
  
  // Очищаем инпут
  if (typeof _draftInputs !== 'undefined') _draftInputs['habitInput'] = '';
  if (inp) inp.value = '';
  render();
}

function deleteHabit(id) {
  if (!confirm('Удалить привычку навсегда?')) return;
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  render();
}

function toggleHabit(id) {
  const habits = getHabits();
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  const today = activeDateStr();
  if (!habit.history) habit.history = {};

  const wasDone = habit.history[today];

  if (wasDone) {
    delete habit.history[today];
    // ✦ Отменяем XP, если нажали случайно
    if (localStore._xp >= 10) localStore._xp -= 10;
    if (localStore._xpLog && localStore._xpLog[today] && localStore._xpLog[today][`habit-${id}-${today}`]) {
      delete localStore._xpLog[today][`habit-${id}-${today}`];
    }
  } else {
    habit.history[today] = true;
    addXP(10, 'Привычка', `habit-${id}-${today}`); // Даем +10 XP
  }

  saveHabits(habits);
  render();
}