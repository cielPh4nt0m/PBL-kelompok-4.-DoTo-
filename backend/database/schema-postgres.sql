-- Skema database DoTo versi PostgreSQL (13+), hasil port dari schema.sql.
-- Aplikasi DoTo tetap memakai schema.sql (MySQL/MariaDB). File ini untuk kebutuhan
-- tugas basis data; kalau schema.sql berubah, perbarui juga file ini.
--
-- Cara pakai:
--   createdb doto
--   psql -d doto -f backend/database/schema-postgres.sql
--
-- Idempoten: aman dijalankan berulang. Semua ID berupa UUID, semua timestamp berupa
-- milidetik sejak epoch (BIGINT), sama seperti versi MySQL.
--
-- Perbedaan dari schema.sql:
--   * ID memakai tipe native UUID (MySQL: CHAR(36)).
--   * Nilai status, priority, actor_channel, dan action dijaga dengan CHECK; di versi
--     MySQL validasinya ada di aplikasi (backend/src/Support/Enums.php).
--   * task_tags memakai PRIMARY KEY (task_id, label); di MySQL hanya UNIQUE.
--   * Ada function/procedure create_project, create_task, update_task_status, dan
--     add_comment yang meniru logika TaskService/ProjectService.


-- =====================================================================
-- A. Tabel
-- =====================================================================

-- Waktu sekarang dalam milidetik sejak epoch, setara Database::nowMs() di aplikasi.
CREATE OR REPLACE FUNCTION now_ms() RETURNS BIGINT
LANGUAGE sql VOLATILE
AS $$ SELECT (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    created_at BIGINT NOT NULL DEFAULT now_ms(),
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash CHAR(64) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL DEFAULT now_ms(),
    last_used_at BIGINT NULL,
    revoked_at BIGINT NULL,
    CONSTRAINT api_tokens_token_hash_unique UNIQUE (token_hash),
    CONSTRAINT api_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE INDEX IF NOT EXISTS api_tokens_user_idx ON api_tokens (user_id);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    next_seq INT NOT NULL DEFAULT 1,
    archive_after_hours INT NOT NULL DEFAULT 72,
    created_by UUID NOT NULL,
    created_at BIGINT NOT NULL DEFAULT now_ms(),
    CONSTRAINT projects_key_unique UNIQUE ("key"),
    CONSTRAINT projects_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT now_ms(),
    CONSTRAINT segments_project_id_name_unique UNIQUE (project_id, name),
    CONSTRAINT segments_project_fk FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    segment_id UUID NOT NULL,
    seq INT NOT NULL,
    display_id VARCHAR(32) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'idea',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    assignee_id UUID NULL,
    created_by UUID NOT NULL,
    links TEXT NULL,
    status_changed_at BIGINT NOT NULL DEFAULT now_ms(),
    archived_at BIGINT NULL,
    created_at BIGINT NOT NULL DEFAULT now_ms(),
    updated_at BIGINT NOT NULL DEFAULT now_ms(),
    CONSTRAINT tasks_display_id_unique UNIQUE (display_id),
    CONSTRAINT tasks_project_id_seq_unique UNIQUE (project_id, seq),
    CONSTRAINT tasks_status_check CHECK (status IN ('idea', 'todo', 'in_progress', 'needs_review', 'done')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT tasks_project_fk FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT tasks_segment_fk FOREIGN KEY (segment_id) REFERENCES segments (id),
    CONSTRAINT tasks_assignee_fk FOREIGN KEY (assignee_id) REFERENCES users (id),
    CONSTRAINT tasks_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id)
);
CREATE INDEX IF NOT EXISTS tasks_board_idx ON tasks (project_id, segment_id, status);

CREATE TABLE IF NOT EXISTS task_tags (
    task_id UUID NOT NULL,
    label VARCHAR(100) NOT NULL,
    CONSTRAINT task_tags_pkey PRIMARY KEY (task_id, label),
    CONSTRAINT task_tags_task_fk FOREIGN KEY (task_id) REFERENCES tasks (id)
);

CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    actor_user_id UUID NOT NULL,
    actor_channel VARCHAR(10) NOT NULL,
    agent_name VARCHAR(100) NULL,
    action VARCHAR(30) NOT NULL,
    field_name VARCHAR(50) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    comment TEXT NULL,
    created_at BIGINT NOT NULL DEFAULT now_ms(),
    CONSTRAINT task_history_actor_channel_check CHECK (actor_channel IN ('web', 'cli', 'agent')),
    CONSTRAINT task_history_action_check CHECK (action IN (
        'created', 'status_changed', 'priority_changed', 'assignee_changed',
        'segment_changed', 'field_updated', 'comment', 'archived'
    )),
    CONSTRAINT task_history_task_fk FOREIGN KEY (task_id) REFERENCES tasks (id),
    CONSTRAINT task_history_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users (id)
);
CREATE INDEX IF NOT EXISTS task_history_task_idx ON task_history (task_id, created_at);


-- =====================================================================
-- B. View (sama dengan view di schema.sql)
-- =====================================================================

-- Tugas lengkap dengan proyek, segment, assignee, dan pembuat.
CREATE OR REPLACE VIEW v_task_detail AS
SELECT
    t.*,
    p."key" AS project_key,
    p.name AS project_name,
    s.name AS segment_name,
    a.email AS assignee_email,
    a.name AS assignee_name,
    a.username AS assignee_username,
    c.username AS creator_username
FROM tasks t
JOIN projects p ON p.id = t.project_id
JOIN segments s ON s.id = t.segment_id
JOIN users c ON c.id = t.created_by
LEFT JOIN users a ON a.id = t.assignee_id;

-- Riwayat tugas dengan display_id tugas dan user pelakunya.
CREATE OR REPLACE VIEW v_task_history_detail AS
SELECT
    h.*,
    t.display_id AS task_display_id,
    u.username AS actor_username,
    u.name AS actor_name
FROM task_history h
JOIN tasks t ON t.id = h.task_id
JOIN users u ON u.id = h.actor_user_id;

-- Ringkasan per proyek: jumlah segment dan tugas aktif per status.
CREATE OR REPLACE VIEW v_project_summary AS
SELECT
    p.id,
    p."key" AS project_key,
    p.name AS project_name,
    (SELECT COUNT(*) FROM segments s WHERE s.project_id = p.id) AS segment_count,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.archived_at IS NULL AND t.status = 'idea') AS idea_count,
    COUNT(t.id) FILTER (WHERE t.archived_at IS NULL AND t.status = 'todo') AS todo_count,
    COUNT(t.id) FILTER (WHERE t.archived_at IS NULL AND t.status = 'in_progress') AS in_progress_count,
    COUNT(t.id) FILTER (WHERE t.archived_at IS NULL AND t.status = 'needs_review') AS needs_review_count,
    COUNT(t.id) FILTER (WHERE t.archived_at IS NULL AND t.status = 'done') AS done_count,
    COUNT(t.id) FILTER (WHERE t.archived_at IS NOT NULL) AS archived_count
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p."key", p.name;

-- Beban kerja per user: tugas yang ditugaskan, belum selesai, dan belum diarsipkan.
CREATE OR REPLACE VIEW v_user_workload AS
SELECT
    u.id,
    u.username,
    u.name,
    COUNT(t.id) AS active_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'idea') AS idea_count,
    COUNT(t.id) FILTER (WHERE t.status = 'todo') AS todo_count,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_count,
    COUNT(t.id) FILTER (WHERE t.status = 'needs_review') AS needs_review_count,
    COUNT(t.id) FILTER (WHERE t.priority IN ('high', 'urgent')) AS high_priority_count
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id AND t.archived_at IS NULL AND t.status <> 'done'
GROUP BY u.id, u.username, u.name;


-- =====================================================================
-- C. Function dan procedure
-- =====================================================================

-- Membuat proyek baru dan mengembalikan id-nya (ProjectService::createProject).
CREATE OR REPLACE FUNCTION create_project(
    p_key VARCHAR(10),
    p_name VARCHAR(255),
    p_created_by UUID
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM projects WHERE "key" = p_key) THEN
        RAISE EXCEPTION 'Proyek dengan key % sudah ada', p_key;
    END IF;

    INSERT INTO projects ("key", name, created_by)
    VALUES (p_key, p_name, p_created_by)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Membuat tugas baru dengan nomor otomatis (KEY-n), tag, dan riwayat 'created'.
-- Mengembalikan display_id (TaskService::createTask).
CREATE OR REPLACE FUNCTION create_task(
    p_project_key VARCHAR(10),
    p_segment_name VARCHAR(100),
    p_title VARCHAR(500),
    p_actor_user_id UUID,
    p_actor_channel VARCHAR(10) DEFAULT 'web',
    p_description TEXT DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'idea',
    p_priority VARCHAR(10) DEFAULT 'medium',
    p_assignee_id UUID DEFAULT NULL,
    p_tags VARCHAR(100)[] DEFAULT '{}'
) RETURNS VARCHAR(32)
LANGUAGE plpgsql
AS $$
DECLARE
    v_project projects%ROWTYPE;
    v_segment_id UUID;
    v_seq INT;
    v_display_id VARCHAR(32);
    v_task_id UUID;
    v_now BIGINT := now_ms();
BEGIN
    -- Kunci baris proyek supaya dua tugas yang dibuat bersamaan tidak dapat nomor sama.
    SELECT * INTO v_project FROM projects WHERE "key" = p_project_key FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proyek % tidak ditemukan', p_project_key;
    END IF;

    SELECT id INTO v_segment_id FROM segments
    WHERE project_id = v_project.id AND name = p_segment_name;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Segment % tidak ditemukan di proyek %', p_segment_name, p_project_key;
    END IF;

    v_seq := v_project.next_seq;
    v_display_id := v_project."key" || '-' || v_seq;
    UPDATE projects SET next_seq = next_seq + 1 WHERE id = v_project.id;

    -- Sama seperti aplikasi: tanpa assignee, tugas ditugaskan ke pembuatnya.
    INSERT INTO tasks (
        project_id, segment_id, seq, display_id, title, description, status, priority,
        assignee_id, created_by, status_changed_at, created_at, updated_at
    ) VALUES (
        v_project.id, v_segment_id, v_seq, v_display_id, p_title, p_description, p_status, p_priority,
        COALESCE(p_assignee_id, p_actor_user_id), p_actor_user_id, v_now, v_now, v_now
    )
    RETURNING id INTO v_task_id;

    INSERT INTO task_tags (task_id, label)
    SELECT DISTINCT v_task_id, tag FROM unnest(p_tags) AS tag;

    INSERT INTO task_history (task_id, actor_user_id, actor_channel, action, new_value, created_at)
    VALUES (v_task_id, p_actor_user_id, p_actor_channel, 'created', v_display_id, v_now);

    RETURN v_display_id;
END;
$$;

-- Mengubah status tugas dan mencatat riwayat 'status_changed' (TaskService::updateTaskStatus).
-- Tidak melakukan apa-apa kalau status sama.
CREATE OR REPLACE PROCEDURE update_task_status(
    p_display_id VARCHAR(32),
    p_status VARCHAR(20),
    p_actor_user_id UUID,
    p_actor_channel VARCHAR(10) DEFAULT 'web',
    p_agent_name VARCHAR(100) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_task_id UUID;
    v_old_status VARCHAR(20);
    v_now BIGINT := now_ms();
BEGIN
    SELECT id, status INTO v_task_id, v_old_status
    FROM tasks WHERE display_id = p_display_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tugas % tidak ditemukan', p_display_id;
    END IF;

    IF v_old_status = p_status THEN
        RETURN;
    END IF;

    UPDATE tasks
    SET status = p_status, status_changed_at = v_now, updated_at = v_now
    WHERE id = v_task_id;

    INSERT INTO task_history (
        task_id, actor_user_id, actor_channel, agent_name, action, field_name, old_value, new_value, created_at
    ) VALUES (
        v_task_id, p_actor_user_id, p_actor_channel, p_agent_name, 'status_changed', 'status', v_old_status, p_status, v_now
    );
END;
$$;

-- Menambahkan komentar ke tugas (TaskService::addComment).
CREATE OR REPLACE PROCEDURE add_comment(
    p_display_id VARCHAR(32),
    p_comment TEXT,
    p_actor_user_id UUID,
    p_actor_channel VARCHAR(10) DEFAULT 'web',
    p_agent_name VARCHAR(100) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_task_id UUID;
BEGIN
    SELECT id INTO v_task_id FROM tasks WHERE display_id = p_display_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tugas % tidak ditemukan', p_display_id;
    END IF;

    INSERT INTO task_history (task_id, actor_user_id, actor_channel, agent_name, action, comment)
    VALUES (v_task_id, p_actor_user_id, p_actor_channel, p_agent_name, 'comment', p_comment);
END;
$$;


-- =====================================================================
-- D. Data dummy (ON CONFLICT DO NOTHING supaya aman dijalankan ulang)
-- =====================================================================
-- password_hash dibiarkan NULL: akun dummy tidak bisa login lewat aplikasi.

INSERT INTO users (id, username, email, name) VALUES
    ('00000000-0000-4000-8000-000000000001', 'dilaa', 'dilaa@example.com', 'Dilaa'),
    ('00000000-0000-4000-8000-000000000002', 'budi', 'budi@example.com', 'Budi'),
    ('00000000-0000-4000-8000-000000000003', 'erhan', 'erhan@example.com', 'Erhan')
ON CONFLICT DO NOTHING;

INSERT INTO projects (id, "key", name, next_seq, created_by) VALUES
    ('00000000-0000-4000-8000-000000000101', 'WEB', 'Website DoTo', 4, '00000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO segments (id, project_id, name, position) VALUES
    ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 'Backend', 1),
    ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101', 'Frontend', 2)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, project_id, segment_id, seq, display_id, title, description, status, priority, assignee_id, created_by) VALUES
    ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201',
     1, 'WEB-1', 'Setup skema database', 'Membuat DDL untuk semua tabel', 'done', 'high',
     '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
    ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201',
     2, 'WEB-2', 'Endpoint login', NULL, 'in_progress', 'urgent',
     '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
    ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000202',
     3, 'WEB-3', 'Desain halaman board', 'Wireframe dan mockup', 'todo', 'medium',
     '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO task_tags (task_id, label) VALUES
    ('00000000-0000-4000-8000-000000000301', 'database'),
    ('00000000-0000-4000-8000-000000000302', 'backend'),
    ('00000000-0000-4000-8000-000000000302', 'auth'),
    ('00000000-0000-4000-8000-000000000303', 'frontend')
ON CONFLICT DO NOTHING;

INSERT INTO task_history (id, task_id, actor_user_id, actor_channel, action, field_name, old_value, new_value) VALUES
    ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001',
     'web', 'created', NULL, NULL, 'WEB-1'),
    ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000002',
     'cli', 'status_changed', 'status', 'idea', 'done')
ON CONFLICT DO NOTHING;

-- Contoh pemakaian:
--   SELECT create_task('WEB', 'Frontend', 'Halaman profil', '00000000-0000-4000-8000-000000000001',
--                      p_priority => 'high', p_tags => ARRAY['frontend', 'ui']);
--   CALL update_task_status('WEB-3', 'in_progress', '00000000-0000-4000-8000-000000000003');
--   CALL add_comment('WEB-2', 'Tinggal validasi input', '00000000-0000-4000-8000-000000000002', 'agent', 'claude');
--   SELECT * FROM v_task_detail WHERE project_key = 'WEB';
--   SELECT * FROM v_project_summary;
--   SELECT * FROM v_user_workload ORDER BY active_tasks DESC;
