# Graph Report - PBL-kelompok-4.-DoTo-  (2026-11-25)

## Corpus Check
- 104 files · ~522,411 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 922 nodes · 2111 edges · 59 communities (49 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38fe5b53`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- public/assets/js/pages/ai.js
- Uuid
- DoTo
- schema-postgres.sql
- package.json
- h
- doto.js
- Kamus Data Lengkap (Data Dictionary — 12 Tabel)
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
- Desain Database DoTo
- 2. Unified Modeling Language (UML)
- assets/js/ai-prefs.js
- Validator
- assets/js/pages/ai.js
- public/assets/js/ai-prefs.js
- initAiPrefsPage
- 1. Data Flow Diagram (DFD)
- routes.php
- SegmentRepository
- DoTo – versi interface saja
- assets/js/theme.js
- Permintaan ke Backend: AI Preferences (pengaturan, izin, dan riwayat Agen AI)
- Permintaan ke Backend: pengaturan & pemicu notifikasi
- Menjalankan di lokal
- database.md

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
- `initAppearancePage()` --calls--> `clone()`  [EXTRACTED]
  assets/js/fe-shell.js → assets/js/ai-prefs.js
- `checkAiReminders()` --calls--> `loadAiPrefs()`  [EXTRACTED]
  assets/js/notify.js → assets/js/ai-prefs.js
- `checkAiReminders()` --calls--> `addLog()`  [EXTRACTED]
  assets/js/notify.js → assets/js/ai-prefs.js

## Import Cycles
- None detected.

## Communities (59 total, 10 thin omitted)

### Community 0 - "Request"
Cohesion: 0.14
Nodes (5): Authenticator, ProjectMemberController, TokenController, self, Request

### Community 1 - "public/assets/js/pages/ai.js"
Cohesion: 0.05
Nodes (93): NOTICE, api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h() (+85 more)

### Community 2 - "Uuid"
Cohesion: 0.14
Nodes (5): ConflictException, HttpException, NotFoundException, Uuid, RuntimeException

### Community 3 - "DoTo"
Cohesion: 0.33
Nodes (6): API, CLI, DoTo, Kebutuhan, MCP server (agent AI), Struktur

### Community 4 - "schema-postgres.sql"
Cohesion: 0.29
Nodes (13): api_tokens, create_project(), create_task(), projects, segments, task_history, task_tags, tasks (+5 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): bin, doto-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, engines, node (+8 more)

### Community 6 - "h"
Cohesion: 0.06
Nodes (73): api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h(), param() (+65 more)

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 8 - "Kamus Data Lengkap (Data Dictionary — 12 Tabel)"
Cohesion: 0.15
Nodes (13): 10. `task_archive_queue`, 11. `task_assignment_history`, 12. `schema_migrations` *(dibuat otomatis oleh `migrate.php`)*, 1. `users`, 2. `api_tokens`, 3. `notification_preferences`, 4. `projects`, 5. `project_members` (+5 more)

### Community 9 - "Database"
Cohesion: 0.13
Nodes (4): Database, PDO, PDO, UserService

### Community 11 - "public/assets/js/fe-shell.js"
Cohesion: 0.10
Nodes (24): activeProject, allProjects, COLORS, diffDays(), DotoTasks, ensureProjectAndTasks(), fmtDate(), loadMine() (+16 more)

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
Cohesion: 0.09
Nodes (24): AI_DEFAULTS, activeProject, allProjects, COLORS, diffDays(), DotoTasks, ensureProjectAndTasks(), fmtDate() (+16 more)

### Community 36 - "public/assets/js/notify.js"
Cohesion: 0.25
Nodes (20): initNotificationsPage(), emit(), GROUP_OF, isOn(), loadPrefs(), permission(), rd(), savePrefs() (+12 more)

### Community 37 - "assets/js/notify.js"
Cohesion: 0.25
Nodes (19): initNotificationsPage(), emit(), GROUP_OF, isOn(), loadPrefs(), permission(), rd(), savePrefs() (+11 more)

### Community 38 - "mock-api.js"
Cohesion: 0.15
Nodes (12): actorOf(), E(), hist(), me(), mkProject(), mkSegment(), mkTask(), save() (+4 more)

### Community 39 - "TaskService"
Cohesion: 0.19
Nodes (5): ProjectController, SegmentController, ProjectService, SegmentService, TaskService

### Community 40 - "init"
Cohesion: 0.14
Nodes (19): buildSidebar(), colorOf(), esc(), ini(), init(), renderAccount(), toast(), initAppearancePage() (+11 more)

### Community 41 - "Desain Database DoTo"
Cohesion: 0.22
Nodes (9): CDM (Conceptual Data Model), Constraint dan Index (32 Definisi), Daftar Entitas CDM (11 Entitas Bisnis), Desain Database DoTo, Kardinalitas Relasi CDM (15 Relasi), Nilai Enum, PDM (Physical Data Model), Trigger MySQL/MariaDB (+1 more)

### Community 42 - "2. Unified Modeling Language (UML)"
Cohesion: 0.29
Nodes (7): 2.1 Use Case Diagram, 2.2 Activity Diagram 1 — Siklus Hidup Tugas & Trigger Arsip Otomatis, 2.3 Activity Diagram 2 — Chat Asisten AI (Human-in-the-Loop), 2.4 Sequence Diagram 1 — Autentikasi Google OAuth 2.0 & Auto-Join K4, 2.5 Sequence Diagram 2 — Perubahan Status Tugas ke `done` & 3 Trigger MySQL, 2.6 Class Diagram — Arsitektur Berlapis Backend PHP Native (`App\*`), 2. Unified Modeling Language (UML)

### Community 43 - "assets/js/ai-prefs.js"
Cohesion: 0.17
Nodes (26): addLog(), B_ENUMS, buildAutoMessages(), clearLog(), clone(), composeAuto(), dueEnd(), ENUMS (+18 more)

### Community 45 - "assets/js/pages/ai.js"
Cohesion: 0.12
Nodes (29): keysOf(), myActiveTasks(), NOTICE, actionCard(), activeSegments, agentApi, applyPerms(), content (+21 more)

### Community 46 - "public/assets/js/ai-prefs.js"
Cohesion: 0.23
Nodes (14): AI_DEFAULTS, B_ENUMS, buildAutoMessages(), composeAuto(), dueEnd(), ENUMS, fmtDue(), INTRO (+6 more)

### Community 47 - "initAiPrefsPage"
Cohesion: 0.29
Nodes (15): addLog(), clearLog(), clone(), loadAiPrefs(), loadLog(), logKey(), rd(), sanitize() (+7 more)

### Community 48 - "1. Data Flow Diagram (DFD)"
Cohesion: 0.33
Nodes (5): 1.1 DFD Level 0 (Diagram Konteks), 1.2 DFD Level 1 (Dekomposisi 6 Proses Utama), 1.3 DFD Level 2 — Proses 3.0 (Pengelolaan Tugas & Integrasi Trigger), 1. Data Flow Diagram (DFD), Desain Sistem DoTo (DFD & UML)

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

### Community 57 - "Menjalankan di lokal"
Cohesion: 0.40
Nodes (5): 1. Siapkan database, 2. Konfigurasi dan migrasi, 3. Jalankan server, 4. Archive otomatis (opsional), Menjalankan di lokal

## Knowledge Gaps
- **170 isolated node(s):** `ENUMS`, `B_ENUMS`, `PRI`, `INTRO`, `COLORS` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `me()` connect `mock-api.js` to `public/assets/js/pages/ai.js`, `assets/js/pages/ai.js`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `openSession()` connect `public/assets/js/pages/ai.js` to `public/assets/js/ai-prefs.js`, `mock-api.js`, `initAiPrefsPage`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `openSession()` connect `assets/js/pages/ai.js` to `assets/js/ai-prefs.js`, `mock-api.js`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **What connects `ENUMS`, `B_ENUMS`, `PRI` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `public/assets/js/pages/ai.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0510989010989011 - nodes in this community are weakly interconnected._
- **Should `Uuid` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._