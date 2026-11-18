#!/usr/bin/env node
// MCP server DoTo (port dari taskooalah mcp-server). Jalan lewat stdio dan
// memanggil API DoTo memakai API token milik user.
//
// Env var:
//   DOTO_API_URL     mis. http://localhost:8000
//   DOTO_API_TOKEN   token dari halaman Tokens (doto_...)
//   DOTO_AGENT_NAME  nama agent yang tercatat di riwayat tugas (default: mcp-agent)

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const apiUrl = process.env.DOTO_API_URL?.replace(/\/$/, '');
const apiToken = process.env.DOTO_API_TOKEN;
const agentName = process.env.DOTO_AGENT_NAME ?? 'mcp-agent';

if (!apiUrl || !apiToken) {
  console.error("DOTO_API_URL and DOTO_API_TOKEN must be set in the MCP server's environment");
  process.exit(1);
}

async function request(method, path, body) {
  const res = await fetch(`${apiUrl}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
      'X-Client-Channel': 'agent',
      'X-Agent-Name': agentName,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`DoTo API ${method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.status === 204 ? undefined : res.json();
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};

const enc = encodeURIComponent;
const status = z.enum(['idea', 'todo', 'in_progress', 'needs_review', 'done']);
const priority = z.enum(['low', 'medium', 'high', 'urgent']);

function jsonResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: 'doto', version: '0.1.0' });

server.tool('list_projects', 'List all DoTo projects', {}, async () => jsonResult(await api.get('/projects')));

server.tool(
  'get_board',
  "Get a project's board: every segment with its tasks grouped by status. Use this to see what's an idea, todo, in progress, needs review, or done.",
  { projectKey: z.string(), includeArchived: z.boolean().optional() },
  async ({ projectKey, includeArchived }) => {
    const qs = includeArchived ? '?includeArchived=true' : '';
    return jsonResult(await api.get(`/projects/${enc(projectKey)}/board${qs}`));
  },
);

server.tool(
  'get_task',
  "Get a single task's full detail plus its 10 most recent history entries",
  { displayId: z.string() },
  async ({ displayId }) => {
    const task = await api.get(`/tasks/${enc(displayId)}`);
    const history = await api.get(`/tasks/${enc(displayId)}/history?limit=10`);
    return jsonResult({ task, history });
  },
);

server.tool(
  'create_task',
  "Create a new task inside a project's segment. Assignee defaults to whoever this MCP server's token belongs to, unless assigneeEmail is given.",
  {
    projectKey: z.string(),
    segmentName: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    status: status.optional(),
    priority: priority.optional(),
    tags: z.array(z.string()).optional(),
    assigneeEmail: z.string().email().optional(),
  },
  async ({ projectKey, ...body }) => jsonResult(await api.post(`/projects/${enc(projectKey)}/tasks`, body)),
);

server.tool(
  'update_task_status',
  "Change a task's status: idea, todo, in_progress, needs_review, or done",
  { displayId: z.string(), status },
  async ({ displayId, status: s }) => jsonResult(await api.patch(`/tasks/${enc(displayId)}/status`, { status: s })),
);

server.tool(
  'update_task_priority',
  "Change a task's priority: low, medium, high, or urgent",
  { displayId: z.string(), priority },
  async ({ displayId, priority: p }) => jsonResult(await api.patch(`/tasks/${enc(displayId)}/priority`, { priority: p })),
);

server.tool(
  'reassign_task',
  'Reassign a task to a different teammate by email',
  { displayId: z.string(), assigneeEmail: z.string().email() },
  async ({ displayId, assigneeEmail }) => jsonResult(await api.patch(`/tasks/${enc(displayId)}/assignee`, { assigneeEmail })),
);

server.tool(
  'add_comment',
  "Add a comment to a task's history log -- use this to leave context for teammates instead of relying on verbal sync",
  { displayId: z.string(), comment: z.string() },
  async ({ displayId, comment }) => jsonResult(await api.post(`/tasks/${enc(displayId)}/comments`, { comment })),
);

server.tool(
  'get_task_history',
  'Get the full change history/audit log for a task: who changed what, when, and via which channel (web, cli, or agent)',
  { displayId: z.string(), limit: z.number().int().positive().optional() },
  async ({ displayId, limit }) => {
    const qs = limit ? `?limit=${limit}` : '';
    return jsonResult(await api.get(`/tasks/${enc(displayId)}/history${qs}`));
  },
);

server.tool(
  'search_tasks',
  'Search tasks by free text, project, status, or assignee',
  {
    q: z.string().optional(),
    project: z.string().optional(),
    status: status.optional(),
    assignee: z.string().optional(),
    includeArchived: z.boolean().optional(),
  },
  async (input) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) params.set(key, String(value));
    }
    return jsonResult(await api.get(`/tasks/search?${params}`));
  },
);

await server.connect(new StdioServerTransport());
