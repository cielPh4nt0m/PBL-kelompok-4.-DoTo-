<?php

declare(strict_types=1);

namespace App\Repositories;

final class ProjectMemberRepository
{
    public static function isMember(\PDO $pdo, string $projectId, string $userId): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?');
        $stmt->execute([$projectId, $userId]);
        return $stmt->fetchColumn() !== false;
    }

    public static function listByProject(\PDO $pdo, string $projectId): array
    {
        $stmt = $pdo->prepare(
            'SELECT u.id, u.username, u.email, u.name, m.joined_at
             FROM project_members m JOIN users u ON u.id = m.user_id
             WHERE m.project_id = ? ORDER BY m.joined_at, u.username'
        );
        $stmt->execute([$projectId]);
        return $stmt->fetchAll();
    }

    public static function add(\PDO $pdo, string $projectId, string $userId, int $joinedAt): void
    {
        $pdo->prepare('INSERT INTO project_members (project_id, user_id, joined_at) VALUES (?, ?, ?)')
            ->execute([$projectId, $userId, $joinedAt]);
    }

    public static function hasAssignedTasks(\PDO $pdo, string $projectId, string $userId): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM tasks WHERE project_id = ? AND assignee_id = ? LIMIT 1');
        $stmt->execute([$projectId, $userId]);
        return $stmt->fetchColumn() !== false;
    }

    public static function remove(\PDO $pdo, string $projectId, string $userId): void
    {
        $pdo->prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
            ->execute([$projectId, $userId]);
    }
}
