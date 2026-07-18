// ==================== FINANCE DATA HELPERS ====================
function getTransactions() {
  return JSON.parse(localStorage.getItem('flow_transactions') || '[]');
}
function saveTransactions(arr) {
  localStorage.setItem('flow_transactions', JSON.stringify(arr));
}
function getFinBalanceNum() {
  const txs = getTransactions();
  return txs.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
}

// Генератор красивых тонких иконок
const svgIcon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const FIN_CATEGORIES = {
  income: [
    { name: 'Заработок', icon: svgIcon('<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>') },
    { name: 'Переводы', icon: svgIcon('<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>') },
    { name: 'Проекты', icon: svgIcon('<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>') }
  ],
  expense: [
    { name: 'Еда', icon: svgIcon('<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1"></path>') },
    { name: 'Подписки', icon: svgIcon('<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>') },
    { name: 'Транспорт', icon: svgIcon('<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle>') },
    { name: 'Развлечения', icon: svgIcon('<polygon points="5 3 19 12 5 21 5 3"></polygon>') },
    { name: 'Прочее', icon: svgIcon('<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>') },
    { name: 'Корректировка', icon: svgIcon('<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>') }
  ]
};
// ==================== NAVIGATION INTERCEPTOR ====================
// Принудительно открываем Сводку при клике с главной страницы
window.openFinance = function() {
  uiState.finTab = 'summary';
  uiState.addingTx = null;
  navTo('finance');
};

// ==================== FINANCE DATA HELPERS ====================
// ==================== FINANCE PAGE ====================
function buildFinancePage() {
  const tab = uiState.finTab || 'summary';
  const txs = getTransactions();
  const wish = getWishlist();
  const balance = getFinBalanceNum();
  
  const wishTotal = wish.filter(w => !w.done).reduce((s, w) => s + w.price, 0);
  let wishProgress = 0;
  if (wishTotal > 0 && balance > 0) {
    wishProgress = Math.min(Math.round((balance / wishTotal) * 100), 100);
  }

  const tabs = `<div class="nav-tabs" style="margin-bottom: 24px;">
    <button class="nav-tab ${tab==='summary'?'active':''}" onclick="setFinTab('summary')">Сводка</button>
    <button class="nav-tab ${tab==='wishlist'?'active':''}" onclick="setFinTab('wishlist')">Вишлист</button>
  </div>`;

  let content = '';

  if (tab === 'summary') {
    const balanceHTML = `
      <div class="fin-balance-block">
        <div class="fin-balance-label">Текущий баланс</div>
        <div class="fin-balance-amount">${fmtRub(balance)}</div>
        <button class="set-balance-btn" onclick="setExactBalance()">
          ${svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>')} Изменить
        </button>
        
        <div class="fin-wish-widget" onclick="setFinTab('wishlist')">
          <div class="fin-wish-widget-top">
            <span>Цели: ${fmtRub(wishTotal)}</span>
            <span style="color: var(--text-primary); font-weight: 700;">Накоплено ${wishProgress}%</span>
          </div>
          <div class="fin-wish-track">
            <div class="fin-wish-fill" style="width: ${wishProgress}%"></div>
          </div>
        </div>
      </div>
    `;

    let actionHTML = '';
    if (uiState.addingTx) {
      const type = uiState.addingTx; 
      const cats = FIN_CATEGORIES[type].filter(c => c.name !== 'Корректировка');
      const catBtns = cats.map(c => 
        `<button class="fin-cat-btn ${uiState.selectedCat === c.name ? 'active' : ''}" 
                 onclick="selectFinCat('${c.name}')"><span class="cat-icon-wrap">${c.icon}</span> ${c.name}</button>`
      ).join('');

      actionHTML = `
        <div class="fin-add-form section-card" style="margin-bottom: 24px;">
          <div class="section-eyebrow" style="margin-bottom:12px">${type === 'income' ? 'Добавить доход' : 'Добавить расход'}</div>
          <div class="fin-cat-list">${catBtns}</div>
          <input class="add-input" id="txAmtIn" type="number" placeholder="Сумма (₽)" autofocus style="margin-bottom:8px">
          <input class="add-input" id="txNoteIn" placeholder="Комментарий (необязательно)" style="margin-bottom:12px">
          <div style="display:flex; gap:8px">
            <button class="btn-primary" style="flex:1" onclick="confirmAddTx('${type}')">Сохранить</button>
            <button class="btn-secondary" onclick="cancelAddTx()">Отмена</button>
          </div>
        </div>
      `;
    } else {
      actionHTML = `
        <div class="fin-action-row">
          <button class="fin-action-btn income" onclick="startAddTx('income')">+ Доход</button>
          <button class="fin-action-btn expense" onclick="startAddTx('expense')">- Расход</button>
        </div>
      `;
    }

    let txHTML = txs.slice().reverse().slice(0, 30).map(t => {
      const isInc = t.type === 'income';
      const catObj = FIN_CATEGORIES[t.type].find(c => c.name === t.category) || FIN_CATEGORIES[t.type][0];
      
      return `
      <div class="tx-item">
        <div class="tx-icon">${catObj.icon}</div>
        <div class="tx-info">
          <div class="tx-cat">${esc(t.category)}</div>
          <div class="tx-note">${esc(t.note) || t.date}</div>
        </div>
        <div class="tx-amount ${isInc ? 'income' : 'expense'}">${isInc ? '+' : '-'}${fmtRub(t.amount)}</div>
        <button class="entry-del" onclick="deleteTx(${t.id})">×</button>
      </div>`;
    }).join('') || `<div class="empty-state">Нет операций</div>`;

    content = `
      <div class="fin-desktop-grid">
        <div class="fin-col-left">
          ${balanceHTML}
          ${actionHTML}
        </div>
        <div class="fin-col-right">
          <div class="section-eyebrow" style="margin-bottom: 12px;">Последние операции</div>
          <div class="tx-list">${txHTML}</div>
        </div>
      </div>
    `;
  }

  if (tab === 'wishlist') {
    let wishItems = wish.map((w, i) => `
      <div class="wish-item ${w.done ? 'done' : ''}">
        <div class="wish-emoji">${esc(w.emoji||'🎁')}</div>
        <div class="wish-info">
          <div class="wish-name">${esc(w.name)}</div>
          <div class="wish-price">${fmtRub(w.price)}</div>
        </div>
        <button class="entry-del" onclick="deleteWish(${i})" style="opacity:1">×</button>
      </div>`).join('') || `<div class="empty-state">Список желаний пуст</div>`;

    const addWish = uiState.addingWish
      ? `<div class="add-row" style="flex-wrap:wrap;margin-top:14px;padding-top:14px;">
          <input class="add-input" id="wishEmoIn" placeholder="Emoji" style="max-width:60px">
          <input class="add-input" id="wishNameIn" placeholder="Название желания" style="flex:2">
          <input class="add-input" id="wishPriceIn" type="number" placeholder="Цена (₽)">
          <button class="btn-primary" onclick="confirmAddWish()">Добавить</button>
          <button class="btn-secondary" onclick="cancelAddWish()">✕</button>
        </div>`
      : `<button class="btn-primary" style="width:100%;margin-top:14px" onclick="startAddWish()">+ Добавить желание</button>`;

    content = `
      <div class="fin-desktop-grid">
        <div class="fin-col-center">
          <div class="section-card" style="background: transparent; padding: 0; box-shadow: none;">
            <div class="wish-list">${wishItems}</div>
            ${addWish}
          </div>
        </div>
      </div>`;
  }

  return `
  <div class="page-header">
    <button class="back-btn" onclick="goHome()">← Назад</button>
    <h2 class="page-heading">Финансы</h2>
  </div>
  ${tabs}
  ${content}`;
}

// ==================== FINANCE HANDLERS ====================
function setFinTab(t) {
  uiState.finTab = t; 
  uiState.addingTx = null;
  render();
}

// Установка баланса вручную
function setExactBalance() {
  const currentBal = getFinBalanceNum();
  let newBal = prompt('Введите фактический баланс на счетах (₽):', currentBal);
  if (newBal === null) return;
  newBal = parseFloat(newBal);
  if (isNaN(newBal)) return;
  
  const diff = newBal - currentBal;
  if (diff === 0) return;
  
  const txs = getTransactions();
  txs.push({
    id: nextId ? nextId() : Date.now(),
    type: diff > 0 ? 'income' : 'expense',
    category: 'Корректировка',
    amount: Math.abs(diff),
    note: 'Синхронизация баланса',
    date: typeof todayStr === 'function' ? todayStr() : new Date().toISOString().split('T')[0]
  });
  
  saveTransactions(txs);
  render();
}

function startAddTx(type) {
  uiState.addingTx = type;
  uiState.selectedCat = FIN_CATEGORIES[type][0].name;
  render();
}

function cancelAddTx() {
  uiState.addingTx = null;
  render();
}

function selectFinCat(cat) {
  uiState.selectedCat = cat;
  render();
}

function confirmAddTx(type) {
  const amtEl = document.getElementById('txAmtIn');
  const noteEl = document.getElementById('txNoteIn');
  const amt = parseFloat(amtEl ? amtEl.value : 0);
  if (!amt || isNaN(amt)) return;
  
  const txs = getTransactions();
  txs.push({
    id: nextId ? nextId() : Date.now(),
    type: type,
    category: uiState.selectedCat,
    amount: amt,
    note: noteEl ? noteEl.value.trim() : '',
    date: typeof todayStr === 'function' ? todayStr() : new Date().toISOString().split('T')[0]
  });
  
  saveTransactions(txs);
  uiState.addingTx = null;
  render();
}

function deleteTx(id) {
  if(!confirm('Удалить операцию?')) return;
  const txs = getTransactions().filter(e => e.id !== id);
  saveTransactions(txs);
  render();
}

// ==================== WISHLIST HANDLERS ====================
function startAddWish() { uiState.addingWish = true; render(); }
function cancelAddWish() { uiState.addingWish = false; render(); }

function confirmAddWish() {
  const emo = document.getElementById('wishEmoIn');
  const name = document.getElementById('wishNameIn');
  const price = document.getElementById('wishPriceIn');
  const n = name ? name.value.trim() : '';
  if (!n) return;
  const wish = getWishlist();
  wish.push({ 
    emoji: emo ? emo.value.trim() || '🎁' : '🎁', 
    name: n, 
    price: parseFloat(price ? price.value : 0) || 0,
    done: false
  });
  saveWishlist(wish);
  uiState.addingWish = false;
  render();
}

function deleteWish(i) {
  if(!confirm('Удалить желание?')) return;
  const wish = getWishlist();
  wish.splice(i, 1);
  saveWishlist(wish);
  render();
}