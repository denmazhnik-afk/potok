// ==================== FLIP ANIMATION ====================
let _flipBefore = {};

function captureFlipPositions() {
  _flipBefore = {};
  document.querySelectorAll('[data-flip-id]').forEach(el => {
    const rect = el.getBoundingClientRect();
    _flipBefore[el.getAttribute('data-flip-id')] = { top: rect.top, left: rect.left, h: rect.height };
  });
}

function applyFlipAnimation() {
  document.querySelectorAll('[data-flip-id]').forEach(el => {
    const key = el.getAttribute('data-flip-id');
    const prev = _flipBefore[key];
    if (!prev) return;
    const rect = el.getBoundingClientRect();
    const dy = prev.top - rect.top;
    if (Math.abs(dy) < 2) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;
    el.offsetHeight; // force reflow
    el.style.transition = 'transform 0.3s cubic-bezier(0.22,1,0.36,1)';
    el.style.transform = '';
    el.addEventListener('transitionend', function handler() {
      el.style.transition = '';
      el.style.transform = '';
      el.removeEventListener('transitionend', handler);
    });
  });
}

// ==================== RENDER ENGINE ====================
function render() {
  const app = document.getElementById('app');
  captureFlipPositions();
  app.innerHTML = buildHTML();
  bindEvents();
  afterRender();
  applyFlipAnimation();
}

function buildHTML() {
  const headerHTML = `
    <div class="dash-header">
      <div class="dash-title">✦ Поток</div>
      <div class="dash-clock" id="clock">${buildClock()}</div>
    </div>`;

  if (view === 'home') return headerHTML + buildHome();
  if (view === 'day') return headerHTML + buildDayPage();
  if (view === 'plan') return headerHTML + buildPlanPage();
  if (view === 'month-detail') return headerHTML + buildMonthDetail();
  if (view === 'finance') return headerHTML + buildFinancePage();
  if (view === 'deadlines') return headerHTML + buildDeadlinesPage();
  if (view === 'ideas') return headerHTML + buildIdeasPage();
  if (view === 'idea-detail') return headerHTML + buildIdeaDetail();
  if (view === 'sleep') return headerHTML + buildSleepPage();
  return headerHTML + buildHome();
}

function buildClock() {
  const n = new Date();
  const h = String(n.getHours()).padStart(2,'0');
  const mi = String(n.getMinutes()).padStart(2,'0');
  const s = String(n.getSeconds()).padStart(2,'0');
  return `${h}:${mi}:${s}`;
}

// ==================== AFTER RENDER ====================
function afterRender() {
  startClock();

  if (view === 'home') {
    drawSparkline('homeSparkline', getFinBalance().slice(-10).map(e => e.amount), '#60A5FA');
  }

  if (view === 'day') {
    startTicker();
  }

  if (view === 'sleep') {
    drawSleepChart('sleepPageChart', getSleepData14());
  }

  if (view === 'plan') {
    const curCard = document.getElementById('currentMonthCard');
    if (curCard && !viewData._scrolledToCurrent) {
      setTimeout(() => {
        curCard.scrollIntoView({ behavior: 'auto', block: 'center' });
        curCard.style.transition = 'box-shadow 0.3s';
        curCard.style.boxShadow = '0 0 30px rgba(107,227,164,0.35)';
        setTimeout(() => { curCard.style.boxShadow = ''; }, 1500);
        viewData._scrolledToCurrent = true;
      }, 50);
    }
  }

  if (view === 'finance') {
    const tab = uiState.finTab;
    if (tab === 'balance') {
      drawChart('balChart', getFinBalance().slice(-20), 'amount', '#60A5FA', '₽');
    }
    if (tab === 'income') {
      drawIncomeChart();
    }
  }

  if (view === 'month-detail' && viewData.y === ACT_Y && viewData.m === ACT_M && !viewData.scrolled) {
    setTimeout(() => {
      scrollToDay(ACT_D);
      viewData.scrolled = true;
    }, 100);
  }

  const inputs = ['newGoalInp','goalEditInp','balAmtIn','incAmtIn','wishNameIn','ideaTaskInp'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.focus();
  });

  Object.keys(uiState.addingTask).forEach(k => {
    const id = k === 'today' ? 'dayTaskInput' : `mTaskIn-${k.replace('month-','')}`;
    const el = document.getElementById(id);
    if (el) el.focus();
  });

  if (uiState.editingNote) {
    const ta = document.getElementById('noteTA-' + uiState.editingNote);
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }
}

// ==================== CLOCK ====================
function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    const el = document.getElementById('clock');
    if (el) el.textContent = buildClock();
    else clearInterval(clockInterval);
  }, 1000);
}

// ==================== NAVIGATION ====================
function goHome() {
  view = 'home'; viewData = {};
  resetUI(); render();
}

function openDay() {
  view = 'day'; viewData = {};
  resetUI(); render();
}

function openPlan() {
  view = 'plan'; viewData = {};
  resetUI(); render();
}

function openMonthDetail(y, m) {
  view = 'month-detail'; viewData = { y, m, scrolled: false };
  resetUI(); render();
}

function openFinance() {
  view = 'finance'; viewData = {};
  resetUI(); render();
}

function openSleep() {
  view = 'sleep'; viewData = {};
  sleepViewOffset = 0;
  resetUI(); render();
}

function openDeadlines() {
  view = 'deadlines'; viewData = {};
  resetUI(); render();
}

function openIdeas() {
  view = 'ideas'; viewData = {};
  resetUI(); render();
}

function openIdeaDetail(id) {
  view = 'idea-detail'; viewData = { id };
  resetUI(); render();
}

function resetUI() {
  uiState = { addingGoal:false, editingGoal:-1, addingTask:{}, editingNote:null, finTab: uiState.finTab||'balance', addingWish:false, ideaDoneExpanded: null };
}

// ==================== SCROLL TO TOP ====================
let scrollTopListening = false;

function initScrollTop() {
  if (scrollTopListening) return;
  scrollTopListening = true;
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
}

// ==================== TOUCH DRAG & DROP ====================
let _touchDrag = { active: false, el: null, idx: null, id: null, type: null, startY: 0, clone: null, targetIdx: null, scrollTimer: null };

function initTouchDrag() {
  if (window._touchDragInited) return;
  window._touchDragInited = true;

  document.addEventListener('touchstart', touchDragStart, { passive: false });
  document.addEventListener('touchmove', touchDragMove, { passive: false });
  document.addEventListener('touchend', touchDragEnd, { passive: false });
}

function touchDragStart(e) {
  const handle = e.target.closest('.task-drag');
  if (!handle) return;

  const item = handle.closest('.task-item, .day-task-mini');
  if (!item) return;

  e.preventDefault();
  const touch = e.touches[0];

  // Determine what kind of list this is
  let type = 'day';
  let dragId = null;
  if (item.closest('.idea-tasks-list')) {
    type = 'idea';
    dragId = viewData.id;
  } else if (item.closest('.panel-day .day-tasks-col')) {
    type = 'home';
  } else if (item.closest('.day-card .task-list')) {
    type = 'month';
    const card = item.closest('.day-card');
    if (card && card.id) dragId = card.id.replace('dc-', '');
  }

  _touchDrag.active = true;
  _touchDrag.el = item;
  _touchDrag.idx = parseInt(item.getAttribute('data-idx'));
  _touchDrag.id = dragId;
  _touchDrag.type = type;
  _touchDrag.startY = touch.clientY;
  _touchDrag.targetIdx = null;

  // Create floating clone
  const rect = item.getBoundingClientRect();
  const clone = item.cloneNode(true);
  clone.style.cssText = `
    position: fixed; z-index: 9999; pointer-events: none;
    width: ${rect.width}px; opacity: 0.85;
    box-shadow: 0 8px 30px rgba(107,227,164,0.3);
    border: 1px solid rgba(107,227,164,0.4);
    border-radius: 10px; transition: none;
    left: ${rect.left}px; top: ${rect.top}px;
  `;
  document.body.appendChild(clone);
  _touchDrag.clone = clone;
  item.style.opacity = '0.3';
}

function touchDragMove(e) {
  if (!_touchDrag.active || !_touchDrag.clone) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = _touchDrag.el.getBoundingClientRect();
  _touchDrag.clone.style.top = (touch.clientY - rect.height / 2) + 'px';

  // Hide clone to find element underneath
  _touchDrag.clone.style.display = 'none';
  const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  _touchDrag.clone.style.display = '';

  // Clear old highlights
  document.querySelectorAll('.touch-drag-over').forEach(el => el.classList.remove('touch-drag-over'));
  _touchDrag.targetIdx = null;

  if (!elBelow) return;
  const target = elBelow.closest('.task-item, .day-task-mini');
  if (!target || target === _touchDrag.el) return;

  const tIdx = parseInt(target.getAttribute('data-idx'));
  if (isNaN(tIdx)) return;
  _touchDrag.targetIdx = tIdx;
  target.classList.add('touch-drag-over');
}

function touchDragEnd(e) {
  if (!_touchDrag.active) return;

  document.querySelectorAll('.touch-drag-over').forEach(el => el.classList.remove('touch-drag-over'));

  if (_touchDrag.clone) {
    _touchDrag.clone.remove();
    _touchDrag.clone = null;
  }
  if (_touchDrag.el) {
    _touchDrag.el.style.opacity = '';
  }

  if (_touchDrag.targetIdx !== null && _touchDrag.targetIdx !== _touchDrag.idx) {
    const fromIdx = _touchDrag.idx;
    const toIdx = _touchDrag.targetIdx;
    const type = _touchDrag.type;

    if (type === 'home' || type === 'day') {
      const td = getDayData(ACT_Y, ACT_M, ACT_D);
      const [item] = td.tasks.splice(fromIdx, 1);
      td.tasks.splice(toIdx, 0, item);
      saveDayData(ACT_Y, ACT_M, ACT_D, td);
      render();
    } else if (type === 'month') {
      const { y, m } = viewData;
      const dayNum = parseInt(_touchDrag.id);
      const dd = getDayData(y, m, dayNum);
      const [item] = dd.tasks.splice(fromIdx, 1);
      dd.tasks.splice(toIdx, 0, item);
      saveDayData(y, m, dayNum, dd);
      render();
    } else if (type === 'idea') {
      const ideas = getIdeas();
      const idea = ideas.find(p => p.id === _touchDrag.id);
      if (idea) {
        const [item] = idea.tasks.splice(fromIdx, 1);
        idea.tasks.splice(toIdx, 0, item);
        saveIdeas(ideas);
        render();
      }
    }
  }

  _touchDrag = { active: false, el: null, idx: null, id: null, type: null, startY: 0, clone: null, targetIdx: null, scrollTimer: null };
}

// ==================== SCROLL ====================
function scrollToDay(d) {
  const el = document.getElementById(`dc-${d}`) || document.getElementById(`day-card-${d}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'box-shadow 0.3s';
    el.style.boxShadow = '0 0 30px rgba(107,227,164,0.35)';
    setTimeout(() => { el.style.boxShadow = ''; }, 1600);
  }
}

// ==================== BIND EVENTS ====================
function bindEvents() {
  const bindings = [
    ['dayTaskInput', quickAddDayTask],
    ['newGoalInp', confirmAddGoal],
    ['balAmtIn', null],
    ['incAmtIn', null],
    ['dlTaskInput', addDeadlineTask],
  ];

  bindings.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el && fn) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
  });

  const gei = document.getElementById('goalEditInp');
  if (gei) {
    gei.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveGoalEdit(uiState.editingGoal);
      if (e.key === 'Escape') cancelGoalEdit();
    });
  }

  Object.keys(uiState.addingTask).forEach(k => {
    if (k.startsWith('month-')) {
      const d = parseInt(k.replace('month-',''));
      const el = document.getElementById(`mTaskIn-${d}`);
      if (el) el.addEventListener('keydown', e => {
        if (e.key === 'Enter') confirmMonthTask(d);
        if (e.key === 'Escape') cancelMonthTask(d);
      });
    }
  });

  if (uiState.editingNote) {
    const ta = document.getElementById('noteTA-' + uiState.editingNote);
    if (ta) ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote(uiState.editingNote);
      if (e.key === 'Escape') cancelNote();
    });
  }

  const balIn = document.getElementById('balAmtIn');
  if (balIn) balIn.addEventListener('keydown', e => { if (e.key === 'Enter') addBalance(); });
  const incIn = document.getElementById('incAmtIn');
  if (incIn) incIn.addEventListener('keydown', e => { if (e.key === 'Enter') addIncome(); });

  const wishIn = document.getElementById('wishNameIn');
  if (wishIn) wishIn.addEventListener('keydown', e => { if (e.key === 'Enter') confirmAddWish(); });

  const ideaIn = document.getElementById('ideaTaskInp');
  if (ideaIn) ideaIn.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const id = viewData.id;
      if (id) addIdeaTask(id);
    }
  });
}

// ==================== INIT ====================
async function init() {
  console.log('🚀 Initializing...');
  await loadFromSupabase();
  doRollover();
  initScrollTop();
  initTouchDrag();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
