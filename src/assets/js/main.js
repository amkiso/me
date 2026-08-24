/* ============================================
   PORTFOLIO - Main JavaScript (Public pages)
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initActiveNav();
  initScrollAnimations();
  initAdminSecretTriggers(); // Kích hoạt phím tắt & lối vào Admin ẩn

  loadProfileData();
  if (document.getElementById('subjects-container')) loadSubjects();
  if (document.getElementById('course-detail-container')) loadCourseDetail();
  if (document.getElementById('contact-form')) initContactForm();
  if (document.getElementById('skill-bars')) initSkillBars();
});

/* ---- Lối vào Admin Ẩn & Kiểm tra Session Admin trên giao diện ---- */
function initAdminSecretTriggers() {
  const token = localStorage.getItem('admin_token');

  // 1. Kiểm tra Session: Nếu đã đăng nhập Admin hợp lệ -> Hiển thị nút "Quản trị" trên Navbar
  if (token) {
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.ok) {
        showAdminNavButton();
      } else {
        localStorage.removeItem('admin_token');
      }
    })
    .catch(() => {});
  }

  // 2. Phím tắt ẩn: Nhấn Ctrl + Shift + A (hoặc Alt + A) để vào thẳng trang Admin
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'a' || e.key === 'A'))) {
      e.preventDefault();
      const targetUrl = localStorage.getItem('admin_token') ? '/admin/' : '/admin/login.html';
      window.location.href = targetUrl;
    }
  });

  // 3. Nhấp 3 lần liên tiếp vào Logo Avatar ở góc trái Menu để mở trang Login Admin
  const navLogos = document.querySelectorAll('a[href="index.html"] img');
  navLogos.forEach(logo => {
    let clickCount = 0;
    let clickTimer = null;
    logo.addEventListener('click', (e) => {
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => { clickCount = 0; }, 800);
      } else if (clickCount >= 3) {
        e.preventDefault();
        clearTimeout(clickTimer);
        clickCount = 0;
        const targetUrl = localStorage.getItem('admin_token') ? '/admin/' : '/admin/login.html';
        window.location.href = targetUrl;
      }
    });
  });
}

/* Hiển thị nút "Quản trị" trên Menu nếu đang có Session hợp lệ */
function showAdminNavButton() {
  const desktopNav = document.querySelector('.nav-bar .hidden.md\\:flex');
  if (desktopNav && !document.getElementById('nav-admin-link')) {
    const adminBtn = document.createElement('a');
    adminBtn.id = 'nav-admin-link';
    adminBtn.href = '/admin/';
    adminBtn.className = 'px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all ml-1 flex items-center gap-1';
    adminBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg> Trang Quản trị`;
    desktopNav.insertBefore(adminBtn, desktopNav.querySelector('a[aria-label="GitHub"]'));
  }
}

/* ---- Theme Toggle ---- */
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light');
  updateThemeIcons();

  document.querySelectorAll('#theme-toggle, #theme-toggle-mobile').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
      updateThemeIcons();
    });
  });
}

function updateThemeIcons() {
  const isLight = document.body.classList.contains('light');
  document.querySelectorAll('#icon-sun').forEach(el => el.classList.toggle('hidden', !isLight));
  document.querySelectorAll('#icon-moon').forEach(el => el.classList.toggle('hidden', isLight));
}

/* ---- Mobile Navigation ---- */
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    overlay?.classList.toggle('hidden');
  });
  overlay?.addEventListener('click', () => {
    menu.classList.remove('open');
    overlay.classList.add('hidden');
  });
}

/* ---- Active Nav Link ---- */
function initActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html') || (page.startsWith('course-detail') && href === 'courses.html')) {
      link.classList.add('active', 'text-sky-500');
    }
  });
}

/* ---- Scroll Animations ---- */
function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-in'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => { el.style.opacity = '0'; observer.observe(el); });
}

/* ---- Load Subjects List (courses.html) ---- */
async function loadSubjects() {
  const container = document.getElementById('subjects-container');
  const filterContainer = document.getElementById('filter-buttons');
  const searchInput = document.getElementById('search-input');
  const statsContainer = document.getElementById('stats-container');

  container.innerHTML = Array.from({ length: 3 }, () => `<div class="card overflow-hidden"><div class="skeleton h-28"></div><div class="p-5 space-y-3"><div class="skeleton h-3 w-3/4"></div><div class="skeleton h-2 w-full"></div><div class="skeleton h-8 w-full mt-2"></div><div class="skeleton h-8 w-full"></div></div></div>`).join('');

  try {
    const res = await fetch('./data/subjects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const subjects = await res.json();

    if (statsContainer) renderStats(subjects, statsContainer);
    if (filterContainer) renderFilters(subjects, filterContainer, container, searchInput);
    renderSubjects(subjects, container);

    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        const q = searchInput.value.toLowerCase().trim();
        const sem = document.querySelector('.filter-btn.active')?.dataset.semester || 'all';
        const filtered = subjects.filter(s => {
          const matchQ = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.assignments.some(a => a.title.toLowerCase().includes(q));
          const matchS = sem === 'all' || s.semester === sem;
          return matchQ && matchS;
        });
        renderSubjects(filtered, container);
      }, 250));
    }
  } catch (err) {
    container.innerHTML = `<div class="col-span-full text-center py-12"><h3 class="text-base font-semibold text-secondary mb-1">Không thể tải dữ liệu</h3><p class="text-muted text-sm mb-4">${err.message}</p><button onclick="loadSubjects()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Thử lại</button></div>`;
  }
}

/* ---- Render Stats ---- */
function renderStats(subjects, container) {
  const total = subjects.reduce((a, s) => a + s.assignments.length, 0);
  const sems = [...new Set(subjects.map(s => s.semester))];
  const repos = subjects.reduce((a, s) => a + s.assignments.filter(x => x.github_url).length, 0);

  const stats = [
    { value: subjects.length, label: 'Môn học' },
    { value: total, label: 'Bài tập / Labs' },
    { value: sems.length, label: 'Học kỳ' },
    { value: repos, label: 'GitHub Repos' }
  ];

  container.innerHTML = stats.map((s, i) => `
    <div class="card stat-card p-4 text-center fade-in" style="animation-delay:${i * 0.08}s">
      <div class="text-2xl font-bold gradient-text counter" data-target="${s.value}">0</div>
      <div class="text-[11px] text-muted mt-0.5">${s.label}</div>
    </div>`).join('');

  setTimeout(animateCounters, 200);
}

function animateCounters() {
  document.querySelectorAll('.counter[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const start = performance.now();
    (function update(now) {
      const p = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(update);
    })(start);
  });
}

/* ---- Render Filters ---- */
function renderFilters(subjects, filterContainer, subjectsContainer, searchInput) {
  const semesters = ['all', ...new Set(subjects.map(s => s.semester))];
  filterContainer.innerHTML = semesters.map(sem => `
    <button class="filter-btn px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sem === 'all' ? 'active bg-sky-600 text-white' : 'filter-inactive bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-700/40'}" data-semester="${sem}">
      ${sem === 'all' ? 'Tất cả' : sem}
    </button>`).join('');

  filterContainer.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterContainer.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active', 'bg-sky-600', 'text-white'); b.classList.add('filter-inactive', 'bg-slate-800/40', 'text-slate-400'); });
    btn.classList.add('active', 'bg-sky-600', 'text-white'); btn.classList.remove('filter-inactive', 'bg-slate-800/40', 'text-slate-400');
    const sem = btn.dataset.semester;
    const q = searchInput?.value.toLowerCase().trim() || '';
    renderSubjects(subjects.filter(s => (sem === 'all' || s.semester === sem) && (!q || s.name.toLowerCase().includes(q))), subjectsContainer);
  });
}

/* ---- Render Subject Cards (courses.html) ---- */
function renderSubjects(subjects, container) {
  if (!subjects.length) {
    container.innerHTML = `<div class="col-span-full text-center py-12"><h3 class="text-base font-semibold text-secondary">Không tìm thấy</h3><p class="text-muted text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p></div>`;
    return;
  }

  container.innerHTML = subjects.map((s, i) => `
    <div onclick="window.location.href='course-detail.html?id=${s.id}'" 
         class="subject-card card overflow-hidden flex flex-col justify-between cursor-pointer hover:border-sky-500/50 hover:shadow-lg transition-all fade-in group" 
         style="animation-delay:${i * 0.08}s">
      <div>
        <div class="bg-gradient-to-r ${s.color} p-5 relative">
          <div class="absolute inset-0 bg-black/15"></div>
          <div class="relative flex items-start justify-between gap-2">
            <div>
              <h3 class="text-base font-bold text-white leading-tight group-hover:underline">${s.name}</h3>
              <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-white">${s.semester}</span>
            </div>
            <span class="text-xs font-mono text-white/70">#${s.id}</span>
          </div>
        </div>
        <div class="p-5 space-y-4">
          <p class="text-muted text-xs leading-relaxed line-clamp-3">${s.description}</p>
          <div>
            <h4 class="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Bài tập thực hành (${s.assignments.length})</span>
            </h4>
            <div class="space-y-1">
              ${s.assignments.slice(0, 3).map((a, j) => `
                <div class="assignment-row flex items-center justify-between py-1.5 px-2 rounded group/item">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full bg-subtle flex items-center justify-center text-[9px] font-mono text-sky-500 font-semibold">${j + 1}</span>
                    <span class="text-xs text-secondary group-hover/item:text-primary transition-colors truncate">${a.title}</span>
                  </div>
                </div>`).join('')}
              ${s.assignments.length > 3 ? `<p class="text-[10px] text-muted italic pl-2">+${s.assignments.length - 3} bài tập khác...</p>` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="p-5 pt-0 mt-auto">
        <div class="btn-outline w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 group-hover:border-sky-500 group-hover:text-sky-500 transition-all">
          <span>Xem chi tiết môn học</span>
          <svg class="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </div>
      </div>
    </div>`).join('');
}

/* ---- Load Course Detail Page (course-detail.html) ---- */
async function loadCourseDetail() {
  const container = document.getElementById('course-detail-container');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    container.innerHTML = `
      <div class="card p-8 text-center">
        <h2 class="text-lg font-bold text-primary mb-2">Không tìm thấy mã môn học</h2>
        <p class="text-sm text-muted mb-4">Vui lòng chọn môn học từ danh sách.</p>
        <a href="courses.html" class="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium">Về danh sách môn học</a>
      </div>`;
    return;
  }

  try {
    let subjects = [];
    try {
      const apiRes = await fetch('/api/subjects');
      if (apiRes.ok) subjects = await apiRes.json();
    } catch {}

    if (!subjects || subjects.length === 0) {
      const res = await fetch('./data/subjects.json');
      if (res.ok) subjects = await res.json();
    }

    const course = subjects.find(s => s.id === courseId);

    if (!course) {
      container.innerHTML = `
        <div class="card p-8 text-center">
          <h2 class="text-lg font-bold text-primary mb-2">Môn học không tồn tại (ID: ${courseId})</h2>
          <a href="courses.html" class="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium mt-3">Về danh sách môn học</a>
        </div>`;
      return;
    }

    if (breadcrumbCurrent) breadcrumbCurrent.textContent = course.name;
    document.title = `${course.name} | Lô Hoàng Vũ`;

    // Render course detail UI
    container.innerHTML = `
      <div class="space-y-6 fade-in">
        <!-- Header Card -->
        <div class="card overflow-hidden">
          <div class="bg-gradient-to-r ${course.color} p-6 sm:p-8 relative">
            <div class="absolute inset-0 bg-black/20"></div>
            <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">${course.semester}</span>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-white leading-tight">${course.name}</h1>
                <p class="text-white/80 text-xs font-mono mt-1">Mã môn học: ${course.id}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  ${course.assignments.length} bài tập / labs
                </span>
              </div>
            </div>
          </div>
          <div class="p-6 sm:p-8 space-y-4">
            <h2 class="text-sm font-bold text-primary uppercase tracking-wider">Mô tả tổng quan môn học</h2>
            <p class="text-secondary text-sm leading-relaxed">${course.description}</p>
          </div>
        </div>

        <!-- Assignments List -->
        <div class="card p-6 sm:p-8">
          <div class="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-subtle">
            <h2 class="text-lg font-bold text-primary flex items-center gap-2">
              <svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Danh sách bài tập & Dự án thực hành
            </h2>
            <span class="text-xs text-muted font-mono">${course.assignments.length} bài</span>
          </div>

          <div class="space-y-3">
            ${course.assignments.map((a, idx) => `
              <div class="p-4 rounded-xl bg-subtle border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-sky-500/30 transition-all">
                <div class="flex items-start gap-3 min-w-0">
                  <span class="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    ${String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 class="text-sm font-bold text-primary">${a.title}</h3>
                    <p class="text-xs text-muted mt-0.5 line-clamp-2">${a.description || 'Bài tập thực hành trong chương trình môn học'}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center">
                  ${(a.files && a.files.length > 0) || a.entry_file || course.id === 'web-php' ? `
                    <button onclick="openAssignmentViewer('${course.id}', ${idx}, '${a.title.replace(/'/g, "\\'")}', '${a.entry_file || 'index.php'}')" class="btn-primary px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Preview PHP & Code
                    </button>` : ''}
                  ${a.docx_file ? `
                    <button onclick="openDocxViewer('${a.docx_file}', '${a.title.replace(/'/g, "\\'")}')" class="btn-outline px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Xem Báo cáo .docx
                    </button>` : ''}
                  ${a.github_url ? `
                    <a href="${a.github_url}" target="_blank" rel="noopener" class="btn-outline px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:border-sky-500 hover:text-sky-500 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      Source Code
                    </a>` : ''}
                  ${a.demo_url ? `
                    <a href="${a.demo_url}" target="_blank" rel="noopener" class="btn-primary px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      Xem Demo
                    </a>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  } catch (err) {
    console.error('Failed to load course details:', err);
    container.innerHTML = `
      <div class="card p-8 text-center">
        <h2 class="text-lg font-bold text-primary mb-2">Lỗi tải dữ liệu môn học</h2>
        <p class="text-sm text-muted mb-4">${err.message}</p>
        <a href="courses.html" class="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium">Thử lại</a>
      </div>`;
  }
}

/* ---- Dynamic Profile Data Loader ---- */
async function loadProfileData() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const profile = await res.json();

    // 1. Toggle Avatar
    const avatarImgs = document.querySelectorAll('#nav-avatar-img, #hero-avatar-img, footer img');
    const heroAvatarContainer = document.getElementById('hero-avatar-container');

    if (profile.show_avatar === false) {
      avatarImgs.forEach(img => img.style.display = 'none');
      if (heroAvatarContainer) heroAvatarContainer.style.display = 'none';
    } else {
      avatarImgs.forEach(img => {
        img.style.display = '';
        if (profile.avatar_url) img.src = profile.avatar_url;
      });
      if (heroAvatarContainer) heroAvatarContainer.style.display = 'flex';
    }

    // 2. Profile Info & Hero
    if (profile.badge && document.getElementById('hero-badge')) document.getElementById('hero-badge').textContent = profile.badge;
    if (profile.name) {
      if (document.getElementById('hero-name')) document.getElementById('hero-name').textContent = profile.name;
      const parts = profile.name.split(' ');
      if (parts.length >= 2) {
        if (document.getElementById('nav-name-first')) document.getElementById('nav-name-first').textContent = parts.slice(0, -1).join(' ');
        if (document.getElementById('nav-name-last')) document.getElementById('nav-name-last').textContent = parts[parts.length - 1];
      }
    }
    if (profile.bio && document.getElementById('hero-bio')) document.getElementById('hero-bio').textContent = profile.bio;

    // Contacts
    if (profile.contacts) {
      if (profile.contacts.email && document.getElementById('hero-email')) document.getElementById('hero-email').textContent = profile.contacts.email;
      if (profile.contacts.phone && document.getElementById('hero-phone')) document.getElementById('hero-phone').textContent = profile.contacts.phone;
      if (profile.contacts.address && document.getElementById('hero-address')) document.getElementById('hero-address').textContent = profile.contacts.address;
      if (profile.contacts.github && document.getElementById('nav-github')) document.getElementById('nav-github').href = profile.contacts.github;
    }

    // Education
    if (profile.education) {
      if (profile.education.school && document.getElementById('edu-school')) document.getElementById('edu-school').textContent = profile.education.school;
      if (profile.education.school_en && document.getElementById('edu-school-en')) document.getElementById('edu-school-en').textContent = profile.education.school_en;
      if (profile.education.period && document.getElementById('edu-period')) document.getElementById('edu-period').textContent = profile.education.period;
      if (profile.education.major && document.getElementById('edu-major')) document.getElementById('edu-major').textContent = profile.education.major;
      if (profile.education.highlights && document.getElementById('edu-highlights')) document.getElementById('edu-highlights').textContent = profile.education.highlights;
    }

    // 3. Render Skill Categories Grid
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid && profile.skill_categories && profile.skill_categories.length > 0) {
      const colorMap = {
        sky: 'bg-sky-500/10 text-sky-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        blue: 'bg-blue-500/10 text-blue-500',
        cyan: 'bg-cyan-500/10 text-cyan-500',
        amber: 'bg-amber-500/10 text-amber-500',
        rose: 'bg-rose-500/10 text-rose-500'
      };

      skillsGrid.innerHTML = profile.skill_categories.map((cat, i) => `
        <div class="card p-6 fade-in" style="animation-delay:${i * 0.06}s">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-lg ${colorMap[cat.color] || 'bg-sky-500/10 text-sky-500'} flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>
            <h3 class="text-base font-bold text-primary">${cat.title}</h3>
          </div>
          <div class="flex flex-wrap gap-2">
            ${cat.skills.map(s => {
              const name = typeof s === 'string' ? s : s.name;
              return `<span class="px-2.5 py-1 rounded-md bg-subtle border border-subtle text-xs font-medium text-secondary hover:text-sky-400 transition-colors">${name}</span>`;
            }).join('')}
          </div>
        </div>`).join('');
    }
  } catch (err) {
    console.error('Failed to load profile data:', err);
  }
}

/* ---- PHP Sandbox & Assignment Code Viewer Modal Functions ---- */
let currentAssignmentViewerData = { subjectId: '', assignmentIdx: 0, files: [] };
let rawTextMode = false;
let currentCodeContent = '';

async function openAssignmentViewer(subjectId, assignmentIdx, title, entryFile) {
  const modal = document.getElementById('modal-assignment-viewer');
  if (!modal) return;

  document.getElementById('modal-viewer-title').textContent = title;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const iframe = document.getElementById('viewer-iframe');
  const phpSelect = document.getElementById('viewer-php-file-select');

  // Do not auto-run demo directly; set friendly initial placeholder page inside iframe
  iframe.removeAttribute('src');
  iframe.srcdoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #94a3b8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .box { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(14, 165, 233, 0.2); padding: 32px; border-radius: 12px; max-width: 480px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
        h3 { color: #f1f5f9; margin-top: 0; margin-bottom: 8px; font-size: 16px; font-weight: 700; }
        p { font-size: 13px; line-height: 1.6; margin-bottom: 0; }
        .badge { display: inline-block; background: rgba(14, 165, 233, 0.15); color: #38bdf8; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; tracking: 0.05em; margin-bottom: 12px; border: 1px solid rgba(56, 189, 248, 0.2); }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="badge">⚙️ Chế độ Sandbox Thủ Công</div>
        <h3>Chưa khởi chạy Live Demo</h3>
        <p>Vui lòng chọn 1 file PHP trong danh sách phía trên và bấm nút <strong style="color:#38bdf8;">▶ Chạy Demo File Đã Chọn</strong> để chạy bài tập này.</p>
      </div>
    </body>
    </html>
  `;

  // Fetch list of files for Code Viewer & Demo Selector
  try {
    const res = await fetch(`/api/assignments/${subjectId}/${assignmentIdx}/files`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = await res.json();
    currentAssignmentViewerData = { subjectId, assignmentIdx, files: files || [], entryFile };

    // Populate PHP file selector dropdown
    if (phpSelect) {
      const phpFiles = (files || []).filter(f => f.filename.toLowerCase().endsWith('.php'));
      if (phpFiles.length > 0) {
        phpSelect.innerHTML = phpFiles.map(f => `
          <option value="${f.filename}" ${f.filename === entryFile ? 'selected' : ''}>
            ${f.filename} ${f.filename === entryFile ? '(Mặc định)' : ''}
          </option>`).join('');
      } else {
        phpSelect.innerHTML = '<option value="">(Không tìm thấy file .php)</option>';
      }
    }

    renderCodeFileTabs(files || []);
    if (files && files.length > 0) {
      loadCodeFileContent(files[0].filename);
    } else {
      const codeBlock = document.getElementById('viewer-code-block');
      if (codeBlock) codeBlock.textContent = '// Chưa có file mã nguồn nào được lưu cho bài tập này.';
    }
  } catch (e) {
    console.error('Failed to load code files:', e);
    if (phpSelect) phpSelect.innerHTML = '<option value="">(Lỗi tải danh sách file)</option>';
    const codeBlock = document.getElementById('viewer-code-block');
    if (codeBlock) codeBlock.textContent = '// Lỗi khi tải danh sách file bài tập.';
  }

  switchViewerTab('preview');
}

function runSelectedPhpDemo() {
  const phpSelect = document.getElementById('viewer-php-file-select');
  const selectedFile = phpSelect ? phpSelect.value : '';

  if (!selectedFile) {
    alert('Vui lòng chọn 1 file .php trong danh sách để chạy demo!');
    return;
  }

  const { subjectId, assignmentIdx } = currentAssignmentViewerData;
  const iframe = document.getElementById('viewer-iframe');
  if (!iframe) return;

  iframe.removeAttribute('srcdoc');
  iframe.src = `/preview/${subjectId}/${assignmentIdx}/${encodeURIComponent(selectedFile)}`;
}

function switchViewerTab(tab) {
  const previewContent = document.getElementById('tab-preview-content');
  const codeContent = document.getElementById('tab-code-content');
  const btnPreview = document.getElementById('btn-tab-preview');
  const btnCode = document.getElementById('btn-tab-code');

  if (tab === 'preview') {
    previewContent.classList.remove('hidden');
    codeContent.classList.add('hidden');
    btnPreview.className = 'px-3 py-1 rounded-md font-semibold text-sky-400 bg-sky-500/10';
    btnCode.className = 'px-3 py-1 rounded-md font-semibold text-muted hover:text-primary';
  } else {
    previewContent.classList.add('hidden');
    codeContent.classList.remove('hidden');
    btnCode.className = 'px-3 py-1 rounded-md font-semibold text-sky-400 bg-sky-500/10';
    btnPreview.className = 'px-3 py-1 rounded-md font-semibold text-muted hover:text-primary';
  }
}

function renderCodeFileTabs(files) {
  const tabsContainer = document.getElementById('code-file-tabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = files.map((f, i) => `
    <button onclick="loadCodeFileContent('${f.filename.replace(/'/g, "\\'")}')" class="tab-file-btn px-2.5 py-1 rounded font-mono text-[11px] ${i === 0 ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'}">
      ${f.filename}
    </button>`).join('');
}

async function loadCodeFileContent(filename) {
  const { subjectId, assignmentIdx } = currentAssignmentViewerData;
  const codeBlock = document.getElementById('viewer-code-block');
  if (!codeBlock) return;

  rawTextMode = false;
  const rawBtn = document.getElementById('btn-toggle-raw');
  if (rawBtn) { rawBtn.textContent = 'Raw Text'; rawBtn.classList.remove('bg-amber-500/20'); rawBtn.classList.add('bg-slate-800'); }

  // Highlight active tab
  document.querySelectorAll('.tab-file-btn').forEach(btn => {
    if (btn.textContent.trim() === filename) {
      btn.className = 'tab-file-btn px-2.5 py-1 rounded font-mono text-[11px] bg-sky-500/20 text-sky-400 font-bold';
    } else {
      btn.className = 'tab-file-btn px-2.5 py-1 rounded font-mono text-[11px] text-slate-400 hover:text-white';
    }
  });

  codeBlock.textContent = 'Đang tải mã nguồn...';

  try {
    const res = await fetch(`/api/assignments/${subjectId}/${assignmentIdx}/files/${encodeURIComponent(filename)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      codeBlock.textContent = `// Lỗi: ${errData.error || 'Không thể đọc nội dung file'}`;
      currentCodeContent = '';
      return;
    }
    const data = await res.json();

    // Handle binary files (docx, images, pdf)
    if (data.binary) {
      currentCodeContent = '';
      const ext = filename.split('.').pop().toLowerCase();
      let actionHtml = '';
      if (ext === 'docx') {
        actionHtml = `
          <div style="text-align:center; padding:40px 20px; color:#94a3b8; font-family:system-ui,sans-serif;">
            <div style="font-size:48px; margin-bottom:16px;">📄</div>
            <h3 style="color:#f1f5f9; margin-bottom:8px; font-size:16px;">File Word: ${filename}</h3>
            <p style="font-size:13px; margin-bottom:20px;">File .docx không thể hiển thị dưới dạng code.</p>
            <a href="${data.url}" download style="display:inline-block; padding:8px 20px; background:#0ea5e9; color:white; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600; margin:4px;">⬇ Tải về .docx</a>
            <button onclick="openDocxViewer('${data.url}', '${filename.replace(/'/g, "\\'")}')" style="display:inline-block; padding:8px 20px; background:#f59e0b; color:white; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:600; margin:4px;">👁 Xem bằng trình duyệt</button>
          </div>`;
      } else {
        actionHtml = `
          <div style="text-align:center; padding:40px 20px; color:#94a3b8; font-family:system-ui,sans-serif;">
            <div style="font-size:48px; margin-bottom:16px;">🖼️</div>
            <h3 style="color:#f1f5f9; margin-bottom:8px; font-size:16px;">File: ${filename}</h3>
            <p style="font-size:13px; margin-bottom:20px;">File nhị phân không thể hiển thị dưới dạng code.</p>
            <a href="${data.url}" download style="display:inline-block; padding:8px 20px; background:#0ea5e9; color:white; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600;">⬇ Tải về</a>
          </div>`;
      }
      codeBlock.innerHTML = actionHtml;
      codeBlock.className = '';
      return;
    }

    currentCodeContent = data.content !== undefined ? data.content : '// File rỗng';
    codeBlock.textContent = currentCodeContent;

    if (window.Prism) {
      const ext = filename.split('.').pop().toLowerCase();
      let lang = 'php';
      if (['js', 'json', 'css', 'html'].includes(ext)) lang = ext;
      codeBlock.className = `language-${lang}`;
      Prism.highlightElement(codeBlock);
    }
  } catch (e) {
    codeBlock.textContent = '// Lỗi mạng khi kết nối tới máy chủ.';
    currentCodeContent = '';
  }
}

function toggleRawText() {
  const codeBlock = document.getElementById('viewer-code-block');
  const rawBtn = document.getElementById('btn-toggle-raw');
  if (!codeBlock || !currentCodeContent) return;

  rawTextMode = !rawTextMode;

  if (rawTextMode) {
    codeBlock.className = '';
    codeBlock.textContent = currentCodeContent;
    if (rawBtn) { rawBtn.textContent = 'Syntax Highlight'; rawBtn.classList.add('bg-amber-500/20'); rawBtn.classList.remove('bg-slate-800'); }
  } else {
    codeBlock.textContent = currentCodeContent;
    if (window.Prism) {
      const filename = document.querySelector('.tab-file-btn.font-bold')?.textContent?.trim() || '';
      const ext = filename.split('.').pop().toLowerCase();
      let lang = 'php';
      if (['js', 'json', 'css', 'html'].includes(ext)) lang = ext;
      codeBlock.className = `language-${lang}`;
      Prism.highlightElement(codeBlock);
    }
    if (rawBtn) { rawBtn.textContent = 'Raw Text'; rawBtn.classList.remove('bg-amber-500/20'); rawBtn.classList.add('bg-slate-800'); }
  }
}

function copyCurrentCode() {
  const codeBlock = document.getElementById('viewer-code-block');
  const text = currentCodeContent || (codeBlock && codeBlock.textContent);
  if (text) {
    navigator.clipboard.writeText(text);
    showToast('Đã copy mã nguồn!', 'success');
  }
}

function closeViewerModal() {
  const modal = document.getElementById('modal-assignment-viewer');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('viewer-iframe').src = 'about:blank';
  }
}

/* ---- DOCX Word Document Viewer Modal Functions ---- */
async function openDocxViewer(docxUrl, title) {
  const modal = document.getElementById('modal-docx-viewer');
  const container = document.getElementById('docx-container');
  const titleEl = document.getElementById('modal-docx-title');
  const downloadBtn = document.getElementById('btn-download-docx');

  if (!modal || !container) return;

  titleEl.textContent = `Báo cáo: ${title}`;
  downloadBtn.href = docxUrl;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  container.innerHTML = '<p class="text-center text-gray-500 italic py-10">Đang tải và render tài liệu Word (.docx)...</p>';

  try {
    const response = await fetch(docxUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();

    container.innerHTML = '';
    if (window.docx) {
      await window.docx.renderAsync(blob, container);
    } else {
      container.innerHTML = `<div class="p-6 text-center text-red-500">Thư viện docx-preview chưa sẵn sàng. Vui lòng bấm nút Tải về để xem file Word.</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-red-500">Không thể render file Word: ${err.message}. Vui lòng bấm nút Tải về.</div>`;
  }
}

function closeDocxModal() {
  const modal = document.getElementById('modal-docx-viewer');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/* ---- Contact Form ---- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd.entries());
    if (!d.name?.trim() || !d.email?.trim() || !d.message?.trim()) { showToast('Vui lòng điền đầy đủ thông tin!', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) { showToast('Email không hợp lệ!', 'error'); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Đang gửi...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d)
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        showToast(result.message || 'Lời nhắn đã được gửi thành công!', 'success');
        e.target.reset();
      } else {
        showToast(result.error || 'Có lỗi xảy ra khi gửi tin nhắn!', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối tới máy chủ API!', 'error');
    } finally {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  });
}

/* ---- Skill Bars ---- */
function initSkillBars() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-fill').forEach(bar => { bar.style.width = bar.dataset.width; });
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  observer.observe(document.getElementById('skill-bars'));
}

/* ---- Toast ---- */
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}

/* ---- Utils ---- */
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
