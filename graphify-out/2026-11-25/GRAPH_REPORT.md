# Graph Report - PBL-kelompok-4.-DoTo-  (2026-11-18)

## Corpus Check
- 103 files · ~359,069 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 883 nodes · 2051 edges · 57 communities (48 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb01ef2b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- h
- Uuid
- DoTo
- schema-postgres.sql
- package.json
- assets/js/pages/ai.js
- doto.js
- public/assets/js/pages/ai.js
- Database
- TaskRepository
- public/assets/js/fe-shell.js
- schema.sql
- ApiTokenRepository
- ProjectRepository
- server.js
- AuthContext
- AGENTS.md
- CLAUDE.md
- public/assets/js/pages/calendar.js
- ProjectMemberService
- public/assets/js/theme.js
- Config
- UserRepository
- Response
- init
- assets/js/fe-shell.js
- public/assets/js/notify.js
- assets/js/notify.js
- mock-api.js
- TaskService
- init
- assets/js/pages/calendar.js
- public/assets/js/layout.js
- initAiPrefsPage
- Validator
- assets/js/ai-prefs.js
- public/assets/js/ai-prefs.js
- initAiPrefsPage
- public/assets/js/meta.js
- ValidationException
- SegmentRepository
- DoTo – versi interface saja
- assets/js/theme.js
- Permintaan ke Backend: AI Preferences (pengaturan, izin, dan riwayat Agen AI)
- Permintaan ke Backend: pengaturan & pemicu notifikasi

## God Nodes (most connected - your core abstractions)
1. `Request` - 58 edges
2. `Database` - 54 edges
3. `Response` - 51 edges
4. `Authenticator` - 50 edges
5. `TaskService` - 39 edges
6. `UserService` - 38 edges
7. `Validator` - 37 edges
8. `h()` - 29 edges
9. `h()` - 29 edges
10. `Config` - 26 edges

## Surprising Connections (you probably didn't know these)
- `openSession()` --indirect_call--> `me()`  [INFERRED]
  public/assets/js/pages/ai.js → assets/js/mock-api.js
- `openSession()` --indirect_call--> `me()`  [INFERRED]
  assets/js/pages/ai.js → assets/js/mock-api.js
- `checkAiReminders()` --calls--> `loadAiPrefs()`  [EXTRACTED]
  assets/js/notify.js → assets/js/ai-prefs.js
- `checkAiReminders()` --calls--> `addLog()`  [EXTRACTED]
  assets/js/notify.js → assets/js/ai-prefs.js
- `logAction()` --calls--> `addLog()`  [EXTRACTED]
  assets/js/pages/ai.js → assets/js/ai-prefs.js

## Import Cycles
- None detected.

## Communities (57 total, 9 thin omitted)

### Community 0 - "Request"
Cohesion: 0.14
Nodes (5): Authenticator, ProjectMemberController, TokenController, self, Request

### Community 1 - "h"
Cohesion: 0.17
Nodes (27): errorText(), formatDate(), h(), param(), PRIORITIES, STATUS_LABEL, STATUSES, statusSelect() (+19 more)

### Community 2 - "Uuid"
Cohesion: 0.15
Nodes (5): ConflictException, HttpException, NotFoundException, Uuid, RuntimeException

### Community 3 - "DoTo"
Cohesion: 0.09
Nodes (19): CDM (Conceptual Data Model), Constraint dan index, Desain Database DoTo, Nilai enum, PDM (Physical Data Model), Trigger MySQL/MariaDB, View, Alat pengembang DoTo PBL (+11 more)

### Community 4 - "schema-postgres.sql"
Cohesion: 0.29
Nodes (13): api_tokens, create_project(), create_task(), projects, segments, task_history, task_tags, tasks (+5 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): bin, doto-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, engines, node (+8 more)

### Community 6 - "assets/js/pages/ai.js"
Cohesion: 0.06
Nodes (80): api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h(), param() (+72 more)

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 8 - "public/assets/js/pages/ai.js"
Cohesion: 0.13
Nodes (28): NOTICE, actionCard(), activeSegments, agentApi, applyPerms(), askBackendOrFallback(), content, detectPriority() (+20 more)

### Community 9 - "Database"
Cohesion: 0.13
Nodes (4): Database, PDO, PDO, UserService

### Community 11 - "public/assets/js/fe-shell.js"
Cohesion: 0.11
Nodes (22): activeProject, allProjects, COLORS, diffDays(), DotoTasks, ensureProjectAndTasks(), fmtDate(), loadMine() (+14 more)

### Community 12 - "schema.sql"
Cohesion: 0.35
Nodes (15): api_tokens, notification_preferences, project_members, projects, segments, task_archive_queue, task_assignment_history, task_history (+7 more)

### Community 15 - "server.js"
Cohesion: 0.25
Nodes (5): api, apiUrl, priority, server, status

### Community 16 - "AuthContext"
Cohesion: 0.10
Nodes (7): AuthContext, PDO, TaskHistoryRepository, PDO, TaskTagRepository, PDO, Enums

### Community 19 - "public/assets/js/pages/calendar.js"
Cohesion: 0.17
Nodes (19): colorOf(), COLORS, diffDays(), esc(), fmtDate(), load(), parseDate(), plusDays() (+11 more)

### Community 20 - "ProjectMemberService"
Cohesion: 0.21
Nodes (3): PDO, ProjectMemberRepository, ProjectMemberService

### Community 21 - "public/assets/js/theme.js"
Cohesion: 0.39
Nodes (6): apply(), banner(), missingFiles(), report(), resolve(), sync()

### Community 32 - "UserRepository"
Cohesion: 0.13
Nodes (4): UnauthorizedException, PDO, UserRepository, Token

### Community 33 - "Response"
Cohesion: 0.14
Nodes (4): AuthController, MeController, self, Response

### Community 34 - "init"
Cohesion: 0.13
Nodes (20): buildSidebar(), colorOf(), esc(), ini(), init(), renderAccount(), toast(), initAppearancePage() (+12 more)

### Community 35 - "assets/js/fe-shell.js"
Cohesion: 0.10
Nodes (22): activeProject, allProjects, COLORS, diffDays(), DotoTasks, ensureProjectAndTasks(), fmtDate(), loadMine() (+14 more)

### Community 36 - "public/assets/js/notify.js"
Cohesion: 0.23
Nodes (21): initNotificationsPage(), emit(), GROUP_OF, GROUPS, isOn(), loadPrefs(), permission(), rd() (+13 more)

### Community 37 - "assets/js/notify.js"
Cohesion: 0.23
Nodes (20): initNotificationsPage(), emit(), GROUP_OF, GROUPS, isOn(), loadPrefs(), permission(), rd() (+12 more)

### Community 38 - "mock-api.js"
Cohesion: 0.14
Nodes (13): actorOf(), E(), hist(), me(), mkProject(), mkSegment(), mkTask(), save() (+5 more)

### Community 39 - "TaskService"
Cohesion: 0.19
Nodes (5): ProjectController, SegmentController, ProjectService, SegmentService, TaskService

### Community 40 - "init"
Cohesion: 0.17
Nodes (18): buildSidebar(), colorOf(), esc(), ini(), init(), renderAccount(), toast(), initProfilePage() (+10 more)

### Community 41 - "assets/js/pages/calendar.js"
Cohesion: 0.17
Nodes (19): colorOf(), COLORS, diffDays(), esc(), fmtDate(), load(), parseDate(), plusDays() (+11 more)

### Community 42 - "public/assets/js/layout.js"
Cohesion: 0.17
Nodes (15): api, ApiError, apiWithHeaders(), request(), initLayout(), LINKS, navLinks(), showPageError() (+7 more)

### Community 43 - "initAiPrefsPage"
Cohesion: 0.22
Nodes (16): addLog(), clearLog(), clone(), loadAiPrefs(), loadLog(), logKey(), rd(), sanitize() (+8 more)

### Community 45 - "assets/js/ai-prefs.js"
Cohesion: 0.21
Nodes (15): AI_DEFAULTS, B_ENUMS, buildAutoMessages(), composeAuto(), dueEnd(), ENUMS, fmtDue(), INTRO (+7 more)

### Community 46 - "public/assets/js/ai-prefs.js"
Cohesion: 0.23
Nodes (14): AI_DEFAULTS, B_ENUMS, buildAutoMessages(), composeAuto(), dueEnd(), ENUMS, fmtDue(), INTRO (+6 more)

### Community 47 - "initAiPrefsPage"
Cohesion: 0.29
Nodes (15): addLog(), clearLog(), clone(), loadAiPrefs(), loadLog(), logKey(), rd(), sanitize() (+7 more)

### Community 48 - "public/assets/js/meta.js"
Cohesion: 0.24
Nodes (12): DEFAULT_DUE_DAYS, META_END, META_MARKER, stripMeta(), unpackMeta(), esc(), fmt(), loadTasks() (+4 more)

### Community 51 - "DoTo – versi interface saja"
Cohesion: 0.22
Nodes (8): Calendar (menggantikan To-do list), Cara membuka, DoTo – versi interface saja, Kembali ke backend asli, Kontrak yang dibutuhkan backend nanti (belum dikerjakan), Login, Reset data, Tidak disertakan

### Community 52 - "assets/js/theme.js"
Cohesion: 0.39
Nodes (6): apply(), banner(), missingFiles(), report(), resolve(), sync()

### Community 53 - "Permintaan ke Backend: AI Preferences (pengaturan, izin, dan riwayat Agen AI)"
Cohesion: 0.25
Nodes (7): 1. Preferensi AI per akun (bukan per proyek), 2. Penegakan izin di server (wajib), 3. Persetujuan aksi (Confirm before important actions), 4. Riwayat aktivitas AI (menu "AI Activity & Privacy"), 5. Pesan otomatis & pengingat (logika yang sekarang ada di frontend), Permintaan ke Backend: AI Preferences (pengaturan, izin, dan riwayat Agen AI), Pesan siap kirim

### Community 54 - "Permintaan ke Backend: pengaturan & pemicu notifikasi"
Cohesion: 0.29
Nodes (6): 1. Simpan pengaturan per akun, 2. Syarat data agar pengecekan frontend akurat, 3. Pemicu yang belum punya sumber data, 4. Ke depan: push dari server, Permintaan ke Backend: pengaturan & pemicu notifikasi, Pesan siap kirim

## Knowledge Gaps
- **148 isolated node(s):** `ENUMS`, `B_ENUMS`, `PRI`, `INTRO`, `COLORS` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `me()` connect `mock-api.js` to `assets/js/pages/ai.js`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `openSession()` connect `mock-api.js` to `public/assets/js/pages/ai.js`, `public/assets/js/ai-prefs.js`, `initAiPrefsPage`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `openSession()` connect `assets/js/pages/ai.js` to `initAiPrefsPage`, `assets/js/ai-prefs.js`, `mock-api.js`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `ENUMS`, `B_ENUMS`, `PRI` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Uuid` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `DoTo` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._