// Penentu tema terang/gelap. Dimuat SINKRON paling awal di <head> supaya
// atribut data-theme sudah ada sebelum halaman digambar (tanpa kedipan putih).
// Default mengikuti sistem; setelah user menekan tombol, pilihannya diingat.
(function () {
  var KEY = 'doto-theme';
  var root = document.documentElement;
  var media = matchMedia('(prefers-color-scheme: dark)');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(theme) {
    root.dataset.theme = theme;
    var buttons = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < buttons.length; i++) sync(buttons[i]);
  }

  function sync(btn) {
    var dark = root.dataset.theme === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title = btn.getAttribute('aria-label');
  }

  var saved = stored();
  apply(saved === 'light' || saved === 'dark' ? saved : (media.matches ? 'dark' : 'light'));

  // Ikuti perubahan tema sistem selama user belum memilih sendiri.
  media.addEventListener('change', function (e) {
    if (!stored()) apply(e.matches ? 'dark' : 'light');
  });

  var ICONS =
    '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
    '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>';

  window.DotoTheme = {
    get: function () { return root.dataset.theme; },
    toggle: function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) { /* tetap ganti walau tidak tersimpan */ }
      apply(next);
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

  // Halaman tanpa topbar (login/register): tombol mengambang di pojok kanan atas.
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.body.classList.contains('app')) {
      document.body.append(window.DotoTheme.button('theme-fab'));
    }
  });
})();
