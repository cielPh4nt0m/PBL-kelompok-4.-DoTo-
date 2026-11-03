<?php

declare(strict_types=1);

// Jalankan hanya pada database sementara: DB_NAME=doto_trigger_scratch php ...
require __DIR__ . '/../autoload.php';

use App\Auth\AuthContext;
use App\Config;
use App\Database;
use App\Http\ValidationException;
use App\Services\ProjectService;
use App\Services\SegmentService;
use App\Services\TaskService;
use App\Services\UserService;

Config::load(dirname(__DIR__));
if (!str_starts_with(Config::databaseName(), 'doto_trigger_scratch')) {
    throw new RuntimeException('Tes trigger hanya boleh memakai database doto_trigger_scratch*');
}

$pdo = Database::connection();
$passed = 0;
$check = static function (bool $condition, string $message) use (&$passed): void {
    if (!$condition) {
        throw new RuntimeException('GAGAL: ' . $message);
    }
    $passed++;
};
$one = static function (string $sql, array $params = []) use ($pdo): mixed {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchColumn();
};

$suffix = bin2hex(random_bytes(3));
$owner = UserService::register('owner' . $suffix, 'owner' . $suffix . '@example.test', 'test-pass');
$other = UserService::register('other' . $suffix, 'other' . $suffix . '@example.test', 'test-pass');
$project = ProjectService::createProject('T' . strtoupper($suffix), 'Tes Trigger', $owner['id']);
$segment = SegmentService::createSegment($project['id'], 'To Do');
$actor = new AuthContext($owner, 'web', null);

$check((int) $one("SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()") === 4,
    'tepat empat trigger terpasang');

$task = TaskService::createTask($project, $segment, ['title' => 'Tugas pertama'], $actor);
$check($task['seq'] === 1 && $task['displayId'] === $project['key'] . '-1',
    'trigger menghasilkan nomor tiket pertama');
$check((int) $one('SELECT next_seq FROM projects WHERE id = ?', [$project['id']]) === 2,
    'nomor proyek bertambah tepat sekali');
$check((int) $one("SELECT COUNT(*) FROM task_history WHERE task_id = ? AND action = 'created'", [$task['id']]) === 1,
    'riwayat pembuatan memakai ID hasil trigger');
try {
    TaskService::createTask($project, $segment, ['title' => 'Langsung selesai', 'status' => 'done'], $actor);
    throw new RuntimeException('GAGAL: tugas baru langsung done diterima');
} catch (ValidationException $e) {
    $check($e->statusCode === 400, 'tugas baru harus aktif sebelum diselesaikan');
}
$check((int) $one('SELECT next_seq FROM projects WHERE id = ?', [$project['id']]) === 2,
    'penolakan tidak menghabiskan nomor tiket');

$done = TaskService::updateTaskStatus($task, 'done', $actor);
$check((int) $one("SELECT COUNT(*) FROM task_history WHERE task_id = ? AND action = 'status_changed'", [$task['id']]) === 1,
    'API membuat tepat satu riwayat status');
$check($one("SELECT actor_user_id FROM task_history WHERE task_id = ? AND action = 'status_changed'", [$task['id']]) === $owner['id'],
    'trigger mencatat aktor API yang benar');
$check((int) $one('SELECT scheduled_for FROM task_archive_queue WHERE task_id = ?', [$task['id']])
    === $done['statusChangedAt'] + 72 * 3600000,
    'jadwal arsip berada di tabel lain dan memakai milidetik');
$check($done['archivedAt'] === null, 'jadwal tidak dianggap sebagai arsip yang sudah terjadi');

$pdo->prepare("UPDATE tasks SET status = 'todo' WHERE id = ?")->execute([$task['id']]);
$check($one('SELECT state FROM task_archive_queue WHERE task_id = ?', [$task['id']]) === 'cancelled',
    'reopen membatalkan jadwal');
$check((int) $one("SELECT COUNT(*) FROM v_task_history_detail WHERE task_id = ? AND actor_channel = 'sql'", [$task['id']]) === 1,
    'SQL langsung tetap muncul dalam view riwayat tanpa aktor palsu');

$pdo->prepare("UPDATE tasks SET status = 'done' WHERE id = ?")->execute([$task['id']]);
$pdo->prepare('UPDATE tasks SET archived_at = ? WHERE id = ?')
    ->execute([Database::nowMs(), $task['id']]);
$check($one('SELECT state FROM task_archive_queue WHERE task_id = ?', [$task['id']]) === 'archived',
    'arsip sebenarnya mengubah status antrean');

$second = TaskService::createTask($project, $segment, ['title' => 'Tugas kedua'], $actor);
$check($second['seq'] === 2 && $second['displayId'] === $project['key'] . '-2',
    'nomor tiket berikutnya tetap berurutan');

$hasMembers = (int) $one(
    "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_members'"
) === 1;
if ($hasMembers) {
    try {
        $pdo->prepare('UPDATE tasks SET assignee_id = ? WHERE id = ?')
            ->execute([$other['id'], $second['id']]);
        throw new RuntimeException('GAGAL: nonanggota diterima');
    } catch (PDOException $e) {
        $check($e->getCode() === '45000', 'penugasan nonanggota ditolak trigger');
    }
    $check((int) $one('SELECT COUNT(*) FROM task_assignment_history WHERE task_id = ?', [$second['id']]) === 0,
        'penugasan ditolak tanpa audit palsu');
    $pdo->prepare('INSERT INTO project_members (project_id, user_id, joined_at) VALUES (?, ?, ?)')
        ->execute([$project['id'], $other['id'], Database::nowMs()]);
}

TaskService::reassignTask(TaskService::getTaskByDisplayIdOrThrow($second['displayId']), $other['email'], $actor);
$check((int) $one('SELECT COUNT(*) FROM task_assignment_history WHERE task_id = ?', [$second['id']]) === 1,
    'penugasan sah dicatat di tabel lain');
try {
    $pdo->prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
        ->execute([$project['id'], $other['id']]);
    throw new RuntimeException('GAGAL: anggota dengan tugas dapat dihapus');
} catch (PDOException $e) {
    $check($e->getCode() === '23000', 'FK melindungi anggota yang masih memegang tugas');
}

echo $passed, " pemeriksaan integrasi trigger lulus\n";
