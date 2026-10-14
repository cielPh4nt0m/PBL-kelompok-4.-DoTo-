// Asisten AI versi wireframe (mock), port dari taskooalah AiPage.
// Tidak memanggil LLM maupun API: balasan dibuat dari pencocokan kata kunci,
// dan tombol Accept/Reject hanya mengubah state lokal.
import { h } from '../dom.js';
import { initLayout, showPageError } from '../layout.js';

const content = document.getElementById('content');

const PROMPT_CHIPS = [
  { label: 'Create a task', prompt: 'create a follow-up task for client Y with high priority' },
  { label: 'Summarize board', prompt: 'summarize this week\'s board' },
  { label: 'Stuck tasks', prompt: 'which tasks have had no progress for 3 days?' },
];

let nextId = 1;
const newId = () => `m${nextId++}`;

function seedMessages() {
  return [
    { id: newId(), role: 'user', content: 'create a follow-up task for client X with high priority' },
    {
      id: newId(), role: 'assistant', content: 'Sure, here is the task I will create:',
      proposedAction: {
        id: newId(), type: 'create_task', summary: 'Create a new task in WEB',
        fields: [
          { label: 'Title', value: 'Follow-up client X' },
          { label: 'Priority', value: 'high' },
          { label: 'Segment', value: 'To Do' },
          { label: 'Assignee', value: '(none)' },
        ],
      },
    },
    { id: newId(), role: 'user', content: 'summarize this week\'s board' },
    {
      id: newId(), role: 'assistant',
      content: 'This week the WEB board has 12 active tasks: 3 newly created, 5 in progress, 2 waiting for review. 2 high-priority tasks have had no progress for more than 3 days (WEB-31, WEB-44).',
    },
  ];
}

function generateReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes('error')) {
    return { content: '', isError: true };
  }

  if (lower.includes('create') || lower.includes('new task')) {
    const title = text.replace(/create (a )?(new )?task( for)?/i, '').trim();
    return {
      content: 'Sure, here is the task I will create:',
      proposedAction: {
        id: newId(), type: 'create_task', summary: 'Create a new task in WEB',
        fields: [
          { label: 'Title', value: title || 'New task' },
          { label: 'Priority', value: 'medium' },
          { label: 'Segment', value: 'To Do' },
          { label: 'Assignee', value: '(none)' },
        ],
      },
    };
  }

  if (lower.includes('summar')) {
    return { content: 'The board currently has 12 active tasks: 3 newly created, 5 in progress, 2 waiting for review, 2 done this week.' };
  }

  if (lower.includes('stuck') || lower.includes('progress')) {
    return {
      content: 'WEB-31 ("Fix login bug") has had no progress for 4 days. I suggest raising its priority:',
      proposedAction: {
        id: newId(), type: 'update_priority', summary: 'Change priority of WEB-31',
        fields: [
          { label: 'Task', value: 'WEB-31: Fix login bug' },
          { label: 'Old priority', value: 'medium' },
          { label: 'New priority', value: 'urgent' },
        ],
      },
    };
  }

  return { content: 'I can\'t handle this request in the wireframe version yet. Try one of the examples above.' };
}

let messages = seedMessages();
let resolved = {}; // id aksi -> 'accepted' | 'rejected'
let draft = '';

function actionCard(action) {
  const decision = resolved[action.id];
  return h('div', { class: 'action-card' },
    h('span', { class: 'chip solid' }, 'Proposed action'),
    h('p', { style: 'margin-top:8px' }, h('strong', {}, action.summary)),
    h('ul', {}, action.fields.map((f) => h('li', {}, `${f.label}: ${f.value}`))),
    decision
      ? h('span', { class: `chip${decision === 'accepted' ? ' solid' : ''}` }, decision === 'accepted' ? 'Accepted' : 'Rejected')
      : h('div', { class: 'actions' },
          h('button', { class: 'btn btn-primary', type: 'button', onclick: () => resolve(action.id, 'accepted') }, 'Accept'),
          h('button', { class: 'btn btn-outline', type: 'button', onclick: () => resolve(action.id, 'rejected') }, 'Reject')));
}

function messageBubble(m) {
  const cls = `msg ${m.role}${m.role === 'assistant' ? ' g2' : ''}${m.isThinking ? ' thinking' : ''}`;
  if (m.isError) {
    return h('div', { class: cls }, h('p', { class: 'form-error', style: 'margin:0' }, 'The AI failed to respond. Please try again.'));
  }
  return h('div', { class: cls }, h('p', {}, m.content), m.proposedAction ? actionCard(m.proposedAction) : null);
}

function resolve(actionId, decision) {
  resolved = { ...resolved, [actionId]: decision };
  render();
}

function send(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const thinking = { id: newId(), role: 'assistant', content: 'AI is thinking…', isThinking: true };
  messages = [...messages, { id: newId(), role: 'user', content: trimmed }, thinking];
  draft = '';
  render();

  setTimeout(() => {
    const reply = generateReply(trimmed);
    messages = messages.map((m) => (m.id === thinking.id ? { id: m.id, role: 'assistant', ...reply } : m));
    render();
  }, 700);
}

function render() {
  const input = h('input', { value: draft, placeholder: 'Ask the AI… (e.g. summarize this week\'s board)', 'aria-label': 'Message',
    oninput: (e) => { draft = e.target.value; } });

  content.replaceChildren(h('div', { class: 'ai-wrap' },
    h('div', { class: 'page-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, 'Wireframe'),
        h('h1', {}, 'AI assistant'),
        h('p', { class: 'sub' }, 'Ask the AI to create or change tasks. Every action needs your approval before it runs.'))),
    h('section', { class: 'panel g1' },
      messages.length === 0
        ? h('div', { class: 'chips' }, PROMPT_CHIPS.map((c) =>
            h('button', { class: 'prompt-chip g2', type: 'button', onclick: () => { draft = c.prompt; render(); } }, c.label)))
        : null,
      h('div', { class: 'chat', 'aria-live': 'polite' }, messages.map(messageBubble)),
      h('form', { onsubmit: (e) => { e.preventDefault(); send(input.value); } },
        h('div', { class: 'row-form' }, input, h('button', { class: 'btn btn-primary btn-inline', type: 'submit' }, 'Send'))),
      messages.length
        ? h('button', { class: 'btn-ghost', type: 'button', onclick: () => { messages = []; resolved = {}; render(); } }, 'Start a new conversation')
        : null)));

  if (draft) input.focus();
}

initLayout('ai').then(render).catch((e) => showPageError(content, e));
