/* Doto – efek latar: foto bisnis "hujan" jatuh pelan di belakang halaman.
   Pakai: <script src="assets/js/effects.js" defer></script>
   dan taruh <div class="rain" aria-hidden="true"></div> tepat setelah <body>. */
(function () {
  // Ganti dengan nama file foto bisnismu (taruh di assets/img/)
    // Folder foto dihitung dari lokasi effects.js, jadi aman dari halaman mana pun
  var BASE = document.currentScript.src.replace(/js\/[^/]*$/, 'img/');
  var FILES = [
    'bisnis-1.jpg', 'bisnis-2.jpg', 'bisnis-3.jpg', 'bisnis-4.jpg',
    'bisnis-5.jpg', 'bisnis-6.jpg', 'bisnis-7.jpg', 'bisnis-8.jpg',
    'bisnis-9.jpg', 'bisnis-10.jpg', 'bisnis-11.jpg', 'bisnis-12.jpg',
    'bisnis-13.jpg', 'bisnis-14.jpg'
  ];
  var IMAGES = FILES.map(function (f) { return BASE + f; });
  var FALLBACK = [
  '📈', '📉', '📊', '💼', '🤝', '🗂️', '💡', '📅', '🗓️', '⏰',
  '✅', '📝', '📌', '📎', '🎯', '🚀', '💰', '🏢', '👥', '🧑‍💻',
  '📣', '🔔', '📧', '💬', '🔍', '⚙️', '🏆', '📋', '🧠', '⭐'
];

  var layer = document.querySelector('.rain');
  if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var COUNT = innerWidth < 640 ? 8 : 14;
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  function load(src) {
    return new Promise(function (ok) {
      var i = new Image();
      i.onload = function () { ok(src); };
      i.onerror = function () { console.warn('Foto tidak ditemukan:', src); ok(null); };
      i.src = src;
    });
  }

  Promise.all(IMAGES.map(load)).then(function (res) {
    var photos = res.filter(Boolean);
    for (var n = 0; n < COUNT; n++) {
      var c = document.createElement('div');
      var dur = rand(16, 30);
      c.className = 'rain-card';
      c.style.setProperty('--x', rand(0, 94).toFixed(1) + '%');
      c.style.setProperty('--s', Math.round(rand(90, 170)) + 'px');
      c.style.setProperty('--r', rand(-14, 14).toFixed(1) + 'deg');
      c.style.setProperty('--o', rand(0.45, 0.8).toFixed(2));
      c.style.setProperty('--d', dur.toFixed(1) + 's');
      c.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');
      if (photos.length) {
        c.style.backgroundImage = 'url("' + photos[n % photos.length] + '")';
      } else {
        c.classList.add('fallback');
        c.textContent = FALLBACK[n % FALLBACK.length];
      }
      layer.appendChild(c);
    }
  });
})();

/* ============ LOGIN (Login.html) ============ */
(function () {
  if (!(document.querySelector('.login-card') && !document.getElementById('e'))) return;
/* Script halaman Login.html */
const $ = id => document.getElementById(id), u = $('u'), p = $('p'), st = $('st');
function saveAcc(name, email) {
  let l = []; try { l = JSON.parse(localStorage.getItem('doto_accounts')) || []; } catch (x) {}
  const i = l.findIndex(a => a.username === name);
  if (i < 0) l.push({ username: name, email: email || '' }); else if (email) l[i].email = email;
  localStorage.setItem('doto_accounts', JSON.stringify(l)); localStorage.setItem('doto_current', JSON.stringify(name));
}
function bad(el, msg, out) { el.setAttribute('aria-invalid', !!msg); $(out).textContent = msg || ''; }

const eye = $('eye');
eye.setAttribute('aria-label', 'Hold to show password');
eye.style.userSelect = 'none'; eye.style.webkitUserSelect = 'none'; eye.style.touchAction = 'none';
const reveal = on => { p.type = on ? 'text' : 'password'; eye.setAttribute('aria-pressed', on); };
eye.addEventListener('pointerdown', ev => { ev.preventDefault(); reveal(true); });
['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(t => eye.addEventListener(t, () => reveal(false)));
eye.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); reveal(true); } });
eye.addEventListener('keyup', ev => { if (ev.key === ' ' || ev.key === 'Enter') reveal(false); });
eye.addEventListener('contextmenu', ev => ev.preventDefault());

$('f').onsubmit = e => {
  e.preventDefault(); st.textContent = '';
  const a = u.value.trim() ? '' : 'Enter your username.';
  const b = p.value.length < 6 ? 'Password must be at least 6 characters.' : '';
  bad(u, a, 'eu'); bad(p, b, 'ep');
  if (a || b) { (a ? u : p).focus(); return; }
  const go = $('go'); go.disabled = true; go.textContent = 'Signing in…';
  setTimeout(() => { go.disabled = false; go.textContent = 'Get Started'; saveAcc(u.value.trim()); location.href = 'welcome.html'; }, 600);
};
$('fg').onclick = e => { e.preventDefault(); st.textContent = 'Reset password belum tersedia di demo ini.'; };
$('gg').onclick = () => { st.textContent = 'Google sign-in belum terhubung di demo ini.'; };

})();

/* ============ REGISTER (register.html) ============ */
(function () {
  if (!(document.querySelector('.login-card') && document.getElementById('e'))) return;
/* Script halaman register.html */
const $ = id => document.getElementById(id), u = $('u'), e = $('e'), p = $('p'), st = $('st');
function saveAcc(name, email) {
  let l = []; try { l = JSON.parse(localStorage.getItem('doto_accounts')) || []; } catch (x) {}
  const i = l.findIndex(a => a.username === name);
  if (i < 0) l.push({ username: name, email: email || '' }); else if (email) l[i].email = email;
  localStorage.setItem('doto_accounts', JSON.stringify(l)); localStorage.setItem('doto_current', JSON.stringify(name));
}
function bad(el, msg, out) { el.setAttribute('aria-invalid', !!msg); $(out).textContent = msg || ''; }

const eye = $('eye');
eye.setAttribute('aria-label', 'Hold to show password');
eye.style.userSelect = 'none'; eye.style.webkitUserSelect = 'none'; eye.style.touchAction = 'none';
const reveal = on => { p.type = on ? 'text' : 'password'; eye.setAttribute('aria-pressed', on); };
eye.addEventListener('pointerdown', ev => { ev.preventDefault(); reveal(true); });
['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(t => eye.addEventListener(t, () => reveal(false)));
eye.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); reveal(true); } });
eye.addEventListener('keyup', ev => { if (ev.key === ' ' || ev.key === 'Enter') reveal(false); });
eye.addEventListener('contextmenu', ev => ev.preventDefault());

$('f').onsubmit = ev => {
  ev.preventDefault(); st.textContent = '';
  const a = u.value.trim().length >= 3 ? '' : 'Username must be at least 3 characters.';
  const b = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value.trim()) ? '' : 'Enter a valid email address.';
  const c = p.value.length >= 6 ? '' : 'Password must be at least 6 characters.';
  bad(u, a, 'eu'); bad(e, b, 'ee'); bad(p, c, 'ep');
  const first = a ? u : b ? e : c ? p : null;
  if (first) { first.focus(); return; }
  const go = $('go'); go.disabled = true; go.textContent = 'Creating account…';
  setTimeout(() => { go.disabled = false; go.textContent = 'Get Started'; saveAcc(u.value.trim(), e.value.trim()); location.href = 'welcome.html'; }, 600);
};
$('fg').onclick = ev => { ev.preventDefault(); st.textContent = 'Reset password belum tersedia di demo ini.'; };
$('gg').onclick = () => { st.textContent = 'Google sign-in belum terhubung di demo ini.'; };

})();

/* ============ DATA TUGAS & LOGIKA STATUS (dipakai halaman setelah login) ============ */
/* Data layer to-do list + logika status.
   Sementara memakai localStorage. Saat database siap, ganti isi fungsi di sini dengan pemanggilan API. */
(function () {
  if (!document.getElementById('app')) return;
  const TK = 'doto_tasks', ED = 'doto_edited', URGENT_DAYS = 3;
  const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const MEMBERS = [
    { i: 'PL', n: 'Ocipiyik', e: 'ocipiyik@gmail.com', c: '#2f6fe0' },
    { i: 'MB', n: 'M. Bayu', e: 'mbayu@gmail.com', c: '#6d3fb3' },
    { i: 'FM', n: 'Faradilla', e: 'faradilla@gmail.com', c: '#1e8a3c' }
  ];
  const STATUS = { overdue: { l: 'Overdue', o: 0 }, urgent: { l: 'Urgent', o: 1 }, ongoing: { l: 'Ongoing', o: 2 }, done: { l: 'Done', o: 3 } };

  const T0 = new Date(); T0.setHours(0, 0, 0, 0);
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const plus = n => { const d = new Date(T0); d.setDate(d.getDate() + n); return fmt(d); };
  const diff = t => Math.round((parse(t.due) - T0) / 864e5);
  const auto = t => diff(t) < 0 ? 'overdue' : diff(t) <= URGENT_DAYS ? 'urgent' : 'ongoing';
  // t.st = status yang dipilih manual lewat menu; tanpa itu status mengikuti tenggat
  const status = t => t.st || (t.done ? 'done' : auto(t));

  let tasks = rd(TK, null);
  if (!tasks) {
    tasks = [
      { id: 1, t: 'Jobsheet 1 - Pengumpulan Proposal', d: 'Kumpulkan proposal final beserta lampiran pembagian tugas ke dosen pembina melalui e-learning. Pastikan semua anggota sudah memeriksa hasilnya sebelum dikirim.', due: plus(-10), to: 'Dosen Pembina', by: 'Faradilla', st: 'done' },
      { id: 2, t: 'Jobsheet 2 - Rancangan UI UX', d: 'Selesaikan wireframe dan prototype di Figma untuk halaman login, welcome, dan to-do list. Pastikan semua anggota sudah memeriksa hasilnya sebelum dikirim.', due: plus(-5), to: 'Dosen Pembina', by: 'Faradilla', st: 'done' },
      { id: 3, t: 'Jobsheet 3 - Rancangan Frontend dan Backend', d: 'Susun struktur folder, daftar endpoint API, dan skema database awal. Sertakan diagram alur data sederhana.', due: plus(2), to: 'Dosen Pembina', by: 'Faradilla' },
      { id: 4, t: 'Jobsheet 4 - Kesimpulan', d: 'Tulis kesimpulan dan saran pengembangan.', due: plus(12), to: 'Dosen Pembina', by: 'Faradilla' },
      { id: 5, t: 'Revisi Laporan Bab 3', d: 'Perbaiki metodologi sesuai catatan dosen.', due: plus(-2), to: 'M. Bayu', by: 'Ocipiyik' },
      { id: 6, t: 'Siapkan Demo Prototype', d: 'Latih alur demo: login, welcome, to-do list.', due: plus(1), to: 'Semua tim', by: 'Ocipiyik' }
    ];
    wr(TK, tasks); wr(ED, Date.now() - 4 * 36e5);
  }
  const save = () => { wr(TK, tasks); wr(ED, Date.now()); document.dispatchEvent(new CustomEvent('doto:tasks-changed')); };
  const get = id => tasks.find(t => t.id == id);

  const pl = (n, u) => n + ' ' + u + (n > 1 ? 's' : '');
  window.DotoTasks = {
    MEMBERS, STATUS, status, get,
    list: () => tasks,
    counts: () => { const c = { overdue: 0, urgent: 0, ongoing: 0, done: 0 }; tasks.forEach(t => c[status(t)]++); return c; },
    sorted: f => tasks.map(t => ({ t, s: status(t) })).filter(x => !f || x.s === f).sort((a, b) => STATUS[a.s].o - STATUS[b.s].o || parse(a.t.due) - parse(b.t.due)),
    add: o => { tasks.push({ id: Date.now(), t: o.t, d: o.d || '', due: o.due || plus(7), to: o.to, by: o.by }); save(); },
    // key = salah satu status, atau null untuk kembali mengikuti tenggat
    setStatus: (id, key) => { const t = get(id); delete t.done; if (!key || key === auto(t)) delete t.st; else t.st = key; save(); },
    hasManual: id => !!get(id).st,
    dateLabel: t => { const s = parse(t.due); return s.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + String(s.getDate()).padStart(2, '0') + '-' + String(s.getMonth() + 1).padStart(2, '0') + '-' + s.getFullYear(); },
    relLabel: t => { if (status(t) === 'done') return 'Selesai'; const d = diff(t); return d < 0 ? 'Terlambat ' + (-d) + ' hari' : d === 0 ? 'Hari ini' : d + ' hari lagi'; },
    editedAt: () => rd(ED, Date.now()),
    ago: ms => { const m = Math.floor((Date.now() - ms) / 6e4); return m < 1 ? 'just now' : m < 60 ? pl(m, 'minute') + ' ago' : m < 1440 ? pl(Math.floor(m / 60), 'hour') + ' ago' : pl(Math.floor(m / 1440), 'day') + ' ago'; }
  };
})();

/* ============ SHELL BERSAMA: sidebar, menu akun, modal tambah tugas, toast ============ */
/* Shell bersama semua halaman setelah login: sidebar, menu akun, collapse, modal tambah tugas, toast.
   Wajib dimuat setelah tasks.js dan sebelum script halaman. Menyediakan window.Doto. */
(function () {
  if (!document.getElementById('app')) return;
const SIDEBAR = `<aside class="side">
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
      <button class="item" data-nav="tugas" title="Daftar Tugas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/></svg><span class="lbl">Daftar Tugas</span></button>
      <button class="item" data-nav="tim" title="Anggota Tim"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="4"/><path d="M1 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/><circle cx="17" cy="8.5" r="3" opacity=".7"/><path d="M18 14.2c3 .4 5 2.3 5 5.8h-4.5c0-2.4-.3-4.2-.5-5.8z" opacity=".7"/></svg><span class="lbl">Anggota Tim</span></button>
      <button class="item" data-nav="ai" title="Agen AI"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v3h-2z"/><circle cx="12" cy="2.5" r="1.5"/><path d="M5 6h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"/><circle cx="8.5" cy="12" r="2" fill="#fff"/><circle cx="15.5" cy="12" r="2" fill="#fff"/><rect x="8" y="16" width="8" height="2" rx="1" fill="#fff"/></svg><span class="lbl">Agen AI</span></button>
    </nav>

    <section class="projects hide-c" aria-label="Projects">
      <h2>Projects</h2>
      <div class="prow">
        <button class="proj" id="p4" aria-expanded="false" aria-controls="p4sub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>Kelompok 4 PBL</button>
        <button class="add" id="addBtn" aria-label="Tambah tugas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Tambah tugas</span></button>
      </div>
      <ul class="psub sublist" id="p4sub" hidden>
        <li><button class="subi" data-sub="todo">To-do list</button></li>
        <li><button class="subi" data-sub="file">File</button></li>
        <li><button class="subi" data-sub="cal">Calendar</button></li>
      </ul>
      <div class="prow"><button class="proj dummy" data-dummy><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>Agenda Lomba UI/UX</button></div>
      <div class="prow"><button class="proj dummy" data-dummy><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>Polinema Mengajar</button></div>
      <div class="prow"><button class="proj dummy" data-dummy><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>Draft Proyek</button></div>
    </section>

    <div class="foot">
      <button class="item" id="setting" title="Setting"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span class="lbl">Setting</span></button>
      <button class="item" id="collapse" aria-label="Collapse sidebar" title="Collapse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg><span class="lbl" id="collapseLbl">Collapse</span></button>
    </div>

    <div class="menu" id="menu" hidden role="menu"></div>
  </aside>`;
const MODAL = `<div class="scrim" id="scrim" hidden>
  <form class="modal glass" id="taskForm" novalidate role="dialog" aria-modal="true" aria-labelledby="mt">
    <h3 id="mt">Tambah tugas</h3>
    <p class="sub2">Proyek: Kelompok 4 PBL. Disimpan di browser ini (prototype).</p>
    <div class="field"><label for="tt">Judul tugas</label><input id="tt" aria-describedby="ett"><p class="error" id="ett"></p></div>
    <div class="field"><label for="td">Deskripsi</label><textarea id="td"></textarea></div>
    <div class="row2">
      <div class="field"><label for="tdue">Tenggat</label><input id="tdue" type="date"></div>
      <div class="field"><label for="ttg">Target</label><select id="ttg"></select></div>
    </div>
    <div class="mact"><button type="button" class="wb" id="cancel">Batal</button><button type="submit" class="wb pri">Tambah tugas</button></div>
  </form>
</div>
<div class="toast" id="toast" role="status"></div>`;
const root = document.getElementById('app');
root.insertAdjacentHTML('afterbegin', SIDEBAR);
document.body.insertAdjacentHTML('beforeend', MODAL);

const $ = id => document.getElementById(id);
const KEY = 'doto_accounts', CUR = 'doto_current', COL = 'doto_collapsed';
const LOGIN = 'Login.html';
const ROUTES = { dashboard: 'welcome.html', tugas: null, tim: null, ai: null }; // isi dengan nama file halaman bila sudah dibuat
const COLORS = ['#6fd3f7', '#b08060', '#12c4cf', '#f3b95f', '#a78bfa'];

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const ini = n => n.trim().slice(0, 2).toUpperCase();
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let accounts = read(KEY, []), current = read(CUR, null);
const goLogin = () => { location.href = LOGIN; };

// Guard: belum login -> kembali ke halaman login
if (!current || !accounts.some(a => a.username === current)) {
  if (accounts.length) current = accounts[0].username, write(CUR, current); else goLogin();
}

let tt;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); }
const colorOf = u => COLORS[[...u].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];
const av = (a, extra = '') => `<span class="av" style="background:${colorOf(a.username)};${extra}">${esc(ini(a.username))}</span>`;
const emailOf = a => a.email || '';

function render() {
  const me = accounts.find(a => a.username === current); if (!me) return;
  document.dispatchEvent(new CustomEvent('doto:user-changed'));
  $('avMain').textContent = ini(me.username); $('avMain').style.background = colorOf(me.username);
  $('nmMain').textContent = me.username; $('emMain').textContent = emailOf(me);
  const others = accounts.filter(a => a.username !== current);
  $('menu').innerHTML =
    `<div class="acc">${av(me)}<span class="who"><b>${esc(me.username)}</b><small>${esc(emailOf(me))}</small></span><button class="chip btnx" data-act="logout">Logout</button></div>` +
    others.map(a => `<div class="acc">${av(a)}<span class="who"><b>${esc(a.username)}</b><small>${esc(emailOf(a))}</small>
      <span class="acts" style="margin-top:4px"><button class="chip" data-act="switch" data-u="${esc(a.username)}">Login</button><button class="chip btnx" data-act="remove" data-u="${esc(a.username)}">Hapus</button></span></span></div>`).join('') +
    `<div class="sep"></div>
     <button class="mi" data-act="add"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4z"/></svg>Tambahkan akun lainnya</button>
     <button class="mi" data-act="logoutAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout dari semua akun</button>
     <div class="sep"></div>
     <button class="mi" data-act="google"><svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>Kelola akun Google Anda</button>`;
}

// Menu akun
const menu = $('menu'), ub = $('userBtn');
const setMenu = on => { menu.hidden = !on; ub.setAttribute('aria-expanded', on); };
ub.onclick = e => { e.stopPropagation(); setMenu(menu.hidden); };
document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
menu.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const u = b.dataset.u, act = b.dataset.act;
  if (act === 'switch') { current = u; write(CUR, u); render(); setMenu(false); toast('Beralih ke ' + u); }
  else if (act === 'remove') { accounts = accounts.filter(a => a.username !== u); write(KEY, accounts); render(); toast('Akun ' + u + ' dihapus dari daftar'); }
  else if (act === 'logout') { accounts = accounts.filter(a => a.username !== current); write(KEY, accounts);
    if (accounts.length) { current = accounts[0].username; write(CUR, current); render(); setMenu(false); toast('Logout berhasil'); }
    else { localStorage.removeItem(CUR); goLogin(); } }
  else if (act === 'logoutAll') { localStorage.removeItem(KEY); localStorage.removeItem(CUR); goLogin(); }
  else if (act === 'add') { location.href = LOGIN + '?add=1'; }
  else if (act === 'google') toast('Kelola akun Google belum tersedia.');
});

// Sidebar collapse
const app = $('app');
function setCollapsed(c) { app.classList.toggle('collapsed', c); write(COL, c); setMenu(false);
  $('collapse').setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar'); $('collapse').title = c ? 'Expand' : 'Collapse'; $('collapseLbl').textContent = 'Collapse'; }
$('collapse').onclick = () => setCollapsed(!app.classList.contains('collapsed'));
setCollapsed(read(COL, innerWidth < 760));

// Navigasi
document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
  const to = ROUTES[b.dataset.nav];
  if (to) location.href = to; else toast(b.title + ' belum tersedia di prototype ini.');
});
$('p4').onclick = () => { const o = $('p4').getAttribute('aria-expanded') === 'true'; $('p4').setAttribute('aria-expanded', !o); $('p4sub').hidden = o; };
document.querySelectorAll('[data-dummy]').forEach(b => b.onclick = () => toast('Project contoh. Hanya Kelompok 4 PBL yang aktif.'));
$('setting').onclick = () => toast('Setting belum tersedia.');


// Modal tambah tugas
const scrim = $('scrim'), tf = $('taskForm');
const openM = () => { scrim.hidden = false; $('tt').focus(); };
const closeM = () => { scrim.hidden = true; tf.reset(); $('ett').textContent = ''; $('tt').removeAttribute('aria-invalid'); $('addBtn').focus(); };
$('addBtn').onclick = openM; $('cancel').onclick = closeM;
scrim.addEventListener('mousedown', e => { if (e.target === scrim) closeM(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!scrim.hidden) closeM(); else setMenu(false); } });
$('ttg').innerHTML = ['Dosen Pembina', 'Semua tim', ...DotoTasks.MEMBERS.map(m => m.n)].map(n => `<option>${esc(n)}</option>`).join('');
tf.onsubmit = e => {
  e.preventDefault();
  const title = $('tt').value.trim();
  if (!title) { $('tt').setAttribute('aria-invalid', true); $('ett').textContent = 'Isi judul tugas.'; $('tt').focus(); return; }
  DotoTasks.add({ t: title, d: $('td').value.trim(), due: $('tdue').value, to: $('ttg').value, by: current });
  closeM(); toast('Tugas ditambahkan ke Kelompok 4 PBL.');
};
// Logo Doto = kembali ke landing page (welcome)
const logo = document.querySelector('.logo');
logo.setAttribute('role', 'link'); logo.tabIndex = 0; logo.title = 'Ke halaman Welcome';
logo.onclick = () => { location.href = ROUTES.dashboard; };
logo.onkeydown = e => { if (e.key === 'Enter') logo.onclick(); };
// Halaman to-do: buka submenu project dan tandai "To-do list"
if (/todo\.html$/.test(location.pathname)) {
  $('p4').setAttribute('aria-expanded', 'true'); $('p4sub').hidden = false;
  document.querySelector('[data-sub="todo"]').classList.add('on');
}
render();
document.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => {
  if (b.dataset.sub === 'todo') { if (!/todo\.html$/.test(location.pathname)) location.href = 'todo.html'; }
  else toast(b.textContent.trim() + ' belum tersedia.');
});

window.Doto = { $, read, write, esc, colorOf, toast, me: () => current };
})();

/* ============ HALAMAN WELCOME ============ */
/* Halaman Welcome */
(() => {
  if (!document.getElementById('hello')) return;
  const { $, toast, me } = Doto;
  const greet = () => { $('hello').textContent = me(); };
  greet();
  document.addEventListener('doto:user-changed', greet);
  $('bell').onclick = () => toast('Notifikasi belum tersedia.');
})();

/* ============ HALAMAN TO-DO LIST ============ */
/* Halaman To-do list: hanya tampilan. Data & logika status ada di tasks.js */
(() => {
  if (!document.getElementById('tbody')) return;
  const { $, esc, colorOf, toast } = Doto, T = DotoTasks;
  let filter = null;
  const abbr = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const who = n => { const m = T.MEMBERS.find(x => x.n === n); return `<span class="chip2"><i style="background:${m ? m.c : colorOf(n)}">${esc(abbr(n))}</i>${esc(n)}</span>`; };

  document.body.insertAdjacentHTML('beforeend', '<div class="card" id="mcard" hidden></div><div class="smenu" id="smenu" role="menu" aria-label="Pilih status" hidden></div>');
  const hidePop = () => { $('mcard').hidden = true; $('smenu').hidden = true; };
  function place(el, a, right) {
    el.hidden = false;
    const r = a.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(right ? r.right - w : r.left, innerWidth - w - 8)) + 'px';
    el.style.top = (r.bottom + h + 14 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
  }

  /* Header: avatar member (melebar saat hover, klik = username & email) */
  $('avs').innerHTML = T.MEMBERS.map((m, i) => `<button class="mav" data-m="${i}" style="background:${m.c}" aria-label="${esc(m.n)}">${m.i}${i === 2 ? '<i></i>' : ''}</button>`).join('');
  $('avs').onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    const c = $('mcard');
    if (!c.hidden && c.dataset.m === b.dataset.m) return hidePop();
    const m = T.MEMBERS[b.dataset.m];
    $('smenu').hidden = true; c.dataset.m = b.dataset.m;
    c.innerHTML = `<span class="av" style="background:${m.c};color:#fff">${m.i}</span><div><b>${esc(m.n)}</b><small>${esc(m.e)}</small></div>`;
    place(c, b, true);
  };
  $('share').onclick = () => toast('Fitur Share belum tersedia.');

  /* Tabel */
  function draw() {
    const c = T.counts(), total = T.list().length, pct = total ? Math.round(c.done / total * 100) : 0;
    $('stats').innerHTML = Object.keys(T.STATUS).map(k => `<button class="stat ${k}${filter === k ? ' on' : ''}" data-f="${k}" aria-pressed="${filter === k}"><b>${c[k]}</b><span>${T.STATUS[k].l}</span></button>`).join('');
    $('bar').style.width = pct + '%'; $('pct').textContent = pct + '% selesai';
    const rows = T.sorted(filter);
    $('tbody').innerHTML = rows.length ? rows.map(({ t, s }) => `<tr class="${s}">
      <td><button class="desc" data-id="${t.id}"><span class="clamp"><b>${esc(t.t)}</b> <span>${esc(t.d)}</span></span></button></td>
      <td>${T.dateLabel(t)}<span class="rel">${T.relLabel(t)}</span></td><td>${who(t.to)}</td><td>${who(t.by)}</td>
      <td><button class="pill ${s}" data-tg="${t.id}" aria-haspopup="menu" title="Ubah status">${T.STATUS[s].l}</button></td></tr>`).join('')
      : '<tr><td colspan="5" class="empty">Tidak ada tugas pada status ini.</td></tr>';
  }
  const paintEdited = () => { $('edited').textContent = 'Edited ' + T.ago(T.editedAt()); };
  $('stats').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { filter = filter === b.dataset.f ? null : b.dataset.f; draw(); } };

  /* Menu status */
  function openMenu(btn, id) {
    const cur = T.status(T.get(id)), m = $('smenu');
    m.dataset.id = id;
    m.innerHTML = Object.keys(T.STATUS).map(k => `<button role="menuitemradio" aria-checked="${k === cur}" class="${k}${k === cur ? ' cur' : ''}" data-s="${k}">${T.STATUS[k].l}</button>`).join('')
      + (T.hasManual(id) ? '<button class="auto" data-s="auto">Ikuti tenggat</button>' : '')
      + '<p class="hint">Overdue &amp; Urgent otomatis mengikuti tenggat.</p>';
    $('mcard').hidden = true; place(m, btn);
  }
  $('smenu').onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; T.setStatus($('smenu').dataset.id, b.dataset.s === 'auto' ? null : b.dataset.s); hidePop(); };

  /* Detail tugas */
  function openD(id) {
    const t = T.get(id), s = T.status(t);
    $('dBody').innerHTML = `<span class="pill ${s}">${T.STATUS[s].l}</span><h3 id="dt" style="margin-top:10px">${esc(t.t)}</h3><p class="dd">${esc(t.d) || 'Tidak ada deskripsi.'}</p>
      <dl class="meta"><div><dt>Due date</dt><dd>${T.dateLabel(t)} · ${T.relLabel(t)}</dd></div><div><dt>Target</dt><dd>${esc(t.to)}</dd></div><div><dt>Raised by</dt><dd>${esc(t.by)}</dd></div></dl>`;
    $('dscrim').hidden = false; $('dClose').focus();
  }
  const closeD = () => { $('dscrim').hidden = true; };
  $('tbody').onclick = e => {
    const g = e.target.closest('[data-tg]');
    if (g) { if (!$('smenu').hidden && $('smenu').dataset.id === g.dataset.tg) return hidePop(); return openMenu(g, g.dataset.tg); }
    const d = e.target.closest('[data-id]'); if (d) openD(d.dataset.id);
  };
  $('dClose').onclick = closeD;
  $('dscrim').addEventListener('mousedown', e => { if (e.target === $('dscrim')) closeD(); });
  document.addEventListener('click', e => { if (!e.target.closest('#mcard,#smenu,.mav,[data-tg]')) hidePop(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeD(); hidePop(); } });
  addEventListener('scroll', hidePop, true); addEventListener('resize', hidePop);

  document.addEventListener('doto:tasks-changed', () => { paintEdited(); draw(); });
  setInterval(paintEdited, 6e4); paintEdited(); draw();
})();