// Penentu tema terang/gelap. Dimuat SINKRON paling awal di <head> supaya
// atribut data-theme sudah ada sebelum halaman digambar (tanpa kedipan putih).
// Default mengikuti sistem; setelah user menekan tombol, pilihannya diingat.
(function () {
  var KEY = 'doto-appearance'; // pengaturan tampilan, per perangkat (browser)
  var LEGACY = 'doto-theme';
  var DEFAULTS = { theme: 'system', accent: 'blue', text: 'medium', taskView: 'board', compact: false, reduceMotion: false };
  var ACCENTS = { blue: '#3d8bf2', purple: '#8b5cf6', teal: '#14b8a6', orange: '#f97316', pink: '#ec4899' };
  var ENUMS = { theme: ['light', 'dark', 'system'], accent: Object.keys(ACCENTS), text: ['small', 'medium', 'large'], taskView: ['list', 'board'] };
  var root = document.documentElement;
  var media = matchMedia('(prefers-color-scheme: dark)');

  function read() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { p = {}; }
    if (!p.theme) { try { var lg = localStorage.getItem(LEGACY); if (lg === 'light' || lg === 'dark') p.theme = lg; } catch (e) { /* abaikan */ } }
    var out = Object.assign({}, DEFAULTS, p);
    Object.keys(ENUMS).forEach(function (k) { if (ENUMS[k].indexOf(out[k]) < 0) out[k] = DEFAULTS[k]; });
    out.compact = out.compact === true; out.reduceMotion = out.reduceMotion === true;
    return out;
  }
  function resolve(p) { return p.theme === 'system' ? (media.matches ? 'dark' : 'light') : p.theme; }
  function apply(p) {
    root.dataset.theme = resolve(p);
    root.dataset.accent = p.accent;
    root.dataset.text = p.text;
    root.dataset.motion = p.reduceMotion ? 'reduce' : 'full';
    root.dataset.compact = p.compact ? '1' : '0';
    var buttons = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < buttons.length; i++) sync(buttons[i]);
  }
  function sync(btn) {
    var dark = root.dataset.theme === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title = btn.getAttribute('aria-label');
  }

  var current = read();
  apply(current);
  media.addEventListener('change', function () { if (current.theme === 'system') apply(current); });
  addEventListener('storage', function (e) { if (e.key === KEY) { current = read(); apply(current); } }); // antar tab

  window.DotoPrefs = {
    DEFAULTS: DEFAULTS, ACCENTS: ACCENTS,
    get: function () { return Object.assign({}, current); },
    resolve: resolve,
    set: function (partial) {
      current = Object.assign({}, current, partial);
      try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (e) { /* tetap berlaku walau tidak tersimpan */ }
      apply(current);
    },
    reset: function () { window.DotoPrefs.set(DEFAULTS); },
  };

  // Mode compact: Projects, Calendar, dan AI digabung di compact.html. ?embed=1 = dimuat di dalam panel (tanpa topbar).
  var qs = new URLSearchParams(location.search);
  var embed = qs.get('embed') === '1';
  if (embed) root.dataset.embed = '1';
  var page = location.pathname.split('/').pop() || '';
  if (!embed) {
    if (current.compact && /^(projects|calendar|ai)\.html$/.test(page)) location.replace('compact.html' + (qs.get('key') ? '?key=' + encodeURIComponent(qs.get('key')) : ''));
    else if (!current.compact && page === 'compact.html') location.replace('projects.html');
  }

  var ICONS =
    '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
    '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>';

  window.DotoTheme = {
    get: function () { return root.dataset.theme; },
    toggle: function () {
      window.DotoPrefs.set({ theme: root.dataset.theme === 'dark' ? 'light' : 'dark' });
    },
    button: function (extraClass) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle' + (extraClass ? ' ' + extraClass : '');
      btn.innerHTML = ICONS;
      btn.addEventListener('click', window.DotoTheme.toggle);
      sync(btn);
      return btn;
    },
  };

  // Halaman tanpa topbar maupun sidebar (login/register): tombol mengambang di pojok kanan atas.
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.body.classList.contains('app') && !document.body.classList.contains('app-page')) {
      document.body.append(window.DotoTheme.button('theme-fab'));
    }
  });
})();

// Fade-out saat berpindah halaman (setengah durasi fade-in body: .45s; ubah juga page-out di design.css).
// Semua klik <a> internal otomatis ikut; navigasi lewat JS memakai window.dotoGo(url).
(function () {
  var root = document.documentElement; // blok ini terpisah dari blok di atas, jadi root harus dideklarasikan ulang
  var leaveMs = function () { return root.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450; };
  var leaving = false;
  window.dotoGo = function (url, replace) {
    if (leaving) return;
    leaving = true;
    var wait = 0;
    // Efek visual tidak boleh menggagalkan perpindahan: kalau ada yang error, langsung pindah tanpa fade.
    try { wait = leaveMs(); document.body.classList.add('page-leave'); } catch (err) { wait = 0; }
    setTimeout(function () { if (replace) location.replace(url); else location.href = url; }, wait);
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search && u.hash)) return;
    e.preventDefault();
    if (window.self !== window.top) { window.top.location.href = a.href; return; } // di dalam panel compact: buka di jendela utama
    window.dotoGo(a.href);
  });
  // Tombol Back (bfcache): halaman yang kembali tidak boleh tertinggal transparan.
  addEventListener('pageshow', function (e) {
    if (e.persisted) { leaving = false; document.body.classList.remove('page-leave'); }
  });
})();

// Diagnosa: bila JavaScript halaman gagal dimuat (file hilang / salah folder), tampilkan pesan yang jelas.
(function () {
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/theme\.js(\?.*)?$/, '') : '';
  var CORE = ['api.js', 'dom.js', 'layout.js', 'meta.js', 'notify.js', 'ai-prefs.js', 'fe-shell.js'];
  var shown = false;
  function banner(html) {
    if (shown || !document.body) return;
    shown = true;
    var b = document.createElement('div');
    b.setAttribute('role', 'alert');
    b.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:10001;padding:12px 16px;border-radius:12px;background:#b42318;color:#fff;font:600 13px/1.5 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    b.innerHTML = html;
    document.body.appendChild(b);
  }
  function missingFiles() {
    if (!base || !window.fetch) return Promise.resolve([]);
    return Promise.all(CORE.map(function (f) {
      return fetch(base + f, { method: 'HEAD', cache: 'no-store' }).then(function (r) { return r.ok ? null : f; }).catch(function () { return null; });
    })).then(function (r) { return r.filter(Boolean); });
  }
  function report(reason) {
    missingFiles().then(function (missing) {
      banner(missing.length
        ? 'File JavaScript tidak ditemukan: <b>' + missing.map(function (f) { return 'assets/js/' + f; }).join(', ') + '</b>. Pastikan file itu ada langsung di folder <b>assets/js/</b> (bukan di dalam pages/), lalu muat ulang dengan Ctrl+Shift+R.'
        : reason + ' Buka Console (F12) untuk melihat detail error.');
    });
  }
  addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'SCRIPT') report('Sebuah file JavaScript gagal dimuat.');
  }, true);
  addEventListener('load', function () {
    setTimeout(function () {
      var b = document.body;
      if (!b) return;
      if (b.classList.contains('app-page') && !document.querySelector('.side')) report('Sidebar tidak muncul karena JavaScript halaman ini gagal berjalan.');
      else if (b.classList.contains('app') && !document.querySelector('.topbar')) report('Menu atas tidak muncul karena JavaScript halaman ini gagal berjalan.');
    }, 2500);
  });
})();
