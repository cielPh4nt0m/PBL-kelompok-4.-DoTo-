// Helper kecil untuk membangun DOM. Teks selalu lewat textContent (aman dari XSS).

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key in el && typeof value !== 'string') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const $ = (selector, root = document) => root.querySelector(selector);

export function param(name) {
  return new URLSearchParams(location.search).get(name);
}

export function formatDate(ms) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export const STATUSES = ['idea', 'todo', 'in_progress', 'needs_review', 'done'];
export const STATUS_LABEL = {
  idea: 'Idea', todo: 'Todo', in_progress: 'In Progress', needs_review: 'Needs Review', done: 'Done',
};
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function statusSelect(value, onChange) {
  return h('select', { 'aria-label': 'Status', onchange: (e) => onChange(e.target.value) },
    STATUSES.map((s) => h('option', { value: s, selected: s === value }, STATUS_LABEL[s])));
}
