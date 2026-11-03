CREATE TRIGGER trg_handle_task_completion
BEFORE UPDATE ON tasks
FOR EACH ROW FOLLOWS trg_validate_task_assignment
BEGIN
    DECLARE v_now BIGINT;
    DECLARE v_hours INT;

    SET v_now = CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED);

    IF NOT (OLD.status <=> NEW.status) THEN
        IF OLD.status_changed_at <=> NEW.status_changed_at THEN
            SET NEW.status_changed_at = v_now;
        END IF;
        IF OLD.updated_at <=> NEW.updated_at THEN
            SET NEW.updated_at = v_now;
        END IF;

        IF NEW.status = 'done' AND NEW.archived_at IS NULL THEN
            SELECT archive_after_hours INTO v_hours
            FROM projects WHERE id = NEW.project_id;
            INSERT INTO task_archive_queue (task_id, scheduled_for, state, updated_at)
            VALUES (OLD.id, NEW.status_changed_at + v_hours * 3600000, 'scheduled', v_now)
            ON DUPLICATE KEY UPDATE scheduled_for = VALUES(scheduled_for),
                state = 'scheduled', updated_at = VALUES(updated_at);
        ELSEIF OLD.status = 'done' THEN
            UPDATE task_archive_queue SET scheduled_for = NULL,
                state = 'cancelled', updated_at = v_now
            WHERE task_id = OLD.id;
        END IF;
    ELSEIF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
        UPDATE task_archive_queue SET state = 'archived', updated_at = v_now
        WHERE task_id = OLD.id;
    END IF;
END
