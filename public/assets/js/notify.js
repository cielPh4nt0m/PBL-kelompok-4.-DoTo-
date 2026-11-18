// Notifikasi browser (Chrome Notification API) yang mengikuti Settings > Notification.
// Tanpa push dari server: pengecekan berkala (30 detik) ke API. Notifikasi hanya muncul bila izin Chrome = "granted".
// Pengaturan disimpan per akun di localStorage (backend: lihat BACKEND-NOTIFICATION-SPEC.md).
import { api } from './api.js';
import { unpackMeta } from './meta.js';
import { loadAiPrefs, addLog, myActiveTasks, dueEnd } from './ai-prefs.js';

const g = (id, title, sub, items) => ({ id, title, sub, items: items.map(([k, label, on]) => ({ k, label, on: Boolean(on) })) });
export const GROUPS = [
  g('tasks', '1. Task Updates', 'Notifikasi perubahan dan penyelesaian tugas', [
    ['taskNew', 'Tugas baru diberikan kepada saya', 1], ['taskUpdated', 'Tugas diperbarui', 1], ['taskStatus', 'Status tugas berubah', 1],
    ['taskDeadline', 'Deadline tugas berubah', 1], ['taskDone', 'Tugas selesai', 1]]),
  g('deadline', '2. Deadline Reminders', 'Pengingat batas waktu tugas', [
    ['dl1d', 'Pengingat 1 hari sebelum deadline', 1], ['dl1h', 'Pengingat 1 jam sebelum deadline', 0],
    ['dlLate', 'Pemberitahuan tugas terlambat', 1], ['dlPending', 'Pengingat tugas yang belum selesai', 0]]),
  g('comments', '3. Comments & Mentions', 'Aktivitas komentar dan sebutan', [
    ['mention', 'Seseorang menyebut saya (@username)', 1], ['comment', 'Ada komentar baru pada tugas saya', 1], ['reply', 'Ada balasan komentar saya', 0]]),
  g('team', '4. Team Activity', 'Aktivitas dan perubahan anggota tim', [
    ['memberAdded', 'Anggota ditambahkan ke proyek', 1], ['memberChange', 'Perubahan anggota tim', 0],
    ['announcement', 'Pengumuman proyek', 1], ['important', 'Aktivitas penting dalam proyek', 0]]),
  g('ai', '5. AI Agent Updates', 'Pembaruan dan laporan dari Agen AI DOTO', [
    ['agentDone', 'Agen AI selesai mengerjakan tugas', 1], ['agentFail', 'Agen AI gagal menjalankan tugas', 0],
    ['agentApproval', 'Agen AI membutuhkan persetujuan', 1], ['agentReport', 'Laporan atau ringkasan tugas selesai dibuat', 0]]),
];
const GROUP_OF = {};
GROUPS.forEach((gr) => gr.items.forEach((it) => { GROUP_OF[it.k] = gr.id; }));

const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* penyimpanan penuh: abaikan */ } };

export function loadPrefs(userId) {
  const def = { g: {}, i: {} };
  GROUPS.forEach((gr) => { def.g[gr.id] = true; gr.items.forEach((it) => { def.i[it.k] = it.on; }); });
  const s = rd(`doto-notif:${userId}`, null);
  return s ? { g: { ...def.g, ...s.g }, i: { ...def.i, ...s.i } } : def;
}
export const savePrefs = (userId, p) => {
  wr(`doto-notif:${userId}`, p);
  api.put('/me/notification-preferences', p).catch(() => {});
};
export async function syncPrefsFromServer(userId) {
  try {
    const remote = await api.get('/me/notification-preferences');
    if (remote && remote.g && remote.i) {
      wr(`doto-notif:${userId}`, remote);
      return loadPrefs(userId);
    }
  } catch { /* abaikan */ }
  return loadPrefs(userId);
}
const isOn = (p, kind) => Boolean(p.g[GROUP_OF[kind]] && p.i[kind]);

export const permission = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

function show(title, body, tag, url) {
  if (permission() !== 'granted') return false;
  try {
    const n = new Notification(title, { body, tag });
    n.onclick = () => { window.focus(); if (url) location.href = url; n.close(); };
    return true;
  } catch { return false; }
}
export const testNotification = () => show('Doto', 'Notifikasi Doto berfungsi.', 'doto-test');

let ctx = null; // { user, notify } milik notifier yang sedang berjalan
// Pintu untuk fitur lain (mis. halaman Agen AI): window.DotoNotify.emit('agentApproval', 'Judul', 'Isi', 'ai.html')
export const emit = (kind, title, body, url, dedupe) => ctx && ctx.notify(kind, title, body, url, dedupe);

export function startNotifier(user, opts = {}) {
  const uid = user.id;
  const dedupKey = `doto-notified:${uid}`;
  const snapKey = `doto-snap:${uid}`;
  const seen = rd(dedupKey, {});
  const cutoff = Date.now() - 30 * 864e5;
  Object.keys(seen).forEach((k) => { if (seen[k] < cutoff) delete seen[k]; });
  let busy = false;
  let round = 0;
  const keys = [user.username, user.name].filter(Boolean).map((x) => String(x).toLowerCase());
  const ts = (x) => new Date(x).getTime();
  const url = (d) => `task.html?id=${encodeURIComponent(d.displayId)}`;

  // Urutan cek: izin Chrome -> pengaturan -> sekali saja (dedupe). Dedupe tidak terpakai bila belum diizinkan.
  function notify(kind, title, body, link, dedupe) {
    if (permission() !== 'granted' || !isOn(loadPrefs(uid), kind)) return;
    if (dedupe) {
      if (seen[dedupe]) return;
      seen[dedupe] = Date.now();
      wr(dedupKey, seen);
    }
    show(title, body, dedupe, link);
  }
  ctx = { user, notify };

  const isMine = (d) => {
    const to = String(unpackMeta(d.description).meta.to || '').toLowerCase();
    return to ? to === 'semua tim' || keys.includes(to) : d.assigneeId === uid;
  };
  const deadlineOf = (d) => { const [y, m, dd] = d.dueDate.split('-').map(Number); return new Date(y, m - 1, dd, 23, 59, 59).getTime(); }; // akhir hari tenggat

  function checkDeadlines(mine) {
    const now = Date.now();
    const today = new Date().toDateString();
    let pending = 0;
    mine.forEach((d) => {
      if (d.status === 'done' || !d.dueDate) return;
      pending++;
      const left = deadlineOf(d) - now;
      const tag = `${d.displayId}:${d.dueDate}`;
      if (left < 0) notify('dlLate', 'Tugas terlambat', `${d.displayId} · ${d.title} sudah melewati deadline.`, url(d), `late:${tag}`);
      if (left > 0 && left <= 864e5) notify('dl1d', 'Deadline kurang dari 1 hari', `${d.displayId} · ${d.title}`, url(d), `d1:${tag}`);
      if (left > 0 && left <= 36e5) notify('dl1h', 'Deadline kurang dari 1 jam', `${d.displayId} · ${d.title}`, url(d), `h1:${tag}`);
    });
    if (pending) notify('dlPending', 'Tugas belum selesai', `Kamu masih punya ${pending} tugas yang belum selesai.`, 'calendar.html', `pend:${today}`);
  }

  // Pengingat AI (AI Preferences > "Pengingat melalui AI"): satu notifikasi ringkasan, paling sering 1x per 30 menit, sekali per tugas
  function checkAiReminders(all) {
    const ap = loadAiPrefs(uid);
    if (ap.behavior.reminder === 'off' || !ap.perms.read || !loadPrefs(uid).g.ai || permission() !== 'granted') return;
    const now = Date.now();
    const lastKey = `doto-ai-rem-last:${uid}`;
    if (now - rd(lastKey, 0) < 30 * 6e4) return;
    const win = Number(ap.behavior.reminder) * 6e4;
    const key = (d) => `air:${d.displayId}:${d.dueDate}:${ap.behavior.reminder}`;
    const due = myActiveTasks(all, user).filter((d) => { const left = dueEnd(d) - now; return left > 0 && left <= win && !seen[key(d)]; }).sort((a, b) => dueEnd(a) - dueEnd(b));
    if (!due.length) return;
    due.forEach((d) => { seen[key(d)] = now; });
    wr(dedupKey, seen);
    wr(lastKey, now);
    const body = due.length === 1 ? `${due[0].displayId} · ${due[0].title}` : `${due.length} tugas mendekati deadline: ${due.slice(0, 2).map((d) => d.displayId).join(', ')}${due.length > 2 ? `, +${due.length - 2} lainnya` : ''}`;
    show('Pengingat Agen AI', body, `air:${now}`, due.length === 1 ? url(due[0]) : 'calendar.html');
    addLog(uid, { kind: 'auto', title: 'Pengingat deadline (notifikasi Chrome)', detail: body, output: true });
  }

  function classify(d, mine, h, hist) {
    if (h.actorChannel === 'agent') {
      if (mine && h.action === 'status_changed' && ['done', 'needs_review'].includes(h.newValue)) notify('agentDone', 'Agen AI selesai mengerjakan tugas', `${d.displayId} · ${d.title}`, url(d), `ag:${h.id}`);
      return;
    }
    if (h.actorUserId === uid || h.actorUsername === user.username) return; // perubahan dari diri sendiri tidak diberitahukan
    const who = h.actorUsername ? `@${h.actorUsername}` : 'Seseorang';
    if (h.action === 'comment') {
      const text = h.comment || '';
      const body = `${d.displayId}: ${text.slice(0, 90)}`;
      const re = new RegExp(`@${user.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9._])`, 'i');
      if (re.test(text)) notify('mention', `${who} menyebut kamu`, body, url(d), `m:${h.id}`);
      else if (mine) {
        const replied = hist.some((x) => x.action === 'comment' && x.actorUserId === uid && ts(x.createdAt) < ts(h.createdAt));
        notify(replied ? 'reply' : 'comment', replied ? `${who} membalas komentarmu` : `Komentar baru dari ${who}`, body, url(d), `c:${h.id}`);
      }
      return;
    }
    if (!mine) return;
    const label = `${d.displayId} · ${d.title}`;
    if (h.action === 'status_changed') notify(h.newValue === 'done' ? 'taskDone' : 'taskStatus', h.newValue === 'done' ? 'Tugas selesai' : 'Status tugas berubah', `${label} → ${h.newValue}`, url(d), `s:${h.id}`);
    else if (h.fieldName === 'dueDate') notify('taskDeadline', 'Deadline tugas berubah', `${label} → ${h.newValue || 'tanpa tenggat'}`, url(d), `dd:${h.id}`);
    else notify('taskUpdated', 'Tugas diperbarui', `${label} (${h.fieldName || h.action})`, url(d), `u:${h.id}`);
  }

  async function diffTasks(all) {
    const snap = rd(snapKey, null);
    const next = { tasks: {}, members: snap?.members || {} };
    all.forEach((d) => { next.tasks[d.displayId] = d.updatedAt; });
    if (snap) {
      for (const d of all) {
        const old = snap.tasks[d.displayId];
        const mine = isMine(d);
        if (old === undefined) {
          if (mine && d.createdBy !== uid) notify('taskNew', 'Tugas baru untukmu', `${d.displayId} · ${d.title}`, url(d), `new:${d.displayId}`);
          continue;
        }
        if (old === d.updatedAt) continue;
        let hist = [];
        try { hist = await api.get(`/tasks/${encodeURIComponent(d.displayId)}/history?limit=10`); } catch { /* lewati */ }
        hist.filter((h) => ts(h.createdAt) > ts(old)).reverse().forEach((h) => classify(d, mine, h, hist));
      }
    }
    wr(snapKey, next);
  }

  async function diffTeam() {
    const snap = rd(snapKey, { tasks: {}, members: {} });
    const first = !snap.members || !Object.keys(snap.members).length;
    const next = {};
    for (const p of await api.get('/projects')) {
      let ms = [];
      try { ms = await api.get(`/projects/${encodeURIComponent(p.key)}/members`); } catch { continue; }
      if (!ms.some((m) => m.id === uid)) continue;
      next[p.key] = Object.fromEntries(ms.map((m) => [m.id, { u: m.username, j: m.joinedAt }]));
      const old = snap.members?.[p.key];
      if (first || !old) continue;
      ms.filter((m) => !old[m.id]).forEach((m) => notify('memberAdded', 'Anggota baru di proyek', `@${m.username} ditambahkan ke ${p.name}`, `members.html?key=${encodeURIComponent(p.key)}`, `add:${p.key}:${m.id}:${m.joinedAt}`));
      Object.keys(old).filter((id) => !ms.some((m) => m.id === id)).forEach((id) => notify('memberChange', 'Perubahan anggota tim', `@${old[id].u} tidak lagi menjadi anggota ${p.name}`, `members.html?key=${encodeURIComponent(p.key)}`, `rm:${p.key}:${id}:${old[id].j}`));
    }
    wr(snapKey, { tasks: rd(snapKey, snap).tasks, members: next });
  }

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const all = await api.get('/tasks/search?includeArchived=false');
      checkDeadlines(all.filter(isMine));
      checkAiReminders(all);
      await diffTasks(all);
      if (round++ % 5 === 0) await diffTeam(); // anggota tim dicek tiap ~2,5 menit
    } catch { /* jaringan/backend mati: coba lagi pada putaran berikutnya */ } finally { busy = false; }
  }

  if (!opts.noTimer) {
    syncPrefsFromServer(uid);
    setTimeout(tick, 2500);
    setInterval(tick, 30000);
  }
  window.DotoNotify = { emit };
  return { tick };
}
