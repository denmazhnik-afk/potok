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
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
