import { api, errorText } from '../api.js';
import { h } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');

function projectCard(p) {
  return h('a', { class: 'project-card g2', href: `board.html?key=${encodeURIComponent(p.key)}` },
    h('span', { class: 'key' }, p.key),
    h('h3', {}, p.name),
    h('p', {}, 'Open board →'));
}

async function render() {
  const projects = await api.get('/projects');

  const keyInput = h('input', { placeholder: 'KEY (e.g. WEB)', maxlength: 10, 'aria-label': 'Project key',
    oninput: (e) => { e.target.value = e.target.value.toUpperCase(); } });
  const nameInput = h('input', { placeholder: 'Project name', 'aria-label': 'Project name' });
  const err = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Create project');

  const form = h('form', {
    class: 'field-list', novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const key = keyInput.value.trim().toUpperCase();
      const name = nameInput.value.trim();
      if (!/^[A-Z][A-Z0-9]{1,9}$/.test(key)) {
        err.textContent = 'Key must be 2–10 characters, start with a letter, letters/numbers only.';
        return keyInput.focus();
      }
      if (!name) { err.textContent = 'Enter a project name.'; return nameInput.focus(); }
      submit.disabled = true;
      try {
        await api.post('/projects', { key, name });
        await render();
      } catch (ex) {
        err.textContent = errorText(ex);
        submit.disabled = false;
      }
    },
  },
  h('div', {}, h('label', {}, 'Key'), keyInput),
  h('div', {}, h('label', {}, 'Name'), nameInput),
  submit, err);

  content.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, 'Workspace'),
        h('h1', {}, 'Projects'),
        h('p', { class: 'sub' }, `${projects.length} project${projects.length === 1 ? '' : 's'} — pick one to open its board.`))),
    h('div', { class: 'layout-2' },
      h('section', { class: 'panel g1' },
        h('h2', {}, 'All projects'),
        projects.length
          ? h('div', { class: 'project-grid' }, projects.map(projectCard))
          : h('p', { class: 'empty' }, 'No projects yet. Create the first one →')),
      h('aside', { class: 'panel g1' }, h('h2', {}, 'New project'), form)));
}

initLayout('projects').then(render).catch((e) => showPageError(content, e));
