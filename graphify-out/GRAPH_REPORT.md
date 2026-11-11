# Graph Report - PBL-kelompok-4.-DoTo-  (2026-11-11)

## Corpus Check
- 78 files · ~196,543 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 556 nodes · 1268 edges · 33 communities (25 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89266406`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- ai.js
- Uuid
- DoTo
- schema-postgres.sql
- package.json
- AuthContext
- doto.js
- SegmentRepository
- Database
- TaskRepository
- fe-shell.js
- schema.sql
- ApiTokenRepository
- ProjectRepository
- server.js
- TaskHistoryRepository
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
9. `UserRepository` - 25 edges
10. `Config` - 23 edges

## Surprising Connections (you probably didn't know these)
- `UnauthorizedException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/UnauthorizedException.php → backend/src/Http/HttpException.php
- `init()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `initProfilePage()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `initSecurityPage()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `unpackTask()` --calls--> `unpackMeta()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/meta.js

## Import Cycles
- None detected.

## Communities (33 total, 8 thin omitted)

### Community 0 - "Request"
Cohesion: 0.06
Nodes (16): Authenticator, AiController, AuthController, MeController, ProjectController, ProjectMemberController, SegmentController, TaskController (+8 more)

### Community 1 - "ai.js"
Cohesion: 0.08
Nodes (63): api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h(), param() (+55 more)

### Community 2 - "Uuid"
Cohesion: 0.12
Nodes (6): ConflictException, HttpException, NotFoundException, ValidationException, Uuid, RuntimeException

### Community 3 - "DoTo"
Cohesion: 0.09
Nodes (19): CDM (Conceptual Data Model), Constraint dan index, Desain Database DoTo, Nilai enum, PDM (Physical Data Model), Trigger MySQL/MariaDB, View, Alat pengembang DoTo PBL (+11 more)

### Community 4 - "schema-postgres.sql"
Cohesion: 0.29
Nodes (13): api_tokens, create_project(), create_task(), projects, segments, task_history, task_tags, tasks (+5 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): bin, doto-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, engines, node (+8 more)

### Community 6 - "AuthContext"
Cohesion: 0.15
Nodes (4): AuthContext, PDO, TaskTagRepository, PDO

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 8 - "SegmentRepository"
Cohesion: 0.22
Nodes (3): PDO, SegmentRepository, SegmentService

### Community 9 - "Database"
Cohesion: 0.14
Nodes (4): Database, PDO, PDO, UserService

### Community 11 - "fe-shell.js"
Cohesion: 0.06
Nodes (60): activeProject, allProjects, buildSidebar(), colorOf(), COLORS, diffDays(), DotoTasks, ensureProjectAndTasks() (+52 more)

### Community 12 - "schema.sql"
Cohesion: 0.35
Nodes (15): api_tokens, notification_preferences, project_members, projects, segments, task_archive_queue, task_assignment_history, task_history (+7 more)

### Community 13 - "ApiTokenRepository"
Cohesion: 0.11
Nodes (5): UnauthorizedException, ApiTokenRepository, PDO, Enums, Token

### Community 15 - "server.js"
Cohesion: 0.25
Nodes (5): api, apiUrl, priority, server, status

### Community 19 - "calendar.js"
Cohesion: 0.13
Nodes (24): DEFAULT_DUE_DAYS, META_END, META_MARKER, stripMeta(), unpackMeta(), colorOf(), COLORS, diffDays() (+16 more)

### Community 20 - "ProjectMemberService"
Cohesion: 0.21
Nodes (3): PDO, ProjectMemberRepository, ProjectMemberService

## Knowledge Gaps
- **77 isolated node(s):** `STATUSES`, `PRIORITIES`, `STATUS_LABEL`, `configPath`, `api` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `Request`, `Uuid`, `AuthContext`, `SegmentRepository`, `TaskRepository`, `ApiTokenRepository`, `ProjectRepository`, `TaskHistoryRepository`, `ProjectMemberService`, `Config`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `TaskService` connect `Request` to `Uuid`, `AuthContext`, `SegmentRepository`, `Database`, `TaskRepository`, `TaskHistoryRepository`, `ProjectMemberService`, `Config`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Request` connect `Request` to `Uuid`, `ApiTokenRepository`, `Config`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `STATUSES`, `PRIORITIES`, `STATUS_LABEL` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.062285223367697595 - nodes in this community are weakly interconnected._
- **Should `ai.js` be split into smaller, more focused modules?**
  _Cohesion score 0.076103500761035 - nodes in this community are weakly interconnected._
- **Should `Uuid` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._