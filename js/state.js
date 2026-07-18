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
const MONTHS_SHORT = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Нояб', 'Дек'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WEEKDAYS_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

// ==================== ICONS (SVG) ====================
const ICONS = {
  wallet: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:6px"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>',
  trendingUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6BE3A4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:6px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
  sparkles: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:6px"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>',
  lightbulb: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin-right:8px"><path d="M9 21h6"></path><path d="M12 22v-1"></path><path d="M12 15a5 5 0 1 0-5-5c0 2 1.5 3 2 4v2h6v-2c.5-1 2-2 2-4a5 5 0 1 0-5-5z"></path></svg>',
  refresh: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin-right:8px"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
  fire: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
  waterFull: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#60A5FA" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
  waterEmpty: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
  moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  sun: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
  palette: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"></circle><circle cx="19" cy="10" r="2"></circle><circle cx="16" cy="18" r="2"></circle><circle cx="8" cy="18" r="2"></circle><circle cx="5" cy="10" r="2"></circle></svg>',
  task: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6BE3A4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  mood1: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin: 0 4px;"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>',
  mood2: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin: 0 4px;"><circle cx="12" cy="12" r="10"></circle><path d="M8 16l8-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>',
  mood3: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin: 0 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>',
  mood4: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin: 0 4px;"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>',
  mood5: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px; margin: 0 4px;"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><path d="M9 9l-1-1m0 0l-1 1m1-1v2m6-2l-1-1m0 0l-1 1m1-1v2"></path></svg>',
  lightning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  hourglass: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:6px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:6px"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px; margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  rocket: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>',
  code: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
  briefcase: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
  book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  video: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
  monitor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
  music: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
  heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
  activity: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
  globe: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
  tool: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
  megaphone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"></polygon><path d="M22 16.7A8 8 0 0 0 22 7.3"></path><path d="M19 14.1a5 5 0 0 0 0-4.2"></path></svg>',
  shopping: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
  star: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  coffee: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
  cpu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  pen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>',
  arrowRight: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; transition: 0.2s;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
};

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
  finTab: 'summary',
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
  return ICONS['mood' + val] || '';
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
// ==================== HABITS ====================
function getHabits() { return localStore['habits'] || []; }
function saveHabits(v) { localStore['habits'] = v; save(); }