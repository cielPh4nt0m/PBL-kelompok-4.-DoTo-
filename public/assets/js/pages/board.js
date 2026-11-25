import { api, errorText } from '../api.js';
import { h, param, STATUSES, STATUS_LABEL, statusSelect } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';
import { packDescription, dateFromToday } from '../meta.js';

const content = document.getElementById('content');
const key = (param('key') ?? '').toUpperCase();
let includeArchived = false;
let meName = 'Tim';
let targetNames = ['Dosen Pembina', 'Semua tim'];
let openFormSegment = null; // id segment yang sedang menampilkan form "+ Task"

// Drag-and-drop kartu antar status dan antar segment. Pointer Events dipakai
// (bukan HTML5 DnD) supaya jalan juga di layar sentuh; di sentuhan drag aktif
// setelah tahan sebentar agar geser biasa tetap men-scroll board.
const DRAG_THRESHOLD = 6;
const TOUCH_HOLD_MS = 280;
const EDGE = 48;
let drag = null;

function startDrag(e, task) {
  if (e.button !== 0 || drag || e.target.closest('select, button, input')) return;
  drag = { task, card: e.currentTarget, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY,
    touch: e.pointerType !== 'mouse', active: false, target: null, ghost: null, timer: 0, raf: 0 };
  if (drag.touch) drag.timer = setTimeout(activateDrag, TOUCH_HOLD_MS);
  addEventListener('pointermove', moveDrag);
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', finishDrag);
  addEventListener('keydown', keyDrag);
  addEventListener('touchmove', blockTouchScroll, { passive: false });
  addEventListener('contextmenu', blockContextMenu);
}

function activateDrag() {
  const { card } = drag;
  const rect = card.getBoundingClientRect();
  drag.offX = drag.startX - rect.left;
  drag.offY = drag.startY - rect.top;
  drag.ghost = card.cloneNode(true);
  drag.ghost.classList.remove('dragging');
  drag.ghost.classList.add('drag-ghost');
  drag.ghost.style.width = `${rect.width}px`;
  document.body.append(drag.ghost);
  card.classList.add('dragging');
  document.body.classList.add('is-dragging');
  // scroll-snap mengembalikan auto-scroll kecil ke titik snap; matikan selama drag.
  const board = content.querySelector('.board');
  if (board) board.style.scrollSnapType = 'none';
  drag.active = true;
  if (drag.touch) navigator.vibrate?.(12);
  placeGhost();
  drag.raf = requestAnimationFrame(autoScroll);
}

function moveDrag(e) {
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (drag.active) return placeGhost();
  if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) <= DRAG_THRESHOLD) return;
  if (drag.touch) finishDrag(); // geser sebelum tahan selesai = scroll biasa
  else activateDrag();
}

function placeGhost() {
  drag.ghost.style.transform = `translate(${drag.x - drag.offX}px, ${drag.y - drag.offY}px) rotate(2deg)`;
  const group = document.elementFromPoint(drag.x, drag.y)?.closest('.status-group') ?? null;
  if (group === drag.target) return;
  drag.target?.classList.remove('drop-target');
  drag.target = group;
  group?.classList.add('drop-target');
}

function autoScroll() {
  const board = content.querySelector('.board');
  if (board) {
    const r = board.getBoundingClientRect();
    if (drag.x < r.left + EDGE) board.scrollLeft -= 14;
    else if (drag.x > r.right - EDGE) board.scrollLeft += 14;
  }
  if (drag.y < EDGE) scrollBy(0, -14);
  else if (drag.y > innerHeight - EDGE) scrollBy(0, 14);
  placeGhost();
  drag.raf = requestAnimationFrame(autoScroll);
}

function blockTouchScroll(e) {
  if (drag?.active) e.preventDefault();
}

function blockContextMenu(e) {
  if (drag?.touch) e.preventDefault(); // tahan lama di HP jangan memunculkan menu tautan
}

function keyDrag(e) {
  if (e.key === 'Escape') finishDrag();
}

function swallowClick(e) {
  e.preventDefault();
  e.stopPropagation();
}

function finishDrag() {
  const done = drag;
  if (!done) return null;
  drag = null;
  clearTimeout(done.timer);
  cancelAnimationFrame(done.raf);
  removeEventListener('pointermove', moveDrag);
  removeEventListener('pointerup', endDrag);
  removeEventListener('pointercancel', finishDrag);
  removeEventListener('keydown', keyDrag);
  removeEventListener('touchmove', blockTouchScroll);
  removeEventListener('contextmenu', blockContextMenu);
  done.ghost?.remove();
  done.card.classList.remove('dragging');
  done.target?.classList.remove('drop-target');
  document.body.classList.remove('is-dragging');
  const board = content.querySelector('.board');
  if (board) board.style.scrollSnapType = '';
  if (done.active) {
    // Klik yang dikirim browser tepat setelah pointerup tidak boleh membuka detail tugas.
    addEventListener('click', swallowClick, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallowClick, { capture: true }), 0);
  }
  return done;
}

async function endDrag() {
  const done = finishDrag();
  if (!done?.active || !done.target) return;
  const { task, card, target } = done;
  const { segmentId, status } = target.dataset;
  if (segmentId === task.segmentId && status === task.status) return;
  target.append(card); // pindah langsung di layar; render() di bawah menyinkronkan
  const id = encodeURIComponent(task.displayId);
  try {
    if (segmentId !== task.segmentId) await api.patch(`/tasks/${id}`, { segmentId });
    if (status !== task.status) await api.patch(`/tasks/${id}/status`, { status });
  } catch (err) {
    alert(errorText(err));
  }
  await render();
}

function taskCard(task) {
  const href = `task.html?id=${encodeURIComponent(task.displayId)}`;
  return h('div', {
    class: `task-card g2 lift${task.archivedAt ? ' archived' : ''}`,
    onpointerdown: task.archivedAt ? null : (e) => startDrag(e, task),
    ondragstart: (e) => e.preventDefault(),
  },
    h('a', { href, draggable: 'false' },
      h('div', { class: 'task-card-top' },
        h('span', { class: 'mono' }, task.displayId),
        h('span', { class: `pill ${task.priority}` }, task.priority)),
      h('p', {}, task.title),
      h('span', { class: 'who' }, task.assigneeUsername ? `@${task.assigneeUsername}` : 'unassigned'),
      task.dueDate ? h('span', { class: 'who' }, ` · Tenggat ${task.dueDate}`) : null),
    statusSelect(task.status, async (status) => {
      try {
        await api.patch(`/tasks/${encodeURIComponent(task.displayId)}/status`, { status });
      } catch (e) {
        alert(errorText(e));
      }
      await render();
    }));
}

function addTaskControl(segment) {
  if (openFormSegment !== segment.id) {
    return h('button', { class: 'btn-ghost', type: 'button',
      onclick: () => { openFormSegment = segment.id; render(); } }, '+ Task');
  }

  const title = h('input', { placeholder: 'Task title', 'aria-label': 'Task title' });
  const due = h('input', { type: 'date', 'aria-label': 'Due date (default 2 minggu)', title: 'Tenggat (default 2 minggu)', value: dateFromToday() });
  const target = h('select', { 'aria-label': 'Target', title: 'Target' }, targetNames.map((n) => h('option', { value: n }, n)));
  const err = h('p', { class: 'form-error', role: 'alert' });
  queueMicrotask(() => title.focus());
  return h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!title.value.trim()) return title.focus();
      try {
        await api.post(`/projects/${encodeURIComponent(key)}/tasks`, {
          segmentName: segment.name, title: title.value.trim(),
          dueDate: due.value || dateFromToday(),
          description: packDescription('', { to: target.value, by: meName }),
        });
        openFormSegment = null;
        await render();
      } catch (ex) {
        err.textContent = errorText(ex);
      }
    },
  },
  h('div', { class: 'row-form', style: 'margin-top:8px' },
    title,
    h('button', { class: 'btn btn-primary btn-inline', type: 'submit' }, 'Add')),
  h('div', { class: 'row-form', style: 'margin-top:6px' }, due, target),
  h('button', { class: 'btn-danger', type: 'button', style: 'margin-top:6px',
    onclick: () => { openFormSegment = null; render(); } }, 'Cancel'),
  err);
}

function segmentColumn({ segment, tasks }) {
  return h('section', { class: 'segment-col g1' },
    h('h2', {}, segment.name, h('span', { class: 'chip' }, String(tasks.length))),
    STATUSES.map((status) => {
      const list = tasks.filter((t) => t.status === status);
      return h('div', { class: 'status-group', 'data-segment-id': segment.id, 'data-status': status },
        h('h3', { class: 'label-caps' }, STATUS_LABEL[status], h('span', {}, String(list.length))),
        list.map(taskCard));
    }),
    addTaskControl(segment));
}

function addSegmentColumn() {
  const name = h('input', { placeholder: 'New segment', 'aria-label': 'New segment name' });
  const err = h('p', { class: 'form-error', role: 'alert' });
  return h('section', { class: 'segment-col g1 add' },
    h('h2', {}, 'Add segment'),
    h('form', {
      class: 'field-list',
      onsubmit: async (e) => {
        e.preventDefault();
        if (!name.value.trim()) return name.focus();
        try {
          await api.post(`/projects/${encodeURIComponent(key)}/segments`, { name: name.value.trim() });
          await render();
        } catch (ex) {
          err.textContent = errorText(ex);
        }
      },
    }, name, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Add segment'), err));
}

async function render() {
  const board = await api.get(`/projects/${encodeURIComponent(key)}/board${includeArchived ? '?includeArchived=true' : ''}`);
  document.title = `Doto – ${board.project.name}`;
  const members = await api.get(`/projects/${encodeURIComponent(key)}/members`).catch(() => []);
  targetNames = ['Dosen Pembina', 'Semua tim', ...members.map((u) => u.name || u.username)];
  const total = board.segments.reduce((n, s) => n + s.tasks.length, 0);
  // Simpan posisi scroll horizontal supaya board tidak loncat ke kiri setelah re-render.
  const scrollLeft = content.querySelector('.board')?.scrollLeft ?? 0;

  content.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, h('a', { href: 'projects.html', style: 'color:inherit' }, 'Projects'), ` / ${board.project.key}`),
        h('h1', {}, board.project.name),
        h('p', { class: 'sub' }, `${total} task${total === 1 ? '' : 's'} across ${board.segments.length} segment${board.segments.length === 1 ? '' : 's'}. Done tasks are archived after ${board.project.archiveAfterHours} hours.`)),
      h('div', { class: 'row-form' },
        h('a', { class: 'btn btn-outline btn-inline', href: `members.html?key=${encodeURIComponent(key)}` }, 'Members'),
        h('label', { class: 'check g2', style: 'padding:8px 12px' },
          h('input', { type: 'checkbox', checked: includeArchived,
            onchange: (e) => { includeArchived = e.target.checked; render(); } }),
          'Show archived'))),
    h('div', { class: 'board' }, board.segments.map(segmentColumn), addSegmentColumn()));
  content.querySelector('.board').scrollLeft = scrollLeft;
}

if (!key) {
  location.replace('projects.html');
} else {
  initLayout('projects').then((me) => { meName = me?.username ?? 'Tim'; return render(); }).catch((e) => showPageError(content, e));
}
