// ==================== FINANCE DATA HELPERS ====================
// Временные функции-помощники, пока мы не перенесем их в state.js
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

const FIN_CATEGORIES = {
  income: [
    { name: 'Заработок', icon: '💼' },
    { name: 'Переводы', icon: '💳' },
    { name: 'Проекты', icon: '🚀' }
  ],
  expense: [
    { name: 'Еда', icon: '🍔' },
    { name: 'Подписки', icon: '📱' },
    { name: 'Транспорт', icon: '🚕' },
    { name: 'Развлечения', icon: '🍿' },
    { name: 'Прочее', icon: '🛒' }
  ]
};

// ==================== FINANCE PAGE ====================
function buildFinancePage() {
  const tab = uiState.finTab || 'summary';
  const txs = getTransactions();
  const wish = getWishlist();
  
  const balance = getFinBalanceNum();
  
  // Расчет вишлиста
  const wishTotal = wish.filter(w => !w.done).reduce((s, w) => s + w.price, 0);
  let wishProgress = 0;
  if (wishTotal > 0 && balance > 0) {
    wishProgress = Math.min(Math.round((balance / wishTotal) * 100), 100);
  }

  const tabs = `<div class="nav-tabs" style="margin-bottom: 16px;">
    <button class="nav-tab ${tab==='summary'?'active':''}" onclick="setFinTab('summary')">Сводка</button>
    <button class="nav-tab ${tab==='wishlist'?'active':''}" onclick="setFinTab('wishlist')">Вишлист</button>
  </div>`;

  let content = '';

  if (tab === 'summary') {
    // 1. Блок Баланса и Вишлиста
    const balanceHTML = `
      <div class="fin-balance-block">
        <div class="fin-balance-label">Баланс</div>
        <div class="fin-balance-amount">${fmtRub(balance)}</div>
        
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

    // 2. Блок добавления (Доход / Расход)
    let actionHTML = '';
    if (uiState.addingTx) {
      const type = uiState.addingTx; // 'income' или 'expense'
      const cats = FIN_CATEGORIES[type];
      const catBtns = cats.map(c => 
        `<button class="fin-cat-btn ${uiState.selectedCat === c.name ? 'active' : ''}" 
                 onclick="selectFinCat('${c.name}')">${c.icon} ${c.name}</button>`
      ).join('');

      actionHTML = `
        <div class="fin-add-form section-card">
          <div class="section-eyebrow" style="margin-bottom:12px">${type === 'income' ? '🟢 Добавить доход' : '🔴 Добавить расход'}</div>
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

    // 3. Лента операций
    let txHTML = txs.slice().reverse().slice(0, 30).map(t => {
      const isInc = t.type === 'income';
      const catObj = FIN_CATEGORIES[t.type].find(c => c.name === t.category);
      const icon = catObj ? catObj.icon : (isInc ? '💰' : '💸');
      
      return `
      <div class="tx-item">
        <div class="tx-icon">${icon}</div>
        <div class="tx-info">
          <div class="tx-cat">${esc(t.category)}</div>
          <div class="tx-note">${esc(t.note) || t.date}</div>
        </div>
        <div class="tx-amount ${isInc ? 'income' : 'expense'}">${isInc ? '+' : '-'}${fmtRub(t.amount)}</div>
        <button class="entry-del" onclick="deleteTx(${t.id})">×</button>
      </div>`;
    }).join('') || `<div class="empty-state">Нет операций</div>`;

    content = `
      ${balanceHTML}
      ${actionHTML}
      <div class="section-eyebrow" style="margin: 24px 0 12px 0;">Последние операции</div>
      <div class="tx-list">${txHTML}</div>
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
      <div class="section-card" style="max-width:700px; background: transparent; padding: 0;">
        <div class="wish-list">${wishItems}</div>
        ${addWish}
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
    id: nextId(),
    type: type,
    category: uiState.selectedCat,
    amount: amt,
    note: noteEl ? noteEl.value.trim() : '',
    date: todayStr()
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