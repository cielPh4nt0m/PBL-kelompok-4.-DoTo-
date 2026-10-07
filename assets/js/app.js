/* Doto – efek latar: foto bisnis "hujan" jatuh pelan di belakang halaman.
   Pakai: <script src="assets/js/effects.js" defer></script>
   dan taruh <div class="rain" aria-hidden="true"></div> tepat setelah <body>. */
(function () {
  // Ganti dengan nama file foto bisnismu (taruh di assets/img/)
    // Folder foto dihitung dari lokasi effects.js, jadi aman dari halaman mana pun
  var BASE = document.currentScript.src.replace(/js\/[^/]*$/, 'img/');
  var FILES = [
    'bisnis-1.png', 'bisnis-2.png', 'bisnis-3.png', 'bisnis-4.png',
    'bisnis-5.png', 'bisnis-6.png', 'bisnis-7.png', 'bisnis-8.png',
    'bisnis-9.png', 'bisnis-10.png', 'bisnis-11.png', 'bisnis-12.png',
    'bisnis-13.png', 'bisnis-14.png'
  ];
  var IMAGES = FILES.map(function (f) { return BASE + f; });
  // var FALLBACK = ['📈', '💼', '🤝', '📊', '🗂️', '💡'];

  var layer = document.querySelector('.rain');
  if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var COUNT = innerWidth < 640 ? 8 : 14;
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  function load(src) {
    return new Promise(function (ok) {
      var i = new Image();
      i.onload = function () { ok(src); };
      i.onerror = function () { console.warn('Foto tidak ditemukan:', src); ok(null); };
      i.src = src;
    });
  }

  Promise.all(IMAGES.map(load)).then(function (res) {
    var photos = res.filter(Boolean);
    for (var n = 0; n < COUNT; n++) {
      var c = document.createElement('div');
      var dur = rand(16, 30);
      c.className = 'rain-card';
      c.style.setProperty('--x', rand(0, 94).toFixed(1) + '%');
      c.style.setProperty('--s', Math.round(rand(90, 170)) + 'px');
      c.style.setProperty('--r', rand(-14, 14).toFixed(1) + 'deg');
      c.style.setProperty('--o', rand(0.45, 0.8).toFixed(2));
      c.style.setProperty('--d', dur.toFixed(1) + 's');
      c.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');
      if (photos.length) {
        c.style.backgroundImage = 'url("' + photos[n % photos.length] + '")';
      } else {
        c.classList.add('fallback');
        c.textContent = FALLBACK[n % FALLBACK.length];
      }
      layer.appendChild(c);
    }
  });
})();
