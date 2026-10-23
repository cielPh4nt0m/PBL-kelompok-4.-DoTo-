# Graph Report - PBL-kelompok-4.-DoTo-  (2026-10-23)

## Corpus Check
- 59 files · ~176,476 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 381 nodes · 819 edges · 27 communities (17 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `25bd194f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Request
- h
- HttpException
- DoTo
- schema-postgres.sql
- package.json
- AuthContext
- doto.js
- SegmentRepository
- Database
- TaskRepository
- Config
- schema.sql
- ApiTokenRepository
- ProjectRepository
- server.js
- TaskService.php
- Token
- TaskTagRepository
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
10. `Config` - 15 edges

## Surprising Connections (you probably didn't know these)
- `UnauthorizedException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/UnauthorizedException.php → backend/src/Http/HttpException.php
- `ConflictException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/ConflictException.php → backend/src/Http/HttpException.php
- `NotFoundException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/NotFoundException.php → backend/src/Http/HttpException.php
- `ValidationException` --inherits--> `HttpException`  [EXTRACTED]
  backend/src/Http/ValidationException.php → backend/src/Http/HttpException.php
- `addSegmentColumn()` --calls--> `errorText()`  [EXTRACTED]
  public/assets/js/pages/board.js → public/assets/js/api.js

## Import Cycles
- None detected.

## Communities (27 total, 10 thin omitted)

### Community 0 - "Request"
Cohesion: 0.07
Nodes (14): Authenticator, AuthController, MeController, ProjectController, SegmentController, TaskController, TokenController, self (+6 more)

### Community 1 - "h"
Cohesion: 0.10
Nodes (45): api, ApiError, errorText(), formatDate(), h(), param(), PRIORITIES, STATUS_LABEL (+37 more)

### Community 2 - "HttpException"
Cohesion: 0.11
Nodes (6): ConflictException, HttpException, NotFoundException, ValidationException, Router, RuntimeException

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
Cohesion: 0.14
Nodes (4): AuthContext, PDO, TaskHistoryRepository, PDO

### Community 7 - "doto.js"
Cohesion: 0.16
Nodes (11): api, COMMANDS, configPath, fail(), help(), main(), PRIORITIES, readConfig() (+3 more)

### Community 8 - "SegmentRepository"
Cohesion: 0.20
Nodes (3): PDO, SegmentRepository, SegmentService

### Community 9 - "Database"
Cohesion: 0.20
Nodes (3): Database, PDO, UserService

### Community 12 - "schema.sql"
Cohesion: 0.48
Nodes (11): api_tokens, projects, segments, task_history, task_tags, tasks, users, v_project_summary (+3 more)

### Community 15 - "server.js"
Cohesion: 0.25
Nodes (5): api, apiUrl, priority, server, status

## Knowledge Gaps
- **44 isolated node(s):** `STATUSES`, `PRIORITIES`, `STATUS_LABEL`, `configPath`, `api` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `Request`, `HttpException`, `AuthContext`, `SegmentRepository`, `Config`, `ApiTokenRepository`, `ProjectRepository`, `TaskService.php`, `Token`, `TaskTagRepository`, `Uuid`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `TaskService` connect `Request` to `AuthContext`, `SegmentRepository`, `Database`, `Config`, `TaskService.php`, `TaskTagRepository`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Request` connect `Request` to `TaskService.php`, `Token`, `HttpException`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `STATUSES`, `PRIORITIES`, `STATUS_LABEL` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request` be split into smaller, more focused modules?**
  _Cohesion score 0.07245386192754613 - nodes in this community are weakly interconnected._
- **Should `h` be split into smaller, more focused modules?**
  _Cohesion score 0.10168350168350168 - nodes in this community are weakly interconnected._
- **Should `HttpException` be split into smaller, more focused modules?**
  _Cohesion score 0.10507246376811594 - nodes in this community are weakly interconnected._