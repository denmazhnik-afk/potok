// ==================== HABITS PAGE ====================
// 7 нежных базовых цветов для подложки карточек
const HABIT_COLORS = [
  'var(--surface)', // 0: По умолчанию (темно-серый)
  '#3a282a',        // 1: Пыльно-красный
  '#3d3122',        // 2: Теплый песочный
  '#253327',        // 3: Приглушенный зеленый (мята)
  '#222f3d',        // 4: Глубокий синий
  '#31263d',        // 5: Ежевичный
  '#304b4f',
  '#542525',
  '#522848',
  '#3d2633'         // 6: Пыльно-розовый
];

function buildHabitsPage() {
  const habits = getHabits();
  const today = activeDateStr();

  let listHTML = '';
  if (habits.length === 0) {
    listHTML = '<div class="empty-state">Нет привычек. Добавьте первую!</div>';
  } else {
    habits.forEach(h => {
      const isDoneToday = h.history && h.history[today];
      const bgColor = h.color || HABIT_COLORS[0];

      // Генерируем 14 квадратиков для истории (2 ряда по 7)
      let squaresHTML = '';
      for (let i = 13; i >= 0; i--) {
        const d = new Date(ACT_Y, ACT_M, ACT_D - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const done = h.history && h.history[iso];
        // Подсвечиваем сегодняшний день (последний квадратик), если он выполнен
        const isLastAndDone = (i === 0 && done) ? 'today-done' : '';
        squaresHTML += `<div class="habit-square ${done ? 'done' : ''} ${isLastAndDone}" title="${iso}"></div>`;
      }

      listHTML += `
        <div class="habit-card" style="background-color: ${bgColor}">
          <div class="habit-header">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-actions">
              <button class="habit-icon-btn" onclick="cycleHabitColor(${h.id})" title="Изменить цвет">${ICONS.palette}</button>
              <button class="habit-icon-btn" onclick="deleteHabit(${h.id})" title="Удалить">✕</button>
            </div>
          </div>
          <div class="habit-grid-14">
            ${squaresHTML}
          </div>
          <button class="habit-mark-btn" onclick="toggleHabit(${h.id})">
            ${isDoneToday ? '<div class="check-circle done">✓</div>' : 'Выполнить'}
          </button>
        </div>
      `;
    });
  }

  return `
    <style>
      .habits-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      @media (min-width: 768px) { .habits-list { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }
      
      .habit-card { border: 1px solid var(--border); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; transition: background 0.3s; }
      .habit-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; }
      .habit-name { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.02em; word-break: break-word; line-height: 1.2; }
      
      .habit-actions { display: flex; gap: 6px; align-items: center; }
      .habit-icon-btn { background: none; border: none; color: var(--text-tertiary); font-size: 14px; padding: 0; cursor: pointer; transition: 0.2s; }
      .habit-icon-btn:hover { color: #fff; }
      
      .habit-grid-14 { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 12px; }
      .habit-square { aspect-ratio: 1; background: rgba(255,255,255,0.08); border-radius: 4px; transition: 0.2s; }
      .habit-square.done { background: rgba(255,255,255,0.25); }
      .habit-square.today-done { background: #fff; } /* Яркий белый для выполненного сегодня */
      
      /* Темная кнопка с круглым чекмарком */
      .habit-mark-btn { margin-top: auto; width: 100%; height: 42px; border-radius: 12px; border: none; cursor: pointer; background: rgba(0,0,0,0.25); color: #fff; font-size: 15px; font-weight: 700; display: flex; justify-content: center; align-items: center; transition: 0.2s; }
      .habit-mark-btn:active { transform: scale(0.97); }
      
      .check-circle { width: 26px; height: 26px; border-radius: 50%; background: #fff; color: #000; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px; transition: 0.3s; }
      .check-circle.done { background: #6BE3A4; color: #000; box-shadow: 0 0 10px rgba(107,227,164,0.4); }
    </style>
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">${ICONS.refresh} Привычки</h2>
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
  habits.push({ id: Date.now(), name: name, history: {}, color: HABIT_COLORS[0] });
  saveHabits(habits);
  
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

// ✦ Функция переключения цветов
function cycleHabitColor(id) {
  const habits = getHabits();
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  
  let currentIdx = HABIT_COLORS.indexOf(habit.color || HABIT_COLORS[0]);
  let nextIdx = (currentIdx + 1) % HABIT_COLORS.length;
  habit.color = HABIT_COLORS[nextIdx];
  
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
    // Отменяем выполнение, но НЕ забираем XP (чтобы не сломать логику опыта при случайных кликах)
    delete habit.history[today];
  } else {
    // Отмечаем как выполненное и начисляем XP
    habit.history[today] = true;
    addXP(10, 'Привычка', `habit-${id}-${today}`); 
  }

  saveHabits(habits);
  render();
}