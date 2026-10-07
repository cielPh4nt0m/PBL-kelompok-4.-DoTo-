-- Skema database DoTo (MySQL/MariaDB). Idempoten: aman dijalankan berulang.
-- Semua ID berupa UUID v4, semua timestamp berupa milidetik sejak epoch.

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    created_at BIGINT NOT NULL,
    UNIQUE KEY users_username_unique (username),
    UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_tokens (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    last_used_at BIGINT NULL,
    revoked_at BIGINT NULL,
    UNIQUE KEY api_tokens_token_hash_unique (token_hash),
    KEY api_tokens_user_idx (user_id),
    CONSTRAINT api_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
    id CHAR(36) NOT NULL PRIMARY KEY,
    `key` VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    next_seq INT NOT NULL DEFAULT 1,
    archive_after_hours INT NOT NULL DEFAULT 72,
    created_by CHAR(36) NOT NULL,
    created_at BIGINT NOT NULL,
    UNIQUE KEY projects_key_unique (`key`),
    CONSTRAINT projects_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS segments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL,
    created_at BIGINT NOT NULL,
    UNIQUE KEY segments_project_id_name_unique (project_id, name),
    CONSTRAINT segments_project_fk FOREIGN KEY (project_id) REFERENCES projects (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
    id CHAR(36) NOT NULL PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    segment_id CHAR(36) NOT NULL,
    seq INT NOT NULL,
    display_id VARCHAR(32) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'idea',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    assignee_id CHAR(36) NULL,
    created_by CHAR(36) NOT NULL,
    links TEXT NULL,
    status_changed_at BIGINT NOT NULL,
    archived_at BIGINT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE KEY tasks_display_id_unique (display_id),
    UNIQUE KEY tasks_project_id_seq_unique (project_id, seq),
    KEY tasks_board_idx (project_id, segment_id, status),
    CONSTRAINT tasks_project_fk FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT tasks_segment_fk FOREIGN KEY (segment_id) REFERENCES segments (id),
    CONSTRAINT tasks_assignee_fk FOREIGN KEY (assignee_id) REFERENCES users (id),
    CONSTRAINT tasks_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_tags (
    task_id CHAR(36) NOT NULL,
    label VARCHAR(100) NOT NULL,
    UNIQUE KEY task_tags_task_id_label_unique (task_id, label),
    CONSTRAINT task_tags_task_fk FOREIGN KEY (task_id) REFERENCES tasks (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_history (
    id CHAR(36) NOT NULL PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    actor_user_id CHAR(36) NOT NULL,
    actor_channel VARCHAR(10) NOT NULL,
    agent_name VARCHAR(100) NULL,
    action VARCHAR(30) NOT NULL,
    field_name VARCHAR(50) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    comment TEXT NULL,
    created_at BIGINT NOT NULL,
    KEY task_history_task_idx (task_id, created_at),
    CONSTRAINT task_history_task_fk FOREIGN KEY (task_id) REFERENCES tasks (id),
    CONSTRAINT task_history_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
