/* Doto – efek latar: foto bisnis "hujan" jatuh pelan di belakang halaman.
   Pakai: <script src="assets/js/effects.js" defer></script>
   dan taruh <div class="rain" aria-hidden="true"></div> tepat setelah <body>. */
(function () {
  // Ganti dengan nama file foto bisnismu (taruh di assets/img/)
  var IMAGES = [
    'assets/img/bisnis-1.jpg',
    'assets/img/bisnis-2.jpg',
    'assets/img/bisnis-3.jpg',
    'assets/img/bisnis-4.jpg',
    'assets/img/bisnis-5.jpg',
    'assets/img/bisnis-6.jpg',
    'assets/img/bisnis-7.jpg',
    'assets/img/bisnis-8.jpg',
    'assets/img/bisnis-9.jpg',
    'assets/img/bisnis-10.jpg',
    'assets/img/bisnis-11.jpg',
    'assets/img/bisnis-12.jpg',
    'assets/img/bisnis-13.jpg',
    'assets/img/bisnis-14.jpg'
  ];
  var FALLBACK = ['📈', '💼', '🤝', '📊', '🗂️', '💡']; // dipakai bila foto belum ada

  var layer = document.querySelector('.rain');
  if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var COUNT = innerWidth < 640 ? 8 : 14;
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  function load(src) {
    return new Promise(function (ok) {
      var i = new Image();
      i.onload = function () { ok(src); };
      i.onerror = function () { ok(null); };
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
