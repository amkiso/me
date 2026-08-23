/* ============================================
   ADMIN - Content Management JavaScript
   ============================================ */
const API = '/api';
let TOKEN = null;
let subjects = [];
let profileData = {};
let deleteTarget = null;
let activeFileManager = { subjectId: '', assignmentIdx: 0, activeFile: '' };

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
    loadAdminProfile();
  }).catch(() => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login.html';
  });

  initEventListeners();
});

/* ---- API Helper ---- */
async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    ...(options.headers || {})
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

/* ---- Tab Switching ---- */
function switchAdminTab(tab) {
  const tabSubjects = document.getElementById('admin-tab-subjects');
  const tabProfile = document.getElementById('admin-tab-profile');
  const btnSubjects = document.getElementById('tab-btn-subjects');
  const btnProfile = document.getElementById('tab-btn-profile');

  if (tab === 'subjects') {
    tabSubjects.classList.remove('hidden');
    tabProfile.classList.add('hidden');
    btnSubjects.className = 'px-4 py-2.5 text-sm font-bold border-b-2 border-sky-500 text-sky-400 flex items-center gap-2';
    btnProfile.className = 'px-4 py-2.5 text-sm font-bold border-b-2 border-transparent text-muted hover:text-slate-200 flex items-center gap-2';
  } else {
    tabSubjects.classList.add('hidden');
    tabProfile.classList.remove('hidden');
    btnProfile.className = 'px-4 py-2.5 text-sm font-bold border-b-2 border-sky-500 text-sky-400 flex items-center gap-2';
    btnSubjects.className = 'px-4 py-2.5 text-sm font-bold border-b-2 border-transparent text-muted hover:text-slate-200 flex items-center gap-2';
  }
}

/* ---- Load Admin Subjects ---- */
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
    <div class="card overflow-hidden bg-slate-900 border border-subtle">
      <div class="bg-gradient-to-r ${s.color} px-5 py-3 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-white">${s.name}</h3>
          <span class="text-[10px] text-white/80 font-mono">${s.semester} &middot; ${s.assignments.length} bài tập</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="editSubject('${s.id}')" class="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors" title="Sửa môn học">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onclick="confirmDelete('subject','${s.id}','${s.name}')" class="p-1.5 rounded bg-white/20 hover:bg-red-500/80 text-white transition-colors" title="Xóa môn học">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      <div class="p-4">
        <p class="text-muted text-xs mb-3">${s.description || 'Không có mô tả'}</p>
        ${s.assignments.length ? `
          <div class="space-y-2">
            ${s.assignments.map((a, i) => `
              <div class="flex items-center justify-between py-2 px-3 rounded bg-slate-950 border border-subtle group text-xs">
                <div>
                  <span class="text-primary font-semibold">${a.title}</span>
                  <div class="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
                    ${a.docx_file ? '<span class="text-amber-400">&bull; Đã có File .docx</span>' : ''}
                    ${a.files && a.files.length ? `<span class="text-sky-400">&bull; ${a.files.length} file mã nguồn</span>` : ''}
                    ${a.github_url ? '<span class="text-emerald-400">&bull; GitHub Repo</span>' : ''}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="openFileManagerModal('${s.id}', ${i}, '${a.title.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-[11px] font-semibold flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    Quản lý File & Code
                  </button>
                  <button onclick="confirmDelete('assignment','${s.id}:${i}','${a.title}')" class="p-1 text-muted hover:text-red-400" title="Xóa bài tập"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              </div>`).join('')}
          </div>
        ` : '<p class="text-muted text-xs italic">Chưa có bài tập</p>'}
      </div>
    </div>`).join('');
}

/* ---- Load Admin Profile & Settings ---- */
async function loadAdminProfile() {
  try {
    profileData = await apiFetch('/profile');

    // Avatar Toggle & Preview
    const toggleAvatar = document.getElementById('p-show-avatar');
    toggleAvatar.checked = profileData.show_avatar !== false;
    updateAvatarToggleLabel(toggleAvatar.checked);

    if (profileData.avatar_url) {
      document.getElementById('profile-avatar-preview').src = profileData.avatar_url;
      document.getElementById('admin-avatar-preview').src = profileData.avatar_url;
    }

    // Text fields
    document.getElementById('p-name').value = profileData.name || '';
    document.getElementById('p-badge').value = profileData.badge || '';
    document.getElementById('p-bio').value = profileData.bio || '';

    if (profileData.contacts) {
      document.getElementById('p-email').value = profileData.contacts.email || '';
      document.getElementById('p-phone').value = profileData.contacts.phone || '';
      document.getElementById('p-address').value = profileData.contacts.address || '';
      document.getElementById('p-github').value = profileData.contacts.github || '';
    }

    if (profileData.education) {
      document.getElementById('p-school').value = profileData.education.school || '';
      document.getElementById('p-period').value = profileData.education.period || '';
      document.getElementById('p-major').value = profileData.education.major || '';
      document.getElementById('p-highlights').value = profileData.education.highlights || '';
    }

    // Render Skills Editor
    renderSkillCategoriesEditor();
  } catch (err) {
    console.error('Failed to load admin profile:', err);
  }
}

function updateAvatarToggleLabel(checked) {
  const lbl = document.getElementById('lbl-show-avatar');
  lbl.textContent = checked ? 'Đang Bật' : 'Đang Tắt';
  lbl.className = checked ? 'ml-2 text-xs font-semibold text-sky-400' : 'ml-2 text-xs font-semibold text-red-400';
}

/* ---- Render Skills Categories Editor ---- */
function renderSkillCategoriesEditor() {
  const container = document.getElementById('skill-categories-editor-container');
  if (!container) return;

  const categories = profileData.skill_categories || [];

  container.innerHTML = categories.map((cat, catIdx) => `
    <div class="p-4 rounded-lg bg-slate-950 border border-subtle space-y-3">
      <div class="flex items-center justify-between gap-2">
        <input type="text" value="${cat.title}" onchange="updateCategoryTitle(${catIdx}, this.value)" class="input-field px-3 py-1.5 rounded text-xs font-bold text-sky-400 outline-none bg-slate-900 w-full max-w-xs" placeholder="Tên danh mục">
        <button type="button" onclick="deleteSkillCategory(${catIdx})" class="p-1 text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Xóa
        </button>
      </div>

      <div class="flex flex-wrap gap-2 items-center">
        ${cat.skills.map((s, skillIdx) => {
          const name = typeof s === 'string' ? s : s.name;
          return `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-subtle text-xs text-secondary">
              <span>${name}</span>
              <button type="button" onclick="deleteSkillItem(${catIdx}, ${skillIdx})" class="text-muted hover:text-red-400">&times;</button>
            </span>`;
        }).join('')}
        <button type="button" onclick="addSkillItemPrompt(${catIdx})" class="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-medium">+ Thêm Thẻ</button>
      </div>
    </div>`).join('');
}

function updateCategoryTitle(catIdx, val) {
  if (profileData.skill_categories && profileData.skill_categories[catIdx]) {
    profileData.skill_categories[catIdx].title = val;
  }
}

function deleteSkillCategory(catIdx) {
  if (confirm('Bạn có chắc muốn xóa danh mục kỹ năng này?')) {
    profileData.skill_categories.splice(catIdx, 1);
    renderSkillCategoriesEditor();
  }
}

function addSkillItemPrompt(catIdx) {
  const name = prompt('Nhập tên kỹ năng / công nghệ mới (Ví dụ: Laravel, Docker, MySQL):');
  if (name && name.trim()) {
    profileData.skill_categories[catIdx].skills.push(name.trim());
    renderSkillCategoriesEditor();
  }
}

function deleteSkillItem(catIdx, skillIdx) {
  profileData.skill_categories[catIdx].skills.splice(skillIdx, 1);
  renderSkillCategoriesEditor();
}

function addSkillCategoryRow() {
  const title = prompt('Nhập tên danh mục kỹ năng mới:');
  if (title && title.trim()) {
    if (!profileData.skill_categories) profileData.skill_categories = [];
    profileData.skill_categories.push({
      id: 'cat_' + Date.now(),
      title: title.trim(),
      color: 'sky',
      skills: []
    });
    renderSkillCategoriesEditor();
  }
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

  // Subject Form submit
  document.getElementById('form-subject').addEventListener('submit', handleSubmit);

  // Delete modal
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('modal-delete').style.display = 'none';
  });
  document.getElementById('btn-confirm-delete').addEventListener('click', handleDelete);

  // Avatar toggle change
  document.getElementById('p-show-avatar').addEventListener('change', (e) => {
    updateAvatarToggleLabel(e.target.checked);
  });

  // Avatar Upload Button
  document.getElementById('btn-upload-avatar').addEventListener('click', handleAvatarUpload);

  // Profile Settings Form Submit
  document.getElementById('form-profile-settings').addEventListener('submit', handleProfileSubmit);
}

/* ---- Handle Profile Submit ---- */
async function handleProfileSubmit(e) {
  e.preventDefault();

  const body = {
    ...profileData,
    show_avatar: document.getElementById('p-show-avatar').checked,
    name: document.getElementById('p-name').value.trim(),
    badge: document.getElementById('p-badge').value.trim(),
    bio: document.getElementById('p-bio').value.trim(),
    contacts: {
      email: document.getElementById('p-email').value.trim(),
      phone: document.getElementById('p-phone').value.trim(),
      address: document.getElementById('p-address').value.trim(),
      github: document.getElementById('p-github').value.trim()
    },
    education: {
      school: document.getElementById('p-school').value.trim(),
      period: document.getElementById('p-period').value.trim(),
      major: document.getElementById('p-major').value.trim(),
      highlights: document.getElementById('p-highlights').value.trim()
    }
  };

  try {
    const updated = await apiFetch('/profile', { method: 'PUT', body: JSON.stringify(body) });
    profileData = updated;
    alert('Đã cập nhật Profile thành công!');
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

/* ---- Handle Avatar File Upload ---- */
async function handleAvatarUpload() {
  const fileInput = document.getElementById('input-avatar-file');
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Vui lòng chọn 1 file ảnh');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', fileInput.files[0]);

  try {
    const res = await apiFetch('/profile/avatar', { method: 'POST', body: formData });
    profileData.avatar_url = res.avatar_url;
    document.getElementById('profile-avatar-preview').src = res.avatar_url;
    document.getElementById('admin-avatar-preview').src = res.avatar_url;
    alert('Đã tải lên ảnh đại diện thành công!');
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

/* ---- Assignment File Manager Modal ---- */
async function openFileManagerModal(subjectId, assignmentIdx, assignmentTitle) {
  activeFileManager = { subjectId, assignmentIdx, activeFile: '' };
  document.getElementById('modal-filemgr-title').textContent = `Quản lý File: ${assignmentTitle}`;
  document.getElementById('modal-filemgr-subtitle').textContent = `Subject: ${subjectId} &middot; Bài tập #${assignmentIdx + 1}`;

  const modal = document.getElementById('modal-assignment-files');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  loadAssignmentFileList();
}

function closeFileManagerModal() {
  const modal = document.getElementById('modal-assignment-files');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function loadAssignmentFileList() {
  const { subjectId, assignmentIdx } = activeFileManager;
  const container = document.getElementById('filemgr-file-list');
  container.innerHTML = '<p class="text-xs text-muted">Đang nạp file...</p>';

  try {
    const files = await apiFetch(`/assignments/${subjectId}/${assignmentIdx}/files`);
    if (!files.length) {
      container.innerHTML = '<p class="text-xs text-muted italic">Chưa có file nào được upload.</p>';
      document.getElementById('editor-filename').textContent = 'Chưa chọn file';
      document.getElementById('editor-textarea').value = '';
      document.getElementById('btn-save-code').classList.add('hidden');
      return;
    }

    container.innerHTML = files.map(f => `
      <div class="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-subtle flex items-center justify-between gap-2 group cursor-pointer" onclick="selectFileForEditing('${f.filename}')">
        <div class="min-w-0">
          <p class="text-xs font-mono font-bold text-sky-400 truncate">${f.filename}</p>
          <span class="text-[10px] text-muted">${(f.size / 1024).toFixed(1)} KB</span>
        </div>
        <button onclick="event.stopPropagation(); deleteAssignmentFile('${f.filename}')" class="text-muted hover:text-red-400 p-1" title="Xóa file">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>`).join('');

    selectFileForEditing(files[0].filename);
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-red-400">${err.message}</p>`;
  }
}

async function selectFileForEditing(filename) {
  activeFileManager.activeFile = filename;
  const { subjectId, assignmentIdx } = activeFileManager;

  document.getElementById('editor-filename').textContent = `File: ${filename}`;

  const ext = filename.split('.').pop().toLowerCase();
  const isText = ['.php', '.css', '.js', '.json', '.html', '.txt', '.sql'].includes('.' + ext);

  const btnSave = document.getElementById('btn-save-code');
  const textarea = document.getElementById('editor-textarea');

  if (isText) {
    btnSave.classList.remove('hidden');
    textarea.disabled = false;
    textarea.value = 'Đang tải nội dung file...';

    try {
      const data = await apiFetch(`/assignments/${subjectId}/${assignmentIdx}/files/${filename}`);
      textarea.value = data.content || '';
    } catch (e) {
      textarea.value = 'Lỗi khi tải nội dung file.';
    }
  } else {
    btnSave.classList.add('hidden');
    textarea.disabled = true;
    textarea.value = `[File định dạng nhị phân / Word / Ảnh (${filename}) không hỗ trợ xem trực tiếp trên editor]`;
  }
}

async function saveActiveCodeFile() {
  const { subjectId, assignmentIdx, activeFile } = activeFileManager;
  if (!activeFile) return;

  const content = document.getElementById('editor-textarea').value;
  try {
    await apiFetch(`/assignments/${subjectId}/${assignmentIdx}/files/${activeFile}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
    alert(`Đã lưu mã nguồn file ${activeFile} thành công!`);
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

async function uploadSelectedFiles() {
  const fileInput = document.getElementById('input-assignment-upload');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Vui lòng chọn ít nhất 1 file');
    return;
  }

  const { subjectId, assignmentIdx } = activeFileManager;
  const formData = new FormData();
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('files', fileInput.files[i]);
  }

  try {
    await apiFetch(`/assignments/${subjectId}/${assignmentIdx}/upload`, {
      method: 'POST',
      body: formData
    });
    alert('Upload file bài tập thành công!');
    fileInput.value = '';
    loadAssignmentFileList();
    loadAdminSubjects();
  } catch (err) {
    alert('Lỗi upload: ' + err.message);
  }
}

async function deleteAssignmentFile(filename) {
  if (!confirm(`Bạn có chắc muốn xóa file ${filename}?`)) return;

  const { subjectId, assignmentIdx } = activeFileManager;
  try {
    await apiFetch(`/assignments/${subjectId}/${assignmentIdx}/files/${filename}`, {
      method: 'DELETE'
    });
    loadAssignmentFileList();
    loadAdminSubjects();
  } catch (err) {
    alert('Lỗi khi xóa file: ' + err.message);
  }
}

/* ---- Subject Modal ---- */
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
  row.className = 'flex gap-2 items-start bg-slate-950 p-2 rounded border border-subtle';
  row.innerHTML = `
    <div class="flex-1 space-y-1">
      <input type="text" placeholder="Tên bài tập *" value="${data.title || ''}" class="a-title input-field w-full px-2 py-1 rounded text-xs outline-none bg-slate-900">
      <input type="url" placeholder="GitHub Repo URL (Framework Project)" value="${data.github_url || ''}" class="a-github input-field w-full px-2 py-1 rounded text-xs outline-none bg-slate-900">
      <input type="url" placeholder="Demo URL (tùy chọn)" value="${data.demo_url || ''}" class="a-demo input-field w-full px-2 py-1 rounded text-xs outline-none bg-slate-900">
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
