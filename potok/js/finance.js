// ==================== FINANCE PAGE ====================
function buildFinancePage() {
  const bal = getFinBalance();
  const inc = getFinIncome();
  const wish = getWishlist();
  const tab = uiState.finTab;

  const lastBal = bal.length > 0 ? bal[bal.length-1].amount : 0;
  const totalInc = inc.reduce((s,e) => s + e.amount, 0);

  const tabs = `<div class="nav-tabs">
    <button class="nav-tab ${tab==='balance'?'active':''}" onclick="setFinTab('balance')">💰 Баланс</button>
    <button class="nav-tab ${tab==='income'?'active':''}" onclick="setFinTab('income')">📈 Доходы</button>
    <button class="nav-tab ${tab==='wishlist'?'active':''}" onclick="setFinTab('wishlist')">✨ Вишлист</button>
  </div>`;

  let content = '';

  if (tab === 'balance') {
    let entries = bal.slice().reverse().slice(0, 15).map(e => `
      <div class="finance-entry">
        <div class="entry-date">${e.date}</div>
        <div class="entry-src">${esc(e.note||'Баланс')}</div>
        <div class="entry-amount balance">${fmtRub(e.amount)}</div>
        <button class="entry-del" onclick="deleteBalance(${e.id})">×</button>
      </div>`).join('') || `<div class="empty-state">Нет записей</div>`;

    content = `
      <div class="finance-layout">
        <div class="section-card">
          <div class="section-eyebrow">Текущий баланс</div>
          <div style="font-family:var(--mono);font-size:36px;font-weight:800;color:var(--blue);letter-spacing:-0.03em;margin-bottom:20px">
            ${lastBal > 0 ? fmtRub(lastBal) : '—'}
          </div>
          <canvas id="balChart" class="chart-canvas" height="160"></canvas>
          <div style="margin-top:20px">
            <div class="section-eyebrow">Записать баланс сегодня</div>
            <div class="add-row" style="margin-top:8px">
              <input class="add-input" id="balAmtIn" type="number" placeholder="Сумма (₽)">
              <input class="add-input" id="balNoteIn" placeholder="Заметка">
              <button class="btn-primary" onclick="addBalance()">Записать</button>
            </div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-eyebrow">История</div>
          <div class="finance-entry-list">${entries}</div>
        </div>
      </div>`;
  }

  if (tab === 'income') {
    let entries = inc.slice().reverse().slice(0, 20).map(e => `
      <div class="finance-entry">
        <div class="entry-date">${e.date}</div>
        <div class="entry-src">${esc(e.source||'Источник')}</div>
        <div class="entry-amount income">+${fmtRub(e.amount)}</div>
        <button class="entry-del" onclick="deleteIncome(${e.id})">×</button>
      </div>`).join('') || `<div class="empty-state">Нет доходов</div>`;

    content = `
      <div class="finance-layout">
        <div class="section-card">
          <div class="section-eyebrow">Всего заработано</div>
          <div style="font-family:var(--mono);font-size:36px;font-weight:800;color:var(--green);letter-spacing:-0.03em;margin-bottom:20px">
            ${totalInc > 0 ? '+' + fmtRub(totalInc) : '—'}
          </div>
          <canvas id="incChart" class="chart-canvas" height="160"></canvas>
          <div style="margin-top:20px">
            <div class="section-eyebrow">Добавить доход</div>
            <div class="add-row" style="margin-top:8px;flex-wrap:wrap">
              <input class="add-input" id="incAmtIn" type="number" placeholder="Сумма (₽)">
              <input class="add-input" id="incSrcIn" placeholder="Источник (фриланс, зарплата...)">
              <button class="btn-primary" onclick="addIncome()">+ Добавить</button>
            </div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-eyebrow">История доходов</div>
          <div class="finance-entry-list">${entries}</div>
        </div>
      </div>`;
  }

  if (tab === 'wishlist') {
    let wishItems = wish.map((w, i) => `
      <div class="wish-item">
        <div class="wish-emoji">${esc(w.emoji||'🎁')}</div>
        <div class="wish-name">${esc(w.name)}</div>
        <div class="wish-price">${fmtRub(w.price)}</div>
        <button class="wish-del" onclick="deleteWish(${i})">×</button>
      </div>`).join('') || `<div class="empty-state">Список желаний пуст</div>`;

    const addWish = uiState.addingWish
      ? `<div class="add-row" style="flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <input class="add-input" id="wishEmoIn" placeholder="Emoji" style="max-width:60px">
          <input class="add-input" id="wishNameIn" placeholder="Название желания" style="flex:2">
          <input class="add-input" id="wishPriceIn" type="number" placeholder="Цена (₽)">
          <button class="btn-primary" onclick="confirmAddWish()">Добавить</button>
          <button class="btn-secondary" onclick="cancelAddWish()">✕</button>
        </div>`
      : `<button class="btn-secondary" style="width:100%;margin-top:14px" onclick="startAddWish()">+ Добавить желание</button>`;

    content = `
      <div class="section-card" style="max-width:700px">
        <div class="section-eyebrow" style="margin-bottom:14px">✨ Вишлист</div>
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
  uiState.finTab = t; render();
}

function addBalance() {
  const amtEl = document.getElementById('balAmtIn');
  const noteEl = document.getElementById('balNoteIn');
  const amt = parseFloat(amtEl ? amtEl.value : 0);
  if (!amt || isNaN(amt)) return;
  const bal = getFinBalance();
  bal.push({ id: nextId(), date: todayStr(), amount: amt, note: noteEl ? noteEl.value.trim() : '' });
  saveFinBalance(bal);
  render();
}

function deleteBalance(id) {
  const bal = getFinBalance().filter(e => e.id !== id);
  saveFinBalance(bal);
  render();
}

function addIncome() {
  const amtEl = document.getElementById('incAmtIn');
  const srcEl = document.getElementById('incSrcIn');
  const amt = parseFloat(amtEl ? amtEl.value : 0);
  if (!amt || isNaN(amt)) return;
  const inc = getFinIncome();
  inc.push({ id: nextId(), date: todayStr(), amount: amt, source: srcEl ? srcEl.value.trim() : '' });
  saveFinIncome(inc);
  render();
}

function deleteIncome(id) {
  const inc = getFinIncome().filter(e => e.id !== id);
  saveFinIncome(inc);
  render();
}

// ==================== WISHLIST ====================
function startAddWish() { uiState.addingWish = true; render(); }
function cancelAddWish() { uiState.addingWish = false; render(); }

function confirmAddWish() {
  const emo = document.getElementById('wishEmoIn');
  const name = document.getElementById('wishNameIn');
  const price = document.getElementById('wishPriceIn');
  const n = name ? name.value.trim() : '';
  if (!n) return;
  const wish = getWishlist();
  wish.push({ emoji: emo ? emo.value.trim() || '🎁' : '🎁', name: n, price: parseFloat(price ? price.value : 0) || 0 });
  saveWishlist(wish);
  uiState.addingWish = false;
  render();
}

function deleteWish(i) {
  const wish = getWishlist();
  wish.splice(i, 1);
  saveWishlist(wish);
  render();
}
