// Preferensi & riwayat Agen AI per akun (localStorage). Dipakai Settings > AI Preferences, pages/ai.js, dan notify.js.
// Pesan otomatis AI mengikuti gaya (singkat/detail), tone, format (poin/paragraf), dan bahasa dari Settings.
import { unpackMeta } from './meta.js';

export const AI_DEFAULTS = {
  style: 'concise', tone: 'professional', format: 'bullets',
  perms: { read: true, team: true, modify: true, delete: false, confirm: true },
  behavior: { summary: true, suggestions: true, priority: 'deadline', reminder: '30' }, // reminder: off | 30 | 60 | 180 | 1440 (menit)
  retention: '30', // hari: 7 | 30 | 90 | forever
};
const ENUMS = { style: ['concise', 'detailed'], tone: ['professional', 'friendly'], format: ['paragraph', 'bullets'], retention: ['7', '30', '90', 'forever'] };
const B_ENUMS = { priority: ['deadline', 'priority', 'workload'], reminder: ['off', '30', '60', '180', '1440'] };

const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* penyimpanan penuh: abaikan */ } };
const clone = (o) => JSON.parse(JSON.stringify(o));

export function sanitize(p) {
  const d = clone(AI_DEFAULTS);
  const out = { ...d, ...p, perms: { ...d.perms, ...(p && p.perms) }, behavior: { ...d.behavior, ...(p && p.behavior) } };
  Object.keys(ENUMS).forEach((k) => { out[k] = ENUMS[k].includes(String(out[k])) ? String(out[k]) : d[k]; });
  Object.keys(B_ENUMS).forEach((k) => { out.behavior[k] = B_ENUMS[k].includes(String(out.behavior[k])) ? String(out.behavior[k]) : d.behavior[k]; });
  Object.keys(d.perms).forEach((k) => { out.perms[k] = out.perms[k] === true; });
  ['summary', 'suggestions'].forEach((k) => { out.behavior[k] = out.behavior[k] === true; });
  return out;
}
export const loadAiPrefs = (uid) => sanitize(rd(`doto-ai-prefs:${uid}`, {}));
export const saveAiPrefs = (uid, p) => wr(`doto-ai-prefs:${uid}`, sanitize(p));

/* ---------- Riwayat aktivitas (per akun, mengikuti retensi) ---------- */
const LOG_MAX = 300;
const logKey = (uid) => `doto-ai-log:${uid}`;
export function loadLog(uid) {
  let log = rd(logKey(uid), []);
  const r = loadAiPrefs(uid).retention;
  if (r !== 'forever') {
    const cut = Date.now() - Number(r) * 864e5;
    const kept = log.filter((e) => e.ts >= cut);
    if (kept.length !== log.length) { wr(logKey(uid), kept); log = kept; }
  }
  return log;
}
export function addLog(uid, entry) {
  const log = loadLog(uid);
  const e = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ts: Date.now(), ...entry };
  log.unshift(e);
  wr(logKey(uid), log.slice(0, LOG_MAX));
  return e.id;
}
export function updateLog(uid, id, patch) {
  const log = rd(logKey(uid), []);
  const i = log.findIndex((e) => e.id === id);
  if (i >= 0) { log[i] = { ...log[i], ...patch }; wr(logKey(uid), log); }
}
export const clearLog = (uid) => wr(logKey(uid), []);

/* ---------- Pemilihan & pengurutan tugas ---------- */
const keysOf = (user) => [user.username, user.name].filter(Boolean).map((x) => String(x).toLowerCase());
export function myActiveTasks(all, user) {
  const keys = keysOf(user);
  return all.filter((d) => {
    if (d.status === 'done') return false;
    const to = String(unpackMeta(d.description).meta.to || '').toLowerCase();
    return to ? to === 'semua tim' || keys.includes(to) : d.assigneeId === user.id;
  });
}
export const dueEnd = (d) => {
  if (!d.dueDate) return Infinity;
  const [y, m, dd] = d.dueDate.split('-').map(Number);
  return new Date(y, m - 1, dd, 23, 59, 59).getTime();
};
const PRI = { urgent: 0, high: 1, medium: 2, low: 3 };
// deadline = tenggat terdekat; priority = urgent>high>medium>low; workload = periode (minggu) dengan jumlah tugas aktif terbanyak dulu
export function rankTasks(tasks, mode, now = Date.now()) {
  const wk = (d) => (dueEnd(d) === Infinity ? 999 : Math.max(0, Math.floor((dueEnd(d) - now) / 864e5 / 7)));
  const load = {};
  tasks.forEach((d) => { load[wk(d)] = (load[wk(d)] || 0) + 1; });
  const byDue = (a, b) => (dueEnd(a) === dueEnd(b) ? 0 : dueEnd(a) < dueEnd(b) ? -1 : 1);
  const cmp = mode === 'priority' ? (a, b) => (PRI[a.priority] ?? 9) - (PRI[b.priority] ?? 9) || byDue(a, b)
    : mode === 'workload' ? (a, b) => load[wk(b)] - load[wk(a)] || byDue(a, b) : byDue;
  return tasks.slice().sort(cmp).map((d) => ({ d, load: load[wk(d)] }));
}

/* ---------- Penyusunan pesan ---------- */
const NOTICE = {
  id: {
    readOff: 'Izin "Read project & task data" dimatikan di AI Preferences, jadi saya tidak membaca data proyek.',
    modifyOff: 'Izin "Create or modify tasks" dimatikan di AI Preferences, jadi saya hanya bisa memberi saran dan tidak menjalankan perubahan.',
    teamOff: 'Izin "Access team information" dimatikan, jadi penugasan ke anggota lain tidak saya proses.',
  },
  en: {
    readOff: 'The "Read project & task data" permission is off in AI Preferences, so I am not reading project data.',
    modifyOff: 'The "Create or modify tasks" permission is off in AI Preferences, so I can only suggest changes and will not apply them.',
    teamOff: 'The "Access team information" permission is off, so I am not assigning tasks to other members.',
  },
};
export const notice = (key, lang) => NOTICE[lang === 'en' ? 'en' : 'id'][key];

const INTRO = {
  id: {
    summary: ['Berikut ringkasan tugas aktif Anda.', 'Halo! Ini ringkasan tugas aktifmu ya.'],
    suggest: ['Saran tugas yang sebaiknya dikerjakan lebih dulu:', 'Menurutku tugas-tugas ini enak dikerjakan duluan:'],
    reminder: ['Pengingat: tugas berikut mendekati deadline.', 'Psst, tugas ini sebentar lagi deadline nih:'],
    empty: ['Saat ini tidak ada tugas aktif yang ditujukan kepada Anda.', 'Lagi nggak ada tugas aktif buatmu. Santai dulu!'],
  },
  en: {
    summary: ['Here is a summary of your active tasks.', "Hi! Here's a quick look at your active tasks."],
    suggest: ['Suggested tasks to work on first:', 'These look like good ones to tackle first:'],
    reminder: ['Reminder: the following tasks are approaching their deadline.', 'Heads up, these are almost due:'],
    empty: ['You currently have no active tasks assigned to you.', 'No active tasks for you right now. Enjoy the break!'],
  },
};
const fmtDue = (d, lang) => new Date(dueEnd(d)).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short' });
const leftText = (ms, lang) => {
  const m = Math.max(1, Math.round(ms / 6e4));
  const h = Math.floor(m / 60), mm = m % 60;
  const t = h ? (mm ? `${h}${lang === 'en' ? 'h' : ' jam'} ${mm}${lang === 'en' ? 'm' : ' menit'}` : `${h}${lang === 'en' ? 'h' : ' jam'}`) : `${m}${lang === 'en' ? 'm' : ' menit'}`;
  return lang === 'en' ? `${t} left` : `sisa ${t}`;
};
function layout(intro, lines, prefs) {
  return prefs.format === 'bullets' ? `${intro}\n${lines.map((l) => `• ${l}`).join('\n')}` : `${intro} ${lines.join('; ')}.`;
}

// d: { tasks (milik user, belum selesai), ranked, projects: {id: nama}, now }
export function composeAuto(kind, d, prefs, lang = 'id') {
  const en = lang === 'en';
  const tone = prefs.tone === 'friendly' ? 1 : 0;
  const det = prefs.style === 'detailed';
  const I = INTRO[en ? 'en' : 'id'];
  const proj = (t) => d.projects[t.projectId] || '';
  if (kind !== 'reminder' && !d.tasks.length) return I.empty[tone];
  if (kind === 'summary') {
    const now = d.now, over = d.tasks.filter((t) => dueEnd(t) < now).length;
    const soon = d.tasks.filter((t) => dueEnd(t) >= now && dueEnd(t) - now <= 3 * 864e5).length;
    const lines = en ? [`${d.tasks.length} active tasks`, `${over} overdue`, `${soon} due within 3 days`] : [`${d.tasks.length} tugas aktif`, `${over} terlambat`, `${soon} jatuh tempo dalam 3 hari`];
    if (det) {
      const c = (s) => d.tasks.filter((t) => t.status === s).length;
      lines.push(en ? `Status breakdown: ${c('todo')} todo, ${c('in_progress')} in progress, ${c('needs_review')} needs review, ${c('idea')} idea` : `Rincian status: ${c('todo')} todo, ${c('in_progress')} in progress, ${c('needs_review')} needs review, ${c('idea')} idea`);
      const per = {};
      d.tasks.forEach((t) => { per[proj(t)] = (per[proj(t)] || 0) + 1; });
      const top = Object.entries(per).sort((a, b) => b[1] - a[1])[0];
      if (top) lines.push(en ? `Busiest project: ${top[0]} (${top[1]} tasks)` : `Proyek terpadat: ${top[0]} (${top[1]} tugas)`);
    }
    return layout(I.summary[tone], lines, prefs);
  }
  if (kind === 'suggest') {
    const why = { deadline: en ? 'nearest deadline' : 'tenggat terdekat', priority: null, workload: null };
    const lines = d.ranked.slice(0, det ? 5 : 3).map(({ d: t, load }) => {
      const due = t.dueDate ? (en ? `deadline ${fmtDue(t, lang)}` : `deadline ${fmtDue(t, lang)}`) : '';
      if (!det) return `${t.displayId} · ${t.title}${due ? ` (${due})` : ''}`;
      const reason = prefs.behavior.priority === 'priority' ? (en ? `priority ${t.priority}` : `prioritas ${t.priority}`)
        : prefs.behavior.priority === 'workload' ? (en ? `${load} active tasks in that period` : `periode itu ada ${load} tugas aktif`) : why.deadline;
      return `${t.displayId} · ${t.title} — ${proj(t)}${due ? `, ${due}` : ''}; ${reason}`;
    });
    return layout(I.suggest[tone], lines, prefs);
  }
  const lines = d.tasks.slice(0, det ? 5 : 3).map((t) => `${t.displayId} · ${t.title} (${leftText(dueEnd(t) - d.now, lang)})${det ? ` · ${proj(t)}` : ''}`);
  return layout(I.reminder[tone], lines, prefs);
}

// Pesan otomatis saat chat AI dibuka: [{ kind, title, text }]
export function buildAutoMessages({ tasks, projects, prefs, lang, now = Date.now() }) {
  const out = [];
  const b = prefs.behavior;
  const ranked = rankTasks(tasks, b.priority, now);
  const base = { tasks, ranked, projects, now };
  if (b.summary) out.push({ kind: 'summary', title: lang === 'en' ? 'Active task summary' : 'Ringkasan tugas aktif', text: composeAuto('summary', base, prefs, lang) });
  if (b.suggestions) out.push({ kind: 'suggest', title: lang === 'en' ? 'Task suggestions' : 'Saran tugas', text: composeAuto('suggest', base, prefs, lang) });
  if (b.reminder !== 'off') {
    const win = Number(b.reminder) * 6e4;
    const due = tasks.filter((t) => { const left = dueEnd(t) - now; return left > 0 && left <= win; }).sort((a, c) => dueEnd(a) - dueEnd(c));
    if (due.length) out.push({ kind: 'reminder', title: lang === 'en' ? 'Deadline reminder' : 'Pengingat deadline', text: composeAuto('reminder', { ...base, tasks: due }, prefs, lang) });
  }
  return out;
}
