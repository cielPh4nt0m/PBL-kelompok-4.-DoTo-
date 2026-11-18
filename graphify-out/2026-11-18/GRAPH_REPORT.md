# Graph Report - PBL-kelompok-4.-DoTo-  (2026-11-13)

## Corpus Check
- 78 files · ~197,184 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 559 nodes · 1271 edges · 33 communities (26 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12fabff7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- ai.js
- SegmentRepository
- DoTo
- schema-postgres.sql
- package.json
- TaskTagRepository
- doto.js
- TaskService.php
- Database
- TaskRepository
- fe-shell.js
- schema.sql
- ApiTokenRepository
- ProjectRepository
- server.js
- Uuid
- AGENTS.md
- CLAUDE.md
- calendar.js
- ProjectMemberService
- theme.js
- Config
- UserRepository

## God Nodes (most connected - your core abstractions)
1. `Request` - 58 edges
2. `Database` - 54 edges
3. `Response` - 51 edges
4. `Authenticator` - 50 edges
5. `TaskService` - 39 edges
6. `UserService` - 38 edges
7. `Validator` - 37 edges
8. `h()` - 28 edges
9. `Config` - 26 edges
10. `UserRepository` - 25 edges

## Surprising Connections (you probably didn't know these)
- `init()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `initProfilePage()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `initSecurityPage()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `unpackTask()` --calls--> `unpackMeta()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/meta.js
- `initLayout()` --calls--> `startNotifier()`  [EXTRACTED]
  public/assets/js/layout.js → public/assets/js/notify.js

## Import Cycles
- None detected.

## Communities (33 total, 7 thin omitted)

### Community 0 - "Request"
Cohesion: 0.06
Nodes (16): Authenticator, AiController, AuthController, MeController, ProjectController, ProjectMemberController, SegmentController, TaskController (+8 more)

### Community 1 - "ai.js"
Cohesion: 0.07
Nodes (66): api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h(), param() (+58 more)

### Community 2 - "SegmentRepository"
Cohesion: 0.07
Nodes (10): ConflictException, HttpException, NotFoundException, UnauthorizedException, ValidationException, PDO, SegmentRepository, Router (+2 more)

### Community 3 - "DoTo"
Cohesion: 0.09
Nodes (19): CDM (Conceptual Data Model), Constraint dan index, Desain Database DoTo, Nilai enum, PDM (Physical Data Model), Trigger MySQL/MariaDB, View, Alat pengembang DoTo PBL (+11 more)

### Community 4 - "schema-postgres.sql"
Cohesion: 0.29
Nodes (13): api_tokens, create_project(), create_task(), projects, segments, task_history, task_tags, tasks (+5 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): bin, doto-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, engines, node (+8 more)

### Community 6 - "TaskTagRepository"
Cohesion: 0.32
Nodes (3): PDO, TaskTagRepository, PDO

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 9 - "Database"
Cohesion: 0.16
Nodes (4): Database, PDO, PDO, UserService

### Community 10 - "TaskRepository"
Cohesion: 0.15
Nodes (3): AuthContext, PDO, TaskRepository

### Community 11 - "fe-shell.js"
Cohesion: 0.06
Nodes (61): activeProject, allProjects, buildSidebar(), colorOf(), COLORS, diffDays(), DotoTasks, ensureProjectAndTasks() (+53 more)

### Community 12 - "schema.sql"
Cohesion: 0.35
Nodes (15): api_tokens, notification_preferences, project_members, projects, segments, task_archive_queue, task_assignment_history, task_history (+7 more)

### Community 13 - "ApiTokenRepository"
Cohesion: 0.15
Nodes (3): ApiTokenRepository, PDO, Token

### Community 15 - "server.js"
Cohesion: 0.25
Nodes (5): api, apiUrl, priority, server, status

### Community 16 - "Uuid"
Cohesion: 0.15
Nodes (3): PDO, TaskHistoryRepository, Uuid

### Community 19 - "calendar.js"
Cohesion: 0.16
Nodes (20): unpackMeta(), colorOf(), COLORS, diffDays(), esc(), fmtDate(), load(), parseDate() (+12 more)

### Community 20 - "ProjectMemberService"
Cohesion: 0.23
Nodes (3): PDO, ProjectMemberRepository, ProjectMemberService

## Knowledge Gaps
- **77 isolated node(s):** `STATUSES`, `PRIORITIES`, `STATUS_LABEL`, `configPath`, `api` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `Request`, `SegmentRepository`, `TaskService.php`, `TaskRepository`, `ApiTokenRepository`, `ProjectRepository`, `Uuid`, `ProjectMemberService`, `Config`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `TaskService` connect `Request` to `SegmentRepository`, `TaskTagRepository`, `TaskService.php`, `Database`, `TaskRepository`, `ProjectRepository`, `Uuid`, `Config`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Request` connect `Request` to `TaskService.php`, `SegmentRepository`, `ApiTokenRepository`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `STATUSES`, `PRIORITIES`, `STATUS_LABEL` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.062285223367697595 - nodes in this community are weakly interconnected._
- **Should `ai.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07074504442925496 - nodes in this community are weakly interconnected._
- **Should `SegmentRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.06923076923076923 - nodes in this community are weakly interconnected._