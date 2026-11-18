#!/usr/bin/env node
// CLI DoTo (port dari `tsk` taskooalah). Node >= 20, tanpa dependency.
//   node cli/doto.js help

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const STATUSES = ['idea', 'todo', 'in_progress', 'needs_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUS_LABEL = { idea: 'IDEA', todo: 'TODO', in_progress: 'IN PROGRESS', needs_review: 'NEEDS REVIEW', done: 'DONE' };

// ---- Config (~/.config/doto/config.json, bisa dipindah lewat DOTO_CONFIG_DIR) ----
const configDir = process.env.DOTO_CONFIG_DIR ?? join(homedir(), '.config', 'doto');
const configPath = join(configDir, 'config.json');

function readConfig() {
  return existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf-8')) : {};
}

function writeConfig(config) {
  mkdirSync(configDir, { recursive: true, mode: 0o700 });
  writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
}

// ---- API client ----
async function request(method, path, body) {
  const { apiUrl, token } = readConfig();
  if (!apiUrl || !token) {
    fail('Not configured yet. Run:\n  doto config set-url <url>\n  doto config set-token <token>');
  }

  const res = await fetch(`${apiUrl}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Client-Channel': 'cli' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) fail(`API ${method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.status === 204 ? undefined : res.json();
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};

const enc = encodeURIComponent;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// ---- Format output ----
function formatBoard(board) {
  const lines = [`${board.project.name} (${board.project.key})`];
  for (const { segment, tasks } of board.segments) {
    lines.push('', `== ${segment.name} ==`);
    if (tasks.length === 0) {
      lines.push('  (empty)');
      continue;
    }
    for (const status of STATUSES) {
      const list = tasks.filter((t) => t.status === status);
      if (!list.length) continue;
      lines.push(`  -- ${STATUS_LABEL[status]} --`);
      for (const t of list) {
        lines.push(`  [${t.displayId}] (${t.priority}) ${t.title} -- ${t.assigneeUsername ?? 'unassigned'}`);
      }
    }
  }
  return lines.join('\n');
}

function formatTask(t) {
  const lines = [
    `${t.displayId}: ${t.title}`,
    `  status: ${t.status}   priority: ${t.priority}`,
    `  assignee: ${t.assigneeUsername ? `${t.assigneeUsername} <${t.assigneeEmail}>` : 'unassigned'}`,
  ];
  if (t.tags.length) lines.push(`  tags: ${t.tags.join(', ')}`);
  if (t.description) lines.push(`  description: ${t.description}`);
  if (t.links.length) lines.push(`  links: ${t.links.map((l) => `${l.label} ${l.url}`).join(', ')}`);
  return lines.join('\n');
}

function formatHistory(entries) {
  return entries.map((e) => {
    const when = new Date(e.createdAt).toISOString();
    const via = e.actorChannel === 'agent' ? `agent:${e.agentName ?? 'unknown'}` : e.actorChannel;
    const detail = e.action === 'comment'
      ? e.comment
      : e.fieldName ? `${e.fieldName}: ${e.oldValue ?? '-'} -> ${e.newValue ?? '-'}` : (e.newValue ?? '');
    return `${when}  [${via}]  ${e.action}  ${detail ?? ''}`;
  }).join('\n');
}

// ---- Perintah ----
// Setiap perintah: [jumlah argumen wajib, opsi parseArgs, handler(args, values), keterangan]
const COMMANDS = {
  'config set-url': [1, {}, ([url]) => {
    writeConfig({ ...readConfig(), apiUrl: url.replace(/\/$/, '') });
    console.log(`API URL set to ${url}`);
  }, '<url>  Set the DoTo server URL (e.g. http://localhost:8000)'],

  'config set-token': [1, {}, ([token]) => {
    writeConfig({ ...readConfig(), token });
    console.log('Token saved.');
  }, '<token>  Save your API token (create one on the Tokens page)'],

  'project list': [0, {}, async () => {
    for (const p of await api.get('/projects')) console.log(`${p.key}\t${p.name}`);
  }, 'List all projects'],

  'project create': [2, {}, async ([key, name]) => {
    console.log(JSON.stringify(await api.post('/projects', { key, name }), null, 2));
  }, '<key> <name>  Create a project'],

  'segment add': [2, {}, async ([projectKey, name]) => {
    console.log(JSON.stringify(await api.post(`/projects/${enc(projectKey)}/segments`, { name }), null, 2));
  }, '<projectKey> <name>  Add a segment to a project'],

  board: [1, { all: { type: 'boolean' } }, async ([projectKey], v) => {
    const qs = v.all ? '?includeArchived=true' : '';
    console.log(formatBoard(await api.get(`/projects/${enc(projectKey)}/board${qs}`)));
  }, '<projectKey> [--all]  Show a board (--all includes archived tasks)'],

  'task create': [3, {
    priority: { type: 'string', short: 'p' },
    tag: { type: 'string', short: 't', multiple: true },
    assignee: { type: 'string', short: 'a' },
    description: { type: 'string', short: 'd' },
  }, async ([projectKey, segment, title], v) => {
    const t = await api.post(`/projects/${enc(projectKey)}/tasks`, {
      segmentName: segment, title, priority: v.priority, tags: v.tag, assigneeEmail: v.assignee, description: v.description,
    });
    console.log(formatTask(t));
  }, `<projectKey> <segment> <title> [-p ${PRIORITIES.join('|')}] [-t tag]... [-a email] [-d text]`],

  'task show': [1, {}, async ([id]) => {
    console.log(formatTask(await api.get(`/tasks/${enc(id)}`)));
  }, '<displayId>  Show task detail'],

  'task status': [2, {}, async ([id, status]) => {
    console.log(formatTask(await api.patch(`/tasks/${enc(id)}/status`, { status })));
  }, `<displayId> <${STATUSES.join('|')}>`],

  'task assign': [2, {}, async ([id, email]) => {
    console.log(formatTask(await api.patch(`/tasks/${enc(id)}/assignee`, { assigneeEmail: email })));
  }, '<displayId> <email>  Reassign a task'],

  'task priority': [2, {}, async ([id, priority]) => {
    console.log(formatTask(await api.patch(`/tasks/${enc(id)}/priority`, { priority })));
  }, `<displayId> <${PRIORITIES.join('|')}>`],

  'task comment': [2, {}, async ([id, comment]) => {
    await api.post(`/tasks/${enc(id)}/comments`, { comment });
    console.log('Comment added.');
  }, '<displayId> <text>  Add a comment'],

  'task history': [1, {}, async ([id]) => {
    console.log(formatHistory(await api.get(`/tasks/${enc(id)}/history`)));
  }, '<displayId>  Show change history'],

  'task search': [1, {
    project: { type: 'string' }, status: { type: 'string' }, assignee: { type: 'string' },
  }, async ([q], v) => {
    const params = new URLSearchParams({ q });
    for (const k of ['project', 'status', 'assignee']) if (v[k]) params.set(k, v[k]);
    for (const t of await api.get(`/tasks/search?${params}`)) {
      console.log(`[${t.displayId}] (${t.priority}, ${t.status}) ${t.title}`);
    }
  }, '<query> [--project KEY] [--status S] [--assignee email]'],

  'token list': [0, {}, async () => {
    for (const t of await api.get('/me/tokens')) {
      console.log(`${t.id}\t${t.revokedAt ? 'revoked' : 'active '}\t${t.label}`);
    }
  }, 'List your API tokens'],

  'token create': [1, {}, async ([label]) => {
    const t = await api.post('/me/tokens', { label });
    console.log(`Token (save now, shown once): ${t.token}`);
  }, '<label>  Create a new API token for yourself'],

  'token revoke': [1, {}, async ([id]) => {
    await api.del(`/tokens/${enc(id)}`);
    console.log('Token revoked.');
  }, '<tokenId>  Revoke one of your tokens'],
};

function help() {
  console.log('doto — DoTo command line\n\nUsage:');
  for (const [name, [, , , desc]] of Object.entries(COMMANDS)) console.log(`  doto ${name} ${desc}`);
}

async function main(argv) {
  // Cocokkan nama perintah dua kata dulu (mis. "task create"), lalu satu kata ("board").
  const name = [argv.slice(0, 2).join(' '), argv[0]].find((n) => n && COMMANDS[n]);
  if (!name) {
    help();
    if (argv.length && !['help', '--help', '-h'].includes(argv[0])) process.exit(1);
    return;
  }

  const [required, options, handler] = COMMANDS[name];
  let parsed;
  try {
    parsed = parseArgs({ args: argv.slice(name.split(' ').length), options, allowPositionals: true });
  } catch (err) {
    fail(err.message);
  }
  if (parsed.positionals.length < required) {
    fail(`Usage: doto ${name} ${COMMANDS[name][3]}`);
  }
  await handler(parsed.positionals, parsed.values);
}

main(process.argv.slice(2)).catch((err) => fail(err.message));
