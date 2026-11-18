CREATE TRIGGER trg_log_task_status_change
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NOT (OLD.status <=> NEW.status) THEN
        INSERT INTO task_history
            (id, task_id, actor_user_id, actor_channel, agent_name, action,
             field_name, old_value, new_value, created_at)
        VALUES
            (UUID(), NEW.id, @doto_actor_user_id,
             COALESCE(NULLIF(@doto_actor_channel, ''), 'sql'),
             @doto_agent_name, 'status_changed', 'status', OLD.status,
             NEW.status, NEW.status_changed_at);
    END IF;
END
