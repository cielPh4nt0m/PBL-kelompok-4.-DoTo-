<?php

declare(strict_types=1);

// Terapkan skema dan empat trigger ke database. Aman dijalankan berulang.
//   php -d extension=pdo_mysql backend/database/migrate.php

require __DIR__ . '/../autoload.php';

use App\Config;
use App\Database;

Config::load(dirname(__DIR__));

$sql = file_get_contents(__DIR__ . '/schema.sql');
if ($sql === false) {
    fwrite(STDERR, "Gagal membaca schema.sql\n");
    exit(1);
}

// Hapus komentar baris, lalu jalankan per statement.
$sql = preg_replace('/^\s*--.*$/m', '', $sql);
$pdo = Database::connection();
foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
    $pdo->exec($statement);
}

// Data lama mempunyai aktor wajib. Audit dari SQL langsung tidak boleh menebak
// identitas pengguna, sehingga aktor pada riwayat baru boleh NULL.
$actorColumn = $pdo->query(
    "SELECT IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_history'
       AND COLUMN_NAME = 'actor_user_id'"
)->fetchColumn();
if ($actorColumn === 'NO') {
    $pdo->exec('ALTER TABLE task_history MODIFY actor_user_id CHAR(36) NULL');
}

// Backfill hanya sekali. Penghapusan anggota yang sah tidak boleh dibatalkan
// diam-diam ketika migrasi dijalankan ulang.
$pdo->exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(80) NOT NULL PRIMARY KEY,
        applied_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
$backfillDone = $pdo->query(
    "SELECT 1 FROM schema_migrations WHERE version = 'project_members_backfill_v1'"
)->fetchColumn();
if ($backfillDone === false) {
    $pdo->exec(
        'INSERT IGNORE INTO project_members (project_id, user_id, joined_at)
         SELECT id, created_by, created_at FROM projects'
    );
    $pdo->exec(
        'INSERT IGNORE INTO project_members (project_id, user_id, joined_at)
         SELECT project_id, created_by, created_at FROM tasks'
    );
    $pdo->exec(
        'INSERT IGNORE INTO project_members (project_id, user_id, joined_at)
         SELECT project_id, assignee_id, created_at FROM tasks WHERE assignee_id IS NOT NULL'
    );
    $pdo->prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        ->execute(['project_members_backfill_v1', Database::nowMs()]);
}

// FK gabungan menjaga keanggotaan tetap valid saat anggota dihapus langsung
// lewat SQL. Data lama sudah didaftarkan di atas sebelum constraint ditambah.
$memberIndex = $pdo->query(
    "SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks'
       AND INDEX_NAME = 'tasks_assignee_member_idx'"
)->fetchColumn();
if ((int) $memberIndex === 0) {
    $pdo->exec('ALTER TABLE tasks ADD KEY tasks_assignee_member_idx (project_id, assignee_id)');
}
$memberFk = $pdo->query(
    "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks'
       AND CONSTRAINT_NAME = 'tasks_assignee_member_fk'"
)->fetchColumn();
if ((int) $memberFk === 0) {
    $pdo->exec(
        'ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_member_fk
         FOREIGN KEY (project_id, assignee_id) REFERENCES project_members (project_id, user_id)'
    );
}

// Tugas done yang sudah ada mendapat jadwal tanpa mengubah archived_at.
$pdo->exec(
    "INSERT INTO task_archive_queue (task_id, scheduled_for, state, updated_at)
     SELECT t.id, t.status_changed_at + p.archive_after_hours * 3600000,
            'scheduled', t.updated_at
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN task_archive_queue q ON q.task_id = t.id
     WHERE t.status = 'done' AND t.archived_at IS NULL AND q.task_id IS NULL"
);

// DELIMITER hanya sintaks klien mysql; PDO mengeksekusi tiap CREATE TRIGGER
// sebagai satu statement utuh, termasuk titik koma dalam blok BEGIN/END.
$triggerFiles = glob(__DIR__ . '/triggers/*.sql') ?: [];
if (count($triggerFiles) !== 4) {
    throw new RuntimeException('Migrasi membutuhkan tepat empat file trigger');
}
foreach ($triggerFiles as $file) {
    $triggerSql = trim((string) file_get_contents($file));
    if (!preg_match('/^CREATE TRIGGER\s+([a-z][a-z0-9_]*)\b/i', $triggerSql, $match)) {
        throw new RuntimeException('File trigger tidak valid: ' . basename($file));
    }
    $pdo->exec('DROP TRIGGER IF EXISTS `' . $match[1] . '`');
    $pdo->exec($triggerSql);
}

echo 'Migrasi selesai ke database ' . Config::databaseName() . "\n";
