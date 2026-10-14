# Desain Database DoTo

Dokumen ini berisi desain data DoTo dalam dua tingkat: **CDM** (Conceptual Data Model) dan **PDM** (Physical Data Model). Sumber kebenarannya tetap [`backend/database/schema.sql`](../backend/database/schema.sql); kalau skema berubah, perbarui juga dokumen ini.

Konvensi umum:

- Semua ID berupa UUID v4 yang disimpan sebagai `CHAR(36)`.
- Semua timestamp berupa milidetik sejak epoch yang disimpan sebagai `BIGINT`.
- DBMS: MySQL/MariaDB, engine InnoDB, charset `utf8mb4`.
- Versi PostgreSQL (tidak dipakai aplikasi, untuk tugas basis data) ada di [`backend/database/schema-postgres.sql`](../backend/database/schema-postgres.sql), lengkap dengan view, function/procedure, dan data dummy.

## CDM (Conceptual Data Model)

CDM menggambarkan entitas, atribut, dan hubungan antarentitas tanpa detail implementasi (tanpa foreign key dan tipe data fisik).

```mermaid
erDiagram
    USER ||--o{ API_TOKEN : "memiliki"
    USER ||--o{ PROJECT : "membuat"
    PROJECT ||--o{ SEGMENT : "terdiri dari"
    PROJECT ||--o{ TASK : "berisi"
    SEGMENT ||--o{ TASK : "mengelompokkan"
    USER ||--o{ TASK : "membuat"
    USER |o--o{ TASK : "ditugaskan ke"
    TASK ||--o{ TASK_TAG : "diberi label"
    TASK ||--o{ TASK_HISTORY : "tercatat di"
    USER ||--o{ TASK_HISTORY : "melakukan"

    USER {
        identifier id PK
        string username UK
        string email UK
        string name
        string password_hash
        datetime created_at
    }
    API_TOKEN {
        identifier id PK
        string token_hash UK
        string label
        datetime created_at
        datetime last_used_at
        datetime revoked_at
    }
    PROJECT {
        identifier id PK
        string key UK
        string name
        integer next_seq
        integer archive_after_hours
        datetime created_at
    }
    SEGMENT {
        identifier id PK
        string name
        integer position
        datetime created_at
    }
    TASK {
        identifier id PK
        integer seq
        string display_id UK
        string title
        text description
        string status
        string priority
        text links
        datetime status_changed_at
        datetime archived_at
        datetime created_at
        datetime updated_at
    }
    TASK_TAG {
        string label
    }
    TASK_HISTORY {
        identifier id PK
        string actor_channel
        string agent_name
        string action
        string field_name
        text old_value
        text new_value
        text comment
        datetime created_at
    }
```

Versi gambar: [PNG](img/cdm.png) · [SVG](img/cdm.svg)

| Entitas | Keterangan |
|---|---|
| USER | Pengguna DoTo. Login web memakai username/email + password. |
| API_TOKEN | Token untuk akses lewat CLI dan MCP server. Satu user bisa punya banyak token; token bisa dicabut (`revoked_at`). |
| PROJECT | Proyek dengan kode unik (mis. `WEB`). `next_seq` dipakai untuk membuat nomor tugas berikutnya. |
| SEGMENT | Kolom board di dalam proyek. Nama segment unik per proyek. |
| TASK | Tugas dengan ID tampilan `KEY-n` (mis. `WEB-1`), status, prioritas, assignee opsional. |
| TASK_TAG | Label/tag pada tugas. Entitas lemah: hanya ada sebagai bagian dari TASK. |
| TASK_HISTORY | Riwayat perubahan dan komentar pada tugas, termasuk dari mana perubahan datang (web, CLI, atau agent AI). |

Kardinalitas:

| Relasi | Kardinalitas | Keterangan |
|---|---|---|
| USER memiliki API_TOKEN | 1 : 0..N | |
| USER membuat PROJECT | 1 : 0..N | |
| PROJECT terdiri dari SEGMENT | 1 : 0..N | |
| PROJECT berisi TASK | 1 : 0..N | |
| SEGMENT mengelompokkan TASK | 1 : 0..N | Setiap tugas wajib berada di satu segment. |
| USER membuat TASK | 1 : 0..N | Pembuat tugas wajib ada. |
| USER ditugaskan ke TASK | 0..1 : 0..N | Tugas boleh belum punya assignee. |
| TASK diberi label TASK_TAG | 1 : 0..N | Label unik per tugas. |
| TASK tercatat di TASK_HISTORY | 1 : 0..N | |
| USER melakukan TASK_HISTORY | 1 : 0..N | User pemilik sesi/token yang melakukan aksi. |

## PDM (Physical Data Model)

PDM menggambarkan tabel fisik sesuai `schema.sql`, lengkap dengan tipe data, primary key, foreign key, dan unique key.

```mermaid
erDiagram
    users ||--o{ api_tokens : "user_id"
    users ||--o{ projects : "created_by"
    projects ||--o{ segments : "project_id"
    projects ||--o{ tasks : "project_id"
    segments ||--o{ tasks : "segment_id"
    users |o--o{ tasks : "assignee_id"
    users ||--o{ tasks : "created_by"
    tasks ||--o{ task_tags : "task_id"
    tasks ||--o{ task_history : "task_id"
    users ||--o{ task_history : "actor_user_id"

    users {
        CHAR(36) id PK
        VARCHAR(32) username UK
        VARCHAR(255) email UK
        VARCHAR(255) name
        VARCHAR(255) password_hash "NULL"
        BIGINT created_at
    }
    api_tokens {
        CHAR(36) id PK
        CHAR(36) user_id FK
        CHAR(64) token_hash UK
        VARCHAR(255) label
        BIGINT created_at
        BIGINT last_used_at "NULL"
        BIGINT revoked_at "NULL"
    }
    projects {
        CHAR(36) id PK
        VARCHAR(10) key UK
        VARCHAR(255) name
        INT next_seq "DEFAULT 1"
        INT archive_after_hours "DEFAULT 72"
        CHAR(36) created_by FK
        BIGINT created_at
    }
    segments {
        CHAR(36) id PK
        CHAR(36) project_id FK, UK "UK (project_id, name)"
        VARCHAR(100) name UK
        INT position
        BIGINT created_at
    }
    tasks {
        CHAR(36) id PK
        CHAR(36) project_id FK, UK "UK (project_id, seq)"
        CHAR(36) segment_id FK
        INT seq UK
        VARCHAR(32) display_id UK
        VARCHAR(500) title
        TEXT description "NULL"
        VARCHAR(20) status "DEFAULT 'idea'"
        VARCHAR(10) priority "DEFAULT 'medium'"
        CHAR(36) assignee_id FK "NULL"
        CHAR(36) created_by FK
        TEXT links "NULL"
        BIGINT status_changed_at
        BIGINT archived_at "NULL"
        BIGINT created_at
        BIGINT updated_at
    }
    task_tags {
        CHAR(36) task_id FK, UK "UK (task_id, label)"
        VARCHAR(100) label UK
    }
    task_history {
        CHAR(36) id PK
        CHAR(36) task_id FK
        CHAR(36) actor_user_id FK
        VARCHAR(10) actor_channel
        VARCHAR(100) agent_name "NULL"
        VARCHAR(30) action
        VARCHAR(50) field_name "NULL"
        TEXT old_value "NULL"
        TEXT new_value "NULL"
        TEXT comment "NULL"
        BIGINT created_at
    }
```

Versi gambar: [PNG](img/pdm.png) · [SVG](img/pdm.svg)

Kolom tanpa keterangan `NULL` bersifat `NOT NULL`.

### Constraint dan index

| Tabel | Nama | Jenis | Kolom | Referensi |
|---|---|---|---|---|
| users | `users_username_unique` | UNIQUE | `username` | |
| users | `users_email_unique` | UNIQUE | `email` | |
| api_tokens | `api_tokens_token_hash_unique` | UNIQUE | `token_hash` | |
| api_tokens | `api_tokens_user_idx` | INDEX | `user_id` | |
| api_tokens | `api_tokens_user_fk` | FK | `user_id` | `users(id)` |
| projects | `projects_key_unique` | UNIQUE | `key` | |
| projects | `projects_created_by_fk` | FK | `created_by` | `users(id)` |
| segments | `segments_project_id_name_unique` | UNIQUE | `project_id, name` | |
| segments | `segments_project_fk` | FK | `project_id` | `projects(id)` |
| tasks | `tasks_display_id_unique` | UNIQUE | `display_id` | |
| tasks | `tasks_project_id_seq_unique` | UNIQUE | `project_id, seq` | |
| tasks | `tasks_board_idx` | INDEX | `project_id, segment_id, status` | |
| tasks | `tasks_project_fk` | FK | `project_id` | `projects(id)` |
| tasks | `tasks_segment_fk` | FK | `segment_id` | `segments(id)` |
| tasks | `tasks_assignee_fk` | FK | `assignee_id` | `users(id)` |
| tasks | `tasks_created_by_fk` | FK | `created_by` | `users(id)` |
| task_tags | `task_tags_task_id_label_unique` | UNIQUE | `task_id, label` | |
| task_tags | `task_tags_task_fk` | FK | `task_id` | `tasks(id)` |
| task_history | `task_history_task_idx` | INDEX | `task_id, created_at` | |
| task_history | `task_history_task_fk` | FK | `task_id` | `tasks(id)` |
| task_history | `task_history_actor_fk` | FK | `actor_user_id` | `users(id)` |

Catatan:

- `task_tags` tidak punya primary key; keunikan baris dijamin oleh unique key `(task_id, label)`.
- Semua foreign key memakai aksi default (`RESTRICT`), jadi baris induk tidak bisa dihapus selama masih direferensikan.
- `tasks.project_id` sebenarnya bisa diturunkan dari `segments.project_id`, tetapi disimpan langsung di `tasks` (denormalisasi) dan dipakai oleh unique key `(project_id, seq)` serta index board.

### Nilai enum

Beberapa kolom `VARCHAR` hanya menerima nilai tertentu. Validasinya dilakukan di aplikasi ([`backend/src/Support/Enums.php`](../backend/src/Support/Enums.php)), bukan di database.

| Kolom | Nilai yang valid | Default |
|---|---|---|
| `tasks.status` | `idea`, `todo`, `in_progress`, `needs_review`, `done` | `idea` |
| `tasks.priority` | `low`, `medium`, `high`, `urgent` | `medium` |
| `task_history.actor_channel` | `web`, `cli`, `agent` | |
| `task_history.action` | `created`, `status_changed`, `priority_changed`, `assignee_changed`, `segment_changed`, `field_updated`, `comment`, `archived` | |

## View

View didefinisikan di bagian akhir `schema.sql` dengan `CREATE OR REPLACE VIEW`, jadi ikut dibuat ulang setiap kali `migrate.php` dijalankan.

| View | Sumber | Kolom tambahan | Dipakai aplikasi |
|---|---|---|---|
| `v_task_detail` | `tasks` ⨝ `projects`, `segments`, `users` (pembuat), ⟕ `users` (assignee) | `project_key`, `project_name`, `segment_name`, `assignee_email`, `assignee_name`, `assignee_username`, `creator_username` | Ya: semua query baca di `TaskRepository` (detail, board, search) |
| `v_task_history_detail` | `task_history` ⨝ `tasks`, `users` (pelaku) | `task_display_id`, `actor_username`, `actor_name` | Ya: `TaskHistoryRepository::findByTaskId` dan komentar baru |
| `v_project_summary` | `projects` ⟕ `tasks`, dikelompokkan per proyek | `segment_count`, `total_tasks`, `idea_count`, `todo_count`, `in_progress_count`, `needs_review_count`, `done_count`, `archived_count` | Tidak, untuk laporan/rekap |
| `v_user_workload` | `users` ⟕ `tasks` aktif (belum `done`, belum diarsipkan) | `active_tasks`, jumlah per status, `high_priority_count` (`high` + `urgent`) | Tidak, untuk laporan/rekap |

Catatan:

- `v_task_detail` dan `v_task_history_detail` sengaja tidak memakai agregat atau subquery, supaya MySQL/MariaDB bisa melebur (MERGE) view ke query pemanggil dan index tabel asli tetap dipakai. Karena itu tag tidak ikut di view; tag tetap diambil dari `task_tags`.
- Penulisan data (`INSERT`/`UPDATE`) tetap langsung ke tabel, bukan lewat view.
- Kolom hitungan di `v_project_summary` dan `v_user_workload` hanya menghitung tugas yang belum diarsipkan, kecuali `total_tasks` dan `archived_count`.

Contoh pemakaian:

```sql
SELECT display_id, title, status, segment_name, assignee_username
FROM v_task_detail
WHERE project_key = 'WEB' AND archived_at IS NULL;

SELECT * FROM v_project_summary;
SELECT * FROM v_user_workload ORDER BY active_tasks DESC;
```
