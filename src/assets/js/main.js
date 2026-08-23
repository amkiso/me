/* ============================================
   PORTFOLIO - Main JavaScript (Public pages)
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initActiveNav();
  initScrollAnimations();
  initAdminSecretTriggers(); // Kích hoạt phím tắt & lối vào Admin ẩn

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
    const res = await fetch('./data/subjects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const subjects = await res.json();
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
                    <h3 class="text-sm font-semibold text-primary">${a.title}</h3>
                    <p class="text-xs text-muted mt-0.5">Thực hành & kiểm định source code</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center">
                  ${a.github_url ? `
                    <a href="${a.github_url}" target="_blank" rel="noopener" class="btn-outline px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:border-sky-500 hover:text-sky-500 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      Source Code
                    </a>` : ''}
                  ${a.demo_url ? `
                    <a href="${a.demo_url}" target="_blank" rel="noopener" class="btn-primary px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      Xem Live Demo
                    </a>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

  } catch (err) {
    container.innerHTML = `
      <div class="card p-8 text-center">
        <h2 class="text-lg font-bold text-primary mb-2">Không thể tải thông tin môn học</h2>
        <p class="text-sm text-muted mb-4">${err.message}</p>
        <a href="courses.html" class="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium">Thử lại</a>
      </div>`;
  }
}

/* ---- Contact Form ---- */
function initContactForm() {
  document.getElementById('contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd.entries());
    if (!d.name?.trim() || !d.email?.trim() || !d.message?.trim()) { showToast('Vui lòng điền đầy đủ!', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { showToast('Email không hợp lệ!', 'error'); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = 'Đang gửi...'; btn.disabled = true;
    setTimeout(() => { showToast('Lời nhắn đã được gửi tới Vũ!', 'success'); e.target.reset(); btn.innerHTML = orig; btn.disabled = false; }, 1200);
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
