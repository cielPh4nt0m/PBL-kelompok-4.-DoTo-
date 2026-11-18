// Halaman Calendar (bar atas): tenggat tugas satu proyek. ?key=KODE memilih proyek (default K4).
import { api } from '../api.js';
import { initLayout } from '../layout.js';
import { unpackMeta } from '../meta.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = ['#6fd3f7', '#b08060', '#12c4cf', '#f3b95f', '#a78bfa'];
const colorOf = (u) => COLORS[[...String(u)].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];
let tasks = [];
let projectMembers = [];

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

function start() {
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const norm = (s) => String(s ?? '').trim().toLowerCase();
  const isLate = (t) => t.status !== 'done' && diffDays(t.due) < 0;
  const rel = (t) => {
    const d = diffDays(t.due);
    return d < 0 ? `Terlambat ${-d} hari` : d === 0 ? 'Hari ini' : `${d} hari lagi`;
  };
  const longDate = (s) => {
    const d = parseDate(s);
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };
  const cls = (t) => `s-${t.status}${isLate(t) ? ' late' : ''}`;

  let view = new Date(T0.getFullYear(), T0.getMonth(), 1);
  let who = null; // null = Semua; selain itu daftar nama (huruf kecil) yang cocok dengan Target
  let chips = [];
  const mine = (t) => !who || norm(t.to) === 'semua tim' || who.includes(norm(t.to));
  const dated = () => tasks.filter((t) => t.due && mine(t));
  const byStatus = (a, b) => STATUS_KEYS.indexOf(a.status) - STATUS_KEYS.indexOf(b.status);

  $('calDow').innerHTML = DOW.map((d) => `<span>${d}</span>`).join('');
  $('calLegend').innerHTML =
    STATUS_KEYS.map((k) => `<span class="lg"><i class="s-${k}"></i>${STATUS_LABEL[k]}</span>`).join('') +
    '<span class="lg"><i class="lg-late"></i>Lewat tenggat</span>';

  function drawGrid() {
    $('calTitle').textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // minggu dimulai Senin
    const by = {};
    dated().forEach((t) => (by[t.due] = by[t.due] || []).push(t));
    let html = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = fmtDate(d);
      const list = (by[key] || []).sort(byStatus);
      const c = ['cal-cell', d.getMonth() !== view.getMonth() ? 'out' : '', key === fmtDate(T0) ? 'today' : ''].join(' ');
      html += `<div class="${c}" data-date="${key}"><span class="cal-num">${d.getDate()}</span>`;
      html += list.slice(0, 2).map((t) => `<button class="ev ${cls(t)}" data-date="${key}" data-id="${esc(t.id)}" title="${esc(t.t)}">${esc(t.t)}</button>`).join('');
      if (list.length > 2) html += `<button class="ev-more" data-date="${key}">+${list.length - 2} lagi</button>`;
      html += '</div>';
    }
    $('calGrid').innerHTML = html;
  }

  function drawUpcoming() {
    // belum Done, terurut dari tenggat terdekat; yang terlambat otomatis paling atas
    const list = dated().filter((t) => t.status !== 'done').sort((a, b) => parseDate(a.due) - parseDate(b.due)).slice(0, 5);
    $('calUpcoming').innerHTML = list.length
      ? list.map((t) => `<button class="up ${cls(t)}" data-date="${t.due}" data-id="${esc(t.id)}"><b>${esc(t.t)}</b><span>${rel(t)} · ${esc(t.to)}</span></button>`).join('')
      : '<p class="cal-empty">Tidak ada jadwal mendekat.</p>';
  }

  function drawMembers() {
    chips = [
      { n: 'Semua', keys: null },
      ...projectMembers.map((m) => ({ n: m.name || m.username, keys: [norm(m.name), norm(m.username)].filter(Boolean) })),
      { n: 'Dosen Pembina', keys: ['dosen pembina'] },
    ];
    $('calMembers').innerHTML = chips
      .map((c, i) => {
        const on = c.keys === null ? who === null : who !== null && who.join() === c.keys.join();
        const av = c.keys === null ? '' : `<i style="background:${colorOf(c.n)}">${esc(String(c.n).slice(0, 2).toUpperCase())}</i>`;
        return `<button class="cal-chip${on ? ' on' : ''}" data-i="${i}">${av}${esc(c.n)}</button>`;
      })
      .join('');
  }

  const drawAll = () => {
    drawGrid();
    drawUpcoming();
    drawMembers();
  };

  // Popup ringkas yang keluar dari sel tanggal; semua tugas di tanggal itu berjejer (maks 5 kolom)
  const pop = document.createElement('div');
  pop.className = 'cal-pop';
  pop.hidden = true;
  document.body.appendChild(pop);
  const hidePop = () => {
    pop.classList.remove('show');
    pop.hidden = true;
  };
  function openDay(key, focusId) {
    const list = dated().filter((t) => t.due === key).sort(byStatus);
    const cell = document.querySelector(`.cal-cell[data-date="${key}"]`);
    if (!list.length || !cell) return;
    pop.style.setProperty('--cols', Math.min(list.length, 5));
    pop.innerHTML =
      `<h3>${longDate(key)} · ${list.length} tugas</h3><div class="cal-pop-grid">` +
      list
        .map(
          (t) => `<article class="cal-t ${cls(t)}${t.id === focusId ? ' focus' : ''}">
            <div><span class="cal-pill ${cls(t)}">${STATUS_LABEL[t.status]}</span>${isLate(t) ? `<em class="cal-late">${rel(t)}</em>` : ''}</div>
            <h4>${esc(t.t)}</h4><p>Target: ${esc(t.to)}</p><p>Tenggat: ${longDate(t.due)}</p>
            <a href="task.html?id=${encodeURIComponent(t.displayId)}">Buka detail →</a></article>`
        )
        .join('') +
      '</div>';
    pop.classList.remove('show');
    pop.hidden = false;
    const r = cell.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8));
    const below = r.bottom + 8 + h <= innerHeight - 8;
    const top = below ? r.bottom + 8 : Math.max(8, r.top - h - 8);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.transformOrigin = `${r.left + r.width / 2 - left}px ${below ? 0 : h}px`; // tumbuh dari tanggalnya
    requestAnimationFrame(() => pop.classList.add('show'));
  }

  $('calGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.ev, .ev-more');
    if (b) openDay(b.dataset.date, b.dataset.id);
  });
  $('calUpcoming').addEventListener('click', (e) => {
    const b = e.target.closest('.up');
    if (!b) return;
    const d = parseDate(b.dataset.date);
    view = new Date(d.getFullYear(), d.getMonth(), 1);
    drawAll();
    openDay(b.dataset.date, b.dataset.id);
  });
  $('calMembers').addEventListener('click', (e) => {
    const b = e.target.closest('.cal-chip');
    if (!b) return;
    who = chips[Number(b.dataset.i)].keys;
    hidePop();
    drawAll();
  });
  const go = (m) => {
    view = new Date(view.getFullYear(), view.getMonth() + m, 1);
    hidePop();
    drawGrid();
  };
  $('calPrev').onclick = () => go(-1);
  $('calNext').onclick = () => go(1);
  $('calToday').onclick = () => {
    view = new Date(T0.getFullYear(), T0.getMonth(), 1);
    hidePop();
    drawGrid();
  };
  $('calToggle').onclick = () => {
    const open = $('calSide').classList.toggle('open');
    $('calToggle').setAttribute('aria-expanded', String(open));
    $('calToggle').setAttribute('aria-label', open ? 'Tutup panel jadwal' : 'Buka panel jadwal');
  };
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !e.target.closest('.cal-pop, .ev, .ev-more, .up')) hidePop();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePop();
  });
  addEventListener('resize', hidePop);
  document.addEventListener('doto:tasks-changed', drawAll);
  drawAll();
}

function unpack(dto) {
  const { meta } = unpackMeta(dto.description);
  return { id: dto.displayId, displayId: dto.displayId, t: dto.title, due: dto.dueDate || null,
    to: meta.to || dto.assigneeName || dto.assigneeUsername || 'Semua tim', status: dto.status };
}

async function load() {
  await initLayout('calendar');
  const wanted = (new URLSearchParams(location.search).get('key') || '').toUpperCase();
  const projects = await api.get('/projects');
  const proj = projects.find((p) => p.key.toUpperCase() === wanted) || projects.find((p) => p.key === 'K4') || projects[0];
  if (!proj) {
    $('calGrid').textContent = 'Belum ada proyek.';
    return;
  }
  const pk = encodeURIComponent(proj.key);
  const [board, members] = await Promise.all([
    api.get(`/projects/${pk}/board?includeArchived=true`),
    api.get(`/projects/${pk}/members`).catch(() => []),
  ]);
  tasks = board.segments.flatMap((s) => s.tasks || []).map(unpack);
  projectMembers = members;
  document.title = `Doto – Calendar · ${proj.name}`;
  start();
}

load().catch((err) => {
  console.error(err);
  $('calGrid').textContent = err?.message ?? String(err);
});
