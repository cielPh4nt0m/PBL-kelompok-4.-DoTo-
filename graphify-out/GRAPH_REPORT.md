# Graph Report - PBL-kelompok-4.-DoTo-  (2026-10-28)

## Corpus Check
- 64 files · ~181,931 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 430 nodes · 911 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dac8aef8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- ai.js
- Config
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
- TaskService.php
- AGENTS.md
- CLAUDE.md
- UserRepository
- Uuid
- theme.js

## God Nodes (most connected - your core abstractions)
1. `Request` - 43 edges
2. `Database` - 40 edges
3. `Response` - 37 edges
4. `Authenticator` - 36 edges
5. `TaskService` - 36 edges
6. `Validator` - 30 edges
7. `h()` - 26 edges
8. `TaskRepository` - 22 edges
9. `UserService` - 20 edges
10. `errorText()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `ConflictException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/ConflictException.php → backend/src/Http/HttpException.php
- `NotFoundException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/NotFoundException.php → backend/src/Http/HttpException.php
- `UnauthorizedException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/UnauthorizedException.php → backend/src/Http/HttpException.php
- `init()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `initTodoPage()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js

## Import Cycles
- None detected.

## Communities (27 total, 7 thin omitted)

### Community 0 - "Request"
Cohesion: 0.07
Nodes (15): Authenticator, AuthController, MeController, ProjectController, SegmentController, TaskController, TokenController, self (+7 more)

### Community 1 - "ai.js"
Cohesion: 0.08
Nodes (56): api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h(), param() (+48 more)

### Community 2 - "Config"
Cohesion: 0.07
Nodes (5): Config, HttpException, ValidationException, Router, RuntimeException

### Community 3 - "DoTo"
Cohesion: 0.11
Nodes (17): CDM (Conceptual Data Model), Constraint dan index, Desain Database DoTo, Nilai enum, PDM (Physical Data Model), View, 1. Siapkan database, 2. Konfigurasi dan migrasi (+9 more)

### Community 4 - "schema-postgres.sql"
Cohesion: 0.29
Nodes (13): api_tokens, create_project(), create_task(), projects, segments, task_history, task_tags, tasks (+5 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): bin, doto-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, engines, node (+8 more)

### Community 6 - "AuthContext"
Cohesion: 0.16
Nodes (4): AuthContext, PDO, TaskTagRepository, PDO

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 8 - "SegmentRepository"
Cohesion: 0.23
Nodes (3): PDO, SegmentRepository, SegmentService

### Community 11 - "fe-shell.js"
Cohesion: 0.10
Nodes (32): activeProject, autoStatus(), buildSidebar(), colorOf(), COLORS, diffDays(), DotoTasks, effectiveStatus() (+24 more)

### Community 12 - "schema.sql"
Cohesion: 0.48
Nodes (11): api_tokens, projects, segments, task_history, task_tags, tasks, users, v_project_summary (+3 more)

### Community 13 - "ApiTokenRepository"
Cohesion: 0.12
Nodes (4): UnauthorizedException, ApiTokenRepository, PDO, Token

### Community 15 - "server.js"
Cohesion: 0.25
Nodes (5): api, apiUrl, priority, server, status

### Community 16 - "TaskService.php"
Cohesion: 0.22
Nodes (3): PDO, TaskHistoryRepository, Enums

### Community 20 - "Uuid"
Cohesion: 0.18
Nodes (3): ConflictException, NotFoundException, Uuid

## Knowledge Gaps
- **58 isolated node(s):** `STATUSES`, `PRIORITIES`, `STATUS_LABEL`, `configPath`, `api` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `Request`, `Config`, `AuthContext`, `SegmentRepository`, `TaskRepository`, `ApiTokenRepository`, `ProjectRepository`, `TaskService.php`, `UserRepository`, `Uuid`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `TaskService` connect `Request` to `Config`, `AuthContext`, `Database`, `TaskRepository`, `TaskService.php`, `UserRepository`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `Request` connect `Request` to `Config`, `ApiTokenRepository`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `STATUSES`, `PRIORITIES`, `STATUS_LABEL` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.07382091592617908 - nodes in this community are weakly interconnected._
- **Should `ai.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._
- **Should `Config` be split into smaller, more focused modules?**
  _Cohesion score 0.07389162561576355 - nodes in this community are weakly interconnected._