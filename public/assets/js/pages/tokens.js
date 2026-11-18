import { api, errorText } from '../api.js';
import { h, formatDate } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');
let revealed = null; // token baru yang baru saja dibuat (hanya ditampilkan sekali)

function tokenRow(t) {
  const status = t.revokedAt ? `Revoked ${formatDate(t.revokedAt)}` : 'Active';
  return h('tr', { class: t.revokedAt ? 'revoked' : null },
    h('td', {}, h('strong', {}, t.label)),
    h('td', {}, formatDate(t.createdAt)),
    h('td', {}, t.lastUsedAt ? formatDate(t.lastUsedAt) : 'Never'),
    h('td', {}, status),
    h('td', {}, t.revokedAt ? null : h('button', {
      class: 'btn-danger', type: 'button',
      onclick: async () => {
        if (!confirm(`Revoke token "${t.label}"? Apps using it will stop working.`)) return;
        try {
          await api.del(`/tokens/${encodeURIComponent(t.id)}`);
        } catch (e) {
          alert(errorText(e));
        }
        revealed = null;
        await render();
      },
    }, 'Revoke')));
}

function revealBox() {
  if (!revealed) return null;
  const code = h('code', {}, revealed.token);
  const copy = h('button', { class: 'btn btn-outline btn-inline', type: 'button',
    onclick: async () => {
      try { await navigator.clipboard.writeText(revealed.token); copy.textContent = 'Copied'; } catch { /* clipboard tidak diizinkan */ }
    } }, 'Copy');
  return h('div', { class: 'token-reveal g2', role: 'status' },
    h('strong', {}, `Token "${revealed.label}" created`),
    code,
    h('p', { style: 'margin:0 0 8px;font-size:.82rem' }, 'Save it now — it will not be shown again.'),
    copy);
}

async function render() {
  const tokens = await api.get('/me/tokens');

  const label = h('input', { placeholder: 'Label (e.g. laptop CLI)', 'aria-label': 'Token label' });
  const err = h('p', { class: 'form-error', role: 'alert' });
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      if (!label.value.trim()) return label.focus();
      try {
        revealed = await api.post('/me/tokens', { label: label.value.trim() });
        await render();
      } catch (ex) {
        err.textContent = errorText(ex);
      }
    },
  }, h('div', { class: 'row-form' }, label, h('button', { class: 'btn btn-primary btn-inline', type: 'submit' }, 'Create token')), err);

  content.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, 'Account'),
        h('h1', {}, 'API tokens'),
        h('p', { class: 'sub' }, 'Tokens let the doto CLI and AI agents (MCP) act as you. Treat them like passwords.'))),
    h('section', { class: 'panel g1' }, h('h2', {}, 'New token'), form, revealBox()),
    h('section', { class: 'panel g1' },
      h('h2', {}, 'Your tokens'),
      tokens.length
        ? h('div', { class: 'table-wrap' }, h('table', {},
            h('thead', {}, h('tr', {}, ['Label', 'Created', 'Last used', 'Status', ''].map((c) => h('th', { class: 'label-caps' }, c)))),
            h('tbody', {}, tokens.map(tokenRow))))
        : h('p', { class: 'empty' }, 'No tokens yet.')));
}

initLayout('tokens').then(render).catch((e) => showPageError(content, e));
