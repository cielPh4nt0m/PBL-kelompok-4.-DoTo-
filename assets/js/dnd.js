// Geser kartu tugas antar kolom segment (mouse + sentuhan).
// - Mouse: tahan lalu geser (mulai setelah bergerak ±5 px, jadi klik biasa tetap membuka detail tugas).
// - Sentuhan: tahan ±0,35 detik dulu supaya tidak bentrok dengan scroll, lalu geser.
// - Kartu terasa berbobot: saat digeser ke kanan badannya tertinggal ke kiri (dan sebaliknya), lalu berayun pelan kembali.
// - Reduce Animations (html[data-motion="reduce"]): tanpa ayunan dan tanpa animasi.
const HOLD_MS = 350;
const SLOP = { mouse: 5, touch: 8, pen: 5 };
export const SWING = { gain: 0.4, max: 13, stiff: 0.05, damp: 0.86 }; // makin kecil stiff / makin besar damp = makin berat
const STEP_MS = 1000 / 60;
const INTERACTIVE = 'select, button, input, textarea, option, label';

// Satu langkah fisika ayunan. vx = kecepatan horizontal (px per frame). Mengembalikan state yang sama.
export function swingStep(s, vx, reduce) {
  if (reduce) { s.angle = 0; s.omega = 0; return s; }
  const target = Math.max(-SWING.max, Math.min(SWING.max, vx * SWING.gain));
  s.omega = (s.omega + (target - s.angle) * SWING.stiff) * SWING.damp;
  s.angle = Math.max(-SWING.max * 1.15, Math.min(SWING.max * 1.15, s.angle + s.omega)); // melampaui sedikit boleh (ayunan), tapi dibatasi
  return s;
}

export function enableCardDrag({ cardSel, colSel, canDrag = () => true, onDrop }) {
  let st = null;
  const reduce = () => document.documentElement.dataset.motion === 'reduce';

  function setOver(col) {
    if (st.over === col) return;
    if (st.over) st.over.classList.remove('dnd-over');
    st.over = col;
    if (col) col.classList.add('dnd-over');
  }
  function cleanup() {
    if (!st) return;
    clearTimeout(st.hold);
    cancelAnimationFrame(st.raf);
    st.card.classList.remove('dnd-armed', 'dnd-origin');
    if (st.over) st.over.classList.remove('dnd-over');
    document.body.classList.remove('dnd-active');
    ['pointermove', 'pointerup', 'pointercancel', 'keydown'].forEach((t) => document.removeEventListener(t, handlers[t]));
    st = null;
  }
  function removeGhost(g, after = 0) {
    if (!g) return;
    if (after) setTimeout(() => g.remove(), after); else g.remove();
  }
  function suppressNextClick() {
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 250);
  }

  function begin() {
    const r = st.card.getBoundingClientRect();
    st.active = true;
    st.dx = st.x0 - r.left; // titik yang dipegang (saat ditekan), supaya kartu tidak melompat
    st.dy = st.y0 - r.top;
    st.rect = r;
    const g = st.card.cloneNode(true);
    g.classList.add('dnd-ghost');
    g.classList.remove('dnd-armed');
    g.style.width = `${r.width}px`;
    g.style.transformOrigin = `${st.dx}px ${st.dy}px`; // berayun dari titik yang dipegang
    document.body.appendChild(g);
    st.ghost = g;
    st.card.classList.remove('dnd-armed');
    st.card.classList.add('dnd-origin');
    document.body.classList.add('dnd-active');
    st.sway = { angle: 0, omega: 0 };
    st.vx = 0;
    st.lastX = st.x;
    st.acc = 0;
    st.last = 0;
    st.raf = requestAnimationFrame(frame);
  }

  function place() {
    const a = st.sway.angle;
    st.ghost.style.transform = `translate(${st.x - st.dx}px, ${st.y - st.dy}px) rotate(${a.toFixed(2)}deg)${reduce() ? '' : ' scale(1.03)'}`;
  }

  function frame(ts) {
    if (!st || !st.active) return;
    const dt = st.last ? Math.min(ts - st.last, 64) : STEP_MS;
    st.last = ts;
    // kecepatan horizontal (px/frame), dihaluskan supaya ayunan tidak patah-patah
    const inst = ((st.x - st.lastX) / Math.max(dt, 1)) * STEP_MS;
    st.lastX = st.x;
    st.vx += (inst - st.vx) * 0.35;
    st.acc += dt;
    const rd = reduce();
    while (st.acc >= STEP_MS) { swingStep(st.sway, st.vx, rd); st.acc -= STEP_MS; }
    place();
    // kolom tujuan: elemen di bawah kursor (kartu bayangan tidak menangkap pointer)
    const el = document.elementFromPoint(st.x, st.y);
    const col = el && el.closest(colSel);
    setOver(col && col !== st.card.closest(colSel) ? col : null);
    // auto-scroll horizontal saat kursor dekat tepi papan
    const board = st.card.closest('.board');
    if (board) {
      const b = board.getBoundingClientRect();
      if (st.x < b.left + 60) board.scrollLeft -= 14; else if (st.x > b.right - 60) board.scrollLeft += 14;
    }
    st.raf = requestAnimationFrame(frame);
  }

  function finish(drop) {
    const s = st;
    const ghost = s.ghost;
    const col = s.over;
    const rd = reduce();
    if (!s.active) { cleanup(); return; }
    suppressNextClick();
    if (drop && col) {
      cleanup();
      if (!rd && ghost) { ghost.style.transition = 'opacity .16s'; ghost.style.opacity = '0'; }
      removeGhost(ghost, rd ? 0 : 170);
      onDrop(s.card, col);
    } else {
      // gagal/dibatalkan: kartu meluncur kembali ke tempat semula
      if (!rd && ghost) {
        ghost.style.transition = 'transform .22s ease';
        ghost.style.transform = `translate(${s.rect.left}px, ${s.rect.top}px) rotate(0deg)`;
      }
      cleanup();
      removeGhost(ghost, rd ? 0 : 230);
    }
  }

  const handlers = {
    pointermove(e) {
      if (!st || e.pointerId !== st.id) return;
      st.x = e.clientX;
      st.y = e.clientY;
      if (st.active) return;
      const moved = Math.hypot(e.clientX - st.x0, e.clientY - st.y0);
      if (st.type === 'touch' && !st.ready) {
        if (moved > SLOP.touch) cleanup(); // jari bergerak sebelum "tahan" selesai = scroll biasa
        return;
      }
      if (moved > (SLOP[st.type] ?? 5)) begin();
    },
    pointerup(e) { if (st && e.pointerId === st.id) finish(true); },
    pointercancel(e) { if (st && e.pointerId === st.id) finish(false); },
    keydown(e) { if (st && e.key === 'Escape') finish(false); },
  };

  document.addEventListener('pointerdown', (e) => {
    if (st) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target;
    const card = t.closest && t.closest(cardSel);
    if (!card || t.closest(INTERACTIVE) || !canDrag(card)) return;
    st = { id: e.pointerId, type: e.pointerType || 'mouse', card, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, active: false, ready: e.pointerType !== 'touch', over: null };
    if (st.type === 'touch') {
      card.classList.add('dnd-armed');
      st.hold = setTimeout(() => {
        if (!st) return;
        st.ready = true;
        if (navigator.vibrate) navigator.vibrate(15);
        begin(); // sudah ditahan: kartu langsung "terangkat"
      }, HOLD_MS);
    }
    ['pointermove', 'pointerup', 'pointercancel', 'keydown'].forEach((type) => document.addEventListener(type, handlers[type]));
  });
  // Cegah scroll saat kartu sedang diseret dengan jari, serta seleksi teks / drag bawaan browser
  document.addEventListener('touchmove', (e) => { if (st && st.active) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', (e) => { if (st && st.type === 'touch') e.preventDefault(); });
  document.addEventListener('selectstart', (e) => { if (st) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (e.target.closest && e.target.closest(cardSel)) e.preventDefault(); });
}
