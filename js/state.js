// ==================== LIKHOY PERSONAL YANDEX SYNC ====================
const MY_YANDEX_TOKEN = 'y0__wgBENbAnfEDGNuWAyD0xPeIGDCjiKurCH5GoD8qiJawul3ifb7fZmj3pvhH'; // <--- Твой токен из Полигона

let isSyncing = false;
let lastSync = 0;
let hasLocalChanges = false;
let syncTimeout = null;

function showSyncStatus(text, type = 'syncing') {
  const status = document.getElementById('syncStatus');
  const textEl = document.getElementById('syncText');
  if (status && textEl) {
    status.className = 'sync-status show ' + type;
    textEl.textContent = text;
    setTimeout(() => { status.classList.remove('show'); }, 2000);
  }
}

async function syncToServer() {
  if (isSyncing || !MY_YANDEX_TOKEN || !hasLocalChanges) return;
  isSyncing = true;
  hasLocalChanges = false;
  showSyncStatus('Синхронизация...');

  const dataToUpload = JSON.stringify(localStore);

  try {
    // Получаем ссылку на загрузку в корень твоего Диска в файл potok-data.json
    const urlRes = await fetch('https://cloud-api.yandex.net/v1/disk/resources/upload?path=disk:/potok-data.json&overwrite=true', {
      headers: { 'Authorization': 'OAuth ' + MY_YANDEX_TOKEN }
    });
    const urlData = await urlRes.json();
    
    if (!urlData.href) throw new Error('Не удалось получить ссылку от Яндекса');

    // Загружаем данные
    await fetch(urlData.href, {
      method: 'PUT',
      body: dataToUpload
    });

    lastSync = Date.now();
    hasLocalChanges = false;
    showSyncStatus('Сохранено в облако', 'success');
  } catch (err) {
    console.error('Yandex Sync error:', err);
    hasLocalChanges = true;
    showSyncStatus('Ошибка сохранения', 'error');
  } finally {
    isSyncing = false;
    if (hasLocalChanges) {
      setTimeout(() => syncToServer(), 1000);
    }
  }
}

async function loadFromServer() {
  if (!MY_YANDEX_TOKEN) return;
  try {
    const urlRes = await fetch('https://cloud-api.yandex.net/v1/disk/resources/download?path=disk:/potok-data.json', {
      headers: { 'Authorization': 'OAuth ' + MY_YANDEX_TOKEN }
    });
    const urlData = await urlRes.json();

    if (urlData.href) {
      // ✦ МАГИЯ: Обращаемся к НАШЕМУ собственному серверу на Vercel
      const proxyUrl = '/api/sync?url=' + encodeURIComponent(urlData.href);
      const dataRes = await fetch(proxyUrl);
      
      const downloadedStore = await dataRes.json();
      
      // Проверяем, что сервер вернул реальные данные, а не ошибку
      if (downloadedStore && !downloadedStore.error) {

	if (hasLocalChanges) {
          console.log('Скачивание отменено: локальные данные новее');
          return;
        }

        localStore = downloadedStore;
        localStorage.setItem('plannerV2', JSON.stringify(localStore));
        hasLocalChanges = false;
        showSyncStatus('Синхронизировано', 'success');
      } else {
        console.error('Ошибка от прокси-сервера:', downloadedStore.error);
      }
    }
  } catch (err) {
    console.error('Критическая ошибка загрузки:', err);
  }
}
// ==================== STATE ====================
let localStore = JSON.parse(localStorage.getItem('plannerV2') || '{}');

function save() {
  localStorage.setItem('plannerV2', JSON.stringify(localStore));
  hasLocalChanges = true;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    if (!isSyncing) syncToServer();
  }, 1500);
}

// ==================== PERIODIC SYNC ====================
function startPeriodicSync() {
  setInterval(() => {
    if (!isSyncing && hasLocalChanges) syncToServer(); 
  }, 30000);

  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      await loadFromServer();
      render();
    }
  });
}

// ==================== CONSTANTS & HELPERS ====================
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const WEEKDAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WEEKDAYS_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

const now = new Date();
const TODAY_Y = now.getFullYear();
const TODAY_M = now.getMonth();
const TODAY_D = now.getDate();

// Граница дня: 4 утра. До 4 утра — вчерашние задачи
const ACTIVE_HOUR = 4;
const _activeDate = now.getHours() < ACTIVE_HOUR
  ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  : now;
const ACT_Y = _activeDate.getFullYear();
const ACT_M = _activeDate.getMonth();
const ACT_D = _activeDate.getDate();

const YEARS = [2025, 2026, 2027];

let view = 'home';
let viewData = {};

let uiState = {
  addingGoal: false,
  editingGoal: -1,
  addingTask: {},
  editingNote: null,
  finTab: 'balance',
  addingWish: false,
};

let clockInterval = null;

function getDays(y, m) { return new Date(y, m+1, 0).getDate(); }

function todayStr() {
  return `${TODAY_Y}-${String(TODAY_M+1).padStart(2,'0')}-${String(TODAY_D).padStart(2,'0')}`;
}

function activeDateStr() {
  return `${ACT_Y}-${String(ACT_M+1).padStart(2,'0')}-${String(ACT_D).padStart(2,'0')}`;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function flipKey(text) {
  return String(text || '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '_').substring(0, 40);
}

function fmtRub(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + '\u00A0₽';
}

function getCalendarDays(y, m) {
  const first = new Date(y, m, 1);
  let startDay = first.getDay();
  if (startDay === 0) startDay = 6; else startDay -= 1;
  const dim = getDays(y, m);
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= dim; d++) days.push(d);
  return days;
}

// ==================== DATA ACCESSORS ====================
function getDayData(y, m, d) {
  const k = `day:${y}-${m}-${d}`;
  if (!localStore[k]) localStore[k] = { tasks: [], summary: '', thoughts: '', mood: 0 };
  if (!localStore[k].mood) localStore[k].mood = 0;

  if (localStore[k].tasks) {
    localStore[k].tasks = localStore[k].tasks.filter(t => t !== null && t !== undefined);
  }
  
  return localStore[k];
}

function sortTasks(tasks) {
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return 0;
  });
}

function getMoodEmoji(val) {
  if (val === 0) return '';
  if (val === 1) return '😫';
  if (val === 2) return '😕';
  if (val === 3) return '😐';
  if (val === 4) return '😊';
  if (val === 5) return '🔥';
  return '';
}

function getMoodColor(val) {
  if (val <= 2) return '#ef4444';
  if (val === 3) return '#eab308';
  if (val === 4) return '#60a5fa';
  if (val === 5) return '#22c55e';
  return 'var(--text-tertiary)';
}

function setMood(y, m, d, val) {
  const dd = getDayData(y, m, d);
  dd.mood = val;
  if (val > 0) addXP(XP_PER_MOOD, 'Настроение', `mood-${y}-${m}-${d}`);
  saveDayData(y, m, d, dd);
}

function saveDayData(y, m, d, data) {
  const k = `day:${y}-${m}-${d}`;
  localStore[k] = data;
  save();
}

function getMonthData(y, m) {
  const k = `month:${y}-${m}`;
  if (!localStore[k]) localStore[k] = { goals: [], notes: '' };
  return localStore[k];
}

function saveMonthData(y, m, data) {
  const k = `month:${y}-${m}`;
  localStore[k] = data;
  save();
}

function getWater() {
  const k = `water:${activeDateStr()}`;
  if (!localStore[k]) localStore[k] = { cups: 0 };
  return localStore[k];
}

function saveWater(v) {
  const k = `water:${activeDateStr()}`;
  localStore[k] = v;
  save();
}

function getFinBalance() { return localStore['fin:balance'] || []; }
function saveFinBalance(v) { localStore['fin:balance'] = v; save(); }

function getFinIncome() { return localStore['fin:income'] || []; }
function saveFinIncome(v) { localStore['fin:income'] = v; save(); }

function getWishlist() { return localStore['wishlist'] || []; }
function saveWishlist(v) { localStore['wishlist'] = v; save(); }

// ==================== ROLLOVER ====================
function doRollover() {
  const yd = new Date(ACT_Y, ACT_M, ACT_D - 1);
  const yk = `day:${yd.getFullYear()}-${yd.getMonth()}-${yd.getDate()}`;
  const prev = localStore[yk];
  const rollKey = `${ACT_Y}-${String(ACT_M+1).padStart(2,'0')}-${String(ACT_D).padStart(2,'0')}`;
  if (prev && prev.tasks && prev._rolledOver !== rollKey) {
    const undone = prev.tasks.filter(t => t && !t.done);
    if (undone.length > 0) {
      const td = getDayData(ACT_Y, ACT_M, ACT_D);
      const existingTexts = new Set(td.tasks.filter(t => t).map(t => t.text));
      undone.forEach(t => {
        if (t && !existingTexts.has(t.text)) td.tasks.push({
          text: t.text, done: false,
          deadline: t.deadline, urgent: t.urgent,
          ideaId: t.ideaId, ideaTaskId: t.ideaTaskId
        });
      });
      saveDayData(ACT_Y, ACT_M, ACT_D, td);
    }
    prev._rolledOver = rollKey;
    localStore[yk] = prev;
    save();
  }
}

// ==================== XP & LEVELS ====================
const XP_PER_TASK = 10;
const XP_PER_WATER_FULL = 15;
const XP_PER_MOOD = 5;
const XP_PER_SLEEP = 10;
const XP_PER_LEVEL = 100;

function showXPToast(amount) {
  const toast = document.getElementById('xpToast');
  const text = document.getElementById('xpToastText');
  if (!toast || !text) return;
  text.textContent = `+${amount} XP`;
  toast.classList.add('show');
  clearTimeout(showXPToast._t);
  showXPToast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

function addXP(amount, reason, actionKey) {
  if (!localStore._xp) localStore._xp = 0;
  if (!localStore._xpLog) localStore._xpLog = {};

  const todayKey = activeDateStr();
  if (!localStore._xpLog[todayKey]) localStore._xpLog[todayKey] = {};

  if (actionKey && localStore._xpLog[todayKey][actionKey]) return false;

  localStore._xp += amount;
  if (actionKey) localStore._xpLog[todayKey][actionKey] = amount;

  const cutoff = new Date(ACT_Y, ACT_M, ACT_D - 30);
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${cutoff.getDate()}`;
  Object.keys(localStore._xpLog).forEach(k => { if (k < cutoffKey) delete localStore._xpLog[k]; });

  save();
  showXPToast(amount);
  return true;
}

function getXP() { return localStore._xp || 0; }
function getLevel() { return Math.floor(getXP() / XP_PER_LEVEL); }
function getXPInLevel() { return getXP() % XP_PER_LEVEL; }
function getXPProgress() { return getXPInLevel(); }
function getLevelBarWidth() { return Math.floor(getXPInLevel() / XP_PER_LEVEL * 100); }

// ==================== STREAKS ====================
function _countStreakFrom(startDate) {
  let streak = 0;
  const d = new Date(startDate);
  for (let i = 0; i < 365; i++) {
    const dd = getDayData(d.getFullYear(), d.getMonth(), d.getDate());
    if (dd.tasks.length === 0) { if (i === 0) { d.setDate(d.getDate()-1); continue; } break; }
    if (!dd.tasks.every(t => t.done)) break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

function getStreak() {
  const todayDone = _countStreakFrom(new Date(ACT_Y, ACT_M, ACT_D));
  if (todayDone > 0) return todayDone;

  const yesterday = new Date(ACT_Y, ACT_M, ACT_D - 1);
  const yd = getDayData(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  if (yd.tasks.length > 0 && yd.tasks.every(t => t.done)) {
    return -_countStreakFrom(yesterday);
  }

  return 0;
}

// ==================== SLEEP ====================
function getSleep(y, m, d) {
  const k = `sleep:${y}-${m}-${d}`;
  if (!localStore[k]) localStore[k] = { bed: '', wake: '', quality: 0 };
  return localStore[k];
}

function saveSleep(y, m, d, data) {
  localStore[`sleep:${y}-${m}-${d}`] = data;
  if (data.bed && data.wake) addXP(XP_PER_SLEEP, 'Сон', `sleep-${y}-${m}-${d}`);
  save();
}

function calcDuration(bed, wake) {
  if (!bed || !wake) return 0;
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  return wakeMin - bedMin;
}

function formatDuration(mins) {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

function getSleepData14() {
  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(ACT_Y, ACT_M, ACT_D - i);
    const s = getSleep(d.getFullYear(), d.getMonth(), d.getDate());
    const dur = calcDuration(s.bed, s.wake);
    result.push({ date: `${d.getDate()}.${d.getMonth()+1}`, mins: dur, quality: s.quality });
  }
  return result;
}

// ==================== DEADLINES ====================
function getAllDeadlines() {
  const results = [];
  Object.keys(localStore).forEach(k => {
    if (!k.startsWith('day:')) return;
    const parts = k.split(':')[1].split('-');
    const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
    const dd = localStore[k];
    if (!dd || !dd.tasks) return;
    dd.tasks.forEach((t, i) => {
      if (t.deadline) {
        results.push({ text: t.text, done: t.done, deadline: t.deadline, urgent: !!t.urgent, dayY: y, dayM: m, dayD: d, taskIdx: i });
      }
    });
  });
  return results.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });
}

function getAllDeadlineDates() {
  const dates = new Set();
  Object.keys(localStore).forEach(k => {
    if (!k.startsWith('day:')) return;
    const dd = localStore[k];
    if (!dd || !dd.tasks) return;
    dd.tasks.forEach(t => {
      if (t.deadline && !t.done) dates.add(t.deadline);
    });
  });
  return dates;
}

function getDayDeadlineCount(y, m, d) {
  const target = `${y}-${m + 1}-${d}`;
  const dates = getAllDeadlineDates();
  return dates.has(target) ? 1 : 0;
}

function daysUntil(dateStr) {
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const target = new Date(dy, dm - 1, dd);
  const today = new Date(ACT_Y, ACT_M, ACT_D);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// ==================== IDEAS ====================
function getIdeas() {
  return localStore['ideas'] || [];
}

function saveIdeas(v) {
  localStore['ideas'] = v;
  save();
}

function getIdeaById(id) {
  return getIdeas().find(p => p.id === id) || null;
}

// ==================== IDEA TASK SCHEDULING ====================
let _ideaTaskIdCounter = Date.now();
function generateIdeaTaskId() { return 'itask_' + (++_ideaTaskIdCounter); }

function getIdeaTasksForDate(dateStr) {
  const results = [];
  getIdeas().forEach(idea => {
    idea.tasks.forEach(task => {
      if (task.scheduledDate === dateStr) {
        results.push({ ...task, ideaId: idea.id, ideaName: idea.name, ideaEmoji: idea.emoji });
      }
    });
  });
  return results;
}

function getDayTasksWithIdeas(y, m, d) {
  const dd = getDayData(y, m, d);
  const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const ideaTasks = getIdeaTasksForDate(dateStr);
  
  // Добавлен фильтр t => t
  const existingTexts = new Set(dd.tasks.filter(t => t).map(t => t.text));

  const virtual = ideaTasks
    .filter(it => it && !existingTexts.has(it.text))
    .map(it => ({
      text: it.text,
      done: it.done,
      urgent: it.urgent,
      deadline: it.scheduledDate,
      ideaId: it.ideaId,
      ideaTaskId: it.id,
      fromIdea: true,
      ideaEmoji: it.ideaEmoji
    }));

  return [...dd.tasks, ...virtual];
}

function toggleTaskDone(y, m, d, taskIndex, fromIdea, ideaTaskId, ideaId) {
  if (fromIdea && ideaId && ideaTaskId) {
    const ideas = getIdeas();
    const idea = ideas.find(p => p.id === ideaId);
    if (idea) {
      const task = idea.tasks.find(t => t.id === ideaTaskId);
      if (task) {
        task.done = !task.done;
        saveIdeas(ideas);
      }
    }
  } else {
    const dd = getDayData(y, m, d);
    if (dd.tasks[taskIndex]) {
      dd.tasks[taskIndex].done = !dd.tasks[taskIndex].done;
      sortTasks(dd.tasks);
      saveDayData(y, m, d, dd);
    }
  }
}

// ==================== FINANCE IDS ====================
let _finId = Date.now();
function nextId() { return ++_finId; }
