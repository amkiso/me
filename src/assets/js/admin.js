/* ============================================
   ADMIN - Content Management JavaScript
   ============================================ */
const API = '/api';
let TOKEN = null;
let subjects = [];
let deleteTarget = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check for token in URL (from OAuth redirect)
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    localStorage.setItem('admin_token', urlToken);
    window.history.replaceState({}, '', '/admin/');
  }

  TOKEN = localStorage.getItem('admin_token');
  if (!TOKEN) {
    window.location.href = '/admin/login.html';
    return;
  }

  // Verify token
  apiFetch('/auth/me').then(data => {
    document.getElementById('admin-user').textContent = data.user.displayName || data.user.email;
    loadAdminSubjects();
  }).catch(() => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login.html';
  });

  initEventListeners();
});

/* ---- API Helper ---- */
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

/* ---- Load Subjects ---- */
async function loadAdminSubjects() {
  try {
    subjects = await apiFetch('/subjects');
    renderAdminSubjects();
  } catch (err) {
    document.getElementById('admin-subjects').innerHTML = `<div class="text-center py-8 text-red-400 text-sm">${err.message}</div>`;
  }
}

/* ---- Render Admin Subject List ---- */
function renderAdminSubjects() {
  const container = document.getElementById('admin-subjects');

  if (!subjects.length) {
    container.innerHTML = `<div class="text-center py-12 text-muted text-sm">Chưa có môn học nào. Nhấn "Thêm môn học" để bắt đầu.</div>`;
    return;
  }

  container.innerHTML = subjects.map(s => `
    <div class="card overflow-hidden">
      <div class="bg-gradient-to-r ${s.color} px-5 py-3 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-white">${s.name}</h3>
          <span class="text-[10px] text-white/70">${s.semester} &middot; ${s.assignments.length} bài tập</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="editSubject('${s.id}')" class="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors" title="Sửa">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onclick="confirmDelete('subject','${s.id}','${s.name}')" class="p-1.5 rounded bg-white/20 hover:bg-red-500/80 text-white transition-colors" title="Xóa">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      <div class="p-4">
        <p class="text-muted text-xs mb-3">${s.description || 'Không có mô tả'}</p>
        ${s.assignments.length ? `
          <div class="space-y-1">
            ${s.assignments.map((a, i) => `
              <div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-subtle group text-xs">
                <span class="text-secondary truncate">${a.title}</span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${a.github_url ? `<a href="${a.github_url}" target="_blank" class="text-muted hover:text-sky-500"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` : ''}
                  <button onclick="confirmDelete('assignment','${s.id}:${i}','${a.title}')" class="text-muted hover:text-red-400"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              </div>`).join('')}
          </div>
        ` : '<p class="text-muted text-xs italic">Chưa có bài tập</p>'}
      </div>
    </div>`).join('');
}

/* ---- Event Listeners ---- */
function initEventListeners() {
  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/';
  });

  // Add Subject
  document.getElementById('btn-add-subject').addEventListener('click', () => openModal());

  // Modal close/cancel
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);

  // Add assignment row
  document.getElementById('btn-add-assignment').addEventListener('click', () => addAssignmentRow());

  // Form submit
  document.getElementById('form-subject').addEventListener('submit', handleSubmit);

  // Delete modal
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('modal-delete').style.display = 'none';
  });
  document.getElementById('btn-confirm-delete').addEventListener('click', handleDelete);
}

/* ---- Modal: Open ---- */
function openModal(subject = null) {
  const modal = document.getElementById('modal-subject');
  const title = document.getElementById('modal-title');

  if (subject) {
    title.textContent = 'Sửa môn học';
    document.getElementById('f-editing-id').value = subject.id;
    document.getElementById('f-id').value = subject.id;
    document.getElementById('f-id').disabled = true;
    document.getElementById('f-name').value = subject.name;
    document.getElementById('f-semester').value = subject.semester;
    document.getElementById('f-color').value = subject.color;
    document.getElementById('f-desc').value = subject.description;

    const list = document.getElementById('assignments-list');
    list.innerHTML = '';
    subject.assignments.forEach(a => addAssignmentRow(a));
  } else {
    title.textContent = 'Thêm môn học';
    document.getElementById('form-subject').reset();
    document.getElementById('f-editing-id').value = '';
    document.getElementById('f-id').disabled = false;
    document.getElementById('assignments-list').innerHTML = '';
  }

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-subject').style.display = 'none';
}

/* ---- Add Assignment Row ---- */
function addAssignmentRow(data = {}) {
  const list = document.getElementById('assignments-list');
  const row = document.createElement('div');
  row.className = 'flex gap-2 items-start';
  row.innerHTML = `
    <div class="flex-1 space-y-1">
      <input type="text" placeholder="Tên bài tập" value="${data.title || ''}" class="a-title input-field w-full px-2 py-1.5 rounded text-xs outline-none">
      <input type="url" placeholder="GitHub URL" value="${data.github_url || ''}" class="a-github input-field w-full px-2 py-1.5 rounded text-xs outline-none">
      <input type="url" placeholder="Demo URL (tùy chọn)" value="${data.demo_url || ''}" class="a-demo input-field w-full px-2 py-1.5 rounded text-xs outline-none">
    </div>
    <button type="button" onclick="this.parentElement.remove()" class="mt-1 p-1 text-muted hover:text-red-400 transition-colors flex-shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>`;
  list.appendChild(row);
}

/* ---- Form Submit ---- */
async function handleSubmit(e) {
  e.preventDefault();
  const editingId = document.getElementById('f-editing-id').value;
  const assignments = [];
  document.querySelectorAll('#assignments-list > div').forEach(row => {
    const title = row.querySelector('.a-title').value.trim();
    if (title) {
      assignments.push({
        title,
        github_url: row.querySelector('.a-github').value.trim(),
        demo_url: row.querySelector('.a-demo').value.trim()
      });
    }
  });

  const body = {
    id: document.getElementById('f-id').value.trim().toLowerCase().replace(/\s+/g, '-'),
    name: document.getElementById('f-name').value.trim(),
    semester: document.getElementById('f-semester').value.trim(),
    color: document.getElementById('f-color').value,
    description: document.getElementById('f-desc').value.trim(),
    assignments
  };

  try {
    if (editingId) {
      await apiFetch(`/subjects/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await apiFetch('/subjects', { method: 'POST', body: JSON.stringify(body) });
    }
    closeModal();
    await loadAdminSubjects();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

/* ---- Edit Subject ---- */
function editSubject(id) {
  const subject = subjects.find(s => s.id === id);
  if (subject) openModal(subject);
}

/* ---- Confirm Delete ---- */
function confirmDelete(type, id, name) {
  deleteTarget = { type, id };
  document.getElementById('delete-msg').textContent = `Bạn có chắc muốn xóa "${name}"?`;
  document.getElementById('modal-delete').style.display = 'flex';
}

/* ---- Handle Delete ---- */
async function handleDelete() {
  if (!deleteTarget) return;
  try {
    if (deleteTarget.type === 'subject') {
      await apiFetch(`/subjects/${deleteTarget.id}`, { method: 'DELETE' });
    } else if (deleteTarget.type === 'assignment') {
      const [subId, idx] = deleteTarget.id.split(':');
      await apiFetch(`/subjects/${subId}/assignments/${idx}`, { method: 'DELETE' });
    }
    document.getElementById('modal-delete').style.display = 'none';
    deleteTarget = null;
    await loadAdminSubjects();
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}
