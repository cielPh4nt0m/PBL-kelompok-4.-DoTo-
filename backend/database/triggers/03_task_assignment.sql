CREATE TRIGGER trg_validate_task_assignment
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NOT (OLD.project_id <=> NEW.project_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pemindahan proyek tidak didukung';
    END IF;
    IF NOT (OLD.id <=> NEW.id) OR NOT (OLD.seq <=> NEW.seq)
       OR NOT (OLD.display_id <=> NEW.display_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ID dan nomor tiket tidak boleh diubah manual';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM segments
        WHERE id = NEW.segment_id AND project_id = NEW.project_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Segment bukan bagian dari proyek';
    END IF;
    IF NEW.assignee_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = NEW.project_id AND user_id = NEW.assignee_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assignee bukan anggota proyek';
    END IF;

    IF NOT (OLD.assignee_id <=> NEW.assignee_id) THEN
        INSERT INTO task_assignment_history
            (task_id, old_assignee_id, new_assignee_id, created_at)
        VALUES
            (OLD.id, OLD.assignee_id, NEW.assignee_id,
             CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED));
    END IF;
END
