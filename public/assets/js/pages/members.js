import { api, errorText } from '../api.js';
import { h, param } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');
const key = (param('key') ?? '').toUpperCase();
const projectPath = `/projects/${encodeURIComponent(key)}`;

async function render(me) {
  const [project, members] = await Promise.all([
    api.get(projectPath),
    api.get(`${projectPath}/members`),
  ]);
  const canManage = me.id === project.createdBy;
  document.title = `Doto – ${project.name} members`;

  const memberRows = members.map((member) => h('div', { class: 'action-card row-form' },
    h('div', {},
      h('strong', {}, member.name),
      h('p', { class: 'sub' }, `${member.email}${member.id === project.createdBy ? ' · Project creator' : ''}`)),
    canManage && member.id !== project.createdBy
      ? h('button', { class: 'btn-danger', type: 'button',
        onclick: async () => {
          try {
            await api.del(`${projectPath}/members/${encodeURIComponent(member.id)}`);
            await render(me);
          } catch (err) {
            alert(errorText(err));
          }
        } }, 'Remove')
      : null));

  const email = h('input', { type: 'email', placeholder: 'Registered user email',
    'aria-label': 'Registered user email', required: true });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const addForm = h('form', { class: 'field-list',
    onsubmit: async (event) => {
      event.preventDefault();
      error.textContent = '';
      try {
        await api.post(`${projectPath}/members`, { email: email.value.trim() });
        await render(me);
      } catch (err) {
        error.textContent = errorText(err);
      }
    } },
  h('label', {}, 'User email', email),
  h('button', { class: 'btn btn-primary', type: 'submit' }, 'Add member'),
  error);

  content.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, h('a', { href: `board.html?key=${encodeURIComponent(key)}` }, project.key), ' / Members'),
        h('h1', {}, `${project.name} members`),
        h('p', { class: 'sub' }, `${members.length} member${members.length === 1 ? '' : 's'}. Only members can be assigned tasks.`))),
    h('div', { class: 'layout-2' },
      h('section', { class: 'panel g1' }, h('h2', {}, 'Project members'), memberRows),
      canManage
        ? h('aside', { class: 'panel g1' }, h('h2', {}, 'Add member'), addForm)
        : h('aside', { class: 'panel g1' }, h('p', { class: 'sub' }, 'Only the project creator can manage members.'))));
}

if (!key) {
  location.replace('projects.html');
} else {
  initLayout('projects').then(render).catch((err) => showPageError(content, err));
}
