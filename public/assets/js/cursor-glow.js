// Sorotan cahaya lembut yang mengikuti kursor di balik panel kaca.
// Hanya untuk perangkat dengan mouse/trackpad, dan mati kalau user memilih
// "kurangi animasi". Gaya ada di design.css (.cursor-glow).
(function () {
  if (matchMedia('(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

  var glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.prepend(glow);

  var half = glow.offsetWidth / 2;
  var x = innerWidth / 2, y = innerHeight / 2; // posisi sekarang
  var tx = x, ty = y;                          // posisi tujuan (kursor)
  var running = false;

  function frame() {
    // Lerp: setiap frame mendekat 12% ke kursor, jadi sorotan sedikit tertinggal.
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.setProperty('--x', (x - half) + 'px');
    glow.style.setProperty('--y', (y - half) + 'px');

    // Berhenti saat sudah sampai supaya tidak memakan CPU ketika mouse diam.
    if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    if (!glow.classList.contains('on')) {
      // Muncul pertama kali langsung di posisi kursor, bukan meluncur dari tengah.
      x = e.clientX; y = e.clientY;
      glow.classList.add('on');
    }
    tx = e.clientX; ty = e.clientY;
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }, { passive: true });

  function hide() { glow.classList.remove('on'); }
  document.documentElement.addEventListener('pointerleave', hide);
  addEventListener('blur', hide);
})();
