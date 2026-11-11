// Shell halaman sidebar (welcome.html & calendar.html): adaptasi dari origin/FE:assets/js/app.js
// yang terhubung penuh ke backend PHP REST API (/api/*).
import { api, errorText } from './api.js';
import { packDescription, unpackMeta, DEFAULT_DUE_DAYS } from './meta.js';
import { GROUPS, loadPrefs, savePrefs, permission, testNotification, startNotifier } from './notify.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = (n) => String(n ?? 'U').trim().slice(0, 2).toUpperCase();
const COLORS = ['#6fd3f7', '#b08060', '#12c4cf', '#f3b95f', '#a78bfa'];
const colorOf = (u) => COLORS[[...String(u ?? 'U')].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];

const STATUS_KEYS = ['idea', 'todo', 'in_progress', 'needs_review', 'done'];
const STATUS_LABEL = { idea: 'Idea', todo: 'Todo', in_progress: 'In Progress', needs_review: 'Needs Review', done: 'Done' };

const T0 = new Date();
T0.setHours(0, 0, 0, 0);

const parseDate = (s) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDays = (n) => {
  const d = new Date(T0);
  d.setDate(d.getDate() + n);
  return fmtDate(d);
};
const diffDays = (s) => Math.round((parseDate(s) - T0) / 864e5);

// Tenggat dibaca dari field dueDate (kolom database). Target & Raised By masih di penanda deskripsi.
function unpackTask(dto, fallbackBy = 'Tim') {
  const { text, meta } = unpackMeta(dto.description);
  return {
    id: dto.displayId,
    displayId: dto.displayId,
    t: dto.title,
    d: text,
    due: dto.dueDate || null,
    to: meta.to || dto.assigneeName || dto.assigneeUsername || 'Semua tim',
    by: meta.by || fallbackBy,
    status: dto.status,
    updatedAt: dto.updatedAt || dto.createdAt || Date.now(),
  };
}

const SEED_TASKS = [
  {
    t: 'Jobsheet 1 - Pengumpulan Proposal',
    d: 'Kumpulkan proposal final beserta lampiran pembagian tugas ke dosen pembina melalui e-learning. Pastikan semua anggota sudah memeriksa hasilnya sebelum dikirim.',
    due: plusDays(-10),
    to: 'Dosen Pembina',
    by: 'Fadila',
    st: 'done',
    status: 'done',
    priority: 'medium',
  },
  {
    t: 'Jobsheet 2 - Rancangan UI UX',
    d: 'Selesaikan wireframe dan prototype di Figma untuk halaman login, welcome, dan to-do list. Pastikan semua anggota sudah memeriksa hasilnya sebelum dikirim.',
    due: plusDays(-5),
    to: 'Dosen Pembina',
    by: 'Fadila',
    st: 'done',
    status: 'done',
    priority: 'medium',
  },
  {
    t: 'Jobsheet 3 - Rancangan Frontend dan Backend',
    d: 'Susun struktur folder, daftar endpoint API, dan skema database awal. Sertakan diagram alur data sederhana.',
    due: plusDays(2),
    to: 'Dosen Pembina',
    by: 'Hamas',
    status: 'todo',
    priority: 'urgent',
  },
  {
    t: 'Jobsheet 4 - Kesimpulan',
    d: 'Tulis kesimpulan dan saran pengembangan.',
    due: plusDays(12),
    to: 'Dosen Pembina',
    by: 'Fadila',
    status: 'in_progress',
    priority: 'medium',
  },
  {
    t: 'Revisi Laporan Bab 3',
    d: 'Perbaiki metodologi sesuai catatan dosen.',
    due: plusDays(-2),
    to: 'Erhan',
    by: 'Rasyiq',
    status: 'todo',
    priority: 'high',
  },
  {
    t: 'Integrasi & Deploy Aplikasi DoTo',
    d: 'Pastikan alur login, welcome, to-do list, Kanban board, dan asisten AI berjalan penuh di server.',
    due: plusDays(1),
    to: 'Semua tim',
    by: 'Hamas',
    status: 'todo',
    priority: 'urgent',
  },
];

let currentUser = null;
const urlParams = new URLSearchParams(location.search);
let requestedKey = (urlParams.get('key') || '').trim().toUpperCase();
let allProjects = [];
let activeProject = { key: requestedKey || 'K4', name: 'Kelompok 4 PBL' };
let defaultSegmentName = 'To Do';
let tasks = [];
let projectMembers = [];
let myTasks = []; // tugas yang ditujukan ke user yang login (semua proyek)

async function ensureProjectAndTasks() {
  let projects = await api.get('/projects');
  let k4 = projects.find((p) => p.key === 'K4');

  if (!k4) {
    try {
      k4 = await api.post('/projects', { key: 'K4', name: 'Kelompok 4 PBL' });
      projects = await api.get('/projects');
    } catch {
      k4 = projects[0] || null;
    }
  }
  allProjects = projects;
  const target = (requestedKey && projects.find((p) => p.key.toUpperCase() === requestedKey)) || k4 || projects[0];
  if (!target) return;
  activeProject = target;
  const pk = encodeURIComponent(activeProject.key);

  let board = await api.get(`/projects/${pk}/board?includeArchived=true`);
  if (!board.segments || board.segments.length === 0) {
    await api.post(`/projects/${pk}/segments`, { name: 'To Do' });
    board = await api.get(`/projects/${pk}/board?includeArchived=true`);
  }

  defaultSegmentName = board.segments[0]?.segment?.name || 'To Do';
  const existingTasks = board.segments.flatMap((s) => s.tasks || []);

  if (existingTasks.length === 0 && activeProject.key === 'K4') {
    for (const item of SEED_TASKS) {
      // Backend menolak membuat tugas langsung berstatus done: buat aktif dulu, lalu ubah status.
      const created = await api.post(`/projects/${pk}/tasks`, {
        segmentName: defaultSegmentName,
        title: item.t,
        description: packDescription(item.d, { to: item.to, by: item.by }),
        dueDate: item.due,
        status: item.status === 'done' ? 'todo' : item.status,
        priority: item.priority,
        tags: ['mandatory'],
      });
      if (item.status === 'done') await api.patch(`/tasks/${encodeURIComponent(created.displayId)}/status`, { status: 'done' });
    }
    board = await api.get(`/projects/${pk}/board?includeArchived=true`);
  }

  try {
    projectMembers = await api.get(`/projects/${pk}/members`);
  } catch {
    projectMembers = [];
  }

  tasks = board.segments.flatMap((s) => s.tasks || []).map((dto) => unpackTask(dto, currentUser?.username || 'Tim'));
  document.dispatchEvent(new CustomEvent('doto:tasks-changed'));
}

const targetNames = () => ['Dosen Pembina', 'Semua tim', ...projectMembers.map((m) => m.name || m.username)];

// Milik user = Target (tujuan penugasan) sama dengan username/nama akun yang login.
// Target "Semua tim" TIDAK dihitung; tugas tanpa Target memakai penanggung jawab (assignee).
async function loadMine() {
  const all = await api.get('/tasks/search?includeArchived=true');
  const keys = [currentUser?.username, currentUser?.name].filter(Boolean).map((x) => String(x).toLowerCase());
  myTasks = all
    .map((d) => ({ ...unpackTask(d), projectId: d.projectId }))
    .filter((t) => {
      return keys.includes(String(t.to).toLowerCase());
    });
}

const DotoTasks = {
  loadMine,
  mine: () => myTasks,
  list: () => tasks,
  counts: () => {
    const c = { idea: 0, todo: 0, in_progress: 0, needs_review: 0, done: 0 };
    tasks.forEach((t) => {
      if (c[t.status] !== undefined) c[t.status]++;
    });
    return c;
  },
  add: async (o) => {
    await api.post(`/projects/${encodeURIComponent(activeProject.key)}/tasks`, {
      segmentName: defaultSegmentName,
      title: o.t,
      description: packDescription(o.d || '', { to: o.to || 'Semua tim', by: o.by || currentUser?.username || 'Tim' }),
      dueDate: o.due || plusDays(DEFAULT_DUE_DAYS), // default tenggat 2 minggu
      status: 'todo',
      priority: 'medium',
      tags: ['mandatory'],
    });
    await ensureProjectAndTasks();
  },
};

window.DotoTasks = DotoTasks;

function buildSidebar() {
  return `<aside class="side">
    <div class="logo">
      <svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fe3f0"/><stop offset=".55" stop-color="#3a8be6"/><stop offset="1" stop-color="#6a3fa8"/></linearGradient></defs><rect x="2" y="2" width="36" height="36" rx="11" fill="url(#lg)"/><path d="M14 10h7a10 10 0 0 1 0 20h-7z" fill="#0f1e3d" opacity=".85"/><path d="M18 15l7 5-7 5z" fill="#fff"/></svg>
      <div class="lbl"><b>Doto</b><small>Manajemen Tugas Tim &amp; Agen AI</small></div>
    </div>

    <button class="user" id="userBtn" aria-expanded="false" aria-controls="menu" title="Akun">
      <span class="av" id="avMain">UP</span>
      <span class="who lbl"><b id="nmMain">User Pengguna</b><small id="emMain"></small></span>
      <svg class="chev hide-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>
    </button>

    <nav aria-label="Menu utama">
      <button class="item" data-nav="dashboard" title="Dashboard Proyek"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg><span class="lbl">Dashboard Proyek</span></button>
      <button class="item" data-nav="tugas" title="Daftar Tugas (Projects)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/></svg><span class="lbl">Daftar Tugas</span></button>
      <button class="item" data-nav="tim" title="Tokens &amp; Integrasi"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="4"/><path d="M1 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/><circle cx="17" cy="8.5" r="3" opacity=".7"/><path d="M18 14.2c3 .4 5 2.3 5 5.8h-4.5c0-2.4-.3-4.2-.5-5.8z" opacity=".7"/></svg><span class="lbl">API Tokens</span></button>
      <button class="item" data-nav="ai" title="Agen AI"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v3h-2z"/><circle cx="12" cy="2.5" r="1.5"/><path d="M5 6h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"/><circle cx="8.5" cy="12" r="2" fill="#fff"/><circle cx="15.5" cy="12" r="2" fill="#fff"/><rect x="8" y="16" width="8" height="2" rx="1" fill="#fff"/></svg><span class="lbl">Agen AI</span></button>
    </nav>

    <section class="projects hide-c" aria-label="Projects" id="sidebarProjects">
      <h2>Projects</h2>
      <div id="projectListNav">
        <div class="prow">
          <button class="proj" id="p4" aria-expanded="false" aria-controls="p4sub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg><span id="activeProjName">Kelompok 4 PBL</span></button>
          <button class="add" id="addBtn" aria-label="Tambah tugas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Tambah tugas</span></button>
        </div>
        <ul class="psub sublist" id="p4sub" hidden>
          <li><button class="subi" data-sub="calendar">Calendar</button></li>
          <li><button class="subi" data-sub="board">Kanban Board</button></li>
          <li><button class="subi" data-sub="ai">Asisten AI</button></li>
        </ul>
      </div>
      <div id="otherProjectsNav"></div>
    </section>

    <div class="foot">
      <button class="item" id="settingsBtn" title="Settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span class="lbl">Settings</span></button>
      <button class="item" id="collapse" aria-label="Collapse sidebar" title="Collapse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg><span class="lbl" id="collapseLbl">Collapse</span></button>
    </div>

    <div class="menu" id="menu" hidden role="menu"></div>
  </aside>`;
}

const MODAL = `<div class="scrim" id="scrim" hidden>
  <form class="modal glass" id="taskForm" novalidate role="dialog" aria-modal="true" aria-labelledby="mt">
    <h3 id="mt">Tambah tugas</h3>
    <p class="sub2">Proyek: Kelompok 4 PBL. Tersimpan langsung di database Doto.</p>
    <div class="field"><label for="tt">Judul tugas</label><input id="tt" aria-describedby="ett"><p class="error" id="ett"></p></div>
    <div class="field"><label for="td">Deskripsi</label><textarea id="td"></textarea></div>
    <div class="row2">
      <div class="field"><label for="tdue">Tenggat</label><input id="tdue" type="date"></div>
      <div class="field"><label for="ttg">Target</label><select id="ttg"></select></div>
    </div>
    <div class="mact"><button type="button" class="wb" id="cancel">Batal</button><button type="submit" class="wb pri" id="taskSubmitBtn">Tambah tugas</button></div>
  </form>
</div>
<div class="toast" id="toast" role="status"></div>`;

async function init() {
  const root = $('app');
  if (!root) return;

  try {
    currentUser = await api.get('/me');
    startNotifier(currentUser); // notifikasi browser sesuai Settings > Notification
  } catch (err) {
    if (err?.status === 401) {
      location.replace('login.html');
      return;
    }
    throw err;
  }

  root.insertAdjacentHTML('afterbegin', buildSidebar());
  document.body.insertAdjacentHTML('beforeend', MODAL);

  const COL = 'doto_collapsed';
  const ROUTES = {
    dashboard: 'welcome.html',
    tugas: 'projects.html',
    tim: 'tokens.html',
    ai: 'ai.html',
  };

  const read = (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  };

  let tt;
  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('on'), 2600);
  }

  function renderAccount() {
    if (!currentUser) return;
    const uname = currentUser.username || 'User';
    const uemail = currentUser.email || '';
    let photo = currentUser.avatarUrl || '';
    if (!photo) {
      try {
        photo = localStorage.getItem(`doto-photo:${currentUser.id}`) || '';
      } catch {
        /* abaikan */
      }
    }
    $('avMain').textContent = photo ? '' : ini(uname);
    $('avMain').style.background = photo ? `center / cover url(${photo})` : colorOf(uname);
    $('nmMain').textContent = uname;
    $('emMain').textContent = uemail;

    $('menu').innerHTML =
      `<div class="acc"><span class="av" style="background:${colorOf(uname)}">${esc(ini(uname))}</span><span class="who"><b>${esc(uname)}</b><small>${esc(uemail)}</small></span><button class="chip btnx" data-act="logout">Logout</button></div>` +
      `<div class="sep"></div>
       <button class="mi" data-act="projects"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4z"/></svg>Buka Semua Proyek (Kanban)</button>
       <button class="mi" data-act="logoutAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout dari sesi ini</button>`;
    document.dispatchEvent(new CustomEvent('doto:user-changed'));
  }

  const menu = $('menu');
  const ub = $('userBtn');
  const setMenu = (on) => {
    menu.hidden = !on;
    ub.setAttribute('aria-expanded', String(on));
  };
  ub.onclick = (e) => {
    e.stopPropagation();
    setMenu(menu.hidden);
  };
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target)) setMenu(false);
  });
  menu.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'logout' || act === 'logoutAll') {
      await api.post('/auth/logout');
      window.dotoGo('login.html');
    } else if (act === 'projects') {
      window.dotoGo('projects.html');
    }
  });

  function setCollapsed(c) {
    root.classList.toggle('collapsed', c);
    write(COL, c);
    setMenu(false);
    $('collapse').setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar');
    $('collapse').title = c ? 'Expand' : 'Collapse';
    $('collapseLbl').textContent = 'Collapse';
  }
  $('collapse').onclick = () => setCollapsed(!root.classList.contains('collapsed'));
  $('settingsBtn').onclick = () => { if (!/settings\.html$/i.test(location.pathname)) window.dotoGo('settings.html'); };
  setCollapsed(read(COL, innerWidth < 760));

  document.querySelectorAll('[data-nav]').forEach((b) => {
    b.onclick = () => {
      const to = ROUTES[b.dataset.nav];
      if (to) window.dotoGo(to);
      else toast(`${b.title} belum tersedia.`);
    };
  });

  $('p4').onclick = () => {
    const o = $('p4').getAttribute('aria-expanded') === 'true';
    $('p4').setAttribute('aria-expanded', String(!o));
    $('p4sub').hidden = o;
  };
  document.querySelectorAll('[data-dummy]').forEach((b) => {
    b.onclick = () => toast('Project contoh. Klik Daftar Tugas untuk mengelola semua proyek.');
  });

  // Modal tambah tugas
  const scrim = $('scrim');
  const tf = $('taskForm');
  const openM = () => {
    scrim.hidden = false;
    if (!$('tdue').value) $('tdue').value = plusDays(DEFAULT_DUE_DAYS);
    $('tt').focus();
  };
  const closeM = () => {
    scrim.hidden = true;
    tf.reset();
    $('ett').textContent = '';
    $('tt').removeAttribute('aria-invalid');
    $('addBtn').focus();
  };
  $('addBtn').onclick = openM;
  $('cancel').onclick = closeM;
  scrim.addEventListener('mousedown', (e) => {
    if (e.target === scrim) closeM();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!scrim.hidden) closeM();
      else setMenu(false);
    }
  });
  const fillTargets = () => {
    $('ttg').innerHTML = targetNames().map((n) => `<option>${esc(n)}</option>`).join('');
  };
  fillTargets();

  tf.onsubmit = async (e) => {
    e.preventDefault();
    const title = $('tt').value.trim();
    if (!title) {
      $('tt').setAttribute('aria-invalid', 'true');
      $('ett').textContent = 'Isi judul tugas.';
      $('tt').focus();
      return;
    }
    const submitBtn = $('taskSubmitBtn');
    submitBtn.disabled = true;
    try {
      await DotoTasks.add({
        t: title,
        d: $('td').value.trim(),
        due: $('tdue').value,
        to: $('ttg').value,
        by: currentUser?.username || 'Tim',
      });
      closeM();
      toast(`Tugas ditambahkan ke ${activeProject.name}.`);
    } catch (err) {
      $('ett').textContent = errorText(err);
    } finally {
      submitBtn.disabled = false;
    }
  };

  const logo = document.querySelector('.logo');
  logo.setAttribute('role', 'link');
  logo.tabIndex = 0;
  logo.title = 'Ke halaman Welcome';
  logo.onclick = () => {
    window.dotoGo(ROUTES.dashboard);
  };
  logo.onkeydown = (e) => {
    if (e.key === 'Enter') logo.onclick();
  };

  document.querySelectorAll('[data-sub]').forEach((b) => {
    b.onclick = () => {
      const sub = b.dataset.sub;
      if (sub === 'calendar') {
        window.dotoGo(`calendar.html?key=${encodeURIComponent(activeProject.key)}`);
      } else if (sub === 'board') {
        window.dotoGo(`board.html?key=${encodeURIComponent(activeProject.key)}`);
      } else if (sub === 'ai') {
        window.dotoGo('ai.html');
      }
    };
  });

  window.Doto = { $, read, write, esc, colorOf, toast, me: () => currentUser?.username || 'Users' };
  renderAccount();
  document.addEventListener('doto:user-changed', renderAccount);

  await ensureProjectAndTasks();
  fillTargets();

  if ($('activeProjName')) $('activeProjName').textContent = activeProject.name;
  const otherNav = $('otherProjectsNav');
  if (otherNav) {
    const others = allProjects.filter((p) => p.key !== activeProject.key);
    otherNav.innerHTML = others
      .map(
        (p) =>
          `<div class="prow"><button class="proj" data-proj-key="${esc(p.key)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>${esc(p.name)}</button></div>`
      )
      .join('');
    otherNav.querySelectorAll('[data-proj-key]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.projKey;
        const page = 'welcome.html';
        window.dotoGo(`${page}?key=${encodeURIComponent(k)}`);
      };
    });
  }

  initWelcomePage();
  initSettingsPage();
  initProfilePage();
  initNotificationsPage();
  initSecurityPage();
}

function initWelcomePage() {
  if (!$('hello')) return;
  const { toast, me, esc } = window.Doto; // jangan ikut mendestruktur `$`: bikin $('hello') di atas kena TDZ
  const greet = () => {
    $('hello').textContent = me();
  };
  greet();
  document.addEventListener('doto:user-changed', greet);
  $('bell').onclick = () => toast('Semua sistem & database terhubung aktif.');

  const dash = $('welcomeDash');
  if (!dash) return;

  function renderDash() {
    const mine = DotoTasks.mine();
    const c = { idea: 0, todo: 0, in_progress: 0, needs_review: 0, done: 0 };
    mine.forEach((t) => {
      if (c[t.status] !== undefined) c[t.status]++;
    });
    const total = mine.length;
    const pct = total ? Math.round((c.done / total) * 100) : 0;
    const k = encodeURIComponent(activeProject.key);
    const per = allProjects
      .map((p) => {
        const ts = mine.filter((t) => t.projectId === p.id);
        return { p, n: ts.length, d: ts.filter((t) => t.status === 'done').length };
      })
      .filter((x) => x.n > 0);
    dash.innerHTML = `
      <section class="stats five" style="margin-top:24px">
        ${STATUS_KEYS.map((s) => `<div class="stat s-${s}"><b>${c[s]}</b><span>${STATUS_LABEL[s]}</span></div>`).join('')}
      </section>
      <div class="prog"><div class="track"><div class="fill" style="width:${pct}%"></div></div><span>${pct}% selesai · ${c.done} dari ${total} tugas untukmu</span></div>
      <section class="mine" aria-label="Progress per proyek">
        <h3>Progress per proyek</h3>
        ${per.length ? per.map(({ p, n, d }) => `<a class="mine-row" href="board.html?key=${encodeURIComponent(p.key)}"><span class="mine-name">${esc(p.name)}</span><span class="mine-bar"><i style="width:${Math.round((d / n) * 100)}%"></i></span><span class="mine-num">${d}/${n}</span></a>`).join('') : '<p class="cal-empty">Belum ada tugas yang ditujukan untukmu.</p>'}
      </section>
      <div class="project-grid" style="margin-top:18px">
        <a class="project-card g2 lift" href="calendar.html?key=${k}">
          <span class="key">${esc(activeProject.key)}</span>
          <h3>${esc(activeProject.name)} — Calendar</h3>
          <p>Lihat tenggat tugas di kalender, jadwal terdekat, dan filter anggota tim →</p>
        </a>
        <a class="project-card g2 lift" href="board.html?key=${k}">
          <span class="key">${esc(activeProject.key)}</span>
          <h3>${esc(activeProject.name)} — Kanban Board</h3>
          <p>Kelola kolom segment, kartu tugas, dan riwayat aktivitas →</p>
        </a>
        <a class="project-card g2 lift" href="ai.html">
          <span class="key">AI</span>
          <h3>Asisten Agen AI</h3>
          <p>Buat task, ubah status/prioritas, dan ringkas board dengan persetujuan →</p>
        </a>
        <a class="project-card g2 lift" href="projects.html">
          <span class="key">ALL</span>
          <h3>Semua Proyek (${allProjects.length})</h3>
          <p>Kelola seluruh proyek tim dan pengaturan token API →</p>
        </a>
      </div>
    `;
  }
  const refresh = async () => {
    try {
      await DotoTasks.loadMine();
    } catch (err) {
      console.error(err);
    }
    renderDash();
  };
  refresh();
  document.addEventListener('doto:tasks-changed', refresh);
}

// Halaman Profile (Settings > Profile): data profil lewat PATCH /me, cek username/email lewat GET /users/check.
// Teks halaman mengikuti pilihan bahasa di Settings (localStorage "doto-lang"). Foto profil masih di localStorage.
// Halaman Settings > Notification: render dari GROUPS (notify.js), simpan otomatis per akun.
function initNotificationsPage() {
  if (!$('nfGrid')) return;
  const { toast } = window.Doto;
  const prefs = loadPrefs(currentUser.id);
  const S = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
    tasks: `<svg ${S}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/></svg>`,
    deadline: `<svg ${S}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    comments: `<svg ${S}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>`,
    team: `<svg ${S}><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M18 14.5a5.5 5.5 0 0 1 4 5.5"/></svg>`,
    ai: `<svg ${S}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>`,
  };
  const sw = (id, on, label) => `<button type="button" class="nf-sw" role="switch" aria-checked="${on}" aria-label="${label}" data-id="${id}"><i></i></button>`;
  const grp = (gr) => `<section class="nf-grp${prefs.g[gr.id] ? '' : ' off'}" data-g="${gr.id}">
      <header><span class="nf-ico">${ICON[gr.id]}</span><div><h2>${gr.title}</h2><small>${gr.sub}</small></div>${sw(`g:${gr.id}`, prefs.g[gr.id], gr.title)}</header>
      <ul>${gr.items.map((it) => `<li><span class="nf-dot"></span><span class="nf-lbl">${it.label}</span>${sw(`i:${it.k}`, prefs.i[it.k], it.label)}</li>`).join('')}</ul></section>`;
  $('nfLeft').innerHTML = GROUPS.slice(0, 3).map(grp).join('');
  $('nfRight').innerHTML = GROUPS.slice(3).map(grp).join('');

  $('nfGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.nf-sw');
    if (!b) return;
    const [type, id] = b.dataset.id.split(':');
    const section = b.closest('.nf-grp');
    if (type === 'i' && !prefs.g[section.dataset.g]) return; // grup sedang dimatikan
    const v = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(v));
    (type === 'g' ? prefs.g : prefs.i)[id] = v;
    if (type === 'g') section.classList.toggle('off', !v);
    savePrefs(currentUser.id, prefs);
    if (v && permission() === 'default') toast('Izinkan notifikasi browser dulu agar pengingat muncul.');
  });

  // Izin Chrome: tanpa "granted" tidak ada notifikasi yang bisa tampil
  const paintPerm = () => {
    const p = !window.isSecureContext && p0() !== 'granted' ? 'insecure' : p0();
    const T = {
      granted: 'Notifikasi browser aktif. Pengingat akan muncul sesuai pengaturan di bawah.',
      default: 'Browser belum mengizinkan notifikasi dari Doto. Aktifkan agar pengingat bisa muncul.',
      denied: 'Notifikasi diblokir di browser. Klik ikon gembok di address bar Chrome, ubah Notifications menjadi Allow, lalu muat ulang halaman.',
      insecure: 'Notifikasi browser hanya berjalan lewat https atau http://localhost (bukan file://).',
      unsupported: 'Browser ini tidak mendukung notifikasi.',
    };
    $('nfBanner').dataset.state = p;
    $('nfPermTxt').textContent = T[p];
    const showPerm = p === 'default';
    const showTest = p === 'granted';
    $('nfPermBtn').hidden = !showPerm;
    $('nfPermBtn').style.display = showPerm ? '' : 'none';
    $('nfTestBtn').hidden = !showTest;
    $('nfTestBtn').style.display = showTest ? '' : 'none';
  };
  const p0 = () => permission();
  $('nfPermBtn').onclick = async () => {
    try {
      await Notification.requestPermission();
    } catch {
      /* diabaikan */
    }
    paintPerm();
  };
  $('nfTestBtn').onclick = () => toast(testNotification() ? 'Notifikasi uji dikirim.' : 'Notifikasi uji gagal dikirim.');
  $('nfBell').onclick = () => toast('Pusat notifikasi di dalam aplikasi belum tersedia.');
  paintPerm();
}

const PF_I18N = {
  id: {
    title: 'Profil', sub: 'Lihat dan kelola informasi profil Anda',
    secA: 'A. Informasi Profil', secB: 'B. Informasi Pekerjaan', secC: 'C. Aksi Profil', photo: 'Ganti Foto',
    lName: 'Nama Lengkap', phName: 'Nama lengkap Anda', lUser: 'Username', phUser: 'huruf kecil, angka, titik, _',
    lMail: 'Email', phMail: 'nama@email.com', lRole: 'Role Pengguna (bidang keahlian)', phRole: 'Contoh: Engineer, Chef, Desainer...',
    lBio: 'Bio Singkat', phBio: 'Tulis sedikit tentang diri Anda...', lTeam: 'Nama Tim (tim utama)', lJoined: 'Tanggal Bergabung',
    lProjects: 'Daftar Proyek yang Diikuti (opsional)', bEdit: 'Edit Profil', bSave: 'Simpan Perubahan', bCancel: 'Batalkan',
    verifyBtn: 'Klik untuk verifikasi', verifyNote: 'Template email belum tersedia; tombol ini mensimulasikan klik tautan verifikasi.',
    verifyMsg: (e) => `Tautan verifikasi dikirim ke ${e}. Silakan cek Gmail/email Anda, lalu verifikasi.`, verified: 'Email berhasil diverifikasi.',
    needEdit: 'Klik "Edit Profil" terlebih dahulu jika ingin mengisi kolom ini.', autoJoined: 'Terisi otomatis oleh sistem.',
    nameReq: 'Nama lengkap wajib diisi (2–60 karakter).', userFmt: 'Username 3–15 karakter: huruf kecil, angka, titik, atau _ (tanpa spasi).',
    userTaken: 'Username sudah dipakai. Silakan ganti dengan yang lain.', mailFmt: 'Format email tidak valid.', mailTaken: 'Email sudah terdaftar di akun lain.',
    teamReq: 'Pilih tim utama Anda.', pickTeam: 'Pilih tim utama…', noTeam: 'Belum mengikuti tim', singleTeam: 'Hanya ada satu tim, jadi otomatis menjadi tim utama.',
    fixErrors: 'Periksa kolom yang berwarna merah.', saved: 'Profil berhasil disimpan.', cancelled: 'Perubahan dibatalkan.',
    saveFail: 'Gagal menyimpan foto: penyimpanan browser penuh.', photoNeedEdit: 'Klik Edit Profil dulu untuk mengganti foto.',
    photoBad: 'Pilih file gambar maksimal 5 MB.', photoErr: 'Gambar tidak bisa dibaca.', loadingProj: 'Memuat…', noProj: 'Belum mengikuti proyek.', code: 'Kode', kanban: 'Kanban', cal: 'Kalender',
  },
  en: {
    title: 'Profile', sub: 'View and manage your profile information',
    secA: 'A. Profile Information', secB: 'B. Work Information', secC: 'C. Profile Actions', photo: 'Change Photo',
    lName: 'Full Name', phName: 'Your full name', lUser: 'Username', phUser: 'lowercase letters, numbers, dot, _',
    lMail: 'Email', phMail: 'name@email.com', lRole: 'User Role (field of expertise)', phRole: 'e.g. Engineer, Chef, Designer...',
    lBio: 'Short Bio', phBio: 'Write a little about yourself...', lTeam: 'Team Name (main team)', lJoined: 'Joined Date',
    lProjects: 'Projects You Follow (optional)', bEdit: 'Edit Profile', bSave: 'Save Changes', bCancel: 'Cancel',
    verifyBtn: 'Click to verify', verifyNote: 'The email template is not ready yet; this button simulates clicking the verification link.',
    verifyMsg: (e) => `A verification link was sent to ${e}. Please check your inbox, then verify.`, verified: 'Email verified successfully.',
    needEdit: 'Click "Edit Profile" first if you want to fill in this field.', autoJoined: 'Filled in automatically by the system.',
    nameReq: 'Full name is required (2–60 characters).', userFmt: 'Username must be 3–15 characters: lowercase letters, numbers, dot, or _ (no spaces).',
    userTaken: 'This username is already taken. Please choose another one.', mailFmt: 'Invalid email format.', mailTaken: 'This email is already registered to another account.',
    teamReq: 'Please choose your main team.', pickTeam: 'Choose main team…', noTeam: 'Not in any team yet', singleTeam: 'There is only one team, so it is your main team automatically.',
    fixErrors: 'Please check the fields marked in red.', saved: 'Profile saved.', cancelled: 'Changes discarded.',
    saveFail: 'Could not save the photo: browser storage is full.', photoNeedEdit: 'Click Edit Profile first to change the photo.',
    photoBad: 'Choose an image file up to 5 MB.', photoErr: 'The image could not be read.', loadingProj: 'Loading…', noProj: 'Not following any project yet.', code: 'Code', kanban: 'Kanban', cal: 'Calendar',
  },
};

function initProfilePage() {
  if (!$('pfForm')) return;
  const { toast, esc, colorOf } = window.Doto;
  let lang = 'id';
  try {
    lang = localStorage.getItem('doto-lang') === 'en' ? 'en' : 'id';
  } catch {
    /* pakai default */
  }
  const tr = (k, ...a) => {
    const v = PF_I18N[lang][k] ?? PF_I18N.id[k] ?? k;
    return typeof v === 'function' ? v(...a) : v;
  };
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.placeholder = tr(el.dataset.i18nPh);
  });
  document.documentElement.lang = lang;

  const F = { name: 'pfName', user: 'pfUser', mail: 'pfMail', role: 'pfRole', bio: 'pfBio', team: 'pfTeam', joined: 'pfJoined' };
  const USER_RE = /^[a-z0-9._]{3,15}$/; // huruf kecil saja, 3–15 karakter
  const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let me = { ...currentUser };
  let editing = false;
  let draftPhoto; // undefined = foto tidak berubah
  let projects = []; // proyek yang diikuti: [{ p, joinedAt }]
  const taken = { user: false, mail: false };
  const timers = {};

  const dispName = () => (me.name && me.name !== me.username ? me.name : '');
  const photoKey = () => `doto-photo:${me.id}`;
  const getPhoto = () => {
    if (me.avatarUrl) return me.avatarUrl;
    try {
      return localStorage.getItem(photoKey()) || '';
    } catch {
      return '';
    }
  };
  const msg = (k, text, ok) => {
    const m = $(`${F[k]}-msg`);
    m.textContent = text || '';
    m.hidden = !text;
    m.classList.toggle('ok', Boolean(ok));
    $(F[k]).classList.toggle('bad', Boolean(text) && !ok);
  };
  const val = (k) => $(F[k]).value.trim();
  const paintAvatar = (photo) => {
    const av = $('pfAvatar');
    av.style.background = photo ? `center / cover url(${photo})` : colorOf(me.username);
    av.textContent = photo ? '' : String(dispName() || me.username).trim().slice(0, 2).toUpperCase();
  };
  const joinedOf = (key) => {
    const row = projects.find((r) => r.p.key === key);
    return row && row.joinedAt
      ? new Date(row.joinedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
  };
  function buildTeams() {
    const sel = $('pfTeam');
    sel.innerHTML = !projects.length
      ? `<option value="">${esc(tr('noTeam'))}</option>`
      : (projects.length > 1 ? `<option value="">${esc(tr('pickTeam'))}</option>` : '') + projects.map(({ p }) => `<option value="${esc(p.key)}">${esc(p.name)}</option>`).join('');
    sel.value = me.teamKey && projects.some((r) => r.p.key === me.teamKey) ? me.teamKey : projects.length === 1 ? projects[0].p.key : '';
    $('pfJoined').value = joinedOf(sel.value);
  }
  function showVerify() {
    $('pfVerify').hidden = me.emailVerified !== false;
    $('pfVerifyTxt').textContent = tr('verifyMsg', me.email);
  }
  function fill() {
    $('pfName').value = dispName();
    $('pfUser').value = me.username;
    $('pfMail').value = me.email || '';
    $('pfRole').value = me.role || '';
    $('pfBio').value = me.bio || '';
    $('pfCount').textContent = `${$('pfBio').value.length}/200`;
    buildTeams();
    paintAvatar(getPhoto());
    showVerify();
  }
  function setEditing(on) {
    editing = on;
    $('pfForm').classList.toggle('editing', on);
    ['name', 'user', 'mail', 'role', 'bio'].forEach((k) => {
      $(F[k]).readOnly = !on;
    });
    $('pfEdit').disabled = on;
    $('pfSave').disabled = !on;
    $('pfCancel').disabled = !on;
    Object.keys(F).forEach((k) => msg(k, ''));
  }

  // Validasi: kembalikan teks error atau ''
  function validate(k) {
    const v = val(k);
    if (k === 'name') return v.length >= 2 && v.length <= 60 ? '' : tr('nameReq');
    if (k === 'user') return USER_RE.test(v) ? '' : tr('userFmt');
    if (k === 'mail') return MAIL_RE.test(v) ? '' : tr('mailFmt');
    if (k === 'team') return projects.length > 1 && !v ? tr('teamReq') : '';
    return '';
  }
  async function available(kind, value) {
    try {
      return Boolean((await api.get(`/users/check?${kind}=${encodeURIComponent(value)}`)).available);
    } catch {
      return true; // gagal cek: biarkan server yang memutuskan saat menyimpan
    }
  }
  // Cek langsung saat mengetik (jeda 0,5 detik); hasilnya ikut memblokir tombol Simpan
  function live(k) {
    if (!editing) return;
    taken[k] = false;
    const err = validate(k);
    msg(k, err);
    clearTimeout(timers[k]);
    if (err || (k !== 'user' && k !== 'mail')) return;
    const v = val(k);
    if (v === (k === 'user' ? me.username : me.email)) return;
    timers[k] = setTimeout(async () => {
      const ok = await available(k === 'user' ? 'username' : 'email', v);
      if (val(k) !== v) return;
      taken[k] = !ok;
      msg(k, ok ? '' : tr(k === 'user' ? 'userTaken' : 'mailTaken'));
    }, 500);
  }

  // Kolom tidak bisa diisi sebelum "Edit Profil": pesan merah di bawah kolom yang disentuh
  Object.keys(F).forEach((k) => {
    ['focus', 'click', 'keydown'].forEach((ev) =>
      $(F[k]).addEventListener(ev, () => {
        if (!editing) msg(k, tr(k === 'joined' ? 'autoJoined' : 'needEdit'));
      })
    );
  });
  $('pfTeam').addEventListener('mousedown', (e) => {
    if (!editing || projects.length <= 1) {
      e.preventDefault();
      if (editing) msg('team', tr('singleTeam'), true);
    }
  });
  $('pfTeam').addEventListener('keydown', (e) => {
    if ((!editing || projects.length <= 1) && e.key !== 'Tab') e.preventDefault();
  });
  $('pfTeam').addEventListener('change', () => {
    $('pfJoined').value = joinedOf($('pfTeam').value);
    live('team');
  });
  $('pfUser').addEventListener('input', (e) => {
    const v = e.target.value.toLowerCase(); // username wajib huruf kecil
    if (v !== e.target.value) e.target.value = v;
    live('user');
  });
  $('pfMail').addEventListener('input', () => live('mail'));
  $('pfName').addEventListener('input', () => live('name'));
  $('pfBio').addEventListener('input', () => {
    $('pfCount').textContent = `${$('pfBio').value.length}/200`;
  });

  $('pfForm').onsubmit = (e) => e.preventDefault();
  $('pfEdit').onclick = () => {
    setEditing(true);
    $('pfName').focus();
  };
  // Batalkan: kembali ke data tersimpan terakhir (isian yang belum disimpan dibuang)
  $('pfCancel').onclick = () => {
    draftPhoto = undefined;
    fill();
    setEditing(false);
    toast(tr('cancelled'));
  };
  $('pfSave').onclick = async () => {
    let bad = false;
    ['name', 'user', 'mail', 'team'].forEach((k) => {
      const err = validate(k) || (taken[k] ? tr(k === 'user' ? 'userTaken' : 'mailTaken') : '');
      msg(k, err);
      if (err) bad = true;
    });
    if (bad) {
      toast(tr('fixErrors'));
      return;
    }
    const body = {};
    if (val('name') !== dispName()) body.name = val('name');
    if (val('user') !== me.username) body.username = val('user');
    if (val('mail') !== me.email) body.email = val('mail');
    if (val('role') !== (me.role || '')) body.role = val('role');
    if (val('bio') !== (me.bio || '')) body.bio = val('bio');
    if ((val('team') || null) !== (me.teamKey || null)) body.teamKey = val('team') || null;
    if (draftPhoto !== undefined) body.avatarUrl = draftPhoto;
    try {
      if (Object.keys(body).length) me = await api.patch('/me', body);
    } catch (err) {
      if (err.status === 409) msg(/username/i.test(err.message) ? 'user' : 'mail', tr(/username/i.test(err.message) ? 'userTaken' : 'mailTaken'));
      else toast(errorText(err));
      return;
    }
    if (draftPhoto !== undefined) {
      try {
        localStorage.setItem(photoKey(), draftPhoto);
      } catch {
        /* abaikan bila localStorage penuh karena sudah tersimpan di server */
      }
      draftPhoto = undefined;
    }
    currentUser = { ...currentUser, ...me };
    document.dispatchEvent(new CustomEvent('doto:user-changed')); // sidebar ikut diperbarui
    fill();
    setEditing(false);
    toast(tr('saved'));
  };
  $('pfVerifyBtn').onclick = async () => {
    try {
      me = await api.post('/me/email/verify');
      currentUser = { ...currentUser, ...me };
      showVerify();
      toast(tr('verified'));
    } catch (err) {
      toast(errorText(err));
    }
  };

  // Ganti foto: dipotong persegi dan dikecilkan 192px supaya ringan disimpan
  $('pfPhotoBtn').onclick = () => {
    if (!editing) {
      toast(tr('photoNeedEdit'));
      return;
    }
    $('pfFile').click();
  };
  $('pfFile').onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) {
      toast(tr('photoBad'));
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const s = 192;
      const m = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = s;
      c.height = s;
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      draftPhoto = c.toDataURL('image/jpeg', 0.85);
      paintAvatar(draftPhoto);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast(tr('photoErr'));
    };
    img.src = url;
    e.target.value = '';
  };

  // Proyek yang diikuti + tanggal bergabung (dari keanggotaan proyek)
  $('pfProjects').innerHTML = `<p class="cal-empty" style="padding:12px">${esc(tr('loadingProj'))}</p>`;
  Promise.all(allProjects.map((p) => api.get(`/projects/${encodeURIComponent(p.key)}/members`).then((m) => ({ p, m })).catch(() => ({ p, m: [] })))).then((rows) => {
    projects = rows
      .map(({ p, m }) => ({ p, joinedAt: (m.find((x) => x.id === me.id) || {}).joinedAt }))
      .filter((r) => r.joinedAt !== undefined);
    $('pfProjects').innerHTML = projects.length
      ? projects
          .map(({ p }) => `<details class="pf-proj"><summary>${esc(p.name)}</summary><p>${esc(tr('code'))} <b>${esc(p.key)}</b> · <a href="board.html?key=${encodeURIComponent(p.key)}">${esc(tr('kanban'))}</a> · <a href="calendar.html?key=${encodeURIComponent(p.key)}">${esc(tr('cal'))}</a></p></details>`)
          .join('')
      : `<p class="cal-empty" style="padding:12px">${esc(tr('noProj'))}</p>`;
    buildTeams();
  });
  $('pfBell').onclick = () => toast('Notifikasi belum tersedia.');
  fill();
  setEditing(false);
}

function initSecurityPage() {
  if (!$('secForm')) return;
  const { toast } = window.Doto;
  const hasPass = currentUser?.hasPassword !== false;
  if (!hasPass && $('secCurWrap')) {
    $('secCurWrap').hidden = true;
    if ($('secPassSub')) {
      $('secPassSub').textContent = 'Akun Anda masuk melalui Google dan belum memiliki password lokal. Buat password baru di bawah ini.';
    }
  }

  let show = false;
  $('secToggleShow').onclick = () => {
    show = !show;
    const t = show ? 'text' : 'password';
    ['secCur', 'secNew', 'secConf'].forEach((id) => {
      if ($(id)) $(id).type = t;
    });
    $('secToggleShow').textContent = show ? 'Sembunyikan Password' : 'Tampilkan Password';
  };

  const setMsg = (id, text, ok = false) => {
    const m = $(`${id}-msg`);
    if (!m) return;
    m.textContent = text || '';
    m.hidden = !text;
    m.classList.toggle('ok', Boolean(ok));
    if ($(id)) $(id).classList.toggle('bad', Boolean(text) && !ok);
  };

  $('secForm').onsubmit = async (e) => {
    e.preventDefault();
    ['secCur', 'secNew', 'secConf'].forEach((id) => setMsg(id, ''));
    const cur = $('secCur') ? $('secCur').value : '';
    const nw = $('secNew').value;
    const cf = $('secConf').value;

    let bad = false;
    if (hasPass && !cur) {
      setMsg('secCur', 'Masukkan password saat ini.');
      bad = true;
    }
    if (nw.length < 6) {
      setMsg('secNew', 'Password baru minimal 6 karakter.');
      bad = true;
    }
    if (cf !== nw) {
      setMsg('secConf', 'Konfirmasi password tidak cocok.');
      bad = true;
    }
    if (bad) return;

    const btn = $('secSaveBtn');
    btn.disabled = true;
    try {
      await api.post('/me/password', {
        currentPassword: cur,
        newPassword: nw,
      });
      currentUser.hasPassword = true;
      $('secForm').reset();
      if ($('secCurWrap')) $('secCurWrap').hidden = false;
      toast('Password berhasil diperbarui.');
    } catch (err) {
      const msgText = errorText(err);
      if (/lama|current|unauthorized/i.test(msgText)) {
        setMsg('secCur', msgText);
      } else {
        setMsg('secNew', msgText);
      }
      toast(msgText);
    } finally {
      btn.disabled = false;
    }
  };

  $('secLogoutBtn').onclick = async () => {
    await api.post('/auth/logout');
    window.dotoGo('login.html');
  };
  if ($('secBell')) $('secBell').onclick = () => window.dotoGo('notifications.html');
}

// Halaman Settings: daftar kategori + pencarian pengaturan.
function initSettingsPage() {
  if (!$('setList')) return;
  const { toast } = window.Doto;
  const SETTINGS_PAGES = {
    profile: 'profile.html',
    notifications: 'notifications.html',
    appearance: '#theme',
    ai: 'ai.html',
    security: 'security.html',
  };
  const norm = (s) => String(s ?? '').toLowerCase();
  const rows = [...document.querySelectorAll('.set-row[data-key]')];

  rows.forEach((r) => {
    r.onclick = () => {
      const key = r.dataset.key;
      if (key === 'appearance') {
        if (window.DotoTheme && typeof window.DotoTheme.toggle === 'function') {
          window.DotoTheme.toggle();
          const cur = window.DotoTheme.get() === 'dark' ? 'Gelap (Dark)' : 'Terang (Light)';
          toast(`Tema diubah ke mode ${cur}.`);
        }
        return;
      }
      const to = SETTINGS_PAGES[key];
      if (to) window.dotoGo(to);
      else toast(`${r.querySelector('b').textContent} belum tersedia.`);
    };
  });

  // Pencarian: cocokkan judul, deskripsi, dan kata kunci (Indonesia + Inggris) tiap pengaturan
  const search = (q) => {
    const k = norm(q).trim();
    let shown = 0;
    rows.forEach((r) => {
      const hit = !k || norm(`${r.textContent} ${r.dataset.kw}`).includes(k);
      r.hidden = !hit;
      if (hit) shown++;
    });
    $('setEmpty').hidden = shown > 0;
  };
  $('setSearch').oninput = (e) => search(e.target.value);
  $('setSearch').onkeydown = (e) => {
    if (e.key === 'Escape') {
      e.target.value = '';
      search('');
    }
  };

  // Bahasa: baru menyimpan pilihan (terjemahan antarmuka belum ada)
  const paintLang = (l) => document.querySelectorAll('#setLang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  let lang = 'id';
  try { lang = localStorage.getItem('doto-lang') || 'id'; } catch { /* abaikan */ }
  paintLang(lang);
  $('setLang').onclick = (e) => {
    const b = e.target.closest('button[data-lang]');
    if (!b) return;
    try { localStorage.setItem('doto-lang', b.dataset.lang); } catch { /* abaikan */ }
    paintLang(b.dataset.lang);
    toast('Pilihan bahasa disimpan. Terjemahan antarmuka menyusul.');
  };
  $('setBell').onclick = () => toast('Notifikasi belum tersedia.');
}

init().catch((err) => {
  console.error(err);
});
