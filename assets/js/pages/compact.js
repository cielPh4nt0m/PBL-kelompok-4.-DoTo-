// Mode Compact: Tugas | Kalender | Agen AI dalam satu halaman. Kalender dan Agen AI dimuat dari halamannya masing-masing (?embed=1).
import { api } from '../api.js';
import { initLayout } from '../layout.js';
import { unpackMeta } from '../meta.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ORDER = ['in_progress', 'needs_review', 'todo', 'idea', 'done'];
const today = new Date();
today.setHours(0, 0, 0, 0);
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = (s) => (s ? parse(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—');

async function loadTasks(key) {
  const board = await api.get(`/projects/${encodeURIComponent(key)}/board`);
  const rows = board.segments.flatMap((s) => s.tasks || []).map((d) => ({
    id: d.displayId, title: d.title, status: d.status, due: d.dueDate || null,
    to: unpackMeta(d.description).meta.to || d.assigneeName || d.assigneeUsername || '',
  }));
  const rank = (t) => (t.status === 'done' ? 1 : 0);
  rows.sort((a, b) => rank(a) - rank(b) || (a.due ? parse(a.due) : Infinity) - (b.due ? parse(b.due) : Infinity));
  $('cmpCount').textContent = `${rows.length} tugas · ${rows.filter((t) => t.status !== 'done').length} aktif`;
  $('cmpList').innerHTML = rows.length
    ? rows.map((t) => {
        const late = t.status !== 'done' && t.due && parse(t.due) < today;
        return `<a class="cmp-row s-${t.status}${late ? ' late' : ''}" href="task.html?id=${encodeURIComponent(t.id)}"><i class="cmp-dot"></i><span class="cmp-title${t.status === 'done' ? ' done' : ''}">${esc(t.title)}</span><span class="cmp-meta">${fmt(t.due)}${t.to ? ' · ' + esc(t.to) : ''}</span></a>`;
      }).join('')
    : '<p class="cal-empty" style="padding:12px">Belum ada tugas.</p>';
}

async function start() {
  await initLayout('compact');
  const projects = await api.get('/projects');
  const wanted = (new URLSearchParams(location.search).get('key') || '').toUpperCase();
  let key = (projects.find((p) => p.key.toUpperCase() === wanted) || projects.find((p) => p.key === 'K4') || projects[0] || {}).key;
  if (!key) {
    $('cmpList').innerHTML = '<p class="cal-empty" style="padding:12px">Belum ada proyek.</p>';
    return;
  }
  $('cmpProj').innerHTML = projects.map((p) => `<option value="${esc(p.key)}">${esc(p.name)}</option>`).join('');
  const show = async (k) => {
    key = k;
    $('cmpProj').value = k;
    $('cmpBoard').href = `board.html?key=${encodeURIComponent(k)}`;
    $('cmpCal').src = `calendar.html?embed=1&key=${encodeURIComponent(k)}`;
    history.replaceState(null, '', `compact.html?key=${encodeURIComponent(k)}`);
    await loadTasks(k);
  };
  $('cmpProj').onchange = (e) => show(e.target.value);
  $('cmpAi').src = 'ai.html?embed=1';
  document.querySelectorAll('.cmp-tabs button').forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll('.cmp-tabs button, .cmp-panel').forEach((el) => el.classList.toggle('on', el.dataset.p === b.dataset.p));
    };
  });
  await show(key);
}

start().catch((err) => {
  console.error(err);
  $('cmpList').textContent = err?.message ?? String(err);
});
