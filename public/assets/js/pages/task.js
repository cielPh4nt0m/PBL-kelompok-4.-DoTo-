import { api, errorText } from '../api.js';
import { h, param, formatDate, PRIORITIES, statusSelect } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');
const id = param('id') ?? '';
const base = `/tasks/${encodeURIComponent(id)}`;

function channelLabel(entry) {
  return entry.actorChannel === 'agent' ? `agent:${entry.agentName ?? '?'}` : entry.actorChannel;
}

function historyItem(entry) {
  let detail = null;
  if (entry.action === 'comment') {
    detail = h('div', { class: 'comment g2' }, entry.comment);
  } else if (entry.fieldName) {
    detail = h('div', {}, `${entry.fieldName}: ${entry.oldValue ?? '-'} → ${entry.newValue ?? '-'}`);
  }
  return h('li', {},
    h('div', { class: 'meta' },
      h('span', {}, formatDate(entry.createdAt)),
      h('span', { class: `chip${entry.actorChannel === 'agent' ? ' solid' : ''}` }, channelLabel(entry)),
      h('strong', { style: 'color:var(--ink)' }, entry.action.replace('_', ' '))),
    detail);
}

// Form satu baris: input + tombol, dengan pesan error di bawahnya.
function inlineForm(placeholder, buttonText, onSubmit, type = 'text') {
  const input = h('input', { type, placeholder, 'aria-label': placeholder });
  const err = h('p', { class: 'form-error', role: 'alert' });
  return h('form', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      if (!input.value.trim()) return input.focus();
      try {
        await onSubmit(input.value.trim());
        await render();
      } catch (ex) {
        err.textContent = errorText(ex);
      }
    },
  }, h('div', { class: 'row-form' }, input, h('button', { class: 'btn btn-primary btn-inline', type: 'submit' }, buttonText)), err);
}

async function update(path, body) {
  try {
    await api.patch(`${base}${path}`, body);
  } catch (e) {
    alert(errorText(e));
  }
  await render();
}

async function render() {
  const [task, history] = await Promise.all([api.get(base), api.get(`${base}/history`)]);
  const projectKey = task.displayId.split('-')[0];
  document.title = `Doto – ${task.displayId}`;

  const prioritySelect = h('select', { 'aria-label': 'Priority', onchange: (e) => update('/priority', { priority: e.target.value }) },
    PRIORITIES.map((p) => h('option', { value: p, selected: p === task.priority }, p)));

  content.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' },
          h('a', { href: 'projects.html', style: 'color:inherit' }, 'Projects'), ' / ',
          h('a', { href: `board.html?key=${encodeURIComponent(projectKey)}`, style: 'color:inherit' }, projectKey), ` / ${task.displayId}`),
        h('div', { class: 'task-title' },
          h('h1', {}, task.title),
          h('span', { class: `pill ${task.priority}` }, task.priority),
          task.archivedAt ? h('span', { class: 'chip' }, 'archived') : null))),
    h('div', { class: 'layout-2' },
      h('div', {},
        h('section', { class: 'panel g1' },
          h('h2', {}, 'Description'),
          h('p', { class: `task-desc${task.description ? '' : ' muted'}` }, task.description || 'No description.')),
        h('section', { class: 'panel g1' },
          h('h2', {}, 'Activity'),
          history.length ? h('ul', { class: 'timeline' }, history.map(historyItem)) : h('p', { class: 'empty' }, 'No activity yet.'),
          inlineForm('Add a comment…', 'Send', (comment) => api.post(`${base}/comments`, { comment })))),
      h('aside', { class: 'panel g1' },
        h('div', { class: 'field-list' },
          h('div', {}, h('label', {}, 'Status'), statusSelect(task.status, (status) => update('/status', { status }))),
          h('div', {}, h('label', {}, 'Priority'), prioritySelect),
          h('div', {},
            h('label', {}, 'Assignee'),
            h('p', { style: 'margin:0 0 8px;font-size:.9rem;font-weight:600' },
              task.assigneeUsername ? `@${task.assigneeUsername}` : 'unassigned',
              task.assigneeEmail ? h('span', { class: 'muted', style: 'font-weight:400' }, ` · ${task.assigneeEmail}`) : null),
            inlineForm('Reassign to email…', 'Reassign',
              (assigneeEmail) => api.patch(`${base}/assignee`, { assigneeEmail }), 'email')),
          task.tags.length
            ? h('div', {}, h('label', {}, 'Tags'), h('div', { class: 'chips', style: 'margin:0' }, task.tags.map((t) => h('span', { class: 'chip' }, t))))
            : null,
          h('div', { class: 'muted', style: 'font-size:.78rem' },
            h('div', {}, `Created ${formatDate(task.createdAt)}`),
            h('div', {}, `Updated ${formatDate(task.updatedAt)}`))))));
}

if (!id) {
  location.replace('projects.html');
} else {
  initLayout('projects').then(render).catch((e) => showPageError(content, e));
}
