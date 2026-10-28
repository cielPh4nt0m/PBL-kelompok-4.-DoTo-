// Shell halaman sidebar (welcome.html & todo.html): adaptasi dari origin/FE:assets/js/app.js
// yang terhubung penuh ke backend PHP REST API (/api/*).
import { api, errorText } from './api.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = (n) => String(n ?? 'U').trim().slice(0, 2).toUpperCase();
const COLORS = ['#6fd3f7', '#b08060', '#12c4cf', '#f3b95f', '#a78bfa'];
const colorOf = (u) => COLORS[[...String(u ?? 'U')].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];

const MEMBERS = [
  { i: 'PL', n: 'Ocipiyik', e: 'ocipiyik@gmail.com', c: '#2f6fe0' },
  { i: 'MB', n: 'M. Bayu', e: 'mbayu@gmail.com', c: '#6d3fb3' },
  { i: 'FM', n: 'Faradilla', e: 'faradilla@gmail.com', c: '#1e8a3c' },
];

const STATUS = {
  overdue: { l: 'Overdue', o: 0 },
  urgent: { l: 'Urgent', o: 1 },
  ongoing: { l: 'Ongoing', o: 2 },
  done: { l: 'Done', o: 3 },
};

const URGENT_DAYS = 3;
const T0 = new Date();
T0.setHours(0, 0, 0, 0);

const parseDate = (s) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(T0);
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
const diffDays = (t) => Math.round((parseDate(t.due) - T0) / 864e5);
const autoStatus = (t) => (diffDays(t) < 0 ? 'overdue' : diffDays(t) <= URGENT_DAYS ? 'urgent' : 'ongoing');

const META_MARKER = '\n\n<!--doto-meta:';
const META_END = '-->';

function packDescription(cleanDesc, meta) {
  const payload = JSON.stringify({
    due: meta.due || plusDays(7),
    to: meta.to || 'Semua tim',
    by: meta.by || 'Tim',
    ...(meta.st ? { st: meta.st } : {}),
  });
  return `${(cleanDesc || '').trim()}${META_MARKER}${payload}${META_END}`;
}

function unpackTask(dto, fallbackBy = 'Tim') {
  const raw = dto.description || '';
  const idx = raw.lastIndexOf(META_MARKER);
  let cleanDesc = raw;
  let meta = {};
  if (idx !== -1 && raw.endsWith(META_END)) {
    cleanDesc = raw.slice(0, idx).trim();
    const jsonStr = raw.slice(idx + META_MARKER.length, -META_END.length);
    try {
      meta = JSON.parse(jsonStr) || {};
    } catch {
      meta = {};
    }
  }

  const due = meta.due || plusDays(7);
  const to = meta.to || (dto.assigneeName || dto.assigneeUsername || 'Semua tim');
  const by = meta.by || fallbackBy;

  // Hitung status UI Rasyiq dari status DB + metadata
  let st = meta.st || null;
  if (dto.status === 'done') {
    st = 'done';
  } else if (st === 'done' && dto.status !== 'done') {
    st = null;
  } else if (!st) {
    if (dto.priority === 'urgent') st = 'urgent';
    else if (dto.status === 'in_progress') st = 'ongoing';
  }

  return {
    id: dto.displayId,
    displayId: dto.displayId,
    t: dto.title,
    d: cleanDesc,
    due,
    to,
    by,
    st,
    dbStatus: dto.status,
    dbPriority: dto.priority,
    updatedAt: dto.updatedAt || dto.createdAt || Date.now(),
  };
}

function effectiveStatus(t) {
  if (t.dbStatus === 'done' || t.st === 'done') return 'done';
  if (t.st && STATUS[t.st]) return t.st;
  return autoStatus(t);
}

const SEED_TASKS = [
  {
    t: 'Jobsheet 1 - Pengumpulan Proposal',
    d: 'Kumpulkan proposal final beserta lampiran pembagian tugas ke dosen pembina melalui e-learning. Pastikan semua anggota sudah memeriksa hasilnya sebelum dikirim.',
    due: plusDays(-10),
    to: 'Dosen Pembina',
    by: 'Faradilla',
    st: 'done',
    status: 'done',
    priority: 'medium',
  },
  {
    t: 'Jobsheet 2 - Rancangan UI UX',
    d: 'Selesaikan wireframe dan prototype di Figma untuk halaman login, welcome, dan to-do list. Pastikan semua anggota sudah memeriksa hasilnya sebelum dikirim.',
    due: plusDays(-5),
    to: 'Dosen Pembina',
    by: 'Faradilla',
    st: 'done',
    status: 'done',
    priority: 'medium',
  },
  {
    t: 'Jobsheet 3 - Rancangan Frontend dan Backend',
    d: 'Susun struktur folder, daftar endpoint API, dan skema database awal. Sertakan diagram alur data sederhana.',
    due: plusDays(2),
    to: 'Dosen Pembina',
    by: 'Faradilla',
    status: 'todo',
    priority: 'urgent',
  },
  {
    t: 'Jobsheet 4 - Kesimpulan',
    d: 'Tulis kesimpulan dan saran pengembangan.',
    due: plusDays(12),
    to: 'Dosen Pembina',
    by: 'Faradilla',
    status: 'in_progress',
    priority: 'medium',
  },
  {
    t: 'Revisi Laporan Bab 3',
    d: 'Perbaiki metodologi sesuai catatan dosen.',
    due: plusDays(-2),
    to: 'M. Bayu',
    by: 'Ocipiyik',
    status: 'todo',
    priority: 'high',
  },
  {
    t: 'Siapkan Demo Prototype',
    d: 'Latih alur demo: login, welcome, to-do list.',
    due: plusDays(1),
    to: 'Semua tim',
    by: 'Ocipiyik',
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
let lastEditedMs = Date.now();

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

  let board = await api.get(`/projects/${encodeURIComponent(activeProject.key)}/board?includeArchived=true`);
  if (!board.segments || board.segments.length === 0) {
    await api.post(`/projects/${encodeURIComponent(activeProject.key)}/segments`, { name: 'To Do' });
    board = await api.get(`/projects/${encodeURIComponent(activeProject.key)}/board?includeArchived=true`);
  }

  defaultSegmentName = board.segments[0]?.segment?.name || 'To Do';
  const existingTasks = board.segments.flatMap((s) => s.tasks || []);

  if (existingTasks.length === 0 && activeProject.key === 'K4') {
    for (const item of SEED_TASKS) {
      await api.post(`/projects/${encodeURIComponent(activeProject.key)}/tasks`, {
        segmentName: defaultSegmentName,
        title: item.t,
        description: packDescription(item.d, { due: item.due, to: item.to, by: item.by, st: item.st }),
        status: item.status,
        priority: item.priority,
        tags: ['mandatory'],
      });
    }
    board = await api.get(`/projects/${encodeURIComponent(activeProject.key)}/board?includeArchived=true`);
  }

  const allDtos = board.segments.flatMap((s) => s.tasks || []);
  tasks = allDtos.map((dto) => unpackTask(dto, currentUser?.username || 'Tim'));
  lastEditedMs = tasks.reduce((max, t) => Math.max(max, t.updatedAt || 0), Date.now() - 60000);
  document.dispatchEvent(new CustomEvent('doto:tasks-changed'));
}

const pl = (n, u) => `${n} ${u}${n > 1 ? 's' : ''}`;

const DotoTasks = {
  MEMBERS,
  STATUS,
  status: effectiveStatus,
  get: (id) => tasks.find((t) => t.id === id || t.displayId === id),
  list: () => tasks,
  counts: () => {
    const c = { overdue: 0, urgent: 0, ongoing: 0, done: 0 };
    tasks.forEach((t) => {
      const s = effectiveStatus(t);
      if (c[s] !== undefined) c[s]++;
    });
    return c;
  },
  sorted: (f) =>
    tasks
      .map((t) => ({ t, s: effectiveStatus(t) }))
      .filter((x) => !f || x.s === f)
      .sort((a, b) => STATUS[a.s].o - STATUS[b.s].o || parseDate(a.t.due) - parseDate(b.t.due)),
  add: async (o) => {
    const due = o.due || plusDays(7);
    const tempTask = { due };
    const auto = autoStatus(tempTask);
    const priority = auto === 'urgent' || auto === 'overdue' ? 'urgent' : 'medium';
    const status = auto === 'ongoing' ? 'in_progress' : 'todo';
    const description = packDescription(o.d || '', {
      due,
      to: o.to || 'Semua tim',
      by: o.by || currentUser?.username || 'Tim',
    });
    await api.post(`/projects/${encodeURIComponent(activeProject.key)}/tasks`, {
      segmentName: defaultSegmentName,
      title: o.t,
      description,
      status,
      priority,
      tags: ['mandatory'],
    });
    await ensureProjectAndTasks();
  },
  setStatus: async (id, key) => {
    const t = DotoTasks.get(id);
    if (!t) return;
    const nextManual = !key || key === autoStatus(t) ? null : key;
    const effective = nextManual || autoStatus(t);
    let dbStatus = 'todo';
    let dbPriority = t.dbPriority || 'medium';
    if (effective === 'done') {
      dbStatus = 'done';
    } else if (effective === 'ongoing') {
      dbStatus = 'in_progress';
      if (dbPriority === 'urgent') dbPriority = 'medium';
    } else if (effective === 'urgent') {
      dbStatus = 'todo';
      dbPriority = 'urgent';
    } else if (effective === 'overdue') {
      dbStatus = 'todo';
    }

    const newDesc = packDescription(t.d, {
      due: t.due,
      to: t.to,
      by: t.by,
      st: nextManual,
    });

    await api.patch(`/tasks/${encodeURIComponent(t.displayId)}`, { description: newDesc });
    await api.patch(`/tasks/${encodeURIComponent(t.displayId)}/status`, { status: dbStatus });
    if (dbPriority !== t.dbPriority) {
      await api.patch(`/tasks/${encodeURIComponent(t.displayId)}/priority`, { priority: dbPriority });
    }
    await ensureProjectAndTasks();
  },
  hasManual: (id) => Boolean(DotoTasks.get(id)?.st),
  dateLabel: (t) => {
    const s = parseDate(t.due);
    return (
      s.toLocaleDateString('en-US', { weekday: 'long' }) +
      ', ' +
      String(s.getDate()).padStart(2, '0') +
      '-' +
      String(s.getMonth() + 1).padStart(2, '0') +
      '-' +
      s.getFullYear()
    );
  },
  relLabel: (t) => {
    if (effectiveStatus(t) === 'done') return 'Selesai';
    const d = diffDays(t);
    return d < 0 ? `Terlambat ${-d} hari` : d === 0 ? 'Hari ini' : `${d} hari lagi`;
  },
  editedAt: () => lastEditedMs,
  ago: (ms) => {
    const m = Math.floor((Date.now() - ms) / 6e4);
    return m < 1
      ? 'just now'
      : m < 60
        ? `${pl(m, 'minute')} ago`
        : m < 1440
          ? `${pl(Math.floor(m / 60), 'hour')} ago`
          : `${pl(Math.floor(m / 1440), 'day')} ago`;
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
          <li><button class="subi" data-sub="todo">To-do list</button></li>
          <li><button class="subi" data-sub="board">Kanban Board</button></li>
          <li><button class="subi" data-sub="ai">Asisten AI</button></li>
        </ul>
      </div>
      <div id="otherProjectsNav"></div>
    </section>

    <div class="foot">
      <button class="item" id="themeSideBtn" title="Ganti Tema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg><span class="lbl">Ganti Tema</span></button>
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
    $('avMain').textContent = ini(uname);
    $('avMain').style.background = colorOf(uname);
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
      location.href = 'login.html';
    } else if (act === 'projects') {
      location.href = 'projects.html';
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
  setCollapsed(read(COL, innerWidth < 760));

  document.querySelectorAll('[data-nav]').forEach((b) => {
    b.onclick = () => {
      const to = ROUTES[b.dataset.nav];
      if (to) location.href = to;
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
  $('themeSideBtn').onclick = () => {
    if (window.DotoTheme) window.DotoTheme.toggle();
  };

  // Modal tambah tugas
  const scrim = $('scrim');
  const tf = $('taskForm');
  const openM = () => {
    scrim.hidden = false;
    if (!$('tdue').value) $('tdue').value = plusDays(7);
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
  $('ttg').innerHTML = ['Dosen Pembina', 'Semua tim', ...MEMBERS.map((m) => m.n)]
    .map((n) => `<option>${esc(n)}</option>`)
    .join('');

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
    location.href = ROUTES.dashboard;
  };
  logo.onkeydown = (e) => {
    if (e.key === 'Enter') logo.onclick();
  };

  if (/todo\.html$/i.test(location.pathname)) {
    $('p4').setAttribute('aria-expanded', 'true');
    $('p4sub').hidden = false;
    document.querySelector('[data-sub="todo"]')?.classList.add('on');
  }

  document.querySelectorAll('[data-sub]').forEach((b) => {
    b.onclick = () => {
      const sub = b.dataset.sub;
      if (sub === 'todo') {
        location.href = `todo.html?key=${encodeURIComponent(activeProject.key)}`;
      } else if (sub === 'board') {
        location.href = `board.html?key=${encodeURIComponent(activeProject.key)}`;
      } else if (sub === 'ai') {
        location.href = 'ai.html';
      }
    };
  });

  window.Doto = { $, read, write, esc, colorOf, toast, me: () => currentUser?.username || 'Users' };
  renderAccount();

  await ensureProjectAndTasks();

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
        const page = /todo\.html$/i.test(location.pathname) ? 'todo.html' : 'welcome.html';
        location.href = `${page}?key=${encodeURIComponent(k)}`;
      };
    });
  }

  initWelcomePage();
  initTodoPage();
}

function initWelcomePage() {
  if (!$('hello')) return;
  const { $, toast, me, esc } = window.Doto;
  const greet = () => {
    $('hello').textContent = me();
  };
  greet();
  document.addEventListener('doto:user-changed', greet);
  $('bell').onclick = () => toast('Semua sistem & database terhubung aktif.');

  const dash = $('welcomeDash');
  if (!dash) return;

  function renderDash() {
    const c = DotoTasks.counts();
    const total = DotoTasks.list().length;
    const pct = total ? Math.round((c.done / total) * 100) : 0;
    dash.innerHTML = `
      <section class="stats" style="margin-top:24px">
        <a class="stat overdue" href="todo.html?key=${encodeURIComponent(activeProject.key)}" style="text-decoration:none"><b>${c.overdue}</b><span>Overdue</span></a>
        <a class="stat urgent" href="todo.html?key=${encodeURIComponent(activeProject.key)}" style="text-decoration:none"><b>${c.urgent}</b><span>Urgent</span></a>
        <a class="stat ongoing" href="todo.html?key=${encodeURIComponent(activeProject.key)}" style="text-decoration:none"><b>${c.ongoing}</b><span>Ongoing</span></a>
        <a class="stat done" href="todo.html?key=${encodeURIComponent(activeProject.key)}" style="text-decoration:none"><b>${c.done}</b><span>Done</span></a>
      </section>
      <div class="prog"><div class="track"><div class="fill" style="width:${pct}%"></div></div><span>${pct}% selesai dari ${total} tugas (${esc(activeProject.name)})</span></div>
      <div class="project-grid" style="margin-top:18px">
        <a class="project-card g2 lift" href="todo.html?key=${encodeURIComponent(activeProject.key)}">
          <span class="key">${esc(activeProject.key)}</span>
          <h3>${esc(activeProject.name)} — To-do List</h3>
          <p>Lihat tabel tugas, tenggat waktu, filter status, dan progres tim →</p>
        </a>
        <a class="project-card g2 lift" href="board.html?key=${encodeURIComponent(activeProject.key)}">
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
  renderDash();
  document.addEventListener('doto:tasks-changed', renderDash);
}

function initTodoPage() {
  if (!$('tbody')) return;
  const { $, esc, colorOf, toast } = window.Doto;
  const T = DotoTasks;
  let filter = null;

  if ($('projKeyIco')) $('projKeyIco').textContent = activeProject.key;
  if ($('projTitle')) $('projTitle').textContent = activeProject.name;

  const abbr = (n) =>
    String(n ?? 'U')
      .split(' ')
      .map((w) => w[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const who = (n) => {
    const m = T.MEMBERS.find((x) => x.n === n);
    return `<span class="chip2"><i style="background:${m ? m.c : colorOf(n)}">${esc(abbr(n))}</i>${esc(n)}</span>`;
  };

  document.body.insertAdjacentHTML(
    'beforeend',
    '<div class="card" id="mcard" hidden></div><div class="smenu" id="smenu" role="menu" aria-label="Pilih status" hidden></div>'
  );
  const hidePop = () => {
    $('mcard').hidden = true;
    $('smenu').hidden = true;
  };
  function place(el, a, right) {
    el.hidden = false;
    const r = a.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.style.left = `${Math.max(8, Math.min(right ? r.right - w : r.left, innerWidth - w - 8))}px`;
    el.style.top = `${r.bottom + h + 14 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6}px`;
  }

  $('avs').innerHTML = T.MEMBERS.map(
    (m, i) =>
      `<button class="mav" data-m="${i}" style="background:${m.c}" aria-label="${esc(m.n)}">${m.i}${i === 2 ? '<i></i>' : ''}</button>`
  ).join('');
  $('avs').onclick = (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    const c = $('mcard');
    if (!c.hidden && c.dataset.m === b.dataset.m) return hidePop();
    const m = T.MEMBERS[b.dataset.m];
    $('smenu').hidden = true;
    c.dataset.m = b.dataset.m;
    c.innerHTML = `<span class="av" style="background:${m.c};color:#fff">${m.i}</span><div><b>${esc(m.n)}</b><small>${esc(m.e)}</small></div>`;
    place(c, b, true);
  };
  $('share').onclick = () => {
    location.href = `board.html?key=${encodeURIComponent(activeProject.key)}`;
  };

  function draw() {
    const c = T.counts();
    const total = T.list().length;
    const pct = total ? Math.round((c.done / total) * 100) : 0;
    $('stats').innerHTML = Object.keys(T.STATUS)
      .map(
        (k) =>
          `<button class="stat ${k}${filter === k ? ' on' : ''}" data-f="${k}" aria-pressed="${filter === k}"><b>${c[k]}</b><span>${T.STATUS[k].l}</span></button>`
      )
      .join('');
    $('bar').style.width = `${pct}%`;
    $('pct').textContent = `${pct}% selesai`;
    const rows = T.sorted(filter);
    $('tbody').innerHTML = rows.length
      ? rows
          .map(
            ({ t, s }) => `<tr class="${s}">
      <td><button class="desc" data-id="${esc(t.id)}"><span class="clamp"><b>${esc(t.t)}</b> <span>${esc(t.d)}</span></span></button></td>
      <td>${T.dateLabel(t)}<span class="rel">${T.relLabel(t)}</span></td><td>${who(t.to)}</td><td>${who(t.by)}</td>
      <td><button class="pill ${s}" data-tg="${esc(t.id)}" aria-haspopup="menu" title="Ubah status">${T.STATUS[s].l}</button></td></tr>`
          )
          .join('')
      : '<tr><td colspan="5" class="empty">Tidak ada tugas pada status ini.</td></tr>';
  }

  const paintEdited = () => {
    $('edited').textContent = `Edited ${T.ago(T.editedAt())}`;
  };
  $('stats').onclick = (e) => {
    const b = e.target.closest('[data-f]');
    if (b) {
      filter = filter === b.dataset.f ? null : b.dataset.f;
      draw();
    }
  };

  function openMenu(btn, id) {
    const task = T.get(id);
    if (!task) return;
    const cur = T.status(task);
    const m = $('smenu');
    m.dataset.id = id;
    m.innerHTML =
      Object.keys(T.STATUS)
        .map(
          (k) =>
            `<button role="menuitemradio" aria-checked="${k === cur}" class="${k}${k === cur ? ' cur' : ''}" data-s="${k}">${T.STATUS[k].l}</button>`
        )
        .join('') +
      (T.hasManual(id) ? '<button class="auto" data-s="auto">Ikuti tenggat</button>' : '') +
      '<p class="hint">Overdue &amp; Urgent otomatis mengikuti tenggat.</p>';
    $('mcard').hidden = true;
    place(m, btn);
  }

  $('smenu').onclick = async (e) => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    const id = $('smenu').dataset.id;
    const val = b.dataset.s === 'auto' ? null : b.dataset.s;
    hidePop();
    try {
      await T.setStatus(id, val);
      toast('Status tugas diperbarui.');
    } catch (err) {
      toast(errorText(err));
    }
  };

  function openD(id) {
    const t = T.get(id);
    if (!t) return;
    const s = T.status(t);
    $('dBody').innerHTML = `<span class="pill ${s}">${T.STATUS[s].l}</span><h3 id="dt" style="margin-top:10px">${esc(t.t)}</h3><p class="dd">${esc(t.d) || 'Tidak ada deskripsi.'}</p>
      <dl class="meta"><div><dt>ID Task</dt><dd><a href="task.html?id=${encodeURIComponent(t.displayId)}">${esc(t.displayId)} (Buka Detail &amp; Komentar)</a></dd></div><div><dt>Due date</dt><dd>${T.dateLabel(t)} · ${T.relLabel(t)}</dd></div><div><dt>Target</dt><dd>${esc(t.to)}</dd></div><div><dt>Raised by</dt><dd>${esc(t.by)}</dd></div></dl>`;
    $('dscrim').hidden = false;
    $('dClose').focus();
  }
  const closeD = () => {
    $('dscrim').hidden = true;
  };
  $('tbody').onclick = (e) => {
    const g = e.target.closest('[data-tg]');
    if (g) {
      if (!$('smenu').hidden && $('smenu').dataset.id === g.dataset.tg) return hidePop();
      return openMenu(g, g.dataset.tg);
    }
    const d = e.target.closest('[data-id]');
    if (d) openD(d.dataset.id);
  };
  $('dClose').onclick = closeD;
  $('dscrim').addEventListener('mousedown', (e) => {
    if (e.target === $('dscrim')) closeD();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#mcard,#smenu,.mav,[data-tg]')) hidePop();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeD();
      hidePop();
    }
  });
  addEventListener('scroll', hidePop, true);
  addEventListener('resize', hidePop);

  document.addEventListener('doto:tasks-changed', () => {
    paintEdited();
    draw();
  });
  setInterval(paintEdited, 6e4);
  paintEdited();
  draw();
}

init().catch((err) => {
  console.error(err);
});
