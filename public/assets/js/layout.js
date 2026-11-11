// Kerangka halaman app: cek sesi login lalu pasang topbar kaca.
import { startNotifier } from './notify.js';
import { api } from './api.js';
import { h } from './dom.js';

const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fe3f0"/><stop offset=".55" stop-color="#3a8be6"/><stop offset="1" stop-color="#6a3fa8"/></linearGradient></defs><rect x="2" y="2" width="36" height="36" rx="11" fill="url(#lg)"/><path d="M14 10h7a10 10 0 0 1 0 20h-7z" fill="#0f1e3d" opacity=".85"/><path d="M18 15l7 5-7 5z" fill="#fff"/></svg>`;

const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

const LINKS = [
  ['welcome', 'welcome.html', 'Welcome'],
  ['calendar', 'calendar.html', 'Calendar'],
  ['projects', 'projects.html', 'Projects'],
  ['ai', 'ai.html', 'AI'],
  ['tokens', 'tokens.html', 'Tokens'],
];

// active: kunci menu yang disorot. Mengembalikan data user yang sedang login.
export async function initLayout(active) {
  let me;
  try {
    me = await api.get('/me');
  } catch (err) {
    if (err.status === 401) {
      location.replace('login.html');
      return new Promise(() => {}); // berhenti di sini selama pindah halaman
    }
    throw err;
  }
  startNotifier(me); // notifikasi browser sesuai Settings > Notification

  const brand = h('a', { class: 'brand', href: 'welcome.html' });
  brand.innerHTML = `${LOGO}<div><h1>Doto</h1><p>Doto : Manajemen Tugas Tim &amp; Agen AI</p></div>`;

  const logout = h('button', {
    class: 'btn btn-outline btn-inline', type: 'button',
    onclick: async () => {
      await api.post('/auth/logout');
      window.dotoGo('login.html');
    },
  }, 'Log out');

  // Settings (ikon saja) menggantikan tombol tema; membuka halaman Settings bertampilan sidebar.
  const settings = h('a', { class: 'settings-btn', href: 'settings.html', 'aria-label': 'Settings', title: 'Settings' });
  settings.innerHTML = GEAR;
  // Hover: gear berputar 360° searah jarum jam, pelan-cepat-pelan. Selalu selesai satu putaran penuh.
  let spinning = false;
  const spin = () => {
    if (spinning || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    spinning = true;
    const done = () => { spinning = false; };
    const anim = settings.firstElementChild.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 900, easing: 'cubic-bezier(.6, .05, .25, 1)' });
    anim.onfinish = done;
    anim.oncancel = done;
  };
  settings.addEventListener('mouseenter', spin);
  settings.addEventListener('focus', spin);

  const bar = h('header', { class: 'topbar g1' },
    brand,
    h('nav', { class: 'nav', 'aria-label': 'Main' },
      LINKS.map(([key, href, label]) =>
        h('a', { href, 'aria-current': key === active ? 'page' : null }, label))),
    h('div', { class: 'user-chip' },
      h('div', { class: 'avatar', 'aria-hidden': 'true' }, me.username.slice(0, 1).toUpperCase()),
      h('span', {}, me.username)),
    settings,
    logout);

  document.body.prepend(bar);
  return me;
}

// Tampilkan error fatal di area konten halaman.
export function showPageError(container, err) {
  container.replaceChildren(h('p', { class: 'page-error' }, err?.message ?? String(err)));
}
