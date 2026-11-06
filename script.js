// ==========================================================================
// 課題管理アプリ メインスクリプト（script.js 完全版）
// ==========================================================================

// 初期授業（科目）マスターデータ
const defaultSubjects = [
  { id: 'sub1', name: 'システム開発演習', color: '#4f46e5' },
  { id: 'sub2', name: 'プログラミング基礎', color: '#059669' },
  { id: 'sub3', name: 'データベース論', color: '#d97706' },
  { id: 'sub4', name: 'ネットワーク技術', color: '#dc2626' }
];

let subjects = JSON.parse(localStorage.getItem('my_subjects')) || defaultSubjects;

function saveSubjectsToLocalStorage() {
  localStorage.setItem('my_subjects', JSON.stringify(subjects));
}

let baseDate = new Date();
let currentViewMode = 'week'; // 'week', 'month', 'year'

const getFormattedDate = (d) => d.toISOString().split('T')[0];

// 初回起動時のサンプルデータ
const defaultTasks = [
  { id: 1, title: 'きゅうり買う（期限切れテスト）', subjectId: 'sub1', date: getFormattedDate(new Date(Date.now() - 86400000 * 2)), time: '23:59', prio: 'high', completed: false },
  { id: 2, title: '要件定義書・外部設計書の作成', subjectId: 'sub1', date: getFormattedDate(new Date()), time: '23:59', prio: 'high', completed: false },
  { id: 3, title: 'アルゴリズム理解レポート', subjectId: 'sub2', date: getFormattedDate(new Date(Date.now() + 86400000)), time: '23:59', prio: 'mid', completed: false },
  { id: 4, title: 'SQLクエリ課題 第5講', subjectId: 'sub3', date: getFormattedDate(new Date(Date.now() + 86400000 * 2)), time: '18:00', prio: 'low', completed: false },
];

let tasks = JSON.parse(localStorage.getItem('my_tasks')) || defaultTasks;

function saveToLocalStorage() {
  localStorage.setItem('my_tasks', JSON.stringify(tasks));
}

let currentNavFilter = 'all';
let currentPriorityFilter = 'all';

// 画面読み込み時の初期化
window.addEventListener('DOMContentLoaded', () => {
  renderSubjectsNav();
  populateSubjectDropdown();
  renderCalendarStrip();
  renderTasks();

  // カレンダー外クリックで日付ポップオーバーを閉じる
  document.addEventListener('click', (e) => {
    const popover = document.getElementById('date-picker-popover');
    const titleArea = document.querySelector('.cal-month-title');
    if (popover && !popover.contains(e.target) && !titleArea.contains(e.target)) {
      popover.classList.remove('show');
    }
  });
});

// 優先度フィルター切り替え
function filterByPriority(prio) {
  currentPriorityFilter = prio;
  renderTasks();
}

// ── ① 日付ポップオーバー・カレンダー切り替え機能 ──

// 年月下矢印のクリックで日付ピッカーを表示
function toggleDatePickerPopover(e) {
  e.stopPropagation();
  const popover = document.getElementById('date-picker-popover');
  const pickerInput = document.getElementById('cal-date-picker');
  pickerInput.value = getFormattedDate(baseDate);
  popover.classList.toggle('show');
}

// 日付選択変更時
function onDatePickerChange(val) {
  if (!val) return;
  baseDate = new Date(val + 'T00:00:00');
  document.getElementById('date-picker-popover').classList.remove('show');
  renderCalendarStrip();
  scrollToDate(val);
}

// ② 週 / 月 / 年 の表示モード変更
function changeViewMode(mode) {
  currentViewMode = mode;
  renderCalendarStrip();
}

// 前・次ボタン押下時（週/月/年で切り替え幅を分岐）
function shiftCalendar(direction) {
  if (currentViewMode === 'week') {
    baseDate.setDate(baseDate.getDate() + (direction * 7));
  } else if (currentViewMode === 'month') {
    baseDate.setMonth(baseDate.getMonth() + direction);
  } else if (currentViewMode === 'year') {
    baseDate.setFullYear(baseDate.getFullYear() + direction);
  }
  renderCalendarStrip();
}

// 今日ボタン押下時
function goToToday() {
  baseDate = new Date();
  renderCalendarStrip();
  scrollToDate(getFormattedDate(baseDate));
}

// カレンダーヘッダー（日付ストリップ）の描画（週/月/年対応）
function renderCalendarStrip() {
  const strip = document.getElementById('date-strip');
  const monthText = document.getElementById('cal-month-text');
  const todayStr = getFormattedDate(new Date());

  monthText.innerText = `${baseDate.getFullYear()}年 ${baseDate.getMonth() + 1}月`;

  let html = '';
  const days = ['日', '月', '火', '水', '木', '金', '土'];

  if (currentViewMode === 'week') {
    // 週表示（月曜スタートの7日間）
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = getFormattedDate(d);
      const isToday = dStr === todayStr;

      html += `
        <div class="date-strip-item ${isToday ? 'is-today' : ''}" onclick="scrollToDate('${dStr}')">
          <span class="day-label">${days[d.getDay()]}</span>
          <span class="day-num">${d.getDate()}</span>
        </div>
      `;
    }
  } else if (currentViewMode === 'month') {
    // 月表示（該当月の全日）
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dStr = getFormattedDate(d);
      const isToday = dStr === todayStr;

      html += `
        <div class="date-strip-item ${isToday ? 'is-today' : ''}" onclick="scrollToDate('${dStr}')">
          <span class="day-label">${days[d.getDay()]}</span>
          <span class="day-num">${day}</span>
        </div>
      `;
    }
  } else if (currentViewMode === 'year') {
    // 年表示（12ヶ月分）
    const year = baseDate.getFullYear();
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1);
      const isCurrentMonth = new Date().getFullYear() === year && new Date().getMonth() === m;

      html += `
        <div class="date-strip-item ${isCurrentMonth ? 'is-today' : ''}" style="min-width: 50px;" onclick="jumpToMonth(${year}, ${m})">
          <span class="day-label">${year}年</span>
          <span class="day-num" style="font-size:0.8rem;">${m + 1}月</span>
        </div>
      `;
    }
  }

  strip.innerHTML = html;
}

// 年表示で月をタップした際のジャンプ処理
function jumpToMonth(year, month) {
  baseDate = new Date(year, month, 1);
  currentViewMode = 'month';
  document.getElementById('view-mode-select').value = 'month';
  renderCalendarStrip();
}

// 指定日付へタイムラインをスクロール
function scrollToDate(dateStr) {
  const target = document.getElementById(`date-group-${dateStr}`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showToast(`${dateStr} の課題はありません`);
  }
}

// ── 授業（科目）追加・削除機能 ──

function renderSubjectsNav() {
  const container = document.getElementById('subject-list');
  container.innerHTML = subjects.map(s => `
    <a class="nav-item ${currentNavFilter === s.id ? 'active' : ''}" onclick="filterByNav('${s.id}', this)">
      <span><span class="subject-tag-dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</span>
      <i class="fa-solid fa-trash-can subject-del-btn" title="授業を削除" onclick="deleteSubject(event, '${s.id}')"></i>
    </a>
  `).join('');
}

function openSubjectModal() {
  document.getElementById('subject-name').value = '';
  document.getElementById('subject-color').value = '#4f46e5';
  document.getElementById('subject-modal-overlay').classList.add('open');
}

function closeSubjectModal() {
  document.getElementById('subject-modal-overlay').classList.remove('open');
}

function saveSubject(e) {
  e.preventDefault();
  const name = document.getElementById('subject-name').value;
  const color = document.getElementById('subject-color').value;

  const newSub = {
    id: 'sub_' + Date.now(),
    name: name,
    color: color
  };

  subjects.push(newSub);
  saveSubjectsToLocalStorage();
  renderSubjectsNav();
  populateSubjectDropdown();
  closeSubjectModal();
  showToast('新しい授業を追加しました');
}

function deleteSubject(e, id) {
  e.stopPropagation();
  if (confirm('この授業を削除しますか？\n（関連する課題の科目名表示が「未登録」になります）')) {
    subjects = subjects.filter(s => s.id !== id);
    saveSubjectsToLocalStorage();
    
    if (currentNavFilter === id) {
      currentNavFilter = 'all';
      document.getElementById('view-title').innerText = '近日予定';
    }
    
    renderSubjectsNav();
    populateSubjectDropdown();
    renderTasks();
    showToast('授業を削除しました');
  }
}

function populateSubjectDropdown() {
  document.getElementById('task-subject').innerHTML = subjects.map(s => `
    <option value="${s.id}">${escapeHtml(s.name)}</option>
  `).join('');
}

function filterByNav(filter, el) {
  currentNavFilter = filter;
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  if (el) el.classList.add('active');

  const selectedSub = subjects.find(s => s.id === filter);
  const titleMap = { 'all': '近日予定', 'today': '今日', 'completed': '完了済み' };
  document.getElementById('view-title').innerText = selectedSub ? selectedSub.name : (titleMap[filter] || '課題一覧');
  renderTasks();
}

// ── 課題一覧（タイムライン）描画 ──

function renderTasks() {
  const container = document.getElementById('timeline');
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const todayStr = getFormattedDate(new Date());

  let filtered = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery);
    if (!matchesSearch) return false;

    if (currentPriorityFilter !== 'all' && t.prio !== currentPriorityFilter) {
      return false;
    }

    if (currentNavFilter === 'all') return !t.completed;
    if (currentNavFilter === 'today') return !t.completed && t.date === todayStr;
    if (currentNavFilter === 'completed') return t.completed;
    return !t.completed && t.subjectId === currentNavFilter;
  });

  document.getElementById('count-all').innerText = tasks.filter(t => !t.completed).length;
  document.getElementById('count-today').innerText = tasks.filter(t => !t.completed && t.date === todayStr).length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 48px; color: var(--text-muted);" class="fade-in">
        <i class="fa-regular fa-folder-open fa-3x" style="margin-bottom:12px;"></i>
        <p>該当する課題はありません</p>
      </div>`;
    return;
  }

  const overdueTasks = filtered.filter(t => t.date < todayStr && !t.completed);
  const upcomingTasks = filtered.filter(t => t.date >= todayStr || t.completed);

  let html = '';

  if (overdueTasks.length > 0 && currentNavFilter === 'all') {
    html += `
      <div class="overdue-section fade-in">
        <div class="overdue-header">
          <span><i class="fa-solid fa-chevron-down"></i> 期限切れ</span>
          <span class="reschedule-btn" onclick="rescheduleOverdue()">リスケジュール</span>
        </div>
        <div class="task-list">
          ${overdueTasks.map(t => renderTaskCard(t)).join('')}
        </div>
      </div>
    `;
  }

  const grouped = {};
  upcomingTasks.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  upcomingTasks.forEach(task => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

  html += Object.keys(grouped).map(dateStr => {
    const dateTasks = grouped[dateStr];
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = ['日','月','火','水','木','金','土'][dateObj.getDay()];
    
    let label = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ・ ${dayOfWeek}曜日`;
    if (dateStr === todayStr) label = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ・ 今日 ・ ${dayOfWeek}曜日`;

    return `
      <div class="date-group fade-in" id="date-group-${dateStr}">
        <div class="date-header">
          <h2>${label}</h2>
        </div>
        <div class="task-list">
          ${dateTasks.map(t => renderTaskCard(t)).join('')}
        </div>
        <button class="quick-add-btn" onclick="openModal('${dateStr}')">
          <i class="fa-solid fa-plus" style="color:#dc2626;"></i> タスクを追加
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function getPrioBadge(prio) {
  if (prio === 'high') return '<span class="prio-tag prio-high">高</span>';
  if (prio === 'mid') return '<span class="prio-tag prio-mid">中</span>';
  return '<span class="prio-tag prio-low">低</span>';
}

function renderTaskCard(task) {
  const sub = subjects.find(s => s.id === task.subjectId) || { name: '未登録', color: '#6b7280' };
  return `
    <div class="task-card ${task.completed ? 'completed' : ''}" onclick="editTask(${task.id})">
      <div class="task-left">
        <div class="checkbox-custom" onclick="toggleTaskStatus(event, ${task.id})">
          ${task.completed ? '<i class="fa-solid fa-check fa-xs"></i>' : ''}
        </div>
        <div class="task-info">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <div style="display:flex; gap:8px; align-items:center; margin-top:2px;">
            <span class="task-date-sub"><i class="fa-regular fa-calendar"></i> ${task.date} ${task.time || ''}</span>
            <span style="font-size:0.75rem; color:${sub.color}; font-weight:600;">● ${escapeHtml(sub.name)}</span>
            ${getPrioBadge(task.prio)}
          </div>
        </div>
      </div>
      <i class="fa-solid fa-trash-can delete-btn-icon" title="削除" onclick="deleteTaskDirect(event, ${task.id})"></i>
    </div>
  `;
}

function toggleTaskStatus(e, id) {
  e.stopPropagation();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToLocalStorage();
    showToast(task.completed ? '課題を完了にしました' : '未完了に戻しました');
    renderTasks();
  }
}

function deleteTaskDirect(e, id) {
  e.stopPropagation();
  if (confirm('この課題を削除しますか？')) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    showToast('課題を削除しました');
    renderTasks();
  }
}

function deleteTaskFromModal() {
  const id = parseInt(document.getElementById('task-id').value);
  if (id && confirm('この課題を削除しますか？')) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    closeModal();
    showToast('課題を削除しました');
    renderTasks();
  }
}

function rescheduleOverdue() {
  const todayStr = getFormattedDate(new Date());
  tasks.forEach(t => {
    if (t.date < todayStr && !t.completed) t.date = todayStr;
  });
  saveToLocalStorage();
  showToast('期限切れの課題を今日に移動しました');
  renderTasks();
}

function openModal(defaultDate = null) {
  document.getElementById('modal-title').innerText = '新しい課題を追加';
  document.getElementById('task-id').value = '';
  document.getElementById('task-title').value = '';
  document.getElementById('task-date').value = defaultDate || getFormattedDate(new Date());
  document.getElementById('task-time').value = '23:59';
  document.getElementById('task-prio').value = 'mid';
  document.getElementById('btn-delete').style.display = 'none';
  document.getElementById('modal-overlay').classList.add('open');
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById('modal-title').innerText = '課題の編集';
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-subject').value = task.subjectId;
  document.getElementById('task-date').value = task.date;
  document.getElementById('task-time').value = task.time || '23:59';
  document.getElementById('task-prio').value = task.prio || 'mid';
  document.getElementById('btn-delete').style.display = 'inline-block';
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const title = document.getElementById('task-title').value;
  const subjectId = document.getElementById('task-subject').value;
  const date = document.getElementById('task-date').value;
  const time = document.getElementById('task-time').value;
  const prio = document.getElementById('task-prio').value;

  if (id) {
    const task = tasks.find(t => t.id === parseInt(id));
    if (task) Object.assign(task, { title, subjectId, date, time, prio });
  } else {
    tasks.push({ id: Date.now(), title, subjectId, date, time, prio, completed: false });
  }

  saveToLocalStorage();
  closeModal();
  renderTasks();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}