<?php

declare(strict_types=1);

namespace App\Repositories;

final class TaskRepository
{
    public static function findByDisplayId(\PDO $pdo, string $displayId): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE display_id = :display_id');
        $stmt->execute(['display_id' => $displayId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findById(\PDO $pdo, string $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO tasks
                (id, project_id, segment_id, seq, display_id, title, description, status, priority,
                 assignee_id, created_by, links, status_changed_at, archived_at, created_at, updated_at)
             VALUES
                (:id, :project_id, :segment_id, :seq, :display_id, :title, :description, :status, :priority,
                 :assignee_id, :created_by, :links, :status_changed_at, NULL, :created_at, :updated_at)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'project_id' => $row['project_id'],
            'segment_id' => $row['segment_id'],
            'seq' => $row['seq'],
            'display_id' => $row['display_id'],
            'title' => $row['title'],
            'description' => $row['description'] ?? null,
            'status' => $row['status'],
            'priority' => $row['priority'],
            'assignee_id' => $row['assignee_id'] ?? null,
            'created_by' => $row['created_by'],
            'links' => $row['links'] ?? null,
            'status_changed_at' => $row['status_changed_at'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ]);
    }

    public static function updateStatus(\PDO $pdo, string $id, string $status, int $statusChangedAt, int $updatedAt): void
    {
        $stmt = $pdo->prepare(
            'UPDATE tasks SET status = :status, status_changed_at = :status_changed_at, updated_at = :updated_at WHERE id = :id'
        );
        $stmt->execute([
            'status' => $status,
            'status_changed_at' => $statusChangedAt,
            'updated_at' => $updatedAt,
            'id' => $id,
        ]);
    }

    public static function updatePriority(\PDO $pdo, string $id, string $priority, int $updatedAt): void
    {
        $stmt = $pdo->prepare('UPDATE tasks SET priority = :priority, updated_at = :updated_at WHERE id = :id');
        $stmt->execute(['priority' => $priority, 'updated_at' => $updatedAt, 'id' => $id]);
    }

    public static function updateAssignee(\PDO $pdo, string $id, string $assigneeId, int $updatedAt): void
    {
        $stmt = $pdo->prepare('UPDATE tasks SET assignee_id = :assignee_id, updated_at = :updated_at WHERE id = :id');
        $stmt->execute(['assignee_id' => $assigneeId, 'updated_at' => $updatedAt, 'id' => $id]);
    }

    /**
     * @param array<string,mixed> $columns snake_case column => value
     */
    public static function updateFields(\PDO $pdo, string $id, array $columns, int $updatedAt): void
    {
        $columns['updated_at'] = $updatedAt;

        $assignments = [];
        $params = ['id' => $id];
        foreach ($columns as $column => $value) {
            $assignments[] = "$column = :$column";
            $params[$column] = $value;
        }

        $sql = 'UPDATE tasks SET ' . implode(', ', $assignments) . ' WHERE id = :id';
        $pdo->prepare($sql)->execute($params);
    }

    public static function findBySegment(\PDO $pdo, string $segmentId, bool $includeArchived): array
    {
        $sql = 'SELECT * FROM tasks WHERE segment_id = :segment_id';
        if (!$includeArchived) {
            $sql .= ' AND archived_at IS NULL';
        }
        $sql .= ' ORDER BY created_at ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['segment_id' => $segmentId]);
        return $stmt->fetchAll();
    }

    /**
     * @param array{q?:?string,projectId?:?string,status?:?string,assigneeId?:?string,includeArchived:bool} $filters
     */
    public static function search(\PDO $pdo, array $filters): array
    {
        $conditions = [];
        $params = [];

        if (!$filters['includeArchived']) {
            $conditions[] = 'archived_at IS NULL';
        }
        if (!empty($filters['projectId'])) {
            $conditions[] = 'project_id = :project_id';
            $params['project_id'] = $filters['projectId'];
        }
        if (!empty($filters['status'])) {
            $conditions[] = 'status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['assigneeId'])) {
            $conditions[] = 'assignee_id = :assignee_id';
            $params['assignee_id'] = $filters['assigneeId'];
        }
        if (!empty($filters['q'])) {
            // Placeholder bernama tidak boleh dipakai dua kali di prepared statement asli MySQL.
            $conditions[] = '(title LIKE :q1 OR description LIKE :q2)';
            $params['q1'] = $params['q2'] = '%' . $filters['q'] . '%';
        }

        $sql = 'SELECT * FROM tasks';
        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function archiveEligible(\PDO $pdo, string $projectId, int $cutoffMs): array
    {
        $stmt = $pdo->prepare(
            "SELECT * FROM tasks
             WHERE project_id = :project_id
               AND status = 'done'
               AND archived_at IS NULL
               AND status_changed_at < :cutoff"
        );
        $stmt->execute(['project_id' => $projectId, 'cutoff' => $cutoffMs]);
        return $stmt->fetchAll();
    }

    /**
     * Mengembalikan false kalau tugas sudah diarsipkan request lain lebih dulu
     * (board yang dibuka bersamaan bisa menjalankan archive paralel).
     */
    public static function markArchived(\PDO $pdo, string $id, int $archivedAt): bool
    {
        $stmt = $pdo->prepare('UPDATE tasks SET archived_at = :archived_at WHERE id = :id AND archived_at IS NULL');
        $stmt->execute(['archived_at' => $archivedAt, 'id' => $id]);
        return $stmt->rowCount() === 1;
    }
}
