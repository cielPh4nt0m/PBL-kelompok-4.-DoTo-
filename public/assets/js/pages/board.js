import { api, errorText } from '../api.js';
import { h, param, STATUSES, STATUS_LABEL, statusSelect } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');
const key = (param('key') ?? '').toUpperCase();
let includeArchived = false;
let openFormSegment = null; // id segment yang sedang menampilkan form "+ Task"

function taskCard(task) {
  const href = `task.html?id=${encodeURIComponent(task.displayId)}`;
  return h('div', { class: `task-card g2 lift${task.archivedAt ? ' archived' : ''}` },
    h('a', { href },
      h('div', { class: 'task-card-top' },
        h('span', { class: 'mono' }, task.displayId),
        h('span', { class: `pill ${task.priority}` }, task.priority)),
      h('p', {}, task.title),
      h('span', { class: 'who' }, task.assigneeUsername ? `@${task.assigneeUsername}` : 'unassigned')),
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
  const err = h('p', { class: 'form-error', role: 'alert' });
  queueMicrotask(() => title.focus());
  return h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!title.value.trim()) return title.focus();
      try {
        await api.post(`/projects/${encodeURIComponent(key)}/tasks`, { segmentName: segment.name, title: title.value.trim() });
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
  h('button', { class: 'btn-danger', type: 'button', style: 'margin-top:6px',
    onclick: () => { openFormSegment = null; render(); } }, 'Cancel'),
  err);
}

function segmentColumn({ segment, tasks }) {
  return h('section', { class: 'segment-col g1' },
    h('h2', {}, segment.name, h('span', { class: 'chip' }, String(tasks.length))),
    STATUSES.map((status) => {
      const list = tasks.filter((t) => t.status === status);
      return h('div', { class: 'status-group' },
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
  const total = board.segments.reduce((n, s) => n + s.tasks.length, 0);
  // Simpan posisi scroll horizontal supaya board tidak loncat ke kiri setelah re-render.
  const scrollLeft = content.querySelector('.board')?.scrollLeft ?? 0;

  content.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, h('a', { href: 'projects.html', style: 'color:inherit' }, 'Projects'), ` / ${board.project.key}`),
        h('h1', {}, board.project.name),
        h('p', { class: 'sub' }, `${total} task${total === 1 ? '' : 's'} across ${board.segments.length} segment${board.segments.length === 1 ? '' : 's'}. Done tasks are archived after ${board.project.archiveAfterHours} hours.`)),
      h('label', { class: 'check g2', style: 'padding:8px 12px' },
        h('input', { type: 'checkbox', checked: includeArchived,
          onchange: (e) => { includeArchived = e.target.checked; render(); } }),
        'Show archived')),
    h('div', { class: 'board' }, board.segments.map(segmentColumn), addSegmentColumn()));
  content.querySelector('.board').scrollLeft = scrollLeft;
}

if (!key) {
  location.replace('projects.html');
} else {
  initLayout('projects').then(render).catch((e) => showPageError(content, e));
}
