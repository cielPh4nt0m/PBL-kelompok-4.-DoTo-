# Graph Report - PBL-kelompok-4.-DoTo-  (2026-11-03)

## Corpus Check
- 73 files · ~185,198 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 464 nodes · 1004 edges · 31 communities (23 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eed248f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- ai.js
- Config
- DoTo
- schema-postgres.sql
- package.json
- TaskTagRepository
- doto.js
- SegmentRepository
- Database
- TaskRepository
- fe-shell.js
- schema.sql
- UserRepository
- ProjectRepository
- server.js
- TaskHistoryRepository
- AGENTS.md
- CLAUDE.md
- TaskService.php
- ProjectMemberRepository
- theme.js

## God Nodes (most connected - your core abstractions)
1. `Request` - 47 edges
2. `Database` - 46 edges
3. `Response` - 41 edges
4. `Authenticator` - 40 edges
5. `TaskService` - 37 edges
6. `Validator` - 32 edges
7. `h()` - 28 edges
8. `TaskRepository` - 22 edges
9. `UserService` - 22 edges
10. `errorText()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `UnauthorizedException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/UnauthorizedException.php → backend/src/Http/HttpException.php
- `init()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `initTodoPage()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/fe-shell.js → public/assets/js/api.js
- `ConflictException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/ConflictException.php → backend/src/Http/HttpException.php
- `NotFoundException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/NotFoundException.php → backend/src/Http/HttpException.php

## Import Cycles
- None detected.

## Communities (31 total, 8 thin omitted)

### Community 0 - "Request"
Cohesion: 0.07
Nodes (16): Authenticator, AuthController, MeController, ProjectController, ProjectMemberController, SegmentController, TaskController, TokenController (+8 more)

### Community 1 - "ai.js"
Cohesion: 0.08
Nodes (58): api, ApiError, apiWithHeaders(), errorText(), request(), formatDate(), h(), param() (+50 more)

### Community 2 - "Config"
Cohesion: 0.07
Nodes (7): Config, ConflictException, HttpException, NotFoundException, ValidationException, Router, RuntimeException

### Community 3 - "DoTo"
Cohesion: 0.10
Nodes (18): CDM (Conceptual Data Model), Constraint dan index, Desain Database DoTo, Nilai enum, PDM (Physical Data Model), Trigger MySQL/MariaDB, View, 1. Siapkan database (+10 more)

### Community 4 - "schema-postgres.sql"
Cohesion: 0.29
Nodes (13): api_tokens, create_project(), create_task(), projects, segments, task_history, task_tags, tasks (+5 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): bin, doto-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, engines, node (+8 more)

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 9 - "Database"
Cohesion: 0.16
Nodes (4): Database, PDO, SegmentService, Uuid

### Community 11 - "fe-shell.js"
Cohesion: 0.09
Nodes (35): activeProject, allProjects, autoStatus(), buildSidebar(), colorOf(), COLORS, diffDays(), DotoTasks (+27 more)

### Community 12 - "schema.sql"
Cohesion: 0.38
Nodes (14): api_tokens, project_members, projects, segments, task_archive_queue, task_assignment_history, task_history, task_tags (+6 more)

### Community 13 - "UserRepository"
Cohesion: 0.09
Nodes (6): UnauthorizedException, ApiTokenRepository, PDO, PDO, UserRepository, Token

### Community 15 - "server.js"
Cohesion: 0.25
Nodes (5): api, apiUrl, priority, server, status

### Community 16 - "TaskHistoryRepository"
Cohesion: 0.22
Nodes (3): PDO, TaskHistoryRepository, PDO

### Community 20 - "ProjectMemberRepository"
Cohesion: 0.22
Nodes (3): PDO, ProjectMemberRepository, ProjectMemberService

## Knowledge Gaps
- **64 isolated node(s):** `STATUSES`, `PRIORITIES`, `STATUS_LABEL`, `configPath`, `api` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `Request`, `Config`, `TaskTagRepository`, `SegmentRepository`, `UserRepository`, `ProjectRepository`, `TaskHistoryRepository`, `TaskService.php`, `ProjectMemberRepository`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `TaskService` connect `Request` to `Config`, `TaskTagRepository`, `SegmentRepository`, `Database`, `ProjectRepository`, `TaskHistoryRepository`, `TaskService.php`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Request` connect `Request` to `Config`, `UserRepository`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `STATUSES`, `PRIORITIES`, `STATUS_LABEL` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.06890756302521009 - nodes in this community are weakly interconnected._
- **Should `ai.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08252853380158033 - nodes in this community are weakly interconnected._
- **Should `Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._