// --- APP STATE & LOCALSTORAGE ---
const DEFAULT_CONFIG = {
  monthlySalary: 85000,
  fixedExpenses: 32000,
  savingsTarget: 15000,
  autoRollover: true
};

let config = JSON.parse(localStorage.getItem('mmp_config')) || DEFAULT_CONFIG;
let transactions = JSON.parse(localStorage.getItem('mmp_txs')) || [
  { id: 'tx-1', title: 'Morning Coffee & Snack', amount: 80, category: 'Food', mode: 'UPI', date: getTodayFormattedDate(), time: '08:30 AM', note: 'Cafe' },
  { id: 'tx-2', title: 'Cab to Office', amount: 150, category: 'Transport', mode: 'Cash', date: getTodayFormattedDate(), time: '09:15 AM', note: 'Commute' }
];

let filterMode = 'ALL';
let categoryChartInstance = null;
let modeChartInstance = null;

// --- HELPER FUNCTIONS ---
function getTodayFormattedDate() {
  return new Date().toISOString().split('T')[0];
}

// Explicit Tab Switcher
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabName}`);
  const targetBtn = document.getElementById(`tab-btn-${tabName}`);

  if (targetTab) targetTab.classList.remove('hidden');
  if (targetBtn) targetBtn.classList.add('active');

  if (tabName === 'analytics') {
    renderCharts();
  }
};

// Theme Switcher
window.toggleTheme = function() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('mmp_theme', isDark ? 'dark' : 'light');
};

// Live Clock Ticker
function initClock() {
  const savedTheme = localStorage.getItem('mmp_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  setInterval(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString();
    document.getElementById('liveClock').textContent = `${dateStr} | ${timeStr}`;
  }, 1000);
}

// --- MAIN RENDER ENGINE ---
window.renderApp = function() {
  const now = new Date();
  const todayStr = getTodayFormattedDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDayNumber = now.getDate();
  const remainingDaysInMonth = Math.max(1, totalDaysInMonth - currentDayNumber + 1);

  document.getElementById('dashDaysLeft').textContent = `${remainingDaysInMonth} days left`;

  // Budget Calculations
  const discretionaryPool = Math.max(0, config.monthlySalary - config.fixedExpenses - config.savingsTarget);
  const baseDailyAllowance = Math.round(discretionaryPool / totalDaysInMonth);

  // Month-to-date spent
  const monthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Past spent before today
  const pastExpensesInMonth = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.date < todayStr;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const remainingDiscretionaryPool = discretionaryPool - pastExpensesInMonth;
  const reAmortizedTarget = Math.max(0, Math.round(remainingDiscretionaryPool / remainingDaysInMonth));
  const activeDailyTarget = config.autoRollover ? reAmortizedTarget : baseDailyAllowance;

  // Today's spent
  const todayTxs = transactions.filter(t => t.date === todayStr);
  const todaySpent = todayTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const todayRemaining = activeDailyTarget - todaySpent;
  const todaySpentPct = Math.min(100, Math.round((todaySpent / (activeDailyTarget || 1)) * 100));

  // Payment Breakdown
  const upiSpent = todayTxs.filter(t => t.mode === 'UPI').reduce((s, t) => s + Number(t.amount), 0);
  const cashSpent = todayTxs.filter(t => t.mode === 'Cash').reduce((s, t) => s + Number(t.amount), 0);
  const cardSpent = todayTxs.filter(t => t.mode === 'Card').reduce((s, t) => s + Number(t.amount), 0);

  // Render Dashboard Cards
  document.getElementById('dashDailyTarget').textContent = `₹${activeDailyTarget.toLocaleString()}`;
  document.getElementById('dashBaseTarget').textContent = `Base: ₹${baseDailyAllowance}/day`;
  document.getElementById('dashTodaySpent').textContent = `₹${todaySpent}`;
  document.getElementById('dashTodayPct').textContent = `${todaySpentPct}%`;
  document.getElementById('dashProgressBar').style.width = `${todaySpentPct}%`;

  const remBadge = document.getElementById('dashRemainingBadge');
  if (todayRemaining >= 0) {
    remBadge.textContent = `₹${todayRemaining} Left`;
    remBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  } else {
    remBadge.textContent = `₹${Math.abs(todayRemaining)} Over`;
    remBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
  }

  document.getElementById('dashDiscRemaining').textContent = `₹${(discretionaryPool - monthExpenses).toLocaleString()}`;
  document.getElementById('dashDiscTotal').textContent = `Remaining out of ₹${discretionaryPool.toLocaleString()}`;
  document.getElementById('dashMonthSpent').textContent = `₹${monthExpenses.toLocaleString()}`;

  document.getElementById('dashSalary').textContent = `₹${config.monthlySalary.toLocaleString()}`;
  document.getElementById('dashFixed').textContent = `₹${config.fixedExpenses.toLocaleString()}`;
  document.getElementById('dashSavings').textContent = `₹${config.savingsTarget.toLocaleString()}`;

  document.getElementById('dashMixTotal').textContent = `₹${todaySpent}`;
  document.getElementById('mixUpi').textContent = `₹${upiSpent}`;
  document.getElementById('mixCash').textContent = `₹${cashSpent}`;
  document.getElementById('mixCard').textContent = `₹${cardSpent}`;

  // Populate Transactions
  renderRecentTransactions();
  renderFullExpenseList();

  // Save LocalStorage
  localStorage.setItem('mmp_config', JSON.stringify(config));
  localStorage.setItem('mmp_txs', JSON.stringify(transactions));
};

function renderRecentTransactions() {
  const container = document.getElementById('recentTxList');
  const recent = transactions.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No recent transactions recorded.</div>`;
    return;
  }

  container.innerHTML = recent.map(t => `
    <div class="p-3 rounded-xl theme-input flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="p-2 rounded-lg bg-blue-500/10 text-blue-500">
          <i class="fa-solid ${getCategoryFaIcon(t.category)} text-xs"></i>
        </div>
        <div>
          <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            ${t.title}
            <span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">${t.mode}</span>
          </div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${t.date} • ${t.time || ''}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs font-bold font-mono text-slate-900 dark:text-white">-₹${t.amount}</div>
        <div class="text-[10px] text-slate-400">${t.category}</div>
      </div>
    </div>
  `).join('');
}

function renderFullExpenseList() {
  const container = document.getElementById('fullTxList');
  const query = (document.getElementById('searchQuery')?.value || '').toLowerCase();

  const filtered = transactions.filter(t => {
    const matchesMode = filterMode === 'ALL' || t.mode === filterMode;
    const matchesQuery = t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) || (t.note && t.note.toLowerCase().includes(query));
    return matchesMode && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-8 text-center rounded-2xl theme-card text-xs text-slate-400">No matching transactions found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="p-3.5 rounded-xl theme-card flex items-center justify-between transition hover:border-blue-500/50">
      <div class="flex items-center space-x-3">
        <div class="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
          <i class="fa-solid ${getCategoryFaIcon(t.category)} text-sm"></i>
        </div>
        <div>
          <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            ${t.title}
            <span class="text-[10px] px-2 py-0.2 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">${t.mode}</span>
          </div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
            <span>${t.date}</span>
            <span>•</span>
            <span>${t.time || ''}</span>
            ${t.note ? `<span>•</span><span class="italic text-slate-400">${t.note}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <div class="text-right">
          <div class="text-xs font-bold font-mono text-slate-900 dark:text-white">-₹${t.amount}</div>
          <div class="text-[10px] text-slate-400">${t.category}</div>
        </div>
        <button onclick="deleteTx('${t.id}')" class="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition" title="Delete Transaction">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function getCategoryFaIcon(cat) {
  switch(cat) {
    case 'Food': return 'fa-utensils';
    case 'Transport': return 'fa-car';
    case 'Shopping': return 'fa-bag-shopping';
    case 'Bills': return 'fa-file-invoice-dollar';
    case 'Health': return 'fa-heart-pulse';
    default: return 'fa-mug-hot';
  }
}

// --- QUICK ADD & ACTION HANDLERS ---
window.quickAdd = function(title, amount, category, mode) {
  const newTx = {
    id: 'tx-' + Date.now(),
    title,
    amount: Number(amount),
    category,
    mode,
    date: getTodayFormattedDate(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    note: 'Quick-add preset'
  };
  transactions.unshift(newTx);
  renderApp();
};

window.parseSmsAndAdd = function() {
  const input = document.getElementById('smsInput');
  const sms = input.value;
  if (!sms) return;

  const amtMatch = sms.match(/(?:Rs|INR|₹)\s*([\d,]+(?:\.\d+)?)/i);
  const merchantMatch = sms.match(/(?:to|at|vpa)\s+([A-Za-z0-9\s]+?)(?=\s+on|\s+via|\s+ref|\.|$)/i);

  const amount = amtMatch ? parseFloat(amtMatch[1].replace(',', '')) : 100;
  const merchant = merchantMatch ? merchantMatch[1].trim() : 'Merchant';

  transactions.unshift({
    id: 'tx-' + Date.now(),
    title: `UPI - ${merchant}`,
    amount,
    category: 'Shopping',
    mode: 'UPI',
    date: getTodayFormattedDate(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    note: 'Parsed from SMS'
  });

  input.value = '';
  renderApp();
};

window.deleteTx = function(id) {
  transactions = transactions.filter(t => t.id !== id);
  renderApp();
};

window.setFilterMode = function(mode) {
  filterMode = mode;
  ['all', 'upi', 'cash', 'card'].forEach(m => {
    const btn = document.getElementById(`filter-${m}`);
    if (btn) {
      if (m.toUpperCase() === mode) {
        btn.className = 'px-2.5 py-1 rounded-lg font-semibold bg-blue-600 text-white';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';
      }
    }
  });
  renderFullExpenseList();
};

// Modal Operations
window.openExpenseModal = function() {
  document.getElementById('expenseModal').classList.remove('hidden');
  document.getElementById('expenseModal').classList.add('flex');
};

window.closeExpenseModal = function() {
  document.getElementById('expenseModal').classList.add('hidden');
  document.getElementById('expenseModal').classList.remove('flex');
};

window.handleModalFormSubmit = function(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('modalTxAmount').value);
  const title = document.getElementById('modalTxTitle').value;
  const mode = document.getElementById('modalTxMode').value;
  const category = document.getElementById('modalTxCategory').value;
  const note = document.getElementById('modalTxNote').value;

  if (!amount || !title) return;

  transactions.unshift({
    id: 'tx-' + Date.now(),
    title,
    amount,
    category,
    mode,
    date: getTodayFormattedDate(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    note
  });

  document.getElementById('modalTxForm').reset();
  closeExpenseModal();
  renderApp();
};

// Settings Operations
window.handleSettingsSave = function(e) {
  e.preventDefault();
  config.monthlySalary = Number(document.getElementById('cfgSalary').value);
  config.fixedExpenses = Number(document.getElementById('cfgFixed').value);
  config.savingsTarget = Number(document.getElementById('cfgSavings').value);
  config.autoRollover = document.getElementById('cfgRollover').checked;
  renderApp();
  alert('Settings saved successfully!');
};

function populateSettingsForm() {
  document.getElementById('cfgSalary').value = config.monthlySalary;
  document.getElementById('cfgFixed').value = config.fixedExpenses;
  document.getElementById('cfgSavings').value = config.savingsTarget;
  document.getElementById('cfgRollover').checked = config.autoRollover;
}

// Notification Trigger (11 PM Scheduled Reminder)
window.testNotificationAlert = function() {
  const todayTxs = transactions.filter(t => t.date === getTodayFormattedDate());
  const todaySpent = todayTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const discretionaryPool = Math.max(0, config.monthlySalary - config.fixedExpenses - config.savingsTarget);
  const activeTarget = Math.round(discretionaryPool / 30);

  document.getElementById('notifSpent').textContent = `₹${todaySpent}`;
  document.getElementById('notifTarget').textContent = `₹${activeTarget}`;
  document.getElementById('notifNextTarget').textContent = `₹${activeTarget}`;

  const msg = document.getElementById('notifMsg');
  if (todaySpent <= activeTarget) {
    msg.textContent = `🎉 You saved ₹${activeTarget - todaySpent} today!`;
    msg.className = 'text-xs font-bold text-emerald-500 mt-1';
  } else {
    msg.textContent = `⚠️ Overspent by ₹${todaySpent - activeTarget} today.`;
    msg.className = 'text-xs font-bold text-rose-500 mt-1';
  }

  document.getElementById('notifModal').classList.remove('hidden');
  document.getElementById('notifModal').classList.add('flex');

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('11 PM Expense Summary', {
      body: `Spent Today: ₹${todaySpent} | Daily Target: ₹${activeTarget}`
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
};

window.closeNotifModal = function() {
  document.getElementById('notifModal').classList.add('hidden');
  document.getElementById('notifModal').classList.remove('flex');
};

// CSV Export
window.exportCSV = function() {
  let csv = 'ID,Date,Time,Title,Amount,Category,Mode,Note\n';
  transactions.forEach(t => {
    csv += `"${t.id}","${t.date}","${t.time || ''}","${t.title}",${t.amount},"${t.category}","${t.mode}","${t.note || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Expenses_${getTodayFormattedDate()}.csv`);
  a.click();
};

// Reset Data
window.resetData = function() {
  if (confirm('Reset all transaction data and settings back to defaults?')) {
    localStorage.clear();
    config = DEFAULT_CONFIG;
    transactions = [
      { id: 'tx-1', title: 'Morning Coffee & Snack', amount: 80, category: 'Food', mode: 'UPI', date: getTodayFormattedDate(), time: '08:30 AM', note: 'Cafe' }
    ];
    populateSettingsForm();
    renderApp();
  }
};

// --- CHART.JS ANALYTICS ---
function renderCharts() {
  // Category Breakdown
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment'];
  const categoryData = categories.map(cat => 
    transactions.filter(t => t.category === cat).reduce((s, t) => s + Number(t.amount), 0)
  );

  const ctxCat = document.getElementById('categoryChart').getContext('2d');
  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: categoryData,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });

  // Payment Mode Breakdown
  const modes = ['UPI', 'Cash', 'Card'];
  const modeData = modes.map(m => 
    transactions.filter(t => t.mode === m).reduce((s, t) => s + Number(t.amount), 0)
  );

  const ctxMode = document.getElementById('modeChart').getContext('2d');
  if (modeChartInstance) modeChartInstance.destroy();
  modeChartInstance = new Chart(ctxMode, {
    type: 'bar',
    data: {
      labels: modes,
      datasets: [{
        label: 'Total Spent (₹)',
        data: modeData,
        backgroundColor: ['#6366f1', '#10b981', '#a855f7']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

// --- INITIALIZATION ON LOAD ---
window.addEventListener('DOMContentLoaded', () => {
  initClock();
  populateSettingsForm();
  renderApp();
});
