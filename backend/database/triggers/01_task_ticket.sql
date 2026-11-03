CREATE TRIGGER trg_generate_task_display_id
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
    DECLARE v_key VARCHAR(10) DEFAULT NULL;
    DECLARE v_seq INT;

    SELECT `key`, next_seq INTO v_key, v_seq
    FROM projects WHERE id = NEW.project_id FOR UPDATE;

    IF v_key IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Proyek tidak ditemukan';
    END IF;
    IF NEW.status = 'done' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Buat tugas aktif dahulu; selesaikan melalui UPDATE status';
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

    SET NEW.seq = v_seq;
    SET NEW.display_id = CONCAT(v_key, '-', v_seq);
    UPDATE projects SET next_seq = next_seq + 1 WHERE id = NEW.project_id;
END
