// Asisten AI pintar berbasis aturan (Smart Rule-Based Chat Agent) dengan
// eksekusi REST API nyata ke backend PHP (/api/*).
import { api, apiWithHeaders, errorText } from '../api.js';
import { h, STATUS_LABEL } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');
const agentApi = apiWithHeaders({
  'X-Client-Channel': 'agent',
  'X-Agent-Name': 'doto-web-ai',
});

const PROMPT_CHIPS = [
  { label: 'Buat task baru', prompt: 'buatkan task follow-up client Y prioritas tinggi' },
  { label: 'Ringkas board', prompt: 'ringkas board minggu ini' },
  { label: 'Task yang macet', prompt: 'task apa yang belum ada progress 3 hari?' },
  { label: 'Ubah status', prompt: 'ubah status K4-3 jadi in_progress' },
  { label: 'Cari task', prompt: 'cari task Jobsheet' },
];

let nextId = 1;
const newId = () => `m${nextId++}`;

let projects = [];
let activeProjectKey = 'K4';
let activeSegments = ['To Do'];
let messages = [];
let resolved = {}; // actionId -> { state: 'running'|'accepted'|'rejected'|'error', label?: string, link?: string, error?: string }
let draft = '';

async function ensureActiveProject() {
  projects = await api.get('/projects');
  if (projects.length === 0) {
    try {
      const created = await api.post('/projects', { key: 'K4', name: 'Kelompok 4 PBL' });
      projects = [created];
    } catch {
      projects = [];
    }
  }
  if (projects.length > 0) {
    const preferred = projects.find((p) => p.key === activeProjectKey) || projects.find((p) => p.key === 'K4') || projects[0];
    activeProjectKey = preferred.key;
    await loadSegmentsForActiveProject();
  }
}

async function loadSegmentsForActiveProject() {
  if (!activeProjectKey) return;
  try {
    const segs = await api.get(`/projects/${encodeURIComponent(activeProjectKey)}/segments`);
    if (segs.length === 0) {
      await api.post(`/projects/${encodeURIComponent(activeProjectKey)}/segments`, { name: 'To Do' });
      activeSegments = ['To Do'];
    } else {
      activeSegments = segs.map((s) => s.name);
    }
  } catch {
    activeSegments = ['To Do'];
  }
}

function seedMessages(projKey = 'K4', segName = 'To Do') {
  return [
    {
      id: newId(),
      role: 'user',
      content: 'buatkan task follow-up client X prioritas tinggi',
    },
    {
      id: newId(),
      role: 'assistant',
      content: `Oke, ini task yang siap saya buat di proyek ${projKey} (klik Accept untuk mengeksekusi ke database):`,
      proposedAction: {
        id: newId(),
        type: 'create_task',
        summary: `Create a new task in ${projKey}`,
        payload: {
          projectKey: projKey,
          segmentName: segName,
          title: 'Follow-up client X',
          description: 'Dibuat melalui Asisten AI Doto',
          priority: 'high',
          status: 'todo',
        },
        fields: [
          { label: 'Project', value: projKey },
          { label: 'Title', value: 'Follow-up client X' },
          { label: 'Priority', value: 'high' },
          { label: 'Segment', value: segName },
          { label: 'Status', value: 'todo' },
        ],
      },
    },
  ];
}

function detectPriority(text) {
  const lower = text.toLowerCase();
  if (/\b(urgent|mendesak|darurat|kritis)\b/.test(lower)) return 'urgent';
  if (/\b(high|tinggi|penting)\b/.test(lower)) return 'high';
  if (/\b(low|rendah|santai)\b/.test(lower)) return 'low';
  if (/\b(medium|sedang|normal)\b/.test(lower)) return 'medium';
  return null;
}

function detectStatus(text) {
  const lower = text.toLowerCase();
  if (/\b(needs_review|need review|needs review|review|tinjau)\b/.test(lower)) return 'needs_review';
  if (/\b(in_progress|in progress|on progress|ongoing|dikerjakan|sedang dikerjakan|proses)\b/.test(lower)) return 'in_progress';
  if (/\b(done|selesai|beres|complete|completed|tuntas)\b/.test(lower)) return 'done';
  if (/\b(idea|ide)\b/.test(lower)) return 'idea';
  if (/\b(todo|to do|to-do|baru|antre)\b/.test(lower)) return 'todo';
  return null;
}

function extractDisplayId(text) {
  const m = text.match(/\b([A-Za-z][A-Za-z0-9]{1,9}-\d+)\b/);
  return m ? m[1].toUpperCase() : null;
}

function extractEmail(text) {
  const m = text.match(/@?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
  return m ? m[1].toLowerCase() : undefined;
}

async function generateReply(text) {
  const lower = text.toLowerCase().trim();

  if (lower === 'error' || lower.includes('trigger error')) {
    return { content: '', isError: true };
  }

  const displayId = extractDisplayId(text);

  // 4. Tambah Komentar (komentar, comment, catat, note + ID task)
  if (displayId && /\b(komentar|komen|comment|catat|note)\b/i.test(lower)) {
    let comment = text
      .replace(new RegExp(displayId, 'ig'), '')
      .replace(/^\s*(tambah(kan)?|buat(kan)?|add|leave|tulis(kan)?)?\s*(komentar|komen|comment|catat|note)\s*(di|pada|ke|on|for|untuk|task)?\s*[:：-]?\s*/i, '')
      .replace(/^\s*(di|pada|ke|on|for|untuk|task)\s*[:：-]?\s*/i, '')
      .trim();
    if (!comment) comment = 'Catatan tindak lanjut dari Asisten AI.';
    return {
      content: `Siap, saya akan menambahkan komentar ke task ${displayId}:`,
      proposedAction: {
        id: newId(),
        type: 'add_comment',
        summary: `Add comment to ${displayId}`,
        payload: { displayId, comment },
        fields: [
          { label: 'Task', value: displayId },
          { label: 'Comment', value: comment },
        ],
      },
    };
  }

  // 3. Ubah Prioritas (prioritas, priority, naikkan, turunkan, raise, change priority + ID task)
  if (displayId && /\b(prioritas|priority|naikkan|turunkan|raise|lower|ubah prioritas|change priority)\b/i.test(lower)) {
    const priority = detectPriority(text) || 'urgent';
    return {
      content: `Oke, saya usulkan perubahan prioritas untuk ${displayId}:`,
      proposedAction: {
        id: newId(),
        type: 'update_priority',
        summary: `Change priority of ${displayId}`,
        payload: { displayId, priority },
        fields: [
          { label: 'Task', value: displayId },
          { label: 'New priority', value: priority },
        ],
      },
    };
  }

  // 2. Ubah Status (status, pindah, move, tandai, mark, selesai, done, in_progress, review, todo + ID task)
  if (displayId && (/\b(status|pindah|pindahkan|move|tandai|mark|set|ubah)\b/i.test(lower) || detectStatus(text))) {
    const status = detectStatus(text) || 'done';
    return {
      content: `Oke, saya siap mengubah status task ${displayId} menjadi "${STATUS_LABEL[status] || status}":`,
      proposedAction: {
        id: newId(),
        type: 'update_status',
        summary: `Update status of ${displayId}`,
        payload: { displayId, status },
        fields: [
          { label: 'Task', value: displayId },
          { label: 'New status', value: `${status} (${STATUS_LABEL[status] || status})` },
        ],
      },
    };
  }

  // 5. Ringkas Board (ringkas, summary, summarize, rekap, status board, minggu ini)
  if (/\b(ringkas|summar|rekap|status board|minggu ini|overview)\b/i.test(lower)) {
    const board = await api.get(`/projects/${encodeURIComponent(activeProjectKey)}/board`);
    const allTasks = board.segments.flatMap((s) => s.tasks || []);
    const byStatus = { idea: 0, todo: 0, in_progress: 0, needs_review: 0, done: 0 };
    allTasks.forEach((t) => {
      if (byStatus[t.status] !== undefined) byStatus[t.status]++;
    });
    const segSummary = board.segments.map((s) => `${s.segment.name} (${s.tasks.length})`).join(', ') || 'belum ada segment';
    const highUrgentOpen = allTasks.filter((t) => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high'));
    const highList = highUrgentOpen.slice(0, 4).map((t) => `${t.displayId} ("${t.title}", ${t.priority})`).join(', ');

    const summaryText =
      `Ringkasan board ${board.project.name} (${board.project.key}): total ${allTasks.length} task aktif ` +
      `(${byStatus.idea} idea, ${byStatus.todo} todo, ${byStatus.in_progress} in progress, ${byStatus.needs_review} needs review, ${byStatus.done} done). ` +
      `Distribusi segment: ${segSummary}. ` +
      (highUrgentOpen.length
        ? `Ada ${highUrgentOpen.length} task prioritas tinggi/urgent yang belum selesai: ${highList}.`
        : 'Tidak ada task prioritas tinggi/urgent yang tertunda.');

    const candidate = allTasks.find((t) => t.status === 'todo' && (t.priority === 'urgent' || t.priority === 'high'));
    return {
      content: summaryText,
      proposedAction: candidate
        ? {
            id: newId(),
            type: 'update_status',
            summary: `Mulai kerjakan ${candidate.displayId}`,
            payload: { displayId: candidate.displayId, status: 'in_progress' },
            fields: [
              { label: 'Task', value: `${candidate.displayId}: ${candidate.title}` },
              { label: 'Current status', value: candidate.status },
              { label: 'New status', value: 'in_progress' },
            ],
          }
        : undefined,
    };
  }

  // 6. Task Macet / Belum Ada Progress (macet, stuck, progress, belum selesai, lama)
  if (/\b(macet|stuck|progress|progres|belum selesai|lama|tertunda|stagnan)\b/i.test(lower)) {
    const board = await api.get(`/projects/${encodeURIComponent(activeProjectKey)}/board`);
    const openTasks = board.segments
      .flatMap((s) => s.tasks || [])
      .filter((t) => t.status !== 'done')
      .sort((a, b) => (a.statusChangedAt || a.updatedAt || 0) - (b.statusChangedAt || b.updatedAt || 0));

    if (openTasks.length === 0) {
      return { content: `Semua task di board ${activeProjectKey} sudah berstatus Done! Tidak ada task yang macet.` };
    }

    const top = openTasks[0];
    const ageDays = Math.max(0, Math.floor((Date.now() - (top.statusChangedAt || top.updatedAt || Date.now())) / 86400000));
    const listStr = openTasks
      .slice(0, 4)
      .map((t) => `${t.displayId} ("${t.title}", status: ${t.status}, prioritas: ${t.priority})`)
      .join('; ');

    const targetTask = openTasks.find((t) => t.priority !== 'urgent') || top;
    const isPriorityUpgrade = targetTask.priority !== 'urgent';

    return {
      content:
        `Ditemukan ${openTasks.length} task yang belum selesai di ${activeProjectKey}: ${listStr}. ` +
        `Task terlama adalah ${top.displayId} ("${top.title}", ${ageDays > 0 ? `${ageDays} hari sejak perubahan terakhir` : 'baru diperbarui'}). ` +
        (isPriorityUpgrade
          ? `Saya sarankan menaikkan prioritas ${targetTask.displayId} ke urgent:`
          : `Saya sarankan memindahkan ${targetTask.displayId} ke in_progress:`),
      proposedAction: isPriorityUpgrade
        ? {
            id: newId(),
            type: 'update_priority',
            summary: `Change priority of ${targetTask.displayId}`,
            payload: { displayId: targetTask.displayId, priority: 'urgent' },
            fields: [
              { label: 'Task', value: `${targetTask.displayId}: ${targetTask.title}` },
              { label: 'Old priority', value: targetTask.priority },
              { label: 'New priority', value: 'urgent' },
            ],
          }
        : {
            id: newId(),
            type: 'update_status',
            summary: `Move ${targetTask.displayId} to in_progress`,
            payload: { displayId: targetTask.displayId, status: 'in_progress' },
            fields: [
              { label: 'Task', value: `${targetTask.displayId}: ${targetTask.title}` },
              { label: 'Old status', value: targetTask.status },
              { label: 'New status', value: 'in_progress' },
            ],
          },
    };
  }

  // 7. Cari Task (cari, search, find + kata kunci)
  if (/^\s*(cari|search|find|temukan)\b/i.test(lower)) {
    const q = text.replace(/^\s*(cari|search|find|temukan)\s*(task|tugas)?\s*[:：-]?\s*/i, '').trim();
    const results = await api.get(`/tasks/search?q=${encodeURIComponent(q)}&includeArchived=true`);
    if (!results || results.length === 0) {
      return { content: `Tidak ditemukan task dengan kata kunci "${q}".` };
    }
    const items = results
      .slice(0, 6)
      .map((t) => `${t.displayId}: "${t.title}" [${t.status}, ${t.priority}]`)
      .join(' · ');
    return {
      content: `Hasil pencarian "${q}" (${results.length} task ditemukan): ${items}`,
    };
  }

  // 1. Buat Task (buat, tambah, create, add, new task)
  if (/\b(buat|buatkan|tambah|tambahkan|create|add|new task|bikin)\b/i.test(lower)) {
    const priority = detectPriority(text) || 'medium';
    const status = detectStatus(text) || 'todo';
    const assigneeEmail = extractEmail(text);

    // Deteksi segment yang disebut eksplisit, atau pakai segment pertama
    let segmentName = activeSegments[0] || 'To Do';
    for (const seg of activeSegments) {
      if (lower.includes(seg.toLowerCase())) {
        segmentName = seg;
        break;
      }
    }

    let title = text
      .replace(/^\s*(tolong\s+)?(buat(kan)?|tambah(kan)?|bikin(kan)?|create|add)\s+(a\s+)?(new\s+)?(task|tugas)(\s+baru)?(\s+untuk|\s+for)?\s*/i, '')
      .replace(/\b(dengan\s+|with\s+)?(prioritas|priority)\s+(urgent|mendesak|tinggi|high|sedang|medium|rendah|low)\b/gi, '')
      .replace(/\b(prioritas|priority)\s+(urgent|mendesak|tinggi|high|sedang|medium|rendah|low)\b/gi, '')
      .replace(/\b(status)\s+(idea|todo|in_progress|in progress|needs_review|review|done|selesai)\b/gi, '')
      .replace(/@?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '')
      .trim();

    if (!title) title = 'Task baru';
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
      content: `Siap, berikut rincian task yang akan saya buat di proyek ${activeProjectKey}:`,
      proposedAction: {
        id: newId(),
        type: 'create_task',
        summary: `Create a new task in ${activeProjectKey}`,
        payload: {
          projectKey: activeProjectKey,
          segmentName,
          title,
          description: `Dibuat melalui prompt AI: "${text}"`,
          priority,
          status,
          ...(assigneeEmail ? { assigneeEmail } : {}),
        },
        fields: [
          { label: 'Project', value: activeProjectKey },
          { label: 'Title', value: title },
          { label: 'Priority', value: priority },
          { label: 'Segment', value: segmentName },
          { label: 'Status', value: status },
          { label: 'Assignee', value: assigneeEmail || '(current user)' },
        ],
      },
    };
  }

  return {
    content:
      `Saya bisa membantu mengelola proyek ${activeProjectKey} secara langsung! Coba perintah seperti:\n` +
      `• "buatkan task integrasi API prioritas tinggi"\n` +
      `• "ringkas board minggu ini"\n` +
      `• "task apa yang macet?"\n` +
      `• "ubah status ${activeProjectKey}-1 jadi done"\n` +
      `• "naikkan prioritas ${activeProjectKey}-2 ke urgent"\n` +
      `• "tambah komentar ${activeProjectKey}-1 sudah dicek"\n` +
      `• "cari task laporan"`,
  };
}

async function resolve(action, decision) {
  if (decision === 'rejected') {
    resolved = { ...resolved, [action.id]: { state: 'rejected', label: 'Rejected' } };
    render();
    return;
  }

  resolved = { ...resolved, [action.id]: { state: 'running', label: 'Executing…' } };
  render();

  try {
    const p = action.payload || {};
    let resultLabel = 'Accepted · Executed';
    let link = null;

    if (action.type === 'create_task') {
      const projKey = p.projectKey || activeProjectKey;
      await loadSegmentsForActiveProject();
      const segName = activeSegments.includes(p.segmentName) ? p.segmentName : (activeSegments[0] || 'To Do');
      const created = await agentApi.post(`/projects/${encodeURIComponent(projKey)}/tasks`, {
        segmentName: segName,
        title: p.title,
        description: p.description,
        priority: p.priority,
        status: p.status,
        ...(p.assigneeEmail ? { assigneeEmail: p.assigneeEmail } : {}),
      });
      resultLabel = `Accepted · Created ${created.displayId}`;
      link = `task.html?id=${encodeURIComponent(created.displayId)}`;
    } else if (action.type === 'update_status') {
      const updated = await agentApi.patch(`/tasks/${encodeURIComponent(p.displayId)}/status`, {
        status: p.status,
      });
      resultLabel = `Accepted · ${updated.displayId} → ${updated.status}`;
      link = `task.html?id=${encodeURIComponent(updated.displayId)}`;
    } else if (action.type === 'update_priority') {
      const updated = await agentApi.patch(`/tasks/${encodeURIComponent(p.displayId)}/priority`, {
        priority: p.priority,
      });
      resultLabel = `Accepted · ${updated.displayId} (${updated.priority})`;
      link = `task.html?id=${encodeURIComponent(updated.displayId)}`;
    } else if (action.type === 'add_comment') {
      await agentApi.post(`/tasks/${encodeURIComponent(p.displayId)}/comments`, {
        comment: p.comment,
      });
      resultLabel = `Accepted · Commented on ${p.displayId}`;
      link = `task.html?id=${encodeURIComponent(p.displayId)}`;
    }

    resolved = {
      ...resolved,
      [action.id]: { state: 'accepted', label: resultLabel, link },
    };
  } catch (err) {
    resolved = {
      ...resolved,
      [action.id]: { state: 'error', error: errorText(err) },
    };
  }
  render();
}

function actionCard(action) {
  const res = resolved[action.id];
  return h('div', { class: 'action-card' },
    h('span', { class: 'chip solid' }, 'Proposed action'),
    h('p', { style: 'margin-top:8px' }, h('strong', {}, action.summary)),
    h('ul', {}, action.fields.map((f) => h('li', {}, `${f.label}: ${f.value}`))),
    res?.state === 'accepted'
      ? h('div', { style: 'display:flex;align-items:center;gap:10px;flex-wrap:wrap' },
          h('span', { class: 'chip solid' }, res.label || 'Accepted'),
          res.link ? h('a', { href: res.link, style: 'font-size:.8rem;font-weight:600;color:var(--accent-text)' }, 'Open task →') : null)
      : res?.state === 'rejected'
        ? h('span', { class: 'chip' }, 'Rejected')
        : res?.state === 'running'
          ? h('span', { class: 'chip solid' }, 'Executing…')
          : h('div', {},
              res?.state === 'error'
                ? h('p', { class: 'form-error', style: 'margin:0 0 8px' }, `Execution failed: ${res.error}`)
                : null,
              h('div', { class: 'actions' },
                h('button', { class: 'btn btn-primary', type: 'button', onclick: () => resolve(action, 'accepted') }, 'Accept'),
                h('button', { class: 'btn btn-outline', type: 'button', onclick: () => resolve(action, 'rejected') }, 'Reject'))));
}

function messageBubble(m) {
  const cls = `msg ${m.role}${m.role === 'assistant' ? ' g2' : ''}${m.isThinking ? ' thinking' : ''}`;
  if (m.isError) {
    return h('div', { class: cls }, h('p', { class: 'form-error', style: 'margin:0' }, 'The AI failed to respond. Please try again.'));
  }
  return h('div', { class: cls },
    h('p', { style: 'white-space:pre-wrap' }, m.content),
    m.proposedAction ? actionCard(m.proposedAction) : null);
}

async function send(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const thinking = { id: newId(), role: 'assistant', content: 'AI is thinking…', isThinking: true };
  messages = [...messages, { id: newId(), role: 'user', content: trimmed }, thinking];
  draft = '';
  render();

  try {
    const reply = await generateReply(trimmed);
    messages = messages.map((m) => (m.id === thinking.id ? { id: m.id, role: 'assistant', ...reply } : m));
  } catch (err) {
    messages = messages.map((m) =>
      m.id === thinking.id
        ? { id: m.id, role: 'assistant', content: `Gagal memproses permintaan: ${errorText(err)}` }
        : m
    );
  }
  render();
}

function render() {
  const input = h('input', {
    value: draft,
    placeholder: `Ask the AI for ${activeProjectKey}… (e.g. ringkas board minggu ini / buat task baru)`,
    'aria-label': 'Message',
    oninput: (e) => { draft = e.target.value; },
  });

  const projSelect = h(
    'select',
    {
      'aria-label': 'Active project',
      onchange: async (e) => {
        activeProjectKey = e.target.value;
        await loadSegmentsForActiveProject();
        render();
      },
    },
    projects.map((p) => h('option', { value: p.key, selected: p.key === activeProjectKey }, `${p.key} — ${p.name}`))
  );

  content.replaceChildren(h('div', { class: 'ai-wrap' },
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, 'Smart Agent · Live API'),
        h('h1', {}, 'AI assistant'),
        h('p', { class: 'sub' }, 'Ask the AI to create, search, summarize, or update tasks. Every action is executed on the database after your approval.')),
      projects.length
        ? h('div', { style: 'display:flex;align-items:center;gap:8px' },
            h('label', { style: 'margin:0;font-weight:600' }, 'Project:'),
            projSelect)
        : null),
    h('section', { class: 'panel g1' },
      h('div', { class: 'chips' }, PROMPT_CHIPS.map((c) =>
        h('button', { class: 'prompt-chip g2', type: 'button', onclick: () => { draft = c.prompt; render(); } }, c.label))),
      h('div', { class: 'chat', 'aria-live': 'polite' }, messages.map(messageBubble)),
      h('form', { onsubmit: (e) => { e.preventDefault(); send(input.value); } },
        h('div', { class: 'row-form' }, input, h('button', { class: 'btn btn-primary btn-inline', type: 'submit' }, 'Send'))),
      messages.length
        ? h('button', { class: 'btn-ghost', type: 'button', onclick: () => { messages = []; resolved = {}; render(); } }, 'Start a new conversation')
        : null)));

  if (draft) input.focus();
}

initLayout('ai')
  .then(async () => {
    await ensureActiveProject();
    messages = seedMessages(activeProjectKey, activeSegments[0] || 'To Do');
    render();
  })
  .catch((e) => showPageError(content, e));
