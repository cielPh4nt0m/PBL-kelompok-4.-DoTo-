// Penanda tersembunyi di akhir deskripsi untuk data yang belum punya kolom database (Target & Raised By).
// Tenggat BUKAN lagi di sini: tenggat memakai kolom/field `dueDate` pada task.
export const META_MARKER = '\n\n<!--doto-meta:';
export const META_END = '-->';
export const DEFAULT_DUE_DAYS = 14;

export function packDescription(text, meta = {}) {
  const payload = JSON.stringify({ to: meta.to || 'Semua tim', by: meta.by || 'Tim' });
  return `${(text || '').trim()}${META_MARKER}${payload}${META_END}`;
}

// -> { text: deskripsi bersih, meta: { to, by, ... } }
export function unpackMeta(raw) {
  const s = raw || '';
  const idx = s.lastIndexOf(META_MARKER);
  if (idx === -1 || !s.endsWith(META_END)) return { text: s, meta: {} };
  let meta = {};
  try { meta = JSON.parse(s.slice(idx + META_MARKER.length, -META_END.length)) || {}; } catch { meta = {}; }
  return { text: s.slice(0, idx).trim(), meta };
}

export const stripMeta = (raw) => unpackMeta(raw).text;

// yyyy-mm-dd (waktu lokal), n hari dari hari ini
export function dateFromToday(n = DEFAULT_DUE_DAYS) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
