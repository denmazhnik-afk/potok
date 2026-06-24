// ==================== DEADLINES PAGE ====================
function buildDeadlinesPage() {
  const deadlines = getAllDeadlines();
  const today = todayStr();

  let listHTML = '';
  if (deadlines.length === 0) {
    listHTML = '<div class="empty-state">Нет задач с дедлайнами</div>';
  } else {
    deadlines.forEach((item, i) => {
      const days = daysUntil(item.deadline);
      let statusClass = '';
      let statusText = '';

      if (item.done) {
        statusClass = 'done';
        statusText = '✓';
      } else if (days < 0) {
        statusClass = 'overdue';
        statusText = `${Math.abs(days)} дн. назад`;
      } else if (days === 0) {
        statusClass = 'today';
        statusText = 'Сегодня!';
      } else {
        statusClass = 'overdue';
        statusText = `${days} дн.`;
      }

      listHTML += `
        <div class="deadline-item ${statusClass}">
          <div class="deadline-status">${statusText}</div>
          <div class="deadline-content">
            <div class="deadline-text ${item.done ? 'done' : ''}">${esc(item.text)}</div>
            <div class="deadline-date">${item.deadline}</div>
          </div>
          <button class="deadline-toggle" onclick="toggleDeadlineTask(${item.dayY},${item.dayM},${item.dayD},${item.taskIdx})">
            ${item.done ? '✓' : '○'}
          </button>
        </div>
      `;
    });
  }

  return `
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">📋 Дедлайны</h2>
    </div>
    <div class="section-card" style="margin-bottom:16px">
      <div class="section-eyebrow">Добавить задачу с дедлайном</div>
      <div class="add-row">
        <input class="add-input" id="dlTaskInput" placeholder="Текст задачи..." autofocus>
        <input class="add-input deadline-input" id="dlDateInput" type="date" value="${today}">
        <button class="btn-primary" onclick="addDeadlineTask()">+</button>
      </div>
    </div>
    <div class="deadlines-list">
      ${listHTML}
    </div>
  `;
}

function toggleDeadlineTask(y, m, d, taskIdx) {
  const dd = getDayData(y, m, d);
  if (dd.tasks[taskIdx]) {
    dd.tasks[taskIdx].done = !dd.tasks[taskIdx].done;
    sortTasks(dd.tasks);
    saveDayData(y, m, d, dd);
    render();
  }
}

function addDeadlineTask() {
  const inp = document.getElementById('dlTaskInput');
  const dlInp = document.getElementById('dlDateInput');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const deadline = dlInp ? dlInp.value : '';

  // If deadline is set, add task to that day; otherwise today
  if (deadline) {
    const [dy, dm, dd] = deadline.split('-').map(Number);
    const td = getDayData(dy, dm - 1, dd);
    td.tasks.push({ text, done: false, deadline });
    sortTasks(td.tasks);
    saveDayData(dy, dm - 1, dd, td);
  } else {
    const td = getDayData(ACT_Y, ACT_M, ACT_D);
    td.tasks.push({ text, done: false });
    sortTasks(td.tasks);
    saveDayData(ACT_Y, ACT_M, ACT_D, td);
  }
  render();
}